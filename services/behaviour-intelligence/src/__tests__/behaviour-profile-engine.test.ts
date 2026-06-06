/**
 * Unit tests for BehaviourProfileEngine.
 * Tests profile computation from raw trip data.
 * Source: BR-1201–BR-1208
 */

import { describe, it, expect } from 'vitest';
import { computeProfile } from '../engines/behaviour-profile-engine.js';
import type { ProfileEngineInput } from '../engines/types.js';

const TENANT = 'tenant-001';
const CORP = 'corp-001';
const TRAVELLER = 'trav-001';

function validInput(overrides: Partial<ProfileEngineInput> = {}): ProfileEngineInput {
  return {
    travellerId: TRAVELLER,
    tenantId: TENANT,
    corporateId: CORP,
    leadTimesPerTrip: [7, 5, 8, 6, 7, 5, 6, 7, 8, 6],
    bookingTimestamps: [],
    complianceFlags: [true, true, true, true, true, true, true, false, true, true],
    responseTimesHours: [4, 6, 3, 5, 4, 7, 3, 5, 4, 6],
    channelsUsed: [
      'email',
      'email',
      'sms',
      'email',
      'email',
      'email',
      'sms',
      'email',
      'email',
      'email',
    ],
    selfBookedCount: 7,
    totalTrips: 10,
    ...overrides,
  };
}

describe('BehaviourProfileEngine', () => {
  it('computes profile from single trip', () => {
    const result = computeProfile(
      validInput({
        leadTimesPerTrip: [5],
        complianceFlags: [true],
        responseTimesHours: [3],
        channelsUsed: ['email'],
        selfBookedCount: 1,
        totalTrips: 1,
      }),
    );
    expect(result.tripCountUsed).toBe(1);
    expect(result.avgLeadTimeDays).toBe(5);
    expect(result.complianceRate).toBe(100);
    expect(result.confidenceScore).toBe(10); // 1/10 * 100
  });

  it('computes profile from multiple trips', () => {
    const result = computeProfile(validInput());
    expect(result.tripCountUsed).toBe(10);
    expect(result.tripsAnalysed).toBe(10);
    expect(result.avgLeadTimeDays).toBeCloseTo(6.5, 0);
    expect(result.confidenceScore).toBe(100); // 10 trips = full
  });

  it('calculates average lead time correctly', () => {
    const result = computeProfile(
      validInput({
        leadTimesPerTrip: [10, 20, 30],
        totalTrips: 3,
        complianceFlags: [true, true, true],
        responseTimesHours: [5, 5, 5],
        selfBookedCount: 2,
      }),
    );
    expect(result.avgLeadTimeDays).toBe(20);
  });

  it('calculates booking variability (std dev)', () => {
    // All same = 0 variability
    const uniform = computeProfile(
      validInput({
        leadTimesPerTrip: [7, 7, 7, 7, 7],
        totalTrips: 5,
        complianceFlags: [true, true, true, true, true],
        responseTimesHours: [5, 5, 5, 5, 5],
        selfBookedCount: 3,
      }),
    );
    expect(uniform.bookingVariabilityDays).toBe(0);

    // Varied lead times = positive variability
    const varied = computeProfile(
      validInput({
        leadTimesPerTrip: [2, 10, 4, 12, 6],
        totalTrips: 5,
        complianceFlags: [true, true, true, true, true],
        responseTimesHours: [5, 5, 5, 5, 5],
        selfBookedCount: 3,
      }),
    );
    expect(varied.bookingVariabilityDays).toBeGreaterThan(0);
  });

  it('calculates booking consistency (inverse CV)', () => {
    // Uniform lead times = high consistency
    const uniform = computeProfile(
      validInput({
        leadTimesPerTrip: [7, 7, 7, 7, 7],
        totalTrips: 5,
        complianceFlags: [true, true, true, true, true],
        responseTimesHours: [5, 5, 5, 5, 5],
        selfBookedCount: 3,
      }),
    );
    expect(uniform.bookingConsistency).toBe(1);

    // Varied lead times = lower consistency
    const varied = computeProfile(
      validInput({
        leadTimesPerTrip: [1, 20, 3, 18, 2],
        totalTrips: 5,
        complianceFlags: [true, true, true, true, true],
        responseTimesHours: [5, 5, 5, 5, 5],
        selfBookedCount: 3,
      }),
    );
    expect(varied.bookingConsistency).toBeLessThan(0.5);
  });

  it('calculates compliance rate from flags', () => {
    const result = computeProfile(
      validInput({
        leadTimesPerTrip: [5, 5, 5, 5],
        complianceFlags: [true, false, true, false],
        responseTimesHours: [5, 5, 5, 5],
        totalTrips: 4,
        selfBookedCount: 2,
      }),
    );
    expect(result.complianceRate).toBe(50);
  });

  it('calculates self-booking rate', () => {
    const result = computeProfile(
      validInput({
        selfBookedCount: 8,
        totalTrips: 10,
      }),
    );
    expect(result.selfBookingRate).toBe(80);
  });

  it('determines preferred channel by frequency', () => {
    const emailDominant = computeProfile(
      validInput({
        channelsUsed: ['email', 'email', 'email', 'sms'],
      }),
    );
    expect(emailDominant.preferredChannel).toBe('email');

    const smsDominant = computeProfile(
      validInput({
        channelsUsed: ['sms', 'sms', 'sms', 'email'],
      }),
    );
    expect(smsDominant.preferredChannel).toBe('sms');
  });

  it('defaults preferred channel to email when none provided', () => {
    const result = computeProfile(validInput({ channelsUsed: [] }));
    expect(result.preferredChannel).toBe('email');
  });

  it('confidence increases with more trips (BR-1208)', () => {
    const threeTrips = computeProfile(
      validInput({
        leadTimesPerTrip: [5, 6, 7],
        complianceFlags: [true, true, true],
        responseTimesHours: [4, 5, 6],
        totalTrips: 3,
        selfBookedCount: 2,
      }),
    );
    const tenTrips = computeProfile(validInput());

    expect(threeTrips.confidenceScore).toBe(30);
    expect(tenTrips.confidenceScore).toBe(100);
    expect(tenTrips.confidenceScore).toBeGreaterThan(threeTrips.confidenceScore);
  });

  it('rejects empty travellerId', () => {
    expect(() => computeProfile(validInput({ travellerId: '' }))).toThrow(
      'travellerId is required',
    );
  });

  it('rejects zero totalTrips (BR-1201)', () => {
    expect(() =>
      computeProfile(
        validInput({
          totalTrips: 0,
          leadTimesPerTrip: [],
          complianceFlags: [],
          responseTimesHours: [],
          selfBookedCount: 0,
        }),
      ),
    ).toThrow();
  });

  it('applies sliding window via maxTripsUsed', () => {
    const result = computeProfile(
      validInput({
        leadTimesPerTrip: [100, 100, 100, 5, 5, 5],
        complianceFlags: [false, false, false, true, true, true],
        responseTimesHours: [50, 50, 50, 3, 3, 3],
        totalTrips: 6,
        selfBookedCount: 4,
        maxTripsUsed: 3, // only use last 3
      }),
    );
    expect(result.tripCountUsed).toBe(3);
    expect(result.avgLeadTimeDays).toBe(5);
    expect(result.complianceRate).toBe(100);
  });

  it('assigns self_sufficient segment for high self-booking + compliance + consistency', () => {
    const result = computeProfile(
      validInput({
        leadTimesPerTrip: [7, 7, 7, 7, 7, 7, 7, 7, 7, 7],
        complianceFlags: [true, true, true, true, true, true, true, true, true, true],
        responseTimesHours: [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
        selfBookedCount: 9,
        totalTrips: 10,
      }),
    );
    expect(result.segment).toBe('self_sufficient');
  });

  it('assigns non_compliant segment for low compliance', () => {
    const result = computeProfile(
      validInput({
        leadTimesPerTrip: [5, 5, 5, 5, 5],
        complianceFlags: [false, false, false, false, true],
        responseTimesHours: [48, 48, 48, 48, 48],
        selfBookedCount: 1,
        totalTrips: 5,
      }),
    );
    expect(result.segment).toBe('non_compliant');
  });
});

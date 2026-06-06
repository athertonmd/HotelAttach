/**
 * Unit tests for ArchetypeAssignmentEngine.
 * Tests archetype determination from profile metrics.
 * Source: BR-1301–BR-1309
 */

import { describe, it, expect } from 'vitest';
import { computeArchetype } from '../engines/archetype-assignment-engine.js';
import type { ArchetypeEngineInput } from '../engines/types.js';

const TENANT = 'tenant-001';
const CORP = 'corp-001';
const TRAVELLER = 'trav-001';

function validInput(overrides: Partial<ArchetypeEngineInput> = {}): ArchetypeEngineInput {
  return {
    travellerId: TRAVELLER,
    tenantId: TENANT,
    corporateId: CORP,
    avgLeadTimeDays: 7,
    bookingConsistency: 0.6,
    bookingVariabilityDays: 4,
    complianceRate: 75,
    avgResponseTimeHours: 8,
    preferredChannel: 'email',
    selfBookingRate: 50,
    tripsAnalysed: 10,
    tripCountUsed: 10,
    predictedLeadTimeDays: 6,
    segment: 'reliable_late',
    previousArchetype: null,
    ...overrides,
  };
}

describe('ArchetypeAssignmentEngine', () => {
  it('BR-1301: rejects tripCountUsed < 3', () => {
    expect(() => computeArchetype(validInput({ tripCountUsed: 2 }))).toThrow('BR-1301');
  });

  it('BR-1308: assigns new_traveller for < 5 trips', () => {
    const result = computeArchetype(validInput({ tripCountUsed: 4 }));
    expect(result.archetype).toBe('new_traveller');
    expect(result.confidence).toBe(50);
  });

  it('BR-1302: assigns autopilot for high consistency, high self-booking, fast response', () => {
    const result = computeArchetype(
      validInput({
        tripCountUsed: 10,
        bookingConsistency: 0.92,
        selfBookingRate: 90,
        avgResponseTimeHours: 2,
      }),
    );
    expect(result.archetype).toBe('autopilot');
    expect(result.confidence).toBeGreaterThan(80);
  });

  it('BR-1303: assigns procrastinator for late bookers with moderate consistency', () => {
    const result = computeArchetype(
      validInput({
        tripCountUsed: 10,
        avgLeadTimeDays: 2,
        bookingConsistency: 0.5,
        bookingVariabilityDays: 5,
        complianceRate: 60,
        selfBookingRate: 50,
        avgResponseTimeHours: 10,
      }),
    );
    expect(result.archetype).toBe('procrastinator');
  });

  it('BR-1304: assigns responsive for low variance, fast response, moderate self-booking', () => {
    const result = computeArchetype(
      validInput({
        tripCountUsed: 10,
        bookingVariabilityDays: 2,
        avgResponseTimeHours: 3,
        selfBookingRate: 60,
        bookingConsistency: 0.6,
        avgLeadTimeDays: 7,
        complianceRate: 70,
      }),
    );
    expect(result.archetype).toBe('responsive');
  });

  it('BR-1305: assigns nudge_needer for moderate consistency and self-booking', () => {
    const result = computeArchetype(
      validInput({
        tripCountUsed: 10,
        bookingConsistency: 0.55,
        selfBookingRate: 45,
        bookingVariabilityDays: 5,
        avgLeadTimeDays: 7,
        avgResponseTimeHours: 10,
        complianceRate: 70,
      }),
    );
    expect(result.archetype).toBe('nudge_needer');
  });

  it('BR-1306: assigns reluctant for low compliance, low self-booking, high response time', () => {
    const result = computeArchetype(
      validInput({
        tripCountUsed: 10,
        complianceRate: 30,
        selfBookingRate: 15,
        avgResponseTimeHours: 48,
        bookingVariabilityDays: 5,
        bookingConsistency: 0.5,
      }),
    );
    expect(result.archetype).toBe('reluctant');
  });

  it('BR-1307: assigns chaotic for high variability and low consistency', () => {
    const result = computeArchetype(
      validInput({
        tripCountUsed: 10,
        bookingVariabilityDays: 15,
        bookingConsistency: 0.2,
      }),
    );
    expect(result.archetype).toBe('chaotic');
  });

  it('carries forward previousArchetype and detects change', () => {
    const result = computeArchetype(
      validInput({
        tripCountUsed: 10,
        bookingVariabilityDays: 15,
        bookingConsistency: 0.2,
        previousArchetype: 'responsive',
      }),
    );
    expect(result.previousArchetype).toBe('responsive');
    expect(result.isChanged).toBe(true);
  });

  it('isChanged is false when archetype matches previous', () => {
    const result = computeArchetype(
      validInput({
        tripCountUsed: 4,
        previousArchetype: 'new_traveller',
      }),
    );
    expect(result.isChanged).toBe(false);
  });

  it('rejects empty travellerId', () => {
    expect(() => computeArchetype(validInput({ travellerId: '' }))).toThrow(
      'travellerId is required',
    );
  });

  it('confidence is clamped at 100', () => {
    const result = computeArchetype(
      validInput({
        tripCountUsed: 10,
        bookingConsistency: 0.99,
        selfBookingRate: 95,
        avgResponseTimeHours: 1,
      }),
    );
    expect(result.confidence).toBeLessThanOrEqual(100);
  });
});

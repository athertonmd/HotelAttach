/**
 * Unit tests for BehaviourDriftEngine.
 * Tests drift detection from current vs historical baseline.
 * Source: BR-1501–BR-1508
 */

import { describe, it, expect } from 'vitest';
import { computeDrift } from '../engines/behaviour-drift-engine.js';
import type { DriftEngineInput } from '../engines/types.js';

const TENANT = 'tenant-001';
const CORP = 'corp-001';
const TRAVELLER = 'trav-001';

const BASELINE = {
  avgLeadTimeDays: 7,
  bookingConsistency: 0.75,
  complianceRate: 80,
  selfBookingRate: 65,
  avgResponseTimeHours: 6,
};

function validInput(overrides: Partial<DriftEngineInput> = {}): DriftEngineInput {
  return {
    travellerId: TRAVELLER,
    tenantId: TENANT,
    corporateId: CORP,
    current: {
      avgLeadTimeDays: 7,
      bookingConsistency: 0.75,
      complianceRate: 80,
      selfBookingRate: 65,
      avgResponseTimeHours: 6,
      tripCountUsed: 10,
    },
    baseline: { ...BASELINE },
    ...overrides,
  };
}

describe('BehaviourDriftEngine', () => {
  it('BR-1503: stable when current matches baseline', () => {
    const result = computeDrift(validInput());
    expect(result.driftStatus).toBe('stable');
    expect(result.driftScore).toBe(0);
    expect(result.stabilityScore).toBe(100);
  });

  it('BR-1504: moderate when drift score 30–59', () => {
    const result = computeDrift(
      validInput({
        current: {
          avgLeadTimeDays: 14, // doubled
          bookingConsistency: 0.45, // dropped 0.3
          complianceRate: 80,
          selfBookingRate: 65,
          avgResponseTimeHours: 6,
          tripCountUsed: 10,
        },
      }),
    );
    expect(result.driftStatus).toBe('moderate');
    expect(result.driftScore).toBeGreaterThanOrEqual(30);
    expect(result.driftScore).toBeLessThan(60);
  });

  it('BR-1505: significant when drift score >= 60', () => {
    const result = computeDrift(
      validInput({
        current: {
          avgLeadTimeDays: 30,
          bookingConsistency: 0.1,
          complianceRate: 20,
          selfBookingRate: 10,
          avgResponseTimeHours: 48,
          tripCountUsed: 10,
        },
      }),
    );
    expect(result.driftStatus).toBe('significant');
    expect(result.driftScore).toBeGreaterThanOrEqual(60);
  });

  it('BR-1507: lead time contributes 30% weight', () => {
    // Only lead time changed: 7 → 14 (delta=7, norm=1.0, contribution=30)
    const result = computeDrift(
      validInput({
        current: {
          avgLeadTimeDays: 14,
          bookingConsistency: 0.75,
          complianceRate: 80,
          selfBookingRate: 65,
          avgResponseTimeHours: 6,
          tripCountUsed: 10,
        },
      }),
    );
    expect(result.driftScore).toBe(30);
  });

  it('BR-1507: consistency contributes 25% weight', () => {
    // Only consistency changed: 0.75 → 0 (delta=0.75, contribution=0.75*25=18.75→19)
    const result = computeDrift(
      validInput({
        current: {
          avgLeadTimeDays: 7,
          bookingConsistency: 0,
          complianceRate: 80,
          selfBookingRate: 65,
          avgResponseTimeHours: 6,
          tripCountUsed: 10,
        },
      }),
    );
    expect(result.driftScore).toBe(19);
  });

  it('BR-1507: compliance contributes 20% weight', () => {
    // compliance 80 → 0 (delta=80, norm=0.8, contribution=0.8*20=16)
    const result = computeDrift(
      validInput({
        current: {
          avgLeadTimeDays: 7,
          bookingConsistency: 0.75,
          complianceRate: 0,
          selfBookingRate: 65,
          avgResponseTimeHours: 6,
          tripCountUsed: 10,
        },
      }),
    );
    expect(result.driftScore).toBe(16);
  });

  it('BR-1507: self-booking contributes 15% weight', () => {
    // selfBooking 65 → 0 (delta=65, norm=0.65, contribution=0.65*15=9.75→10)
    const result = computeDrift(
      validInput({
        current: {
          avgLeadTimeDays: 7,
          bookingConsistency: 0.75,
          complianceRate: 80,
          selfBookingRate: 0,
          avgResponseTimeHours: 6,
          tripCountUsed: 10,
        },
      }),
    );
    expect(result.driftScore).toBe(10);
  });

  it('BR-1502: stabilityScore = 100 - driftScore', () => {
    const result = computeDrift(
      validInput({
        current: {
          avgLeadTimeDays: 14,
          bookingConsistency: 0.75,
          complianceRate: 80,
          selfBookingRate: 65,
          avgResponseTimeHours: 6,
          tripCountUsed: 10,
        },
      }),
    );
    expect(result.stabilityScore).toBe(100 - result.driftScore);
  });

  it('BR-1506: direction is improving when metrics get better', () => {
    const result = computeDrift(
      validInput({
        current: {
          avgLeadTimeDays: 7,
          bookingConsistency: 0.85,
          complianceRate: 95,
          selfBookingRate: 80,
          avgResponseTimeHours: 2,
          tripCountUsed: 10,
        },
      }),
    );
    expect(result.driftDirection).toBe('improving');
  });

  it('BR-1506: direction is declining when metrics worsen', () => {
    const result = computeDrift(
      validInput({
        current: {
          avgLeadTimeDays: 7,
          bookingConsistency: 0.3,
          complianceRate: 40,
          selfBookingRate: 20,
          avgResponseTimeHours: 24,
          tripCountUsed: 10,
        },
      }),
    );
    expect(result.driftDirection).toBe('declining');
  });

  it('BR-1506: direction is lateral when signals are mixed', () => {
    const result = computeDrift(
      validInput({
        current: {
          avgLeadTimeDays: 7,
          bookingConsistency: 0.85, // up
          complianceRate: 60, // down
          selfBookingRate: 65, // same
          avgResponseTimeHours: 6, // same
          tripCountUsed: 10,
        },
      }),
    );
    expect(result.driftDirection).toBe('lateral');
  });

  it('BR-1508: rejects tripCountUsed < 3', () => {
    expect(() =>
      computeDrift(
        validInput({
          current: {
            avgLeadTimeDays: 7,
            bookingConsistency: 0.75,
            complianceRate: 80,
            selfBookingRate: 65,
            avgResponseTimeHours: 6,
            tripCountUsed: 2,
          },
        }),
      ),
    ).toThrow('BR-1508');
  });
});

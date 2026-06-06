/**
 * Unit tests for CommunicationFatigueEngine.
 * Tests fatigue scoring and suppression decisions.
 * Source: BR-1601–BR-1611
 */

import { describe, it, expect } from 'vitest';
import { computeFatigue } from '../engines/communication-fatigue-engine.js';
import type { FatigueEngineInput } from '../engines/types.js';

const TENANT = 'tenant-001';
const CORP = 'corp-001';
const TRAVELLER = 'trav-001';

function validInput(overrides: Partial<FatigueEngineInput> = {}): FatigueEngineInput {
  return {
    travellerId: TRAVELLER,
    tenantId: TENANT,
    corporateId: CORP,
    comms30d: 3,
    ignoredCount: 0,
    declinedCount: 0,
    positiveResponses: 0,
    independentBookings: 0,
    daysSinceLastComm: 5,
    ...overrides,
  };
}

describe('CommunicationFatigueEngine', () => {
  it('BR-1608: low fatigue for score < 40', () => {
    const result = computeFatigue(validInput({ comms30d: 5 }));
    // Base: 5*2 = 10
    expect(result.fatigueLevel).toBe('low');
    expect(result.fatigueScore).toBe(10);
    expect(result.shouldSuppress).toBe(false);
  });

  it('BR-1608: medium fatigue for score 40–59', () => {
    const result = computeFatigue(validInput({ comms30d: 10, ignoredCount: 3 }));
    // Base: 10*2=20, +3*8=24 → 44
    expect(result.fatigueLevel).toBe('medium');
    expect(result.fatigueScore).toBe(44);
    expect(result.shouldSuppress).toBe(false);
  });

  it('BR-1608: high fatigue for score 60–79', () => {
    const result = computeFatigue(validInput({ comms30d: 10, ignoredCount: 5 }));
    // Base: 20, +5*8=40 → 60
    expect(result.fatigueLevel).toBe('high');
    expect(result.fatigueScore).toBe(60);
  });

  it('BR-1608: critical fatigue for score >= 80', () => {
    const result = computeFatigue(
      validInput({
        comms30d: 15,
        ignoredCount: 5,
        declinedCount: 2,
      }),
    );
    // Base: 30, +40, +24 → 94
    expect(result.fatigueLevel).toBe('critical');
    expect(result.fatigueScore).toBe(94);
  });

  it('BR-1601: communications volume contributes base score', () => {
    const low = computeFatigue(validInput({ comms30d: 2 }));
    const high = computeFatigue(validInput({ comms30d: 15 }));
    expect(high.fatigueScore).toBeGreaterThan(low.fatigueScore);
  });

  it('BR-1602: ignored communications increase fatigue by 8 each', () => {
    const base = computeFatigue(validInput({ comms30d: 5, ignoredCount: 0 }));
    const withIgnored = computeFatigue(validInput({ comms30d: 5, ignoredCount: 2 }));
    expect(withIgnored.fatigueScore - base.fatigueScore).toBe(16);
  });

  it('BR-1603: declined communications increase fatigue by 12 each', () => {
    const base = computeFatigue(validInput({ comms30d: 5, declinedCount: 0 }));
    const withDeclined = computeFatigue(validInput({ comms30d: 5, declinedCount: 2 }));
    expect(withDeclined.fatigueScore - base.fatigueScore).toBe(24);
  });

  it('BR-1604: positive response reduces fatigue by 10', () => {
    const base = computeFatigue(validInput({ comms30d: 10 }));
    const withPositive = computeFatigue(validInput({ comms30d: 10, positiveResponses: 1 }));
    expect(base.fatigueScore - withPositive.fatigueScore).toBe(10);
  });

  it('BR-1605: independent booking reduces fatigue by 15', () => {
    const base = computeFatigue(validInput({ comms30d: 10 }));
    const withBooking = computeFatigue(validInput({ comms30d: 10, independentBookings: 1 }));
    expect(base.fatigueScore - withBooking.fatigueScore).toBe(15);
  });

  it('BR-1606: decay of -5 after 14 days no communication', () => {
    const recent = computeFatigue(validInput({ comms30d: 10, daysSinceLastComm: 10 }));
    const stale = computeFatigue(validInput({ comms30d: 10, daysSinceLastComm: 14 }));
    expect(recent.fatigueScore - stale.fatigueScore).toBe(5);
  });

  it('BR-1607/BR-1611: score clamped at 0 minimum', () => {
    const result = computeFatigue(
      validInput({
        comms30d: 1,
        positiveResponses: 5,
        independentBookings: 5,
        daysSinceLastComm: 30,
      }),
    );
    expect(result.fatigueScore).toBe(0);
    expect(result.fatigueLevel).toBe('low');
  });

  it('BR-1609: shouldSuppress is true when score >= 60 (high)', () => {
    const result = computeFatigue(validInput({ comms30d: 10, ignoredCount: 5 }));
    expect(result.shouldSuppress).toBe(true);
    expect(result.suppressionReason).toBeTruthy();
  });

  it('BR-1609: critical fatigue has specific suppression reason', () => {
    const result = computeFatigue(
      validInput({
        comms30d: 20,
        ignoredCount: 8,
        declinedCount: 3,
      }),
    );
    expect(result.fatigueLevel).toBe('critical');
    expect(result.shouldSuppress).toBe(true);
    expect(result.suppressionReason).toContain('critical');
  });

  it('BR-1610: ignoredRate calculated correctly', () => {
    const result = computeFatigue(validInput({ comms30d: 10, ignoredCount: 3 }));
    expect(result.ignoredRate).toBe(0.3);
  });

  it('ignoredRate is 0 when comms30d is 0', () => {
    const result = computeFatigue(validInput({ comms30d: 0, currentScore: 20 }));
    expect(result.ignoredRate).toBe(0);
  });
});

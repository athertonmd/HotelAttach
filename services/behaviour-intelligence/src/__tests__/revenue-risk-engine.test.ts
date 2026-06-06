/**
 * Unit tests for RevenueRiskEngine.
 * Tests revenue at risk calculation with urgency weighting.
 * Source: BR-1701–BR-1708
 */

import { describe, it, expect } from 'vitest';
import { computeRevenueRisk } from '../engines/revenue-risk-engine.js';
import type { RevenueRiskEngineInput } from '../engines/types.js';

const TENANT = 'tenant-001';
const CORP = 'corp-001';
const TRAVELLER = 'trav-001';

function validInput(overrides: Partial<RevenueRiskEngineInput> = {}): RevenueRiskEngineInput {
  return {
    travellerId: TRAVELLER,
    tenantId: TENANT,
    corporateId: CORP,
    estimatedCommission: 200,
    attachmentLikelihood: 60,
    ...overrides,
  };
}

describe('RevenueRiskEngine', () => {
  it('BR-1701: calculates revenue at risk correctly', () => {
    const result = computeRevenueRisk(
      validInput({
        estimatedCommission: 200,
        attachmentLikelihood: 60,
      }),
    );
    // 200 * (1 - 0.60) = 80
    expect(result.revenueAtRisk).toBe(80);
  });

  it('BR-1702: secure tier when likelihood > 90%', () => {
    const result = computeRevenueRisk(validInput({ attachmentLikelihood: 95 }));
    expect(result.riskTier).toBe('secure');
    expect(result.revenueAtRisk).toBe(10); // 200 * 0.05
  });

  it('BR-1703: likely tier when likelihood 70–90%', () => {
    const result = computeRevenueRisk(validInput({ attachmentLikelihood: 80 }));
    expect(result.riskTier).toBe('likely');
  });

  it('BR-1704: uncertain tier when likelihood 40–69%', () => {
    const result = computeRevenueRisk(validInput({ attachmentLikelihood: 50 }));
    expect(result.riskTier).toBe('uncertain');
  });

  it('BR-1705: at_risk tier when likelihood 20–39%', () => {
    const result = computeRevenueRisk(validInput({ attachmentLikelihood: 30 }));
    expect(result.riskTier).toBe('at_risk');
  });

  it('BR-1706: critical tier when likelihood < 20%', () => {
    const result = computeRevenueRisk(validInput({ attachmentLikelihood: 10 }));
    expect(result.riskTier).toBe('critical');
    expect(result.revenueAtRisk).toBe(180); // 200 * 0.9
  });

  it('zero commission results in zero revenue at risk', () => {
    const result = computeRevenueRisk(validInput({ estimatedCommission: 0 }));
    expect(result.revenueAtRisk).toBe(0);
    expect(result.weightedRisk).toBe(0);
  });

  it('BR-1707: rejects negative commission', () => {
    expect(() => computeRevenueRisk(validInput({ estimatedCommission: -50 }))).toThrow('BR-1707');
  });

  it('BR-1708: clamps attachment likelihood to 0–100', () => {
    const over = computeRevenueRisk(validInput({ attachmentLikelihood: 150 }));
    expect(over.attachmentLikelihood).toBe(100);
    expect(over.revenueAtRisk).toBe(0);

    const under = computeRevenueRisk(validInput({ attachmentLikelihood: -20 }));
    expect(under.attachmentLikelihood).toBe(0);
    expect(under.revenueAtRisk).toBe(200);
  });

  it('urgency factor increases when days to departure is low', () => {
    const urgent = computeRevenueRisk(validInput({ daysToDeparture: 2 }));
    const relaxed = computeRevenueRisk(validInput({ daysToDeparture: 30 }));
    expect(urgent.urgencyFactor).toBeGreaterThan(relaxed.urgencyFactor);
    expect(urgent.weightedRisk).toBeGreaterThan(relaxed.weightedRisk);
  });

  it('weighted risk = revenueAtRisk × urgencyFactor', () => {
    const result = computeRevenueRisk(validInput({ daysToDeparture: 0 }));
    // urgencyFactor for 0 days = 1.0
    expect(result.urgencyFactor).toBe(1.0);
    expect(result.weightedRisk).toBe(result.revenueAtRisk);
  });

  it('revenue at risk is never negative', () => {
    const result = computeRevenueRisk(
      validInput({
        estimatedCommission: 100,
        attachmentLikelihood: 100,
      }),
    );
    expect(result.revenueAtRisk).toBe(0);
    expect(result.revenueAtRisk).toBeGreaterThanOrEqual(0);
  });
});

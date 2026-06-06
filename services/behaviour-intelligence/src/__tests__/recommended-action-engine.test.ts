/**
 * Unit tests for RecommendedActionEngine.
 * Tests action recommendation logic from behavioural context.
 * Source: BR-1801–BR-1810
 */

import { describe, it, expect } from 'vitest';
import { computeRecommendedAction } from '../engines/recommended-action-engine.js';
import type { ActionEngineInput } from '../engines/types.js';

const TENANT = 'tenant-001';
const CORP = 'corp-001';
const TRAVELLER = 'trav-001';

function validInput(overrides: Partial<ActionEngineInput> = {}): ActionEngineInput {
  return {
    travellerId: TRAVELLER,
    tenantId: TENANT,
    corporateId: CORP,
    segment: 'reliable_late',
    archetype: 'responsive',
    confidenceScore: 100,
    predictedLeadTimeDays: 7,
    daysToDeparture: 8,
    fatigueScore: 20,
    fatigueLevel: 'low',
    driftStatus: 'stable',
    driftScore: 10,
    revenueAtRisk: 80,
    riskTier: 'uncertain',
    ...overrides,
  };
}

describe('RecommendedActionEngine', () => {
  it('BR-1803: escalates when fatigue is critical and departure < 3 days', () => {
    const result = computeRecommendedAction(
      validInput({
        fatigueLevel: 'critical',
        fatigueScore: 85,
        daysToDeparture: 2,
      }),
    );
    expect(result.action).toBe('escalate');
  });

  it('BR-1808: escalates when drift is significant and departure < 5 days', () => {
    const result = computeRecommendedAction(
      validInput({
        driftStatus: 'significant',
        driftScore: 70,
        daysToDeparture: 3,
      }),
    );
    expect(result.action).toBe('escalate');
  });

  it('BR-1801: do_nothing for self-sufficient traveller within predicted window', () => {
    const result = computeRecommendedAction(
      validInput({
        segment: 'self_sufficient',
        daysToDeparture: 10,
        predictedLeadTimeDays: 7,
      }),
    );
    expect(result.action).toBe('do_nothing');
  });

  it('BR-1804: suppresses when fatigue is high', () => {
    const result = computeRecommendedAction(
      validInput({
        fatigueLevel: 'high',
        fatigueScore: 65,
        daysToDeparture: 10,
      }),
    );
    expect(result.action).toBe('do_nothing');
  });

  it('BR-1802: wait when well outside predicted window', () => {
    const result = computeRecommendedAction(
      validInput({
        daysToDeparture: 20,
        predictedLeadTimeDays: 7,
      }),
    );
    expect(result.action).toBe('wait');
  });

  it('BR-1806: send_sms when departure < 5 days and low fatigue', () => {
    const result = computeRecommendedAction(
      validInput({
        daysToDeparture: 4,
        predictedLeadTimeDays: 5,
        fatigueLevel: 'low',
      }),
    );
    expect(result.action).toBe('send_sms');
  });

  it('BR-1807: send_push for nudge_needer within window', () => {
    const result = computeRecommendedAction(
      validInput({
        archetype: 'nudge_needer',
        daysToDeparture: 6,
        predictedLeadTimeDays: 5,
        fatigueLevel: 'low',
      }),
    );
    expect(result.action).toBe('send_push');
  });

  it('BR-1805: send_email for responsive archetype within window', () => {
    const result = computeRecommendedAction(
      validInput({
        archetype: 'responsive',
        daysToDeparture: 8,
        predictedLeadTimeDays: 7,
        fatigueLevel: 'low',
      }),
    );
    expect(result.action).toBe('send_email');
  });

  it('BR-1809: confidence is reduced by low profile confidence', () => {
    const highConf = computeRecommendedAction(validInput({ confidenceScore: 100 }));
    const lowConf = computeRecommendedAction(validInput({ confidenceScore: 30 }));
    expect(lowConf.confidence).toBeLessThan(highConf.confidence);
  });

  it('BR-1810: explanationText is always present and meaningful', () => {
    const result = computeRecommendedAction(validInput());
    expect(result.explanationText).toBeTruthy();
    expect(result.explanationText.length).toBeGreaterThan(10);
  });

  it('preserves estimatedRevenueAtRisk in result', () => {
    const result = computeRecommendedAction(validInput({ revenueAtRisk: 250 }));
    expect(result.estimatedRevenueAtRisk).toBe(250);
  });

  it('confidence is clamped between 0 and 100', () => {
    const result = computeRecommendedAction(validInput({ confidenceScore: 100 }));
    expect(result.confidence).toBeGreaterThanOrEqual(0);
    expect(result.confidence).toBeLessThanOrEqual(100);
  });

  it('default action is send_email when no specific rule matches', () => {
    const result = computeRecommendedAction(
      validInput({
        archetype: 'chaotic',
        daysToDeparture: 8,
        predictedLeadTimeDays: 7,
        fatigueLevel: 'low',
        driftStatus: 'stable',
        segment: 'needs_prompting',
      }),
    );
    expect(result.action).toBe('send_email');
  });
});

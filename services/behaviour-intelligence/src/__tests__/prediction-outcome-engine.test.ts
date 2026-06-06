/**
 * Unit tests for PredictionOutcomeEngine.
 * Tests prediction accuracy evaluation.
 * Source: BR-1901–BR-1910
 */

import { describe, it, expect } from 'vitest';
import { computePredictionOutcome } from '../engines/prediction-outcome-engine.js';
import type { PredictionOutcomeEngineInput } from '../engines/types.js';

const TENANT = 'tenant-001';
const CORP = 'corp-001';
const TRAVELLER = 'trav-001';

function validInput(
  overrides: Partial<PredictionOutcomeEngineInput> = {},
): PredictionOutcomeEngineInput {
  return {
    recommendationId: 'rec-001',
    travellerId: TRAVELLER,
    tenantId: TENANT,
    corporateId: CORP,
    opportunityId: 'opp-001',
    recommendedAction: 'send_email',
    actualOutcome: 'booked_after_communication',
    ...overrides,
  };
}

describe('PredictionOutcomeEngine', () => {
  it('wait is correct when traveller books independently', () => {
    const result = computePredictionOutcome(
      validInput({
        recommendedAction: 'wait',
        actualOutcome: 'booked_independently',
      }),
    );
    expect(result.wasCorrect).toBe(true);
  });

  it('do_nothing is correct when traveller books independently', () => {
    const result = computePredictionOutcome(
      validInput({
        recommendedAction: 'do_nothing',
        actualOutcome: 'booked_independently',
      }),
    );
    expect(result.wasCorrect).toBe(true);
  });

  it('send_email is correct when booked after communication', () => {
    const result = computePredictionOutcome(
      validInput({
        recommendedAction: 'send_email',
        actualOutcome: 'booked_after_communication',
      }),
    );
    expect(result.wasCorrect).toBe(true);
  });

  it('send_sms is correct when booked after communication', () => {
    const result = computePredictionOutcome(
      validInput({
        recommendedAction: 'send_sms',
        actualOutcome: 'booked_after_communication',
      }),
    );
    expect(result.wasCorrect).toBe(true);
  });

  it('send_push is correct when booked after communication', () => {
    const result = computePredictionOutcome(
      validInput({
        recommendedAction: 'send_push',
        actualOutcome: 'booked_after_communication',
      }),
    );
    expect(result.wasCorrect).toBe(true);
  });

  it('escalate is correct when booked after escalation', () => {
    const result = computePredictionOutcome(
      validInput({
        recommendedAction: 'escalate',
        actualOutcome: 'booked_after_escalation',
      }),
    );
    expect(result.wasCorrect).toBe(true);
  });

  it('do_nothing is correct when cancelled', () => {
    const result = computePredictionOutcome(
      validInput({
        recommendedAction: 'do_nothing',
        actualOutcome: 'cancelled',
      }),
    );
    expect(result.wasCorrect).toBe(true);
  });

  it('send_email is incorrect when expired unbooked', () => {
    const result = computePredictionOutcome(
      validInput({
        recommendedAction: 'send_email',
        actualOutcome: 'expired_unbooked',
      }),
    );
    expect(result.wasCorrect).toBe(false);
  });

  it('escalate is incorrect when booked independently', () => {
    const result = computePredictionOutcome(
      validInput({
        recommendedAction: 'escalate',
        actualOutcome: 'booked_independently',
      }),
    );
    expect(result.wasCorrect).toBe(false);
  });

  it('calculates daysDifference from predicted and actual dates', () => {
    const result = computePredictionOutcome(
      validInput({
        predictedBookingDate: '2025-01-10T00:00:00Z',
        actualBookingDate: '2025-01-13T00:00:00Z',
      }),
    );
    expect(result.daysDifference).toBe(3);
  });

  it('daysDifference is 0 when dates are not provided', () => {
    const result = computePredictionOutcome(validInput());
    expect(result.daysDifference).toBe(0);
  });

  it('accuracyBand is exact when daysDifference is 0', () => {
    const result = computePredictionOutcome(
      validInput({
        predictedBookingDate: '2025-01-10T00:00:00Z',
        actualBookingDate: '2025-01-10T00:00:00Z',
      }),
    );
    expect(result.accuracyBand).toBe('exact');
  });

  it('accuracyBand is close when daysDifference is 1–2', () => {
    const result = computePredictionOutcome(
      validInput({
        predictedBookingDate: '2025-01-10T00:00:00Z',
        actualBookingDate: '2025-01-12T00:00:00Z',
      }),
    );
    expect(result.accuracyBand).toBe('close');
  });

  it('accuracyBand is off when daysDifference is 3–7', () => {
    const result = computePredictionOutcome(
      validInput({
        predictedBookingDate: '2025-01-10T00:00:00Z',
        actualBookingDate: '2025-01-15T00:00:00Z',
      }),
    );
    expect(result.accuracyBand).toBe('off');
  });

  it('accuracyBand is missed when daysDifference is 8+', () => {
    const result = computePredictionOutcome(
      validInput({
        predictedBookingDate: '2025-01-10T00:00:00Z',
        actualBookingDate: '2025-01-25T00:00:00Z',
      }),
    );
    expect(result.accuracyBand).toBe('missed');
  });
});

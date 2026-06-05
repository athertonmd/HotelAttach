/**
 * PredictionOutcome — Records prediction vs actual outcome for model learning.
 * Source: BR-1901–BR-1910
 */

import { randomUUID } from 'node:crypto';
import type { RecommendedActionType, PredictionOutcomeType } from './enums.js';

export interface PredictionOutcome {
  readonly predictionId: string;
  readonly recommendationId: string;
  readonly travellerId: string;
  readonly tenantId: string;
  readonly corporateId: string;
  readonly opportunityId: string;
  readonly recommendedAction: RecommendedActionType;
  readonly actualOutcome: PredictionOutcomeType;
  readonly wasCorrect: boolean;
  readonly daysDifference: number;
  readonly resolvedAt: Date;
}

export interface EvaluateOutcomeInput {
  recommendationId: string;
  travellerId: string;
  tenantId: string;
  corporateId: string;
  opportunityId: string;
  recommendedAction: RecommendedActionType;
  actualOutcome: PredictionOutcomeType;
  daysDifference: number;
}

/**
 * Determine if the prediction was correct.
 * - do_nothing / wait → correct if booked_independently
 * - send_email / send_sms / send_push → correct if booked_after_communication
 * - escalate → correct if booked_after_escalation
 * - Any action → incorrect if expired_unbooked (unless do_nothing when traveller was self-sufficient)
 */
function wasCorrectPrediction(
  recommendedAction: RecommendedActionType,
  actualOutcome: PredictionOutcomeType,
): boolean {
  switch (recommendedAction) {
    case 'do_nothing':
    case 'wait':
      return actualOutcome === 'booked_independently' || actualOutcome === 'cancelled';
    case 'send_email':
    case 'send_sms':
    case 'send_push':
      return actualOutcome === 'booked_after_communication';
    case 'escalate':
      return actualOutcome === 'booked_after_escalation';
    default:
      return false;
  }
}

/**
 * Evaluate a prediction outcome.
 */
export function evaluateOutcome(input: EvaluateOutcomeInput): PredictionOutcome {
  if (!input.recommendationId) throw new Error('recommendationId is required');
  if (!input.travellerId) throw new Error('travellerId is required');
  if (!input.tenantId) throw new Error('tenantId is required');
  if (!input.corporateId) throw new Error('corporateId is required');
  if (!input.opportunityId) throw new Error('opportunityId is required');

  const wasCorrect = wasCorrectPrediction(input.recommendedAction, input.actualOutcome);

  return {
    predictionId: randomUUID(),
    recommendationId: input.recommendationId,
    travellerId: input.travellerId,
    tenantId: input.tenantId,
    corporateId: input.corporateId,
    opportunityId: input.opportunityId,
    recommendedAction: input.recommendedAction,
    actualOutcome: input.actualOutcome,
    wasCorrect,
    daysDifference: input.daysDifference,
    resolvedAt: new Date(),
  };
}

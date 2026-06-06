/**
 * PredictionOutcomeEngine — Evaluates prediction accuracy for model learning.
 * Pure computation: compares recommended action to actual outcome.
 * Source: BR-1901–BR-1910
 */

import type { RecommendedActionType, PredictionOutcomeType } from '../domain/index.js';
import type { PredictionOutcomeEngineInput, PredictionOutcomeEngineResult } from './types.js';

/**
 * Determine if prediction was correct based on action/outcome pairing.
 * BR-1901: do_nothing/wait → correct if booked_independently or cancelled
 * BR-1902: send_email/send_sms/send_push → correct if booked_after_communication
 * BR-1903: escalate → correct if booked_after_escalation
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
 * Calculate days difference between predicted and actual booking dates.
 * Returns 0 if dates are not available.
 */
function calculateDaysDifference(predictedDate?: string, actualDate?: string): number {
  if (!predictedDate || !actualDate) return 0;
  const predicted = new Date(predictedDate);
  const actual = new Date(actualDate);
  if (isNaN(predicted.getTime()) || isNaN(actual.getTime())) return 0;
  const diffMs = Math.abs(actual.getTime() - predicted.getTime());
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Determine accuracy band from days difference.
 * BR-1904: Exact = 0 days, Close = 1–2 days, Off = 3–7 days, Missed = 8+ days
 */
function determineAccuracyBand(daysDifference: number): 'exact' | 'close' | 'off' | 'missed' {
  if (daysDifference === 0) return 'exact';
  if (daysDifference <= 2) return 'close';
  if (daysDifference <= 7) return 'off';
  return 'missed';
}

/**
 * Execute the prediction outcome engine.
 * Evaluates whether a past prediction was correct and how accurate timing was.
 */
export function computePredictionOutcome(
  input: PredictionOutcomeEngineInput,
): PredictionOutcomeEngineResult {
  const wasCorrect = wasCorrectPrediction(input.recommendedAction, input.actualOutcome);
  const daysDifference = calculateDaysDifference(
    input.predictedBookingDate,
    input.actualBookingDate,
  );
  const accuracyBand = determineAccuracyBand(daysDifference);

  return {
    wasCorrect,
    daysDifference,
    accuracyBand,
  };
}

/**
 * RecommendedActionEngine — Determines optimal next action for a traveller/opportunity.
 * Pure computation: accepts full behavioural context, returns action recommendation.
 * Source: BR-1801–BR-1810
 */

import type { RecommendedActionType } from '../domain/index.js';
import type { ActionEngineInput, ActionEngineResult } from './types.js';

/**
 * Execute the recommended action engine.
 * Evaluates rules in priority order to determine optimal action.
 */
export function computeRecommendedAction(input: ActionEngineInput): ActionEngineResult {
  const {
    segment,
    archetype,
    confidenceScore,
    predictedLeadTimeDays,
    daysToDeparture,
    fatigueLevel,
    driftStatus,
    revenueAtRisk,
    riskTier,
  } = input;

  let action: RecommendedActionType;
  let confidence: number;
  let explanationText: string;

  // BR-1803: Escalate if fatigue is critical and departure imminent
  if (fatigueLevel === 'critical' && daysToDeparture < 3) {
    action = 'escalate';
    confidence = 85;
    explanationText =
      'Fatigue is critical and departure is imminent. Escalating to agent intervention.';
  }
  // BR-1808: Escalate if drift is significant and departure imminent
  else if (driftStatus === 'significant' && daysToDeparture < 5) {
    action = 'escalate';
    confidence = 75;
    explanationText =
      'Significant behaviour drift detected with approaching departure. Escalating for review.';
  }
  // BR-1801: do_nothing if self-sufficient and within predicted window
  else if (segment === 'self_sufficient' && daysToDeparture > predictedLeadTimeDays) {
    action = 'do_nothing';
    confidence = 90;
    explanationText =
      'Traveller is self-sufficient and departure is within their predicted booking window. No action needed.';
  }
  // BR-1804: Suppress if fatigue is high/critical
  else if (fatigueLevel === 'high' || fatigueLevel === 'critical') {
    action = 'do_nothing';
    confidence = 70;
    explanationText =
      'Communication suppressed due to high fatigue level. Allowing natural behaviour.';
  }
  // BR-1802: Wait if well outside predicted window
  else if (daysToDeparture > predictedLeadTimeDays + 3) {
    action = 'wait';
    confidence = 80;
    explanationText =
      'Departure is beyond the predicted lead time window. Waiting for optimal timing.';
  }
  // BR-1806: Send SMS if departure < 5 days and not fatigued
  else if (daysToDeparture < 5 && fatigueLevel === 'low') {
    action = 'send_sms';
    confidence = 75;
    explanationText =
      'Departure approaching within 5 days and fatigue is low. SMS recommended for urgency.';
  }
  // BR-1807: Send push for nudge_needer within window
  else if (archetype === 'nudge_needer' && daysToDeparture <= predictedLeadTimeDays + 2) {
    action = 'send_push';
    confidence = 70;
    explanationText =
      'Nudge-needer archetype within booking window. Push notification recommended.';
  }
  // BR-1805: Send email for responsive/autopilot
  else if (archetype === 'responsive' || archetype === 'autopilot') {
    action = 'send_email';
    confidence = 72;
    explanationText =
      'Responsive/autopilot traveller within action window. Email communication recommended.';
  }
  // Default: send email
  else {
    action = 'send_email';
    confidence = 60;
    explanationText = 'Standard email communication recommended based on profile analysis.';
  }

  // BR-1809: Adjust confidence based on profile confidence score
  const profileConfidenceFactor = confidenceScore / 100;
  confidence = Math.round(confidence * profileConfidenceFactor);
  confidence = Math.min(100, Math.max(0, confidence));

  // Boost confidence for critical revenue at risk
  if (riskTier === 'critical' && action === 'escalate') {
    confidence = Math.min(100, confidence + 5);
  }

  return {
    action,
    confidence,
    explanationText,
    fatigueLevel,
    driftStatus,
    daysToDeparture,
    predictedLeadTimeDays,
    estimatedRevenueAtRisk: revenueAtRisk,
  };
}

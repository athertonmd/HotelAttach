/**
 * RecommendedAction — Determines optimal action for a traveller/opportunity.
 * Source: BR-1801–BR-1810
 */

import type { RecommendedActionType, FatigueLevel, DriftStatus, ArchetypeType } from './enums.js';
import type { TravellerBehaviourProfile } from './traveller-behaviour-profile.js';
import type { CommunicationFatigue } from './communication-fatigue.js';
import type { BehaviourDrift } from './behaviour-drift.js';

export interface RecommendedAction {
  readonly action: RecommendedActionType;
  readonly confidence: number;
  readonly explanationText: string;
  readonly fatigueLevel: FatigueLevel;
  readonly driftStatus: DriftStatus;
  readonly daysToDeparture: number;
  readonly predictedLeadTimeDays: number;
}

export interface DetermineActionInput {
  profile: TravellerBehaviourProfile;
  fatigue: CommunicationFatigue;
  drift: BehaviourDrift;
  daysToDeparture: number;
  predictedLeadTimeDays: number;
  archetype?: ArchetypeType;
}

/**
 * Determine the recommended action.
 * BR-1801: do_nothing if traveller is self_sufficient and within predicted window
 * BR-1802: wait if daysToDeparture > predictedLeadTimeDays + 3
 * BR-1803: escalate if fatigue is critical and daysToDeparture < 3
 * BR-1804: suppress communication if fatigue is high/critical
 * BR-1805: send_email preferred for responsive/autopilot archetypes
 * BR-1806: send_sms if daysToDeparture < 5 and not fatigued
 * BR-1807: send_push for nudge_needer archetype when within window
 * BR-1808: escalate if drift is significant and daysToDeparture < 5
 * BR-1809: Confidence based on data quality and pattern match
 * BR-1810: explanationText must describe reasoning
 */
export function determineAction(input: DetermineActionInput): RecommendedAction {
  const { profile, fatigue, drift, daysToDeparture, predictedLeadTimeDays } = input;
  const archetype = input.archetype ?? 'responsive';

  let action: RecommendedActionType;
  let confidence: number;
  let explanationText: string;

  // BR-1803: Escalate if fatigue is critical and departure imminent
  if (fatigue.fatigueLevel === 'critical' && daysToDeparture < 3) {
    action = 'escalate';
    confidence = 85;
    explanationText =
      'Fatigue is critical and departure is imminent. Escalating to agent intervention.';
  }
  // BR-1808: Escalate if drift is significant and departure imminent
  else if (drift.driftStatus === 'significant' && daysToDeparture < 5) {
    action = 'escalate';
    confidence = 75;
    explanationText =
      'Significant behaviour drift detected with approaching departure. Escalating for review.';
  }
  // BR-1801: do_nothing if self-sufficient and within predicted window
  else if (profile.segment === 'self_sufficient' && daysToDeparture > predictedLeadTimeDays) {
    action = 'do_nothing';
    confidence = 90;
    explanationText =
      'Traveller is self-sufficient and departure is within their predicted booking window. No action needed.';
  }
  // BR-1804: Suppress if fatigue is high/critical
  else if (fatigue.fatigueLevel === 'high' || fatigue.fatigueLevel === 'critical') {
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
  else if (daysToDeparture < 5 && fatigue.fatigueLevel === 'low') {
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

  // BR-1809: Adjust confidence based on profile confidence
  const profileConfidenceFactor = profile.confidenceScore / 100;
  confidence = Math.round(confidence * profileConfidenceFactor);
  confidence = Math.min(100, Math.max(0, confidence));

  return {
    action,
    confidence,
    explanationText,
    fatigueLevel: fatigue.fatigueLevel,
    driftStatus: drift.driftStatus,
    daysToDeparture,
    predictedLeadTimeDays,
  };
}

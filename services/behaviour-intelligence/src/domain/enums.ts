/**
 * Behaviour Intelligence domain enums.
 * Source: Approved Project 4 Design, Business Rules Catalogue BR-1200–BR-1810
 */

export type BehaviourSegment =
  | 'self_sufficient'
  | 'reliable_late'
  | 'needs_prompting'
  | 'requires_intervention'
  | 'non_compliant';

export type ArchetypeType =
  | 'autopilot'
  | 'procrastinator'
  | 'responsive'
  | 'nudge_needer'
  | 'reluctant'
  | 'chaotic'
  | 'new_traveller';

export type AttributionType =
  | 'independent'
  | 'email'
  | 'sms'
  | 'push_notification'
  | 'in_app'
  | 'agent_intervention'
  | 'corporate_policy'
  | 'unknown';

export type DriftStatus = 'stable' | 'moderate' | 'significant';

export type DriftDirection = 'improving' | 'declining' | 'lateral';

export type FatigueLevel = 'low' | 'medium' | 'high' | 'critical';

export type RecommendedActionType =
  | 'do_nothing'
  | 'wait'
  | 'send_email'
  | 'send_sms'
  | 'send_push'
  | 'escalate';

export type SuppressionReason =
  | 'within_predicted_window'
  | 'self_sufficient_traveller'
  | 'recent_communication'
  | 'fatigue_threshold'
  | 'booking_detected';

export type PredictionOutcomeType =
  | 'booked_independently'
  | 'booked_after_communication'
  | 'booked_after_escalation'
  | 'expired_unbooked'
  | 'cancelled';

export type BehaviourChannel = 'email' | 'sms' | 'push_notification' | 'in_app';

export type RiskTier = 'secure' | 'likely' | 'uncertain' | 'at_risk' | 'critical';

/** Attribution windows in hours per channel (BR-1401–BR-1410) */
export const ATTRIBUTION_WINDOWS: Record<string, number> = {
  email: 72,
  sms: 24,
  push_notification: 12,
  in_app: 48,
  agent_intervention: 24,
};

/** Derive risk tier from attachment likelihood percentage (BR-1701–BR-1708) */
export function deriveRiskTier(attachmentLikelihood: number): RiskTier {
  if (attachmentLikelihood > 90) return 'secure';
  if (attachmentLikelihood >= 70) return 'likely';
  if (attachmentLikelihood >= 40) return 'uncertain';
  if (attachmentLikelihood >= 20) return 'at_risk';
  return 'critical';
}

/** Derive fatigue level from fatigue score (BR-1601–BR-1611) */
export function deriveFatigueLevel(score: number): FatigueLevel {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

/** Derive drift status from drift score (BR-1501–BR-1508) */
export function deriveDriftStatus(driftScore: number): DriftStatus {
  if (driftScore >= 60) return 'significant';
  if (driftScore >= 30) return 'moderate';
  return 'stable';
}

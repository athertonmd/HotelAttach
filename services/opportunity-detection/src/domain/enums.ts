/**
 * Opportunity Detection domain enums.
 * Source: Approved Project 3 Design, Business Rules Catalogue BR-500–BR-1100
 */

export type OpportunityType =
  | 'missing_hotel'
  | 'partial_coverage'
  | 'out_of_policy'
  | 'direct_booked'
  | 'preferred_supplier'
  | 'duty_of_care_gap'
  | 'orphan_hotel_review';

export type LifecycleState =
  | 'detected'
  | 'qualified'
  | 'suppressed'
  | 'awaiting_action'
  | 'active'
  | 'communicated'
  | 'converted'
  | 'fulfilled'
  | 'closed'
  | 'rejected'
  | 'expired'
  | 'cancelled';

export type Priority = 'critical' | 'high' | 'medium' | 'low';

export type ClosureReason =
  | 'hotel_added'
  | 'coverage_complete'
  | 'fulfilled'
  | 'resolved_without_conversion'
  | 'trip_cancelled'
  | 'expired'
  | 'manual_closure';

export type RejectionReason =
  | 'traveller_declined'
  | 'admin_rejected'
  | 'no_action_required'
  | 'policy_exempted'
  | 'duplicate_opportunity'
  | 'supplier_exempted';

export type SuppressionReason =
  | 'corporate_policy_override'
  | 'manual_suppression'
  | 'trip_cancellation_pending'
  | 'orphan_reassociation_window'
  | 'traveller_recently_declined'
  | 'existing_booking_in_flight'
  | 'duplicate_opportunity'
  | 'existing_active_opportunity'
  | 'communication_cooldown'
  | 'executive_traveller_review'
  | 'supplier_contract_exemption';

export type ActorType = 'system' | 'tmc_user' | 'tmc_admin' | 'corporate_admin' | 'platform_admin';

export type RecommendationType =
  | 'book_hotel'
  | 'add_nights'
  | 'move_to_preferred'
  | 'review_policy_exception'
  | 'contact_tmc'
  | 'confirm_accommodation'
  | 'cancel_external_booking';

export type ActionTriggerSource = 'event' | 'timer' | 'manual' | 'system';

/** Active states — opportunity is still in play */
export const ACTIVE_STATES: readonly LifecycleState[] = [
  'detected',
  'qualified',
  'suppressed',
  'awaiting_action',
  'active',
  'communicated',
  'converted',
  'fulfilled',
] as const;

/** Terminal states — opportunity has ended */
export const TERMINAL_STATES: readonly LifecycleState[] = [
  'closed',
  'rejected',
  'expired',
  'cancelled',
] as const;

/** Suppression priority order (1 = highest) */
export const SUPPRESSION_PRIORITY: Record<SuppressionReason, number> = {
  corporate_policy_override: 1,
  manual_suppression: 2,
  trip_cancellation_pending: 3,
  orphan_reassociation_window: 4,
  traveller_recently_declined: 5,
  existing_booking_in_flight: 6,
  duplicate_opportunity: 7,
  existing_active_opportunity: 8,
  communication_cooldown: 9,
  executive_traveller_review: 10,
  supplier_contract_exemption: 11,
};

/** Derive priority from score (BR-600 thresholds) */
export function derivePriority(score: number): Priority {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

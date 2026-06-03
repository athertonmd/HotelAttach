/**
 * Opportunity Domain Events
 * Derived from: schemas/opportunity-created, opportunity-updated, opportunity-closed, opportunity-rejected
 * Published by the Opportunity Detection Engine.
 */

import type { HCIEventEnvelope } from './envelope.js';

// --- Shared enums ---

export type OpportunityType =
  | 'missing_hotel'
  | 'partial_coverage'
  | 'out_of_policy'
  | 'direct_booked'
  | 'preferred_supplier'
  | 'duty_of_care_gap'
  | 'orphan_hotel_review';

export type OpportunityLifecycleState =
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

export type OpportunityPriority = 'critical' | 'high' | 'medium' | 'low';

export type OpportunityClosureReason =
  | 'hotel_added'
  | 'coverage_complete'
  | 'fulfilled'
  | 'resolved_without_conversion'
  | 'trip_cancelled'
  | 'expired'
  | 'manual_closure';

export type OpportunityRejectionReason =
  | 'traveller_declined'
  | 'admin_rejected'
  | 'no_action_required'
  | 'policy_exempted'
  | 'duplicate_opportunity'
  | 'supplier_exempted';

export type OpportunitySuppressionReason =
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

export type OpportunityActorType =
  | 'system'
  | 'tmc_user'
  | 'tmc_admin'
  | 'corporate_admin'
  | 'platform_admin';

export type RecommendationType =
  | 'book_hotel'
  | 'add_nights'
  | 'move_to_preferred'
  | 'review_policy_exception'
  | 'contact_tmc'
  | 'confirm_accommodation'
  | 'cancel_external_booking';

// --- Shared structures ---

export interface OpportunityRecommendation {
  recommendationType: RecommendationType;
  recommendationText: string;
  priority: OpportunityPriority;
  preferredSupplierId?: string | null;
  estimatedNights?: number | null;
  estimatedCost?: number | null;
}

// --- Payload types ---

export interface OpportunityCreatedPayload {
  opportunityId: string;
  tenantId: string;
  corporateId: string;
  travellerId: string;
  tripId: string;
  opportunityType: OpportunityType;
  lifecycleState: 'qualified' | 'active' | 'suppressed' | 'awaiting_action';
  score: number;
  priority: OpportunityPriority;
  detectedAt: string;
  estimatedRoomNights?: number | null;
  estimatedSpend?: number | null;
  estimatedCommission?: number | null;
  destinationCity?: string | null;
  destinationCountry?: string | null;
  departureDate?: string | null;
  suppressedUntil?: string | null;
  primarySuppressionReason?: OpportunitySuppressionReason | null;
  triggeringEventId?: string | null;
  triggeringEventType?: string | null;
  ruleIdsApplied?: string[] | null;
  recommendation?: OpportunityRecommendation | null;
}

export interface OpportunityUpdatedPayload {
  opportunityId: string;
  tenantId: string;
  corporateId: string;
  tripId: string;
  opportunityType: OpportunityType;
  lifecycleState: OpportunityLifecycleState;
  previousScore: number;
  newScore: number;
  previousPriority: OpportunityPriority;
  newPriority: OpportunityPriority;
  updatedAt: string;
  previousState?: OpportunityLifecycleState | null;
  scoreChangeReason?: string | null;
  ruleIdsApplied?: string[] | null;
  estimatedSpend?: number | null;
  reopenCount?: number | null;
  triggeringEventId?: string | null;
  triggeringEventType?: string | null;
  recommendation?: OpportunityRecommendation | null;
}

export interface OpportunityClosedPayload {
  opportunityId: string;
  tenantId: string;
  corporateId: string;
  tripId: string;
  travellerId: string;
  opportunityType: OpportunityType;
  closureReason: OpportunityClosureReason;
  finalScore: number;
  closedAt: string;
  convertedBookingId?: string | null;
  revenue?: number | null;
  durationDays?: number | null;
  reopenCount?: number | null;
  actorId?: string | null;
  actorType?: OpportunityActorType | null;
  notes?: string | null;
  triggeringEventId?: string | null;
  triggeringEventType?: string | null;
}

export interface OpportunityRejectedPayload {
  opportunityId: string;
  tenantId: string;
  corporateId: string;
  tripId: string;
  travellerId: string;
  opportunityType: OpportunityType;
  rejectionReason: OpportunityRejectionReason;
  rejectedAt: string;
  actorId?: string | null;
  actorType?: OpportunityActorType | null;
  notes?: string | null;
  previousState?: OpportunityLifecycleState | null;
  finalScore?: number | null;
  triggeringEventId?: string | null;
  triggeringEventType?: string | null;
}

// --- Event type aliases ---

export type OpportunityCreatedEvent = HCIEventEnvelope<OpportunityCreatedPayload> & {
  eventType: 'OpportunityCreated';
};

export type OpportunityUpdatedEvent = HCIEventEnvelope<OpportunityUpdatedPayload> & {
  eventType: 'OpportunityUpdated';
};

export type OpportunityClosedEvent = HCIEventEnvelope<OpportunityClosedPayload> & {
  eventType: 'OpportunityClosed';
};

export type OpportunityRejectedEvent = HCIEventEnvelope<OpportunityRejectedPayload> & {
  eventType: 'OpportunityRejected';
};

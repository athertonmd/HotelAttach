/**
 * Behaviour Intelligence Domain Events
 * Derived from: schemas/behaviour-profile-updated, archetype-assigned,
 * booking-attributed, behaviour-drift-detected, fatigue-threshold-crossed,
 * action-recommended, communication-suppressed, communication-suppressed-by-fatigue,
 * prediction-outcome-recorded
 * Published by the Behaviour Intelligence service.
 */

import type { HCIEventEnvelope } from './envelope.js';

// --- Shared enums ---

export type BehaviourSegment =
  | 'self_sufficient'
  | 'reliable_late'
  | 'needs_prompting'
  | 'requires_intervention'
  | 'non_compliant';

export type BehaviourChannel = 'email' | 'sms' | 'push_notification' | 'in_app';

export type TravellerArchetypeType =
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

export type FatigueDirection = 'increasing' | 'decreasing';

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

export type PredictionOutcome =
  | 'booked_independently'
  | 'booked_after_communication'
  | 'booked_after_escalation'
  | 'expired_unbooked'
  | 'cancelled';

// --- Payload interfaces ---

export interface BehaviourProfileUpdatedPayload {
  travellerId: string;
  tenantId: string;
  corporateId: string;
  avgLeadTimeDays: number;
  bookingConsistency: number;
  bookingVariabilityDays: number;
  complianceRate: number;
  avgResponseTimeHours: number;
  preferredChannel: BehaviourChannel;
  selfBookingRate: number;
  tripsAnalysed: number;
  tripCountUsed: number;
  predictedLeadTimeDays: number;
  confidenceScore: number;
  segment: BehaviourSegment;
  triggeringEventId: string;
  triggeringEventType: string;
  calculatedAt: string;
}

export interface ArchetypeAssignedPayload {
  travellerId: string;
  tenantId: string;
  corporateId: string;
  archetype: TravellerArchetypeType;
  previousArchetype?: TravellerArchetypeType | null;
  confidence: number;
  triggeringEventId: string;
  triggeringEventType: string;
  assignedAt: string;
}

export interface BookingAttributedPayload {
  attributionId: string;
  bookingId: string;
  travellerId: string;
  tenantId: string;
  corporateId: string;
  opportunityId?: string | null;
  attributionType: AttributionType;
  communicationId?: string | null;
  attributionWindowHours?: number | null;
  hoursFromCommunication?: number | null;
  confidence: number;
  estimatedCommission: number;
  triggeringEventId: string;
  triggeringEventType: string;
  attributedAt: string;
}

export interface BehaviourDriftDetectedPayload {
  travellerId: string;
  tenantId: string;
  corporateId: string;
  driftScore: number;
  stabilityScore: number;
  driftStatus: DriftStatus;
  previousStatus: DriftStatus;
  driftDirection: DriftDirection;
  triggeringEventId: string;
  triggeringEventType: string;
  detectedAt: string;
}

export interface FatigueThresholdCrossedPayload {
  travellerId: string;
  tenantId: string;
  corporateId: string;
  fatigueScore: number;
  fatigueLevel: FatigueLevel;
  previousLevel: FatigueLevel;
  direction: FatigueDirection;
  comms30d: number;
  ignoredRate: number;
  triggeringEventId: string;
  triggeringEventType: string;
  crossedAt: string;
}

export interface ActionRecommendedPayload {
  recommendationId: string;
  opportunityId: string;
  travellerId: string;
  tenantId: string;
  corporateId: string;
  action: RecommendedActionType;
  confidence: number;
  explanationText: string;
  predictedLeadTimeDays: number;
  daysToDeparture: number;
  estimatedRevenueAtRisk: number;
  fatigueLevel: FatigueLevel;
  driftStatus: DriftStatus;
  archetype: TravellerArchetypeType;
  expiresAt: string;
  triggeringEventId: string;
  triggeringEventType: string;
  recommendedAt: string;
}

export interface CommunicationSuppressedPayload {
  suppressionId: string;
  opportunityId: string;
  travellerId: string;
  tenantId: string;
  corporateId: string;
  suppressionReason: SuppressionReason;
  suppressedChannel: BehaviourChannel;
  estimatedCostAvoided: number;
  daysToDeparture: number;
  predictedBookingDate?: string | null;
  triggeringEventId: string;
  triggeringEventType: string;
  suppressedAt: string;
}

export interface CommunicationSuppressedByFatiguePayload {
  suppressionId: string;
  opportunityId: string;
  travellerId: string;
  tenantId: string;
  corporateId: string;
  fatigueScore: number;
  fatigueLevel: 'high' | 'critical';
  suppressedChannel: BehaviourChannel;
  comms30d: number;
  estimatedCostAvoided: number;
  triggeringEventId: string;
  triggeringEventType: string;
  suppressedAt: string;
}

export interface PredictionOutcomeRecordedPayload {
  predictionId: string;
  recommendationId: string;
  travellerId: string;
  tenantId: string;
  corporateId: string;
  opportunityId: string;
  recommendedAction: RecommendedActionType;
  actualOutcome: PredictionOutcome;
  wasCorrect: boolean;
  daysDifference: number;
  confidenceAtPrediction?: number | null;
  archetype?: TravellerArchetypeType | null;
  destination?: string | null;
  triggeringEventId: string;
  triggeringEventType: string;
  resolvedAt: string;
}

// --- Event type aliases ---

export type BehaviourProfileUpdatedEvent = HCIEventEnvelope<BehaviourProfileUpdatedPayload> & {
  eventType: 'BehaviourProfileUpdated';
};

export type ArchetypeAssignedEvent = HCIEventEnvelope<ArchetypeAssignedPayload> & {
  eventType: 'ArchetypeAssigned';
};

export type BookingAttributedEvent = HCIEventEnvelope<BookingAttributedPayload> & {
  eventType: 'BookingAttributed';
};

export type BehaviourDriftDetectedEvent = HCIEventEnvelope<BehaviourDriftDetectedPayload> & {
  eventType: 'BehaviourDriftDetected';
};

export type FatigueThresholdCrossedEvent = HCIEventEnvelope<FatigueThresholdCrossedPayload> & {
  eventType: 'FatigueThresholdCrossed';
};

export type ActionRecommendedEvent = HCIEventEnvelope<ActionRecommendedPayload> & {
  eventType: 'ActionRecommended';
};

export type CommunicationSuppressedEvent = HCIEventEnvelope<CommunicationSuppressedPayload> & {
  eventType: 'CommunicationSuppressed';
};

export type CommunicationSuppressedByFatigueEvent =
  HCIEventEnvelope<CommunicationSuppressedByFatiguePayload> & {
    eventType: 'CommunicationSuppressedByFatigue';
  };

export type PredictionOutcomeRecordedEvent = HCIEventEnvelope<PredictionOutcomeRecordedPayload> & {
  eventType: 'PredictionOutcomeRecorded';
};

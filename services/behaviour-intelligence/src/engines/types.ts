/**
 * Shared types for Behaviour Intelligence engines.
 * Engines are pure computation units — no I/O, no events, no repositories.
 */

import type {
  BehaviourSegment,
  ArchetypeType,
  AttributionType,
  BehaviourChannel,
  RecommendedActionType,
  PredictionOutcomeType,
  FatigueLevel,
  DriftStatus,
  DriftDirection,
  RiskTier,
} from '../domain/index.js';

// ============================================================
// BehaviourProfileEngine
// ============================================================

export interface ProfileEngineInput {
  travellerId: string;
  tenantId: string;
  corporateId: string;
  /** Booking lead times in days per trip */
  leadTimesPerTrip: number[];
  /** Booking timestamps — ISO strings or Dates */
  bookingTimestamps: string[];
  /** Which trips had hotel compliance */
  complianceFlags: boolean[];
  /** Response times to communications in hours */
  responseTimesHours: number[];
  /** Channel of each communication response */
  channelsUsed: BehaviourChannel[];
  /** Number of trips booked independently (self-booking) */
  selfBookedCount: number;
  /** Total trips to consider */
  totalTrips: number;
  /** Maximum trips to use for calculation (sliding window) */
  maxTripsUsed?: number;
}

export interface ProfileEngineResult {
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
}

// ============================================================
// ArchetypeAssignmentEngine
// ============================================================

export interface ArchetypeEngineInput {
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
  segment: BehaviourSegment;
  previousArchetype: ArchetypeType | null;
}

export interface ArchetypeEngineResult {
  archetype: ArchetypeType;
  confidence: number;
  previousArchetype: ArchetypeType | null;
  isChanged: boolean;
}

// ============================================================
// BookingAttributionEngine
// ============================================================

export interface AttributionEngineInput {
  bookingId: string;
  travellerId: string;
  tenantId: string;
  corporateId: string;
  opportunityId?: string | null;
  /** Recent communications sorted newest-first */
  recentCommunications: CommunicationRecord[];
  estimatedCommission: number;
  /** Whether traveller booked independently with no comms context */
  isIndependentBooking: boolean;
}

export interface CommunicationRecord {
  communicationId: string;
  channel: AttributionType;
  sentAt: Date;
}

export interface AttributionEngineResult {
  attributionType: AttributionType;
  communicationId: string | null;
  hoursFromCommunication: number | null;
  attributionWindowHours: number | null;
  confidence: number;
  estimatedCommission: number;
}

// ============================================================
// BehaviourDriftEngine
// ============================================================

export interface DriftEngineInput {
  travellerId: string;
  tenantId: string;
  corporateId: string;
  /** Current profile metrics */
  current: {
    avgLeadTimeDays: number;
    bookingConsistency: number;
    complianceRate: number;
    selfBookingRate: number;
    avgResponseTimeHours: number;
    tripCountUsed: number;
  };
  /** Historical baseline metrics */
  baseline: {
    avgLeadTimeDays: number;
    bookingConsistency: number;
    complianceRate: number;
    selfBookingRate: number;
    avgResponseTimeHours: number;
  };
}

export interface DriftEngineResult {
  driftScore: number;
  stabilityScore: number;
  driftStatus: DriftStatus;
  driftDirection: DriftDirection;
}

// ============================================================
// CommunicationFatigueEngine
// ============================================================

export interface FatigueEngineInput {
  travellerId: string;
  tenantId: string;
  corporateId: string;
  comms30d: number;
  ignoredCount: number;
  declinedCount: number;
  positiveResponses: number;
  independentBookings: number;
  daysSinceLastComm: number;
  currentScore?: number;
}

export interface FatigueEngineResult {
  fatigueScore: number;
  fatigueLevel: FatigueLevel;
  comms30d: number;
  ignoredRate: number;
  shouldSuppress: boolean;
  suppressionReason: string | null;
}

// ============================================================
// RevenueRiskEngine
// ============================================================

export interface RevenueRiskEngineInput {
  travellerId: string;
  tenantId: string;
  corporateId: string;
  estimatedCommission: number;
  attachmentLikelihood: number;
  /** Optional: days until departure for urgency weighting */
  daysToDeparture?: number;
}

export interface RevenueRiskEngineResult {
  estimatedCommission: number;
  attachmentLikelihood: number;
  revenueAtRisk: number;
  riskTier: RiskTier;
  /** Urgency factor 0–1 based on days to departure */
  urgencyFactor: number;
  /** Weighted risk = revenueAtRisk × urgencyFactor */
  weightedRisk: number;
}

// ============================================================
// RecommendedActionEngine
// ============================================================

export interface ActionEngineInput {
  travellerId: string;
  tenantId: string;
  corporateId: string;
  segment: BehaviourSegment;
  archetype: ArchetypeType;
  confidenceScore: number;
  predictedLeadTimeDays: number;
  daysToDeparture: number;
  fatigueScore: number;
  fatigueLevel: FatigueLevel;
  driftStatus: DriftStatus;
  driftScore: number;
  revenueAtRisk: number;
  riskTier: RiskTier;
}

export interface ActionEngineResult {
  action: RecommendedActionType;
  confidence: number;
  explanationText: string;
  fatigueLevel: FatigueLevel;
  driftStatus: DriftStatus;
  daysToDeparture: number;
  predictedLeadTimeDays: number;
  estimatedRevenueAtRisk: number;
}

// ============================================================
// PredictionOutcomeEngine
// ============================================================

export interface PredictionOutcomeEngineInput {
  recommendationId: string;
  travellerId: string;
  tenantId: string;
  corporateId: string;
  opportunityId: string;
  recommendedAction: RecommendedActionType;
  actualOutcome: PredictionOutcomeType;
  predictedBookingDate?: string;
  actualBookingDate?: string;
}

export interface PredictionOutcomeEngineResult {
  wasCorrect: boolean;
  daysDifference: number;
  /** Accuracy category for model feedback */
  accuracyBand: 'exact' | 'close' | 'off' | 'missed';
}

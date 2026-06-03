export type {
  MatchStatus,
  MatchConfidenceBand,
  CoverageStatus,
  ReconciliationSource,
  RejectionReason,
} from './enums.js';
export {
  DateRange,
  ConfidenceScore,
  type LocationMatch,
  type TravellerMatch,
} from './value-objects.js';
export type { MatchReason, ReconciliationAuditExplanation } from './types.js';
export { HotelBooking, type CreateHotelBookingInput } from './hotel-booking.js';
export {
  ReconciliationCandidate,
  type CreateReconciliationCandidateInput,
} from './reconciliation-candidate.js';
export { CoverageAssessment, type CreateCoverageAssessmentInput } from './coverage-assessment.js';
export { OrphanBooking, type CreateOrphanBookingInput } from './orphan-booking.js';
export {
  evaluateTravellerMatch,
  evaluateDestinationMatch,
  evaluateDateMatch,
  evaluateBookingProximity,
} from './matching/index.js';
export {
  ReconciliationDecisionService,
  type ReconciliationResult,
  type ReconciliationInput,
} from './reconciliation-decision.js';

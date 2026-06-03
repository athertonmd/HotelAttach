/**
 * Booking Reconciliation domain enums.
 * Source: Project 2 Specification, Business Rules Catalogue BR-200, BR-300
 */

/** Reconciliation match lifecycle states */
export type MatchStatus =
  | 'unmatched'
  | 'candidate'
  | 'matched'
  | 'verified'
  | 'rejected'
  | 'expired'
  | 'cancelled';

/** Confidence band thresholds (Project 2 §Confidence Thresholds) */
export type MatchConfidenceBand = 'matched' | 'candidate' | 'rejected';

/** Accommodation coverage status (BR-301 to BR-305) */
export type CoverageStatus =
  | 'fully_covered' // BR-301: 100%
  | 'mostly_covered' // BR-302: 80–99%
  | 'partially_covered' // BR-303: 50–79%
  | 'minimally_covered' // BR-304: 1–49%
  | 'no_accommodation'; // BR-305: 0%

/** Source that triggered reconciliation evaluation */
export type ReconciliationSource =
  | 'booking_created'
  | 'booking_updated'
  | 'trip_created'
  | 'trip_updated'
  | 'segment_added'
  | 'segment_updated'
  | 'segment_removed'
  | 'traveller_updated'
  | 'manual_review';

/** Reasons for rejection */
export type RejectionReason =
  | 'LOW_CONFIDENCE'
  | 'NO_MATCHING_TRIP'
  | 'DESTINATION_MISMATCH'
  | 'DATE_MISMATCH'
  | 'MANUAL_REJECTION';

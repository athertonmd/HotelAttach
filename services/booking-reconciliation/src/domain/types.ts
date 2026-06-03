/**
 * Shared domain types/interfaces for Booking Reconciliation.
 * Every reconciliation decision must include audit explanation with rule IDs.
 */

import type { MatchConfidenceBand, MatchStatus, RejectionReason } from './enums.js';

/** A single match reason with its contributing rule */
export interface MatchReason {
  /** Business Rules Catalogue rule ID (e.g., "BR-201") */
  ruleId: string;
  /** Human-readable rule name */
  ruleName: string;
  /** Reason code for event payload */
  reasonCode: string;
  /** Score contribution from this rule */
  score: number;
}

/** Full audit explanation for a reconciliation decision */
export interface ReconciliationAuditExplanation {
  /** Tenant isolation */
  tenantId: string;
  /** The booking being evaluated */
  bookingId: string;
  /** The traveller */
  travellerId: string;
  /** The candidate trip (null if orphan) */
  candidateTripId: string | null;
  /** Final confidence score (0–100) */
  confidence: number;
  /** Confidence band determination */
  confidenceBand: MatchConfidenceBand;
  /** Match status decision */
  matchStatus: MatchStatus;
  /** All rules that were applied */
  matchReasons: MatchReason[];
  /** All rule IDs that contributed */
  ruleIdsApplied: string[];
  /** Human-readable explanation */
  explanation: string;
  /** Rejection reason if applicable */
  rejectionReason?: RejectionReason;
  /** When the decision was made */
  decidedAt: Date;
}

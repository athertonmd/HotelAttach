/**
 * ReconciliationDecisionService — combines match reasons and produces a final decision.
 * Source: Project 2 Specification §Confidence Thresholds, §Reconciliation States
 */

import type { HotelBooking } from './hotel-booking.js';
import type { ReconciliationCandidate } from './reconciliation-candidate.js';
import type { MatchReason } from './types.js';
import type { MatchStatus, MatchConfidenceBand, RejectionReason } from './enums.js';
import { ConfidenceScore } from './value-objects.js';
import { evaluateTravellerMatch } from './matching/traveller-match.js';
import { evaluateDestinationMatch } from './matching/destination-match.js';
import { evaluateDateMatch } from './matching/date-match.js';
import { evaluateBookingProximity } from './matching/booking-proximity.js';

export interface ReconciliationResult {
  tenantId: string;
  bookingId: string;
  travellerId: string;
  candidateTripId: string | null;
  confidenceScore: number;
  confidenceBand: MatchConfidenceBand;
  matchStatus: MatchStatus;
  matchReasons: MatchReason[];
  ruleIdsApplied: string[];
  auditExplanation: string;
  rejectionReason: RejectionReason | null;
  decidedAt: Date;
}

interface CandidateEvaluation {
  candidate: ReconciliationCandidate;
  reasons: MatchReason[];
  score: number;
}

function deriveConfidenceBand(score: number): MatchConfidenceBand {
  if (score >= 80) return 'matched';
  if (score >= 60) return 'candidate';
  return 'rejected';
}

function deriveMatchStatus(score: number, hasCandidates: boolean): MatchStatus {
  if (!hasCandidates) return 'unmatched'; // orphaned
  if (score >= 80) return 'matched';
  if (score >= 60) return 'candidate';
  return 'rejected';
}

function buildExplanation(
  status: MatchStatus,
  score: number,
  reasons: MatchReason[],
  candidateTripId: string | null,
): string {
  if (status === 'unmatched') {
    return 'No candidate trips found. Booking enters orphan state.';
  }
  const ruleList = reasons.map((r) => `${r.ruleId} (${r.ruleName})`).join(', ');
  if (status === 'matched') {
    return `Matched to trip ${candidateTripId} with confidence ${score}. Rules: ${ruleList}`;
  }
  if (status === 'candidate') {
    return `Candidate match to trip ${candidateTripId} with confidence ${score}. Manual review required. Rules: ${ruleList}`;
  }
  return `Rejected with confidence ${score}. Rules evaluated: ${ruleList || 'none'}`;
}

export interface ReconciliationInput {
  travellerEmployeeNumber?: string | null;
  travellerEmail?: string | null;
  tripCreatedDate?: Date;
}

export class ReconciliationDecisionService {
  evaluate(
    booking: HotelBooking,
    candidates: ReconciliationCandidate[],
    input: ReconciliationInput = {},
  ): ReconciliationResult {
    const now = new Date();

    // No candidates = orphan
    if (candidates.length === 0) {
      return {
        tenantId: booking.tenantId,
        bookingId: booking.bookingId,
        travellerId: booking.travellerId,
        candidateTripId: null,
        confidenceScore: 0,
        confidenceBand: 'rejected',
        matchStatus: 'unmatched',
        matchReasons: [],
        ruleIdsApplied: [],
        auditExplanation: buildExplanation('unmatched', 0, [], null),
        rejectionReason: null,
        decidedAt: now,
      };
    }

    // Evaluate each candidate
    const evaluations: CandidateEvaluation[] = candidates.map((candidate) => {
      const reasons: MatchReason[] = [];

      // Traveller matching
      reasons.push(
        ...evaluateTravellerMatch({
          bookingTravellerId: booking.travellerId,
          tripTravellerId: candidate.travellerId,
          bookingEmployeeNumber: booking.employeeNumber,
          tripEmployeeNumber: input.travellerEmployeeNumber ?? null,
          bookingEmail: booking.email,
          tripEmail: input.travellerEmail ?? null,
        }),
      );

      // Destination matching
      reasons.push(
        ...evaluateDestinationMatch({
          hotelCity: booking.city,
          tripDestinationCity: candidate.tripDestinationCity,
          hotelCountry: booking.country,
          tripDestinationCountry: candidate.tripDestinationCountry,
        }),
      );

      // Date matching
      reasons.push(
        ...evaluateDateMatch({
          hotelStayRange: booking.stayRange,
          tripRange: candidate.tripRange,
        }),
      );

      // Booking proximity
      if (input.tripCreatedDate) {
        reasons.push(
          ...evaluateBookingProximity({
            hotelBookingDate: booking.bookingDate,
            tripCreatedDate: input.tripCreatedDate,
          }),
        );
      }

      const totalScore = reasons.reduce((sum, r) => sum + r.score, 0);
      const capped = new ConfidenceScore(Math.min(100, totalScore));

      return { candidate, reasons, score: capped.value };
    });

    // Select highest scoring candidate
    evaluations.sort((a, b) => b.score - a.score);
    const best = evaluations[0];
    if (!best) {
      // This should never happen since we checked candidates.length > 0 above
      throw new Error('No evaluations produced');
    }

    const band = deriveConfidenceBand(best.score);
    const status = deriveMatchStatus(best.score, true);
    const ruleIds = best.reasons.map((r) => r.ruleId);

    return {
      tenantId: booking.tenantId,
      bookingId: booking.bookingId,
      travellerId: booking.travellerId,
      candidateTripId: best.candidate.candidateTripId,
      confidenceScore: best.score,
      confidenceBand: band,
      matchStatus: status,
      matchReasons: best.reasons,
      ruleIdsApplied: ruleIds,
      auditExplanation: buildExplanation(
        status,
        best.score,
        best.reasons,
        best.candidate.candidateTripId,
      ),
      rejectionReason: status === 'rejected' ? 'LOW_CONFIDENCE' : null,
      decidedAt: now,
    };
  }
}

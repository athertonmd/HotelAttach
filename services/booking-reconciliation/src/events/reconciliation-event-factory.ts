/**
 * Event factories for Booking Reconciliation output events.
 * Maps domain results to HotelMatched, HotelRejected, HotelCoverageUpdated, HotelOrphanDetected.
 */

import {
  createEnvelope,
  type HotelMatchedPayload,
  type HotelRejectedPayload,
  type HotelCoverageUpdatedPayload,
  type HotelOrphanDetectedPayload,
} from '@hci/event-contracts';
import { randomUUID } from 'node:crypto';
import type { ReconciliationResult } from '../domain/reconciliation-decision.js';
import type { CoverageAssessment } from '../domain/coverage-assessment.js';
import type { HotelBooking } from '../domain/hotel-booking.js';
import type { EventFactoryResult, CorrelationContext } from './types.js';
import { buildEnvelopeOptions } from './helpers.js';

const SOURCE_SERVICE = 'hci\\.reconciliation';

export function createHotelMatchedEvent(
  result: ReconciliationResult,
  context: CorrelationContext = {},
): EventFactoryResult<HotelMatchedPayload> {
  try {
    if (result.matchStatus !== 'matched') {
      return { success: false, error: 'Cannot create HotelMatched event for non-matched result' };
    }
    if (!result.candidateTripId) {
      return { success: false, error: 'candidateTripId is required for HotelMatched' };
    }

    const payload: HotelMatchedPayload = {
      matchId: randomUUID(),
      tripId: result.candidateTripId,
      bookingId: result.bookingId,
      travellerId: result.travellerId,
      tenantId: result.tenantId,
      confidence: result.confidenceScore,
      reasonCodes: result.matchReasons.map((r) => r.reasonCode),
      matchedAt: result.decidedAt.toISOString(),
    };

    const event = createEnvelope<HotelMatchedPayload>(
      buildEnvelopeOptions({
        eventType: 'HotelMatched',
        tenantId: result.tenantId,
        corporateId: result.tenantId,
        sourceService: SOURCE_SERVICE,
        correlationId: context.correlationId,
        payload,
      }),
    );
    return { success: true, event };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export function createHotelRejectedEvent(
  result: ReconciliationResult,
  context: CorrelationContext = {},
): EventFactoryResult<HotelRejectedPayload> {
  try {
    if (result.matchStatus !== 'rejected') {
      return { success: false, error: 'Cannot create HotelRejected event for non-rejected result' };
    }

    const payload: HotelRejectedPayload = {
      bookingId: result.bookingId,
      travellerId: result.travellerId,
      tenantId: result.tenantId,
      reason: result.rejectionReason ?? 'LOW_CONFIDENCE',
      highestConfidence: result.confidenceScore,
      evaluatedAt: result.decidedAt.toISOString(),
      candidateTripId: result.candidateTripId ?? null,
      candidateScore: result.candidateTripId ? result.confidenceScore : null,
    };

    const event = createEnvelope<HotelRejectedPayload>(
      buildEnvelopeOptions({
        eventType: 'HotelRejected',
        tenantId: result.tenantId,
        corporateId: result.tenantId,
        sourceService: SOURCE_SERVICE,
        correlationId: context.correlationId,
        payload,
      }),
    );
    return { success: true, event };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export function createHotelCoverageUpdatedEvent(
  assessment: CoverageAssessment,
  context: CorrelationContext = {},
): EventFactoryResult<HotelCoverageUpdatedPayload> {
  try {
    if (!assessment.tenantId) {
      return { success: false, error: 'tenantId is required' };
    }

    const payload: HotelCoverageUpdatedPayload = {
      tripId: assessment.tripId,
      tenantId: assessment.tenantId,
      coveragePercent: assessment.coveragePercent,
      coverageStatus: assessment.coverageStatus,
      totalNightsRequired: assessment.totalNightsRequired,
      nightsCovered: assessment.nightsCovered,
      calculatedAt: assessment.calculatedAt.toISOString(),
      matchedBookingIds: assessment.matchedBookingIds,
      previousCoveragePercent: assessment.previousCoveragePercent,
    };

    const event = createEnvelope<HotelCoverageUpdatedPayload>(
      buildEnvelopeOptions({
        eventType: 'HotelCoverageUpdated',
        tenantId: assessment.tenantId,
        corporateId: assessment.tenantId,
        sourceService: SOURCE_SERVICE,
        correlationId: context.correlationId,
        payload,
      }),
    );
    return { success: true, event };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export function createHotelOrphanDetectedEvent(
  booking: HotelBooking,
  detectedAt: Date,
  reassociationDeadline: Date,
  context: CorrelationContext = {},
): EventFactoryResult<HotelOrphanDetectedPayload> {
  try {
    if (!booking.tenantId) {
      return { success: false, error: 'tenantId is required' };
    }

    const payload: HotelOrphanDetectedPayload = {
      bookingId: booking.bookingId,
      travellerId: booking.travellerId,
      tenantId: booking.tenantId,
      hotelName: booking.hotelName,
      city: booking.city,
      country: booking.country,
      checkinDate: booking.checkinDate.toISOString(),
      checkoutDate: booking.checkoutDate.toISOString(),
      detectedAt: detectedAt.toISOString(),
      reassociationDeadline: reassociationDeadline.toISOString(),
      roomNights: booking.roomNights,
      hotelChain: booking.hotelChain,
    };

    const event = createEnvelope<HotelOrphanDetectedPayload>(
      buildEnvelopeOptions({
        eventType: 'HotelOrphanDetected',
        tenantId: booking.tenantId,
        corporateId: booking.tenantId,
        sourceService: SOURCE_SERVICE,
        correlationId: context.correlationId,
        payload,
      }),
    );
    return { success: true, event };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

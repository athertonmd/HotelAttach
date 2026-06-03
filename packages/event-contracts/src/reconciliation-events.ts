/**
 * Reconciliation Domain Events
 * Derived from: schemas/hotel-matched, hotel-rejected, hotel-coverage-updated, hotel-orphan-detected
 * Published by the Booking Reconciliation Engine.
 */

import type { HCIEventEnvelope } from './envelope.js';

export interface HotelMatchedPayload {
  matchId: string;
  tripId: string;
  bookingId: string;
  travellerId: string;
  tenantId: string;
  confidence: number;
  reasonCodes: string[];
  coveragePercent?: number | null;
  matchedAt?: string | null;
}

export type CoverageStatus =
  | 'fully_covered'
  | 'mostly_covered'
  | 'partially_covered'
  | 'minimally_covered'
  | 'no_accommodation';

export interface HotelCoverageUpdatedPayload {
  tripId: string;
  tenantId: string;
  coveragePercent: number;
  coverageStatus: CoverageStatus;
  totalNightsRequired: number;
  nightsCovered: number;
  calculatedAt: string;
  matchedBookingIds?: string[];
  previousCoveragePercent?: number | null;
}

export interface HotelRejectedPayload {
  bookingId: string;
  travellerId: string;
  tenantId: string;
  reason: string;
  highestConfidence: number;
  evaluatedAt: string;
  candidateTripId?: string | null;
  candidateScore?: number | null;
}

export interface HotelOrphanDetectedPayload {
  bookingId: string;
  travellerId: string;
  tenantId: string;
  hotelName: string;
  city: string;
  country: string;
  checkinDate: string;
  checkoutDate: string;
  detectedAt: string;
  reassociationDeadline: string;
  roomNights?: number | null;
  hotelChain?: string | null;
}

export type HotelMatchedEvent = HCIEventEnvelope<HotelMatchedPayload> & {
  eventType: 'HotelMatched';
};

export type HotelRejectedEvent = HCIEventEnvelope<HotelRejectedPayload> & {
  eventType: 'HotelRejected';
};

export type HotelCoverageUpdatedEvent = HCIEventEnvelope<HotelCoverageUpdatedPayload> & {
  eventType: 'HotelCoverageUpdated';
};

export type HotelOrphanDetectedEvent = HCIEventEnvelope<HotelOrphanDetectedPayload> & {
  eventType: 'HotelOrphanDetected';
};

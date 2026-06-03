/**
 * Repository interfaces for Booking Reconciliation.
 * All queries require tenantId for mandatory tenant isolation.
 */

import type { HotelBooking } from '../domain/hotel-booking.js';
import type { OrphanBooking } from '../domain/orphan-booking.js';
import type { CoverageAssessment } from '../domain/coverage-assessment.js';
import type { ReconciliationResult } from '../domain/reconciliation-decision.js';
import type { ReconciliationCandidate } from '../domain/reconciliation-candidate.js';

export interface HotelBookingRepository {
  findById(tenantId: string, bookingId: string): Promise<HotelBooking | undefined>;
  save(booking: HotelBooking): Promise<void>;
  remove(tenantId: string, bookingId: string): Promise<void>;
}

export interface ReconciliationMatchRepository {
  findByBooking(tenantId: string, bookingId: string): Promise<ReconciliationResult | undefined>;
  findByTrip(tenantId: string, tripId: string): Promise<ReconciliationResult[]>;
  save(result: ReconciliationResult): Promise<void>;
  removeByBooking(tenantId: string, bookingId: string): Promise<void>;
}

export interface OrphanBookingRepository {
  findById(tenantId: string, bookingId: string): Promise<OrphanBooking | undefined>;
  findByTraveller(tenantId: string, travellerId: string): Promise<OrphanBooking[]>;
  findAll(tenantId: string): Promise<OrphanBooking[]>;
  save(orphan: OrphanBooking): Promise<void>;
  remove(tenantId: string, bookingId: string): Promise<void>;
}

export interface CoverageAssessmentRepository {
  findByTrip(tenantId: string, tripId: string): Promise<CoverageAssessment | undefined>;
  save(assessment: CoverageAssessment): Promise<void>;
}

export interface CandidateTripRepository {
  findCandidatesForBooking(
    tenantId: string,
    travellerId: string,
  ): Promise<ReconciliationCandidate[]>;
}

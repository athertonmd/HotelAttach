/**
 * In-memory repository implementations for testing.
 */

import type { HotelBooking } from '../domain/hotel-booking.js';
import type { OrphanBooking } from '../domain/orphan-booking.js';
import type { CoverageAssessment } from '../domain/coverage-assessment.js';
import type { ReconciliationResult } from '../domain/reconciliation-decision.js';
import type { ReconciliationCandidate } from '../domain/reconciliation-candidate.js';
import type {
  HotelBookingRepository,
  ReconciliationMatchRepository,
  OrphanBookingRepository,
  CoverageAssessmentRepository,
  CandidateTripRepository,
} from './interfaces.js';
import { VersionConflictError } from '../persistence/db-client.js';

export class InMemoryHotelBookingRepository implements HotelBookingRepository {
  private readonly store = new Map<string, HotelBooking>();

  async findById(tenantId: string, bookingId: string): Promise<HotelBooking | undefined> {
    return this.store.get(this.key(tenantId, bookingId));
  }

  async save(booking: HotelBooking): Promise<void> {
    const k = this.key(booking.tenantId, booking.bookingId);
    const existing = this.store.get(k);

    if (existing) {
      // Version conflict: reject stale versions (matches PgHotelBookingRepository behaviour)
      if (booking.bookingVersion < existing.bookingVersion) {
        throw new VersionConflictError(
          'HotelBooking',
          booking.bookingId,
          booking.bookingVersion,
          existing.bookingVersion,
        );
      }
      // Same version is idempotent — silently accept without overwriting
      if (booking.bookingVersion === existing.bookingVersion) {
        return;
      }
    }

    this.store.set(k, booking);
  }

  async remove(tenantId: string, bookingId: string): Promise<void> {
    this.store.delete(this.key(tenantId, bookingId));
  }

  private key(tenantId: string, bookingId: string): string {
    return `${tenantId}:${bookingId}`;
  }
}

export class InMemoryReconciliationMatchRepository implements ReconciliationMatchRepository {
  private readonly store = new Map<string, ReconciliationResult>();
  async findByBooking(
    tenantId: string,
    bookingId: string,
  ): Promise<ReconciliationResult | undefined> {
    const r = this.store.get(bookingId);
    return r && r.tenantId === tenantId ? r : undefined;
  }
  async findByTrip(tenantId: string, tripId: string): Promise<ReconciliationResult[]> {
    return [...this.store.values()].filter(
      (r) => r.tenantId === tenantId && r.candidateTripId === tripId,
    );
  }
  async save(result: ReconciliationResult): Promise<void> {
    this.store.set(result.bookingId, result);
  }
  async removeByBooking(tenantId: string, bookingId: string): Promise<void> {
    const r = this.store.get(bookingId);
    if (r && r.tenantId === tenantId) this.store.delete(bookingId);
  }
}

export class InMemoryOrphanBookingRepository implements OrphanBookingRepository {
  private readonly store = new Map<string, OrphanBooking>();
  async findById(tenantId: string, bookingId: string): Promise<OrphanBooking | undefined> {
    const o = this.store.get(bookingId);
    return o && o.tenantId === tenantId ? o : undefined;
  }
  async findByTraveller(tenantId: string, travellerId: string): Promise<OrphanBooking[]> {
    return [...this.store.values()].filter(
      (o) => o.tenantId === tenantId && o.travellerId === travellerId,
    );
  }
  async findAll(tenantId: string): Promise<OrphanBooking[]> {
    return [...this.store.values()].filter((o) => o.tenantId === tenantId);
  }
  async save(orphan: OrphanBooking): Promise<void> {
    this.store.set(orphan.bookingId, orphan);
  }
  async remove(tenantId: string, bookingId: string): Promise<void> {
    const o = this.store.get(bookingId);
    if (o && o.tenantId === tenantId) this.store.delete(bookingId);
  }
}

export class InMemoryCoverageAssessmentRepository implements CoverageAssessmentRepository {
  private readonly store = new Map<string, CoverageAssessment>();
  async findByTrip(tenantId: string, tripId: string): Promise<CoverageAssessment | undefined> {
    const a = this.store.get(tripId);
    return a && a.tenantId === tenantId ? a : undefined;
  }
  async save(assessment: CoverageAssessment): Promise<void> {
    this.store.set(assessment.tripId, assessment);
  }
}

export class InMemoryCandidateTripRepository implements CandidateTripRepository {
  private readonly candidates: ReconciliationCandidate[] = [];
  addCandidate(c: ReconciliationCandidate): void {
    this.candidates.push(c);
  }
  async findCandidatesForBooking(
    tenantId: string,
    travellerId: string,
  ): Promise<ReconciliationCandidate[]> {
    return this.candidates.filter((c) => c.tenantId === tenantId && c.travellerId === travellerId);
  }
  clear(): void {
    this.candidates.length = 0;
  }
}

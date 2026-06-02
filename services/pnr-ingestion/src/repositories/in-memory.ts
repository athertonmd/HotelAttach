/**
 * In-memory repository implementations for testing and local development.
 * Not suitable for production — use Aurora PostgreSQL implementations instead.
 *
 * These implementations enforce:
 * - Tenant isolation (data keyed by tenantId)
 * - Optimistic version checking where applicable
 * - Timeline event immutability
 */

import type { Traveller } from '../domain/traveller.js';
import type { PNR } from '../domain/pnr.js';
import type { Trip } from '../domain/trip.js';
import type { Segment } from '../domain/segment.js';
import type { TimelineEvent } from '../domain/timeline-event.js';
import {
  type TravellerRepository,
  type PNRRepository,
  type TripRepository,
  type SegmentRepository,
  type TimelineEventRepository,
  VersionConflictError,
} from './interfaces.js';

export class InMemoryTravellerRepository implements TravellerRepository {
  private readonly store = new Map<string, Traveller>();

  async findById(tenantId: string, travellerId: string): Promise<Traveller | undefined> {
    const key = `${tenantId}:${travellerId}`;
    return this.store.get(key);
  }

  async findByEmail(tenantId: string, email: string): Promise<Traveller | undefined> {
    for (const traveller of this.store.values()) {
      if (traveller.tenantId === tenantId && traveller.email === email) {
        return traveller;
      }
    }
    return undefined;
  }

  async findByTenant(tenantId: string): Promise<Traveller[]> {
    const results: Traveller[] = [];
    for (const traveller of this.store.values()) {
      if (traveller.tenantId === tenantId) {
        results.push(traveller);
      }
    }
    return results;
  }

  async findByCorporate(tenantId: string, corporateId: string): Promise<Traveller[]> {
    const results: Traveller[] = [];
    for (const traveller of this.store.values()) {
      if (traveller.tenantId === tenantId && traveller.corporateId === corporateId) {
        results.push(traveller);
      }
    }
    return results;
  }

  async save(traveller: Traveller): Promise<void> {
    const key = `${traveller.tenantId}:${traveller.travellerId}`;
    this.store.set(key, traveller);
  }

  clear(): void {
    this.store.clear();
  }
}

export class InMemoryPNRRepository implements PNRRepository {
  private readonly store = new Map<string, PNR>();

  async findById(tenantId: string, pnrId: string): Promise<PNR | undefined> {
    const key = `${tenantId}:${pnrId}`;
    return this.store.get(key);
  }

  async findByRecordLocator(tenantId: string, recordLocator: string): Promise<PNR | undefined> {
    for (const pnr of this.store.values()) {
      if (pnr.tenantId === tenantId && pnr.recordLocator === recordLocator) {
        return pnr;
      }
    }
    return undefined;
  }

  async findByTenant(tenantId: string): Promise<PNR[]> {
    const results: PNR[] = [];
    for (const pnr of this.store.values()) {
      if (pnr.tenantId === tenantId) {
        results.push(pnr);
      }
    }
    return results;
  }

  async findByTraveller(tenantId: string, travellerId: string): Promise<PNR[]> {
    const results: PNR[] = [];
    for (const pnr of this.store.values()) {
      if (pnr.tenantId === tenantId && pnr.travellerId === travellerId) {
        results.push(pnr);
      }
    }
    return results;
  }

  async save(pnr: PNR, expectedVersion?: number): Promise<void> {
    const key = `${pnr.tenantId}:${pnr.pnrId}`;
    const existing = this.store.get(key);

    if (expectedVersion !== undefined && existing && existing.version !== expectedVersion) {
      throw new VersionConflictError('PNR', pnr.pnrId, expectedVersion, existing.version);
    }

    this.store.set(key, pnr);
  }

  clear(): void {
    this.store.clear();
  }
}

export class InMemoryTripRepository implements TripRepository {
  private readonly store = new Map<string, Trip>();

  async findById(tenantId: string, tripId: string): Promise<Trip | undefined> {
    const key = `${tenantId}:${tripId}`;
    return this.store.get(key);
  }

  async findByTraveller(tenantId: string, travellerId: string): Promise<Trip[]> {
    const results: Trip[] = [];
    for (const trip of this.store.values()) {
      if (trip.tenantId === tenantId && trip.travellerId === travellerId) {
        results.push(trip);
      }
    }
    return results;
  }

  async findByTenant(tenantId: string): Promise<Trip[]> {
    const results: Trip[] = [];
    for (const trip of this.store.values()) {
      if (trip.tenantId === tenantId) {
        results.push(trip);
      }
    }
    return results;
  }

  async save(trip: Trip): Promise<void> {
    const key = `${trip.tenantId}:${trip.tripId}`;
    this.store.set(key, trip);
  }

  clear(): void {
    this.store.clear();
  }
}

export class InMemorySegmentRepository implements SegmentRepository {
  private readonly store = new Map<string, { segment: Segment; tenantId: string }>();

  async findById(tenantId: string, segmentId: string): Promise<Segment | undefined> {
    const entry = this.store.get(segmentId);
    if (entry && entry.tenantId === tenantId) {
      return entry.segment;
    }
    return undefined;
  }

  async findByTrip(tenantId: string, tripId: string): Promise<Segment[]> {
    const results: Segment[] = [];
    for (const entry of this.store.values()) {
      if (entry.tenantId === tenantId && entry.segment.tripId === tripId) {
        results.push(entry.segment);
      }
    }
    return results;
  }

  async save(segment: Segment, expectedVersion?: number): Promise<void> {
    const existing = this.store.get(segment.segmentId);

    if (expectedVersion !== undefined && existing && existing.segment.version !== expectedVersion) {
      throw new VersionConflictError(
        'Segment',
        segment.segmentId,
        expectedVersion,
        existing.segment.version,
      );
    }

    // tenantId is derived from the trip — caller must provide it via a wrapper or context
    // For in-memory, we store it alongside the segment
    const tenantId = existing?.tenantId ?? segment.tripId; // fallback; real impl uses trip lookup
    this.store.set(segment.segmentId, { segment, tenantId });
  }

  /** Save with explicit tenantId (used in tests) */
  async saveWithTenant(
    tenantId: string,
    segment: Segment,
    expectedVersion?: number,
  ): Promise<void> {
    const existing = this.store.get(segment.segmentId);

    if (expectedVersion !== undefined && existing && existing.segment.version !== expectedVersion) {
      throw new VersionConflictError(
        'Segment',
        segment.segmentId,
        expectedVersion,
        existing.segment.version,
      );
    }

    this.store.set(segment.segmentId, { segment, tenantId });
  }

  async remove(tenantId: string, segmentId: string): Promise<void> {
    const entry = this.store.get(segmentId);
    if (entry && entry.tenantId === tenantId) {
      this.store.delete(segmentId);
    }
  }

  clear(): void {
    this.store.clear();
  }
}

export class InMemoryTimelineEventRepository implements TimelineEventRepository {
  private readonly store = new Map<string, { event: TimelineEvent; tenantId: string }>();

  async findById(tenantId: string, eventId: string): Promise<TimelineEvent | undefined> {
    const entry = this.store.get(eventId);
    if (entry && entry.tenantId === tenantId) {
      return entry.event;
    }
    return undefined;
  }

  async findByTrip(tenantId: string, tripId: string): Promise<TimelineEvent[]> {
    const results: TimelineEvent[] = [];
    for (const entry of this.store.values()) {
      if (entry.tenantId === tenantId && entry.event.tripId === tripId) {
        results.push(entry.event);
      }
    }
    return results.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  /**
   * Append a timeline event. Idempotent — duplicate eventId is a no-op.
   */
  async append(event: TimelineEvent): Promise<void> {
    if (this.store.has(event.eventId)) {
      return; // Idempotent: already exists
    }
    // tenantId derived from tripId context — in real impl, looked up from trip table
    this.store.set(event.eventId, { event, tenantId: event.tripId });
  }

  /** Append with explicit tenantId (used in tests) */
  async appendWithTenant(tenantId: string, event: TimelineEvent): Promise<void> {
    if (this.store.has(event.eventId)) {
      return;
    }
    this.store.set(event.eventId, { event, tenantId });
  }

  clear(): void {
    this.store.clear();
  }
}

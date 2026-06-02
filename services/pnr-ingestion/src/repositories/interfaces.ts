/**
 * Repository interfaces (persistence ports) for the Itinerary Intelligence Platform.
 *
 * These define the contract for data access. Implementations may be:
 * - In-memory (tests, local development)
 * - Aurora PostgreSQL (production)
 *
 * Rules (Architecture & Integration Guide §9):
 * - Each bounded context owns its own database schema
 * - No service may write to another service's schema
 * - Cross-service data access uses events, APIs, or read-model projections
 *
 * All queries require tenantId for mandatory tenant isolation.
 */

import type { Traveller } from '../domain/traveller.js';
import type { PNR } from '../domain/pnr.js';
import type { Trip } from '../domain/trip.js';
import type { Segment } from '../domain/segment.js';
import type { TimelineEvent } from '../domain/timeline-event.js';

/** Thrown when an optimistic version conflict is detected */
export class VersionConflictError extends Error {
  constructor(
    public readonly entityType: string,
    public readonly entityId: string,
    public readonly expectedVersion: number,
    public readonly actualVersion: number,
  ) {
    super(
      `Version conflict on ${entityType} ${entityId}: expected version ${expectedVersion}, found ${actualVersion}`,
    );
    this.name = 'VersionConflictError';
  }
}

export interface TravellerRepository {
  /** Find a traveller by ID within a tenant */
  findById(tenantId: string, travellerId: string): Promise<Traveller | undefined>;

  /** Find a traveller by email within a tenant */
  findByEmail(tenantId: string, email: string): Promise<Traveller | undefined>;

  /** Find all travellers for a tenant */
  findByTenant(tenantId: string): Promise<Traveller[]>;

  /** Find travellers by corporate within a tenant */
  findByCorporate(tenantId: string, corporateId: string): Promise<Traveller[]>;

  /** Create or update a traveller */
  save(traveller: Traveller): Promise<void>;
}

export interface PNRRepository {
  /** Find a PNR by ID within a tenant */
  findById(tenantId: string, pnrId: string): Promise<PNR | undefined>;

  /** Find a PNR by record locator within a tenant */
  findByRecordLocator(tenantId: string, recordLocator: string): Promise<PNR | undefined>;

  /** Find all PNRs for a tenant */
  findByTenant(tenantId: string): Promise<PNR[]>;

  /** Find PNRs by traveller within a tenant */
  findByTraveller(tenantId: string, travellerId: string): Promise<PNR[]>;

  /**
   * Save a PNR with optimistic version checking.
   * Throws VersionConflictError if the stored version is newer than expected.
   */
  save(pnr: PNR, expectedVersion?: number): Promise<void>;
}

export interface TripRepository {
  /** Find a trip by ID within a tenant */
  findById(tenantId: string, tripId: string): Promise<Trip | undefined>;

  /** Find all trips for a traveller within a tenant */
  findByTraveller(tenantId: string, travellerId: string): Promise<Trip[]>;

  /** Find all trips for a tenant */
  findByTenant(tenantId: string): Promise<Trip[]>;

  /** Create or update a trip */
  save(trip: Trip): Promise<void>;
}

export interface SegmentRepository {
  /** Find a segment by ID within a tenant (via trip ownership) */
  findById(tenantId: string, segmentId: string): Promise<Segment | undefined>;

  /** Find all segments for a trip */
  findByTrip(tenantId: string, tripId: string): Promise<Segment[]>;

  /**
   * Save a segment with optimistic version checking.
   * Throws VersionConflictError if the stored version is newer.
   */
  save(segment: Segment, expectedVersion?: number): Promise<void>;

  /** Remove a segment */
  remove(tenantId: string, segmentId: string): Promise<void>;
}

export interface TimelineEventRepository {
  /** Find a timeline event by ID */
  findById(tenantId: string, eventId: string): Promise<TimelineEvent | undefined>;

  /** Find all timeline events for a trip, ordered chronologically */
  findByTrip(tenantId: string, tripId: string): Promise<TimelineEvent[]>;

  /**
   * Append a timeline event. Timeline events are immutable — once created, never modified.
   * Attempting to save an event with an existing ID is a no-op (idempotent).
   */
  append(event: TimelineEvent): Promise<void>;
}

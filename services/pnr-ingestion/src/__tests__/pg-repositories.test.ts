/**
 * Tests for PostgreSQL repository implementations using a mock DatabaseClient.
 * Verifies SQL queries include tenant_id, version checks, and append-only semantics.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { DatabaseClient, QueryResult } from '../persistence/db-client.js';
import { PgTravellerRepository } from '../persistence/pg-traveller-repository.js';
import { PgPNRRepository } from '../persistence/pg-pnr-repository.js';
import { PgTripRepository } from '../persistence/pg-trip-repository.js';
import { PgSegmentRepository } from '../persistence/pg-segment-repository.js';
import { PgTimelineEventRepository } from '../persistence/pg-timeline-event-repository.js';
import { Traveller } from '../domain/traveller.js';
import { PNR } from '../domain/pnr.js';
import { Trip } from '../domain/trip.js';
import { Segment } from '../domain/segment.js';
import { TimelineEvent } from '../domain/timeline-event.js';
import { VersionConflictError } from '../repositories/interfaces.js';

const TENANT = 'tenant-aaa';
const CORP = 'corp-aaa';

function createMockDb(
  rows: unknown[] = [],
): DatabaseClient & { calls: { sql: string; params: unknown[] }[] } {
  const calls: { sql: string; params: unknown[] }[] = [];
  return {
    calls,
    query: vi.fn(async (sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });
      return { rows, rowCount: rows.length } as QueryResult;
    }),
  };
}

describe('PgTravellerRepository', () => {
  it('should include tenant_id in findById query', async () => {
    const db = createMockDb();
    const repo = new PgTravellerRepository(db);
    await repo.findById(TENANT, 'trav-001');

    expect(db.calls[0]?.sql).toContain('tenant_id = $1');
    expect(db.calls[0]?.params[0]).toBe(TENANT);
  });

  it('should include tenant_id in save query', async () => {
    const db = createMockDb();
    const repo = new PgTravellerRepository(db);
    const traveller = Traveller.create({
      travellerId: 'trav-001',
      tenantId: TENANT,
      corporateId: CORP,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'j@a.com',
    });
    await repo.save(traveller);

    expect(db.calls[0]?.sql).toContain('pnr_ingestion.travellers');
    expect(db.calls[0]?.params).toContain(TENANT);
  });
});

describe('PgPNRRepository', () => {
  it('should include tenant_id in all queries', async () => {
    const db = createMockDb();
    const repo = new PgPNRRepository(db);
    await repo.findById(TENANT, 'pnr-001');

    expect(db.calls[0]?.sql).toContain('tenant_id = $1');
    expect(db.calls[0]?.params[0]).toBe(TENANT);
  });

  it('should use version check in save with expectedVersion', async () => {
    // First call: UPDATE with version check returns 0 rows (conflict)
    // Second call: SELECT to get actual version
    const db = createMockDb();
    const queryFn = vi
      .fn()
      .mockResolvedValueOnce({ rows: [], rowCount: 0 }) // UPDATE fails
      .mockResolvedValueOnce({ rows: [{ version: 5 }], rowCount: 1 }); // SELECT finds v5
    db.query = queryFn;

    const repo = new PgPNRRepository(db);
    const pnr = PNR.create({
      pnrId: 'pnr-001',
      tenantId: TENANT,
      corporateId: CORP,
      recordLocator: 'ABC',
      sourceSystem: 'Amadeus',
      bookingDate: new Date(),
      travellerId: 'trav-001',
      version: 6,
    });

    await expect(repo.save(pnr, 3)).rejects.toThrow(VersionConflictError);
  });

  it('should upsert without version check when expectedVersion not provided', async () => {
    const db = createMockDb();
    const repo = new PgPNRRepository(db);
    const pnr = PNR.create({
      pnrId: 'pnr-001',
      tenantId: TENANT,
      corporateId: CORP,
      recordLocator: 'ABC',
      sourceSystem: 'Amadeus',
      bookingDate: new Date(),
      travellerId: 'trav-001',
      version: 1,
    });
    await repo.save(pnr);

    expect(db.calls[0]?.sql).toContain('ON CONFLICT');
    expect(db.calls[0]?.sql).not.toContain('AND version =');
  });
});

describe('PgTripRepository', () => {
  it('should include tenant_id in findByTraveller', async () => {
    const db = createMockDb();
    const repo = new PgTripRepository(db);
    await repo.findByTraveller(TENANT, 'trav-001');

    expect(db.calls[0]?.sql).toContain('tenant_id = $1');
    expect(db.calls[0]?.params[0]).toBe(TENANT);
  });
});

describe('PgSegmentRepository', () => {
  it('should include tenant_id in findById', async () => {
    const db = createMockDb();
    const repo = new PgSegmentRepository(db);
    await repo.findById(TENANT, 'seg-001');

    expect(db.calls[0]?.sql).toContain('tenant_id = $1');
  });

  it('should throw VersionConflictError on version mismatch', async () => {
    const queryFn = vi
      .fn()
      .mockResolvedValueOnce({ rows: [], rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ version: 4 }], rowCount: 1 });
    const db = createMockDb();
    db.query = queryFn;

    const repo = new PgSegmentRepository(db);
    const segment = Segment.create({
      segmentId: 'seg-001',
      tripId: 'trip-001',
      segmentType: 'flight',
      startDatetime: new Date('2026-06-15T08:00:00Z'),
      endDatetime: new Date('2026-06-15T11:00:00Z'),
      origin: 'LHR',
      destination: 'JFK',
      version: 5,
    });

    await expect(repo.save(segment, 2)).rejects.toThrow(VersionConflictError);
  });

  it('should delete with tenant_id filter', async () => {
    const db = createMockDb();
    const repo = new PgSegmentRepository(db);
    await repo.remove(TENANT, 'seg-001');

    expect(db.calls[0]?.sql).toContain('tenant_id = $1');
    expect(db.calls[0]?.sql).toContain('DELETE');
  });
});

describe('PgTimelineEventRepository', () => {
  it('should use INSERT ON CONFLICT DO NOTHING for idempotency', async () => {
    const db = createMockDb();
    const repo = new PgTimelineEventRepository(db);
    const event = TimelineEvent.create({
      eventId: 'evt-001',
      tripId: 'trip-001',
      eventType: 'booking_created',
    });
    await repo.append(event);

    expect(db.calls[0]?.sql).toContain('ON CONFLICT (event_id) DO NOTHING');
  });

  it('should include tenant_id in findByTrip', async () => {
    const db = createMockDb();
    const repo = new PgTimelineEventRepository(db);
    await repo.findByTrip(TENANT, 'trip-001');

    expect(db.calls[0]?.sql).toContain('tenant_id = $1');
    expect(db.calls[0]?.sql).toContain('ORDER BY created_at ASC');
  });
});

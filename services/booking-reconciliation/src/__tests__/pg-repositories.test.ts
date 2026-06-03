import { describe, it, expect, vi } from 'vitest';
import type { DatabaseClient, QueryResult } from '../persistence/db-client.js';
import { VersionConflictError } from '../persistence/db-client.js';
import { PgHotelBookingRepository } from '../persistence/pg-hotel-booking-repository.js';
import { HotelBooking } from '../domain/hotel-booking.js';

const TENANT_A = 'tenant-aaa';
const TENANT_B = 'tenant-bbb';

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

function makeBooking(overrides = {}) {
  return HotelBooking.create({
    tenantId: TENANT_A,
    bookingId: 'b-001',
    travellerId: 'trav-001',
    bookingVersion: 1,
    hotelName: 'Marriott',
    city: 'NYC',
    country: 'US',
    checkinDate: new Date('2026-06-15'),
    checkoutDate: new Date('2026-06-19'),
    bookingDate: new Date('2026-06-01'),
    roomNights: 4,
    status: 'confirmed',
    ...overrides,
  });
}

describe('PgHotelBookingRepository', () => {
  it('findById includes tenant_id in query', async () => {
    const db = createMockDb();
    const repo = new PgHotelBookingRepository(db);
    await repo.findById(TENANT_A, 'b-001');
    expect(db.calls[0]?.sql).toContain('tenant_id = $1');
    expect(db.calls[0]?.params[0]).toBe(TENANT_A);
  });

  it('save includes tenant_id and booking_version', async () => {
    const db = createMockDb([]);
    const repo = new PgHotelBookingRepository(db);
    await repo.save(makeBooking());
    // First call: SELECT for version check, second: INSERT
    expect(db.calls.length).toBe(2);
    expect(db.calls[1]?.sql).toContain('booking_reconciliation.hotel_bookings');
    expect(db.calls[1]?.params).toContain(TENANT_A);
  });

  it('save throws VersionConflictError when existing version >= new version', async () => {
    const queryFn = vi.fn().mockResolvedValueOnce({ rows: [{ booking_version: 3 }], rowCount: 1 });
    const db = createMockDb();
    db.query = queryFn;

    const repo = new PgHotelBookingRepository(db);
    await expect(repo.save(makeBooking({ bookingVersion: 2 }))).rejects.toThrow(
      VersionConflictError,
    );
  });

  it('remove includes tenant_id', async () => {
    const db = createMockDb();
    const repo = new PgHotelBookingRepository(db);
    await repo.remove(TENANT_A, 'b-001');
    expect(db.calls[0]?.sql).toContain('tenant_id = $1');
    expect(db.calls[0]?.sql).toContain('DELETE');
  });

  it('tenant isolation: different tenantId in findById', async () => {
    const db = createMockDb();
    const repo = new PgHotelBookingRepository(db);
    await repo.findById(TENANT_B, 'b-001');
    expect(db.calls[0]?.params[0]).toBe(TENANT_B);
  });
});

describe('SQL Migration', () => {
  it('migration file exists and creates correct schema', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const dir = dirname(fileURLToPath(import.meta.url));
    const sql = readFileSync(
      resolve(dir, '../persistence/migrations/001_create_tables.sql'),
      'utf-8',
    );
    expect(sql).toContain('CREATE SCHEMA IF NOT EXISTS booking_reconciliation');
    expect(sql).toContain('hotel_bookings');
    expect(sql).toContain('reconciliation_matches');
    expect(sql).toContain('orphan_bookings');
    expect(sql).toContain('coverage_assessments');
    expect(sql).toContain('candidate_trips');
    expect(sql).toContain('tenant_id UUID NOT NULL');
    expect(sql).toContain('booking_version INTEGER NOT NULL');
    expect(sql).toContain('idx_hotel_bookings_tenant');
    expect(sql).toContain('idx_orphan_bookings_deadline');
  });
});

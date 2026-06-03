/**
 * Tests: InMemoryHotelBookingRepository version consistency.
 * Verifies bookingVersion enforcement matches PgHotelBookingRepository behaviour.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryHotelBookingRepository } from '../repositories/in-memory.js';
import { HotelBooking } from '../domain/hotel-booking.js';
import { VersionConflictError } from '../persistence/db-client.js';

const TENANT_A = 'tenant-aaa-111';
const TENANT_B = 'tenant-bbb-222';
const BOOKING_ID = 'booking-001';

function makeBooking(overrides: Partial<Parameters<typeof HotelBooking.create>[0]> = {}) {
  return HotelBooking.create({
    tenantId: TENANT_A,
    bookingId: BOOKING_ID,
    travellerId: 'trav-001',
    bookingVersion: 1,
    hotelName: 'Hilton Garden Inn',
    city: 'London',
    country: 'GB',
    checkinDate: new Date('2026-07-01'),
    checkoutDate: new Date('2026-07-04'),
    bookingDate: new Date('2026-06-15'),
    roomNights: 3,
    status: 'confirmed',
    ...overrides,
  });
}

describe('InMemoryHotelBookingRepository — version consistency', () => {
  let repo: InMemoryHotelBookingRepository;

  beforeEach(() => {
    repo = new InMemoryHotelBookingRepository();
  });

  it('first save succeeds when no record exists', async () => {
    const booking = makeBooking({ bookingVersion: 1 });
    await expect(repo.save(booking)).resolves.toBeUndefined();

    const found = await repo.findById(TENANT_A, BOOKING_ID);
    expect(found).toBeDefined();
    expect(found!.bookingVersion).toBe(1);
  });

  it('higher bookingVersion replaces existing record', async () => {
    const v1 = makeBooking({ bookingVersion: 1 });
    await repo.save(v1);

    const v2 = makeBooking({ bookingVersion: 2, hotelName: 'Updated Hilton' });
    await expect(repo.save(v2)).resolves.toBeUndefined();

    const found = await repo.findById(TENANT_A, BOOKING_ID);
    expect(found!.bookingVersion).toBe(2);
    expect(found!.hotelName).toBe('Updated Hilton');
  });

  it('same bookingVersion is idempotent — does not throw, does not overwrite', async () => {
    const v1 = makeBooking({ bookingVersion: 1, hotelName: 'Original' });
    await repo.save(v1);

    const v1Again = makeBooking({ bookingVersion: 1, hotelName: 'Duplicate' });
    await expect(repo.save(v1Again)).resolves.toBeUndefined();

    // Original record preserved
    const found = await repo.findById(TENANT_A, BOOKING_ID);
    expect(found!.hotelName).toBe('Original');
  });

  it('lower bookingVersion is rejected with VersionConflictError', async () => {
    const v3 = makeBooking({ bookingVersion: 3 });
    await repo.save(v3);

    const v1 = makeBooking({ bookingVersion: 1 });
    await expect(repo.save(v1)).rejects.toThrow(VersionConflictError);
    await expect(repo.save(v1)).rejects.toThrow(/Version conflict on HotelBooking/);

    // Record remains at version 3
    const found = await repo.findById(TENANT_A, BOOKING_ID);
    expect(found!.bookingVersion).toBe(3);
  });

  it('lower bookingVersion includes entity details in error', async () => {
    const v2 = makeBooking({ bookingVersion: 2 });
    await repo.save(v2);

    const v1 = makeBooking({ bookingVersion: 1 });
    try {
      await repo.save(v1);
      expect.fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(VersionConflictError);
      const vce = err as VersionConflictError;
      expect(vce.entityType).toBe('HotelBooking');
      expect(vce.entityId).toBe(BOOKING_ID);
      expect(vce.expectedVersion).toBe(1);
      expect(vce.actualVersion).toBe(2);
    }
  });

  it('Tenant A cannot affect Tenant B booking with same bookingId', async () => {
    const tenantABooking = makeBooking({ tenantId: TENANT_A, bookingVersion: 1 });
    const tenantBBooking = makeBooking({
      tenantId: TENANT_B,
      bookingVersion: 1,
      hotelName: 'Tenant B Hotel',
    });

    await repo.save(tenantABooking);
    await repo.save(tenantBBooking);

    // Both exist independently
    const foundA = await repo.findById(TENANT_A, BOOKING_ID);
    const foundB = await repo.findById(TENANT_B, BOOKING_ID);
    expect(foundA).toBeDefined();
    expect(foundB).toBeDefined();
    expect(foundA!.hotelName).toBe('Hilton Garden Inn');
    expect(foundB!.hotelName).toBe('Tenant B Hotel');

    // Tenant B update does not affect Tenant A
    const tenantBv2 = makeBooking({
      tenantId: TENANT_B,
      bookingVersion: 2,
      hotelName: 'Tenant B Updated',
    });
    await repo.save(tenantBv2);

    const foundAAfter = await repo.findById(TENANT_A, BOOKING_ID);
    expect(foundAAfter!.bookingVersion).toBe(1);
    expect(foundAAfter!.hotelName).toBe('Hilton Garden Inn');
  });

  it('Tenant A findById does not return Tenant B booking', async () => {
    const tenantBBooking = makeBooking({ tenantId: TENANT_B, bookingVersion: 1 });
    await repo.save(tenantBBooking);

    const found = await repo.findById(TENANT_A, BOOKING_ID);
    expect(found).toBeUndefined();
  });

  it('remove only affects the correct tenant', async () => {
    const tenantABooking = makeBooking({ tenantId: TENANT_A, bookingVersion: 1 });
    const tenantBBooking = makeBooking({ tenantId: TENANT_B, bookingVersion: 1 });
    await repo.save(tenantABooking);
    await repo.save(tenantBBooking);

    await repo.remove(TENANT_A, BOOKING_ID);

    expect(await repo.findById(TENANT_A, BOOKING_ID)).toBeUndefined();
    expect(await repo.findById(TENANT_B, BOOKING_ID)).toBeDefined();
  });

  it('repository interface remains compatible with application service', async () => {
    // Verify the repo implements HotelBookingRepository correctly
    // by exercising the full save/find/remove lifecycle
    const booking = makeBooking({ bookingVersion: 1 });
    await repo.save(booking);

    const found = await repo.findById(TENANT_A, BOOKING_ID);
    expect(found).toBeDefined();
    expect(found!.tenantId).toBe(TENANT_A);
    expect(found!.bookingId).toBe(BOOKING_ID);

    await repo.remove(TENANT_A, BOOKING_ID);
    const afterRemove = await repo.findById(TENANT_A, BOOKING_ID);
    expect(afterRemove).toBeUndefined();
  });
});

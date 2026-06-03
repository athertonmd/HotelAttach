import { describe, it, expect } from 'vitest';
import { CoverageAssessment } from '../domain/coverage-assessment.js';
import { OrphanBooking } from '../domain/orphan-booking.js';

const TENANT = 'tenant-001';

describe('CoverageAssessment', () => {
  it('100% coverage gives fully_covered (BR-301)', () => {
    const a = CoverageAssessment.create({
      tenantId: TENANT,
      tripId: 'trip-1',
      totalNightsRequired: 4,
      nightsCovered: 4,
      matchedBookingIds: ['b1'],
    });
    expect(a.coveragePercent).toBe(100);
    expect(a.coverageStatus).toBe('fully_covered');
  });

  it('80-99% gives mostly_covered (BR-302)', () => {
    const a = CoverageAssessment.create({
      tenantId: TENANT,
      tripId: 'trip-1',
      totalNightsRequired: 5,
      nightsCovered: 4,
      matchedBookingIds: ['b1'],
    });
    expect(a.coveragePercent).toBe(80);
    expect(a.coverageStatus).toBe('mostly_covered');
  });

  it('50-79% gives partially_covered (BR-303)', () => {
    const a = CoverageAssessment.create({
      tenantId: TENANT,
      tripId: 'trip-1',
      totalNightsRequired: 5,
      nightsCovered: 3,
      matchedBookingIds: ['b1'],
    });
    expect(a.coveragePercent).toBe(60);
    expect(a.coverageStatus).toBe('partially_covered');
  });

  it('1-49% gives minimally_covered (BR-304)', () => {
    const a = CoverageAssessment.create({
      tenantId: TENANT,
      tripId: 'trip-1',
      totalNightsRequired: 5,
      nightsCovered: 1,
      matchedBookingIds: ['b1'],
    });
    expect(a.coveragePercent).toBe(20);
    expect(a.coverageStatus).toBe('minimally_covered');
  });

  it('0% gives no_accommodation (BR-305)', () => {
    const a = CoverageAssessment.create({
      tenantId: TENANT,
      tripId: 'trip-1',
      totalNightsRequired: 5,
      nightsCovered: 0,
      matchedBookingIds: [],
    });
    expect(a.coveragePercent).toBe(0);
    expect(a.coverageStatus).toBe('no_accommodation');
  });

  it('rejects negative totalNightsRequired', () => {
    expect(() =>
      CoverageAssessment.create({
        tenantId: TENANT,
        tripId: 'trip-1',
        totalNightsRequired: -1,
        nightsCovered: 0,
        matchedBookingIds: [],
      }),
    ).toThrow('totalNightsRequired must be >= 0');
  });

  it('rejects negative nightsCovered', () => {
    expect(() =>
      CoverageAssessment.create({
        tenantId: TENANT,
        tripId: 'trip-1',
        totalNightsRequired: 5,
        nightsCovered: -1,
        matchedBookingIds: [],
      }),
    ).toThrow('nightsCovered must be >= 0');
  });

  it('rejects nightsCovered > totalNightsRequired', () => {
    expect(() =>
      CoverageAssessment.create({
        tenantId: TENANT,
        tripId: 'trip-1',
        totalNightsRequired: 3,
        nightsCovered: 5,
        matchedBookingIds: ['b1'],
      }),
    ).toThrow('nightsCovered cannot exceed totalNightsRequired');
  });

  it('calculates coveragePercent automatically', () => {
    const a = CoverageAssessment.create({
      tenantId: TENANT,
      tripId: 'trip-1',
      totalNightsRequired: 4,
      nightsCovered: 3,
      matchedBookingIds: ['b1'],
    });
    expect(a.coveragePercent).toBe(75);
  });

  it('preserves tenantId', () => {
    const a = CoverageAssessment.create({
      tenantId: 'tenant-xyz',
      tripId: 'trip-1',
      totalNightsRequired: 4,
      nightsCovered: 4,
      matchedBookingIds: ['b1'],
    });
    expect(a.tenantId).toBe('tenant-xyz');
  });

  it('preserves matchedBookingIds', () => {
    const a = CoverageAssessment.create({
      tenantId: TENANT,
      tripId: 'trip-1',
      totalNightsRequired: 4,
      nightsCovered: 4,
      matchedBookingIds: ['b1', 'b2'],
    });
    expect(a.matchedBookingIds).toEqual(['b1', 'b2']);
  });
});

describe('OrphanBooking', () => {
  const validInput = {
    tenantId: TENANT,
    bookingId: 'booking-001',
    travellerId: 'trav-001',
    hotelName: 'Hotel Le Marais',
    city: 'Paris',
    country: 'FR',
    checkinDate: new Date('2026-06-15T15:00:00Z'),
    checkoutDate: new Date('2026-06-18T11:00:00Z'),
  };

  it('creates a valid orphan booking', () => {
    const orphan = OrphanBooking.create(validInput);
    expect(orphan.bookingId).toBe('booking-001');
    expect(orphan.tenantId).toBe(TENANT);
    expect(orphan.detectedAt).toBeInstanceOf(Date);
  });

  it('reassociationDeadline defaults to 30 days after detection', () => {
    const orphan = OrphanBooking.create(validInput);
    const diff = orphan.reassociationDeadline.getTime() - orphan.detectedAt.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    expect(days).toBe(30);
  });

  it('rejects invalid date range', () => {
    expect(() =>
      OrphanBooking.create({
        ...validInput,
        checkinDate: new Date('2026-06-18'),
        checkoutDate: new Date('2026-06-15'),
      }),
    ).toThrow('end must be after start');
  });

  it('rejects empty hotelName', () => {
    expect(() => OrphanBooking.create({ ...validInput, hotelName: '' })).toThrow(
      'hotelName cannot be empty',
    );
  });

  it('preserves tenantId', () => {
    const orphan = OrphanBooking.create({ ...validInput, tenantId: 'tenant-abc' });
    expect(orphan.tenantId).toBe('tenant-abc');
  });
});

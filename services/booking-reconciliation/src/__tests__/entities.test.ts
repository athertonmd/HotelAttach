import { describe, it, expect } from 'vitest';
import { HotelBooking } from '../domain/hotel-booking.js';
import { ReconciliationCandidate } from '../domain/reconciliation-candidate.js';

const validBookingInput = {
  tenantId: 'tenant-001',
  bookingId: 'booking-001',
  travellerId: 'trav-001',
  bookingVersion: 1,
  hotelName: 'Marriott Marquis',
  city: 'New York',
  country: 'US',
  checkinDate: new Date('2026-06-15T15:00:00Z'),
  checkoutDate: new Date('2026-06-19T11:00:00Z'),
  bookingDate: new Date('2026-06-01T09:00:00Z'),
  roomNights: 4,
  status: 'confirmed' as const,
};

describe('HotelBooking', () => {
  it('should create a valid hotel booking', () => {
    const booking = HotelBooking.create(validBookingInput);
    expect(booking.bookingId).toBe('booking-001');
    expect(booking.tenantId).toBe('tenant-001');
    expect(booking.hotelName).toBe('Marriott Marquis');
    expect(booking.roomNights).toBe(4);
    expect(booking.stayRange.nights).toBe(4);
  });

  it('should reject empty hotelName', () => {
    expect(() => HotelBooking.create({ ...validBookingInput, hotelName: '' })).toThrow(
      'hotelName cannot be empty',
    );
  });

  it('should reject invalid date range (checkout before checkin)', () => {
    expect(() =>
      HotelBooking.create({
        ...validBookingInput,
        checkinDate: new Date('2026-06-19'),
        checkoutDate: new Date('2026-06-15'),
      }),
    ).toThrow('end must be after start');
  });

  it('should reject roomNights < 1', () => {
    expect(() => HotelBooking.create({ ...validBookingInput, roomNights: 0 })).toThrow(
      'roomNights must be at least 1',
    );
  });

  it('should reject bookingVersion < 1', () => {
    expect(() => HotelBooking.create({ ...validBookingInput, bookingVersion: 0 })).toThrow(
      'bookingVersion must be at least 1',
    );
  });

  it('should preserve tenantId', () => {
    const booking = HotelBooking.create({ ...validBookingInput, tenantId: 'tenant-xyz' });
    expect(booking.tenantId).toBe('tenant-xyz');
  });

  it('should support optional matching fields', () => {
    const booking = HotelBooking.create({
      ...validBookingInput,
      hotelChain: 'MC',
      confirmationNumber: 'CONF-123',
      supplierCode: 'SUP-1',
      employeeNumber: 'EMP-100',
      email: 'jane@corp.com',
      sourceSegmentId: 'seg-001',
    });
    expect(booking.hotelChain).toBe('MC');
    expect(booking.confirmationNumber).toBe('CONF-123');
    expect(booking.employeeNumber).toBe('EMP-100');
    expect(booking.email).toBe('jane@corp.com');
  });

  it('should default optional fields to null', () => {
    const booking = HotelBooking.create(validBookingInput);
    expect(booking.hotelChain).toBeNull();
    expect(booking.confirmationNumber).toBeNull();
    expect(booking.supplierCode).toBeNull();
    expect(booking.employeeNumber).toBeNull();
    expect(booking.email).toBeNull();
    expect(booking.sourceSegmentId).toBeNull();
  });
});

describe('ReconciliationCandidate', () => {
  const validCandidateInput = {
    tenantId: 'tenant-001',
    bookingId: 'booking-001',
    travellerId: 'trav-001',
    candidateTripId: 'trip-001',
    tripStartDate: new Date('2026-06-15T08:00:00Z'),
    tripEndDate: new Date('2026-06-20T18:00:00Z'),
    tripDestinationCity: 'New York',
    tripDestinationCountry: 'US',
    candidateSource: 'booking_created' as const,
  };

  it('should create a valid candidate', () => {
    const candidate = ReconciliationCandidate.create(validCandidateInput);
    expect(candidate.candidateTripId).toBe('trip-001');
    expect(candidate.tenantId).toBe('tenant-001');
    expect(candidate.tripRange.nights).toBe(6);
  });

  it('should reject invalid trip date range', () => {
    expect(() =>
      ReconciliationCandidate.create({
        ...validCandidateInput,
        tripStartDate: new Date('2026-06-20'),
        tripEndDate: new Date('2026-06-15'),
      }),
    ).toThrow('end must be after start');
  });

  it('should preserve tenantId', () => {
    const candidate = ReconciliationCandidate.create({
      ...validCandidateInput,
      tenantId: 'tenant-abc',
    });
    expect(candidate.tenantId).toBe('tenant-abc');
  });
});

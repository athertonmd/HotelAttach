/**
 * E2E Test: Booking Cancellation and Coverage Recalculation
 *
 * Scenario 1: Matched booking → BookingCancelled → match removed → coverage reduced → HotelCoverageUpdated published
 * Scenario 2: Multiple bookings → combined 100% coverage → coverageStatus = fully_covered
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryEventBus } from '@hci/event-contracts';
import { SchemaValidator } from '@hci/validation';
import { BookingReconciliationService } from '../services/reconciliation-service.js';
import {
  InMemoryHotelBookingRepository,
  InMemoryReconciliationMatchRepository,
  InMemoryOrphanBookingRepository,
  InMemoryCoverageAssessmentRepository,
  InMemoryCandidateTripRepository,
} from '../repositories/in-memory.js';
import { ReconciliationCandidate } from '../domain/reconciliation-candidate.js';
import type { CreateHotelBookingInput } from '../domain/hotel-booking.js';

const TENANT_ID = 'f1a2b3c4-1111-4000-8000-aaaaaaaaaaaa';
const TRAVELLER_ID = 'f1a2b3c4-2222-4000-8000-bbbbbbbbbbbb';
const BOOKING_ID_1 = 'f1a2b3c4-3333-4000-8000-cccccccccccc';
const BOOKING_ID_2 = 'f1a2b3c4-4444-4000-8000-dddddddddddd';
const TRIP_ID = 'f1a2b3c4-5555-4000-8000-eeeeeeeeeeee';
const CORRELATION_ID = 'f1a2b3c4-6666-4000-8000-ffffffffffff';

function makeBookingInput(
  overrides: Partial<CreateHotelBookingInput> = {},
): CreateHotelBookingInput {
  return {
    tenantId: TENANT_ID,
    bookingId: BOOKING_ID_1,
    travellerId: TRAVELLER_ID,
    bookingVersion: 1,
    hotelName: 'Grand Hotel',
    city: 'Berlin',
    country: 'DE',
    checkinDate: new Date('2026-10-01'),
    checkoutDate: new Date('2026-10-05'),
    bookingDate: new Date('2026-09-01'),
    roomNights: 4,
    status: 'confirmed',
    employeeNumber: 'EMP-900',
    email: 'bob@corp.com',
    ...overrides,
  };
}

/**
 * High-confidence candidate:
 * - Same travellerId (+50)
 * - Same city (+15)
 * - Same country (+10)
 * - Date overlap (+25)
 * - Full night coverage (+20)
 * Total: 100 → matched
 */
function makeCandidate(): ReconciliationCandidate {
  return ReconciliationCandidate.create({
    tenantId: TENANT_ID,
    bookingId: BOOKING_ID_1,
    travellerId: TRAVELLER_ID,
    candidateTripId: TRIP_ID,
    tripStartDate: new Date('2026-10-01'),
    tripEndDate: new Date('2026-10-05'),
    tripDestinationCity: 'Berlin',
    tripDestinationCountry: 'DE',
    candidateSource: 'trip_created',
  });
}

describe('E2E: Booking Cancellation and Coverage Recalculation', () => {
  let service: BookingReconciliationService;
  let bus: InMemoryEventBus;
  let matchRepo: InMemoryReconciliationMatchRepository;
  let coverageRepo: InMemoryCoverageAssessmentRepository;
  let candidateRepo: InMemoryCandidateTripRepository;
  let validator: SchemaValidator;

  beforeEach(() => {
    bus = new InMemoryEventBus();
    const bookingRepo = new InMemoryHotelBookingRepository();
    matchRepo = new InMemoryReconciliationMatchRepository();
    const orphanRepo = new InMemoryOrphanBookingRepository();
    coverageRepo = new InMemoryCoverageAssessmentRepository();
    candidateRepo = new InMemoryCandidateTripRepository();
    validator = new SchemaValidator();

    service = new BookingReconciliationService(
      bookingRepo,
      matchRepo,
      orphanRepo,
      coverageRepo,
      candidateRepo,
      bus,
    );
  });

  // --- Scenario 1: Cancellation reduces coverage ---

  it('BookingCancelled is accepted for a matched booking', async () => {
    candidateRepo.addCandidate(makeCandidate());
    await service.handleBookingCreated(makeBookingInput(), { correlationId: CORRELATION_ID });
    bus.clear();

    const result = await service.handleBookingCancelled(TENANT_ID, BOOKING_ID_1, {
      correlationId: CORRELATION_ID,
    });
    expect(result.success).toBe(true);
  });

  it('matched booking cancellation removes reconciliation match', async () => {
    candidateRepo.addCandidate(makeCandidate());
    await service.handleBookingCreated(makeBookingInput(), { correlationId: CORRELATION_ID });

    await service.handleBookingCancelled(TENANT_ID, BOOKING_ID_1, {
      correlationId: CORRELATION_ID,
    });

    const match = await matchRepo.findByBooking(TENANT_ID, BOOKING_ID_1);
    expect(match).toBeUndefined();
  });

  it('HotelCoverageUpdated event is published after cancellation', async () => {
    candidateRepo.addCandidate(makeCandidate());
    await service.handleBookingCreated(makeBookingInput(), { correlationId: CORRELATION_ID });
    bus.clear();

    await service.handleBookingCancelled(TENANT_ID, BOOKING_ID_1, {
      correlationId: CORRELATION_ID,
    });

    const coverageEvents = bus.getEventsByType('HotelCoverageUpdated');
    expect(coverageEvents).toHaveLength(1);
  });

  it('coverage decreases after cancellation', async () => {
    candidateRepo.addCandidate(makeCandidate());
    await service.handleBookingCreated(makeBookingInput(), { correlationId: CORRELATION_ID });

    // Before cancellation: coverage exists
    const beforeCoverage = await coverageRepo.findByTrip(TENANT_ID, TRIP_ID);
    expect(beforeCoverage).toBeDefined();
    expect(beforeCoverage!.nightsCovered).toBeGreaterThan(0);

    await service.handleBookingCancelled(TENANT_ID, BOOKING_ID_1, {
      correlationId: CORRELATION_ID,
    });

    // After cancellation: no matches remain, nightsCovered drops
    const afterCoverage = await coverageRepo.findByTrip(TENANT_ID, TRIP_ID);
    expect(afterCoverage).toBeDefined();
    expect(afterCoverage!.nightsCovered).toBeLessThan(beforeCoverage!.nightsCovered);
  });

  it('HotelCoverageUpdated after cancellation validates against schema', async () => {
    candidateRepo.addCandidate(makeCandidate());
    await service.handleBookingCreated(makeBookingInput(), { correlationId: CORRELATION_ID });
    bus.clear();

    await service.handleBookingCancelled(TENANT_ID, BOOKING_ID_1, {
      correlationId: CORRELATION_ID,
    });

    const ev = bus.getEventsByType('HotelCoverageUpdated')[0]!;
    const result = validator.validateEvent('hotel-coverage-updated', ev);
    expect(result.errors).toHaveLength(0);
    expect(result.valid).toBe(true);
  });

  it('tenantId preserved in cancellation coverage event', async () => {
    candidateRepo.addCandidate(makeCandidate());
    await service.handleBookingCreated(makeBookingInput(), { correlationId: CORRELATION_ID });
    bus.clear();

    await service.handleBookingCancelled(TENANT_ID, BOOKING_ID_1, {
      correlationId: CORRELATION_ID,
    });

    const ev = bus.getEventsByType('HotelCoverageUpdated')[0]!;
    expect(ev.tenantId).toBe(TENANT_ID);
    const payload = ev.payload as Record<string, unknown>;
    expect(payload.tenantId).toBe(TENANT_ID);
  });

  it('correlationId preserved in cancellation coverage event', async () => {
    candidateRepo.addCandidate(makeCandidate());
    await service.handleBookingCreated(makeBookingInput(), { correlationId: CORRELATION_ID });
    bus.clear();

    await service.handleBookingCancelled(TENANT_ID, BOOKING_ID_1, {
      correlationId: CORRELATION_ID,
    });

    const ev = bus.getEventsByType('HotelCoverageUpdated')[0]!;
    expect(ev.correlationId).toBe(CORRELATION_ID);
  });

  // --- Scenario 2: Multiple bookings reach full coverage ---

  it('multiple bookings contribute to trip coverage reaching 100%', async () => {
    candidateRepo.addCandidate(makeCandidate());

    // First booking matches
    await service.handleBookingCreated(makeBookingInput(), { correlationId: CORRELATION_ID });

    // Second booking also matches to same trip
    const candidate2 = ReconciliationCandidate.create({
      tenantId: TENANT_ID,
      bookingId: BOOKING_ID_2,
      travellerId: TRAVELLER_ID,
      candidateTripId: TRIP_ID,
      tripStartDate: new Date('2026-10-01'),
      tripEndDate: new Date('2026-10-05'),
      tripDestinationCity: 'Berlin',
      tripDestinationCountry: 'DE',
      candidateSource: 'trip_created',
    });
    candidateRepo.addCandidate(candidate2);

    await service.handleBookingCreated(
      makeBookingInput({
        bookingId: BOOKING_ID_2,
        hotelName: 'Hotel Adlon',
        checkinDate: new Date('2026-10-01'),
        checkoutDate: new Date('2026-10-05'),
        roomNights: 4,
      }),
      { correlationId: CORRELATION_ID },
    );

    // Coverage should reflect both matched bookings
    const coverage = await coverageRepo.findByTrip(TENANT_ID, TRIP_ID);
    expect(coverage).toBeDefined();
    expect(coverage!.coveragePercent).toBe(100);
    expect(coverage!.coverageStatus).toBe('fully_covered');
  });

  it('matchedBookingIds preserved in coverage assessment', async () => {
    candidateRepo.addCandidate(makeCandidate());
    await service.handleBookingCreated(makeBookingInput(), { correlationId: CORRELATION_ID });

    const candidate2 = ReconciliationCandidate.create({
      tenantId: TENANT_ID,
      bookingId: BOOKING_ID_2,
      travellerId: TRAVELLER_ID,
      candidateTripId: TRIP_ID,
      tripStartDate: new Date('2026-10-01'),
      tripEndDate: new Date('2026-10-05'),
      tripDestinationCity: 'Berlin',
      tripDestinationCountry: 'DE',
      candidateSource: 'trip_created',
    });
    candidateRepo.addCandidate(candidate2);

    await service.handleBookingCreated(
      makeBookingInput({
        bookingId: BOOKING_ID_2,
        hotelName: 'Hotel Adlon',
        checkinDate: new Date('2026-10-01'),
        checkoutDate: new Date('2026-10-05'),
        roomNights: 4,
      }),
      { correlationId: CORRELATION_ID },
    );

    const coverage = await coverageRepo.findByTrip(TENANT_ID, TRIP_ID);
    expect(coverage!.matchedBookingIds).toContain(BOOKING_ID_1);
    expect(coverage!.matchedBookingIds).toContain(BOOKING_ID_2);
    expect(coverage!.matchedBookingIds).toHaveLength(2);
  });

  it('fully_covered HotelCoverageUpdated event validates against schema', async () => {
    candidateRepo.addCandidate(makeCandidate());
    await service.handleBookingCreated(makeBookingInput(), { correlationId: CORRELATION_ID });

    const candidate2 = ReconciliationCandidate.create({
      tenantId: TENANT_ID,
      bookingId: BOOKING_ID_2,
      travellerId: TRAVELLER_ID,
      candidateTripId: TRIP_ID,
      tripStartDate: new Date('2026-10-01'),
      tripEndDate: new Date('2026-10-05'),
      tripDestinationCity: 'Berlin',
      tripDestinationCountry: 'DE',
      candidateSource: 'trip_created',
    });
    candidateRepo.addCandidate(candidate2);
    bus.clear();

    await service.handleBookingCreated(
      makeBookingInput({
        bookingId: BOOKING_ID_2,
        hotelName: 'Hotel Adlon',
        checkinDate: new Date('2026-10-01'),
        checkoutDate: new Date('2026-10-05'),
        roomNights: 4,
      }),
      { correlationId: CORRELATION_ID },
    );

    // Get the latest HotelCoverageUpdated
    const coverageEvents = bus.getEventsByType('HotelCoverageUpdated');
    const ev = coverageEvents[coverageEvents.length - 1]!;
    const result = validator.validateEvent('hotel-coverage-updated', ev);
    expect(result.errors).toHaveLength(0);
    expect(result.valid).toBe(true);

    const payload = ev.payload as Record<string, unknown>;
    expect(payload.coverageStatus).toBe('fully_covered');
    expect(payload.coveragePercent).toBe(100);
  });
});

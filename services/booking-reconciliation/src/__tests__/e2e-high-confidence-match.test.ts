/**
 * E2E Test: High-Confidence Match Flow
 *
 * Proves the full booking reconciliation workflow:
 * BookingCreated → candidate trip exists → confidence >= 80 →
 * reconciliation result stored → HotelMatched published → HotelCoverageUpdated published
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

const TENANT_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const TRAVELLER_ID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
const BOOKING_ID = 'c3d4e5f6-a7b8-9012-cdef-123456789012';
const TRIP_ID = 'd4e5f6a7-b8c9-0123-defa-234567890123';
const CORRELATION_ID = 'e5f6a7b8-c9d0-1234-efab-345678901234';

/**
 * Scenario setup:
 * - Traveller match: same travellerId (+50)
 * - City match: New York (+15)
 * - Country match: US (+10)
 * - Date overlap: hotel within trip dates (+25)
 * - Full night coverage: hotel covers trip range (+20)
 * Total expected: 100 (capped at 100) → matched
 */
function makeBookingInput(): CreateHotelBookingInput {
  return {
    tenantId: TENANT_ID,
    bookingId: BOOKING_ID,
    travellerId: TRAVELLER_ID,
    bookingVersion: 1,
    hotelName: 'Marriott Marquis',
    city: 'New York',
    country: 'US',
    checkinDate: new Date('2026-07-01'),
    checkoutDate: new Date('2026-07-06'),
    bookingDate: new Date('2026-06-15'),
    roomNights: 5,
    status: 'confirmed',
    employeeNumber: 'EMP-500',
    email: 'john.doe@corp.com',
  };
}

function makeCandidateTrip(): ReconciliationCandidate {
  return ReconciliationCandidate.create({
    tenantId: TENANT_ID,
    bookingId: BOOKING_ID,
    travellerId: TRAVELLER_ID,
    candidateTripId: TRIP_ID,
    tripStartDate: new Date('2026-07-01'),
    tripEndDate: new Date('2026-07-06'),
    tripDestinationCity: 'New York',
    tripDestinationCountry: 'US',
    candidateSource: 'trip_created',
  });
}

describe('E2E: High-Confidence Match Flow', () => {
  let service: BookingReconciliationService;
  let bus: InMemoryEventBus;
  let matchRepo: InMemoryReconciliationMatchRepository;
  let candidateRepo: InMemoryCandidateTripRepository;
  let validator: SchemaValidator;

  beforeEach(() => {
    bus = new InMemoryEventBus();
    const bookingRepo = new InMemoryHotelBookingRepository();
    matchRepo = new InMemoryReconciliationMatchRepository();
    const orphanRepo = new InMemoryOrphanBookingRepository();
    const coverageRepo = new InMemoryCoverageAssessmentRepository();
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

  it('BookingCreated with high-confidence candidate completes full match flow', async () => {
    // Arrange: candidate trip exists
    candidateRepo.addCandidate(makeCandidateTrip());

    // Act: process booking
    const result = await service.handleBookingCreated(makeBookingInput(), {
      correlationId: CORRELATION_ID,
    });

    // Assert: service succeeds
    expect(result.success).toBe(true);
  });

  it('candidate trip is found and confidence score is >= 80', async () => {
    candidateRepo.addCandidate(makeCandidateTrip());
    await service.handleBookingCreated(makeBookingInput(), { correlationId: CORRELATION_ID });

    const stored = await matchRepo.findByBooking(TENANT_ID, BOOKING_ID);
    expect(stored).toBeDefined();
    expect(stored!.confidenceScore).toBeGreaterThanOrEqual(80);
  });

  it('reconciliation result status is matched', async () => {
    candidateRepo.addCandidate(makeCandidateTrip());
    await service.handleBookingCreated(makeBookingInput(), { correlationId: CORRELATION_ID });

    const stored = await matchRepo.findByBooking(TENANT_ID, BOOKING_ID);
    expect(stored!.matchStatus).toBe('matched');
    expect(stored!.candidateTripId).toBe(TRIP_ID);
  });

  it('HotelMatched event is published', async () => {
    candidateRepo.addCandidate(makeCandidateTrip());
    await service.handleBookingCreated(makeBookingInput(), { correlationId: CORRELATION_ID });

    const matchedEvents = bus.getEventsByType('HotelMatched');
    expect(matchedEvents).toHaveLength(1);

    const ev = matchedEvents[0]!;
    expect(ev.eventType).toBe('HotelMatched');
    expect(ev.payload).toBeDefined();
  });

  it('HotelCoverageUpdated event is published', async () => {
    candidateRepo.addCandidate(makeCandidateTrip());
    await service.handleBookingCreated(makeBookingInput(), { correlationId: CORRELATION_ID });

    const coverageEvents = bus.getEventsByType('HotelCoverageUpdated');
    expect(coverageEvents).toHaveLength(1);

    const ev = coverageEvents[0]!;
    expect(ev.eventType).toBe('HotelCoverageUpdated');
    expect(ev.payload).toBeDefined();
  });

  it('tenantId is preserved in all published events', async () => {
    candidateRepo.addCandidate(makeCandidateTrip());
    await service.handleBookingCreated(makeBookingInput(), { correlationId: CORRELATION_ID });

    for (const ev of bus.getPublishedEvents()) {
      expect(ev.tenantId).toBe(TENANT_ID);
      // Payload also contains tenantId
      const payload = ev.payload as Record<string, unknown>;
      expect(payload.tenantId).toBe(TENANT_ID);
    }
  });

  it('correlationId is preserved in all published events', async () => {
    candidateRepo.addCandidate(makeCandidateTrip());
    await service.handleBookingCreated(makeBookingInput(), { correlationId: CORRELATION_ID });

    for (const ev of bus.getPublishedEvents()) {
      expect(ev.correlationId).toBe(CORRELATION_ID);
    }
  });

  it('HotelMatched event validates against schema', async () => {
    candidateRepo.addCandidate(makeCandidateTrip());
    await service.handleBookingCreated(makeBookingInput(), { correlationId: CORRELATION_ID });

    const ev = bus.getEventsByType('HotelMatched')[0]!;
    const result = validator.validateEvent('hotel-matched', ev);
    expect(result.errors).toHaveLength(0);
    expect(result.valid).toBe(true);
  });

  it('HotelCoverageUpdated event validates against schema', async () => {
    candidateRepo.addCandidate(makeCandidateTrip());
    await service.handleBookingCreated(makeBookingInput(), { correlationId: CORRELATION_ID });

    const ev = bus.getEventsByType('HotelCoverageUpdated')[0]!;
    const result = validator.validateEvent('hotel-coverage-updated', ev);
    expect(result.errors).toHaveLength(0);
    expect(result.valid).toBe(true);
  });
});

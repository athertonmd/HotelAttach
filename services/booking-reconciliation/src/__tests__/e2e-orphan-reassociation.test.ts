/**
 * E2E Test: Orphan Booking and Reassociation Flow
 *
 * Scenario 1: BookingCreated → no candidate trips → orphan stored → HotelOrphanDetected published
 * Scenario 2: Orphan exists → candidate trip arrives later → reassessment → orphan resolved → HotelMatched + HotelCoverageUpdated published
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

const TENANT_ID = 'a1b2c3d4-1111-4000-8000-000000000001';
const TRAVELLER_ID = 'a1b2c3d4-2222-4000-8000-000000000002';
const BOOKING_ID = 'a1b2c3d4-3333-4000-8000-000000000003';
const TRIP_ID = 'a1b2c3d4-4444-4000-8000-000000000004';
const CORRELATION_ID_ORPHAN = 'a1b2c3d4-5555-4000-8000-000000000005';
const CORRELATION_ID_REASSOC = 'a1b2c3d4-6666-4000-8000-000000000006';

function makeBookingInput(): CreateHotelBookingInput {
  return {
    tenantId: TENANT_ID,
    bookingId: BOOKING_ID,
    travellerId: TRAVELLER_ID,
    bookingVersion: 1,
    hotelName: 'Park Hyatt',
    city: 'Paris',
    country: 'FR',
    checkinDate: new Date('2026-09-10'),
    checkoutDate: new Date('2026-09-14'),
    bookingDate: new Date('2026-08-20'),
    roomNights: 4,
    status: 'confirmed',
    employeeNumber: 'EMP-700',
    email: 'alice@corp.com',
  };
}

/**
 * High-confidence candidate that should resolve the orphan:
 * - Same travellerId (+50)
 * - Same city Paris (+15)
 * - Same country FR (+10)
 * - Date overlap: trip covers hotel dates (+25)
 * - Full night coverage: hotel covers trip range (+20)
 * Total: 100 (capped) → matched
 */
function makeHighConfidenceCandidate(): ReconciliationCandidate {
  return ReconciliationCandidate.create({
    tenantId: TENANT_ID,
    bookingId: BOOKING_ID,
    travellerId: TRAVELLER_ID,
    candidateTripId: TRIP_ID,
    tripStartDate: new Date('2026-09-10'),
    tripEndDate: new Date('2026-09-14'),
    tripDestinationCity: 'Paris',
    tripDestinationCountry: 'FR',
    candidateSource: 'trip_created',
  });
}

describe('E2E: Orphan Booking and Reassociation Flow', () => {
  let service: BookingReconciliationService;
  let bus: InMemoryEventBus;
  let orphanRepo: InMemoryOrphanBookingRepository;
  let matchRepo: InMemoryReconciliationMatchRepository;
  let candidateRepo: InMemoryCandidateTripRepository;
  let validator: SchemaValidator;

  beforeEach(() => {
    bus = new InMemoryEventBus();
    const bookingRepo = new InMemoryHotelBookingRepository();
    matchRepo = new InMemoryReconciliationMatchRepository();
    orphanRepo = new InMemoryOrphanBookingRepository();
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

  // --- Scenario 1: Orphan Detection ---

  it('BookingCreated with no candidates creates orphan booking', async () => {
    const result = await service.handleBookingCreated(makeBookingInput(), {
      correlationId: CORRELATION_ID_ORPHAN,
    });

    expect(result.success).toBe(true);

    const orphans = await orphanRepo.findAll(TENANT_ID);
    expect(orphans).toHaveLength(1);
    expect(orphans[0]!.bookingId).toBe(BOOKING_ID);
    expect(orphans[0]!.travellerId).toBe(TRAVELLER_ID);
    expect(orphans[0]!.tenantId).toBe(TENANT_ID);
  });

  it('HotelOrphanDetected event is published', async () => {
    await service.handleBookingCreated(makeBookingInput(), {
      correlationId: CORRELATION_ID_ORPHAN,
    });

    const orphanEvents = bus.getEventsByType('HotelOrphanDetected');
    expect(orphanEvents).toHaveLength(1);
    expect(orphanEvents[0]!.eventType).toBe('HotelOrphanDetected');
  });

  it('orphan reassociation deadline is 30 days from detection', async () => {
    await service.handleBookingCreated(makeBookingInput(), {
      correlationId: CORRELATION_ID_ORPHAN,
    });

    const orphans = await orphanRepo.findAll(TENANT_ID);
    const orphan = orphans[0]!;
    const detectedMs = orphan.detectedAt.getTime();
    const deadlineMs = orphan.reassociationDeadline.getTime();
    const daysDiff = (deadlineMs - detectedMs) / (1000 * 60 * 60 * 24);
    expect(daysDiff).toBe(30);
  });

  it('tenantId preserved in orphan booking', async () => {
    await service.handleBookingCreated(makeBookingInput(), {
      correlationId: CORRELATION_ID_ORPHAN,
    });

    const orphans = await orphanRepo.findAll(TENANT_ID);
    expect(orphans[0]!.tenantId).toBe(TENANT_ID);
  });

  it('correlationId preserved in HotelOrphanDetected event', async () => {
    await service.handleBookingCreated(makeBookingInput(), {
      correlationId: CORRELATION_ID_ORPHAN,
    });

    const ev = bus.getEventsByType('HotelOrphanDetected')[0]!;
    expect(ev.correlationId).toBe(CORRELATION_ID_ORPHAN);
  });

  it('HotelOrphanDetected event validates against schema', async () => {
    await service.handleBookingCreated(makeBookingInput(), {
      correlationId: CORRELATION_ID_ORPHAN,
    });

    const ev = bus.getEventsByType('HotelOrphanDetected')[0]!;
    const result = validator.validateEvent('hotel-orphan-detected', ev);
    expect(result.errors).toHaveLength(0);
    expect(result.valid).toBe(true);
  });

  // --- Scenario 2: Orphan Reassociation ---

  it('later trip triggers reassessment and resolves orphan', async () => {
    // Step 1: booking arrives with no candidates → orphan
    await service.handleBookingCreated(makeBookingInput(), {
      correlationId: CORRELATION_ID_ORPHAN,
    });
    expect(await orphanRepo.findAll(TENANT_ID)).toHaveLength(1);
    bus.clear();

    // Step 2: candidate trip arrives, reassess
    candidateRepo.addCandidate(makeHighConfidenceCandidate());
    const reassessResult = await service.handleTripCreatedOrUpdated(TENANT_ID, TRAVELLER_ID, {
      correlationId: CORRELATION_ID_REASSOC,
    });
    expect(reassessResult.success).toBe(true);

    // Orphan should be removed
    const remaining = await orphanRepo.findAll(TENANT_ID);
    expect(remaining).toHaveLength(0);
  });

  it('HotelMatched event is published after reassociation', async () => {
    await service.handleBookingCreated(makeBookingInput(), {
      correlationId: CORRELATION_ID_ORPHAN,
    });
    bus.clear();

    candidateRepo.addCandidate(makeHighConfidenceCandidate());
    await service.handleTripCreatedOrUpdated(TENANT_ID, TRAVELLER_ID, {
      correlationId: CORRELATION_ID_REASSOC,
    });

    const matchedEvents = bus.getEventsByType('HotelMatched');
    expect(matchedEvents).toHaveLength(1);
    expect(matchedEvents[0]!.eventType).toBe('HotelMatched');
  });

  it('HotelCoverageUpdated event is published after reassociation', async () => {
    await service.handleBookingCreated(makeBookingInput(), {
      correlationId: CORRELATION_ID_ORPHAN,
    });
    bus.clear();

    candidateRepo.addCandidate(makeHighConfidenceCandidate());
    await service.handleTripCreatedOrUpdated(TENANT_ID, TRAVELLER_ID, {
      correlationId: CORRELATION_ID_REASSOC,
    });

    const coverageEvents = bus.getEventsByType('HotelCoverageUpdated');
    expect(coverageEvents).toHaveLength(1);
  });

  it('tenantId preserved in reassociation events', async () => {
    await service.handleBookingCreated(makeBookingInput(), {
      correlationId: CORRELATION_ID_ORPHAN,
    });
    bus.clear();

    candidateRepo.addCandidate(makeHighConfidenceCandidate());
    await service.handleTripCreatedOrUpdated(TENANT_ID, TRAVELLER_ID, {
      correlationId: CORRELATION_ID_REASSOC,
    });

    for (const ev of bus.getPublishedEvents()) {
      expect(ev.tenantId).toBe(TENANT_ID);
      const payload = ev.payload as Record<string, unknown>;
      expect(payload.tenantId).toBe(TENANT_ID);
    }
  });

  it('correlationId preserved in reassociation events', async () => {
    await service.handleBookingCreated(makeBookingInput(), {
      correlationId: CORRELATION_ID_ORPHAN,
    });
    bus.clear();

    candidateRepo.addCandidate(makeHighConfidenceCandidate());
    await service.handleTripCreatedOrUpdated(TENANT_ID, TRAVELLER_ID, {
      correlationId: CORRELATION_ID_REASSOC,
    });

    for (const ev of bus.getPublishedEvents()) {
      expect(ev.correlationId).toBe(CORRELATION_ID_REASSOC);
    }
  });

  it('reassociation HotelMatched event validates against schema', async () => {
    await service.handleBookingCreated(makeBookingInput(), {
      correlationId: CORRELATION_ID_ORPHAN,
    });
    bus.clear();

    candidateRepo.addCandidate(makeHighConfidenceCandidate());
    await service.handleTripCreatedOrUpdated(TENANT_ID, TRAVELLER_ID, {
      correlationId: CORRELATION_ID_REASSOC,
    });

    const ev = bus.getEventsByType('HotelMatched')[0]!;
    const result = validator.validateEvent('hotel-matched', ev);
    expect(result.errors).toHaveLength(0);
    expect(result.valid).toBe(true);
  });

  it('reassociation HotelCoverageUpdated event validates against schema', async () => {
    await service.handleBookingCreated(makeBookingInput(), {
      correlationId: CORRELATION_ID_ORPHAN,
    });
    bus.clear();

    candidateRepo.addCandidate(makeHighConfidenceCandidate());
    await service.handleTripCreatedOrUpdated(TENANT_ID, TRAVELLER_ID, {
      correlationId: CORRELATION_ID_REASSOC,
    });

    const ev = bus.getEventsByType('HotelCoverageUpdated')[0]!;
    const result = validator.validateEvent('hotel-coverage-updated', ev);
    expect(result.errors).toHaveLength(0);
    expect(result.valid).toBe(true);
  });
});

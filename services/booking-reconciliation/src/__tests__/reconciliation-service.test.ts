import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryEventBus } from '@hci/event-contracts';
import { BookingReconciliationService } from '../services/reconciliation-service.js';
import {
  InMemoryHotelBookingRepository,
  InMemoryReconciliationMatchRepository,
  InMemoryOrphanBookingRepository,
  InMemoryCoverageAssessmentRepository,
  InMemoryCandidateTripRepository,
} from '../repositories/in-memory.js';
import { ReconciliationCandidate } from '../domain/reconciliation-candidate.js';

const TENANT = 'tenant-001';
const CORR = 'corr-test-123';

function validBookingInput(overrides = {}) {
  return {
    tenantId: TENANT,
    bookingId: 'b-001',
    travellerId: 'trav-001',
    bookingVersion: 1,
    hotelName: 'Marriott',
    city: 'New York',
    country: 'US',
    checkinDate: new Date('2026-06-15'),
    checkoutDate: new Date('2026-06-19'),
    bookingDate: new Date('2026-06-01'),
    roomNights: 4,
    status: 'confirmed' as const,
    employeeNumber: 'EMP-100',
    email: 'jane@corp.com',
    ...overrides,
  };
}

function makeHighConfidenceCandidate() {
  return ReconciliationCandidate.create({
    tenantId: TENANT,
    bookingId: 'b-001',
    travellerId: 'trav-001',
    candidateTripId: 'trip-001',
    tripStartDate: new Date('2026-06-14'),
    tripEndDate: new Date('2026-06-20'),
    tripDestinationCity: 'New York',
    tripDestinationCountry: 'US',
    candidateSource: 'booking_created',
  });
}

function makeLowConfidenceCandidate() {
  return ReconciliationCandidate.create({
    tenantId: TENANT,
    bookingId: 'b-001',
    travellerId: 'trav-other',
    candidateTripId: 'trip-002',
    tripStartDate: new Date('2026-01-01'),
    tripEndDate: new Date('2026-01-05'),
    tripDestinationCity: 'Tokyo',
    tripDestinationCountry: 'JP',
    candidateSource: 'booking_created',
  });
}

describe('BookingReconciliationService', () => {
  let service: BookingReconciliationService;
  let bus: InMemoryEventBus;
  let candidateRepo: InMemoryCandidateTripRepository;
  let orphanRepo: InMemoryOrphanBookingRepository;
  let bookingRepo: InMemoryHotelBookingRepository;

  beforeEach(() => {
    bus = new InMemoryEventBus();
    bookingRepo = new InMemoryHotelBookingRepository();
    const matchRepo = new InMemoryReconciliationMatchRepository();
    orphanRepo = new InMemoryOrphanBookingRepository();
    const coverageRepo = new InMemoryCoverageAssessmentRepository();
    candidateRepo = new InMemoryCandidateTripRepository();
    service = new BookingReconciliationService(
      bookingRepo,
      matchRepo,
      orphanRepo,
      coverageRepo,
      candidateRepo,
      bus,
    );
  });

  it('high-confidence candidate publishes HotelMatched + HotelCoverageUpdated', async () => {
    candidateRepo.addCandidate(makeHighConfidenceCandidate());
    const result = await service.handleBookingCreated(validBookingInput(), { correlationId: CORR });
    expect(result.success).toBe(true);
    expect(bus.getEventsByType('HotelMatched')).toHaveLength(1);
    expect(bus.getEventsByType('HotelCoverageUpdated')).toHaveLength(1);
  });

  it('no candidates publishes HotelOrphanDetected', async () => {
    const result = await service.handleBookingCreated(validBookingInput(), { correlationId: CORR });
    expect(result.success).toBe(true);
    expect(bus.getEventsByType('HotelOrphanDetected')).toHaveLength(1);
  });

  it('low confidence publishes HotelRejected', async () => {
    candidateRepo.addCandidate(
      ReconciliationCandidate.create({
        tenantId: TENANT,
        bookingId: 'b-001',
        travellerId: 'trav-001',
        candidateTripId: 'trip-002',
        tripStartDate: new Date('2026-01-01'),
        tripEndDate: new Date('2026-01-05'),
        tripDestinationCity: 'Tokyo',
        tripDestinationCountry: 'JP',
        candidateSource: 'booking_created',
      }),
    );
    const result = await service.handleBookingCreated(
      validBookingInput({ city: 'London', country: 'UK', email: null, employeeNumber: null }),
    );
    expect(result.success).toBe(true);
    expect(bus.getEventsByType('HotelRejected')).toHaveLength(1);
  });

  it('60-79 candidate stores result but no matched/rejected event', async () => {
    // Traveller match (+50) + country (+10) = 60
    candidateRepo.addCandidate(
      ReconciliationCandidate.create({
        tenantId: TENANT,
        bookingId: 'b-001',
        travellerId: 'trav-001',
        candidateTripId: 'trip-003',
        tripStartDate: new Date('2026-01-01'),
        tripEndDate: new Date('2026-01-05'),
        tripDestinationCity: 'Chicago',
        tripDestinationCountry: 'US',
        candidateSource: 'booking_created',
      }),
    );
    const result = await service.handleBookingCreated(
      validBookingInput({
        city: 'Boston',
        checkinDate: new Date('2026-03-01'),
        checkoutDate: new Date('2026-03-03'),
        roomNights: 2,
        email: null,
        employeeNumber: null,
      }),
    );
    expect(result.success).toBe(true);
    expect(bus.getEventsByType('HotelMatched')).toHaveLength(0);
    expect(bus.getEventsByType('HotelRejected')).toHaveLength(0);
    expect(bus.getEventsByType('HotelOrphanDetected')).toHaveLength(0);
  });

  it('BookingUpdated triggers reassessment', async () => {
    candidateRepo.addCandidate(makeHighConfidenceCandidate());
    await service.handleBookingCreated(validBookingInput());
    bus.clear();
    await service.handleBookingUpdated(validBookingInput({ bookingVersion: 2 }));
    expect(bus.getEventsByType('HotelMatched')).toHaveLength(1);
  });

  it('BookingCancelled publishes HotelCoverageUpdated', async () => {
    candidateRepo.addCandidate(makeHighConfidenceCandidate());
    await service.handleBookingCreated(validBookingInput());
    bus.clear();
    await service.handleBookingCancelled(TENANT, 'b-001', { correlationId: CORR });
    expect(bus.getEventsByType('HotelCoverageUpdated')).toHaveLength(1);
  });

  it('TripCreated reassesses orphan bookings', async () => {
    // First: create orphan
    await service.handleBookingCreated(validBookingInput());
    expect(bus.getEventsByType('HotelOrphanDetected')).toHaveLength(1);
    bus.clear();

    // Then: trip arrives, add candidate and reassess
    candidateRepo.addCandidate(makeHighConfidenceCandidate());
    await service.handleTripCreatedOrUpdated(TENANT, 'trav-001', { correlationId: CORR });
    expect(bus.getEventsByType('HotelMatched')).toHaveLength(1);
    // Orphan should be removed
    const orphans = await orphanRepo.findAll(TENANT);
    expect(orphans).toHaveLength(0);
  });

  it('tenantId preserved in events', async () => {
    candidateRepo.addCandidate(makeHighConfidenceCandidate());
    await service.handleBookingCreated(validBookingInput());
    const ev = bus.getEventsByType('HotelMatched')[0];
    expect(ev?.tenantId).toBe(TENANT);
  });

  it('correlationId preserved in events', async () => {
    candidateRepo.addCandidate(makeHighConfidenceCandidate());
    await service.handleBookingCreated(validBookingInput(), { correlationId: CORR });
    for (const ev of bus.getPublishedEvents()) {
      expect(ev.correlationId).toBe(CORR);
    }
  });

  it('no event on failed validation', async () => {
    const result = await service.handleBookingCreated({ ...validBookingInput(), hotelName: '' });
    expect(result.success).toBe(false);
    expect(bus.getPublishedEvents()).toHaveLength(0);
  });
});

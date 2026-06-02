import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryEventBus } from '@hci/event-contracts';
import { TravellerService } from '../services/traveller-service.js';
import { PNRService } from '../services/pnr-service.js';
import { TripService } from '../services/trip-service.js';
import {
  InMemoryTravellerRepository,
  InMemoryPNRRepository,
  InMemoryTripRepository,
} from '../repositories/in-memory.js';

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const CORPORATE_ID = '22222222-2222-2222-2222-222222222222';

describe('TravellerService', () => {
  let service: TravellerService;
  let repo: InMemoryTravellerRepository;
  let bus: InMemoryEventBus;

  beforeEach(() => {
    repo = new InMemoryTravellerRepository();
    bus = new InMemoryEventBus();
    service = new TravellerService(repo, bus);
  });

  it('should create a traveller and publish TravellerCreated event', async () => {
    const result = await service.createTraveller({
      travellerId: 'trav-001',
      tenantId: TENANT_ID,
      corporateId: CORPORATE_ID,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@acme.com',
    });

    expect(result.success).toBe(true);
    expect(result.data?.travellerId).toBe('trav-001');

    const events = bus.getEventsByType('TravellerCreated');
    expect(events).toHaveLength(1);
    expect(events[0]?.tenantId).toBe(TENANT_ID);
  });

  it('should update a traveller and publish TravellerUpdated event', async () => {
    await service.createTraveller({
      travellerId: 'trav-001',
      tenantId: TENANT_ID,
      corporateId: CORPORATE_ID,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@acme.com',
    });

    const result = await service.updateTraveller({
      travellerId: 'trav-001',
      tenantId: TENANT_ID,
      email: 'jane.new@acme.com',
    });

    expect(result.success).toBe(true);
    expect(result.data?.email).toBe('jane.new@acme.com');

    const events = bus.getEventsByType('TravellerUpdated');
    expect(events).toHaveLength(1);
  });

  it('should fail to update non-existent traveller', async () => {
    const result = await service.updateTraveller({
      travellerId: 'trav-999',
      tenantId: TENANT_ID,
      email: 'new@acme.com',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
    expect(bus.getPublishedEvents()).toHaveLength(0);
  });

  it('should not publish event on failed creation', async () => {
    const result = await service.createTraveller({
      travellerId: '',
      tenantId: TENANT_ID,
      corporateId: CORPORATE_ID,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@acme.com',
    });

    expect(result.success).toBe(false);
    expect(bus.getPublishedEvents()).toHaveLength(0);
  });
});

describe('PNRService', () => {
  let service: PNRService;
  let repo: InMemoryPNRRepository;
  let bus: InMemoryEventBus;

  beforeEach(() => {
    repo = new InMemoryPNRRepository();
    bus = new InMemoryEventBus();
    service = new PNRService(repo, bus);
  });

  const validInput = {
    pnrId: 'pnr-001',
    tenantId: TENANT_ID,
    corporateId: CORPORATE_ID,
    recordLocator: 'ABC123',
    sourceSystem: 'Amadeus',
    bookingDate: new Date('2026-06-01'),
    travellerId: 'trav-001',
    version: 1,
    tripId: 'trip-001',
    segmentCount: 3,
  };

  it('should create a PNR and publish PNRCreated event', async () => {
    const result = await service.createPNR(validInput);

    expect(result.success).toBe(true);
    expect(result.data?.pnrId).toBe('pnr-001');

    const events = bus.getEventsByType('PNRCreated');
    expect(events).toHaveLength(1);
    expect(events[0]?.tenantId).toBe(TENANT_ID);
  });

  it('should update a PNR with newer version and publish PNRUpdated', async () => {
    await service.createPNR(validInput);

    const result = await service.updatePNR({ ...validInput, version: 2, segmentCount: 4 });

    expect(result.success).toBe(true);
    expect(result.data?.version).toBe(2);

    const events = bus.getEventsByType('PNRUpdated');
    expect(events).toHaveLength(1);
  });

  it('should reject old PNR version and not publish event', async () => {
    await service.createPNR({ ...validInput, version: 3 });
    bus.clear();

    const result = await service.updatePNR({ ...validInput, version: 2 });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not newer');
    expect(bus.getPublishedEvents()).toHaveLength(0);
  });

  it('should reject same PNR version', async () => {
    await service.createPNR(validInput);
    bus.clear();

    const result = await service.updatePNR(validInput);

    expect(result.success).toBe(false);
    expect(result.error).toContain('not newer');
    expect(bus.getPublishedEvents()).toHaveLength(0);
  });

  it('should preserve correlationId', async () => {
    const correlationId = 'corr-12345';
    const result = await service.createPNR(validInput, { correlationId });

    expect(result.success).toBe(true);
    const events = bus.getEventsByType('PNRCreated');
    expect(events[0]?.correlationId).toBe(correlationId);
  });
});

describe('TripService', () => {
  let service: TripService;
  let repo: InMemoryTripRepository;
  let bus: InMemoryEventBus;

  const tripContext = { origin: 'LHR', destination: 'JFK', isInternational: true };
  const flightData = {
    flightNumber: 'BA117',
    airline: 'British Airways',
    cabinClass: 'business' as const,
    bookingClass: 'J',
  };

  beforeEach(() => {
    repo = new InMemoryTripRepository();
    bus = new InMemoryEventBus();
    service = new TripService(repo, bus);
  });

  it('should create a trip (no event until segment added)', async () => {
    const result = await service.createTrip({
      tripId: 'trip-001',
      tenantId: TENANT_ID,
      corporateId: CORPORATE_ID,
      travellerId: 'trav-001',
      origin: 'LHR',
      destination: 'JFK',
      isInternational: true,
    });

    expect(result.success).toBe(true);
    expect(result.data?.tripId).toBe('trip-001');
    expect(bus.getPublishedEvents()).toHaveLength(0);
  });

  it('should add a segment and publish SegmentAdded + TripCreated events', async () => {
    await service.createTrip({
      tripId: 'trip-001',
      tenantId: TENANT_ID,
      corporateId: CORPORATE_ID,
      travellerId: 'trav-001',
      origin: 'LHR',
      destination: 'JFK',
      isInternational: true,
    });

    const result = await service.addSegment(
      TENANT_ID,
      'trip-001',
      {
        segmentId: 'seg-001',
        tripId: 'trip-001',
        segmentType: 'flight',
        startDatetime: new Date('2026-06-15T08:00:00Z'),
        endDatetime: new Date('2026-06-15T11:30:00Z'),
        origin: 'LHR',
        destination: 'JFK',
        typeSpecificData: flightData,
        supplierCode: 'BA',
      },
      tripContext,
    );

    expect(result.success).toBe(true);
    expect(result.data?.segmentId).toBe('seg-001');

    const segEvents = bus.getEventsByType('SegmentAdded');
    expect(segEvents).toHaveLength(1);

    const tripEvents = bus.getEventsByType('TripCreated');
    expect(tripEvents).toHaveLength(1);
  });

  it('should update a segment and publish SegmentUpdated event', async () => {
    await service.createTrip({
      tripId: 'trip-001',
      tenantId: TENANT_ID,
      corporateId: CORPORATE_ID,
      travellerId: 'trav-001',
      origin: 'LHR',
      destination: 'JFK',
      isInternational: true,
    });

    await service.addSegment(
      TENANT_ID,
      'trip-001',
      {
        segmentId: 'seg-001',
        tripId: 'trip-001',
        segmentType: 'flight',
        startDatetime: new Date('2026-06-15T08:00:00Z'),
        endDatetime: new Date('2026-06-15T11:30:00Z'),
        origin: 'LHR',
        destination: 'JFK',
        typeSpecificData: flightData,
        supplierCode: 'BA',
      },
      tripContext,
    );

    bus.clear();

    const result = await service.updateSegment(TENANT_ID, 'trip-001', {
      segmentId: 'seg-001',
      startDatetime: new Date('2026-06-15T09:00:00Z'),
      endDatetime: new Date('2026-06-15T12:30:00Z'),
      typeSpecificData: flightData,
      supplierCode: 'BA',
    });

    expect(result.success).toBe(true);
    expect(result.data?.version).toBe(2);

    const events = bus.getEventsByType('SegmentUpdated');
    expect(events).toHaveLength(1);
  });

  it('should remove a segment and publish SegmentRemoved event', async () => {
    await service.createTrip({
      tripId: 'trip-001',
      tenantId: TENANT_ID,
      corporateId: CORPORATE_ID,
      travellerId: 'trav-001',
      origin: 'LHR',
      destination: 'JFK',
      isInternational: true,
    });

    await service.addSegment(
      TENANT_ID,
      'trip-001',
      {
        segmentId: 'seg-001',
        tripId: 'trip-001',
        segmentType: 'flight',
        startDatetime: new Date('2026-06-15T08:00:00Z'),
        endDatetime: new Date('2026-06-15T11:30:00Z'),
        origin: 'LHR',
        destination: 'JFK',
        typeSpecificData: flightData,
        supplierCode: 'BA',
      },
      tripContext,
    );

    bus.clear();

    const result = await service.removeSegment(TENANT_ID, 'trip-001', {
      segmentId: 'seg-001',
      typeSpecificData: flightData,
      supplierCode: 'BA',
    });

    expect(result.success).toBe(true);
    const events = bus.getEventsByType('SegmentRemoved');
    expect(events).toHaveLength(1);
  });

  it('should add a timeline event', async () => {
    await service.createTrip({
      tripId: 'trip-001',
      tenantId: TENANT_ID,
      corporateId: CORPORATE_ID,
      travellerId: 'trav-001',
      origin: 'LHR',
      destination: 'JFK',
      isInternational: true,
    });

    const result = await service.addTimelineEvent(TENANT_ID, 'trip-001', {
      eventType: 'booking_created',
      eventData: { source: 'Amadeus' },
    });

    expect(result.success).toBe(true);

    const trip = await repo.findById(TENANT_ID, 'trip-001');
    expect(trip?.timeline).toHaveLength(1);
  });

  it('should fail when trip not found', async () => {
    const result = await service.addSegment(
      TENANT_ID,
      'trip-999',
      {
        segmentId: 'seg-001',
        tripId: 'trip-999',
        segmentType: 'flight',
        startDatetime: new Date('2026-06-15T08:00:00Z'),
        endDatetime: new Date('2026-06-15T11:30:00Z'),
        origin: 'LHR',
        destination: 'JFK',
        typeSpecificData: flightData,
        supplierCode: 'BA',
      },
      tripContext,
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain('not found');
    expect(bus.getPublishedEvents()).toHaveLength(0);
  });

  it('should preserve correlationId in published events', async () => {
    await service.createTrip({
      tripId: 'trip-001',
      tenantId: TENANT_ID,
      corporateId: CORPORATE_ID,
      travellerId: 'trav-001',
      origin: 'LHR',
      destination: 'JFK',
      isInternational: true,
    });

    const correlationId = 'workflow-corr-id-abc';
    await service.addSegment(
      TENANT_ID,
      'trip-001',
      {
        segmentId: 'seg-001',
        tripId: 'trip-001',
        segmentType: 'flight',
        startDatetime: new Date('2026-06-15T08:00:00Z'),
        endDatetime: new Date('2026-06-15T11:30:00Z'),
        origin: 'LHR',
        destination: 'JFK',
        typeSpecificData: flightData,
        supplierCode: 'BA',
      },
      tripContext,
      { correlationId },
    );

    const events = bus.getPublishedEvents();
    for (const event of events) {
      expect(event.correlationId).toBe(correlationId);
    }
  });

  it('should update trip status and publish TripUpdated', async () => {
    await service.createTrip({
      tripId: 'trip-001',
      tenantId: TENANT_ID,
      corporateId: CORPORATE_ID,
      travellerId: 'trav-001',
      origin: 'LHR',
      destination: 'JFK',
      isInternational: true,
    });

    // Add a segment first (TripUpdated requires segments)
    await service.addSegment(
      TENANT_ID,
      'trip-001',
      {
        segmentId: 'seg-001',
        tripId: 'trip-001',
        segmentType: 'flight',
        startDatetime: new Date('2026-06-15T08:00:00Z'),
        endDatetime: new Date('2026-06-15T11:30:00Z'),
        origin: 'LHR',
        destination: 'JFK',
        typeSpecificData: flightData,
        supplierCode: 'BA',
      },
      tripContext,
    );

    bus.clear();

    const result = await service.updateTripStatus(TENANT_ID, 'trip-001', 'booked', tripContext);

    expect(result.success).toBe(true);
    const events = bus.getEventsByType('TripUpdated');
    expect(events).toHaveLength(1);
  });
});

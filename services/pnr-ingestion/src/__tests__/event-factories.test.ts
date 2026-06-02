import { describe, it, expect } from 'vitest';
import { PNR } from '../domain/pnr.js';
import { Trip } from '../domain/trip.js';
import { Segment } from '../domain/segment.js';
import { createPNRCreatedEvent, createPNRUpdatedEvent } from '../events/pnr-event-factory.js';
import { createTripCreatedEvent, createTripUpdatedEvent } from '../events/trip-event-factory.js';
import {
  createSegmentAddedEvent,
  createSegmentUpdatedEvent,
  createSegmentRemovedEvent,
} from '../events/segment-event-factory.js';
import { deriveCorrelation, createEnvelope } from '@hci/event-contracts';

const TENANT_ID = '11111111-1111-1111-1111-111111111111';
const CORPORATE_ID = '22222222-2222-2222-2222-222222222222';

function makePNR() {
  return PNR.create({
    pnrId: '44444444-4444-4444-4444-444444444444',
    tenantId: TENANT_ID,
    corporateId: CORPORATE_ID,
    recordLocator: 'ABC123',
    sourceSystem: 'Amadeus',
    bookingDate: new Date('2026-06-01'),
    travellerId: '55555555-5555-5555-5555-555555555555',
    version: 1,
    rawPnrRef: 's3://hci-raw-pnrs/2026/06/01/ABC123.json',
  });
}

function makeTrip() {
  const trip = Trip.create({
    tripId: '66666666-6666-6666-6666-666666666666',
    tenantId: TENANT_ID,
    corporateId: CORPORATE_ID,
    travellerId: '55555555-5555-5555-5555-555555555555',
    startDate: new Date('2026-06-15T08:00:00Z'),
    endDate: new Date('2026-06-19T18:00:00Z'),
  });
  trip.addSegment({
    segmentId: '77777777-7777-7777-7777-777777777777',
    tripId: trip.tripId,
    segmentType: 'flight',
    startDatetime: new Date('2026-06-15T08:00:00Z'),
    endDatetime: new Date('2026-06-15T11:30:00Z'),
    origin: 'LHR',
    destination: 'JFK',
  });
  return trip;
}

function makeSegment() {
  return Segment.create({
    segmentId: '77777777-7777-7777-7777-777777777777',
    tripId: '66666666-6666-6666-6666-666666666666',
    segmentType: 'flight',
    startDatetime: new Date('2026-06-15T08:00:00Z'),
    endDatetime: new Date('2026-06-15T11:30:00Z'),
    origin: 'LHR',
    destination: 'JFK',
  });
}

describe('PNR Event Factory', () => {
  it('should create a valid PNRCreated event', () => {
    const pnr = makePNR();
    const result = createPNRCreatedEvent(pnr, {
      tripId: '66666666-6666-6666-6666-666666666666',
      segmentCount: 3,
    });

    expect(result.success).toBe(true);
    expect(result.event).toBeDefined();
    expect(result.event?.eventType).toBe('PNRCreated');
    expect(result.event?.tenantId).toBe(TENANT_ID);
    expect(result.event?.corporateId).toBe(CORPORATE_ID);
    expect(result.event?.payload.pnrId).toBe(pnr.pnrId);
    expect(result.event?.payload.recordLocator).toBe('ABC123');
    expect(result.event?.payload.gdsSource).toBe('Amadeus');
    expect(result.event?.payload.segmentCount).toBe(3);
    expect(result.event?.payload.rawPnrRef).toBe('s3://hci-raw-pnrs/2026/06/01/ABC123.json');
  });

  it('should create a valid PNRUpdated event', () => {
    const pnr = makePNR();
    const result = createPNRUpdatedEvent(pnr, {
      tripId: '66666666-6666-6666-6666-666666666666',
      segmentCount: 4,
    });

    expect(result.success).toBe(true);
    expect(result.event?.eventType).toBe('PNRUpdated');
    expect(result.event?.payload.segmentCount).toBe(4);
  });

  it('should reject missing tripId', () => {
    const pnr = makePNR();
    const result = createPNRCreatedEvent(pnr, {
      tripId: '',
      segmentCount: 3,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('tripId is required');
  });

  it('should reject segmentCount < 1', () => {
    const pnr = makePNR();
    const result = createPNRCreatedEvent(pnr, {
      tripId: '66666666-6666-6666-6666-666666666666',
      segmentCount: 0,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('segmentCount must be >= 1');
  });

  it('should preserve correlationId when provided', () => {
    const pnr = makePNR();
    const correlationId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const result = createPNRCreatedEvent(pnr, {
      tripId: '66666666-6666-6666-6666-666666666666',
      segmentCount: 3,
      correlationId,
    });

    expect(result.success).toBe(true);
    expect(result.event?.correlationId).toBe(correlationId);
  });

  it('should generate correlationId when not provided', () => {
    const pnr = makePNR();
    const result = createPNRCreatedEvent(pnr, {
      tripId: '66666666-6666-6666-6666-666666666666',
      segmentCount: 3,
    });

    expect(result.success).toBe(true);
    expect(result.event?.correlationId).toBeDefined();
    expect(result.event?.correlationId.length).toBeGreaterThan(0);
  });
});

describe('Trip Event Factory', () => {
  it('should create a valid TripCreated event', () => {
    const trip = makeTrip();
    const result = createTripCreatedEvent(trip, {
      origin: 'LHR',
      destination: 'JFK',
      isInternational: true,
    });

    expect(result.success).toBe(true);
    expect(result.event?.eventType).toBe('TripCreated');
    expect(result.event?.tenantId).toBe(TENANT_ID);
    expect(result.event?.payload.tripId).toBe(trip.tripId);
    expect(result.event?.payload.origin).toBe('LHR');
    expect(result.event?.payload.destination).toBe('JFK');
    expect(result.event?.payload.isInternational).toBe(true);
    expect(result.event?.payload.segmentIds).toHaveLength(1);
  });

  it('should create a valid TripUpdated event', () => {
    const trip = makeTrip();
    const result = createTripUpdatedEvent(trip, {
      origin: 'LHR',
      destination: 'JFK',
      isInternational: true,
    });

    expect(result.success).toBe(true);
    expect(result.event?.eventType).toBe('TripUpdated');
  });

  it('should reject trip with no segments', () => {
    const trip = Trip.create({
      tripId: '66666666-6666-6666-6666-666666666666',
      tenantId: TENANT_ID,
      corporateId: CORPORATE_ID,
      travellerId: '55555555-5555-5555-5555-555555555555',
    });

    const result = createTripCreatedEvent(trip, {
      origin: 'LHR',
      destination: 'JFK',
      isInternational: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('at least one segment');
  });

  it('should reject missing origin', () => {
    const trip = makeTrip();
    const result = createTripCreatedEvent(trip, {
      origin: '',
      destination: 'JFK',
      isInternational: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('origin is required');
  });

  it('should map draft status to created', () => {
    const trip = makeTrip();
    const result = createTripCreatedEvent(trip, {
      origin: 'LHR',
      destination: 'JFK',
      isInternational: true,
    });

    expect(result.event?.payload.status).toBe('created');
  });
});

describe('Segment Event Factory', () => {
  const flightData = {
    flightNumber: 'BA117',
    airline: 'British Airways',
    cabinClass: 'business' as const,
    bookingClass: 'J',
  };

  it('should create a valid SegmentAdded event', () => {
    const segment = makeSegment();
    const result = createSegmentAddedEvent(segment, {
      typeSpecificData: flightData,
      supplierCode: 'BA',
    });

    expect(result.success).toBe(true);
    expect(result.event?.eventType).toBe('SegmentAdded');
    expect(result.event?.payload.segmentId).toBe(segment.segmentId);
    expect(result.event?.payload.segmentType).toBe('flight');
    expect(result.event?.payload.origin).toBe('LHR');
    expect(result.event?.payload.destination).toBe('JFK');
    expect(result.event?.payload.supplierCode).toBe('BA');
    expect(result.event?.payload.typeSpecificData).toEqual(flightData);
  });

  it('should create a valid SegmentUpdated event', () => {
    const segment = makeSegment();
    const result = createSegmentUpdatedEvent(segment, {
      typeSpecificData: flightData,
      supplierCode: 'BA',
    });

    expect(result.success).toBe(true);
    expect(result.event?.eventType).toBe('SegmentUpdated');
  });

  it('should create a valid SegmentRemoved event', () => {
    const segment = makeSegment();
    const result = createSegmentRemovedEvent(segment, {
      typeSpecificData: flightData,
      supplierCode: 'BA',
    });

    expect(result.success).toBe(true);
    expect(result.event?.eventType).toBe('SegmentRemoved');
  });

  it('should reject segment type not supported by schema', () => {
    const segment = Segment.create({
      segmentId: '88888888-8888-8888-8888-888888888888',
      tripId: '66666666-6666-6666-6666-666666666666',
      segmentType: 'transfer',
      startDatetime: new Date('2026-06-15T12:00:00Z'),
      endDatetime: new Date('2026-06-15T13:00:00Z'),
      origin: 'JFK Airport',
      destination: 'Manhattan Hotel',
    });

    const result = createSegmentAddedEvent(segment, {
      typeSpecificData: flightData,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('cannot be mapped to event schema');
  });

  it('should reject missing typeSpecificData', () => {
    const segment = makeSegment();
    const result = createSegmentAddedEvent(segment, {
      typeSpecificData: undefined as unknown as typeof flightData,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('typeSpecificData is required');
  });
});

describe('Correlation and Causation', () => {
  it('should preserve correlationId across event chain', () => {
    const correlationId = 'workflow-correlation-id-12345678';

    const pnr = makePNR();
    const pnrResult = createPNRCreatedEvent(pnr, {
      tripId: '66666666-6666-6666-6666-666666666666',
      segmentCount: 3,
      correlationId,
    });

    expect(pnrResult.event?.correlationId).toBe(correlationId);

    // Derive correlation for downstream event
    const derived = deriveCorrelation(pnrResult.event!);
    expect(derived.correlationId).toBe(correlationId);
    expect(derived.causationId).toBe(pnrResult.event?.eventId);

    // Use derived correlation for trip event
    const trip = makeTrip();
    const tripResult = createTripCreatedEvent(trip, {
      origin: 'LHR',
      destination: 'JFK',
      isInternational: true,
      correlationId: derived.correlationId,
      causationId: derived.causationId,
    });

    expect(tripResult.event?.correlationId).toBe(correlationId);
  });

  it('should assign causationId from source event via deriveCorrelation', () => {
    const sourceEvent = createEnvelope({
      eventType: 'PNRCreated' as const,
      tenantId: TENANT_ID,
      corporateId: CORPORATE_ID,
      sourceService: 'hci\\.itinerary',
      payload: {},
    });

    const derived = deriveCorrelation(sourceEvent);
    expect(derived.causationId).toBe(sourceEvent.eventId);
    expect(derived.correlationId).toBe(sourceEvent.correlationId);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryEventBus } from '@hci/event-contracts';
import { IngestionService } from '../adapter/ingestion-service.js';
import { validateManticPointPayload } from '../adapter/validation.js';
import { mapSegmentType } from '../adapter/mapper.js';
import { TravellerService } from '../services/traveller-service.js';
import { PNRService } from '../services/pnr-service.js';
import { TripService } from '../services/trip-service.js';
import {
  InMemoryTravellerRepository,
  InMemoryPNRRepository,
  InMemoryTripRepository,
} from '../repositories/in-memory.js';
import type { ManticPointPayload } from '../adapter/mantic-point-dto.js';

const TENANT = 'tenant-aaa-aaa-aaa-aaa-aaaaaaaaaaaa';
const CORP = 'corp-bbb-bbb-bbb-bbb-bbbbbbbbbbbb';

function validPayload(): ManticPointPayload {
  return {
    tenantId: TENANT,
    corporateId: CORP,
    recordLocator: 'ABC123',
    sourceSystem: 'Amadeus',
    pnrVersion: 1,
    bookingDate: '2026-06-01T00:00:00Z',
    traveller: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@acme.com',
      employeeNumber: 'EMP-001',
    },
    segments: [
      {
        segmentId: 'seg-001',
        type: 'AIR',
        departureDate: '2026-06-15T08:00:00Z',
        arrivalDate: '2026-06-15T11:30:00Z',
        origin: 'LHR',
        destination: 'JFK',
        status: 'HK',
        supplier: 'BA',
        flightNumber: 'BA117',
        airline: 'British Airways',
        cabinClass: 'business',
        bookingClass: 'J',
      },
    ],
    isInternational: true,
  };
}

function hotelPayload(): ManticPointPayload {
  return {
    ...validPayload(),
    segments: [
      {
        segmentId: 'seg-002',
        type: 'HTL',
        departureDate: '2026-06-15T15:00:00Z',
        arrivalDate: '2026-06-19T11:00:00Z',
        origin: 'New York',
        destination: 'New York',
        status: 'HK',
        hotelName: 'Marriott Marquis',
        hotelChain: 'Marriott',
        roomNights: 4,
      },
    ],
  };
}

describe('IngestionService', () => {
  let ingestionService: IngestionService;
  let bus: InMemoryEventBus;
  let tripRepo: InMemoryTripRepository;

  beforeEach(() => {
    bus = new InMemoryEventBus();
    const travellerRepo = new InMemoryTravellerRepository();
    const pnrRepo = new InMemoryPNRRepository();
    tripRepo = new InMemoryTripRepository();
    const travellerService = new TravellerService(travellerRepo, bus);
    const pnrService = new PNRService(pnrRepo, bus);
    const tripService = new TripService(tripRepo, bus);
    ingestionService = new IngestionService(travellerService, pnrService, tripService);
  });

  it('should ingest a valid flight payload', async () => {
    const result = await ingestionService.ingest(validPayload());
    expect(result.success).toBe(true);
    expect(result.travellerId).toBeDefined();
    expect(result.tripId).toBeDefined();
    expect(result.pnrId).toBeDefined();
    expect(result.segmentCount).toBe(1);
  });

  it('should ingest a valid hotel payload', async () => {
    const result = await ingestionService.ingest(hotelPayload());
    expect(result.success).toBe(true);
    expect(result.segmentCount).toBe(1);
  });

  it('should emit events through application services', async () => {
    await ingestionService.ingest(validPayload());
    expect(bus.getEventsByType('TravellerCreated')).toHaveLength(1);
    expect(bus.getEventsByType('PNRCreated')).toHaveLength(1);
    expect(bus.getEventsByType('SegmentAdded')).toHaveLength(1);
    expect(bus.getEventsByType('TripCreated')).toHaveLength(1);
  });

  it('should preserve correlationId across all events', async () => {
    const correlationId = 'test-correlation-id-123';
    await ingestionService.ingest(validPayload(), { correlationId });
    for (const event of bus.getPublishedEvents()) {
      expect(event.correlationId).toBe(correlationId);
    }
  });

  it('should fail on missing tenantId', async () => {
    const payload = { ...validPayload(), tenantId: '' };
    const result = await ingestionService.ingest(payload);
    expect(result.success).toBe(false);
    expect(result.error).toContain('tenantId');
  });

  it('should generate timeline events on segment addition', async () => {
    const result = await ingestionService.ingest(validPayload());
    expect(result.success).toBe(true);
    const trips = await tripRepo.findByTenant(TENANT);
    expect(trips[0]?.timeline.length).toBeGreaterThan(0);
  });
});

describe('Payload Validation', () => {
  it('should accept a valid payload', () => {
    expect(validateManticPointPayload(validPayload()).valid).toBe(true);
  });
  it('should reject missing tenantId', () => {
    const r = validateManticPointPayload({ ...validPayload(), tenantId: '' });
    expect(r.valid).toBe(false);
  });
  it('should reject missing traveller', () => {
    const r = validateManticPointPayload({ ...validPayload(), traveller: undefined } as unknown);
    expect(r.valid).toBe(false);
  });
  it('should reject empty segments', () => {
    const r = validateManticPointPayload({ ...validPayload(), segments: [] });
    expect(r.valid).toBe(false);
  });
});

describe('Segment Type Mapping', () => {
  it('should map AIR to flight', () => {
    expect(mapSegmentType('AIR')).toBe('flight');
  });
  it('should map HTL to hotel', () => {
    expect(mapSegmentType('HTL')).toBe('hotel');
  });
  it('should map RAIL to rail', () => {
    expect(mapSegmentType('RAIL')).toBe('rail');
  });
  it('should map CAR to car', () => {
    expect(mapSegmentType('CAR')).toBe('car');
  });
  it('should map TRN to transfer', () => {
    expect(mapSegmentType('TRN')).toBe('transfer');
  });
  it('should throw for unsupported type', () => {
    expect(() => mapSegmentType('BUS')).toThrow('Unsupported');
  });
});

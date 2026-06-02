import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryEventBus } from '@hci/event-contracts';
import { PNRController } from '../api/pnr-controller.js';
import { TripController } from '../api/trip-controller.js';
import { TravellerController } from '../api/traveller-controller.js';
import { IngestionService } from '../adapter/ingestion-service.js';
import { TravellerService } from '../services/traveller-service.js';
import { PNRService } from '../services/pnr-service.js';
import { TripService } from '../services/trip-service.js';
import {
  InMemoryTravellerRepository,
  InMemoryPNRRepository,
  InMemoryTripRepository,
} from '../repositories/in-memory.js';
import type { RequestContext } from '../api/request-context.js';

const TENANT = 'tenant-aaa';
const CORP = 'corp-bbb';
const CORR = 'corr-123';

function ctx(overrides: Partial<RequestContext> = {}): RequestContext {
  return {
    tenantId: TENANT,
    corporateId: CORP,
    userId: 'user-1',
    correlationId: CORR,
    ...overrides,
  };
}

function validBody() {
  return {
    recordLocator: 'XYZ789',
    sourceSystem: 'Sabre',
    pnrVersion: 1,
    bookingDate: '2026-07-01T00:00:00Z',
    traveller: { firstName: 'Bob', lastName: 'Jones', email: 'bob@corp.com' },
    segments: [
      {
        segmentId: 's1',
        type: 'AIR',
        departureDate: '2026-07-10T06:00:00Z',
        arrivalDate: '2026-07-10T09:00:00Z',
        origin: 'CDG',
        destination: 'LHR',
        status: 'HK',
        flightNumber: 'AF1',
        airline: 'Air France',
        cabinClass: 'economy',
        bookingClass: 'Y',
      },
    ],
    isInternational: true,
  };
}

describe('PNRController', () => {
  let pnrCtrl: PNRController;
  let bus: InMemoryEventBus;

  beforeEach(() => {
    bus = new InMemoryEventBus();
    const travellerRepo = new InMemoryTravellerRepository();
    const pnrRepo = new InMemoryPNRRepository();
    const tripRepo = new InMemoryTripRepository();
    const travellerSvc = new TravellerService(travellerRepo, bus);
    const pnrSvc = new PNRService(pnrRepo, bus);
    const tripSvc = new TripService(tripRepo, bus);
    const ingestionSvc = new IngestionService(travellerSvc, pnrSvc, tripSvc);
    pnrCtrl = new PNRController(ingestionSvc);
  });

  it('should return 201 for valid payload', async () => {
    const res = await pnrCtrl.createPNR(validBody(), ctx());
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('pnrId');
    expect(res.body.correlationId).toBe(CORR);
  });

  it('should return 400 for invalid payload', async () => {
    const res = await pnrCtrl.createPNR({ recordLocator: 'X' }, ctx());
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 for missing tenantId', async () => {
    const res = await pnrCtrl.createPNR(validBody(), ctx({ tenantId: '' }));
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should include correlationId in all responses', async () => {
    const res = await pnrCtrl.createPNR(null, ctx());
    expect(res.body.correlationId).toBe(CORR);
  });

  it('should call application services (events emitted)', async () => {
    await pnrCtrl.createPNR(validBody(), ctx());
    expect(bus.getPublishedEvents().length).toBeGreaterThan(0);
  });
});

describe('TripController', () => {
  let tripCtrl: TripController;
  let tripRepo: InMemoryTripRepository;
  let bus: InMemoryEventBus;
  let ingestionSvc: IngestionService;

  beforeEach(() => {
    bus = new InMemoryEventBus();
    const travellerRepo = new InMemoryTravellerRepository();
    const pnrRepo = new InMemoryPNRRepository();
    tripRepo = new InMemoryTripRepository();
    const travellerSvc = new TravellerService(travellerRepo, bus);
    const pnrSvc = new PNRService(pnrRepo, bus);
    const tripSvc = new TripService(tripRepo, bus);
    ingestionSvc = new IngestionService(travellerSvc, pnrSvc, tripSvc);
    tripCtrl = new TripController(tripRepo);
  });

  it('should return trip by ID', async () => {
    const ingResult = await ingestionSvc.ingest({
      ...validBody(),
      tenantId: TENANT,
      corporateId: CORP,
    });
    const res = await tripCtrl.getTripById(ingResult.tripId!, ctx());
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 404 for non-existent trip', async () => {
    const res = await tripCtrl.getTripById('no-such-trip', ctx());
    expect(res.status).toBe(404);
  });

  it('should search trips by tenant', async () => {
    await ingestionSvc.ingest({ ...validBody(), tenantId: TENANT, corporateId: CORP });
    const res = await tripCtrl.searchTrips(ctx());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('should enforce tenant isolation', async () => {
    await ingestionSvc.ingest({ ...validBody(), tenantId: TENANT, corporateId: CORP });
    const res = await tripCtrl.searchTrips(ctx({ tenantId: 'other-tenant' }));
    expect(res.body.data).toEqual([]);
  });

  it('should return timeline in chronological order', async () => {
    const ingResult = await ingestionSvc.ingest({
      ...validBody(),
      tenantId: TENANT,
      corporateId: CORP,
    });
    const res = await tripCtrl.getTimeline(ingResult.tripId!, ctx());
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const timeline = res.body.data as { createdAt: string }[];
    expect(timeline.length).toBeGreaterThan(0);
  });
});

describe('TravellerController', () => {
  let travellerCtrl: TravellerController;
  let travellerRepo: InMemoryTravellerRepository;
  let bus: InMemoryEventBus;
  let ingestionSvc: IngestionService;

  beforeEach(() => {
    bus = new InMemoryEventBus();
    travellerRepo = new InMemoryTravellerRepository();
    const pnrRepo = new InMemoryPNRRepository();
    const tripRepo = new InMemoryTripRepository();
    const travellerSvc = new TravellerService(travellerRepo, bus);
    const pnrSvc = new PNRService(pnrRepo, bus);
    const tripSvc = new TripService(tripRepo, bus);
    ingestionSvc = new IngestionService(travellerSvc, pnrSvc, tripSvc);
    travellerCtrl = new TravellerController(travellerRepo);
  });

  it('should return traveller by ID', async () => {
    const ingResult = await ingestionSvc.ingest({
      ...validBody(),
      tenantId: TENANT,
      corporateId: CORP,
    });
    const res = await travellerCtrl.getTravellerById(ingResult.travellerId!, ctx());
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 404 for non-existent traveller', async () => {
    const res = await travellerCtrl.getTravellerById('no-such-id', ctx());
    expect(res.status).toBe(404);
  });

  it('should include correlationId in response', async () => {
    const res = await travellerCtrl.getTravellerById('x', ctx());
    expect(res.body.correlationId).toBe(CORR);
  });
});

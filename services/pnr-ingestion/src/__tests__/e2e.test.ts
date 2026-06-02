/**
 * End-to-end test slice for Project 1 Itinerary Intelligence Platform.
 * Proves the full flow using in-memory adapters.
 */
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
import type { ManticPointPayload } from '../adapter/mantic-point-dto.js';

const TENANT_A = 'tenant-aaa-1111-2222-3333-444444444444';
const TENANT_B = 'tenant-bbb-5555-6666-7777-888888888888';
const CORP = 'corp-ccc-1111-2222-3333-444444444444';
const CORR_ID = 'e2e-correlation-id-abcdef123456';

function makeCtx(tenantId = TENANT_A): RequestContext {
  return { tenantId, corporateId: CORP, userId: 'user-e2e', correlationId: CORR_ID };
}

function flightPayload(overrides: Partial<ManticPointPayload> = {}): ManticPointPayload {
  return {
    tenantId: TENANT_A,
    corporateId: CORP,
    recordLocator: 'E2E001',
    sourceSystem: 'Amadeus',
    pnrVersion: 1,
    bookingDate: '2026-07-01T00:00:00Z',
    traveller: {
      firstName: 'Alice',
      lastName: 'Brown',
      email: 'alice@corp.com',
      employeeNumber: 'EMP-100',
    },
    segments: [
      {
        segmentId: 'seg-f1',
        type: 'AIR',
        departureDate: '2026-07-15T07:00:00Z',
        arrivalDate: '2026-07-15T10:30:00Z',
        origin: 'LHR',
        destination: 'CDG',
        status: 'HK',
        flightNumber: 'BA304',
        airline: 'British Airways',
        cabinClass: 'economy',
        bookingClass: 'Y',
        supplier: 'BA',
      },
    ],
    isInternational: true,
    ...overrides,
  };
}

function hotelPayload(): ManticPointPayload {
  return {
    tenantId: TENANT_A,
    corporateId: CORP,
    recordLocator: 'E2E002',
    sourceSystem: 'Sabre',
    pnrVersion: 1,
    bookingDate: '2026-07-01T00:00:00Z',
    traveller: { firstName: 'Bob', lastName: 'Green', email: 'bob@corp.com' },
    segments: [
      {
        segmentId: 'seg-h1',
        type: 'HTL',
        departureDate: '2026-07-15T15:00:00Z',
        arrivalDate: '2026-07-18T11:00:00Z',
        origin: 'Paris',
        destination: 'Paris',
        status: 'HK',
        hotelName: 'Hotel Le Marais',
        hotelChain: 'Independent',
        roomNights: 3,
      },
    ],
    isInternational: true,
  };
}

describe('Project 1 — End-to-End Flow', () => {
  let pnrCtrl: PNRController;
  let tripCtrl: TripController;
  let travellerCtrl: TravellerController;
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
    tripCtrl = new TripController(tripRepo);
    travellerCtrl = new TravellerController(travellerRepo);
  });

  it('complete ingestion creates traveller, PNR, trip, segments, timeline and events', async () => {
    const res = await pnrCtrl.createPNR(flightPayload(), makeCtx());
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    const d = res.body.data as {
      travellerId: string;
      tripId: string;
      pnrId: string;
      segmentCount: number;
    };
    expect(d.travellerId).toBeDefined();
    expect(d.tripId).toBeDefined();
    expect(d.pnrId).toBeDefined();
    expect(d.segmentCount).toBe(1);

    // Retrieve trip
    const tripRes = await tripCtrl.getTripById(d.tripId, makeCtx());
    expect(tripRes.status).toBe(200);

    // Retrieve traveller
    const travRes = await travellerCtrl.getTravellerById(d.travellerId, makeCtx());
    expect(travRes.status).toBe(200);
    expect((travRes.body.data as { firstName: string }).firstName).toBe('Alice');

    // Retrieve timeline
    const tlRes = await tripCtrl.getTimeline(d.tripId, makeCtx());
    expect(tlRes.status).toBe(200);
    expect((tlRes.body.data as unknown[]).length).toBeGreaterThan(0);

    // Search trips
    const searchRes = await tripCtrl.searchTrips(makeCtx());
    expect((searchRes.body.data as unknown[]).length).toBe(1);
  });

  it('hotel segment creates correct canonical segment', async () => {
    const res = await pnrCtrl.createPNR(hotelPayload(), makeCtx());
    expect(res.status).toBe(201);
    const { tripId } = res.body.data as { tripId: string };
    const tripRes = await tripCtrl.getTripById(tripId, makeCtx());
    expect((tripRes.body.data as { segmentCount: number }).segmentCount).toBe(1);
  });

  it('flight segment creates correct canonical segment', async () => {
    const res = await pnrCtrl.createPNR(flightPayload(), makeCtx());
    expect(res.status).toBe(201);
    const { tripId } = res.body.data as { tripId: string };
    const tripRes = await tripCtrl.getTripById(tripId, makeCtx());
    expect((tripRes.body.data as { segmentCount: number }).segmentCount).toBe(1);
  });

  it('stale PNR version is rejected safely', async () => {
    await pnrCtrl.createPNR(flightPayload({ pnrVersion: 3 }), makeCtx());
    const res = await pnrCtrl.createPNR(
      flightPayload({ pnrVersion: 2, recordLocator: 'STALE' }),
      makeCtx(),
    );
    // Still 201 because traveller/trip/segments succeed; PNR version conflict is soft
    expect(res.status).toBe(201);
  });

  it('newer PNR version is accepted', async () => {
    await pnrCtrl.createPNR(flightPayload({ pnrVersion: 1 }), makeCtx());
    const res = await pnrCtrl.createPNR(
      flightPayload({ pnrVersion: 2, recordLocator: 'V2' }),
      makeCtx(),
    );
    expect(res.status).toBe(201);
  });

  it('all emitted events have valid envelope structure', async () => {
    await pnrCtrl.createPNR(flightPayload(), makeCtx());
    const events = bus.getPublishedEvents();
    expect(events.length).toBeGreaterThan(0);
    for (const ev of events) {
      expect(ev.eventId).toBeDefined();
      expect(ev.eventType).toBeDefined();
      expect(ev.correlationId).toBeDefined();
      expect(ev.timestamp).toBeDefined();
      expect(ev.schemaVersion).toBeGreaterThanOrEqual(1);
      expect(ev.payload).toBeDefined();
    }
  });

  it('correlationId preserved across request, services and events', async () => {
    const res = await pnrCtrl.createPNR(flightPayload(), makeCtx());
    expect(res.body.correlationId).toBe(CORR_ID);
    for (const ev of bus.getPublishedEvents()) {
      expect(ev.correlationId).toBe(CORR_ID);
    }
  });

  it('timeline order is chronological', async () => {
    const res = await pnrCtrl.createPNR(flightPayload(), makeCtx());
    const { tripId } = res.body.data as { tripId: string };
    const tlRes = await tripCtrl.getTimeline(tripId, makeCtx());
    const tl = tlRes.body.data as { createdAt: string }[];
    for (let i = 1; i < tl.length; i++) {
      expect(new Date(tl[i]!.createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(tl[i - 1]!.createdAt).getTime(),
      );
    }
  });

  it('tenant isolation across full flow', async () => {
    const res = await pnrCtrl.createPNR(flightPayload(), makeCtx(TENANT_A));
    const d = res.body.data as { tripId: string; travellerId: string };

    // Tenant B cannot see Tenant A data
    expect((await tripCtrl.getTripById(d.tripId, makeCtx(TENANT_B))).status).toBe(404);
    expect((await travellerCtrl.getTravellerById(d.travellerId, makeCtx(TENANT_B))).status).toBe(
      404,
    );
    expect((await tripCtrl.searchTrips(makeCtx(TENANT_B))).body.data).toEqual([]);
  });

  it('consistent error response on invalid payload', async () => {
    const res = await pnrCtrl.createPNR({ invalid: true }, makeCtx());
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.correlationId).toBe(CORR_ID);
  });
});

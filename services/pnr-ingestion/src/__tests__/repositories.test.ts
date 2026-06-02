import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryTravellerRepository,
  InMemoryPNRRepository,
  InMemoryTripRepository,
  InMemorySegmentRepository,
  InMemoryTimelineEventRepository,
} from '../repositories/in-memory.js';
import { VersionConflictError } from '../repositories/interfaces.js';
import { Traveller } from '../domain/traveller.js';
import { PNR } from '../domain/pnr.js';
import { Trip } from '../domain/trip.js';
import { Segment } from '../domain/segment.js';
import { TimelineEvent } from '../domain/timeline-event.js';

const TENANT_A = 'tenant-aaa-aaa';
const TENANT_B = 'tenant-bbb-bbb';
const CORPORATE_A = 'corp-aaa';

describe('TravellerRepository — tenant isolation', () => {
  let repo: InMemoryTravellerRepository;

  beforeEach(() => {
    repo = new InMemoryTravellerRepository();
  });

  it('should not find traveller from different tenant', async () => {
    const traveller = Traveller.create({
      travellerId: 'trav-001',
      tenantId: TENANT_A,
      corporateId: CORPORATE_A,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@acme.com',
    });
    await repo.save(traveller);

    const result = await repo.findById(TENANT_B, 'trav-001');
    expect(result).toBeUndefined();
  });

  it('should find traveller within same tenant', async () => {
    const traveller = Traveller.create({
      travellerId: 'trav-001',
      tenantId: TENANT_A,
      corporateId: CORPORATE_A,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@acme.com',
    });
    await repo.save(traveller);

    const result = await repo.findById(TENANT_A, 'trav-001');
    expect(result?.travellerId).toBe('trav-001');
  });

  it('should not find traveller by email from different tenant', async () => {
    const traveller = Traveller.create({
      travellerId: 'trav-001',
      tenantId: TENANT_A,
      corporateId: CORPORATE_A,
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@acme.com',
    });
    await repo.save(traveller);

    const result = await repo.findByEmail(TENANT_B, 'jane@acme.com');
    expect(result).toBeUndefined();
  });

  it('should list travellers only for requested tenant', async () => {
    await repo.save(
      Traveller.create({
        travellerId: 'trav-001',
        tenantId: TENANT_A,
        corporateId: CORPORATE_A,
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@a.com',
      }),
    );
    await repo.save(
      Traveller.create({
        travellerId: 'trav-002',
        tenantId: TENANT_B,
        corporateId: CORPORATE_A,
        firstName: 'Bob',
        lastName: 'Jones',
        email: 'bob@b.com',
      }),
    );

    const tenantAResults = await repo.findByTenant(TENANT_A);
    expect(tenantAResults).toHaveLength(1);
    expect(tenantAResults[0]?.travellerId).toBe('trav-001');
  });
});

describe('PNRRepository — tenant isolation and version conflicts', () => {
  let repo: InMemoryPNRRepository;

  beforeEach(() => {
    repo = new InMemoryPNRRepository();
  });

  it('should not find PNR from different tenant', async () => {
    const pnr = PNR.create({
      pnrId: 'pnr-001',
      tenantId: TENANT_A,
      corporateId: CORPORATE_A,
      recordLocator: 'ABC123',
      sourceSystem: 'Amadeus',
      bookingDate: new Date('2026-06-01'),
      travellerId: 'trav-001',
      version: 1,
    });
    await repo.save(pnr);

    const result = await repo.findById(TENANT_B, 'pnr-001');
    expect(result).toBeUndefined();
  });

  it('should reject save with wrong expected version', async () => {
    const pnr = PNR.create({
      pnrId: 'pnr-001',
      tenantId: TENANT_A,
      corporateId: CORPORATE_A,
      recordLocator: 'ABC123',
      sourceSystem: 'Amadeus',
      bookingDate: new Date('2026-06-01'),
      travellerId: 'trav-001',
      version: 3,
    });
    await repo.save(pnr);

    const updatedPnr = PNR.create({
      pnrId: 'pnr-001',
      tenantId: TENANT_A,
      corporateId: CORPORATE_A,
      recordLocator: 'ABC123',
      sourceSystem: 'Amadeus',
      bookingDate: new Date('2026-06-01'),
      travellerId: 'trav-001',
      version: 4,
    });

    await expect(repo.save(updatedPnr, 2)).rejects.toThrow(VersionConflictError);
  });

  it('should accept save with correct expected version', async () => {
    const pnr = PNR.create({
      pnrId: 'pnr-001',
      tenantId: TENANT_A,
      corporateId: CORPORATE_A,
      recordLocator: 'ABC123',
      sourceSystem: 'Amadeus',
      bookingDate: new Date('2026-06-01'),
      travellerId: 'trav-001',
      version: 3,
    });
    await repo.save(pnr);

    const updatedPnr = PNR.create({
      pnrId: 'pnr-001',
      tenantId: TENANT_A,
      corporateId: CORPORATE_A,
      recordLocator: 'ABC123',
      sourceSystem: 'Amadeus',
      bookingDate: new Date('2026-06-01'),
      travellerId: 'trav-001',
      version: 4,
    });

    await expect(repo.save(updatedPnr, 3)).resolves.toBeUndefined();
    const found = await repo.findById(TENANT_A, 'pnr-001');
    expect(found?.version).toBe(4);
  });

  it('should save without version check when expectedVersion not provided', async () => {
    const pnr = PNR.create({
      pnrId: 'pnr-001',
      tenantId: TENANT_A,
      corporateId: CORPORATE_A,
      recordLocator: 'ABC123',
      sourceSystem: 'Amadeus',
      bookingDate: new Date('2026-06-01'),
      travellerId: 'trav-001',
      version: 1,
    });
    await repo.save(pnr);

    const updatedPnr = PNR.create({
      pnrId: 'pnr-001',
      tenantId: TENANT_A,
      corporateId: CORPORATE_A,
      recordLocator: 'ABC123',
      sourceSystem: 'Amadeus',
      bookingDate: new Date('2026-06-01'),
      travellerId: 'trav-001',
      version: 5,
    });

    await expect(repo.save(updatedPnr)).resolves.toBeUndefined();
  });
});

describe('TripRepository — tenant isolation', () => {
  let repo: InMemoryTripRepository;

  beforeEach(() => {
    repo = new InMemoryTripRepository();
  });

  it('should not find trip from different tenant', async () => {
    const trip = Trip.create({
      tripId: 'trip-001',
      tenantId: TENANT_A,
      corporateId: CORPORATE_A,
      travellerId: 'trav-001',
    });
    await repo.save(trip);

    const result = await repo.findById(TENANT_B, 'trip-001');
    expect(result).toBeUndefined();
  });

  it('should list trips only for requested tenant', async () => {
    await repo.save(
      Trip.create({
        tripId: 'trip-001',
        tenantId: TENANT_A,
        corporateId: CORPORATE_A,
        travellerId: 'trav-001',
      }),
    );
    await repo.save(
      Trip.create({
        tripId: 'trip-002',
        tenantId: TENANT_B,
        corporateId: CORPORATE_A,
        travellerId: 'trav-001',
      }),
    );

    const results = await repo.findByTenant(TENANT_A);
    expect(results).toHaveLength(1);
    expect(results[0]?.tripId).toBe('trip-001');
  });
});

describe('SegmentRepository — tenant isolation and version conflicts', () => {
  let repo: InMemorySegmentRepository;

  beforeEach(() => {
    repo = new InMemorySegmentRepository();
  });

  it('should not find segment from different tenant', async () => {
    const segment = Segment.create({
      segmentId: 'seg-001',
      tripId: 'trip-001',
      segmentType: 'flight',
      startDatetime: new Date('2026-06-15T08:00:00Z'),
      endDatetime: new Date('2026-06-15T11:30:00Z'),
      origin: 'LHR',
      destination: 'JFK',
    });
    await repo.saveWithTenant(TENANT_A, segment);

    const result = await repo.findById(TENANT_B, 'seg-001');
    expect(result).toBeUndefined();
  });

  it('should reject save with wrong expected version', async () => {
    const segment = Segment.create({
      segmentId: 'seg-001',
      tripId: 'trip-001',
      segmentType: 'flight',
      startDatetime: new Date('2026-06-15T08:00:00Z'),
      endDatetime: new Date('2026-06-15T11:30:00Z'),
      origin: 'LHR',
      destination: 'JFK',
      version: 3,
    });
    await repo.saveWithTenant(TENANT_A, segment);

    const updated = segment.update({ origin: 'LGW' });
    await expect(repo.saveWithTenant(TENANT_A, updated, 2)).rejects.toThrow(VersionConflictError);
  });

  it('should accept save with correct expected version', async () => {
    const segment = Segment.create({
      segmentId: 'seg-001',
      tripId: 'trip-001',
      segmentType: 'flight',
      startDatetime: new Date('2026-06-15T08:00:00Z'),
      endDatetime: new Date('2026-06-15T11:30:00Z'),
      origin: 'LHR',
      destination: 'JFK',
      version: 1,
    });
    await repo.saveWithTenant(TENANT_A, segment);

    const updated = segment.update({ origin: 'LGW' });
    await expect(repo.saveWithTenant(TENANT_A, updated, 1)).resolves.toBeUndefined();

    const found = await repo.findById(TENANT_A, 'seg-001');
    expect(found?.version).toBe(2);
    expect(found?.origin).toBe('LGW');
  });

  it('should find segments by trip within tenant', async () => {
    await repo.saveWithTenant(
      TENANT_A,
      Segment.create({
        segmentId: 'seg-001',
        tripId: 'trip-001',
        segmentType: 'flight',
        startDatetime: new Date('2026-06-15T08:00:00Z'),
        endDatetime: new Date('2026-06-15T11:30:00Z'),
        origin: 'LHR',
        destination: 'JFK',
      }),
    );
    await repo.saveWithTenant(
      TENANT_A,
      Segment.create({
        segmentId: 'seg-002',
        tripId: 'trip-001',
        segmentType: 'hotel',
        startDatetime: new Date('2026-06-15T15:00:00Z'),
        endDatetime: new Date('2026-06-19T11:00:00Z'),
        origin: 'New York',
        destination: 'New York',
      }),
    );

    const results = await repo.findByTrip(TENANT_A, 'trip-001');
    expect(results).toHaveLength(2);
  });
});

describe('TimelineEventRepository — immutability and tenant isolation', () => {
  let repo: InMemoryTimelineEventRepository;

  beforeEach(() => {
    repo = new InMemoryTimelineEventRepository();
  });

  it('should not find timeline event from different tenant', async () => {
    const event = TimelineEvent.create({
      eventId: 'evt-001',
      tripId: 'trip-001',
      eventType: 'booking_created',
    });
    await repo.appendWithTenant(TENANT_A, event);

    const result = await repo.findById(TENANT_B, 'evt-001');
    expect(result).toBeUndefined();
  });

  it('should append timeline events and return in chronological order', async () => {
    const event1 = TimelineEvent.create({
      eventId: 'evt-001',
      tripId: 'trip-001',
      eventType: 'booking_created',
    });
    await repo.appendWithTenant(TENANT_A, event1);

    // Small delay for different timestamps
    await new Promise((resolve) => setTimeout(resolve, 10));

    const event2 = TimelineEvent.create({
      eventId: 'evt-002',
      tripId: 'trip-001',
      eventType: 'flight_added',
    });
    await repo.appendWithTenant(TENANT_A, event2);

    const results = await repo.findByTrip(TENANT_A, 'trip-001');
    expect(results).toHaveLength(2);
    expect(results[0]?.eventId).toBe('evt-001');
    expect(results[1]?.eventId).toBe('evt-002');
  });

  it('should be idempotent — duplicate append is a no-op', async () => {
    const event = TimelineEvent.create({
      eventId: 'evt-001',
      tripId: 'trip-001',
      eventType: 'booking_created',
      eventData: { source: 'Amadeus' },
    });
    await repo.appendWithTenant(TENANT_A, event);
    await repo.appendWithTenant(TENANT_A, event); // duplicate

    const results = await repo.findByTrip(TENANT_A, 'trip-001');
    expect(results).toHaveLength(1);
  });

  it('should not provide update or delete operations', () => {
    // TimelineEventRepository interface only has findById, findByTrip, append
    // No update or delete methods exist — this is by design
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(repo));
    expect(methods).not.toContain('update');
    expect(methods).not.toContain('delete');
    expect(methods).not.toContain('remove');
  });
});

describe('Application services depend on interfaces', () => {
  it('TravellerService accepts any TravellerRepository implementation', async () => {
    // This test proves the service depends on the interface, not the concrete class
    const { TravellerService } = await import('../services/traveller-service.js');
    const { InMemoryEventBus } = await import('@hci/event-contracts');

    const mockRepo = {
      findById: async () => undefined,
      findByEmail: async () => undefined,
      findByTenant: async () => [],
      findByCorporate: async () => [],
      save: async () => undefined,
    };

    const service = new TravellerService(mockRepo, new InMemoryEventBus());
    expect(service).toBeDefined();
  });

  it('PNRService accepts any PNRRepository implementation', async () => {
    const { PNRService } = await import('../services/pnr-service.js');
    const { InMemoryEventBus } = await import('@hci/event-contracts');

    const mockRepo = {
      findById: async () => undefined,
      findByRecordLocator: async () => undefined,
      findByTenant: async () => [],
      findByTraveller: async () => [],
      save: async () => undefined,
    };

    const service = new PNRService(mockRepo, new InMemoryEventBus());
    expect(service).toBeDefined();
  });

  it('TripService accepts any TripRepository implementation', async () => {
    const { TripService } = await import('../services/trip-service.js');
    const { InMemoryEventBus } = await import('@hci/event-contracts');

    const mockRepo = {
      findById: async () => undefined,
      findByTraveller: async () => [],
      findByTenant: async () => [],
      save: async () => undefined,
    };

    const service = new TripService(mockRepo, new InMemoryEventBus());
    expect(service).toBeDefined();
  });
});

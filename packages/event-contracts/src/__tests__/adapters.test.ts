import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InMemoryEventBus, EventBridgeAdapter } from '../adapters.js';
import { createEnvelope } from '../envelope-factory.js';
import type { PNRPayload } from '../pnr-events.js';
import type { TripPayload } from '../trip-events.js';

function createPNREvent() {
  return createEnvelope<PNRPayload>({
    eventType: 'PNRCreated',
    tenantId: '11111111-1111-1111-1111-111111111111',
    corporateId: '22222222-2222-2222-2222-222222222222',
    sourceService: 'hci\\.itinerary',
    payload: {
      pnrId: '44444444-4444-4444-4444-444444444444',
      recordLocator: 'ABC123',
      travellerId: '55555555-5555-5555-5555-555555555555',
      tripId: '66666666-6666-6666-6666-666666666666',
      gdsSource: 'Amadeus',
      createdAt: '2026-06-01T09:30:00.000Z',
      segmentCount: 3,
      rawPnrRef: 's3://hci-raw-pnrs/2026/06/01/ABC123.json',
    },
  });
}

function createTripEvent() {
  return createEnvelope<TripPayload>({
    eventType: 'TripCreated',
    tenantId: '11111111-1111-1111-1111-111111111111',
    corporateId: '22222222-2222-2222-2222-222222222222',
    sourceService: 'hci\\.itinerary',
    payload: {
      tripId: '66666666-6666-6666-6666-666666666666',
      travellerId: '55555555-5555-5555-5555-555555555555',
      status: 'created',
      departureDate: '2026-06-15T08:00:00.000Z',
      returnDate: '2026-06-19T18:00:00.000Z',
      origin: 'LHR',
      destination: 'JFK',
      isInternational: true,
      segmentIds: ['77777777-7777-7777-7777-777777777777'],
    },
  });
}

describe('InMemoryEventBus', () => {
  let bus: InMemoryEventBus;

  beforeEach(() => {
    bus = new InMemoryEventBus();
  });

  it('should store published events', async () => {
    const event = createPNREvent();
    await bus.publish(event);

    expect(bus.getPublishedEvents()).toHaveLength(1);
    expect(bus.getPublishedEvents()[0]).toBe(event);
  });

  it('should notify subscribers on publish', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    bus.subscribe('PNRCreated', handler);

    const event = createPNREvent();
    await bus.publish(event);

    expect(handler).toHaveBeenCalledWith(event);
  });

  it('should not notify subscribers for different event types', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    bus.subscribe('TripCreated', handler);

    const event = createPNREvent();
    await bus.publish(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should filter events by type', async () => {
    const pnrEvent = createPNREvent();
    const tripEvent = createTripEvent();

    await bus.publish(pnrEvent);
    await bus.publish(tripEvent);

    expect(bus.getEventsByType('PNRCreated')).toHaveLength(1);
    expect(bus.getEventsByType('TripCreated')).toHaveLength(1);
    expect(bus.getEventsByType('SegmentAdded')).toHaveLength(0);
  });

  it('should unsubscribe handlers', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    bus.subscribe('PNRCreated', handler);
    bus.unsubscribe('PNRCreated');

    const event = createPNREvent();
    await bus.publish(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should clear all state', async () => {
    const handler = vi.fn().mockResolvedValue(undefined);
    bus.subscribe('PNRCreated', handler);
    await bus.publish(createPNREvent());

    expect(handler).toHaveBeenCalledOnce();

    bus.clear();

    expect(bus.getPublishedEvents()).toHaveLength(0);

    handler.mockClear();
    await bus.publish(createPNREvent());
    expect(handler).not.toHaveBeenCalled();
  });
});

describe('EventBridgeAdapter', () => {
  it('should throw when publish is called (not yet implemented)', async () => {
    const adapter = new EventBridgeAdapter({ eventBusName: 'hci-domain-events' });
    const event = createPNREvent();

    await expect(adapter.publish(event)).rejects.toThrow('EventBridgeAdapter not yet implemented');
  });
});

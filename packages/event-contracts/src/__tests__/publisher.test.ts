import { describe, it, expect, beforeEach } from 'vitest';
import { EventPublisher } from '../publisher.js';
import { InMemoryEventBus } from '../adapters.js';
import type { EventBusAdapter } from '../adapters.js';
import { createEnvelope } from '../envelope-factory.js';
import type { EventValidator, EventValidationResult } from '../event-validator.js';
import type { HCIEventEnvelope } from '../envelope.js';
import type { PNRPayload } from '../pnr-events.js';

/** A validator that always passes */
const passingValidator: EventValidator = {
  validateEvent: (): EventValidationResult => ({ valid: true, errors: [] }),
  validateEnvelope: (): EventValidationResult => ({ valid: true, errors: [] }),
};

/** A validator that always fails */
const failingValidator: EventValidator = {
  validateEvent: (): EventValidationResult => ({
    valid: false,
    errors: [{ path: '/payload/pnrId', message: 'must be uuid' }],
  }),
  validateEnvelope: (): EventValidationResult => ({
    valid: false,
    errors: [{ path: '/eventType', message: 'must be valid enum' }],
  }),
};

function createValidPNREvent(): HCIEventEnvelope<PNRPayload> {
  return createEnvelope({
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

describe('EventPublisher', () => {
  let bus: InMemoryEventBus;

  beforeEach(() => {
    bus = new InMemoryEventBus();
  });

  it('should publish a valid event successfully', async () => {
    const publisher = new EventPublisher({ adapter: bus, validator: passingValidator });
    const event = createValidPNREvent();

    const result = await publisher.publish(event);

    expect(result.success).toBe(true);
    expect(result.eventId).toBe(event.eventId);
    expect(bus.getPublishedEvents()).toHaveLength(1);
  });

  it('should reject an invalid event before publishing', async () => {
    const publisher = new EventPublisher({ adapter: bus, validator: failingValidator });
    const event = createValidPNREvent();

    const result = await publisher.publish(event);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Validation failed');
    expect(bus.getPublishedEvents()).toHaveLength(0);
  });

  it('should skip validation when validateBeforePublish is false', async () => {
    const publisher = new EventPublisher({
      adapter: bus,
      validator: failingValidator,
      validateBeforePublish: false,
    });
    const event = createValidPNREvent();

    const result = await publisher.publish(event);

    expect(result.success).toBe(true);
    expect(bus.getPublishedEvents()).toHaveLength(1);
  });

  it('should handle adapter errors gracefully', async () => {
    const failingAdapter: EventBusAdapter = {
      publish: async () => {
        throw new Error('Connection refused');
      },
    };

    const publisher = new EventPublisher({ adapter: failingAdapter, validator: passingValidator });
    const event = createValidPNREvent();

    const result = await publisher.publish(event);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Connection refused');
  });

  it('should publish batch events in order', async () => {
    const publisher = new EventPublisher({ adapter: bus, validator: passingValidator });
    const event1 = createValidPNREvent();
    const event2 = createValidPNREvent();

    const results = await publisher.publishBatch([event1, event2]);

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ success: true });
    expect(results[1]).toMatchObject({ success: true });
    expect(bus.getPublishedEvents()).toHaveLength(2);
  });

  it('should stop batch on validation failure', async () => {
    const publisher = new EventPublisher({ adapter: bus, validator: failingValidator });
    const event1 = createValidPNREvent();
    const event2 = createValidPNREvent();

    const results = await publisher.publishBatch([event1, event2]);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ success: false });
    expect(bus.getPublishedEvents()).toHaveLength(0);
  });
});

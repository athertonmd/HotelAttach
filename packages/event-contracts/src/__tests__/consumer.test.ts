import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventConsumer } from '../consumer.js';
import { InMemoryIdempotencyStore } from '../idempotency.js';
import { createEnvelope } from '../envelope-factory.js';
import type { EventValidator, EventValidationResult } from '../event-validator.js';
import type { HCIEventEnvelope } from '../envelope.js';
import type { PNRPayload } from '../pnr-events.js';
import type { TripPayload } from '../trip-events.js';

const passingValidator: EventValidator = {
  validateEvent: (): EventValidationResult => ({ valid: true, errors: [] }),
  validateEnvelope: (): EventValidationResult => ({ valid: true, errors: [] }),
};

const failingValidator: EventValidator = {
  validateEvent: (): EventValidationResult => ({
    valid: false,
    errors: [{ path: '/eventType', message: 'invalid event type' }],
  }),
  validateEnvelope: (): EventValidationResult => ({
    valid: false,
    errors: [{ path: '/eventType', message: 'invalid event type' }],
  }),
};

function createPNREvent(): HCIEventEnvelope<PNRPayload> {
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

describe('EventConsumer', () => {
  let idempotencyStore: InMemoryIdempotencyStore;

  beforeEach(() => {
    idempotencyStore = new InMemoryIdempotencyStore();
  });

  it('should dispatch events to registered handlers', async () => {
    const consumer = new EventConsumer({ validator: passingValidator });
    const handler = vi.fn().mockResolvedValue(undefined);
    consumer.on('PNRCreated', handler);

    const event = createPNREvent();
    const result = await consumer.consume(event);

    expect(result.success).toBe(true);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('should not dispatch events to handlers for different types', async () => {
    const consumer = new EventConsumer({ validator: passingValidator });
    const pnrHandler = vi.fn().mockResolvedValue(undefined);
    const tripHandler = vi.fn().mockResolvedValue(undefined);
    consumer.on('PNRCreated', pnrHandler);
    consumer.on('TripCreated', tripHandler);

    const event = createPNREvent();
    await consumer.consume(event);

    expect(pnrHandler).toHaveBeenCalledOnce();
    expect(tripHandler).not.toHaveBeenCalled();
  });

  it('should reject invalid events', async () => {
    const consumer = new EventConsumer({ validator: failingValidator });
    const handler = vi.fn().mockResolvedValue(undefined);
    consumer.on('PNRCreated', handler);

    const event = createPNREvent();
    const result = await consumer.consume(event);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Validation failed');
    expect(handler).not.toHaveBeenCalled();
  });

  it('should skip validation when validateOnReceive is false', async () => {
    const consumer = new EventConsumer({
      validator: failingValidator,
      validateOnReceive: false,
    });
    const handler = vi.fn().mockResolvedValue(undefined);
    consumer.on('PNRCreated', handler);

    const event = createPNREvent();
    const result = await consumer.consume(event);

    expect(result.success).toBe(true);
    expect(handler).toHaveBeenCalled();
  });

  it('should deduplicate events using idempotency store', async () => {
    const consumer = new EventConsumer({
      validator: passingValidator,
      idempotencyStore,
    });
    const handler = vi.fn().mockResolvedValue(undefined);
    consumer.on('PNRCreated', handler);

    const event = createPNREvent();

    const result1 = await consumer.consume(event);
    expect(result1.success).toBe(true);
    expect(result1.duplicate).toBeUndefined();

    const result2 = await consumer.consume(event);
    expect(result2.success).toBe(true);
    expect(result2.duplicate).toBe(true);

    expect(handler).toHaveBeenCalledOnce();
  });

  it('should handle handler errors gracefully', async () => {
    const consumer = new EventConsumer({ validator: passingValidator });
    consumer.on('PNRCreated', async () => {
      throw new Error('Handler crashed');
    });

    const event = createPNREvent();
    const result = await consumer.consume(event);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Handler crashed');
  });

  it('should support multiple handlers for the same event type', async () => {
    const consumer = new EventConsumer({ validator: passingValidator });
    const handler1 = vi.fn().mockResolvedValue(undefined);
    const handler2 = vi.fn().mockResolvedValue(undefined);
    consumer.on('PNRCreated', handler1);
    consumer.on('PNRCreated', handler2);

    const event = createPNREvent();
    await consumer.consume(event);

    expect(handler1).toHaveBeenCalledOnce();
    expect(handler2).toHaveBeenCalledOnce();
  });

  it('should succeed with no handlers registered', async () => {
    const consumer = new EventConsumer({ validator: passingValidator });
    const event = createPNREvent();
    const result = await consumer.consume(event);

    expect(result.success).toBe(true);
  });
});

describe('EventConsumer — correlationId preservation', () => {
  it('should pass events with correlationId intact to handlers', async () => {
    const consumer = new EventConsumer({ validator: passingValidator });
    let receivedCorrelationId = '';

    consumer.on<TripPayload>('TripCreated', async (event) => {
      receivedCorrelationId = event.correlationId;
    });

    const correlationId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const event = createEnvelope<TripPayload>({
      eventType: 'TripCreated',
      tenantId: '11111111-1111-1111-1111-111111111111',
      corporateId: '22222222-2222-2222-2222-222222222222',
      sourceService: 'hci\\.itinerary',
      correlationId,
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

    await consumer.consume(event);
    expect(receivedCorrelationId).toBe(correlationId);
  });
});

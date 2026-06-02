import { describe, it, expect } from 'vitest';
import { createEnvelope, deriveCorrelation } from '../envelope-factory.js';
import type { HCIEventEnvelope } from '../envelope.js';
import type { PNRPayload } from '../pnr-events.js';

describe('createEnvelope', () => {
  const baseOptions = {
    eventType: 'PNRCreated' as const,
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
    } satisfies PNRPayload,
  };

  it('should create an envelope with all required fields', () => {
    const event = createEnvelope(baseOptions);

    expect(event.eventId).toBeDefined();
    expect(event.eventType).toBe('PNRCreated');
    expect(event.schemaVersion).toBe(1);
    expect(event.tenantId).toBe(baseOptions.tenantId);
    expect(event.corporateId).toBe(baseOptions.corporateId);
    expect(event.sourceService).toBe(baseOptions.sourceService);
    expect(event.timestamp).toBeDefined();
    expect(event.correlationId).toBeDefined();
    expect(event.payload).toEqual(baseOptions.payload);
  });

  it('should generate a unique eventId', () => {
    const event1 = createEnvelope(baseOptions);
    const event2 = createEnvelope(baseOptions);
    expect(event1.eventId).not.toBe(event2.eventId);
  });

  it('should generate a correlationId when not provided', () => {
    const event = createEnvelope(baseOptions);
    expect(event.correlationId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
  });

  it('should preserve provided correlationId', () => {
    const correlationId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
    const event = createEnvelope({ ...baseOptions, correlationId });
    expect(event.correlationId).toBe(correlationId);
  });

  it('should use provided timestamp', () => {
    const timestamp = '2026-06-01T10:00:00.000Z';
    const event = createEnvelope({ ...baseOptions, timestamp });
    expect(event.timestamp).toBe(timestamp);
  });

  it('should use provided schemaVersion', () => {
    const event = createEnvelope({ ...baseOptions, schemaVersion: 2 });
    expect(event.schemaVersion).toBe(2);
  });

  it('should default schemaVersion to 1', () => {
    const event = createEnvelope(baseOptions);
    expect(event.schemaVersion).toBe(1);
  });
});

describe('deriveCorrelation', () => {
  it('should preserve correlationId from source event', () => {
    const sourceEvent: HCIEventEnvelope = {
      eventId: 'source-event-id-1234-5678-abcdefabcdef',
      eventType: 'PNRCreated',
      schemaVersion: 1,
      tenantId: '11111111-1111-1111-1111-111111111111',
      corporateId: '22222222-2222-2222-2222-222222222222',
      sourceService: 'hci\\.itinerary',
      timestamp: '2026-06-01T10:00:00.000Z',
      correlationId: 'original-correlation-id-abcdef123456',
      payload: {},
    };

    const derived = deriveCorrelation(sourceEvent);
    expect(derived.correlationId).toBe('original-correlation-id-abcdef123456');
  });

  it('should set causationId to the source event eventId', () => {
    const sourceEvent: HCIEventEnvelope = {
      eventId: 'source-event-id-1234-5678-abcdefabcdef',
      eventType: 'PNRCreated',
      schemaVersion: 1,
      tenantId: '11111111-1111-1111-1111-111111111111',
      corporateId: '22222222-2222-2222-2222-222222222222',
      sourceService: 'hci\\.itinerary',
      timestamp: '2026-06-01T10:00:00.000Z',
      correlationId: 'original-correlation-id-abcdef123456',
      payload: {},
    };

    const derived = deriveCorrelation(sourceEvent);
    expect(derived.causationId).toBe('source-event-id-1234-5678-abcdefabcdef');
  });
});

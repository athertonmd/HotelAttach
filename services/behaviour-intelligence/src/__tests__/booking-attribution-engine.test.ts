/**
 * Unit tests for BookingAttributionEngine.
 * Tests attribution logic from communication history.
 * Source: BR-1401–BR-1410
 */

import { describe, it, expect } from 'vitest';
import { computeAttribution } from '../engines/booking-attribution-engine.js';
import type { AttributionEngineInput, CommunicationRecord } from '../engines/types.js';

const TENANT = 'tenant-001';
const CORP = 'corp-001';
const TRAVELLER = 'trav-001';

/** Create a Date that is N hours before now */
function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function validInput(overrides: Partial<AttributionEngineInput> = {}): AttributionEngineInput {
  return {
    bookingId: 'book-001',
    travellerId: TRAVELLER,
    tenantId: TENANT,
    corporateId: CORP,
    recentCommunications: [],
    estimatedCommission: 150,
    isIndependentBooking: false,
    ...overrides,
  };
}

describe('BookingAttributionEngine', () => {
  it('BR-1401: independent attribution when no communications exist', () => {
    const result = computeAttribution(validInput({ recentCommunications: [] }));
    expect(result.attributionType).toBe('independent');
    expect(result.confidence).toBe(95);
    expect(result.communicationId).toBeNull();
  });

  it('BR-1401: independent attribution when isIndependentBooking is true', () => {
    const comms: CommunicationRecord[] = [
      { communicationId: 'c1', channel: 'email', sentAt: hoursAgo(2) },
    ];
    const result = computeAttribution(
      validInput({
        recentCommunications: comms,
        isIndependentBooking: true,
      }),
    );
    expect(result.attributionType).toBe('independent');
    expect(result.confidence).toBe(95);
  });

  it('BR-1404: email attribution within 72h window', () => {
    const comms: CommunicationRecord[] = [
      { communicationId: 'c1', channel: 'email', sentAt: hoursAgo(10) },
    ];
    const result = computeAttribution(validInput({ recentCommunications: comms }));
    expect(result.attributionType).toBe('email');
    expect(result.communicationId).toBe('c1');
    expect(result.attributionWindowHours).toBe(72);
    expect(result.hoursFromCommunication).toBeCloseTo(10, 0);
  });

  it('BR-1405: sms attribution within 24h window', () => {
    const comms: CommunicationRecord[] = [
      { communicationId: 'c2', channel: 'sms', sentAt: hoursAgo(5) },
    ];
    const result = computeAttribution(validInput({ recentCommunications: comms }));
    expect(result.attributionType).toBe('sms');
    expect(result.attributionWindowHours).toBe(24);
  });

  it('BR-1406: push_notification attribution within 12h window', () => {
    const comms: CommunicationRecord[] = [
      { communicationId: 'c3', channel: 'push_notification', sentAt: hoursAgo(6) },
    ];
    const result = computeAttribution(validInput({ recentCommunications: comms }));
    expect(result.attributionType).toBe('push_notification');
    expect(result.attributionWindowHours).toBe(12);
  });

  it('BR-1407: in_app attribution within 48h window', () => {
    const comms: CommunicationRecord[] = [
      { communicationId: 'c4', channel: 'in_app', sentAt: hoursAgo(20) },
    ];
    const result = computeAttribution(validInput({ recentCommunications: comms }));
    expect(result.attributionType).toBe('in_app');
    expect(result.attributionWindowHours).toBe(48);
  });

  it('BR-1408: agent_intervention attribution within 24h window', () => {
    const comms: CommunicationRecord[] = [
      { communicationId: 'c5', channel: 'agent_intervention', sentAt: hoursAgo(12) },
    ];
    const result = computeAttribution(validInput({ recentCommunications: comms }));
    expect(result.attributionType).toBe('agent_intervention');
    expect(result.attributionWindowHours).toBe(24);
  });

  it('BR-1409: unknown when communication is outside attribution window', () => {
    const comms: CommunicationRecord[] = [
      { communicationId: 'c1', channel: 'sms', sentAt: hoursAgo(30) }, // sms window = 24h
    ];
    const result = computeAttribution(validInput({ recentCommunications: comms }));
    expect(result.attributionType).toBe('unknown');
    expect(result.confidence).toBe(20);
  });

  it('selects most recent communication when multiple are in window', () => {
    const comms: CommunicationRecord[] = [
      { communicationId: 'old', channel: 'email', sentAt: hoursAgo(50) },
      { communicationId: 'recent', channel: 'email', sentAt: hoursAgo(2) },
    ];
    const result = computeAttribution(validInput({ recentCommunications: comms }));
    expect(result.communicationId).toBe('recent');
    expect(result.hoursFromCommunication).toBeCloseTo(2, 0);
  });

  it('BR-1403: confidence decreases with time from communication', () => {
    const early = computeAttribution(
      validInput({
        recentCommunications: [{ communicationId: 'c1', channel: 'email', sentAt: hoursAgo(5) }],
      }),
    );
    const late = computeAttribution(
      validInput({
        recentCommunications: [{ communicationId: 'c2', channel: 'email', sentAt: hoursAgo(60) }],
      }),
    );
    expect(early.confidence).toBeGreaterThan(late.confidence);
  });

  it('preserves estimatedCommission in result', () => {
    const result = computeAttribution(validInput({ estimatedCommission: 500 }));
    expect(result.estimatedCommission).toBe(500);
  });
});

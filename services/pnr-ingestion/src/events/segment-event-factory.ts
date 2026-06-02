/**
 * Segment event factory functions.
 * Maps Segment domain entity → SegmentAdded/SegmentUpdated/SegmentRemoved event payloads.
 */

import { createEnvelope, type SegmentPayload, type TypeSpecificData } from '@hci/event-contracts';
import type { Segment } from '../domain/segment.js';
import type { EventFactoryResult } from './types.js';
import { buildEnvelopeOptions } from './helpers.js';

const SOURCE_SERVICE = 'hci\\.itinerary';

export interface SegmentEventContext {
  /** Type-specific data required by the schema */
  typeSpecificData: TypeSpecificData;
  /** Supplier/carrier code (null if not available) */
  supplierCode?: string | null;
  /** Correlation ID (preserved from upstream) */
  correlationId?: string;
  /** Causation ID (the event that triggered this) */
  causationId?: string;
}

function mapSegmentType(domainType: string): 'flight' | 'rail' | 'car' | 'hotel' {
  // The schema only supports flight, rail, car, hotel
  // Domain supports additional types (transfer, other) which cannot be mapped to events
  const mapping: Record<string, 'flight' | 'rail' | 'car' | 'hotel'> = {
    flight: 'flight',
    rail: 'rail',
    car: 'car',
    hotel: 'hotel',
  };
  const mapped = mapping[domainType];
  if (!mapped) {
    throw new Error(
      `Segment type "${domainType}" cannot be mapped to event schema (only flight, rail, car, hotel supported)`,
    );
  }
  return mapped;
}

function mapSegmentToPayload(segment: Segment, context: SegmentEventContext): SegmentPayload {
  return {
    segmentId: segment.segmentId,
    tripId: segment.tripId,
    segmentType: mapSegmentType(segment.segmentType),
    departureDateTime: segment.startDatetime.toISOString(),
    arrivalDateTime: segment.endDatetime.toISOString(),
    origin: segment.origin,
    destination: segment.destination,
    supplierCode: context.supplierCode ?? null,
    status: segment.status,
    typeSpecificData: context.typeSpecificData,
  };
}

/**
 * Creates a SegmentAdded event from a domain Segment entity.
 */
export function createSegmentAddedEvent(
  segment: Segment,
  context: SegmentEventContext,
): EventFactoryResult<SegmentPayload> {
  try {
    if (!segment.segmentId) {
      return { success: false, error: 'Segment entity has no segmentId' };
    }
    if (!context.typeSpecificData) {
      return { success: false, error: 'typeSpecificData is required in context' };
    }

    const payload = mapSegmentToPayload(segment, context);

    const event = createEnvelope<SegmentPayload>(
      buildEnvelopeOptions({
        eventType: 'SegmentAdded',
        tenantId: segment.tripId,
        corporateId: segment.tripId,
        sourceService: SOURCE_SERVICE,
        correlationId: context.correlationId,
        payload,
      }),
    );

    return { success: true, event };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown error creating SegmentAdded event';
    return { success: false, error: message };
  }
}

/**
 * Creates a SegmentUpdated event from a domain Segment entity.
 */
export function createSegmentUpdatedEvent(
  segment: Segment,
  context: SegmentEventContext,
): EventFactoryResult<SegmentPayload> {
  try {
    if (!segment.segmentId) {
      return { success: false, error: 'Segment entity has no segmentId' };
    }
    if (!context.typeSpecificData) {
      return { success: false, error: 'typeSpecificData is required in context' };
    }

    const payload = mapSegmentToPayload(segment, context);

    const event = createEnvelope<SegmentPayload>(
      buildEnvelopeOptions({
        eventType: 'SegmentUpdated',
        tenantId: segment.tripId,
        corporateId: segment.tripId,
        sourceService: SOURCE_SERVICE,
        correlationId: context.correlationId,
        payload,
      }),
    );

    return { success: true, event };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown error creating SegmentUpdated event';
    return { success: false, error: message };
  }
}

/**
 * Creates a SegmentRemoved event from a domain Segment entity.
 */
export function createSegmentRemovedEvent(
  segment: Segment,
  context: SegmentEventContext,
): EventFactoryResult<SegmentPayload> {
  try {
    if (!segment.segmentId) {
      return { success: false, error: 'Segment entity has no segmentId' };
    }
    if (!context.typeSpecificData) {
      return { success: false, error: 'typeSpecificData is required in context' };
    }

    const payload = mapSegmentToPayload(segment, context);

    const event = createEnvelope<SegmentPayload>(
      buildEnvelopeOptions({
        eventType: 'SegmentRemoved',
        tenantId: segment.tripId,
        corporateId: segment.tripId,
        sourceService: SOURCE_SERVICE,
        correlationId: context.correlationId,
        payload,
      }),
    );

    return { success: true, event };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Unknown error creating SegmentRemoved event';
    return { success: false, error: message };
  }
}

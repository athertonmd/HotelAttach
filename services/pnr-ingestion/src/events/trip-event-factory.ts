/**
 * Trip event factory functions.
 * Maps Trip domain entity → TripCreated/TripUpdated event payloads.
 */

import { createEnvelope, type TripPayload } from '@hci/event-contracts';
import type { Trip } from '../domain/trip.js';
import type { EventFactoryResult } from './types.js';
import { buildEnvelopeOptions } from './helpers.js';

const SOURCE_SERVICE = 'hci\\.itinerary';

export interface TripEventContext {
  /** Origin location (IATA code or city) */
  origin: string;
  /** Destination location (IATA code or city) */
  destination: string;
  /** Whether the trip crosses international borders */
  isInternational: boolean;
  /** Correlation ID (preserved from upstream) */
  correlationId?: string;
  /** Causation ID (the event that triggered this) */
  causationId?: string;
}

function mapTripStatus(
  domainStatus: string,
): 'created' | 'active' | 'in_progress' | 'completed' | 'archived' {
  const mapping: Record<string, 'created' | 'active' | 'in_progress' | 'completed' | 'archived'> = {
    draft: 'created',
    booked: 'active',
    ticketed: 'active',
    pre_trip: 'active',
    in_trip: 'in_progress',
    completed: 'completed',
    cancelled: 'archived',
  };
  return mapping[domainStatus] ?? 'created';
}

function mapTripToPayload(trip: Trip, context: TripEventContext): TripPayload {
  return {
    tripId: trip.tripId,
    travellerId: trip.travellerId,
    status: mapTripStatus(trip.status),
    departureDate: trip.startDate?.toISOString() ?? new Date().toISOString(),
    returnDate: trip.endDate?.toISOString() ?? null,
    origin: context.origin,
    destination: context.destination,
    isInternational: context.isInternational,
    segmentIds: trip.segments.map((s) => s.segmentId),
  };
}

/**
 * Creates a TripCreated event from a domain Trip entity.
 */
export function createTripCreatedEvent(
  trip: Trip,
  context: TripEventContext,
): EventFactoryResult<TripPayload> {
  try {
    if (!trip.tripId) {
      return { success: false, error: 'Trip entity has no tripId' };
    }
    if (!context.origin) {
      return { success: false, error: 'origin is required in context' };
    }
    if (!context.destination) {
      return { success: false, error: 'destination is required in context' };
    }

    const payload = mapTripToPayload(trip, context);

    // Schema requires segmentIds to have at least 1 item
    if (payload.segmentIds.length === 0) {
      return { success: false, error: 'Trip must have at least one segment for TripCreated event' };
    }

    const event = createEnvelope<TripPayload>(
      buildEnvelopeOptions({
        eventType: 'TripCreated',
        tenantId: trip.tenantId,
        corporateId: trip.corporateId,
        sourceService: SOURCE_SERVICE,
        correlationId: context.correlationId,
        payload,
      }),
    );

    return { success: true, event };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error creating TripCreated event';
    return { success: false, error: message };
  }
}

/**
 * Creates a TripUpdated event from a domain Trip entity.
 */
export function createTripUpdatedEvent(
  trip: Trip,
  context: TripEventContext,
): EventFactoryResult<TripPayload> {
  try {
    if (!trip.tripId) {
      return { success: false, error: 'Trip entity has no tripId' };
    }
    if (!context.origin) {
      return { success: false, error: 'origin is required in context' };
    }
    if (!context.destination) {
      return { success: false, error: 'destination is required in context' };
    }

    const payload = mapTripToPayload(trip, context);

    if (payload.segmentIds.length === 0) {
      return {
        success: false,
        error: 'Trip must have at least one segment for TripUpdated event',
      };
    }

    const event = createEnvelope<TripPayload>(
      buildEnvelopeOptions({
        eventType: 'TripUpdated',
        tenantId: trip.tenantId,
        corporateId: trip.corporateId,
        sourceService: SOURCE_SERVICE,
        correlationId: context.correlationId,
        payload,
      }),
    );

    return { success: true, event };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error creating TripUpdated event';
    return { success: false, error: message };
  }
}

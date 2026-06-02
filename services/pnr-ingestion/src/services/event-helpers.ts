/**
 * Helpers for building event context objects that comply with exactOptionalPropertyTypes.
 */

import type { PNREventContext } from '../events/pnr-event-factory.js';
import type { TripEventContext } from '../events/trip-event-factory.js';
import type { SegmentEventContext } from '../events/segment-event-factory.js';
import type { TypeSpecificData } from '@hci/event-contracts';
import type { CorrelationContext } from './types.js';

export function buildPNREventContext(
  tripId: string,
  segmentCount: number,
  context: CorrelationContext,
): PNREventContext {
  const result: PNREventContext = { tripId, segmentCount };
  if (context.correlationId !== undefined) {
    result.correlationId = context.correlationId;
  }
  if (context.causationId !== undefined) {
    result.causationId = context.causationId;
  }
  return result;
}

export function buildTripEventContext(
  origin: string,
  destination: string,
  isInternational: boolean,
  context: CorrelationContext,
): TripEventContext {
  const result: TripEventContext = { origin, destination, isInternational };
  if (context.correlationId !== undefined) {
    result.correlationId = context.correlationId;
  }
  if (context.causationId !== undefined) {
    result.causationId = context.causationId;
  }
  return result;
}

export function buildSegmentEventContext(
  typeSpecificData: TypeSpecificData,
  supplierCode: string | null | undefined,
  context: CorrelationContext,
): SegmentEventContext {
  const result: SegmentEventContext = {
    typeSpecificData,
    supplierCode: supplierCode ?? null,
  };
  if (context.correlationId !== undefined) {
    result.correlationId = context.correlationId;
  }
  if (context.causationId !== undefined) {
    result.causationId = context.causationId;
  }
  return result;
}

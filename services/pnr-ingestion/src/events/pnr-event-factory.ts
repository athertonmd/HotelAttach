/**
 * PNR event factory functions.
 * Maps PNR domain entity → PNRCreated/PNRUpdated event payloads.
 */

import { createEnvelope, type PNRPayload } from '@hci/event-contracts';
import type { PNR } from '../domain/pnr.js';
import type { EventFactoryResult } from './types.js';
import { buildEnvelopeOptions } from './helpers.js';

const SOURCE_SERVICE = 'hci\\.itinerary';

export interface PNREventContext {
  /** Trip ID associated with this PNR */
  tripId: string;
  /** Number of segments in this PNR */
  segmentCount: number;
  /** Correlation ID (preserved from upstream, or generated for new workflows) */
  correlationId?: string;
  /** Causation ID (the event that triggered this) */
  causationId?: string;
}

function mapPNRToPayload(pnr: PNR, context: PNREventContext): PNRPayload {
  return {
    pnrId: pnr.pnrId,
    recordLocator: pnr.recordLocator,
    travellerId: pnr.travellerId,
    tripId: context.tripId,
    gdsSource: pnr.sourceSystem,
    createdAt: pnr.createdAt.toISOString(),
    segmentCount: context.segmentCount,
    rawPnrRef: pnr.rawPnrRef ?? `s3://hci-raw-pnrs/${pnr.pnrId}`,
  };
}

/**
 * Creates a PNRCreated event from a domain PNR entity.
 * Validates the payload structure before returning.
 */
export function createPNRCreatedEvent(
  pnr: PNR,
  context: PNREventContext,
): EventFactoryResult<PNRPayload> {
  try {
    if (!pnr.pnrId) {
      return { success: false, error: 'PNR entity has no pnrId' };
    }
    if (!context.tripId) {
      return { success: false, error: 'tripId is required in context' };
    }
    if (context.segmentCount < 1) {
      return { success: false, error: 'segmentCount must be >= 1' };
    }

    const payload = mapPNRToPayload(pnr, context);

    const event = createEnvelope<PNRPayload>(
      buildEnvelopeOptions({
        eventType: 'PNRCreated',
        tenantId: pnr.tenantId,
        corporateId: pnr.corporateId,
        sourceService: SOURCE_SERVICE,
        correlationId: context.correlationId,
        payload,
      }),
    );

    return { success: true, event };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error creating PNRCreated event';
    return { success: false, error: message };
  }
}

/**
 * Creates a PNRUpdated event from a domain PNR entity.
 */
export function createPNRUpdatedEvent(
  pnr: PNR,
  context: PNREventContext,
): EventFactoryResult<PNRPayload> {
  try {
    if (!pnr.pnrId) {
      return { success: false, error: 'PNR entity has no pnrId' };
    }
    if (!context.tripId) {
      return { success: false, error: 'tripId is required in context' };
    }
    if (context.segmentCount < 1) {
      return { success: false, error: 'segmentCount must be >= 1' };
    }

    const payload = mapPNRToPayload(pnr, context);

    const event = createEnvelope<PNRPayload>(
      buildEnvelopeOptions({
        eventType: 'PNRUpdated',
        tenantId: pnr.tenantId,
        corporateId: pnr.corporateId,
        sourceService: SOURCE_SERVICE,
        correlationId: context.correlationId,
        payload,
      }),
    );

    return { success: true, event };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error creating PNRUpdated event';
    return { success: false, error: message };
  }
}

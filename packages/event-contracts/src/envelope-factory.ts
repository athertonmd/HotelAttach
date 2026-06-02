/**
 * Event envelope creation utilities.
 * Creates correctly-shaped event envelopes with proper correlation/causation tracking.
 */

import { randomUUID } from 'node:crypto';
import type { HCIEventEnvelope, EventType } from './envelope.js';

export interface CreateEnvelopeOptions<T extends object> {
  /** The event type (must be an approved event type) */
  eventType: EventType;

  /** The event payload */
  payload: T;

  /** TMC or Corporate tenant identifier */
  tenantId: string;

  /** Corporate organisation identifier */
  corporateId: string;

  /** The publishing service name (e.g., "hci\\.itinerary") */
  sourceService: string;

  /**
   * Correlation ID tracing back to the originating action.
   * If not provided, a new UUID is generated (use for workflow entry points only).
   */
  correlationId?: string;

  /** Schema version (defaults to 1) */
  schemaVersion?: number;

  /** Event timestamp (defaults to current UTC time) */
  timestamp?: string;
}

/**
 * Creates a fully-formed event envelope with all required fields.
 *
 * Correlation/causation rules:
 * - correlationId: preserved across an entire business workflow
 * - causationId: references the specific event that caused this one
 * - For the first event in a workflow, causationId equals correlationId
 */
export function createEnvelope<T extends object>(
  options: CreateEnvelopeOptions<T>,
): HCIEventEnvelope<T> {
  const correlationId = options.correlationId ?? randomUUID();

  return {
    eventId: randomUUID(),
    eventType: options.eventType,
    schemaVersion: options.schemaVersion ?? 1,
    tenantId: options.tenantId,
    corporateId: options.corporateId,
    sourceService: options.sourceService,
    timestamp: options.timestamp ?? new Date().toISOString(),
    correlationId,
    payload: options.payload,
  };
}

/**
 * Derives correlation context from a received event for publishing downstream events.
 * Preserves the correlationId and sets causationId to the source event's eventId.
 */
export function deriveCorrelation(sourceEvent: HCIEventEnvelope): {
  correlationId: string;
  causationId: string;
} {
  return {
    correlationId: sourceEvent.correlationId,
    causationId: sourceEvent.eventId,
  };
}

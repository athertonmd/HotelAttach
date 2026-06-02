/**
 * Event validation interface.
 * Abstracts schema validation so the publisher/consumer don't depend directly on Ajv.
 */

import type { HCIEventEnvelope } from './envelope.js';
import { EVENT_TYPE_TO_SCHEMA } from './publisher.js';

export interface EventValidationResult {
  valid: boolean;
  errors: { path: string; message: string }[];
}

/**
 * Interface for event validation.
 * Implementations can use Ajv, Zod, or any other validation library.
 */
export interface EventValidator {
  /**
   * Validate a full event (envelope + payload) against its schema.
   */
  validateEvent(event: HCIEventEnvelope): EventValidationResult;

  /**
   * Validate only the envelope structure.
   */
  validateEnvelope(event: unknown): EventValidationResult;
}

/**
 * Returns the schema name for a given event type.
 */
export function getSchemaNameForEventType(eventType: string): string | undefined {
  return EVENT_TYPE_TO_SCHEMA[eventType as keyof typeof EVENT_TYPE_TO_SCHEMA];
}

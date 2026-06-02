/**
 * Typed EventConsumer abstraction.
 * Validates received events and dispatches to registered handlers.
 */

import type { HCIEventEnvelope, EventType } from './envelope.js';
import type { EventValidator } from './event-validator.js';
import type { IdempotencyStore } from './idempotency.js';

export type EventHandler<T extends object = object> = (event: HCIEventEnvelope<T>) => Promise<void>;

export interface EventConsumerOptions {
  /** Event validator instance */
  validator: EventValidator;
  /** Whether to validate received events (defaults to true) */
  validateOnReceive?: boolean;
  /** Optional idempotency store for deduplication */
  idempotencyStore?: IdempotencyStore;
}

export interface ConsumeResult {
  /** Whether the event was successfully processed */
  success: boolean;
  /** The event ID that was processed */
  eventId: string;
  /** Whether the event was skipped as a duplicate */
  duplicate?: boolean;
  /** Error message if processing failed */
  error?: string;
}

export class EventConsumer {
  private readonly validator: EventValidator;
  private readonly validateOnReceive: boolean;
  private readonly idempotencyStore: IdempotencyStore | undefined;
  private readonly handlers = new Map<EventType, EventHandler[]>();

  constructor(options: EventConsumerOptions) {
    this.validator = options.validator;
    this.validateOnReceive = options.validateOnReceive ?? true;
    this.idempotencyStore = options.idempotencyStore;
  }

  /**
   * Register a handler for a specific event type.
   * Multiple handlers can be registered for the same event type.
   */
  on<T extends object>(eventType: EventType, handler: EventHandler<T>): void {
    const existing = this.handlers.get(eventType) ?? [];
    existing.push(handler as EventHandler);
    this.handlers.set(eventType, existing);
  }

  /**
   * Process a received event.
   * Validates, checks idempotency, then dispatches to registered handlers.
   */
  async consume(event: HCIEventEnvelope): Promise<ConsumeResult> {
    // Validate the event structure
    if (this.validateOnReceive) {
      const validationResult = this.validator.validateEvent(event);
      if (!validationResult.valid) {
        return {
          success: false,
          eventId: event.eventId,
          error: `Validation failed: ${validationResult.errors.map((e) => e.message).join('; ')}`,
        };
      }
    }

    // Check idempotency
    if (this.idempotencyStore) {
      const alreadyProcessed = await this.idempotencyStore.hasProcessed(event.eventId);
      if (alreadyProcessed) {
        return { success: true, eventId: event.eventId, duplicate: true };
      }
    }

    // Dispatch to handlers
    const handlers = this.handlers.get(event.eventType) ?? [];
    if (handlers.length === 0) {
      return { success: true, eventId: event.eventId };
    }

    try {
      for (const handler of handlers) {
        await handler(event);
      }

      // Mark as processed
      if (this.idempotencyStore) {
        await this.idempotencyStore.markProcessed(event.eventId);
      }

      return { success: true, eventId: event.eventId };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown handler error';
      return { success: false, eventId: event.eventId, error: message };
    }
  }
}

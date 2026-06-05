/**
 * Typed EventPublisher abstraction.
 * Validates events before publishing and delegates to a transport adapter.
 */

import type { HCIEventEnvelope, EventType } from './envelope.js';
import type { EventBusAdapter } from './adapters.js';
import type { EventValidator } from './event-validator.js';

export interface PublishResult {
  /** Whether the event was successfully published */
  success: boolean;
  /** The event ID of the published event */
  eventId: string;
  /** Error message if publish failed */
  error?: string;
}

export interface EventPublisherOptions {
  /** The transport adapter (EventBridge, in-memory, etc.) */
  adapter: EventBusAdapter;
  /** Event validator instance */
  validator: EventValidator;
  /** Whether to validate events before publishing (defaults to true) */
  validateBeforePublish?: boolean;
}

export class EventPublisher {
  private readonly adapter: EventBusAdapter;
  private readonly validator: EventValidator;
  private readonly validateBeforePublish: boolean;

  constructor(options: EventPublisherOptions) {
    this.adapter = options.adapter;
    this.validator = options.validator;
    this.validateBeforePublish = options.validateBeforePublish ?? true;
  }

  /**
   * Publish a typed event to the event bus.
   * Validates the event against its schema before publishing (unless disabled).
   */
  async publish<T extends object>(event: HCIEventEnvelope<T>): Promise<PublishResult> {
    if (this.validateBeforePublish) {
      const validationResult = this.validator.validateEvent(event);
      if (!validationResult.valid) {
        return {
          success: false,
          eventId: event.eventId,
          error: `Validation failed: ${validationResult.errors.map((e) => e.message).join('; ')}`,
        };
      }
    }

    try {
      await this.adapter.publish(event);
      return { success: true, eventId: event.eventId };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown publish error';
      return { success: false, eventId: event.eventId, error: message };
    }
  }

  /**
   * Publish multiple events in order.
   * Stops on first validation failure but continues on adapter errors.
   */
  async publishBatch<T extends object>(events: HCIEventEnvelope<T>[]): Promise<PublishResult[]> {
    const results: PublishResult[] = [];
    for (const event of events) {
      const result = await this.publish(event);
      results.push(result);
      if (!result.success && this.validateBeforePublish) {
        // Stop on validation failure
        break;
      }
    }
    return results;
  }
}

/**
 * Maps event types to their schema names for validation lookup.
 */
export const EVENT_TYPE_TO_SCHEMA: Record<EventType, string> = {
  PNRCreated: 'pnr-created',
  PNRUpdated: 'pnr-updated',
  TripCreated: 'trip-created',
  TripUpdated: 'trip-updated',
  SegmentAdded: 'segment-added',
  SegmentUpdated: 'segment-updated',
  SegmentRemoved: 'segment-removed',
  TravellerCreated: 'traveller-created',
  TravellerUpdated: 'traveller-updated',
  BookingCreated: 'booking-created',
  BookingUpdated: 'booking-updated',
  BookingCancelled: 'booking-cancelled',
  HotelMatched: 'hotel-matched',
  HotelRejected: 'hotel-rejected',
  HotelCoverageUpdated: 'hotel-coverage-updated',
  HotelOrphanDetected: 'hotel-orphan-detected',
  OpportunityCreated: 'opportunity-created',
  OpportunityUpdated: 'opportunity-updated',
  OpportunityClosed: 'opportunity-closed',
  OpportunityRejected: 'opportunity-rejected',
  CommunicationSent: 'communication-sent',
  TravellerResponded: 'traveller-responded',
  BookingRequestCreated: 'booking-request-created',
  // Behaviour Intelligence (Project 6)
  BehaviourProfileUpdated: 'behaviour-profile-updated',
  ArchetypeAssigned: 'archetype-assigned',
  BookingAttributed: 'booking-attributed',
  BehaviourDriftDetected: 'behaviour-drift-detected',
  FatigueThresholdCrossed: 'fatigue-threshold-crossed',
  ActionRecommended: 'action-recommended',
  CommunicationSuppressed: 'communication-suppressed',
  CommunicationSuppressedByFatigue: 'communication-suppressed-by-fatigue',
  PredictionOutcomeRecorded: 'prediction-outcome-recorded',
};

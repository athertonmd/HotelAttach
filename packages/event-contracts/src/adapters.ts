/**
 * Event bus adapter interfaces and implementations.
 */

import type { HCIEventEnvelope, EventType } from './envelope.js';

/**
 * Transport adapter interface for publishing events.
 * Implementations handle the actual delivery mechanism.
 */
export interface EventBusAdapter {
  /**
   * Publish an event to the bus.
   */
  publish(event: HCIEventEnvelope): Promise<void>;
}

/**
 * Subscription callback type.
 */
export type SubscriptionCallback = (event: HCIEventEnvelope) => Promise<void>;

/**
 * Transport adapter interface for subscribing to events.
 */
export interface EventBusSubscriber {
  /**
   * Subscribe to events of a specific type.
   */
  subscribe(eventType: EventType, callback: SubscriptionCallback): void;

  /**
   * Unsubscribe all handlers for an event type.
   */
  unsubscribe(eventType: EventType): void;
}

/**
 * In-memory event bus adapter for testing.
 * Supports both publishing and subscribing within a single process.
 */
export class InMemoryEventBus implements EventBusAdapter, EventBusSubscriber {
  private readonly subscribers = new Map<EventType, SubscriptionCallback[]>();
  private readonly publishedEvents: HCIEventEnvelope[] = [];

  async publish(event: HCIEventEnvelope): Promise<void> {
    this.publishedEvents.push(event);

    const callbacks = this.subscribers.get(event.eventType) ?? [];
    for (const callback of callbacks) {
      await callback(event);
    }
  }

  subscribe(eventType: EventType, callback: SubscriptionCallback): void {
    const existing = this.subscribers.get(eventType) ?? [];
    existing.push(callback);
    this.subscribers.set(eventType, existing);
  }

  unsubscribe(eventType: EventType): void {
    this.subscribers.delete(eventType);
  }

  /**
   * Get all published events (for test assertions).
   */
  getPublishedEvents(): readonly HCIEventEnvelope[] {
    return this.publishedEvents;
  }

  /**
   * Get published events filtered by type (for test assertions).
   */
  getEventsByType(eventType: EventType): readonly HCIEventEnvelope[] {
    return this.publishedEvents.filter((e) => e.eventType === eventType);
  }

  /**
   * Clear all published events and subscribers (for test cleanup).
   */
  clear(): void {
    this.publishedEvents.length = 0;
    this.subscribers.clear();
  }
}

/**
 * AWS EventBridge adapter stub.
 * Implements the EventBusAdapter interface but does not deploy AWS resources.
 * Replace with actual AWS SDK calls when infrastructure is provisioned.
 */
export class EventBridgeAdapter implements EventBusAdapter {
  private readonly eventBusName: string;

  constructor(options: { eventBusName: string }) {
    this.eventBusName = options.eventBusName;
  }

  async publish(_event: HCIEventEnvelope): Promise<void> {
    // TODO: Implement with AWS SDK EventBridge PutEvents
    // const client = new EventBridgeClient({});
    // await client.send(new PutEventsCommand({
    //   Entries: [{
    //     EventBusName: this.eventBusName,
    //     Source: event.sourceService,
    //     DetailType: event.eventType,
    //     Detail: JSON.stringify(event),
    //   }],
    // }));
    throw new Error(
      `EventBridgeAdapter not yet implemented. Bus: ${this.eventBusName}. ` +
        'Deploy AWS infrastructure before using this adapter.',
    );
  }
}

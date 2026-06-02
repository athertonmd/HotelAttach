/**
 * @hci/event-contracts
 *
 * Event envelope utilities, type definitions, and event framework for the HCI platform.
 * All types are derived from the authoritative JSON schemas in /schemas.
 */

// Event types and constants
export { EVENT_TYPES, type EventTypeConstant } from './event-types.js';
export type { HCIEventEnvelope, EventType } from './envelope.js';

// Payload types
export type { PNRPayload, PNRCreatedEvent, PNRUpdatedEvent } from './pnr-events.js';
export type { TripPayload, TripStatus, TripCreatedEvent, TripUpdatedEvent } from './trip-events.js';
export type {
  SegmentPayload,
  SegmentType,
  SegmentStatus,
  FlightSpecificData,
  RailSpecificData,
  CarSpecificData,
  HotelSpecificData,
  TypeSpecificData,
  SegmentAddedEvent,
  SegmentUpdatedEvent,
  SegmentRemovedEvent,
} from './segment-events.js';
export type {
  TravellerPayload,
  TravellerStatus,
  TravellerCreatedEvent,
  TravellerUpdatedEvent,
} from './traveller-events.js';

// Envelope factory
export {
  createEnvelope,
  deriveCorrelation,
  type CreateEnvelopeOptions,
} from './envelope-factory.js';

// Publisher
export {
  EventPublisher,
  EVENT_TYPE_TO_SCHEMA,
  type PublishResult,
  type EventPublisherOptions,
} from './publisher.js';

// Consumer
export {
  EventConsumer,
  type EventHandler,
  type EventConsumerOptions,
  type ConsumeResult,
} from './consumer.js';

// Validator interface
export {
  type EventValidator,
  type EventValidationResult,
  getSchemaNameForEventType,
} from './event-validator.js';

// Idempotency
export { type IdempotencyStore, InMemoryIdempotencyStore } from './idempotency.js';

// Adapters
export {
  type EventBusAdapter,
  type EventBusSubscriber,
  type SubscriptionCallback,
  InMemoryEventBus,
  EventBridgeAdapter,
} from './adapters.js';

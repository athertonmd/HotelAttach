/**
 * Event factory functions for the Itinerary Intelligence Platform.
 * Maps domain entities to event contract payloads.
 */

export {
  createPNRCreatedEvent,
  createPNRUpdatedEvent,
  type PNREventContext,
} from './pnr-event-factory.js';
export {
  createTripCreatedEvent,
  createTripUpdatedEvent,
  type TripEventContext,
} from './trip-event-factory.js';
export {
  createSegmentAddedEvent,
  createSegmentUpdatedEvent,
  createSegmentRemovedEvent,
  type SegmentEventContext,
} from './segment-event-factory.js';
export type { EventFactoryResult } from './types.js';

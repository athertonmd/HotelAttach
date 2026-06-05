/**
 * HCI Event Envelope
 * Derived from: schemas/envelope.schema.json
 *
 * Standard envelope wrapping all domain events on the hci-domain-events EventBridge bus.
 * All events published by any HCI service MUST conform to this envelope structure.
 */

export type EventType =
  | 'TravellerCreated'
  | 'TravellerUpdated'
  | 'PNRCreated'
  | 'PNRUpdated'
  | 'TripCreated'
  | 'TripUpdated'
  | 'SegmentAdded'
  | 'SegmentUpdated'
  | 'SegmentRemoved'
  | 'BookingCreated'
  | 'BookingUpdated'
  | 'BookingCancelled'
  | 'HotelMatched'
  | 'HotelRejected'
  | 'HotelCoverageUpdated'
  | 'HotelOrphanDetected'
  | 'OpportunityCreated'
  | 'OpportunityUpdated'
  | 'OpportunityClosed'
  | 'OpportunityRejected'
  | 'CommunicationSent'
  | 'TravellerResponded'
  | 'BookingRequestCreated'
  | 'BehaviourProfileUpdated'
  | 'ArchetypeAssigned'
  | 'BookingAttributed'
  | 'BehaviourDriftDetected'
  | 'FatigueThresholdCrossed'
  | 'ActionRecommended'
  | 'CommunicationSuppressed'
  | 'CommunicationSuppressedByFatigue'
  | 'PredictionOutcomeRecorded';

export interface HCIEventEnvelope<T extends object = object> {
  /** Unique identifier for this event instance (UUID v4) */
  eventId: string;

  /** Domain event type */
  eventType: EventType;

  /** Schema version number (defaults to 1) */
  schemaVersion: number;

  /** TMC or Corporate tenant identifier (UUID v4) */
  tenantId: string;

  /** Corporate organisation identifier (UUID v4) */
  corporateId: string;

  /** Dot-notation service identifier (e.g., "hci.itinerary") */
  sourceService: string;

  /** Event creation time in UTC (ISO-8601) */
  timestamp: string;

  /** Traces back to the originating action (UUID v4) */
  correlationId: string;

  /** Event-type-specific payload */
  payload: T;
}

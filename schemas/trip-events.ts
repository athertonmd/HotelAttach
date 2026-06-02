/**
 * Trip Domain Events
 * Published by the Trip Management bounded context.
 */

import { HCIEventEnvelope } from './envelope';

export type TripStatus = 'created' | 'active' | 'in_progress' | 'completed' | 'archived';

export interface TripPayload {
  /** Unique trip identifier (UUID v4) */
  tripId: string;

  /** Reference to traveller (UUID v4) */
  travellerId: string;

  /** Trip lifecycle state */
  status: TripStatus;

  /** Departure date/time (ISO-8601) */
  departureDate: string;

  /** Return date/time (ISO-8601), null for one-way trips */
  returnDate: string | null;

  /** Origin location (IATA code or city) */
  origin: string;

  /** Destination location (IATA code or city) */
  destination: string;

  /** Whether the trip crosses international borders */
  isInternational: boolean;

  /** References to all segments in this trip (UUID v4[]) */
  segmentIds: string[];
}

export type TripCreatedEvent = HCIEventEnvelope<TripPayload> & {
  eventType: 'TripCreated';
};

export type TripUpdatedEvent = HCIEventEnvelope<TripPayload> & {
  eventType: 'TripUpdated';
};

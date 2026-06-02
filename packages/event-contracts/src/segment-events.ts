/**
 * Segment Domain Events
 * Derived from: schemas/segment-added.schema.json, schemas/segment-updated.schema.json,
 *               schemas/segment-removed.schema.json
 * Published by the Segment Management bounded context.
 */

import type { HCIEventEnvelope } from './envelope.js';

export type SegmentType = 'flight' | 'rail' | 'car' | 'hotel';
export type SegmentStatus = 'confirmed' | 'cancelled' | 'waitlisted';

/** Flight-specific attributes */
export interface FlightSpecificData {
  flightNumber: string;
  airline: string;
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
  bookingClass: string;
}

/** Rail-specific attributes */
export interface RailSpecificData {
  trainNumber: string;
  operator: string;
  seatClass: string;
  stationCodes: string[];
}

/** Car-specific attributes */
export interface CarSpecificData {
  pickupLocation: string;
  dropoffLocation: string;
  rentalCompany: string;
  vehicleClass: string;
}

/** Hotel-specific attributes */
export interface HotelSpecificData {
  propertyName: string;
  propertyCode: string | null;
  chainCode: string | null;
  checkInDate: string;
  checkOutDate: string;
  roomNights: number;
  rateCode: string | null;
  city: string;
  country: string;
}

export type TypeSpecificData =
  | FlightSpecificData
  | RailSpecificData
  | CarSpecificData
  | HotelSpecificData;

export interface SegmentPayload {
  /** Unique segment identifier (UUID v4) */
  segmentId: string;

  /** Reference to trip (UUID v4) */
  tripId: string;

  /** Segment type discriminator */
  segmentType: SegmentType;

  /** Departure/start date-time (ISO-8601) */
  departureDateTime: string;

  /** Arrival/end date-time (ISO-8601) */
  arrivalDateTime: string;

  /** Origin location */
  origin: string;

  /** Destination location */
  destination: string;

  /** Supplier/carrier code (null if not available) */
  supplierCode: string | null;

  /** Booking status */
  status: SegmentStatus;

  /** Type-dependent attributes */
  typeSpecificData: TypeSpecificData;
}

export type SegmentAddedEvent = HCIEventEnvelope<SegmentPayload> & {
  eventType: 'SegmentAdded';
};

export type SegmentUpdatedEvent = HCIEventEnvelope<SegmentPayload> & {
  eventType: 'SegmentUpdated';
};

export type SegmentRemovedEvent = HCIEventEnvelope<SegmentPayload> & {
  eventType: 'SegmentRemoved';
};

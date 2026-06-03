/**
 * Event type constants matching the eventType enum in envelope.schema.json
 * and the const values in each event schema.
 *
 * Source: schemas/envelope.schema.json → properties.eventType.enum
 */

export const EVENT_TYPES = {
  TravellerCreated: 'TravellerCreated',
  TravellerUpdated: 'TravellerUpdated',
  PNRCreated: 'PNRCreated',
  PNRUpdated: 'PNRUpdated',
  TripCreated: 'TripCreated',
  TripUpdated: 'TripUpdated',
  SegmentAdded: 'SegmentAdded',
  SegmentUpdated: 'SegmentUpdated',
  SegmentRemoved: 'SegmentRemoved',
  BookingCreated: 'BookingCreated',
  BookingUpdated: 'BookingUpdated',
  BookingCancelled: 'BookingCancelled',
  HotelMatched: 'HotelMatched',
  HotelRejected: 'HotelRejected',
  HotelCoverageUpdated: 'HotelCoverageUpdated',
  HotelOrphanDetected: 'HotelOrphanDetected',
} as const;

export type EventTypeConstant = (typeof EVENT_TYPES)[keyof typeof EVENT_TYPES];

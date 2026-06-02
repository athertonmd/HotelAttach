/**
 * Itinerary Intelligence domain model.
 * Source: Project 1 Specification
 */

export { Traveller, type CreateTravellerInput } from './traveller.js';
export { PNR, type CreatePNRInput } from './pnr.js';
export { Trip, type CreateTripInput } from './trip.js';
export { Segment, type CreateSegmentInput, type UpdateSegmentInput } from './segment.js';
export { TimelineEvent, type CreateTimelineEventInput } from './timeline-event.js';
export type {
  TripStatus,
  SegmentType,
  SegmentStatus,
  TravellerStatus,
  PNRStatus,
  TimelineEventType,
  AuditFields,
  TenantContext,
} from './value-objects.js';

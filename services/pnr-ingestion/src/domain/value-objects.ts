/**
 * Value objects and enums for the Itinerary Intelligence domain.
 * Derived from: Project 1 Specification, Architecture & Integration Guide §4.1–4.4
 */

/** Trip lifecycle states. Source: Project 1 §Trip Lifecycle */
export type TripStatus =
  | 'draft'
  | 'booked'
  | 'ticketed'
  | 'pre_trip'
  | 'in_trip'
  | 'completed'
  | 'cancelled';

/** Segment types. Source: Project 1 §FR4 */
export type SegmentType = 'flight' | 'hotel' | 'rail' | 'car' | 'transfer' | 'other';

/** Segment booking status */
export type SegmentStatus = 'confirmed' | 'cancelled' | 'waitlisted';

/** Traveller status */
export type TravellerStatus = 'active' | 'inactive';

/** PNR status */
export type PNRStatus = 'active' | 'cancelled' | 'archived';

/** Timeline event types. Source: Project 1 §FR5, §FR6 */
export type TimelineEventType =
  | 'booking_created'
  | 'flight_added'
  | 'flight_removed'
  | 'hotel_added'
  | 'hotel_cancelled'
  | 'segment_added'
  | 'segment_updated'
  | 'segment_removed'
  | 'date_changed'
  | 'traveller_changed'
  | 'trip_completed'
  | 'trip_cancelled'
  | 'status_changed';

/** Common audit fields required on all domain entities */
export interface AuditFields {
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/** Multi-tenant context required on all domain entities */
export interface TenantContext {
  readonly tenantId: string;
  readonly corporateId: string;
}

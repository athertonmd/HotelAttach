/**
 * Booking Domain Events
 * Derived from: schemas/booking-created.schema.json, booking-updated, booking-cancelled
 * Published by PNR Ingestion when hotel segments are detected/modified/cancelled (Q2).
 */

import type { HCIEventEnvelope } from './envelope.js';

export interface BookingCreatedPayload {
  bookingId: string;
  travellerId: string;
  tenantId: string;
  hotelName: string;
  city: string;
  country: string;
  checkinDate: string;
  checkoutDate: string;
  bookingDate: string;
  roomNights: number;
  status: 'confirmed' | 'waitlisted';
  bookingVersion: number;
  hotelChain?: string | null;
  confirmationNumber?: string | null;
  supplierCode?: string | null;
  employeeNumber?: string | null;
  email?: string | null;
  sourceSegmentId?: string | null;
}

export interface BookingUpdatedPayload extends BookingCreatedPayload {
  previousCheckinDate?: string | null;
  previousCheckoutDate?: string | null;
}

export interface BookingCancelledPayload {
  bookingId: string;
  travellerId: string;
  tenantId: string;
  cancelledAt: string;
  reason?: string | null;
  hotelName?: string | null;
  city?: string | null;
  checkinDate?: string | null;
  checkoutDate?: string | null;
}

export type BookingCreatedEvent = HCIEventEnvelope<BookingCreatedPayload> & {
  eventType: 'BookingCreated';
};

export type BookingUpdatedEvent = HCIEventEnvelope<BookingUpdatedPayload> & {
  eventType: 'BookingUpdated';
};

export type BookingCancelledEvent = HCIEventEnvelope<BookingCancelledPayload> & {
  eventType: 'BookingCancelled';
};

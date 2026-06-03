/**
 * OrphanBooking domain entity.
 * Represents a hotel booking that cannot be attached to any known trip.
 * Source: Project 2 Specification §Orphan Hotel Detection
 */

import { DateRange } from './value-objects.js';

const REASSOCIATION_WINDOW_DAYS = 30;

export interface CreateOrphanBookingInput {
  tenantId: string;
  bookingId: string;
  travellerId: string;
  hotelName: string;
  city: string;
  country: string;
  checkinDate: Date;
  checkoutDate: Date;
  roomNights?: number | null;
  hotelChain?: string | null;
}

export class OrphanBooking {
  readonly tenantId: string;
  readonly bookingId: string;
  readonly travellerId: string;
  readonly hotelName: string;
  readonly city: string;
  readonly country: string;
  readonly checkinDate: Date;
  readonly checkoutDate: Date;
  readonly stayRange: DateRange;
  readonly detectedAt: Date;
  readonly reassociationDeadline: Date;
  readonly roomNights: number | null;
  readonly hotelChain: string | null;

  private constructor(input: CreateOrphanBookingInput, now: Date) {
    this.tenantId = input.tenantId;
    this.bookingId = input.bookingId;
    this.travellerId = input.travellerId;
    this.hotelName = input.hotelName;
    this.city = input.city;
    this.country = input.country;
    this.checkinDate = input.checkinDate;
    this.checkoutDate = input.checkoutDate;
    this.stayRange = new DateRange(input.checkinDate, input.checkoutDate);
    this.detectedAt = now;
    this.reassociationDeadline = new Date(
      now.getTime() + REASSOCIATION_WINDOW_DAYS * 24 * 60 * 60 * 1000,
    );
    this.roomNights = input.roomNights ?? null;
    this.hotelChain = input.hotelChain ?? null;
  }

  static create(input: CreateOrphanBookingInput): OrphanBooking {
    if (!input.tenantId) throw new Error('tenantId is required');
    if (!input.bookingId) throw new Error('bookingId is required');
    if (!input.travellerId) throw new Error('travellerId is required');
    if (!input.hotelName) throw new Error('hotelName cannot be empty');
    if (!input.city) throw new Error('city cannot be empty');
    if (!input.country) throw new Error('country cannot be empty');
    // DateRange constructor validates checkinDate < checkoutDate

    return new OrphanBooking(input, new Date());
  }
}

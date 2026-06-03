/**
 * HotelBooking domain entity.
 * Represents a hotel booking received for reconciliation.
 * Source: Project 2 Specification §Matching Inputs, §Database Design — Hotel Bookings
 */

import { DateRange } from './value-objects.js';

export interface CreateHotelBookingInput {
  tenantId: string;
  bookingId: string;
  travellerId: string;
  bookingVersion: number;
  hotelName: string;
  city: string;
  country: string;
  checkinDate: Date;
  checkoutDate: Date;
  bookingDate: Date;
  roomNights: number;
  status: 'confirmed' | 'waitlisted';
  hotelChain?: string | null;
  confirmationNumber?: string | null;
  supplierCode?: string | null;
  employeeNumber?: string | null;
  email?: string | null;
  sourceSegmentId?: string | null;
}

export class HotelBooking {
  readonly tenantId: string;
  readonly bookingId: string;
  readonly travellerId: string;
  readonly bookingVersion: number;
  readonly hotelName: string;
  readonly city: string;
  readonly country: string;
  readonly checkinDate: Date;
  readonly checkoutDate: Date;
  readonly bookingDate: Date;
  readonly roomNights: number;
  readonly status: 'confirmed' | 'waitlisted';
  readonly hotelChain: string | null;
  readonly confirmationNumber: string | null;
  readonly supplierCode: string | null;
  readonly employeeNumber: string | null;
  readonly email: string | null;
  readonly sourceSegmentId: string | null;
  readonly stayRange: DateRange;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(input: CreateHotelBookingInput, now: Date) {
    this.tenantId = input.tenantId;
    this.bookingId = input.bookingId;
    this.travellerId = input.travellerId;
    this.bookingVersion = input.bookingVersion;
    this.hotelName = input.hotelName;
    this.city = input.city;
    this.country = input.country;
    this.checkinDate = input.checkinDate;
    this.checkoutDate = input.checkoutDate;
    this.bookingDate = input.bookingDate;
    this.roomNights = input.roomNights;
    this.status = input.status;
    this.hotelChain = input.hotelChain ?? null;
    this.confirmationNumber = input.confirmationNumber ?? null;
    this.supplierCode = input.supplierCode ?? null;
    this.employeeNumber = input.employeeNumber ?? null;
    this.email = input.email ?? null;
    this.sourceSegmentId = input.sourceSegmentId ?? null;
    this.stayRange = new DateRange(input.checkinDate, input.checkoutDate);
    this.createdAt = now;
    this.updatedAt = now;
  }

  static create(input: CreateHotelBookingInput): HotelBooking {
    if (!input.tenantId) throw new Error('tenantId is required');
    if (!input.bookingId) throw new Error('bookingId is required');
    if (!input.travellerId) throw new Error('travellerId is required');
    if (!input.hotelName) throw new Error('hotelName cannot be empty');
    if (!input.city) throw new Error('city cannot be empty');
    if (!input.country) throw new Error('country cannot be empty');
    if (input.roomNights < 1) throw new Error('roomNights must be at least 1');
    if (input.bookingVersion < 1) throw new Error('bookingVersion must be at least 1');
    // DateRange constructor validates checkinDate < checkoutDate

    return new HotelBooking(input, new Date());
  }
}

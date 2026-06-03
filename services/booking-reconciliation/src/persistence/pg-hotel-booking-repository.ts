/**
 * PostgreSQL implementation of HotelBookingRepository.
 * Includes bookingVersion conflict handling.
 */

import { HotelBooking } from '../domain/hotel-booking.js';
import type { HotelBookingRepository } from '../repositories/interfaces.js';
import type { DatabaseClient } from './db-client.js';
import { VersionConflictError } from './db-client.js';

export class PgHotelBookingRepository implements HotelBookingRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findById(tenantId: string, bookingId: string): Promise<HotelBooking | undefined> {
    const result = await this.db.query(
      'SELECT * FROM booking_reconciliation.hotel_bookings WHERE tenant_id = $1 AND booking_id = $2',
      [tenantId, bookingId],
    );
    return result.rows[0] ? this.toEntity(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async save(booking: HotelBooking): Promise<void> {
    const existing = await this.db.query<{ booking_version: number }>(
      'SELECT booking_version FROM booking_reconciliation.hotel_bookings WHERE tenant_id = $1 AND booking_id = $2',
      [booking.tenantId, booking.bookingId],
    );
    if (existing.rows[0] && existing.rows[0].booking_version >= booking.bookingVersion) {
      throw new VersionConflictError(
        'HotelBooking',
        booking.bookingId,
        booking.bookingVersion,
        existing.rows[0].booking_version,
      );
    }

    await this.db.query(
      `INSERT INTO booking_reconciliation.hotel_bookings (booking_id, tenant_id, traveller_id, booking_version, hotel_name, city, country, checkin_date, checkout_date, booking_date, room_nights, status, hotel_chain, confirmation_number, supplier_code, employee_number, email, source_segment_id, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       ON CONFLICT (booking_id) DO UPDATE SET booking_version=EXCLUDED.booking_version, hotel_name=EXCLUDED.hotel_name, city=EXCLUDED.city, country=EXCLUDED.country, checkin_date=EXCLUDED.checkin_date, checkout_date=EXCLUDED.checkout_date, room_nights=EXCLUDED.room_nights, status=EXCLUDED.status, updated_at=EXCLUDED.updated_at`,
      [
        booking.bookingId,
        booking.tenantId,
        booking.travellerId,
        booking.bookingVersion,
        booking.hotelName,
        booking.city,
        booking.country,
        booking.checkinDate.toISOString(),
        booking.checkoutDate.toISOString(),
        booking.bookingDate.toISOString(),
        booking.roomNights,
        booking.status,
        booking.hotelChain,
        booking.confirmationNumber,
        booking.supplierCode,
        booking.employeeNumber,
        booking.email,
        booking.sourceSegmentId,
        booking.createdAt.toISOString(),
        booking.updatedAt.toISOString(),
      ],
    );
  }

  async remove(tenantId: string, bookingId: string): Promise<void> {
    await this.db.query(
      'DELETE FROM booking_reconciliation.hotel_bookings WHERE tenant_id = $1 AND booking_id = $2',
      [tenantId, bookingId],
    );
  }

  private toEntity(_row: Record<string, unknown>): HotelBooking {
    // In production, map row to HotelBooking.create()
    return undefined as unknown as HotelBooking;
  }
}

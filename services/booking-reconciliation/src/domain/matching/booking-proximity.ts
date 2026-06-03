/**
 * Booking proximity rule.
 * BR-208: Booking Proximity (+10) — hotel booked within 30 days of trip creation/booking.
 */

import type { MatchReason } from '../types.js';

const PROXIMITY_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface BookingProximityInput {
  hotelBookingDate: Date;
  tripCreatedDate: Date;
}

export function evaluateBookingProximity(input: BookingProximityInput): MatchReason[] {
  const reasons: MatchReason[] = [];

  const diff = Math.abs(input.hotelBookingDate.getTime() - input.tripCreatedDate.getTime());

  // BR-208: Booking Proximity — within 30 days
  if (diff <= PROXIMITY_WINDOW_MS) {
    reasons.push({
      ruleId: 'BR-208',
      ruleName: 'Booking Proximity',
      reasonCode: 'BOOKING_PROXIMITY',
      score: 10,
    });
  }

  return reasons;
}

/**
 * Traveller matching rules.
 * BR-201: Exact Traveller Match (+50)
 * BR-202: Employee Number Match (+40)
 * BR-203: Email Match (+30)
 */

import type { MatchReason } from '../types.js';

export interface TravellerMatchInput {
  bookingTravellerId: string;
  tripTravellerId: string;
  bookingEmployeeNumber: string | null;
  tripEmployeeNumber: string | null;
  bookingEmail: string | null;
  tripEmail: string | null;
}

export function evaluateTravellerMatch(input: TravellerMatchInput): MatchReason[] {
  const reasons: MatchReason[] = [];

  // BR-201: Exact Traveller ID Match
  if (
    input.bookingTravellerId &&
    input.tripTravellerId &&
    input.bookingTravellerId === input.tripTravellerId
  ) {
    reasons.push({
      ruleId: 'BR-201',
      ruleName: 'Exact Traveller Match',
      reasonCode: 'TRAVELLER_MATCH',
      score: 50,
    });
  }

  // BR-202: Employee Number Match
  if (
    input.bookingEmployeeNumber &&
    input.tripEmployeeNumber &&
    input.bookingEmployeeNumber === input.tripEmployeeNumber
  ) {
    reasons.push({
      ruleId: 'BR-202',
      ruleName: 'Employee Number Match',
      reasonCode: 'EMPLOYEE_NUMBER_MATCH',
      score: 40,
    });
  }

  // BR-203: Email Match (case-insensitive)
  if (
    input.bookingEmail &&
    input.tripEmail &&
    input.bookingEmail.toLowerCase() === input.tripEmail.toLowerCase()
  ) {
    reasons.push({
      ruleId: 'BR-203',
      ruleName: 'Email Match',
      reasonCode: 'EMAIL_MATCH',
      score: 30,
    });
  }

  return reasons;
}

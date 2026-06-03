/**
 * Destination matching rules.
 * BR-204: Destination City Match (+15)
 * BR-205: Country Match (+10)
 */

import type { MatchReason } from '../types.js';

export interface DestinationMatchInput {
  hotelCity: string;
  tripDestinationCity: string;
  hotelCountry: string;
  tripDestinationCountry: string;
}

export function evaluateDestinationMatch(input: DestinationMatchInput): MatchReason[] {
  const reasons: MatchReason[] = [];

  // BR-204: Destination City Match (case-insensitive)
  if (
    input.hotelCity &&
    input.tripDestinationCity &&
    input.hotelCity.toLowerCase() === input.tripDestinationCity.toLowerCase()
  ) {
    reasons.push({
      ruleId: 'BR-204',
      ruleName: 'Destination City Match',
      reasonCode: 'DESTINATION_MATCH',
      score: 15,
    });
  }

  // BR-205: Country Match (case-insensitive)
  if (
    input.hotelCountry &&
    input.tripDestinationCountry &&
    input.hotelCountry.toLowerCase() === input.tripDestinationCountry.toLowerCase()
  ) {
    reasons.push({
      ruleId: 'BR-205',
      ruleName: 'Country Match',
      reasonCode: 'COUNTRY_MATCH',
      score: 10,
    });
  }

  return reasons;
}

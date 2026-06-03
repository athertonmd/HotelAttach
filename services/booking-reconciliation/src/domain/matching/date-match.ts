/**
 * Date matching rules.
 * BR-206: Date Overlap (+25)
 * BR-207: Full Night Coverage (+20)
 */

import { DateRange } from '../value-objects.js';
import type { MatchReason } from '../types.js';

export interface DateMatchInput {
  hotelStayRange: DateRange;
  tripRange: DateRange;
}

export function evaluateDateMatch(input: DateMatchInput): MatchReason[] {
  const reasons: MatchReason[] = [];

  // BR-206: Date Overlap — hotel dates fall inside or overlap trip dates
  if (input.hotelStayRange.overlaps(input.tripRange)) {
    reasons.push({
      ruleId: 'BR-206',
      ruleName: 'Date Overlap',
      reasonCode: 'DATE_OVERLAP',
      score: 25,
    });
  }

  // BR-207: Full Night Coverage — hotel covers the entire trip range
  const tripNights = input.tripRange.nights;
  const overlapNights = input.hotelStayRange.overlapNights(input.tripRange);
  if (tripNights > 0 && overlapNights >= tripNights) {
    reasons.push({
      ruleId: 'BR-207',
      ruleName: 'Full Night Coverage',
      reasonCode: 'FULL_NIGHT_COVERAGE',
      score: 20,
    });
  }

  return reasons;
}

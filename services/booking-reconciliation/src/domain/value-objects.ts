/**
 * Booking Reconciliation value objects.
 * Source: Project 2 Specification §Matching Inputs, §Confidence Thresholds
 */

/** Represents a date range with validation */
export class DateRange {
  readonly start: Date;
  readonly end: Date;

  constructor(start: Date, end: Date) {
    if (end <= start) {
      throw new Error('DateRange: end must be after start');
    }
    this.start = start;
    this.end = end;
  }

  /** Number of nights in this range */
  get nights(): number {
    const ms = this.end.getTime() - this.start.getTime();
    return Math.ceil(ms / (1000 * 60 * 60 * 24));
  }

  /** Check if another date range overlaps this one */
  overlaps(other: DateRange): boolean {
    return this.start < other.end && other.start < this.end;
  }

  /** Calculate overlap nights with another range */
  overlapNights(other: DateRange): number {
    const overlapStart = new Date(Math.max(this.start.getTime(), other.start.getTime()));
    const overlapEnd = new Date(Math.min(this.end.getTime(), other.end.getTime()));
    if (overlapEnd <= overlapStart) return 0;
    return Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24));
  }
}

/** Confidence score with 0–100 validation */
export class ConfidenceScore {
  readonly value: number;

  constructor(value: number) {
    if (value < 0 || value > 100) {
      throw new Error('ConfidenceScore must be between 0 and 100');
    }
    this.value = Math.round(value);
  }

  /** Add points (capped at 100) */
  add(points: number): ConfidenceScore {
    return new ConfidenceScore(Math.min(100, this.value + points));
  }
}

/** Location match result */
export interface LocationMatch {
  cityMatch: boolean;
  countryMatch: boolean;
  hotelCity: string;
  tripCity: string;
  hotelCountry: string;
  tripCountry: string;
}

/** Traveller match result */
export interface TravellerMatch {
  travellerIdMatch: boolean;
  employeeNumberMatch: boolean;
  emailMatch: boolean;
}

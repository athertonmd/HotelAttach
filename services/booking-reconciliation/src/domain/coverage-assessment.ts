/**
 * CoverageAssessment domain entity.
 * Calculates accommodation coverage for a trip.
 * Source: Business Rules Catalogue BR-301 to BR-305
 */

import type { CoverageStatus } from './enums.js';

export interface CreateCoverageAssessmentInput {
  tenantId: string;
  tripId: string;
  totalNightsRequired: number;
  nightsCovered: number;
  matchedBookingIds: string[];
  previousCoveragePercent?: number | null;
}

/**
 * Derives coverage status from percentage per BR-301–BR-305.
 */
function deriveCoverageStatus(percent: number): CoverageStatus {
  if (percent >= 100) return 'fully_covered'; // BR-301
  if (percent >= 80) return 'mostly_covered'; // BR-302
  if (percent >= 50) return 'partially_covered'; // BR-303
  if (percent >= 1) return 'minimally_covered'; // BR-304
  return 'no_accommodation'; // BR-305
}

export class CoverageAssessment {
  readonly tenantId: string;
  readonly tripId: string;
  readonly totalNightsRequired: number;
  readonly nightsCovered: number;
  readonly coveragePercent: number;
  readonly coverageStatus: CoverageStatus;
  readonly matchedBookingIds: string[];
  readonly calculatedAt: Date;
  readonly previousCoveragePercent: number | null;

  private constructor(
    input: CreateCoverageAssessmentInput,
    percent: number,
    status: CoverageStatus,
    now: Date,
  ) {
    this.tenantId = input.tenantId;
    this.tripId = input.tripId;
    this.totalNightsRequired = input.totalNightsRequired;
    this.nightsCovered = input.nightsCovered;
    this.coveragePercent = percent;
    this.coverageStatus = status;
    this.matchedBookingIds = input.matchedBookingIds;
    this.calculatedAt = now;
    this.previousCoveragePercent = input.previousCoveragePercent ?? null;
  }

  static create(input: CreateCoverageAssessmentInput): CoverageAssessment {
    if (!input.tenantId) throw new Error('tenantId is required');
    if (!input.tripId) throw new Error('tripId is required');
    if (input.totalNightsRequired < 0) throw new Error('totalNightsRequired must be >= 0');
    if (input.nightsCovered < 0) throw new Error('nightsCovered must be >= 0');
    if (input.totalNightsRequired > 0 && input.nightsCovered > input.totalNightsRequired) {
      throw new Error('nightsCovered cannot exceed totalNightsRequired');
    }

    const percent =
      input.totalNightsRequired === 0
        ? 0
        : Math.round((input.nightsCovered / input.totalNightsRequired) * 100);
    const status = deriveCoverageStatus(percent);

    return new CoverageAssessment(input, percent, status, new Date());
  }
}

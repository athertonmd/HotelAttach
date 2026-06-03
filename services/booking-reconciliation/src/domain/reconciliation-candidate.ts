/**
 * ReconciliationCandidate domain entity.
 * Represents a candidate trip that a hotel booking may belong to.
 * Source: Project 2 Specification §Matching Inputs — Trip Information
 */

import { DateRange } from './value-objects.js';
import type { ReconciliationSource } from './enums.js';

export interface CreateReconciliationCandidateInput {
  tenantId: string;
  bookingId: string;
  travellerId: string;
  candidateTripId: string;
  tripStartDate: Date;
  tripEndDate: Date;
  tripDestinationCity: string;
  tripDestinationCountry: string;
  candidateSource: ReconciliationSource;
}

export class ReconciliationCandidate {
  readonly tenantId: string;
  readonly bookingId: string;
  readonly travellerId: string;
  readonly candidateTripId: string;
  readonly tripStartDate: Date;
  readonly tripEndDate: Date;
  readonly tripDestinationCity: string;
  readonly tripDestinationCountry: string;
  readonly candidateSource: ReconciliationSource;
  readonly tripRange: DateRange;
  readonly createdAt: Date;

  private constructor(input: CreateReconciliationCandidateInput, now: Date) {
    this.tenantId = input.tenantId;
    this.bookingId = input.bookingId;
    this.travellerId = input.travellerId;
    this.candidateTripId = input.candidateTripId;
    this.tripStartDate = input.tripStartDate;
    this.tripEndDate = input.tripEndDate;
    this.tripDestinationCity = input.tripDestinationCity;
    this.tripDestinationCountry = input.tripDestinationCountry;
    this.candidateSource = input.candidateSource;
    this.tripRange = new DateRange(input.tripStartDate, input.tripEndDate);
    this.createdAt = now;
  }

  static create(input: CreateReconciliationCandidateInput): ReconciliationCandidate {
    if (!input.tenantId) throw new Error('tenantId is required');
    if (!input.bookingId) throw new Error('bookingId is required');
    if (!input.travellerId) throw new Error('travellerId is required');
    if (!input.candidateTripId) throw new Error('candidateTripId is required');
    // DateRange constructor validates tripStartDate < tripEndDate

    return new ReconciliationCandidate(input, new Date());
  }
}

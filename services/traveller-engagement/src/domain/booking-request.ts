/**
 * BookingRequest — tracks a hotel booking request triggered by traveller engagement.
 */

import { randomUUID } from 'node:crypto';
import type { BookingRequestStatus } from './enums.js';

export interface CreateBookingRequestInput {
  opportunityId: string;
  tenantId: string;
  corporateId: string;
  travellerId: string;
  tripId: string;
  destinationCity?: string | null;
  destinationCountry?: string | null;
  requestedNights?: number | null;
}

export class BookingRequest {
  readonly requestId: string;
  readonly opportunityId: string;
  readonly tenantId: string;
  readonly corporateId: string;
  readonly travellerId: string;
  readonly tripId: string;
  readonly requestedAt: Date;
  readonly destinationCity: string | null;
  readonly destinationCountry: string | null;
  readonly requestedNights: number | null;

  private _status: BookingRequestStatus;
  private _updatedAt: Date;

  get status(): BookingRequestStatus {
    return this._status;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  private constructor(input: CreateBookingRequestInput, now: Date) {
    this.requestId = randomUUID();
    this.opportunityId = input.opportunityId;
    this.tenantId = input.tenantId;
    this.corporateId = input.corporateId;
    this.travellerId = input.travellerId;
    this.tripId = input.tripId;
    this.requestedAt = now;
    this.destinationCity = input.destinationCity ?? null;
    this.destinationCountry = input.destinationCountry ?? null;
    this.requestedNights = input.requestedNights ?? null;

    this._status = 'created';
    this._updatedAt = now;
  }

  static create(input: CreateBookingRequestInput): BookingRequest {
    if (!input.tenantId) throw new Error('tenantId is required');
    if (!input.opportunityId) throw new Error('opportunityId is required');
    if (!input.corporateId) throw new Error('corporateId is required');
    if (!input.travellerId) throw new Error('travellerId is required');
    if (!input.tripId) throw new Error('tripId is required');

    return new BookingRequest(input, new Date());
  }

  /** created → assigned */
  assign(): void {
    this.assertTransition('created', 'assigned');
    this._status = 'assigned';
    this._updatedAt = new Date();
  }

  /** assigned → processing */
  process(): void {
    this.assertTransition('assigned', 'processing');
    this._status = 'processing';
    this._updatedAt = new Date();
  }

  /** processing → completed */
  complete(): void {
    this.assertTransition('processing', 'completed');
    this._status = 'completed';
    this._updatedAt = new Date();
  }

  /** processing → failed */
  fail(): void {
    this.assertTransition('processing', 'failed');
    this._status = 'failed';
    this._updatedAt = new Date();
  }

  /** any non-terminal → cancelled */
  cancel(): void {
    if (this.isTerminal()) {
      throw new Error(`Cannot cancel from terminal state: ${this._status}`);
    }
    this._status = 'cancelled';
    this._updatedAt = new Date();
  }

  private isTerminal(): boolean {
    return (
      this._status === 'completed' || this._status === 'failed' || this._status === 'cancelled'
    );
  }

  private assertTransition(expectedFrom: BookingRequestStatus, to: BookingRequestStatus): void {
    if (this._status !== expectedFrom) {
      throw new Error(`Cannot transition from ${this._status} to ${to}`);
    }
  }
}

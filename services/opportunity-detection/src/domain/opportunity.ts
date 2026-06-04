/**
 * Opportunity — Aggregate Root
 * Source: Approved Project 3 Domain Entities
 */

import { randomUUID } from 'node:crypto';
import type {
  OpportunityType,
  LifecycleState,
  Priority,
  ClosureReason,
  RejectionReason,
  SuppressionReason,
} from './enums.js';
import { derivePriority, TERMINAL_STATES } from './enums.js';

export interface CreateOpportunityInput {
  tenantId: string;
  corporateId: string;
  travellerId: string;
  tripId: string;
  opportunityType: OpportunityType;
  score: number;
  triggeringEventId?: string | null;
  triggeringEventType?: string | null;
  correlationId?: string;
  destinationCity?: string | null;
  destinationCountry?: string | null;
  departureDate?: Date | null;
  estimatedRoomNights?: number | null;
  estimatedSpend?: number | null;
  estimatedCommission?: number | null;
}

export class Opportunity {
  readonly opportunityId: string;
  readonly tenantId: string;
  readonly corporateId: string;
  readonly travellerId: string;
  readonly tripId: string;
  readonly opportunityType: OpportunityType;
  readonly correlationId: string;
  readonly triggeringEventId: string | null;
  readonly triggeringEventType: string | null;
  readonly detectedAt: Date;
  readonly destinationCity: string | null;
  readonly destinationCountry: string | null;
  readonly departureDate: Date | null;
  readonly estimatedRoomNights: number | null;
  readonly estimatedSpend: number | null;
  readonly estimatedCommission: number | null;
  readonly createdAt: Date;

  private _lifecycleState: LifecycleState;
  private _score: number;
  private _priority: Priority;
  private _closureReason: ClosureReason | null;
  private _rejectionReason: RejectionReason | null;
  private _primarySuppressionReason: SuppressionReason | null;
  private _suppressedUntil: Date | null;
  private _reopenCount: number;
  private _version: number;
  private _updatedAt: Date;
  private _qualifiedAt: Date | null;
  private _closedAt: Date | null;
  private _expiresAt: Date | null;

  get lifecycleState(): LifecycleState {
    return this._lifecycleState;
  }
  get score(): number {
    return this._score;
  }
  get priority(): Priority {
    return this._priority;
  }
  get closureReason(): ClosureReason | null {
    return this._closureReason;
  }
  get rejectionReason(): RejectionReason | null {
    return this._rejectionReason;
  }
  get primarySuppressionReason(): SuppressionReason | null {
    return this._primarySuppressionReason;
  }
  get suppressedUntil(): Date | null {
    return this._suppressedUntil;
  }
  get reopenCount(): number {
    return this._reopenCount;
  }
  get version(): number {
    return this._version;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }
  get qualifiedAt(): Date | null {
    return this._qualifiedAt;
  }
  get closedAt(): Date | null {
    return this._closedAt;
  }
  get expiresAt(): Date | null {
    return this._expiresAt;
  }

  get isTerminal(): boolean {
    return TERMINAL_STATES.includes(this._lifecycleState);
  }

  private constructor(input: CreateOpportunityInput, now: Date) {
    this.opportunityId = randomUUID();
    this.tenantId = input.tenantId;
    this.corporateId = input.corporateId;
    this.travellerId = input.travellerId;
    this.tripId = input.tripId;
    this.opportunityType = input.opportunityType;
    this.correlationId = input.correlationId ?? randomUUID();
    this.triggeringEventId = input.triggeringEventId ?? null;
    this.triggeringEventType = input.triggeringEventType ?? null;
    this.detectedAt = now;
    this.destinationCity = input.destinationCity ?? null;
    this.destinationCountry = input.destinationCountry ?? null;
    this.departureDate = input.departureDate ?? null;
    this.estimatedRoomNights = input.estimatedRoomNights ?? null;
    this.estimatedSpend = input.estimatedSpend ?? null;
    this.estimatedCommission = input.estimatedCommission ?? null;
    this.createdAt = now;

    this._lifecycleState = 'detected';
    this._score = input.score;
    this._priority = derivePriority(input.score);
    this._closureReason = null;
    this._rejectionReason = null;
    this._primarySuppressionReason = null;
    this._suppressedUntil = null;
    this._reopenCount = 0;
    this._version = 1;
    this._updatedAt = now;
    this._qualifiedAt = null;
    this._closedAt = null;
    this._expiresAt = input.departureDate ?? null;
  }

  static create(input: CreateOpportunityInput): Opportunity {
    if (!input.tenantId) throw new Error('tenantId is required');
    if (!input.corporateId) throw new Error('corporateId is required');
    if (!input.travellerId) throw new Error('travellerId is required');
    if (!input.tripId) throw new Error('tripId is required');
    if (!input.opportunityType) throw new Error('opportunityType is required');
    if (input.score < 0 || input.score > 100) {
      throw new Error('score must be between 0 and 100');
    }
    if (input.estimatedRoomNights !== undefined && input.estimatedRoomNights !== null) {
      if (input.estimatedRoomNights < 1) throw new Error('estimatedRoomNights must be at least 1');
    }
    if (input.estimatedSpend !== undefined && input.estimatedSpend !== null) {
      if (input.estimatedSpend < 0) throw new Error('estimatedSpend must be >= 0');
    }

    return new Opportunity(input, new Date());
  }

  /** Transition to qualified state */
  qualify(): void {
    if (this._lifecycleState !== 'detected') {
      throw new Error(`Cannot qualify from state: ${this._lifecycleState}`);
    }
    this._lifecycleState = 'qualified';
    this._qualifiedAt = new Date();
    this._updatedAt = new Date();
    this._version++;
  }

  /** Transition to suppressed state */
  suppress(reason: SuppressionReason, until?: Date): void {
    if (this.isTerminal) {
      throw new Error(`Cannot suppress from terminal state: ${this._lifecycleState}`);
    }
    this._lifecycleState = 'suppressed';
    this._primarySuppressionReason = reason;
    this._suppressedUntil = until ?? null;
    this._updatedAt = new Date();
    this._version++;
  }

  /** Transition to awaiting_action state */
  awaitAction(): void {
    if (this._lifecycleState !== 'qualified') {
      throw new Error(`Cannot await action from state: ${this._lifecycleState}`);
    }
    this._lifecycleState = 'awaiting_action';
    this._updatedAt = new Date();
    this._version++;
  }

  /** Transition to active state */
  activate(): void {
    if (
      this._lifecycleState !== 'qualified' &&
      this._lifecycleState !== 'awaiting_action' &&
      this._lifecycleState !== 'suppressed'
    ) {
      throw new Error(`Cannot activate from state: ${this._lifecycleState}`);
    }
    this._lifecycleState = 'active';
    this._primarySuppressionReason = null;
    this._suppressedUntil = null;
    this._updatedAt = new Date();
    this._version++;
  }

  /** Transition to communicated state */
  markCommunicated(): void {
    if (this._lifecycleState !== 'active') {
      throw new Error(`Cannot mark communicated from state: ${this._lifecycleState}`);
    }
    this._lifecycleState = 'communicated';
    this._updatedAt = new Date();
    this._version++;
  }

  /** Transition to converted state */
  convert(): void {
    if (this._lifecycleState !== 'communicated') {
      throw new Error(`Cannot convert from state: ${this._lifecycleState}`);
    }
    this._lifecycleState = 'converted';
    this._updatedAt = new Date();
    this._version++;
  }

  /** Transition to fulfilled state */
  fulfil(): void {
    if (this._lifecycleState !== 'converted') {
      throw new Error(`Cannot fulfil from state: ${this._lifecycleState}`);
    }
    this._lifecycleState = 'fulfilled';
    this._updatedAt = new Date();
    this._version++;
  }

  /** Close the opportunity */
  close(reason: ClosureReason): void {
    if (this.isTerminal) {
      throw new Error(`Cannot close from terminal state: ${this._lifecycleState}`);
    }
    this._lifecycleState = 'closed';
    this._closureReason = reason;
    this._closedAt = new Date();
    this._updatedAt = new Date();
    this._version++;
  }

  /** Reject the opportunity */
  reject(reason: RejectionReason): void {
    if (this.isTerminal) {
      throw new Error(`Cannot reject from terminal state: ${this._lifecycleState}`);
    }
    this._lifecycleState = 'rejected';
    this._rejectionReason = reason;
    this._closedAt = new Date();
    this._updatedAt = new Date();
    this._version++;
  }

  /** Expire the opportunity */
  expire(): void {
    if (this.isTerminal) {
      throw new Error(`Cannot expire from terminal state: ${this._lifecycleState}`);
    }
    this._lifecycleState = 'expired';
    this._closureReason = 'expired';
    this._closedAt = new Date();
    this._updatedAt = new Date();
    this._version++;
  }

  /** Cancel the opportunity */
  cancel(): void {
    if (this.isTerminal) {
      throw new Error(`Cannot cancel from terminal state: ${this._lifecycleState}`);
    }
    this._lifecycleState = 'cancelled';
    this._closureReason = 'trip_cancelled';
    this._closedAt = new Date();
    this._updatedAt = new Date();
    this._version++;
  }

  /** Update score and priority */
  updateScore(newScore: number): void {
    if (newScore < 0 || newScore > 100) {
      throw new Error('score must be between 0 and 100');
    }
    this._score = newScore;
    this._priority = derivePriority(newScore);
    this._updatedAt = new Date();
    this._version++;
  }

  /** Reopen from a terminal state */
  reopen(): void {
    if (!this.isTerminal) {
      throw new Error(`Cannot reopen from non-terminal state: ${this._lifecycleState}`);
    }
    if (this._lifecycleState === 'expired') {
      throw new Error('Cannot reopen expired opportunities');
    }
    this._lifecycleState = 'detected';
    this._closureReason = null;
    this._rejectionReason = null;
    this._closedAt = null;
    this._reopenCount++;
    this._updatedAt = new Date();
    this._version++;
  }
}

/**
 * Communication — Aggregate Root
 * Manages the lifecycle of a single communication to a traveller.
 */

import { randomUUID } from 'node:crypto';
import type { CommunicationType, CommunicationChannel, CommunicationStatus } from './enums.js';
import { ACTIVE_COMMUNICATION_STATES, MAX_RETRY_COUNT } from './enums.js';

export interface CreateCommunicationInput {
  tenantId: string;
  corporateId: string;
  travellerId: string;
  opportunityId: string;
  communicationType: CommunicationType;
  channel: CommunicationChannel;
  correlationId?: string;
}

export class Communication {
  readonly communicationId: string;
  readonly tenantId: string;
  readonly corporateId: string;
  readonly travellerId: string;
  readonly opportunityId: string;
  readonly communicationType: CommunicationType;
  readonly channel: CommunicationChannel;
  readonly correlationId: string;
  readonly createdAt: Date;

  private _status: CommunicationStatus;
  private _scheduledAt: Date | null;
  private _sentAt: Date | null;
  private _retryCount: number;
  private _updatedAt: Date;

  get status(): CommunicationStatus {
    return this._status;
  }
  get scheduledAt(): Date | null {
    return this._scheduledAt;
  }
  get sentAt(): Date | null {
    return this._sentAt;
  }
  get retryCount(): number {
    return this._retryCount;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  private constructor(input: CreateCommunicationInput, now: Date) {
    this.communicationId = randomUUID();
    this.tenantId = input.tenantId;
    this.corporateId = input.corporateId;
    this.travellerId = input.travellerId;
    this.opportunityId = input.opportunityId;
    this.communicationType = input.communicationType;
    this.channel = input.channel;
    this.correlationId = input.correlationId ?? randomUUID();
    this.createdAt = now;

    this._status = 'pending';
    this._scheduledAt = null;
    this._sentAt = null;
    this._retryCount = 0;
    this._updatedAt = now;
  }

  static create(input: CreateCommunicationInput): Communication {
    if (!input.tenantId) throw new Error('tenantId is required');
    if (!input.corporateId) throw new Error('corporateId is required');
    if (!input.travellerId) throw new Error('travellerId is required');
    if (!input.opportunityId) throw new Error('opportunityId is required');

    return new Communication(input, new Date());
  }

  /** pending → scheduled */
  schedule(scheduledAt: Date): void {
    this.assertTransition('pending', 'scheduled');
    this._status = 'scheduled';
    this._scheduledAt = scheduledAt;
    this._updatedAt = new Date();
  }

  /** scheduled → sent (or pending → sent for immediate dispatch) */
  send(): void {
    if (this._status !== 'scheduled' && this._status !== 'pending') {
      throw new Error(`Cannot send from state: ${this._status}`);
    }
    this._status = 'sent';
    this._sentAt = new Date();
    this._updatedAt = new Date();
  }

  /** sent → opened */
  markOpened(): void {
    this.assertTransition('sent', 'opened');
    this._status = 'opened';
    this._updatedAt = new Date();
  }

  /** opened → clicked */
  markClicked(): void {
    this.assertTransition('opened', 'clicked');
    this._status = 'clicked';
    this._updatedAt = new Date();
  }

  /** sent/opened/clicked → responded */
  markResponded(): void {
    if (this._status !== 'sent' && this._status !== 'opened' && this._status !== 'clicked') {
      throw new Error(`Cannot mark responded from state: ${this._status}`);
    }
    this._status = 'responded';
    this._updatedAt = new Date();
  }

  /** sent → bounced (increments retryCount) */
  markBounced(): void {
    this.assertTransition('sent', 'bounced');
    this._status = 'bounced';
    this._retryCount++;
    this._updatedAt = new Date();
  }

  /** any active → cancelled */
  cancel(): void {
    if (!this.isActive()) {
      throw new Error(`Cannot cancel from state: ${this._status}`);
    }
    this._status = 'cancelled';
    this._updatedAt = new Date();
  }

  /** any active → suppressed */
  suppress(): void {
    if (!this.isActive()) {
      throw new Error(`Cannot suppress from state: ${this._status}`);
    }
    this._status = 'suppressed';
    this._updatedAt = new Date();
  }

  /** suppressed → scheduled */
  unsuppress(): void {
    this.assertTransition('suppressed', 'scheduled');
    this._status = 'scheduled';
    this._updatedAt = new Date();
  }

  /** Whether the communication can be retried */
  canRetry(): boolean {
    return this._retryCount < MAX_RETRY_COUNT;
  }

  /** Whether the communication needs agent escalation */
  needsEscalation(): boolean {
    return this._status === 'bounced' && this._retryCount >= MAX_RETRY_COUNT;
  }

  private isActive(): boolean {
    return ACTIVE_COMMUNICATION_STATES.includes(this._status);
  }

  private assertTransition(expectedFrom: CommunicationStatus, _to: CommunicationStatus): void {
    if (this._status !== expectedFrom) {
      throw new Error(`Cannot transition from ${this._status} to ${_to}`);
    }
  }
}

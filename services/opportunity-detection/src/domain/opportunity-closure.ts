/**
 * OpportunityClosure — mostly immutable (invalidatedAt updates on reopen).
 * Source: Approved Project 3 Domain Entities
 */

import { randomUUID } from 'node:crypto';
import type { LifecycleState, ClosureReason, RejectionReason, ActorType } from './enums.js';

export interface CreateClosureInput {
  opportunityId: string;
  tenantId: string;
  terminalState: 'closed' | 'rejected' | 'expired' | 'cancelled';
  closureReason?: ClosureReason | null;
  rejectionReason?: RejectionReason | null;
  correlationId: string;
  causationId?: string;
  actorId?: string | null;
  actorType?: ActorType | null;
  notes?: string | null;
}

export class OpportunityClosure {
  readonly closureId: string;
  readonly opportunityId: string;
  readonly tenantId: string;
  readonly terminalState: LifecycleState;
  readonly closureReason: ClosureReason | null;
  readonly rejectionReason: RejectionReason | null;
  readonly closedAt: Date;
  readonly correlationId: string;
  readonly causationId: string;
  readonly actorId: string | null;
  readonly actorType: ActorType | null;
  readonly notes: string | null;

  private _invalidatedAt: Date | null;
  private _invalidationEventId: string | null;

  get invalidatedAt(): Date | null {
    return this._invalidatedAt;
  }
  get invalidationEventId(): string | null {
    return this._invalidationEventId;
  }

  private constructor(input: CreateClosureInput, now: Date) {
    this.closureId = randomUUID();
    this.opportunityId = input.opportunityId;
    this.tenantId = input.tenantId;
    this.terminalState = input.terminalState;
    this.closureReason = input.closureReason ?? null;
    this.rejectionReason = input.rejectionReason ?? null;
    this.closedAt = now;
    this.correlationId = input.correlationId;
    this.causationId = input.causationId ?? randomUUID();
    this.actorId = input.actorId ?? null;
    this.actorType = input.actorType ?? null;
    this.notes = input.notes ?? null;
    this._invalidatedAt = null;
    this._invalidationEventId = null;
  }

  static create(input: CreateClosureInput): OpportunityClosure {
    if (!input.opportunityId) throw new Error('opportunityId is required');
    if (!input.tenantId) throw new Error('tenantId is required');
    if (!input.terminalState) throw new Error('terminalState is required');
    if (!input.correlationId) throw new Error('correlationId is required');

    if (input.terminalState === 'rejected' && !input.rejectionReason) {
      throw new Error('rejectionReason is required for rejected state');
    }
    if (input.terminalState === 'closed' && !input.closureReason) {
      throw new Error('closureReason is required for closed state');
    }

    return new OpportunityClosure(input, new Date());
  }

  /** Invalidate this closure (opportunity is being reopened) */
  invalidate(eventId: string): void {
    if (this._invalidatedAt) {
      throw new Error('Closure already invalidated');
    }
    this._invalidatedAt = new Date();
    this._invalidationEventId = eventId;
  }
}

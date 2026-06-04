/**
 * OpportunitySuppression — mutable (active → resolved).
 * Multiple active suppressions allowed per opportunity.
 * Source: Approved Project 3 Domain Entities + Suppression Refinements
 */

import { randomUUID } from 'node:crypto';
import type { SuppressionReason } from './enums.js';
import { SUPPRESSION_PRIORITY } from './enums.js';

export interface CreateSuppressionInput {
  opportunityId: string;
  tenantId: string;
  suppressionReason: SuppressionReason;
  suppressedUntil?: Date | null;
  actorId?: string | null;
}

export class OpportunitySuppression {
  readonly suppressionId: string;
  readonly opportunityId: string;
  readonly tenantId: string;
  readonly suppressionReason: SuppressionReason;
  readonly suppressionPriority: number;
  readonly suppressedAt: Date;
  readonly suppressedUntil: Date | null;
  readonly actorId: string | null;

  private _isActive: boolean;
  private _resolvedAt: Date | null;
  private _resolutionTrigger: string | null;

  get isActive(): boolean {
    return this._isActive;
  }
  get resolvedAt(): Date | null {
    return this._resolvedAt;
  }
  get resolutionTrigger(): string | null {
    return this._resolutionTrigger;
  }

  private constructor(input: CreateSuppressionInput, now: Date) {
    this.suppressionId = randomUUID();
    this.opportunityId = input.opportunityId;
    this.tenantId = input.tenantId;
    this.suppressionReason = input.suppressionReason;
    this.suppressionPriority = SUPPRESSION_PRIORITY[input.suppressionReason];
    this.suppressedAt = now;
    this.suppressedUntil = input.suppressedUntil ?? null;
    this.actorId = input.actorId ?? null;
    this._isActive = true;
    this._resolvedAt = null;
    this._resolutionTrigger = null;
  }

  static create(input: CreateSuppressionInput): OpportunitySuppression {
    if (!input.opportunityId) throw new Error('opportunityId is required');
    if (!input.tenantId) throw new Error('tenantId is required');
    if (!input.suppressionReason) throw new Error('suppressionReason is required');

    return new OpportunitySuppression(input, new Date());
  }

  /** Resolve this suppression */
  resolve(trigger: string): void {
    if (!this._isActive) {
      throw new Error('Suppression is already resolved');
    }
    this._isActive = false;
    this._resolvedAt = new Date();
    this._resolutionTrigger = trigger;
  }

  /** Check if suppression has expired based on time */
  isExpired(now: Date = new Date()): boolean {
    if (!this.suppressedUntil) return false;
    return now >= this.suppressedUntil;
  }
}

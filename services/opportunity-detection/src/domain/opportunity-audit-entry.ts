/**
 * OpportunityAuditEntry — immutable, append-only.
 * BR-1104 compliance: every significant decision is fully traceable.
 * Source: Approved Project 3 Domain Entities
 */

import { randomUUID } from 'node:crypto';
import type { ActorType } from './enums.js';

export interface CreateAuditEntryInput {
  opportunityId: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  action: string;
  actorType: ActorType;
  correlationId: string;
  actorId?: string | null;
  previousValue?: unknown;
  newValue?: unknown;
  ruleId?: string | null;
  reason?: string | null;
}

export class OpportunityAuditEntry {
  readonly auditId: string;
  readonly opportunityId: string;
  readonly tenantId: string;
  readonly entityType: string;
  readonly entityId: string;
  readonly action: string;
  readonly actorType: ActorType;
  readonly correlationId: string;
  readonly createdAt: Date;
  readonly actorId: string | null;
  readonly previousValue: unknown;
  readonly newValue: unknown;
  readonly ruleId: string | null;
  readonly reason: string | null;

  private constructor(input: CreateAuditEntryInput, now: Date) {
    this.auditId = randomUUID();
    this.opportunityId = input.opportunityId;
    this.tenantId = input.tenantId;
    this.entityType = input.entityType;
    this.entityId = input.entityId;
    this.action = input.action;
    this.actorType = input.actorType;
    this.correlationId = input.correlationId;
    this.createdAt = now;
    this.actorId = input.actorId ?? null;
    this.previousValue = input.previousValue ?? null;
    this.newValue = input.newValue ?? null;
    this.ruleId = input.ruleId ?? null;
    this.reason = input.reason ?? null;
  }

  static create(input: CreateAuditEntryInput): OpportunityAuditEntry {
    if (!input.opportunityId) throw new Error('opportunityId is required');
    if (!input.tenantId) throw new Error('tenantId is required');
    if (!input.entityType) throw new Error('entityType is required');
    if (!input.entityId) throw new Error('entityId is required');
    if (!input.action) throw new Error('action is required');
    if (!input.actorType) throw new Error('actorType is required');
    if (!input.correlationId) throw new Error('correlationId is required');

    return new OpportunityAuditEntry(input, new Date());
  }
}

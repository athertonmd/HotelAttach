/**
 * OpportunityAction — immutable, append-only state transition record.
 * Source: Approved Project 3 Domain Entities
 */

import { randomUUID } from 'node:crypto';
import type { LifecycleState, ActorType, ActionTriggerSource } from './enums.js';

export interface CreateActionInput {
  opportunityId: string;
  tenantId: string;
  fromState: LifecycleState;
  toState: LifecycleState;
  trigger: string;
  triggerSource: ActionTriggerSource;
  correlationId: string;
  causationId?: string;
  actorId?: string | null;
  actorType?: ActorType | null;
  reason?: string | null;
}

export class OpportunityAction {
  readonly actionId: string;
  readonly opportunityId: string;
  readonly tenantId: string;
  readonly fromState: LifecycleState;
  readonly toState: LifecycleState;
  readonly trigger: string;
  readonly triggerSource: ActionTriggerSource;
  readonly correlationId: string;
  readonly causationId: string;
  readonly occurredAt: Date;
  readonly actorId: string | null;
  readonly actorType: ActorType | null;
  readonly reason: string | null;

  private constructor(input: CreateActionInput, now: Date) {
    this.actionId = randomUUID();
    this.opportunityId = input.opportunityId;
    this.tenantId = input.tenantId;
    this.fromState = input.fromState;
    this.toState = input.toState;
    this.trigger = input.trigger;
    this.triggerSource = input.triggerSource;
    this.correlationId = input.correlationId;
    this.causationId = input.causationId ?? randomUUID();
    this.occurredAt = now;
    this.actorId = input.actorId ?? null;
    this.actorType = input.actorType ?? null;
    this.reason = input.reason ?? null;
  }

  static create(input: CreateActionInput): OpportunityAction {
    if (!input.opportunityId) throw new Error('opportunityId is required');
    if (!input.tenantId) throw new Error('tenantId is required');
    if (!input.fromState) throw new Error('fromState is required');
    if (!input.toState) throw new Error('toState is required');
    if (!input.trigger) throw new Error('trigger is required');
    if (!input.triggerSource) throw new Error('triggerSource is required');
    if (!input.correlationId) throw new Error('correlationId is required');

    return new OpportunityAction(input, new Date());
  }
}

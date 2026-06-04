/**
 * AgentEscalation — tracks when a communication requires human agent intervention.
 */

import { randomUUID } from 'node:crypto';
import type { AgentEscalationReason } from './enums.js';

export type EscalationPriority = 'critical' | 'high' | 'medium' | 'low';
export type EscalationStatus = 'pending' | 'assigned' | 'resolved' | 'expired';

export interface CreateAgentEscalationInput {
  opportunityId: string;
  tenantId: string;
  travellerId: string;
  communicationId: string;
  reason: AgentEscalationReason;
  priority: EscalationPriority;
}

export class AgentEscalation {
  readonly escalationId: string;
  readonly opportunityId: string;
  readonly tenantId: string;
  readonly travellerId: string;
  readonly communicationId: string;
  readonly reason: AgentEscalationReason;
  readonly priority: EscalationPriority;
  readonly createdAt: Date;

  private _assignedAgentId: string | null;
  private _status: EscalationStatus;

  get assignedAgentId(): string | null {
    return this._assignedAgentId;
  }
  get status(): EscalationStatus {
    return this._status;
  }

  private constructor(input: CreateAgentEscalationInput, now: Date) {
    this.escalationId = randomUUID();
    this.opportunityId = input.opportunityId;
    this.tenantId = input.tenantId;
    this.travellerId = input.travellerId;
    this.communicationId = input.communicationId;
    this.reason = input.reason;
    this.priority = input.priority;
    this.createdAt = now;

    this._assignedAgentId = null;
    this._status = 'pending';
  }

  static create(input: CreateAgentEscalationInput): AgentEscalation {
    if (!input.tenantId) throw new Error('tenantId is required');
    if (!input.opportunityId) throw new Error('opportunityId is required');
    if (!input.travellerId) throw new Error('travellerId is required');
    if (!input.communicationId) throw new Error('communicationId is required');
    if (!input.reason) throw new Error('reason is required');
    if (!input.priority) throw new Error('priority is required');

    return new AgentEscalation(input, new Date());
  }

  /** pending → assigned */
  assign(agentId: string): void {
    if (this._status !== 'pending') {
      throw new Error(`Cannot assign from state: ${this._status}`);
    }
    if (!agentId) throw new Error('agentId is required');
    this._status = 'assigned';
    this._assignedAgentId = agentId;
  }

  /** assigned → resolved */
  resolve(): void {
    if (this._status !== 'assigned') {
      throw new Error(`Cannot resolve from state: ${this._status}`);
    }
    this._status = 'resolved';
  }
}

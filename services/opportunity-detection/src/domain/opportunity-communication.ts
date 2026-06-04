/**
 * OpportunityCommunication — mostly immutable (response fields update).
 * Source: Approved Project 3 Domain Entities
 */

import { randomUUID } from 'node:crypto';

export type CommunicationType = 'initial_contact' | 'reminder' | 'escalation' | 'follow_up';
export type CommunicationChannel = 'email' | 'sms' | 'portal' | 'agent_call';
export type CommunicationOutcome =
  | 'opened'
  | 'clicked'
  | 'accepted'
  | 'declined'
  | 'bounced'
  | 'no_response'
  | 'unsubscribed';

export interface CreateCommunicationInput {
  opportunityId: string;
  tenantId: string;
  travellerId: string;
  communicationType: CommunicationType;
  channel: CommunicationChannel;
  correlationId: string;
  templateId?: string | null;
  externalCommunicationId?: string | null;
}

export class OpportunityCommunication {
  readonly communicationId: string;
  readonly opportunityId: string;
  readonly tenantId: string;
  readonly travellerId: string;
  readonly communicationType: CommunicationType;
  readonly channel: CommunicationChannel;
  readonly sentAt: Date;
  readonly correlationId: string;
  readonly templateId: string | null;
  readonly externalCommunicationId: string | null;

  private _responseReceivedAt: Date | null;
  private _communicationOutcome: CommunicationOutcome | null;

  get responseReceivedAt(): Date | null {
    return this._responseReceivedAt;
  }
  get communicationOutcome(): CommunicationOutcome | null {
    return this._communicationOutcome;
  }

  private constructor(input: CreateCommunicationInput, now: Date) {
    this.communicationId = randomUUID();
    this.opportunityId = input.opportunityId;
    this.tenantId = input.tenantId;
    this.travellerId = input.travellerId;
    this.communicationType = input.communicationType;
    this.channel = input.channel;
    this.sentAt = now;
    this.correlationId = input.correlationId;
    this.templateId = input.templateId ?? null;
    this.externalCommunicationId = input.externalCommunicationId ?? null;
    this._responseReceivedAt = null;
    this._communicationOutcome = null;
  }

  static create(input: CreateCommunicationInput): OpportunityCommunication {
    if (!input.opportunityId) throw new Error('opportunityId is required');
    if (!input.tenantId) throw new Error('tenantId is required');
    if (!input.travellerId) throw new Error('travellerId is required');
    if (!input.communicationType) throw new Error('communicationType is required');
    if (!input.channel) throw new Error('channel is required');
    if (!input.correlationId) throw new Error('correlationId is required');

    return new OpportunityCommunication(input, new Date());
  }

  /** Record the outcome of this communication */
  recordOutcome(outcome: CommunicationOutcome): void {
    this._communicationOutcome = outcome;
    this._responseReceivedAt = new Date();
  }
}

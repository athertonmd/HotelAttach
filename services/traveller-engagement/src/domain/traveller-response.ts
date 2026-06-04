/**
 * TravellerResponse — Immutable value object.
 * Records the traveller's response to a communication.
 */

import { randomUUID } from 'node:crypto';
import type { ResponseType } from './enums.js';

export interface CreateTravellerResponseInput {
  communicationId: string;
  opportunityId: string;
  tenantId: string;
  travellerId: string;
  responseType: ResponseType;
  notes?: string | null;
  correlationId?: string;
}

export class TravellerResponse {
  readonly responseId: string;
  readonly communicationId: string;
  readonly opportunityId: string;
  readonly tenantId: string;
  readonly travellerId: string;
  readonly responseType: ResponseType;
  readonly respondedAt: Date;
  readonly notes: string | null;
  readonly correlationId: string;

  private constructor(input: CreateTravellerResponseInput, now: Date) {
    this.responseId = randomUUID();
    this.communicationId = input.communicationId;
    this.opportunityId = input.opportunityId;
    this.tenantId = input.tenantId;
    this.travellerId = input.travellerId;
    this.responseType = input.responseType;
    this.respondedAt = now;
    this.notes = input.notes ?? null;
    this.correlationId = input.correlationId ?? randomUUID();
  }

  static create(input: CreateTravellerResponseInput): TravellerResponse {
    if (!input.tenantId) throw new Error('tenantId is required');
    if (!input.communicationId) throw new Error('communicationId is required');
    if (!input.opportunityId) throw new Error('opportunityId is required');
    if (!input.travellerId) throw new Error('travellerId is required');
    if (!input.responseType) throw new Error('responseType is required');

    if (input.notes !== undefined && input.notes !== null && input.notes.length > 1000) {
      throw new Error('notes must not exceed 1000 characters');
    }

    return new TravellerResponse(input, new Date());
  }
}

/**
 * Repository interfaces for Traveller Engagement.
 * All queries require tenantId for mandatory tenant isolation.
 */

import type { Communication } from '../domain/communication.js';
import type { TravellerAction } from '../domain/traveller-action.js';
import type { TravellerResponse } from '../domain/traveller-response.js';
import type { BookingRequest } from '../domain/booking-request.js';
import type { AgentEscalation } from '../domain/agent-escalation.js';
import type { TravellerPreference } from '../domain/traveller-preference.js';

export interface CommunicationRepository {
  save(communication: Communication): Promise<void>;
  findById(tenantId: string, communicationId: string): Promise<Communication | undefined>;
  findByOpportunityId(tenantId: string, opportunityId: string): Promise<Communication[]>;
  findByTravellerId(tenantId: string, travellerId: string): Promise<Communication[]>;
  findScheduled(tenantId: string): Promise<Communication[]>;
}

export interface TravellerActionRepository {
  save(action: TravellerAction): Promise<void>;
  findByToken(tenantId: string, token: string): Promise<TravellerAction | undefined>;
  findExpired(tenantId: string, now: Date): Promise<TravellerAction[]>;
}

export interface TravellerResponseRepository {
  append(response: TravellerResponse): Promise<void>;
  findByCommunicationId(tenantId: string, communicationId: string): Promise<TravellerResponse[]>;
}

export interface BookingRequestRepository {
  save(request: BookingRequest): Promise<void>;
  findById(tenantId: string, requestId: string): Promise<BookingRequest | undefined>;
  findActive(tenantId: string): Promise<BookingRequest[]>;
}

export interface AgentEscalationRepository {
  save(escalation: AgentEscalation): Promise<void>;
  findPending(tenantId: string): Promise<AgentEscalation[]>;
  findById(tenantId: string, escalationId: string): Promise<AgentEscalation | undefined>;
}

export interface TravellerPreferenceRepository {
  save(preference: TravellerPreference): Promise<void>;
  findByTravellerId(
    tenantId: string,
    travellerId: string,
  ): Promise<TravellerPreference | undefined>;
}

export interface CommunicationAuditRepository {
  append(entry: {
    tenantId: string;
    communicationId: string;
    action: string;
    occurredAt: Date;
    details?: string;
  }): Promise<void>;
  findByCommunicationId(
    tenantId: string,
    communicationId: string,
  ): Promise<
    {
      tenantId: string;
      communicationId: string;
      action: string;
      occurredAt: Date;
      details?: string;
    }[]
  >;
}

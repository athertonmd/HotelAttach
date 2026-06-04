/**
 * In-memory repository implementations for Traveller Engagement.
 * Designed for unit testing and local development.
 * All operations enforce tenant isolation.
 */

import type { Communication } from '../domain/communication.js';
import type { TravellerAction } from '../domain/traveller-action.js';
import type { TravellerResponse } from '../domain/traveller-response.js';
import type { BookingRequest } from '../domain/booking-request.js';
import type { AgentEscalation } from '../domain/agent-escalation.js';
import type { TravellerPreference } from '../domain/traveller-preference.js';
import type {
  CommunicationRepository,
  TravellerActionRepository,
  TravellerResponseRepository,
  BookingRequestRepository,
  AgentEscalationRepository,
  TravellerPreferenceRepository,
  CommunicationAuditRepository,
} from './interfaces.js';

export class InMemoryCommunicationRepository implements CommunicationRepository {
  private readonly store = new Map<string, Communication>();

  async save(communication: Communication): Promise<void> {
    this.store.set(this.key(communication.tenantId, communication.communicationId), communication);
  }

  async findById(tenantId: string, communicationId: string): Promise<Communication | undefined> {
    return this.store.get(this.key(tenantId, communicationId));
  }

  async findByOpportunityId(tenantId: string, opportunityId: string): Promise<Communication[]> {
    return this.filterByTenant(tenantId).filter((c) => c.opportunityId === opportunityId);
  }

  async findByTravellerId(tenantId: string, travellerId: string): Promise<Communication[]> {
    return this.filterByTenant(tenantId).filter((c) => c.travellerId === travellerId);
  }

  async findScheduled(tenantId: string): Promise<Communication[]> {
    return this.filterByTenant(tenantId).filter((c) => c.status === 'scheduled');
  }

  private key(tenantId: string, communicationId: string): string {
    return `${tenantId}::${communicationId}`;
  }

  private filterByTenant(tenantId: string): Communication[] {
    const results: Communication[] = [];
    for (const comm of this.store.values()) {
      if (comm.tenantId === tenantId) {
        results.push(comm);
      }
    }
    return results;
  }
}

export class InMemoryTravellerActionRepository implements TravellerActionRepository {
  private readonly store = new Map<string, TravellerAction>();

  async save(action: TravellerAction): Promise<void> {
    this.store.set(this.key(action.tenantId, action.actionId), action);
  }

  async findByToken(tenantId: string, token: string): Promise<TravellerAction | undefined> {
    for (const action of this.store.values()) {
      if (action.tenantId === tenantId && action.token === token) {
        return action;
      }
    }
    return undefined;
  }

  async findExpired(tenantId: string, now: Date): Promise<TravellerAction[]> {
    const results: TravellerAction[] = [];
    for (const action of this.store.values()) {
      if (action.tenantId === tenantId && action.expiresAt <= now && !action.isUsed) {
        results.push(action);
      }
    }
    return results;
  }

  private key(tenantId: string, actionId: string): string {
    return `${tenantId}::${actionId}`;
  }
}

export class InMemoryTravellerResponseRepository implements TravellerResponseRepository {
  private readonly store: TravellerResponse[] = [];

  async append(response: TravellerResponse): Promise<void> {
    this.store.push(response);
  }

  async findByCommunicationId(
    tenantId: string,
    communicationId: string,
  ): Promise<TravellerResponse[]> {
    return this.store.filter(
      (r) => r.tenantId === tenantId && r.communicationId === communicationId,
    );
  }
}

export class InMemoryBookingRequestRepository implements BookingRequestRepository {
  private readonly store = new Map<string, BookingRequest>();

  async save(request: BookingRequest): Promise<void> {
    this.store.set(this.key(request.tenantId, request.requestId), request);
  }

  async findById(tenantId: string, requestId: string): Promise<BookingRequest | undefined> {
    return this.store.get(this.key(tenantId, requestId));
  }

  async findActive(tenantId: string): Promise<BookingRequest[]> {
    const activeStatuses = ['created', 'assigned', 'processing'];
    const results: BookingRequest[] = [];
    for (const request of this.store.values()) {
      if (request.tenantId === tenantId && activeStatuses.includes(request.status)) {
        results.push(request);
      }
    }
    return results;
  }

  private key(tenantId: string, requestId: string): string {
    return `${tenantId}::${requestId}`;
  }
}

export class InMemoryAgentEscalationRepository implements AgentEscalationRepository {
  private readonly store = new Map<string, AgentEscalation>();

  async save(escalation: AgentEscalation): Promise<void> {
    this.store.set(this.key(escalation.tenantId, escalation.escalationId), escalation);
  }

  async findPending(tenantId: string): Promise<AgentEscalation[]> {
    const results: AgentEscalation[] = [];
    for (const escalation of this.store.values()) {
      if (escalation.tenantId === tenantId && escalation.status === 'pending') {
        results.push(escalation);
      }
    }
    return results;
  }

  async findById(tenantId: string, escalationId: string): Promise<AgentEscalation | undefined> {
    return this.store.get(this.key(tenantId, escalationId));
  }

  private key(tenantId: string, escalationId: string): string {
    return `${tenantId}::${escalationId}`;
  }
}

export class InMemoryTravellerPreferenceRepository implements TravellerPreferenceRepository {
  private readonly store = new Map<string, TravellerPreference>();

  async save(preference: TravellerPreference): Promise<void> {
    this.store.set(this.key(preference.tenantId, preference.travellerId), preference);
  }

  async findByTravellerId(
    tenantId: string,
    travellerId: string,
  ): Promise<TravellerPreference | undefined> {
    return this.store.get(this.key(tenantId, travellerId));
  }

  private key(tenantId: string, travellerId: string): string {
    return `${tenantId}::${travellerId}`;
  }
}

interface AuditEntry {
  tenantId: string;
  communicationId: string;
  action: string;
  occurredAt: Date;
  details?: string;
}

export class InMemoryCommunicationAuditRepository implements CommunicationAuditRepository {
  private readonly store: AuditEntry[] = [];

  async append(entry: AuditEntry): Promise<void> {
    this.store.push(entry);
  }

  async findByCommunicationId(tenantId: string, communicationId: string): Promise<AuditEntry[]> {
    return this.store.filter(
      (e) => e.tenantId === tenantId && e.communicationId === communicationId,
    );
  }
}

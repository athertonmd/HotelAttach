/**
 * In-memory repository implementations for Opportunity Detection.
 * Designed for unit testing and local development.
 * All operations enforce tenant isolation.
 */

import type { Opportunity } from '../domain/opportunity.js';
import type { OpportunityAssessment } from '../domain/opportunity-assessment.js';
import type { OpportunitySuppression } from '../domain/opportunity-suppression.js';
import type { OpportunityCommunication } from '../domain/opportunity-communication.js';
import type { OpportunityClosure } from '../domain/opportunity-closure.js';
import type { OpportunityAuditEntry } from '../domain/opportunity-audit-entry.js';
import type { LifecycleState, OpportunityType } from '../domain/enums.js';
import { ACTIVE_STATES } from '../domain/enums.js';
import type {
  OpportunityRepository,
  OpportunityAssessmentRepository,
  OpportunitySuppressionRepository,
  OpportunityCommunicationRepository,
  OpportunityClosureRepository,
  OpportunityAuditRepository,
} from './interfaces.js';

export class InMemoryOpportunityRepository implements OpportunityRepository {
  private readonly store = new Map<string, Opportunity>();

  async save(opportunity: Opportunity): Promise<void> {
    this.store.set(this.key(opportunity.tenantId, opportunity.opportunityId), opportunity);
  }

  async findById(tenantId: string, opportunityId: string): Promise<Opportunity | undefined> {
    return this.store.get(this.key(tenantId, opportunityId));
  }

  async findByTravellerId(tenantId: string, travellerId: string): Promise<Opportunity[]> {
    return this.filterByTenant(tenantId).filter((o) => o.travellerId === travellerId);
  }

  async findByTripId(tenantId: string, tripId: string): Promise<Opportunity[]> {
    return this.filterByTenant(tenantId).filter((o) => o.tripId === tripId);
  }

  async findActiveByTraveller(tenantId: string, travellerId: string): Promise<Opportunity[]> {
    return this.filterByTenant(tenantId).filter(
      (o) =>
        o.travellerId === travellerId &&
        ACTIVE_STATES.includes(o.lifecycleState as (typeof ACTIVE_STATES)[number]),
    );
  }

  async findByState(tenantId: string, state: LifecycleState): Promise<Opportunity[]> {
    return this.filterByTenant(tenantId).filter((o) => o.lifecycleState === state);
  }

  async findByType(tenantId: string, type: OpportunityType): Promise<Opportunity[]> {
    return this.filterByTenant(tenantId).filter((o) => o.opportunityType === type);
  }

  async remove(tenantId: string, opportunityId: string): Promise<void> {
    this.store.delete(this.key(tenantId, opportunityId));
  }

  private key(tenantId: string, opportunityId: string): string {
    return `${tenantId}::${opportunityId}`;
  }

  private filterByTenant(tenantId: string): Opportunity[] {
    const results: Opportunity[] = [];
    for (const opp of this.store.values()) {
      if (opp.tenantId === tenantId) {
        results.push(opp);
      }
    }
    return results;
  }
}

export class InMemoryOpportunityAssessmentRepository implements OpportunityAssessmentRepository {
  private readonly store: OpportunityAssessment[] = [];

  async save(assessment: OpportunityAssessment): Promise<void> {
    this.store.push(assessment);
  }

  async findByOpportunityId(
    tenantId: string,
    opportunityId: string,
  ): Promise<OpportunityAssessment[]> {
    return this.store.filter((a) => a.tenantId === tenantId && a.opportunityId === opportunityId);
  }
}

export class InMemoryOpportunitySuppressionRepository implements OpportunitySuppressionRepository {
  private readonly store: OpportunitySuppression[] = [];

  async save(suppression: OpportunitySuppression): Promise<void> {
    this.store.push(suppression);
  }

  async findActiveByOpportunityId(
    tenantId: string,
    opportunityId: string,
  ): Promise<OpportunitySuppression[]> {
    return this.store.filter(
      (s) => s.tenantId === tenantId && s.opportunityId === opportunityId && s.isActive,
    );
  }

  async findExpiredSuppressions(tenantId: string, now: Date): Promise<OpportunitySuppression[]> {
    return this.store.filter(
      (s) =>
        s.tenantId === tenantId &&
        s.isActive &&
        s.suppressedUntil !== null &&
        s.suppressedUntil <= now,
    );
  }
}

export class InMemoryOpportunityCommunicationRepository implements OpportunityCommunicationRepository {
  private readonly store: OpportunityCommunication[] = [];

  async save(communication: OpportunityCommunication): Promise<void> {
    this.store.push(communication);
  }

  async findByOpportunityId(
    tenantId: string,
    opportunityId: string,
  ): Promise<OpportunityCommunication[]> {
    return this.store.filter((c) => c.tenantId === tenantId && c.opportunityId === opportunityId);
  }
}

export class InMemoryOpportunityClosureRepository implements OpportunityClosureRepository {
  private readonly store: OpportunityClosure[] = [];

  async save(closure: OpportunityClosure): Promise<void> {
    this.store.push(closure);
  }

  async findByOpportunityId(
    tenantId: string,
    opportunityId: string,
  ): Promise<OpportunityClosure[]> {
    return this.store.filter((c) => c.tenantId === tenantId && c.opportunityId === opportunityId);
  }
}

export class InMemoryOpportunityAuditRepository implements OpportunityAuditRepository {
  private readonly store: OpportunityAuditEntry[] = [];

  async append(entry: OpportunityAuditEntry): Promise<void> {
    this.store.push(entry);
  }

  async findByOpportunityId(
    tenantId: string,
    opportunityId: string,
  ): Promise<OpportunityAuditEntry[]> {
    return this.store.filter((e) => e.tenantId === tenantId && e.opportunityId === opportunityId);
  }
}

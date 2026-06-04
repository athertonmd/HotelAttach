/**
 * In-memory repository implementations for Analytics API.
 * Designed for unit testing and local development.
 * All operations enforce tenant isolation via composite keys.
 */

import type {
  ProjectionCheckpoint,
  ProjectionCheckpointRepository,
  OpportunityPipelineRepository,
  DutyOfCareRepository,
  EngagementFunnelRepository,
  AgentEscalationAnalyticsRepository,
} from './interfaces.js';

export class InMemoryProjectionCheckpointRepository implements ProjectionCheckpointRepository {
  private readonly store = new Map<string, ProjectionCheckpoint & { processedAt: Date }>();

  async getCheckpoint(projectorName: string): Promise<ProjectionCheckpoint | undefined> {
    const entry = this.store.get(projectorName);
    if (!entry) return undefined;
    return {
      lastEventId: entry.lastEventId,
      lastEventTimestamp: entry.lastEventTimestamp,
      eventsProcessedCount: entry.eventsProcessedCount,
    };
  }

  async updateCheckpoint(
    projectorName: string,
    eventId: string,
    eventTimestamp: Date,
  ): Promise<void> {
    const existing = this.store.get(projectorName);
    const count = existing ? existing.eventsProcessedCount + 1 : 1;
    this.store.set(projectorName, {
      lastEventId: eventId,
      lastEventTimestamp: eventTimestamp,
      eventsProcessedCount: count,
      processedAt: new Date(),
    });
  }
}

export class InMemoryOpportunityPipelineRepository implements OpportunityPipelineRepository {
  private readonly store = new Map<string, Record<string, unknown>>();

  async upsert(
    tenantId: string,
    opportunityId: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const key = this.key(tenantId, opportunityId);
    this.store.set(key, { ...data, tenantId, opportunityId });
  }

  async findByTenant(tenantId: string): Promise<Record<string, unknown>[]> {
    return this.filterByTenant(tenantId);
  }

  async findByState(tenantId: string, state: string): Promise<Record<string, unknown>[]> {
    return this.filterByTenant(tenantId).filter((row) => row['lifecycleState'] === state);
  }

  async findByPriority(tenantId: string, priority: string): Promise<Record<string, unknown>[]> {
    return this.filterByTenant(tenantId).filter((row) => row['priority'] === priority);
  }

  private key(tenantId: string, opportunityId: string): string {
    return `${tenantId}::${opportunityId}`;
  }

  private filterByTenant(tenantId: string): Record<string, unknown>[] {
    const results: Record<string, unknown>[] = [];
    for (const row of this.store.values()) {
      if (row['tenantId'] === tenantId) {
        results.push(row);
      }
    }
    return results;
  }
}

export class InMemoryDutyOfCareRepository implements DutyOfCareRepository {
  private readonly store = new Map<string, Record<string, unknown>>();

  async upsert(tenantId: string, tripId: string, data: Record<string, unknown>): Promise<void> {
    const key = this.key(tenantId, tripId);
    this.store.set(key, { ...data, tenantId, tripId });
  }

  async findUnresolved(tenantId: string): Promise<Record<string, unknown>[]> {
    return this.filterByTenant(tenantId).filter((row) => row['isUnresolved'] === true);
  }

  async findByTenant(tenantId: string): Promise<Record<string, unknown>[]> {
    return this.filterByTenant(tenantId);
  }

  private key(tenantId: string, tripId: string): string {
    return `${tenantId}::${tripId}`;
  }

  private filterByTenant(tenantId: string): Record<string, unknown>[] {
    const results: Record<string, unknown>[] = [];
    for (const row of this.store.values()) {
      if (row['tenantId'] === tenantId) {
        results.push(row);
      }
    }
    return results;
  }
}

export class InMemoryEngagementFunnelRepository implements EngagementFunnelRepository {
  private readonly store = new Map<string, Record<string, unknown>>();

  async upsert(
    tenantId: string,
    corporateId: string,
    periodStart: Date,
    data: Record<string, unknown>,
  ): Promise<void> {
    const key = this.key(tenantId, corporateId, periodStart);
    this.store.set(key, { ...data, tenantId, corporateId, periodStart });
  }

  async findByPeriod(tenantId: string, periodStart: Date): Promise<Record<string, unknown>[]> {
    const periodTime = periodStart.getTime();
    return this.filterByTenant(tenantId).filter((row) => {
      const rowPeriod = row['periodStart'];
      if (rowPeriod instanceof Date) {
        return rowPeriod.getTime() === periodTime;
      }
      return false;
    });
  }

  private key(tenantId: string, corporateId: string, periodStart: Date): string {
    return `${tenantId}::${corporateId}::${periodStart.toISOString()}`;
  }

  private filterByTenant(tenantId: string): Record<string, unknown>[] {
    const results: Record<string, unknown>[] = [];
    for (const row of this.store.values()) {
      if (row['tenantId'] === tenantId) {
        results.push(row);
      }
    }
    return results;
  }
}

export class InMemoryAgentEscalationAnalyticsRepository implements AgentEscalationAnalyticsRepository {
  private readonly store = new Map<string, Record<string, unknown>>();

  async upsert(
    tenantId: string,
    escalationId: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const key = this.key(tenantId, escalationId);
    this.store.set(key, { ...data, tenantId, escalationId });
  }

  async findPending(tenantId: string): Promise<Record<string, unknown>[]> {
    return this.filterByTenant(tenantId).filter((row) => row['status'] === 'pending');
  }

  async findByTenant(tenantId: string): Promise<Record<string, unknown>[]> {
    return this.filterByTenant(tenantId);
  }

  private key(tenantId: string, escalationId: string): string {
    return `${tenantId}::${escalationId}`;
  }

  private filterByTenant(tenantId: string): Record<string, unknown>[] {
    const results: Record<string, unknown>[] = [];
    for (const row of this.store.values()) {
      if (row['tenantId'] === tenantId) {
        results.push(row);
      }
    }
    return results;
  }
}

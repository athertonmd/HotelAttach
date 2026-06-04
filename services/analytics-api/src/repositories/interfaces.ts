/**
 * Repository interfaces for Analytics API.
 * All queries require tenantId for mandatory tenant isolation
 * (except ProjectionCheckpoint which is a system-level table).
 */

export interface ProjectionCheckpoint {
  lastEventId: string | null;
  lastEventTimestamp: Date | null;
  eventsProcessedCount: number;
}

export interface ProjectionCheckpointRepository {
  getCheckpoint(projectorName: string): Promise<ProjectionCheckpoint | undefined>;
  updateCheckpoint(projectorName: string, eventId: string, eventTimestamp: Date): Promise<void>;
}

export interface OpportunityPipelineRepository {
  upsert(tenantId: string, opportunityId: string, data: Record<string, unknown>): Promise<void>;
  findByTenant(tenantId: string): Promise<Record<string, unknown>[]>;
  findByState(tenantId: string, state: string): Promise<Record<string, unknown>[]>;
  findByPriority(tenantId: string, priority: string): Promise<Record<string, unknown>[]>;
}

export interface DutyOfCareRepository {
  upsert(tenantId: string, tripId: string, data: Record<string, unknown>): Promise<void>;
  findUnresolved(tenantId: string): Promise<Record<string, unknown>[]>;
  findByTenant(tenantId: string): Promise<Record<string, unknown>[]>;
}

export interface EngagementFunnelRepository {
  upsert(
    tenantId: string,
    corporateId: string,
    periodStart: Date,
    data: Record<string, unknown>,
  ): Promise<void>;
  findByPeriod(tenantId: string, periodStart: Date): Promise<Record<string, unknown>[]>;
}

export interface AgentEscalationAnalyticsRepository {
  upsert(tenantId: string, escalationId: string, data: Record<string, unknown>): Promise<void>;
  findPending(tenantId: string): Promise<Record<string, unknown>[]>;
  findByTenant(tenantId: string): Promise<Record<string, unknown>[]>;
}

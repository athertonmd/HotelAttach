/**
 * PostgreSQL implementations of analytics repositories.
 * All queries enforce tenant isolation via tenant_id parameter.
 */

import type {
  ProjectionCheckpoint,
  ProjectionCheckpointRepository,
  OpportunityPipelineRepository,
  DutyOfCareRepository,
  EngagementFunnelRepository,
  AgentEscalationAnalyticsRepository,
} from '../repositories/interfaces.js';
import type { DatabaseClient } from './db-client.js';

export class PgProjectionCheckpointRepository implements ProjectionCheckpointRepository {
  constructor(private readonly db: DatabaseClient) {}

  async getCheckpoint(projectorName: string): Promise<ProjectionCheckpoint | undefined> {
    const result = await this.db.query<{
      last_event_id: string | null;
      last_event_timestamp: Date | null;
      events_processed_count: number;
    }>(
      'SELECT last_event_id, last_event_timestamp, events_processed_count FROM analytics.projection_checkpoints WHERE projector_name = $1',
      [projectorName],
    );
    const row = result.rows[0];
    if (!row) return undefined;
    return {
      lastEventId: row.last_event_id,
      lastEventTimestamp: row.last_event_timestamp,
      eventsProcessedCount: Number(row.events_processed_count),
    };
  }

  async updateCheckpoint(
    projectorName: string,
    eventId: string,
    eventTimestamp: Date,
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO analytics.projection_checkpoints (projector_name, last_event_id, last_event_timestamp, last_processed_at, events_processed_count)
       VALUES ($1, $2, $3, NOW(), 1)
       ON CONFLICT (projector_name) DO UPDATE SET
         last_event_id = EXCLUDED.last_event_id,
         last_event_timestamp = EXCLUDED.last_event_timestamp,
         last_processed_at = NOW(),
         events_processed_count = analytics.projection_checkpoints.events_processed_count + 1`,
      [projectorName, eventId, eventTimestamp.toISOString()],
    );
  }
}

export class PgOpportunityPipelineRepository implements OpportunityPipelineRepository {
  constructor(private readonly db: DatabaseClient) {}

  async upsert(
    tenantId: string,
    opportunityId: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO analytics.opportunity_pipeline (tenant_id, opportunity_id, corporate_id, traveller_id, trip_id, opportunity_type, lifecycle_state, score, priority, detected_at, last_updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
       ON CONFLICT (tenant_id, opportunity_id) DO UPDATE SET
         lifecycle_state = EXCLUDED.lifecycle_state,
         score = EXCLUDED.score,
         priority = EXCLUDED.priority,
         last_updated_at = NOW()`,
      [
        tenantId,
        opportunityId,
        data['corporateId'],
        data['travellerId'],
        data['tripId'],
        data['opportunityType'],
        data['lifecycleState'],
        data['score'],
        data['priority'],
        data['detectedAt'],
      ],
    );
  }

  async findByTenant(tenantId: string): Promise<Record<string, unknown>[]> {
    const result = await this.db.query(
      'SELECT * FROM analytics.opportunity_pipeline WHERE tenant_id = $1',
      [tenantId],
    );
    return result.rows;
  }

  async findByState(tenantId: string, state: string): Promise<Record<string, unknown>[]> {
    const result = await this.db.query(
      'SELECT * FROM analytics.opportunity_pipeline WHERE tenant_id = $1 AND lifecycle_state = $2',
      [tenantId, state],
    );
    return result.rows;
  }

  async findByPriority(tenantId: string, priority: string): Promise<Record<string, unknown>[]> {
    const result = await this.db.query(
      'SELECT * FROM analytics.opportunity_pipeline WHERE tenant_id = $1 AND priority = $2',
      [tenantId, priority],
    );
    return result.rows;
  }
}

export class PgDutyOfCareRepository implements DutyOfCareRepository {
  constructor(private readonly db: DatabaseClient) {}

  async upsert(tenantId: string, tripId: string, data: Record<string, unknown>): Promise<void> {
    await this.db.query(
      `INSERT INTO analytics.duty_of_care_trips (tenant_id, trip_id, corporate_id, traveller_id, destination_risk_level, is_unresolved, last_updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (tenant_id, trip_id) DO UPDATE SET
         is_unresolved = EXCLUDED.is_unresolved,
         destination_risk_level = EXCLUDED.destination_risk_level,
         last_updated_at = NOW()`,
      [
        tenantId,
        tripId,
        data['corporateId'],
        data['travellerId'],
        data['destinationRiskLevel'] ?? 'standard',
        data['isUnresolved'] ?? false,
      ],
    );
  }

  async findUnresolved(tenantId: string): Promise<Record<string, unknown>[]> {
    const result = await this.db.query(
      'SELECT * FROM analytics.duty_of_care_trips WHERE tenant_id = $1 AND is_unresolved = TRUE',
      [tenantId],
    );
    return result.rows;
  }

  async findByTenant(tenantId: string): Promise<Record<string, unknown>[]> {
    const result = await this.db.query(
      'SELECT * FROM analytics.duty_of_care_trips WHERE tenant_id = $1',
      [tenantId],
    );
    return result.rows;
  }
}

export class PgEngagementFunnelRepository implements EngagementFunnelRepository {
  constructor(private readonly db: DatabaseClient) {}

  async upsert(
    tenantId: string,
    corporateId: string,
    periodStart: Date,
    data: Record<string, unknown>,
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO analytics.engagement_funnel_weekly (tenant_id, corporate_id, period_start, period_end, communications_sent, responses_received, bookings_created)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (tenant_id, corporate_id, period_start) DO UPDATE SET
         communications_sent = EXCLUDED.communications_sent,
         responses_received = EXCLUDED.responses_received,
         bookings_created = EXCLUDED.bookings_created`,
      [
        tenantId,
        corporateId,
        periodStart.toISOString(),
        data['periodEnd'],
        data['communicationsSent'] ?? 0,
        data['responsesReceived'] ?? 0,
        data['bookingsCreated'] ?? 0,
      ],
    );
  }

  async findByPeriod(tenantId: string, periodStart: Date): Promise<Record<string, unknown>[]> {
    const result = await this.db.query(
      'SELECT * FROM analytics.engagement_funnel_weekly WHERE tenant_id = $1 AND period_start = $2',
      [tenantId, periodStart.toISOString()],
    );
    return result.rows;
  }
}

export class PgAgentEscalationAnalyticsRepository implements AgentEscalationAnalyticsRepository {
  constructor(private readonly db: DatabaseClient) {}

  async upsert(
    tenantId: string,
    escalationId: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO analytics.agent_escalations (tenant_id, escalation_id, opportunity_id, traveller_id, communication_id, reason, priority, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (tenant_id, escalation_id) DO UPDATE SET
         status = EXCLUDED.status,
         priority = EXCLUDED.priority`,
      [
        tenantId,
        escalationId,
        data['opportunityId'],
        data['travellerId'],
        data['communicationId'],
        data['reason'],
        data['priority'],
        data['status'],
        data['createdAt'],
      ],
    );
  }

  async findPending(tenantId: string): Promise<Record<string, unknown>[]> {
    const result = await this.db.query(
      'SELECT * FROM analytics.agent_escalations WHERE tenant_id = $1 AND status = $2',
      [tenantId, 'pending'],
    );
    return result.rows;
  }

  async findByTenant(tenantId: string): Promise<Record<string, unknown>[]> {
    const result = await this.db.query(
      'SELECT * FROM analytics.agent_escalations WHERE tenant_id = $1',
      [tenantId],
    );
    return result.rows;
  }
}

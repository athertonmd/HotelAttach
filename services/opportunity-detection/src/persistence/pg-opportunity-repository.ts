/**
 * PostgreSQL implementation of OpportunityRepository.
 * Includes version conflict handling (same pattern as Project 2 booking-reconciliation).
 */

import type { Opportunity } from '../domain/opportunity.js';
import type { LifecycleState, OpportunityType } from '../domain/enums.js';
import { ACTIVE_STATES } from '../domain/enums.js';
import type { OpportunityRepository } from '../repositories/interfaces.js';
import type { DatabaseClient } from './db-client.js';
import { VersionConflictError } from './db-client.js';

export class PgOpportunityRepository implements OpportunityRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findById(tenantId: string, opportunityId: string): Promise<Opportunity | undefined> {
    const result = await this.db.query(
      'SELECT * FROM opportunity_detection.opportunities WHERE tenant_id = $1 AND opportunity_id = $2',
      [tenantId, opportunityId],
    );
    return result.rows[0] ? this.toEntity(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async findByTravellerId(tenantId: string, travellerId: string): Promise<Opportunity[]> {
    const result = await this.db.query(
      'SELECT * FROM opportunity_detection.opportunities WHERE tenant_id = $1 AND traveller_id = $2',
      [tenantId, travellerId],
    );
    return result.rows.map((row) => this.toEntity(row as Record<string, unknown>));
  }

  async findByTripId(tenantId: string, tripId: string): Promise<Opportunity[]> {
    const result = await this.db.query(
      'SELECT * FROM opportunity_detection.opportunities WHERE tenant_id = $1 AND trip_id = $2',
      [tenantId, tripId],
    );
    return result.rows.map((row) => this.toEntity(row as Record<string, unknown>));
  }

  async findActiveByTraveller(tenantId: string, travellerId: string): Promise<Opportunity[]> {
    const placeholders = ACTIVE_STATES.map((_, i) => `$${i + 3}`).join(', ');
    const result = await this.db.query(
      `SELECT * FROM opportunity_detection.opportunities WHERE tenant_id = $1 AND traveller_id = $2 AND lifecycle_state IN (${placeholders})`,
      [tenantId, travellerId, ...ACTIVE_STATES],
    );
    return result.rows.map((row) => this.toEntity(row as Record<string, unknown>));
  }

  async findByState(tenantId: string, state: LifecycleState): Promise<Opportunity[]> {
    const result = await this.db.query(
      'SELECT * FROM opportunity_detection.opportunities WHERE tenant_id = $1 AND lifecycle_state = $2',
      [tenantId, state],
    );
    return result.rows.map((row) => this.toEntity(row as Record<string, unknown>));
  }

  async findByType(tenantId: string, type: OpportunityType): Promise<Opportunity[]> {
    const result = await this.db.query(
      'SELECT * FROM opportunity_detection.opportunities WHERE tenant_id = $1 AND opportunity_type = $2',
      [tenantId, type],
    );
    return result.rows.map((row) => this.toEntity(row as Record<string, unknown>));
  }

  async save(opportunity: Opportunity): Promise<void> {
    const existing = await this.db.query<{ version: number }>(
      'SELECT version FROM opportunity_detection.opportunities WHERE tenant_id = $1 AND opportunity_id = $2',
      [opportunity.tenantId, opportunity.opportunityId],
    );
    if (existing.rows[0] && existing.rows[0].version >= opportunity.version) {
      throw new VersionConflictError(
        'Opportunity',
        opportunity.opportunityId,
        opportunity.version,
        existing.rows[0].version,
      );
    }

    await this.db.query(
      `INSERT INTO opportunity_detection.opportunities (opportunity_id, tenant_id, corporate_id, traveller_id, trip_id, opportunity_type, lifecycle_state, score, priority, closure_reason, rejection_reason, primary_suppression_reason, suppressed_until, correlation_id, triggering_event_id, triggering_event_type, destination_city, destination_country, departure_date, estimated_room_nights, estimated_spend, estimated_commission, reopen_count, version, detected_at, qualified_at, closed_at, expires_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30)
       ON CONFLICT (opportunity_id) DO UPDATE SET lifecycle_state=EXCLUDED.lifecycle_state, score=EXCLUDED.score, priority=EXCLUDED.priority, closure_reason=EXCLUDED.closure_reason, rejection_reason=EXCLUDED.rejection_reason, primary_suppression_reason=EXCLUDED.primary_suppression_reason, suppressed_until=EXCLUDED.suppressed_until, reopen_count=EXCLUDED.reopen_count, version=EXCLUDED.version, qualified_at=EXCLUDED.qualified_at, closed_at=EXCLUDED.closed_at, expires_at=EXCLUDED.expires_at, updated_at=EXCLUDED.updated_at`,
      [
        opportunity.opportunityId,
        opportunity.tenantId,
        opportunity.corporateId,
        opportunity.travellerId,
        opportunity.tripId,
        opportunity.opportunityType,
        opportunity.lifecycleState,
        opportunity.score,
        opportunity.priority,
        opportunity.closureReason,
        opportunity.rejectionReason,
        opportunity.primarySuppressionReason,
        opportunity.suppressedUntil?.toISOString() ?? null,
        opportunity.correlationId,
        opportunity.triggeringEventId,
        opportunity.triggeringEventType,
        opportunity.destinationCity,
        opportunity.destinationCountry,
        opportunity.departureDate?.toISOString() ?? null,
        opportunity.estimatedRoomNights,
        opportunity.estimatedSpend,
        opportunity.estimatedCommission,
        opportunity.reopenCount,
        opportunity.version,
        opportunity.detectedAt.toISOString(),
        opportunity.qualifiedAt?.toISOString() ?? null,
        opportunity.closedAt?.toISOString() ?? null,
        opportunity.expiresAt?.toISOString() ?? null,
        opportunity.createdAt.toISOString(),
        opportunity.updatedAt.toISOString(),
      ],
    );
  }

  async remove(tenantId: string, opportunityId: string): Promise<void> {
    await this.db.query(
      'DELETE FROM opportunity_detection.opportunities WHERE tenant_id = $1 AND opportunity_id = $2',
      [tenantId, opportunityId],
    );
  }

  private toEntity(_row: Record<string, unknown>): Opportunity {
    // In production, map row columns back to Opportunity.
    // Requires a static rehydrate/fromSnapshot method on Opportunity.
    return undefined as unknown as Opportunity;
  }
}

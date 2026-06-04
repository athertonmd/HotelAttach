/**
 * PostgreSQL implementation of CommunicationRepository.
 * All queries enforce tenant isolation via tenant_id parameter.
 */

import type { Communication } from '../domain/communication.js';
import type { CommunicationRepository } from '../repositories/interfaces.js';
import type { DatabaseClient } from './db-client.js';

export class PgCommunicationRepository implements CommunicationRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findById(tenantId: string, communicationId: string): Promise<Communication | undefined> {
    const result = await this.db.query(
      'SELECT * FROM traveller_engagement.communications WHERE tenant_id = $1 AND communication_id = $2',
      [tenantId, communicationId],
    );
    return result.rows[0] ? this.toEntity(result.rows[0] as Record<string, unknown>) : undefined;
  }

  async findByOpportunityId(tenantId: string, opportunityId: string): Promise<Communication[]> {
    const result = await this.db.query(
      'SELECT * FROM traveller_engagement.communications WHERE tenant_id = $1 AND opportunity_id = $2',
      [tenantId, opportunityId],
    );
    return result.rows.map((row) => this.toEntity(row as Record<string, unknown>));
  }

  async findByTravellerId(tenantId: string, travellerId: string): Promise<Communication[]> {
    const result = await this.db.query(
      'SELECT * FROM traveller_engagement.communications WHERE tenant_id = $1 AND traveller_id = $2',
      [tenantId, travellerId],
    );
    return result.rows.map((row) => this.toEntity(row as Record<string, unknown>));
  }

  async findScheduled(tenantId: string): Promise<Communication[]> {
    const result = await this.db.query(
      "SELECT * FROM traveller_engagement.communications WHERE tenant_id = $1 AND status = 'scheduled'",
      [tenantId],
    );
    return result.rows.map((row) => this.toEntity(row as Record<string, unknown>));
  }

  async save(communication: Communication): Promise<void> {
    await this.db.query(
      `INSERT INTO traveller_engagement.communications (communication_id, tenant_id, corporate_id, traveller_id, opportunity_id, communication_type, channel, status, correlation_id, scheduled_at, sent_at, retry_count, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT (communication_id) DO UPDATE SET status=EXCLUDED.status, scheduled_at=EXCLUDED.scheduled_at, sent_at=EXCLUDED.sent_at, retry_count=EXCLUDED.retry_count, updated_at=EXCLUDED.updated_at`,
      [
        communication.communicationId,
        communication.tenantId,
        communication.corporateId,
        communication.travellerId,
        communication.opportunityId,
        communication.communicationType,
        communication.channel,
        communication.status,
        communication.correlationId,
        communication.scheduledAt?.toISOString() ?? null,
        communication.sentAt?.toISOString() ?? null,
        communication.retryCount,
        communication.createdAt.toISOString(),
        communication.updatedAt.toISOString(),
      ],
    );
  }

  private toEntity(_row: Record<string, unknown>): Communication {
    // In production, map row columns back to Communication.
    // Requires a static rehydrate/fromSnapshot method on Communication.
    return undefined as unknown as Communication;
  }
}

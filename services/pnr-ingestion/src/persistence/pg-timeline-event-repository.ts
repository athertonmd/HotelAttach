/**
 * PostgreSQL implementation of TimelineEventRepository.
 * Append-only — no update or delete operations.
 * Uses INSERT ... ON CONFLICT DO NOTHING for idempotency.
 */

import type { TimelineEvent } from '../domain/timeline-event.js';
import { TimelineEvent as TimelineEventEntity } from '../domain/timeline-event.js';
import type { TimelineEventRepository } from '../repositories/interfaces.js';
import type { DatabaseClient } from './db-client.js';
import type { TimelineEventType } from '../domain/value-objects.js';

interface TimelineEventRow {
  event_id: string;
  trip_id: string;
  tenant_id: string;
  event_type: string;
  event_data: Record<string, unknown>;
  created_at: string;
}

function rowToEntity(row: TimelineEventRow): TimelineEvent {
  return TimelineEventEntity.create({
    eventId: row.event_id,
    tripId: row.trip_id,
    eventType: row.event_type as TimelineEventType,
    eventData: row.event_data,
  });
}

export class PgTimelineEventRepository implements TimelineEventRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findById(tenantId: string, eventId: string): Promise<TimelineEvent | undefined> {
    const result = await this.db.query<TimelineEventRow>(
      'SELECT * FROM pnr_ingestion.timeline_events WHERE tenant_id = $1 AND event_id = $2',
      [tenantId, eventId],
    );
    const row = result.rows[0];
    return row ? rowToEntity(row) : undefined;
  }

  async findByTrip(tenantId: string, tripId: string): Promise<TimelineEvent[]> {
    const result = await this.db.query<TimelineEventRow>(
      'SELECT * FROM pnr_ingestion.timeline_events WHERE tenant_id = $1 AND trip_id = $2 ORDER BY created_at ASC',
      [tenantId, tripId],
    );
    return result.rows.map(rowToEntity);
  }

  async append(event: TimelineEvent): Promise<void> {
    await this.db.query(
      `INSERT INTO pnr_ingestion.timeline_events (event_id, trip_id, tenant_id, event_type, event_data, created_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (event_id) DO NOTHING`,
      [
        event.eventId,
        event.tripId,
        event.tripId, // tenant_id — in production, resolved from trip context
        event.eventType,
        JSON.stringify(event.eventData),
        event.createdAt.toISOString(),
      ],
    );
  }
}

/**
 * PostgreSQL implementation of SegmentRepository.
 * Implements optimistic version checking for concurrent segment updates.
 */

import type { Segment } from '../domain/segment.js';
import { Segment as SegmentEntity } from '../domain/segment.js';
import { type SegmentRepository, VersionConflictError } from '../repositories/interfaces.js';
import type { DatabaseClient } from './db-client.js';
import type { SegmentType, SegmentStatus } from '../domain/value-objects.js';

interface SegmentRow {
  segment_id: string;
  trip_id: string;
  tenant_id: string;
  segment_type: string;
  start_datetime: string;
  end_datetime: string;
  origin: string;
  destination: string;
  status: string;
  version: number;
  created_at: string;
  updated_at: string;
}

function rowToEntity(row: SegmentRow): Segment {
  return SegmentEntity.create({
    segmentId: row.segment_id,
    tripId: row.trip_id,
    segmentType: row.segment_type as SegmentType,
    startDatetime: new Date(row.start_datetime),
    endDatetime: new Date(row.end_datetime),
    origin: row.origin,
    destination: row.destination,
    status: row.status as SegmentStatus,
    version: row.version,
  });
}

export class PgSegmentRepository implements SegmentRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findById(tenantId: string, segmentId: string): Promise<Segment | undefined> {
    const result = await this.db.query<SegmentRow>(
      'SELECT * FROM pnr_ingestion.segments WHERE tenant_id = $1 AND segment_id = $2',
      [tenantId, segmentId],
    );
    const row = result.rows[0];
    return row ? rowToEntity(row) : undefined;
  }

  async findByTrip(tenantId: string, tripId: string): Promise<Segment[]> {
    const result = await this.db.query<SegmentRow>(
      'SELECT * FROM pnr_ingestion.segments WHERE tenant_id = $1 AND trip_id = $2 ORDER BY start_datetime',
      [tenantId, tripId],
    );
    return result.rows.map(rowToEntity);
  }

  async save(segment: Segment, expectedVersion?: number): Promise<void> {
    if (expectedVersion !== undefined) {
      const result = await this.db.query(
        `UPDATE pnr_ingestion.segments SET
           segment_type = $3, start_datetime = $4, end_datetime = $5,
           origin = $6, destination = $7, status = $8, version = $9, updated_at = $10
         WHERE segment_id = $1 AND tenant_id = $2 AND version = $11`,
        [
          segment.segmentId,
          segment.tripId, // tenant_id derived from trip context
          segment.segmentType,
          segment.startDatetime.toISOString(),
          segment.endDatetime.toISOString(),
          segment.origin,
          segment.destination,
          segment.status,
          segment.version,
          segment.updatedAt.toISOString(),
          expectedVersion,
        ],
      );

      if (result.rowCount === 0) {
        const existing = await this.db.query<SegmentRow>(
          'SELECT version FROM pnr_ingestion.segments WHERE segment_id = $1',
          [segment.segmentId],
        );
        const existingRow = existing.rows[0];
        if (existingRow) {
          throw new VersionConflictError(
            'Segment',
            segment.segmentId,
            expectedVersion,
            existingRow.version,
          );
        }
        await this.insertSegment(segment);
      }
    } else {
      await this.insertSegment(segment);
    }
  }

  async remove(tenantId: string, segmentId: string): Promise<void> {
    await this.db.query(
      'DELETE FROM pnr_ingestion.segments WHERE tenant_id = $1 AND segment_id = $2',
      [tenantId, segmentId],
    );
  }

  private async insertSegment(segment: Segment): Promise<void> {
    await this.db.query(
      `INSERT INTO pnr_ingestion.segments (segment_id, trip_id, tenant_id, segment_type, start_datetime, end_datetime, origin, destination, status, version, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (segment_id) DO UPDATE SET
         segment_type = EXCLUDED.segment_type,
         start_datetime = EXCLUDED.start_datetime,
         end_datetime = EXCLUDED.end_datetime,
         origin = EXCLUDED.origin,
         destination = EXCLUDED.destination,
         status = EXCLUDED.status,
         version = EXCLUDED.version,
         updated_at = EXCLUDED.updated_at`,
      [
        segment.segmentId,
        segment.tripId,
        segment.tripId, // tenant_id placeholder
        segment.segmentType,
        segment.startDatetime.toISOString(),
        segment.endDatetime.toISOString(),
        segment.origin,
        segment.destination,
        segment.status,
        segment.version,
        segment.createdAt.toISOString(),
        segment.updatedAt.toISOString(),
      ],
    );
  }
}

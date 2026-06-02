/**
 * PostgreSQL implementation of TripRepository.
 */

import type { Trip } from '../domain/trip.js';
import { Trip as TripEntity } from '../domain/trip.js';
import type { TripRepository } from '../repositories/interfaces.js';
import type { DatabaseClient } from './db-client.js';

interface TripRow {
  trip_id: string;
  tenant_id: string;
  corporate_id: string;
  traveller_id: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

function rowToEntity(row: TripRow): Trip {
  return TripEntity.create({
    tripId: row.trip_id,
    tenantId: row.tenant_id,
    corporateId: row.corporate_id,
    travellerId: row.traveller_id,
    startDate: row.start_date ? new Date(row.start_date) : null,
    endDate: row.end_date ? new Date(row.end_date) : null,
  });
}

export class PgTripRepository implements TripRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findById(tenantId: string, tripId: string): Promise<Trip | undefined> {
    const result = await this.db.query<TripRow>(
      'SELECT * FROM pnr_ingestion.trips WHERE tenant_id = $1 AND trip_id = $2',
      [tenantId, tripId],
    );
    const row = result.rows[0];
    return row ? rowToEntity(row) : undefined;
  }

  async findByTraveller(tenantId: string, travellerId: string): Promise<Trip[]> {
    const result = await this.db.query<TripRow>(
      'SELECT * FROM pnr_ingestion.trips WHERE tenant_id = $1 AND traveller_id = $2 ORDER BY start_date DESC',
      [tenantId, travellerId],
    );
    return result.rows.map(rowToEntity);
  }

  async findByTenant(tenantId: string): Promise<Trip[]> {
    const result = await this.db.query<TripRow>(
      'SELECT * FROM pnr_ingestion.trips WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId],
    );
    return result.rows.map(rowToEntity);
  }

  async save(trip: Trip): Promise<void> {
    await this.db.query(
      `INSERT INTO pnr_ingestion.trips (trip_id, tenant_id, corporate_id, traveller_id, status, start_date, end_date, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (trip_id) DO UPDATE SET
         status = EXCLUDED.status,
         start_date = EXCLUDED.start_date,
         end_date = EXCLUDED.end_date,
         updated_at = EXCLUDED.updated_at`,
      [
        trip.tripId,
        trip.tenantId,
        trip.corporateId,
        trip.travellerId,
        trip.status,
        trip.startDate?.toISOString() ?? null,
        trip.endDate?.toISOString() ?? null,
        trip.createdAt.toISOString(),
        trip.updatedAt.toISOString(),
      ],
    );
  }
}

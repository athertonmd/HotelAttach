/**
 * PostgreSQL implementation of PNRRepository.
 * Implements optimistic version checking per Approved Decision Q8.
 */

import type { PNR } from '../domain/pnr.js';
import { PNR as PNREntity } from '../domain/pnr.js';
import { type PNRRepository, VersionConflictError } from '../repositories/interfaces.js';
import type { DatabaseClient } from './db-client.js';

interface PNRRow {
  pnr_id: string;
  tenant_id: string;
  corporate_id: string;
  record_locator: string;
  source_system: string;
  booking_date: string;
  ticket_date: string | null;
  status: string;
  traveller_id: string;
  version: number;
  raw_pnr_ref: string | null;
  created_at: string;
  updated_at: string;
}

function rowToEntity(row: PNRRow): PNR {
  return PNREntity.create({
    pnrId: row.pnr_id,
    tenantId: row.tenant_id,
    corporateId: row.corporate_id,
    recordLocator: row.record_locator,
    sourceSystem: row.source_system,
    bookingDate: new Date(row.booking_date),
    ticketDate: row.ticket_date ? new Date(row.ticket_date) : null,
    travellerId: row.traveller_id,
    version: row.version,
    rawPnrRef: row.raw_pnr_ref,
  });
}

export class PgPNRRepository implements PNRRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findById(tenantId: string, pnrId: string): Promise<PNR | undefined> {
    const result = await this.db.query<PNRRow>(
      'SELECT * FROM pnr_ingestion.pnrs WHERE tenant_id = $1 AND pnr_id = $2',
      [tenantId, pnrId],
    );
    const row = result.rows[0];
    return row ? rowToEntity(row) : undefined;
  }

  async findByRecordLocator(tenantId: string, recordLocator: string): Promise<PNR | undefined> {
    const result = await this.db.query<PNRRow>(
      'SELECT * FROM pnr_ingestion.pnrs WHERE tenant_id = $1 AND record_locator = $2',
      [tenantId, recordLocator],
    );
    const row = result.rows[0];
    return row ? rowToEntity(row) : undefined;
  }

  async findByTenant(tenantId: string): Promise<PNR[]> {
    const result = await this.db.query<PNRRow>(
      'SELECT * FROM pnr_ingestion.pnrs WHERE tenant_id = $1 ORDER BY created_at DESC',
      [tenantId],
    );
    return result.rows.map(rowToEntity);
  }

  async findByTraveller(tenantId: string, travellerId: string): Promise<PNR[]> {
    const result = await this.db.query<PNRRow>(
      'SELECT * FROM pnr_ingestion.pnrs WHERE tenant_id = $1 AND traveller_id = $2 ORDER BY created_at DESC',
      [tenantId, travellerId],
    );
    return result.rows.map(rowToEntity);
  }

  async save(pnr: PNR, expectedVersion?: number): Promise<void> {
    if (expectedVersion !== undefined) {
      // Optimistic version check: only update if current version matches expected
      const result = await this.db.query(
        `UPDATE pnr_ingestion.pnrs SET
           record_locator = $3, source_system = $4, booking_date = $5, ticket_date = $6,
           status = $7, traveller_id = $8, version = $9, raw_pnr_ref = $10, updated_at = $11
         WHERE tenant_id = $1 AND pnr_id = $2 AND version = $12`,
        [
          pnr.tenantId,
          pnr.pnrId,
          pnr.recordLocator,
          pnr.sourceSystem,
          pnr.bookingDate.toISOString(),
          pnr.ticketDate?.toISOString() ?? null,
          pnr.status,
          pnr.travellerId,
          pnr.version,
          pnr.rawPnrRef,
          pnr.updatedAt.toISOString(),
          expectedVersion,
        ],
      );

      if (result.rowCount === 0) {
        // Either doesn't exist or version mismatch — check which
        const existing = await this.db.query<{ version: number }>(
          'SELECT version FROM pnr_ingestion.pnrs WHERE tenant_id = $1 AND pnr_id = $2',
          [pnr.tenantId, pnr.pnrId],
        );
        const existingRow = existing.rows[0];
        if (existingRow) {
          throw new VersionConflictError('PNR', pnr.pnrId, expectedVersion, existingRow.version);
        }
        // Doesn't exist — insert
        await this.insertPNR(pnr);
      }
    } else {
      // Upsert without version check
      await this.insertPNR(pnr);
    }
  }

  private async insertPNR(pnr: PNR): Promise<void> {
    await this.db.query(
      `INSERT INTO pnr_ingestion.pnrs (pnr_id, tenant_id, corporate_id, record_locator, source_system, booking_date, ticket_date, status, traveller_id, version, raw_pnr_ref, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (pnr_id) DO UPDATE SET
         record_locator = EXCLUDED.record_locator,
         source_system = EXCLUDED.source_system,
         booking_date = EXCLUDED.booking_date,
         ticket_date = EXCLUDED.ticket_date,
         status = EXCLUDED.status,
         traveller_id = EXCLUDED.traveller_id,
         version = EXCLUDED.version,
         raw_pnr_ref = EXCLUDED.raw_pnr_ref,
         updated_at = EXCLUDED.updated_at`,
      [
        pnr.pnrId,
        pnr.tenantId,
        pnr.corporateId,
        pnr.recordLocator,
        pnr.sourceSystem,
        pnr.bookingDate.toISOString(),
        pnr.ticketDate?.toISOString() ?? null,
        pnr.status,
        pnr.travellerId,
        pnr.version,
        pnr.rawPnrRef,
        pnr.createdAt.toISOString(),
        pnr.updatedAt.toISOString(),
      ],
    );
  }
}

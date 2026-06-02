/**
 * PostgreSQL implementation of TravellerRepository.
 * Uses parameterised queries with tenant_id filtering on all operations.
 */

import type { Traveller } from '../domain/traveller.js';
import { Traveller as TravellerEntity } from '../domain/traveller.js';
import type { TravellerRepository } from '../repositories/interfaces.js';
import type { DatabaseClient } from './db-client.js';

interface TravellerRow {
  traveller_id: string;
  tenant_id: string;
  corporate_id: string;
  employee_number: string | null;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string | null;
  cost_centre: string | null;
  country: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

function rowToEntity(row: TravellerRow): Traveller {
  return TravellerEntity.create({
    travellerId: row.traveller_id,
    tenantId: row.tenant_id,
    corporateId: row.corporate_id,
    employeeNumber: row.employee_number,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    mobile: row.mobile,
    costCentre: row.cost_centre,
    country: row.country,
  });
}

export class PgTravellerRepository implements TravellerRepository {
  constructor(private readonly db: DatabaseClient) {}

  async findById(tenantId: string, travellerId: string): Promise<Traveller | undefined> {
    const result = await this.db.query<TravellerRow>(
      'SELECT * FROM pnr_ingestion.travellers WHERE tenant_id = $1 AND traveller_id = $2',
      [tenantId, travellerId],
    );
    const row = result.rows[0];
    return row ? rowToEntity(row) : undefined;
  }

  async findByEmail(tenantId: string, email: string): Promise<Traveller | undefined> {
    const result = await this.db.query<TravellerRow>(
      'SELECT * FROM pnr_ingestion.travellers WHERE tenant_id = $1 AND email = $2',
      [tenantId, email],
    );
    const row = result.rows[0];
    return row ? rowToEntity(row) : undefined;
  }

  async findByTenant(tenantId: string): Promise<Traveller[]> {
    const result = await this.db.query<TravellerRow>(
      'SELECT * FROM pnr_ingestion.travellers WHERE tenant_id = $1 ORDER BY last_name, first_name',
      [tenantId],
    );
    return result.rows.map(rowToEntity);
  }

  async findByCorporate(tenantId: string, corporateId: string): Promise<Traveller[]> {
    const result = await this.db.query<TravellerRow>(
      'SELECT * FROM pnr_ingestion.travellers WHERE tenant_id = $1 AND corporate_id = $2 ORDER BY last_name, first_name',
      [tenantId, corporateId],
    );
    return result.rows.map(rowToEntity);
  }

  async save(traveller: Traveller): Promise<void> {
    await this.db.query(
      `INSERT INTO pnr_ingestion.travellers (traveller_id, tenant_id, corporate_id, employee_number, first_name, last_name, email, mobile, cost_centre, country, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (traveller_id) DO UPDATE SET
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         email = EXCLUDED.email,
         mobile = EXCLUDED.mobile,
         employee_number = EXCLUDED.employee_number,
         cost_centre = EXCLUDED.cost_centre,
         country = EXCLUDED.country,
         status = EXCLUDED.status,
         updated_at = EXCLUDED.updated_at`,
      [
        traveller.travellerId,
        traveller.tenantId,
        traveller.corporateId,
        traveller.employeeNumber,
        traveller.firstName,
        traveller.lastName,
        traveller.email,
        traveller.mobile,
        traveller.costCentre,
        traveller.country,
        traveller.status,
        traveller.createdAt.toISOString(),
        traveller.updatedAt.toISOString(),
      ],
    );
  }
}

import { describe, it, expect, vi } from 'vitest';
import type { DatabaseClient, QueryResult } from '../persistence/db-client.js';
import { VersionConflictError } from '../persistence/db-client.js';
import { PgOpportunityRepository } from '../persistence/pg-opportunity-repository.js';
import { Opportunity } from '../domain/opportunity.js';

const TENANT_A = 'tenant-aaa';
const TENANT_B = 'tenant-bbb';

function createMockDb(
  rows: unknown[] = [],
): DatabaseClient & { calls: { sql: string; params: unknown[] }[] } {
  const calls: { sql: string; params: unknown[] }[] = [];
  return {
    calls,
    query: vi.fn(async (sql: string, params: unknown[] = []) => {
      calls.push({ sql, params });
      return { rows, rowCount: rows.length } as QueryResult;
    }),
  };
}

function makeOpportunity(overrides: Record<string, unknown> = {}) {
  return Opportunity.create({
    tenantId: TENANT_A,
    corporateId: 'corp-001',
    travellerId: 'trav-001',
    tripId: 'trip-001',
    opportunityType: 'missing_hotel',
    score: 75,
    ...overrides,
  });
}

describe('PgOpportunityRepository', () => {
  it('findById includes tenant_id in query', async () => {
    const db = createMockDb();
    const repo = new PgOpportunityRepository(db);
    await repo.findById(TENANT_A, 'opp-001');
    expect(db.calls[0]?.sql).toContain('tenant_id = $1');
    expect(db.calls[0]?.params[0]).toBe(TENANT_A);
  });

  it('save includes tenant_id and version', async () => {
    const db = createMockDb([]);
    const repo = new PgOpportunityRepository(db);
    await repo.save(makeOpportunity());
    // First call: SELECT for version check, second: INSERT/UPSERT
    expect(db.calls.length).toBe(2);
    expect(db.calls[1]?.sql).toContain('opportunity_detection.opportunities');
    expect(db.calls[1]?.params).toContain(TENANT_A);
  });

  it('save throws VersionConflictError when existing version >= new version', async () => {
    const queryFn = vi.fn().mockResolvedValueOnce({ rows: [{ version: 5 }], rowCount: 1 });
    const db = createMockDb();
    db.query = queryFn;

    const repo = new PgOpportunityRepository(db);
    // Opportunity.create starts at version 1, which is < 5
    await expect(repo.save(makeOpportunity())).rejects.toThrow(VersionConflictError);
  });

  it('findByTravellerId includes tenant_id in query', async () => {
    const db = createMockDb();
    const repo = new PgOpportunityRepository(db);
    await repo.findByTravellerId(TENANT_A, 'trav-001');
    expect(db.calls[0]?.sql).toContain('tenant_id = $1');
    expect(db.calls[0]?.sql).toContain('traveller_id = $2');
    expect(db.calls[0]?.params[0]).toBe(TENANT_A);
    expect(db.calls[0]?.params[1]).toBe('trav-001');
  });

  it('findByTripId includes tenant_id in query', async () => {
    const db = createMockDb();
    const repo = new PgOpportunityRepository(db);
    await repo.findByTripId(TENANT_B, 'trip-001');
    expect(db.calls[0]?.sql).toContain('tenant_id = $1');
    expect(db.calls[0]?.sql).toContain('trip_id = $2');
    expect(db.calls[0]?.params[0]).toBe(TENANT_B);
    expect(db.calls[0]?.params[1]).toBe('trip-001');
  });

  it('findActiveByTraveller includes tenant_id and IN clause', async () => {
    const db = createMockDb();
    const repo = new PgOpportunityRepository(db);
    await repo.findActiveByTraveller(TENANT_A, 'trav-001');
    expect(db.calls[0]?.sql).toContain('tenant_id = $1');
    expect(db.calls[0]?.sql).toContain('traveller_id = $2');
    expect(db.calls[0]?.sql).toContain('lifecycle_state IN');
    expect(db.calls[0]?.params[0]).toBe(TENANT_A);
    expect(db.calls[0]?.params[1]).toBe('trav-001');
  });

  it('findByState includes tenant_id in query', async () => {
    const db = createMockDb();
    const repo = new PgOpportunityRepository(db);
    await repo.findByState(TENANT_A, 'detected');
    expect(db.calls[0]?.sql).toContain('tenant_id = $1');
    expect(db.calls[0]?.sql).toContain('lifecycle_state = $2');
    expect(db.calls[0]?.params[0]).toBe(TENANT_A);
    expect(db.calls[0]?.params[1]).toBe('detected');
  });

  it('findByType includes tenant_id in query', async () => {
    const db = createMockDb();
    const repo = new PgOpportunityRepository(db);
    await repo.findByType(TENANT_A, 'missing_hotel');
    expect(db.calls[0]?.sql).toContain('tenant_id = $1');
    expect(db.calls[0]?.sql).toContain('opportunity_type = $2');
    expect(db.calls[0]?.params[0]).toBe(TENANT_A);
    expect(db.calls[0]?.params[1]).toBe('missing_hotel');
  });

  it('remove includes tenant_id', async () => {
    const db = createMockDb();
    const repo = new PgOpportunityRepository(db);
    await repo.remove(TENANT_A, 'opp-001');
    expect(db.calls[0]?.sql).toContain('tenant_id = $1');
    expect(db.calls[0]?.sql).toContain('DELETE');
  });

  it('tenant isolation: different tenantId in findById', async () => {
    const db = createMockDb();
    const repo = new PgOpportunityRepository(db);
    await repo.findById(TENANT_B, 'opp-001');
    expect(db.calls[0]?.params[0]).toBe(TENANT_B);
  });
});

describe('SQL Migration', () => {
  it('migration file exists and creates correct schema', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const dir = dirname(fileURLToPath(import.meta.url));
    const sql = readFileSync(
      resolve(dir, '../persistence/migrations/001_create_tables.sql'),
      'utf-8',
    );
    expect(sql).toContain('CREATE SCHEMA IF NOT EXISTS opportunity_detection');
    expect(sql).toContain('opportunities');
    expect(sql).toContain('opportunity_assessments');
    expect(sql).toContain('opportunity_suppressions');
    expect(sql).toContain('opportunity_communications');
    expect(sql).toContain('opportunity_closures');
    expect(sql).toContain('opportunity_audit_entries');
    expect(sql).toContain('tenant_id UUID NOT NULL');
    expect(sql).toContain('version INTEGER NOT NULL DEFAULT 1');
    expect(sql).toContain('idx_opportunities_tenant');
    expect(sql).toContain('idx_suppressions_until');
  });
});

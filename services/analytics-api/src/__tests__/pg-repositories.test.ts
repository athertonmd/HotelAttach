/**
 * Mock-based PostgreSQL repository tests.
 * Validates that SQL queries enforce tenant isolation.
 */

import { describe, it, expect, vi } from 'vitest';
import type { DatabaseClient, QueryResult } from '../persistence/db-client.js';
import {
  PgProjectionCheckpointRepository,
  PgOpportunityPipelineRepository,
  PgDutyOfCareRepository,
} from '../persistence/pg-repositories.js';

const TENANT_A = 'tenant-aaa';

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

describe('PgOpportunityPipelineRepository', () => {
  it('upsert includes tenant_id', async () => {
    const db = createMockDb();
    const repo = new PgOpportunityPipelineRepository(db);
    await repo.upsert(TENANT_A, 'opp-001', {
      corporateId: 'corp-001',
      travellerId: 'trav-001',
      tripId: 'trip-001',
      opportunityType: 'missing_hotel',
      lifecycleState: 'detected',
      score: 85,
      priority: 'high',
      detectedAt: '2025-06-01T00:00:00Z',
    });
    expect(db.calls[0]!.sql).toContain('analytics.opportunity_pipeline');
    expect(db.calls[0]!.params[0]).toBe(TENANT_A);
    expect(db.calls[0]!.params[1]).toBe('opp-001');
  });

  it('findByState includes tenant_id in WHERE clause', async () => {
    const db = createMockDb();
    const repo = new PgOpportunityPipelineRepository(db);
    await repo.findByState(TENANT_A, 'detected');
    expect(db.calls[0]!.sql).toContain('tenant_id = $1');
    expect(db.calls[0]!.sql).toContain('lifecycle_state = $2');
    expect(db.calls[0]!.params[0]).toBe(TENANT_A);
    expect(db.calls[0]!.params[1]).toBe('detected');
  });

  it('findByPriority includes tenant_id in WHERE clause', async () => {
    const db = createMockDb();
    const repo = new PgOpportunityPipelineRepository(db);
    await repo.findByPriority(TENANT_A, 'high');
    expect(db.calls[0]!.sql).toContain('tenant_id = $1');
    expect(db.calls[0]!.sql).toContain('priority = $2');
    expect(db.calls[0]!.params[0]).toBe(TENANT_A);
    expect(db.calls[0]!.params[1]).toBe('high');
  });
});

describe('PgDutyOfCareRepository', () => {
  it('upsert includes tenant_id', async () => {
    const db = createMockDb();
    const repo = new PgDutyOfCareRepository(db);
    await repo.upsert(TENANT_A, 'trip-001', {
      corporateId: 'corp-001',
      travellerId: 'trav-001',
      destinationRiskLevel: 'high',
      isUnresolved: true,
    });
    expect(db.calls[0]!.sql).toContain('analytics.duty_of_care_trips');
    expect(db.calls[0]!.params[0]).toBe(TENANT_A);
    expect(db.calls[0]!.params[1]).toBe('trip-001');
  });

  it('findUnresolved includes tenant_id and is_unresolved filter', async () => {
    const db = createMockDb();
    const repo = new PgDutyOfCareRepository(db);
    await repo.findUnresolved(TENANT_A);
    expect(db.calls[0]!.sql).toContain('tenant_id = $1');
    expect(db.calls[0]!.sql).toContain('is_unresolved = TRUE');
    expect(db.calls[0]!.params[0]).toBe(TENANT_A);
  });
});

describe('PgProjectionCheckpointRepository', () => {
  it('updateCheckpoint upserts correctly', async () => {
    const db = createMockDb();
    const repo = new PgProjectionCheckpointRepository(db);
    const eventTimestamp = new Date('2025-06-01T12:00:00Z');
    await repo.updateCheckpoint('pipeline-projector', 'event-001', eventTimestamp);
    expect(db.calls[0]!.sql).toContain('analytics.projection_checkpoints');
    expect(db.calls[0]!.sql).toContain('ON CONFLICT');
    expect(db.calls[0]!.params[0]).toBe('pipeline-projector');
    expect(db.calls[0]!.params[1]).toBe('event-001');
  });

  it('getCheckpoint queries by projector_name', async () => {
    const db = createMockDb();
    const repo = new PgProjectionCheckpointRepository(db);
    await repo.getCheckpoint('pipeline-projector');
    expect(db.calls[0]!.sql).toContain('projector_name = $1');
    expect(db.calls[0]!.params[0]).toBe('pipeline-projector');
  });
});

describe('SQL Migration', () => {
  it('migration file exists', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const dir = dirname(fileURLToPath(import.meta.url));
    const sql = readFileSync(
      resolve(dir, '../persistence/migrations/001_create_phase1_tables.sql'),
      'utf-8',
    );
    expect(sql).toContain('CREATE SCHEMA IF NOT EXISTS analytics');
    expect(sql).toContain('opportunity_pipeline');
    expect(sql).toContain('duty_of_care_trips');
  });
});

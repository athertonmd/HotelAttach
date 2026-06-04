import { describe, it, expect, vi } from 'vitest';
import type { DatabaseClient, QueryResult } from '../persistence/db-client.js';
import { PgCommunicationRepository } from '../persistence/pg-communication-repository.js';
import { Communication } from '../domain/communication.js';

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

function makeCommunication(overrides: Record<string, unknown> = {}) {
  return Communication.create({
    tenantId: TENANT_A,
    corporateId: 'corp-001',
    travellerId: 'trav-001',
    opportunityId: 'opp-001',
    communicationType: 'initial_contact',
    channel: 'email',
    ...overrides,
  });
}

describe('PgCommunicationRepository', () => {
  it('findById includes tenant_id in query', async () => {
    const db = createMockDb();
    const repo = new PgCommunicationRepository(db);
    await repo.findById(TENANT_A, 'comm-001');
    expect(db.calls[0]?.sql).toContain('tenant_id = $1');
    expect(db.calls[0]?.sql).toContain('communication_id = $2');
    expect(db.calls[0]?.params[0]).toBe(TENANT_A);
    expect(db.calls[0]?.params[1]).toBe('comm-001');
  });

  it('findByOpportunityId includes tenant_id in query', async () => {
    const db = createMockDb();
    const repo = new PgCommunicationRepository(db);
    await repo.findByOpportunityId(TENANT_A, 'opp-001');
    expect(db.calls[0]?.sql).toContain('tenant_id = $1');
    expect(db.calls[0]?.sql).toContain('opportunity_id = $2');
    expect(db.calls[0]?.params[0]).toBe(TENANT_A);
    expect(db.calls[0]?.params[1]).toBe('opp-001');
  });

  it('findByTravellerId includes tenant_id in query', async () => {
    const db = createMockDb();
    const repo = new PgCommunicationRepository(db);
    await repo.findByTravellerId(TENANT_A, 'trav-001');
    expect(db.calls[0]?.sql).toContain('tenant_id = $1');
    expect(db.calls[0]?.sql).toContain('traveller_id = $2');
    expect(db.calls[0]?.params[0]).toBe(TENANT_A);
    expect(db.calls[0]?.params[1]).toBe('trav-001');
  });

  it('findScheduled includes tenant_id and status filter', async () => {
    const db = createMockDb();
    const repo = new PgCommunicationRepository(db);
    await repo.findScheduled(TENANT_A);
    expect(db.calls[0]?.sql).toContain('tenant_id = $1');
    expect(db.calls[0]?.sql).toContain("status = 'scheduled'");
    expect(db.calls[0]?.params[0]).toBe(TENANT_A);
  });

  it('save includes tenant_id in query', async () => {
    const db = createMockDb();
    const repo = new PgCommunicationRepository(db);
    const comm = makeCommunication();
    await repo.save(comm);
    expect(db.calls[0]?.sql).toContain('traveller_engagement.communications');
    expect(db.calls[0]?.params).toContain(TENANT_A);
  });

  it('save uses upsert with ON CONFLICT', async () => {
    const db = createMockDb();
    const repo = new PgCommunicationRepository(db);
    await repo.save(makeCommunication());
    expect(db.calls[0]?.sql).toContain('ON CONFLICT');
    expect(db.calls[0]?.sql).toContain('DO UPDATE SET');
  });

  it('tenant isolation: different tenantId in findById', async () => {
    const db = createMockDb();
    const repo = new PgCommunicationRepository(db);
    await repo.findById(TENANT_B, 'comm-001');
    expect(db.calls[0]?.params[0]).toBe(TENANT_B);
  });

  it('findById returns undefined when no rows', async () => {
    const db = createMockDb([]);
    const repo = new PgCommunicationRepository(db);
    const result = await repo.findById(TENANT_A, 'non-existent');
    expect(result).toBeUndefined();
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
    expect(sql).toContain('CREATE SCHEMA IF NOT EXISTS traveller_engagement');
    expect(sql).toContain('communications');
    expect(sql).toContain('traveller_actions');
    expect(sql).toContain('traveller_responses');
    expect(sql).toContain('booking_requests');
    expect(sql).toContain('agent_escalations');
    expect(sql).toContain('traveller_preferences');
    expect(sql).toContain('communication_audit_entries');
    expect(sql).toContain('tenant_id UUID NOT NULL');
    expect(sql).toContain('idx_communications_tenant');
    expect(sql).toContain('idx_actions_expires');
  });
});

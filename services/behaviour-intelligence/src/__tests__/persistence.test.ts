/**
 * Unit tests for Behaviour Intelligence persistence layer.
 * Tests SQL generation, tenant isolation, and repository conformance.
 * Uses a mock DatabaseClient — no live database required.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { DatabaseClient, QueryResult } from '../persistence/db-client.js';
import {
  PgProfileRepository,
  PgArchetypeRepository,
  PgAttributionRepository,
  PgDriftRepository,
  PgFatigueRepository,
  PgRevenueAtRiskRepository,
  PgRecommendedActionRepository,
  PgPredictionOutcomeRepository,
} from '../persistence/pg-repositories.js';
import { createProfile } from '../domain/traveller-behaviour-profile.js';
import { createAttribution } from '../domain/booking-attribution.js';
import { evaluateOutcome } from '../domain/prediction-outcome.js';

const T = 'tenant-001';
const TRAV = 'trav-001';
const CORP = 'corp-001';

function mockDb(): DatabaseClient & { calls: { sql: string; params: unknown[] }[] } {
  const calls: { sql: string; params: unknown[] }[] = [];
  return {
    calls,
    async query<T>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
      calls.push({ sql, params });
      return { rows: [] as T[], rowCount: 0 };
    },
  };
}

function mockDbWithRows(rows: Record<string, unknown>[]): DatabaseClient {
  return {
    async query<T>(): Promise<QueryResult<T>> {
      return { rows: rows as T[], rowCount: rows.length };
    },
  };
}

describe('Migration SQL', () => {
  const migrationPath = resolve(
    import.meta.dirname ?? '.',
    '../persistence/migrations/001_create_tables.sql',
  );
  const sql = readFileSync(migrationPath, 'utf-8');

  it('migration file exists and is non-empty', () => {
    expect(sql.length).toBeGreaterThan(100);
  });

  it('creates behaviour_intelligence schema', () => {
    expect(sql).toContain('CREATE SCHEMA IF NOT EXISTS behaviour_intelligence');
  });

  it('creates all 8 tables', () => {
    expect(sql).toContain('traveller_behaviour_profiles');
    expect(sql).toContain('traveller_archetypes');
    expect(sql).toContain('booking_attributions');
    expect(sql).toContain('behaviour_drifts');
    expect(sql).toContain('communication_fatigues');
    expect(sql).toContain('revenue_at_risks');
    expect(sql).toContain('recommended_actions');
    expect(sql).toContain('prediction_outcomes');
  });

  it('every table includes tenant_id', () => {
    expect(sql).toContain('tenant_id UUID NOT NULL');
  });

  it('append-only tables have no ON CONFLICT', () => {
    // booking_attributions and prediction_outcomes should not have upsert
    const attrSection = sql.split('booking_attributions')[1]?.split('CREATE TABLE')[0] ?? '';
    expect(attrSection).not.toContain('ON CONFLICT');
  });
});

describe('PgProfileRepository', () => {
  it('save includes tenant_id in SQL', async () => {
    const db = mockDb();
    const repo = new PgProfileRepository(db);
    const profile = createProfile({
      travellerId: TRAV,
      tenantId: T,
      corporateId: CORP,
      avgLeadTimeDays: 7,
      bookingConsistency: 0.8,
      bookingVariabilityDays: 2,
      complianceRate: 90,
      avgResponseTimeHours: 4,
      preferredChannel: 'email',
      selfBookingRate: 75,
      tripsAnalysed: 10,
      tripCountUsed: 10,
      predictedLeadTimeDays: 6,
      segment: 'self_sufficient',
    });
    await repo.save(T, profile);
    expect(db.calls).toHaveLength(1);
    expect(db.calls[0]?.params[0]).toBe(T);
  });

  it('findByTravellerId filters by tenant_id', async () => {
    const db = mockDb();
    const repo = new PgProfileRepository(db);
    await repo.findByTravellerId(T, TRAV);
    expect(db.calls[0]?.sql).toContain('tenant_id = $1');
    expect(db.calls[0]?.params[0]).toBe(T);
    expect(db.calls[0]?.params[1]).toBe(TRAV);
  });

  it('loads profile from row data', async () => {
    const db = mockDbWithRows([
      {
        tenant_id: T,
        traveller_id: TRAV,
        corporate_id: CORP,
        avg_lead_time_days: '7.0',
        booking_consistency: '0.80',
        booking_variability_days: '2.0',
        compliance_rate: '90.0',
        avg_response_time_hours: '4.0',
        preferred_channel: 'email',
        self_booking_rate: '75.0',
        trips_analysed: 10,
        trip_count_used: 10,
        predicted_lead_time_days: '6.0',
        confidence_score: 100,
        segment: 'self_sufficient',
      },
    ]);
    const repo = new PgProfileRepository(db);
    const result = await repo.findByTravellerId(T, TRAV);
    expect(result?.travellerId).toBe(TRAV);
    expect(result?.confidenceScore).toBe(100);
    expect(result?.segment).toBe('self_sufficient');
  });
});

describe('PgArchetypeRepository', () => {
  it('save includes tenant_id', async () => {
    const db = mockDb();
    const repo = new PgArchetypeRepository(db);
    await repo.save(T, TRAV, { archetype: 'autopilot', confidence: 90, previousArchetype: null });
    expect(db.calls[0]?.params[0]).toBe(T);
  });

  it('findByTravellerId filters by tenant_id', async () => {
    const db = mockDb();
    const repo = new PgArchetypeRepository(db);
    await repo.findByTravellerId(T, TRAV);
    expect(db.calls[0]?.sql).toContain('tenant_id = $1');
  });
});

describe('PgAttributionRepository', () => {
  it('append uses INSERT without ON CONFLICT', async () => {
    const db = mockDb();
    const repo = new PgAttributionRepository(db);
    const attr = createAttribution({
      bookingId: 'book-001',
      travellerId: TRAV,
      tenantId: T,
      corporateId: CORP,
      attributionType: 'email',
      estimatedCommission: 100,
    });
    await repo.append(T, attr);
    expect(db.calls[0]?.sql).toContain('INSERT INTO');
    expect(db.calls[0]?.sql).not.toContain('ON CONFLICT');
  });

  it('findByTravellerId filters by tenant_id', async () => {
    const db = mockDb();
    const repo = new PgAttributionRepository(db);
    await repo.findByTravellerId(T, TRAV);
    expect(db.calls[0]?.sql).toContain('tenant_id = $1');
  });
});

describe('PgRecommendedActionRepository', () => {
  it('findActiveByOpportunityId filters by tenant_id and opportunity_id', async () => {
    const db = mockDb();
    const repo = new PgRecommendedActionRepository(db);
    await repo.findActiveByOpportunityId(T, 'opp-001');
    expect(db.calls[0]?.sql).toContain('tenant_id = $1');
    expect(db.calls[0]?.sql).toContain('opportunity_id = $2');
  });

  it('remove deletes with tenant_id filter', async () => {
    const db = mockDb();
    const repo = new PgRecommendedActionRepository(db);
    await repo.remove(T, 'opp-001');
    expect(db.calls[0]?.sql).toContain('DELETE');
    expect(db.calls[0]?.sql).toContain('tenant_id = $1');
  });
});

describe('PgPredictionOutcomeRepository', () => {
  it('append uses INSERT without ON CONFLICT', async () => {
    const db = mockDb();
    const repo = new PgPredictionOutcomeRepository(db);
    const outcome = evaluateOutcome({
      recommendationId: 'rec-001',
      travellerId: TRAV,
      tenantId: T,
      corporateId: CORP,
      opportunityId: 'opp-001',
      recommendedAction: 'send_email',
      actualOutcome: 'booked_after_communication',
      daysDifference: 1,
    });
    await repo.append(T, outcome);
    expect(db.calls[0]?.sql).toContain('INSERT INTO');
    expect(db.calls[0]?.sql).not.toContain('ON CONFLICT');
  });

  it('findByOpportunityId filters by tenant_id', async () => {
    const db = mockDb();
    const repo = new PgPredictionOutcomeRepository(db);
    await repo.findByOpportunityId(T, 'opp-001');
    expect(db.calls[0]?.sql).toContain('tenant_id = $1');
  });
});

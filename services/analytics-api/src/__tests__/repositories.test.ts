/**
 * Unit tests for in-memory repository implementations.
 * Validates tenant isolation, filtering, upsert semantics, and checkpoint tracking.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryProjectionCheckpointRepository,
  InMemoryOpportunityPipelineRepository,
  InMemoryDutyOfCareRepository,
  InMemoryEngagementFunnelRepository,
  InMemoryAgentEscalationAnalyticsRepository,
} from '../repositories/in-memory.js';

const TENANT_A = 'tenant-aaa';
const TENANT_B = 'tenant-bbb';

describe('InMemoryProjectionCheckpointRepository', () => {
  let repo: InMemoryProjectionCheckpointRepository;

  beforeEach(() => {
    repo = new InMemoryProjectionCheckpointRepository();
  });

  it('save and retrieve checkpoint', async () => {
    const eventTimestamp = new Date('2025-06-01T12:00:00Z');
    await repo.updateCheckpoint('pipeline-projector', 'event-001', eventTimestamp);

    const checkpoint = await repo.getCheckpoint('pipeline-projector');
    expect(checkpoint).toBeDefined();
    expect(checkpoint!.lastEventId).toBe('event-001');
    expect(checkpoint!.lastEventTimestamp).toEqual(eventTimestamp);
    expect(checkpoint!.eventsProcessedCount).toBe(1);
  });

  it('returns undefined for unknown projector', async () => {
    const checkpoint = await repo.getCheckpoint('unknown-projector');
    expect(checkpoint).toBeUndefined();
  });

  it('increments event count on subsequent updates', async () => {
    await repo.updateCheckpoint('projector-a', 'event-001', new Date('2025-06-01'));
    await repo.updateCheckpoint('projector-a', 'event-002', new Date('2025-06-02'));
    await repo.updateCheckpoint('projector-a', 'event-003', new Date('2025-06-03'));

    const checkpoint = await repo.getCheckpoint('projector-a');
    expect(checkpoint!.eventsProcessedCount).toBe(3);
    expect(checkpoint!.lastEventId).toBe('event-003');
  });
});

describe('InMemoryOpportunityPipelineRepository', () => {
  let repo: InMemoryOpportunityPipelineRepository;

  beforeEach(() => {
    repo = new InMemoryOpportunityPipelineRepository();
  });

  it('upsert creates new row', async () => {
    await repo.upsert(TENANT_A, 'opp-001', {
      lifecycleState: 'detected',
      priority: 'high',
      score: 85,
    });

    const results = await repo.findByTenant(TENANT_A);
    expect(results).toHaveLength(1);
    expect(results[0]!['opportunityId']).toBe('opp-001');
    expect(results[0]!['lifecycleState']).toBe('detected');
  });

  it('upsert updates existing (idempotent)', async () => {
    await repo.upsert(TENANT_A, 'opp-001', {
      lifecycleState: 'detected',
      priority: 'high',
      score: 85,
    });
    await repo.upsert(TENANT_A, 'opp-001', {
      lifecycleState: 'qualified',
      priority: 'critical',
      score: 95,
    });

    const results = await repo.findByTenant(TENANT_A);
    expect(results).toHaveLength(1);
    expect(results[0]!['lifecycleState']).toBe('qualified');
    expect(results[0]!['priority']).toBe('critical');
  });

  it('tenant isolation: tenant A cannot see tenant B data', async () => {
    await repo.upsert(TENANT_A, 'opp-001', { lifecycleState: 'detected', priority: 'high' });
    await repo.upsert(TENANT_B, 'opp-002', { lifecycleState: 'detected', priority: 'medium' });

    const resultsA = await repo.findByTenant(TENANT_A);
    const resultsB = await repo.findByTenant(TENANT_B);

    expect(resultsA).toHaveLength(1);
    expect(resultsA[0]!['opportunityId']).toBe('opp-001');
    expect(resultsB).toHaveLength(1);
    expect(resultsB[0]!['opportunityId']).toBe('opp-002');
  });

  it('findByState filters correctly', async () => {
    await repo.upsert(TENANT_A, 'opp-001', { lifecycleState: 'detected', priority: 'high' });
    await repo.upsert(TENANT_A, 'opp-002', { lifecycleState: 'qualified', priority: 'medium' });
    await repo.upsert(TENANT_A, 'opp-003', { lifecycleState: 'detected', priority: 'low' });

    const detected = await repo.findByState(TENANT_A, 'detected');
    expect(detected).toHaveLength(2);
    expect(detected.every((r) => r['lifecycleState'] === 'detected')).toBe(true);
  });

  it('findByPriority filters correctly', async () => {
    await repo.upsert(TENANT_A, 'opp-001', { lifecycleState: 'detected', priority: 'high' });
    await repo.upsert(TENANT_A, 'opp-002', { lifecycleState: 'qualified', priority: 'high' });
    await repo.upsert(TENANT_A, 'opp-003', { lifecycleState: 'detected', priority: 'low' });

    const high = await repo.findByPriority(TENANT_A, 'high');
    expect(high).toHaveLength(2);
    expect(high.every((r) => r['priority'] === 'high')).toBe(true);
  });
});

describe('InMemoryDutyOfCareRepository', () => {
  let repo: InMemoryDutyOfCareRepository;

  beforeEach(() => {
    repo = new InMemoryDutyOfCareRepository();
  });

  it('upsert and findUnresolved', async () => {
    await repo.upsert(TENANT_A, 'trip-001', { isUnresolved: true, destinationRiskLevel: 'high' });
    await repo.upsert(TENANT_A, 'trip-002', {
      isUnresolved: false,
      destinationRiskLevel: 'standard',
    });

    const unresolved = await repo.findUnresolved(TENANT_A);
    expect(unresolved).toHaveLength(1);
    expect(unresolved[0]!['tripId']).toBe('trip-001');
  });

  it('tenant isolation', async () => {
    await repo.upsert(TENANT_A, 'trip-001', { isUnresolved: true });
    await repo.upsert(TENANT_B, 'trip-002', { isUnresolved: true });

    const resultsA = await repo.findByTenant(TENANT_A);
    expect(resultsA).toHaveLength(1);
    expect(resultsA[0]!['tripId']).toBe('trip-001');

    const resultsB = await repo.findByTenant(TENANT_B);
    expect(resultsB).toHaveLength(1);
    expect(resultsB[0]!['tripId']).toBe('trip-002');
  });

  it('upsert updates existing trip data', async () => {
    await repo.upsert(TENANT_A, 'trip-001', { isUnresolved: true, destinationRiskLevel: 'high' });
    await repo.upsert(TENANT_A, 'trip-001', {
      isUnresolved: false,
      destinationRiskLevel: 'standard',
    });

    const all = await repo.findByTenant(TENANT_A);
    expect(all).toHaveLength(1);
    expect(all[0]!['isUnresolved']).toBe(false);

    const unresolved = await repo.findUnresolved(TENANT_A);
    expect(unresolved).toHaveLength(0);
  });
});

describe('InMemoryEngagementFunnelRepository', () => {
  let repo: InMemoryEngagementFunnelRepository;

  beforeEach(() => {
    repo = new InMemoryEngagementFunnelRepository();
  });

  it('upsert by period and retrieve', async () => {
    const periodStart = new Date('2025-06-02');
    await repo.upsert(TENANT_A, 'corp-001', periodStart, {
      communicationsSent: 10,
      responsesReceived: 5,
    });

    const results = await repo.findByPeriod(TENANT_A, periodStart);
    expect(results).toHaveLength(1);
    expect(results[0]!['communicationsSent']).toBe(10);
  });

  it('tenant isolation', async () => {
    const periodStart = new Date('2025-06-02');
    await repo.upsert(TENANT_A, 'corp-001', periodStart, { communicationsSent: 10 });
    await repo.upsert(TENANT_B, 'corp-001', periodStart, { communicationsSent: 20 });

    const resultsA = await repo.findByPeriod(TENANT_A, periodStart);
    expect(resultsA).toHaveLength(1);
    expect(resultsA[0]!['communicationsSent']).toBe(10);

    const resultsB = await repo.findByPeriod(TENANT_B, periodStart);
    expect(resultsB).toHaveLength(1);
    expect(resultsB[0]!['communicationsSent']).toBe(20);
  });

  it('upsert updates existing period data', async () => {
    const periodStart = new Date('2025-06-02');
    await repo.upsert(TENANT_A, 'corp-001', periodStart, { communicationsSent: 10 });
    await repo.upsert(TENANT_A, 'corp-001', periodStart, { communicationsSent: 15 });

    const results = await repo.findByPeriod(TENANT_A, periodStart);
    expect(results).toHaveLength(1);
    expect(results[0]!['communicationsSent']).toBe(15);
  });
});

describe('InMemoryAgentEscalationAnalyticsRepository', () => {
  let repo: InMemoryAgentEscalationAnalyticsRepository;

  beforeEach(() => {
    repo = new InMemoryAgentEscalationAnalyticsRepository();
  });

  it('upsert and findPending', async () => {
    await repo.upsert(TENANT_A, 'esc-001', { status: 'pending', priority: 'high' });
    await repo.upsert(TENANT_A, 'esc-002', { status: 'resolved', priority: 'medium' });

    const pending = await repo.findPending(TENANT_A);
    expect(pending).toHaveLength(1);
    expect(pending[0]!['escalationId']).toBe('esc-001');
  });

  it('tenant isolation', async () => {
    await repo.upsert(TENANT_A, 'esc-001', { status: 'pending', priority: 'high' });
    await repo.upsert(TENANT_B, 'esc-002', { status: 'pending', priority: 'medium' });

    const resultsA = await repo.findByTenant(TENANT_A);
    expect(resultsA).toHaveLength(1);
    expect(resultsA[0]!['escalationId']).toBe('esc-001');

    const resultsB = await repo.findByTenant(TENANT_B);
    expect(resultsB).toHaveLength(1);
    expect(resultsB[0]!['escalationId']).toBe('esc-002');
  });

  it('upsert updates existing escalation', async () => {
    await repo.upsert(TENANT_A, 'esc-001', { status: 'pending', priority: 'high' });
    await repo.upsert(TENANT_A, 'esc-001', { status: 'resolved', priority: 'high' });

    const pending = await repo.findPending(TENANT_A);
    expect(pending).toHaveLength(0);

    const all = await repo.findByTenant(TENANT_A);
    expect(all).toHaveLength(1);
    expect(all[0]!['status']).toBe('resolved');
  });
});

describe('SQL Migration', () => {
  it('migration file exists and creates correct schema', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve, dirname } = await import('node:path');
    const { fileURLToPath } = await import('node:url');
    const dir = dirname(fileURLToPath(import.meta.url));
    const sql = readFileSync(
      resolve(dir, '../persistence/migrations/001_create_phase1_tables.sql'),
      'utf-8',
    );
    expect(sql).toContain('CREATE SCHEMA IF NOT EXISTS analytics');
    expect(sql).toContain('projection_checkpoints');
    expect(sql).toContain('opportunity_pipeline');
    expect(sql).toContain('duty_of_care_trips');
    expect(sql).toContain('engagement_funnel_weekly');
    expect(sql).toContain('agent_escalations');
    expect(sql).toContain('tenant_id UUID NOT NULL');
    expect(sql).toContain('idx_pipeline_state');
    expect(sql).toContain('idx_doc_unresolved');
    expect(sql).toContain('idx_esc_status');
  });
});

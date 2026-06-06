/**
 * Unit tests for Behaviour Intelligence API handlers.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  handleGetBehaviourOverview,
  handleGetArchetypes,
  handleGetFatigue,
  handleGetRevenueRisk,
  handleGetActionPerformance,
  handleGetPredictionAccuracy,
} from '../api/behaviour-controller.js';
import type { RequestContext, QueryParams } from '../api/request-context.js';
import type { QueryServiceDeps } from '../queries/behaviour-query-service.js';
import {
  InMemoryBehaviourOverviewRepo,
  InMemoryArchetypeDistributionRepo,
  InMemoryFatigueMonitoringRepo,
  InMemoryRevenueRiskMonitoringRepo,
  InMemoryActionPerformanceRepo,
  InMemoryPredictionAccuracyRepo,
} from '../projections/in-memory-projections.js';

const T = 'tenant-001';
const C = 'corp-001';
const CORR = 'corr-api-001';

function buildDeps(): QueryServiceDeps {
  return {
    overviewRepo: new InMemoryBehaviourOverviewRepo(),
    archetypeDistRepo: new InMemoryArchetypeDistributionRepo(),
    fatigueRepo: new InMemoryFatigueMonitoringRepo(),
    revenueRiskRepo: new InMemoryRevenueRiskMonitoringRepo(),
    actionPerfRepo: new InMemoryActionPerformanceRepo(),
    predictionAccRepo: new InMemoryPredictionAccuracyRepo(),
  };
}

function ctx(overrides: Partial<RequestContext> = {}): RequestContext {
  return { tenantId: T, corporateId: C, correlationId: CORR, ...overrides };
}

function params(overrides: Partial<QueryParams> = {}): QueryParams {
  return { ...overrides };
}

describe('handleGetBehaviourOverview', () => {
  it('returns success with data', async () => {
    const deps = buildDeps();
    await deps.overviewRepo.upsert(T, {
      tenantId: T,
      corporateId: C,
      travellerId: 'trav-1',
      segment: 'self_sufficient',
      archetype: 'autopilot',
      confidenceScore: 90,
      fatigueLevel: 'low',
      driftStatus: 'stable',
      riskTier: null,
      lastUpdatedAt: '',
    });
    const result = await handleGetBehaviourOverview(ctx(), params(), deps);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalTravellers).toBe(1);
      expect(result.correlationId).toBe(CORR);
    }
  });

  it('returns UNAUTHORIZED when tenantId missing', async () => {
    const deps = buildDeps();
    const result = await handleGetBehaviourOverview(ctx({ tenantId: '' }), params(), deps);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('UNAUTHORIZED');
  });

  it('returns BAD_REQUEST when corporateId missing', async () => {
    const deps = buildDeps();
    const result = await handleGetBehaviourOverview(
      { tenantId: T, correlationId: CORR },
      params(),
      deps,
    );
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('BAD_REQUEST');
  });

  it('corporateId from params overrides context', async () => {
    const deps = buildDeps();
    await deps.overviewRepo.upsert(T, {
      tenantId: T,
      corporateId: 'other-corp',
      travellerId: 'trav-1',
      segment: 'reliable_late',
      archetype: null,
      confidenceScore: 70,
      fatigueLevel: 'low',
      driftStatus: 'stable',
      riskTier: null,
      lastUpdatedAt: '',
    });
    const result = await handleGetBehaviourOverview(
      ctx(),
      params({ corporateId: 'other-corp' }),
      deps,
    );
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.totalTravellers).toBe(1);
  });
});

describe('handleGetArchetypes', () => {
  it('returns success', async () => {
    const deps = buildDeps();
    const result = await handleGetArchetypes(ctx(), params(), deps);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.total).toBe(0);
  });
});

describe('handleGetFatigue', () => {
  it('returns success with pagination', async () => {
    const deps = buildDeps();
    const result = await handleGetFatigue(ctx(), params({ page: '1', pageSize: '10' }), deps);
    expect(result.success).toBe(true);
  });

  it('returns BAD_REQUEST for invalid page', async () => {
    const deps = buildDeps();
    const result = await handleGetFatigue(ctx(), params({ page: '-1' }), deps);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('BAD_REQUEST');
  });

  it('returns BAD_REQUEST for invalid pageSize', async () => {
    const deps = buildDeps();
    const result = await handleGetFatigue(ctx(), params({ pageSize: '0' }), deps);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('BAD_REQUEST');
  });

  it('returns BAD_REQUEST for pageSize over 100', async () => {
    const deps = buildDeps();
    const result = await handleGetFatigue(ctx(), params({ pageSize: '200' }), deps);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('BAD_REQUEST');
  });
});

describe('handleGetRevenueRisk', () => {
  it('returns success', async () => {
    const deps = buildDeps();
    const result = await handleGetRevenueRisk(ctx(), params(), deps);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.totalRevenueAtRisk).toBe(0);
  });
});

describe('handleGetActionPerformance', () => {
  it('returns success', async () => {
    const deps = buildDeps();
    const result = await handleGetActionPerformance(ctx(), params(), deps);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.totalRecommendations).toBe(0);
  });
});

describe('handleGetPredictionAccuracy', () => {
  it('returns success', async () => {
    const deps = buildDeps();
    const result = await handleGetPredictionAccuracy(ctx(), params(), deps);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.overallAccuracy).toBe(0);
  });

  it('includes correlationId in response', async () => {
    const deps = buildDeps();
    const result = await handleGetPredictionAccuracy(ctx(), params(), deps);
    expect(result.correlationId).toBe(CORR);
  });
});

/**
 * Unit tests for Behaviour Intelligence Query Service.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getBehaviourOverviewSummary,
  getArchetypeDistribution,
  getFatigueSummary,
  getRevenueRiskSummary,
  getActionPerformanceSummary,
  getPredictionAccuracySummary,
} from '../queries/behaviour-query-service.js';
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

describe('getBehaviourOverviewSummary', () => {
  it('returns empty state safely', async () => {
    const deps = buildDeps();
    const result = await getBehaviourOverviewSummary({ tenantId: T, corporateId: C }, deps);
    expect(result.totalTravellers).toBe(0);
    expect(result.averageConfidence).toBe(0);
    expect(result.highFatigueCount).toBe(0);
  });

  it('aggregates overview data', async () => {
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
    await deps.overviewRepo.upsert(T, {
      tenantId: T,
      corporateId: C,
      travellerId: 'trav-2',
      segment: 'needs_prompting',
      archetype: 'nudge_needer',
      confidenceScore: 70,
      fatigueLevel: 'high',
      driftStatus: 'significant',
      riskTier: 'at_risk',
      lastUpdatedAt: '',
    });
    const result = await getBehaviourOverviewSummary({ tenantId: T, corporateId: C }, deps);
    expect(result.totalTravellers).toBe(2);
    expect(result.averageConfidence).toBe(80);
    expect(result.highFatigueCount).toBe(1);
    expect(result.significantDriftCount).toBe(1);
    expect(result.archetypeDistribution['autopilot']).toBe(1);
    expect(result.segmentDistribution['self_sufficient']).toBe(1);
  });

  it('tenant isolation: different tenant sees nothing', async () => {
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
    const result = await getBehaviourOverviewSummary(
      { tenantId: 'other-tenant', corporateId: C },
      deps,
    );
    expect(result.totalTravellers).toBe(0);
  });
});

describe('getArchetypeDistribution', () => {
  it('returns empty state', async () => {
    const deps = buildDeps();
    const result = await getArchetypeDistribution({ tenantId: T, corporateId: C }, deps);
    expect(result.total).toBe(0);
    expect(result.distribution).toHaveLength(0);
  });

  it('returns distribution breakdown', async () => {
    const deps = buildDeps();
    await deps.archetypeDistRepo.upsert(T, {
      tenantId: T,
      corporateId: C,
      archetype: 'autopilot',
      count: 5,
      lastUpdatedAt: '',
    });
    await deps.archetypeDistRepo.upsert(T, {
      tenantId: T,
      corporateId: C,
      archetype: 'procrastinator',
      count: 3,
      lastUpdatedAt: '',
    });
    const result = await getArchetypeDistribution({ tenantId: T, corporateId: C }, deps);
    expect(result.total).toBe(8);
    expect(result.distribution).toHaveLength(2);
  });
});

describe('getFatigueSummary', () => {
  it('returns empty state', async () => {
    const deps = buildDeps();
    const result = await getFatigueSummary({ tenantId: T, corporateId: C }, deps);
    expect(result.distribution.low).toBe(0);
    expect(result.highCriticalTravellers).toHaveLength(0);
    expect(result.totalSuppressions).toBe(0);
  });

  it('returns fatigue distribution and high/critical list', async () => {
    const deps = buildDeps();
    await deps.fatigueRepo.upsert(T, {
      tenantId: T,
      corporateId: C,
      travellerId: 'trav-1',
      fatigueScore: 20,
      fatigueLevel: 'low',
      comms30d: 3,
      suppressionCount: 0,
      lastUpdatedAt: '',
    });
    await deps.fatigueRepo.upsert(T, {
      tenantId: T,
      corporateId: C,
      travellerId: 'trav-2',
      fatigueScore: 75,
      fatigueLevel: 'high',
      comms30d: 12,
      suppressionCount: 3,
      lastUpdatedAt: '',
    });
    const result = await getFatigueSummary({ tenantId: T, corporateId: C }, deps);
    expect(result.distribution.low).toBe(1);
    expect(result.distribution.high).toBe(1);
    expect(result.highCriticalTravellers).toHaveLength(1);
    expect(result.totalSuppressions).toBe(3);
  });

  it('supports pagination', async () => {
    const deps = buildDeps();
    for (let i = 0; i < 5; i++) {
      await deps.fatigueRepo.upsert(T, {
        tenantId: T,
        corporateId: C,
        travellerId: `trav-${i}`,
        fatigueScore: 70 + i,
        fatigueLevel: 'high',
        comms30d: 10,
        suppressionCount: 0,
        lastUpdatedAt: '',
      });
    }
    const page1 = await getFatigueSummary(
      { tenantId: T, corporateId: C, page: 1, pageSize: 2 },
      deps,
    );
    expect(page1.highCriticalTravellers).toHaveLength(2);
    const page2 = await getFatigueSummary(
      { tenantId: T, corporateId: C, page: 2, pageSize: 2 },
      deps,
    );
    expect(page2.highCriticalTravellers).toHaveLength(2);
  });
});

describe('getRevenueRiskSummary', () => {
  it('returns empty state', async () => {
    const deps = buildDeps();
    const result = await getRevenueRiskSummary({ tenantId: T, corporateId: C }, deps);
    expect(result.totalRevenueAtRisk).toBe(0);
    expect(result.highestRiskTravellers).toHaveLength(0);
  });

  it('aggregates revenue at risk', async () => {
    const deps = buildDeps();
    await deps.revenueRiskRepo.upsert(T, {
      tenantId: T,
      corporateId: C,
      travellerId: 'trav-1',
      revenueAtRisk: 100,
      riskTier: 'at_risk',
      estimatedCommission: 200,
      lastUpdatedAt: '',
    });
    await deps.revenueRiskRepo.upsert(T, {
      tenantId: T,
      corporateId: C,
      travellerId: 'trav-2',
      revenueAtRisk: 50,
      riskTier: 'uncertain',
      estimatedCommission: 150,
      lastUpdatedAt: '',
    });
    const result = await getRevenueRiskSummary({ tenantId: T, corporateId: C }, deps);
    expect(result.totalRevenueAtRisk).toBe(150);
    expect(result.highestRiskTravellers[0]?.travellerId).toBe('trav-1');
    expect(result.byRiskTier['at_risk']).toBe(1);
  });
});

describe('getActionPerformanceSummary', () => {
  it('returns empty state with zero division safety', async () => {
    const deps = buildDeps();
    const result = await getActionPerformanceSummary({ tenantId: T, corporateId: C }, deps);
    expect(result.overallAccuracy).toBe(0);
    expect(result.totalRecommendations).toBe(0);
  });

  it('aggregates action performance', async () => {
    const deps = buildDeps();
    await deps.actionPerfRepo.upsert(T, {
      tenantId: T,
      corporateId: C,
      action: 'send_email',
      totalRecommended: 10,
      totalCorrect: 7,
      accuracyRate: 70,
      lastUpdatedAt: '',
    });
    await deps.actionPerfRepo.upsert(T, {
      tenantId: T,
      corporateId: C,
      action: 'escalate',
      totalRecommended: 5,
      totalCorrect: 4,
      accuracyRate: 80,
      lastUpdatedAt: '',
    });
    const result = await getActionPerformanceSummary({ tenantId: T, corporateId: C }, deps);
    expect(result.totalRecommendations).toBe(15);
    expect(result.overallAccuracy).toBe(73); // 11/15 = 73.3 → 73
    expect(result.actions).toHaveLength(2);
  });
});

describe('getPredictionAccuracySummary', () => {
  it('returns empty state', async () => {
    const deps = buildDeps();
    const result = await getPredictionAccuracySummary({ tenantId: T, corporateId: C }, deps);
    expect(result.overallAccuracy).toBe(0);
    expect(result.totalPredictions).toBe(0);
  });

  it('returns accuracy summary', async () => {
    const deps = buildDeps();
    await deps.predictionAccRepo.upsert(T, {
      tenantId: T,
      corporateId: C,
      totalPredictions: 20,
      correctPredictions: 15,
      accuracyRate: 75,
      avgDaysDifference: 2.5,
      lastUpdatedAt: '',
    });
    const result = await getPredictionAccuracySummary({ tenantId: T, corporateId: C }, deps);
    expect(result.overallAccuracy).toBe(75);
    expect(result.totalPredictions).toBe(20);
    expect(result.avgDaysDifference).toBe(2.5);
  });
});

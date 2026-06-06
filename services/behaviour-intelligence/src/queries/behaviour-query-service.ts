/**
 * Behaviour Intelligence Query Service.
 * Provides dashboard query functions over projection read models.
 * All queries require tenantId for tenant isolation.
 */

import type {
  BehaviourOverviewRepository,
  ArchetypeDistributionRepository,
  FatigueMonitoringRepository,
  RevenueRiskMonitoringRepository,
  ActionPerformanceRepository,
  PredictionAccuracyRepository,
} from '../projections/projection-repositories.js';
import type { ArchetypeType, FatigueLevel } from '../domain/enums.js';

// ─── Query Input ────────────────────────────────────────────────────────────

export interface QueryInput {
  tenantId: string;
  corporateId: string;
  page?: number;
  pageSize?: number;
}

// ─── Response Types ─────────────────────────────────────────────────────────

export interface BehaviourOverviewSummary {
  totalTravellers: number;
  archetypeDistribution: Record<string, number>;
  segmentDistribution: Record<string, number>;
  averageConfidence: number;
  highFatigueCount: number;
  significantDriftCount: number;
}

export interface ArchetypeDistributionSummary {
  distribution: { archetype: ArchetypeType; count: number }[];
  total: number;
}

export interface FatigueSummary {
  distribution: Record<FatigueLevel, number>;
  highCriticalTravellers: {
    travellerId: string;
    fatigueScore: number;
    fatigueLevel: FatigueLevel;
  }[];
  totalSuppressions: number;
}

export interface RevenueRiskSummary {
  totalRevenueAtRisk: number;
  highestRiskTravellers: { travellerId: string; revenueAtRisk: number; riskTier: string }[];
  byRiskTier: Record<string, number>;
}

export interface ActionPerformanceSummary {
  actions: {
    action: string;
    totalRecommended: number;
    totalCorrect: number;
    accuracyRate: number;
  }[];
  overallAccuracy: number;
  totalRecommendations: number;
}

export interface PredictionAccuracySummary {
  overallAccuracy: number;
  totalPredictions: number;
  correctPredictions: number;
  avgDaysDifference: number;
}

// ─── Query Deps ─────────────────────────────────────────────────────────────

export interface QueryServiceDeps {
  overviewRepo: BehaviourOverviewRepository;
  archetypeDistRepo: ArchetypeDistributionRepository;
  fatigueRepo: FatigueMonitoringRepository;
  revenueRiskRepo: RevenueRiskMonitoringRepository;
  actionPerfRepo: ActionPerformanceRepository;
  predictionAccRepo: PredictionAccuracyRepository;
}

// ─── Query Functions ────────────────────────────────────────────────────────

export async function getBehaviourOverviewSummary(
  input: QueryInput,
  deps: QueryServiceDeps,
): Promise<BehaviourOverviewSummary> {
  const overviews = await deps.overviewRepo.findByCorporateId(input.tenantId, input.corporateId);

  if (overviews.length === 0) {
    return {
      totalTravellers: 0,
      archetypeDistribution: {},
      segmentDistribution: {},
      averageConfidence: 0,
      highFatigueCount: 0,
      significantDriftCount: 0,
    };
  }

  const archetypeDistribution: Record<string, number> = {};
  const segmentDistribution: Record<string, number> = {};
  let confidenceSum = 0;
  let highFatigueCount = 0;
  let significantDriftCount = 0;

  for (const o of overviews) {
    if (o.archetype) {
      archetypeDistribution[o.archetype] = (archetypeDistribution[o.archetype] ?? 0) + 1;
    }
    segmentDistribution[o.segment] = (segmentDistribution[o.segment] ?? 0) + 1;
    confidenceSum += o.confidenceScore;
    if (o.fatigueLevel === 'high' || o.fatigueLevel === 'critical') highFatigueCount++;
    if (o.driftStatus === 'significant') significantDriftCount++;
  }

  return {
    totalTravellers: overviews.length,
    archetypeDistribution,
    segmentDistribution,
    averageConfidence: Math.round(confidenceSum / overviews.length),
    highFatigueCount,
    significantDriftCount,
  };
}

export async function getArchetypeDistribution(
  input: QueryInput,
  deps: QueryServiceDeps,
): Promise<ArchetypeDistributionSummary> {
  const entries = await deps.archetypeDistRepo.findByCorporateId(input.tenantId, input.corporateId);
  const distribution = entries.map((e) => ({ archetype: e.archetype, count: e.count }));
  const total = distribution.reduce((sum, d) => sum + d.count, 0);
  return { distribution, total };
}

export async function getFatigueSummary(
  input: QueryInput,
  deps: QueryServiceDeps,
): Promise<FatigueSummary> {
  const entries = await deps.fatigueRepo.findByCorporateId(input.tenantId, input.corporateId);

  const distribution: Record<FatigueLevel, number> = { low: 0, medium: 0, high: 0, critical: 0 };
  let totalSuppressions = 0;

  for (const e of entries) {
    distribution[e.fatigueLevel]++;
    totalSuppressions += e.suppressionCount;
  }

  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  const highCritical = entries
    .filter((e) => e.fatigueLevel === 'high' || e.fatigueLevel === 'critical')
    .sort((a, b) => b.fatigueScore - a.fatigueScore)
    .slice((page - 1) * pageSize, page * pageSize)
    .map((e) => ({
      travellerId: e.travellerId,
      fatigueScore: e.fatigueScore,
      fatigueLevel: e.fatigueLevel,
    }));

  return { distribution, highCriticalTravellers: highCritical, totalSuppressions };
}

export async function getRevenueRiskSummary(
  input: QueryInput,
  deps: QueryServiceDeps,
): Promise<RevenueRiskSummary> {
  const entries = await deps.revenueRiskRepo.findByCorporateId(input.tenantId, input.corporateId);

  if (entries.length === 0) {
    return { totalRevenueAtRisk: 0, highestRiskTravellers: [], byRiskTier: {} };
  }

  let totalRevenueAtRisk = 0;
  const byRiskTier: Record<string, number> = {};

  for (const e of entries) {
    totalRevenueAtRisk += e.revenueAtRisk;
    byRiskTier[e.riskTier] = (byRiskTier[e.riskTier] ?? 0) + 1;
  }

  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 10;
  const highestRiskTravellers = entries
    .sort((a, b) => b.revenueAtRisk - a.revenueAtRisk)
    .slice((page - 1) * pageSize, page * pageSize)
    .map((e) => ({
      travellerId: e.travellerId,
      revenueAtRisk: e.revenueAtRisk,
      riskTier: e.riskTier,
    }));

  return { totalRevenueAtRisk, highestRiskTravellers, byRiskTier };
}

export async function getActionPerformanceSummary(
  input: QueryInput,
  deps: QueryServiceDeps,
): Promise<ActionPerformanceSummary> {
  const entries = await deps.actionPerfRepo.findByCorporateId(input.tenantId, input.corporateId);

  if (entries.length === 0) {
    return { actions: [], overallAccuracy: 0, totalRecommendations: 0 };
  }

  let totalRec = 0;
  let totalCorr = 0;
  const actions = entries.map((e) => {
    totalRec += e.totalRecommended;
    totalCorr += e.totalCorrect;
    return {
      action: e.action,
      totalRecommended: e.totalRecommended,
      totalCorrect: e.totalCorrect,
      accuracyRate: e.accuracyRate,
    };
  });

  const overallAccuracy = totalRec > 0 ? Math.round((totalCorr / totalRec) * 100) : 0;

  return { actions, overallAccuracy, totalRecommendations: totalRec };
}

export async function getPredictionAccuracySummary(
  input: QueryInput,
  deps: QueryServiceDeps,
): Promise<PredictionAccuracySummary> {
  const entry = await deps.predictionAccRepo.findByCorporateId(input.tenantId, input.corporateId);

  if (!entry) {
    return { overallAccuracy: 0, totalPredictions: 0, correctPredictions: 0, avgDaysDifference: 0 };
  }

  return {
    overallAccuracy: entry.accuracyRate,
    totalPredictions: entry.totalPredictions,
    correctPredictions: entry.correctPredictions,
    avgDaysDifference: entry.avgDaysDifference,
  };
}

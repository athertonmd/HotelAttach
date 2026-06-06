/**
 * Behaviour Intelligence Projector — transforms events into read models.
 */

import type { HCIEventEnvelope } from '@hci/event-contracts';
import type {
  BehaviourOverviewRepository,
  ArchetypeDistributionRepository,
  FatigueMonitoringRepository,
  RevenueRiskMonitoringRepository,
  ActionPerformanceRepository,
  PredictionAccuracyRepository,
} from './projection-repositories.js';
import type {
  BehaviourSegment,
  ArchetypeType,
  FatigueLevel,
  RiskTier,
  RecommendedActionType,
  DriftStatus,
} from '../domain/enums.js';

export interface ProjectorDeps {
  overviewRepo: BehaviourOverviewRepository;
  archetypeDistRepo: ArchetypeDistributionRepository;
  fatigueRepo: FatigueMonitoringRepository;
  revenueRiskRepo: RevenueRiskMonitoringRepository;
  actionPerfRepo: ActionPerformanceRepository;
  predictionAccRepo: PredictionAccuracyRepository;
}

export interface ProjectionResult {
  processed: boolean;
  projectorName: string;
}

export async function projectBehaviourEvent(
  event: HCIEventEnvelope,
  deps: ProjectorDeps,
): Promise<ProjectionResult> {
  const payload = event.payload as Record<string, unknown>;
  const tenantId = event.tenantId;
  const corporateId = event.corporateId;
  const now = event.timestamp;

  switch (event.eventType) {
    case 'BehaviourProfileUpdated': {
      const travellerId = payload['travellerId'] as string;
      const existing = await deps.overviewRepo.findByTravellerId(tenantId, travellerId);
      await deps.overviewRepo.upsert(tenantId, {
        tenantId,
        corporateId,
        travellerId,
        segment: payload['segment'] as BehaviourSegment,
        archetype: existing?.archetype ?? null,
        confidenceScore: payload['confidenceScore'] as number,
        fatigueLevel: existing?.fatigueLevel ?? 'low',
        driftStatus: existing?.driftStatus ?? 'stable',
        riskTier: existing?.riskTier ?? null,
        lastUpdatedAt: now,
      });
      return { processed: true, projectorName: 'behaviour' };
    }

    case 'ArchetypeAssigned': {
      const travellerId = payload['travellerId'] as string;
      const archetype = payload['archetype'] as ArchetypeType;
      const existing = await deps.overviewRepo.findByTravellerId(tenantId, travellerId);
      if (existing) {
        await deps.overviewRepo.upsert(tenantId, { ...existing, archetype, lastUpdatedAt: now });
      }
      // Update distribution
      const dist = await deps.archetypeDistRepo.findByCorporateId(tenantId, corporateId);
      const entry = dist.find((d) => d.archetype === archetype);
      await deps.archetypeDistRepo.upsert(tenantId, {
        tenantId,
        corporateId,
        archetype,
        count: (entry?.count ?? 0) + 1,
        lastUpdatedAt: now,
      });
      return { processed: true, projectorName: 'behaviour' };
    }

    case 'FatigueThresholdCrossed': {
      const travellerId = payload['travellerId'] as string;
      const fatigueLevel = payload['fatigueLevel'] as FatigueLevel;
      const existing = await deps.overviewRepo.findByTravellerId(tenantId, travellerId);
      if (existing) {
        await deps.overviewRepo.upsert(tenantId, { ...existing, fatigueLevel, lastUpdatedAt: now });
      }
      await deps.fatigueRepo.upsert(tenantId, {
        tenantId,
        corporateId,
        travellerId,
        fatigueScore: payload['fatigueScore'] as number,
        fatigueLevel,
        comms30d: payload['comms30d'] as number,
        suppressionCount: 0,
        lastUpdatedAt: now,
      });
      return { processed: true, projectorName: 'behaviour' };
    }

    case 'BehaviourDriftDetected': {
      const travellerId = payload['travellerId'] as string;
      const driftStatus = payload['driftStatus'] as DriftStatus;
      const existing = await deps.overviewRepo.findByTravellerId(tenantId, travellerId);
      if (existing) {
        await deps.overviewRepo.upsert(tenantId, { ...existing, driftStatus, lastUpdatedAt: now });
      }
      return { processed: true, projectorName: 'behaviour' };
    }

    case 'ActionRecommended': {
      const travellerId = payload['travellerId'] as string;
      const riskTier = (payload['riskTier'] as RiskTier) ?? null;
      const revenueAtRisk = (payload['estimatedRevenueAtRisk'] as number) ?? 0;
      await deps.revenueRiskRepo.upsert(tenantId, {
        tenantId,
        corporateId,
        travellerId,
        revenueAtRisk,
        riskTier: riskTier ?? 'uncertain',
        estimatedCommission: 0,
        lastUpdatedAt: now,
      });
      return { processed: true, projectorName: 'behaviour' };
    }

    case 'CommunicationSuppressed':
    case 'CommunicationSuppressedByFatigue': {
      const travellerId = payload['travellerId'] as string;
      const existing = await deps.fatigueRepo.findByTravellerId(tenantId, travellerId);
      if (existing) {
        await deps.fatigueRepo.upsert(tenantId, {
          ...existing,
          suppressionCount: existing.suppressionCount + 1,
          lastUpdatedAt: now,
        });
      }
      return { processed: true, projectorName: 'behaviour' };
    }

    case 'PredictionOutcomeRecorded': {
      const wasCorrect = payload['wasCorrect'] as boolean;
      const action = payload['recommendedAction'] as RecommendedActionType;
      const daysDiff = payload['daysDifference'] as number;

      // Action performance
      const perfEntries = await deps.actionPerfRepo.findByCorporateId(tenantId, corporateId);
      const perfEntry = perfEntries.find((e) => e.action === action);
      const totalRec = (perfEntry?.totalRecommended ?? 0) + 1;
      const totalCorr = (perfEntry?.totalCorrect ?? 0) + (wasCorrect ? 1 : 0);
      await deps.actionPerfRepo.upsert(tenantId, {
        tenantId,
        corporateId,
        action,
        totalRecommended: totalRec,
        totalCorrect: totalCorr,
        accuracyRate: Math.round((totalCorr / totalRec) * 100),
        lastUpdatedAt: now,
      });

      // Prediction accuracy aggregate
      const existing = await deps.predictionAccRepo.findByCorporateId(tenantId, corporateId);
      const totalPred = (existing?.totalPredictions ?? 0) + 1;
      const correctPred = (existing?.correctPredictions ?? 0) + (wasCorrect ? 1 : 0);
      const avgDays = existing
        ? (existing.avgDaysDifference * existing.totalPredictions + daysDiff) / totalPred
        : daysDiff;
      await deps.predictionAccRepo.upsert(tenantId, {
        tenantId,
        corporateId,
        totalPredictions: totalPred,
        correctPredictions: correctPred,
        accuracyRate: Math.round((correctPred / totalPred) * 100),
        avgDaysDifference: Math.round(avgDays * 10) / 10,
        lastUpdatedAt: now,
      });

      return { processed: true, projectorName: 'behaviour' };
    }

    default:
      return { processed: false, projectorName: 'behaviour' };
  }
}

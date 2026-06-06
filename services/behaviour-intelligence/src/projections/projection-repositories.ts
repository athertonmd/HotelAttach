/**
 * Projection repository interfaces for Behaviour Intelligence read models.
 */

import type {
  TravellerBehaviourOverview,
  ArchetypeDistribution,
  FatigueMonitoringEntry,
  RevenueRiskMonitoringEntry,
  ActionPerformanceEntry,
  PredictionAccuracyEntry,
} from './read-models.js';

export interface BehaviourOverviewRepository {
  upsert(tenantId: string, entry: TravellerBehaviourOverview): Promise<void>;
  findByTravellerId(
    tenantId: string,
    travellerId: string,
  ): Promise<TravellerBehaviourOverview | undefined>;
  findByCorporateId(tenantId: string, corporateId: string): Promise<TravellerBehaviourOverview[]>;
}

export interface ArchetypeDistributionRepository {
  upsert(tenantId: string, entry: ArchetypeDistribution): Promise<void>;
  findByCorporateId(tenantId: string, corporateId: string): Promise<ArchetypeDistribution[]>;
}

export interface FatigueMonitoringRepository {
  upsert(tenantId: string, entry: FatigueMonitoringEntry): Promise<void>;
  findByTravellerId(
    tenantId: string,
    travellerId: string,
  ): Promise<FatigueMonitoringEntry | undefined>;
  findByCorporateId(tenantId: string, corporateId: string): Promise<FatigueMonitoringEntry[]>;
  findHighFatigue(tenantId: string, corporateId: string): Promise<FatigueMonitoringEntry[]>;
}

export interface RevenueRiskMonitoringRepository {
  upsert(tenantId: string, entry: RevenueRiskMonitoringEntry): Promise<void>;
  findByTravellerId(
    tenantId: string,
    travellerId: string,
  ): Promise<RevenueRiskMonitoringEntry | undefined>;
  findByCorporateId(tenantId: string, corporateId: string): Promise<RevenueRiskMonitoringEntry[]>;
}

export interface ActionPerformanceRepository {
  upsert(tenantId: string, entry: ActionPerformanceEntry): Promise<void>;
  findByCorporateId(tenantId: string, corporateId: string): Promise<ActionPerformanceEntry[]>;
}

export interface PredictionAccuracyRepository {
  upsert(tenantId: string, entry: PredictionAccuracyEntry): Promise<void>;
  findByCorporateId(
    tenantId: string,
    corporateId: string,
  ): Promise<PredictionAccuracyEntry | undefined>;
}

/**
 * Read models for Behaviour Intelligence analytics projections.
 */

import type {
  BehaviourSegment,
  ArchetypeType,
  FatigueLevel,
  DriftStatus,
  RiskTier,
  RecommendedActionType,
} from '../domain/enums.js';

export interface TravellerBehaviourOverview {
  tenantId: string;
  corporateId: string;
  travellerId: string;
  segment: BehaviourSegment;
  archetype: ArchetypeType | null;
  confidenceScore: number;
  fatigueLevel: FatigueLevel;
  driftStatus: DriftStatus;
  riskTier: RiskTier | null;
  lastUpdatedAt: string;
}

export interface ArchetypeDistribution {
  tenantId: string;
  corporateId: string;
  archetype: ArchetypeType;
  count: number;
  lastUpdatedAt: string;
}

export interface FatigueMonitoringEntry {
  tenantId: string;
  corporateId: string;
  travellerId: string;
  fatigueScore: number;
  fatigueLevel: FatigueLevel;
  comms30d: number;
  suppressionCount: number;
  lastUpdatedAt: string;
}

export interface RevenueRiskMonitoringEntry {
  tenantId: string;
  corporateId: string;
  travellerId: string;
  revenueAtRisk: number;
  riskTier: RiskTier;
  estimatedCommission: number;
  lastUpdatedAt: string;
}

export interface ActionPerformanceEntry {
  tenantId: string;
  corporateId: string;
  action: RecommendedActionType;
  totalRecommended: number;
  totalCorrect: number;
  accuracyRate: number;
  lastUpdatedAt: string;
}

export interface PredictionAccuracyEntry {
  tenantId: string;
  corporateId: string;
  totalPredictions: number;
  correctPredictions: number;
  accuracyRate: number;
  avgDaysDifference: number;
  lastUpdatedAt: string;
}

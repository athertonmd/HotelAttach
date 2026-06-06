export type {
  TravellerBehaviourOverview,
  ArchetypeDistribution,
  FatigueMonitoringEntry,
  RevenueRiskMonitoringEntry,
  ActionPerformanceEntry,
  PredictionAccuracyEntry,
} from './read-models.js';

export type {
  BehaviourOverviewRepository,
  ArchetypeDistributionRepository,
  FatigueMonitoringRepository,
  RevenueRiskMonitoringRepository,
  ActionPerformanceRepository,
  PredictionAccuracyRepository,
} from './projection-repositories.js';

export {
  InMemoryBehaviourOverviewRepo,
  InMemoryArchetypeDistributionRepo,
  InMemoryFatigueMonitoringRepo,
  InMemoryRevenueRiskMonitoringRepo,
  InMemoryActionPerformanceRepo,
  InMemoryPredictionAccuracyRepo,
} from './in-memory-projections.js';

export {
  projectBehaviourEvent,
  type ProjectorDeps,
  type ProjectionResult,
} from './behaviour-projector.js';

export { computeProfile } from './behaviour-profile-engine.js';
export { computeArchetype } from './archetype-assignment-engine.js';
export { computeAttribution } from './booking-attribution-engine.js';
export { computeDrift } from './behaviour-drift-engine.js';
export { computeFatigue } from './communication-fatigue-engine.js';
export { computeRevenueRisk } from './revenue-risk-engine.js';
export { computeRecommendedAction } from './recommended-action-engine.js';
export { computePredictionOutcome } from './prediction-outcome-engine.js';

export type {
  ProfileEngineInput,
  ProfileEngineResult,
  ArchetypeEngineInput,
  ArchetypeEngineResult,
  AttributionEngineInput,
  AttributionEngineResult,
  CommunicationRecord,
  DriftEngineInput,
  DriftEngineResult,
  FatigueEngineInput,
  FatigueEngineResult,
  RevenueRiskEngineInput,
  RevenueRiskEngineResult,
  ActionEngineInput,
  ActionEngineResult,
  PredictionOutcomeEngineInput,
  PredictionOutcomeEngineResult,
} from './types.js';

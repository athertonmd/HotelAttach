export type {
  BehaviourSegment,
  ArchetypeType,
  AttributionType,
  DriftStatus,
  DriftDirection,
  FatigueLevel,
  RecommendedActionType,
  SuppressionReason,
  PredictionOutcomeType,
  BehaviourChannel,
  RiskTier,
} from './enums.js';
export {
  ATTRIBUTION_WINDOWS,
  deriveRiskTier,
  deriveFatigueLevel,
  deriveDriftStatus,
} from './enums.js';

export {
  createProfile,
  type TravellerBehaviourProfile,
  type CreateProfileInput,
} from './traveller-behaviour-profile.js';

export { determineArchetype, type ArchetypeAssignment } from './traveller-archetype.js';

export {
  createAttribution,
  type BookingAttribution,
  type CreateAttributionInput,
} from './booking-attribution.js';

export { calculateDrift, type BehaviourDrift, type HistoricalBaseline } from './behaviour-drift.js';

export {
  calculateFatigue,
  applyDecay,
  applyEvent,
  type CommunicationFatigue,
  type CalculateFatigueInput,
} from './communication-fatigue.js';

export {
  calculateRevenueAtRisk,
  type RevenueAtRisk,
  type CalculateRevenueAtRiskInput,
} from './revenue-at-risk.js';

export {
  determineAction,
  type RecommendedAction,
  type DetermineActionInput,
} from './recommended-action.js';

export {
  evaluateOutcome,
  type PredictionOutcome,
  type EvaluateOutcomeInput,
} from './prediction-outcome.js';

export {
  createBehaviourProfileUpdatedEvent,
  createArchetypeAssignedEvent,
  createBookingAttributedEvent,
  createBehaviourDriftDetectedEvent,
  createFatigueThresholdCrossedEvent,
  createActionRecommendedEvent,
  createCommunicationSuppressedEvent,
  createCommunicationSuppressedByFatigueEvent,
  createPredictionOutcomeRecordedEvent,
} from './behaviour-event-factory.js';

export type { EventFactoryResult, CorrelationContext } from './types.js';

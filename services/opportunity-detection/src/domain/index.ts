export type {
  OpportunityType,
  LifecycleState,
  Priority,
  ClosureReason,
  RejectionReason,
  SuppressionReason,
  ActorType,
  RecommendationType,
  ActionTriggerSource,
} from './enums.js';
export { ACTIVE_STATES, TERMINAL_STATES, SUPPRESSION_PRIORITY, derivePriority } from './enums.js';
export { Opportunity, type CreateOpportunityInput } from './opportunity.js';
export { OpportunityAssessment, type CreateAssessmentInput } from './opportunity-assessment.js';
export { OpportunityAction, type CreateActionInput } from './opportunity-action.js';
export { OpportunitySuppression, type CreateSuppressionInput } from './opportunity-suppression.js';
export {
  OpportunityCommunication,
  type CreateCommunicationInput,
  type CommunicationType,
  type CommunicationChannel,
  type CommunicationOutcome,
} from './opportunity-communication.js';
export { OpportunityClosure, type CreateClosureInput } from './opportunity-closure.js';
export {
  OpportunityRecommendation,
  type CreateRecommendationInput,
} from './opportunity-recommendation.js';
export { OpportunityAuditEntry, type CreateAuditEntryInput } from './opportunity-audit-entry.js';
export * from './rules/index.js';

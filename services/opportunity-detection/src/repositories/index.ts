export type {
  OpportunityRepository,
  OpportunityAssessmentRepository,
  OpportunitySuppressionRepository,
  OpportunityCommunicationRepository,
  OpportunityClosureRepository,
  OpportunityAuditRepository,
} from './interfaces.js';

export {
  InMemoryOpportunityRepository,
  InMemoryOpportunityAssessmentRepository,
  InMemoryOpportunitySuppressionRepository,
  InMemoryOpportunityCommunicationRepository,
  InMemoryOpportunityClosureRepository,
  InMemoryOpportunityAuditRepository,
} from './in-memory.js';

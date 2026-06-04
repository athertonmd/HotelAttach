/**
 * Projector types for Analytics API event projections.
 * Each projector transforms domain events into read-model rows.
 */

import type { HCIEventEnvelope } from '@hci/event-contracts';
import type {
  ProjectionCheckpointRepository,
  OpportunityPipelineRepository,
  DutyOfCareRepository,
  EngagementFunnelRepository,
  AgentEscalationAnalyticsRepository,
} from '../repositories/interfaces.js';

/** Dependencies injected into all projectors */
export interface ProjectorDeps {
  checkpointRepo: ProjectionCheckpointRepository;
  pipelineRepo: OpportunityPipelineRepository;
  dutyOfCareRepo: DutyOfCareRepository;
  engagementRepo: EngagementFunnelRepository;
  escalationRepo: AgentEscalationAnalyticsRepository;
}

/** Result returned by each projector after processing an event */
export interface ProjectionResult {
  processed: boolean;
  projectorName: string;
}

/** Type alias for projector function signature */
export type ProjectorFn = (
  event: HCIEventEnvelope,
  deps: ProjectorDeps,
) => Promise<ProjectionResult>;

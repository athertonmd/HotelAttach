/**
 * Projector barrel exports and event dispatcher.
 * Routes incoming domain events to the appropriate projector functions.
 */

import type { HCIEventEnvelope } from '@hci/event-contracts';
import type { ProjectorDeps, ProjectionResult } from './types.js';
import { projectOpportunityPipeline } from './opportunity-pipeline-projector.js';
import { projectDutyOfCare } from './duty-of-care-projector.js';
import { projectEngagementFunnel } from './engagement-funnel-projector.js';
import { projectAgentEscalation } from './agent-escalation-projector.js';

export type { ProjectorDeps, ProjectionResult, ProjectorFn } from './types.js';
export { projectOpportunityPipeline } from './opportunity-pipeline-projector.js';
export { projectDutyOfCare } from './duty-of-care-projector.js';
export { projectEngagementFunnel } from './engagement-funnel-projector.js';
export { projectAgentEscalation } from './agent-escalation-projector.js';

/**
 * Dispatches an event to all projectors and returns only those that processed it.
 * Each projector independently determines whether it handles the given event type.
 */
export async function projectEvent(
  event: HCIEventEnvelope,
  deps: ProjectorDeps,
): Promise<ProjectionResult[]> {
  const results: ProjectionResult[] = [];

  results.push(await projectOpportunityPipeline(event, deps));
  results.push(await projectDutyOfCare(event, deps));
  results.push(await projectEngagementFunnel(event, deps));
  results.push(await projectAgentEscalation(event, deps));

  return results.filter((r) => r.processed);
}

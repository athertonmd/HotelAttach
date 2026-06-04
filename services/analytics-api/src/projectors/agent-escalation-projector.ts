/**
 * Agent Escalation Projector
 * Handles: OpportunityCreated where lifecycleState = 'awaiting_action'
 *
 * Creates escalation records for opportunities requiring agent intervention.
 * These appear on the agent dashboard for manual review and action.
 */

import type { HCIEventEnvelope } from '@hci/event-contracts';
import type { ProjectorDeps, ProjectionResult } from './types.js';

const PROJECTOR_NAME = 'agent-escalation';

export async function projectAgentEscalation(
  event: HCIEventEnvelope,
  deps: ProjectorDeps,
): Promise<ProjectionResult> {
  if (event.eventType !== 'OpportunityCreated') {
    return { processed: false, projectorName: PROJECTOR_NAME };
  }

  const payload = event.payload as Record<string, unknown>;

  if (payload['lifecycleState'] !== 'awaiting_action') {
    return { processed: false, projectorName: PROJECTOR_NAME };
  }

  const tenantId = event.tenantId;
  const opportunityId = payload['opportunityId'] as string;

  const data: Record<string, unknown> = {
    corporateId: event.corporateId,
    opportunityId,
    opportunityType: payload['opportunityType'],
    travellerId: payload['travellerId'],
    tripId: payload['tripId'],
    priority: payload['priority'],
    score: payload['score'],
    status: 'pending',
    detectedAt: payload['detectedAt'],
    createdAt: event.timestamp,
  };

  await deps.escalationRepo.upsert(tenantId, opportunityId, data);
  await deps.checkpointRepo.updateCheckpoint(
    PROJECTOR_NAME,
    event.eventId,
    new Date(event.timestamp),
  );

  return { processed: true, projectorName: PROJECTOR_NAME };
}

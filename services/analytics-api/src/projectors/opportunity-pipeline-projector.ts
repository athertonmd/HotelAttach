/**
 * Opportunity Pipeline Projector
 * Handles: OpportunityCreated, OpportunityUpdated, OpportunityClosed, OpportunityRejected
 *
 * Projects opportunity lifecycle events into the pipeline read model
 * for analytics dashboards and reporting.
 */

import type { HCIEventEnvelope } from '@hci/event-contracts';
import type { ProjectorDeps, ProjectionResult } from './types.js';

const PROJECTOR_NAME = 'opportunity-pipeline';

const VALID_TYPES = [
  'OpportunityCreated',
  'OpportunityUpdated',
  'OpportunityClosed',
  'OpportunityRejected',
] as const;

export async function projectOpportunityPipeline(
  event: HCIEventEnvelope,
  deps: ProjectorDeps,
): Promise<ProjectionResult> {
  if (!VALID_TYPES.includes(event.eventType as (typeof VALID_TYPES)[number])) {
    return { processed: false, projectorName: PROJECTOR_NAME };
  }

  const payload = event.payload as Record<string, unknown>;
  const tenantId = event.tenantId;
  const opportunityId = payload['opportunityId'] as string;

  // Build upsert data from event payload
  const data: Record<string, unknown> = {
    corporateId: event.corporateId,
    opportunityType: payload['opportunityType'],
    lastUpdatedAt: event.timestamp,
  };

  // Lifecycle state: derive from event type if not explicit
  if (event.eventType === 'OpportunityClosed') {
    data['lifecycleState'] = 'closed';
  } else if (event.eventType === 'OpportunityRejected') {
    data['lifecycleState'] = 'rejected';
  } else if (payload['lifecycleState'] != null) {
    data['lifecycleState'] = payload['lifecycleState'];
  }

  // Score: use whichever field is present
  const score = payload['score'] ?? payload['finalScore'] ?? payload['newScore'];
  if (score != null) {
    data['score'] = score;
  }

  // Priority
  const priority = payload['priority'] ?? payload['newPriority'];
  if (priority != null) {
    data['priority'] = priority;
  }

  if (payload['detectedAt'] != null) {
    data['detectedAt'] = payload['detectedAt'];
  }

  // Closure details
  if (event.eventType === 'OpportunityClosed') {
    data['closureReason'] = payload['closureReason'];
    data['closedAt'] = payload['closedAt'];
  }

  // Rejection details
  if (event.eventType === 'OpportunityRejected') {
    data['rejectionReason'] = payload['rejectionReason'];
    data['closedAt'] = payload['rejectedAt'];
  }

  // Optional fields from OpportunityCreated
  if (payload['travellerId'] != null) data['travellerId'] = payload['travellerId'];
  if (payload['tripId'] != null) data['tripId'] = payload['tripId'];
  if (payload['estimatedSpend'] != null) data['estimatedSpend'] = payload['estimatedSpend'];
  if (payload['estimatedCommission'] != null)
    data['estimatedCommission'] = payload['estimatedCommission'];
  if (payload['destinationCity'] != null) data['destinationCity'] = payload['destinationCity'];
  if (payload['destinationCountry'] != null)
    data['destinationCountry'] = payload['destinationCountry'];
  if (payload['departureDate'] != null) data['departureDate'] = payload['departureDate'];

  await deps.pipelineRepo.upsert(tenantId, opportunityId, data);
  await deps.checkpointRepo.updateCheckpoint(
    PROJECTOR_NAME,
    event.eventId,
    new Date(event.timestamp),
  );

  return { processed: true, projectorName: PROJECTOR_NAME };
}

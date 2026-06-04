/**
 * Duty of Care Projector
 * Handles: HotelCoverageUpdated, OpportunityCreated (duty_of_care_gap), OpportunityClosed
 *
 * Tracks duty-of-care gaps for trips where travellers lack adequate accommodation coverage.
 * A trip is marked resolved when coverage reaches 100% or the opportunity is closed.
 */

import type { HCIEventEnvelope } from '@hci/event-contracts';
import type { ProjectorDeps, ProjectionResult } from './types.js';

const PROJECTOR_NAME = 'duty-of-care';

export async function projectDutyOfCare(
  event: HCIEventEnvelope,
  deps: ProjectorDeps,
): Promise<ProjectionResult> {
  const payload = event.payload as Record<string, unknown>;
  const tenantId = event.tenantId;

  if (event.eventType === 'HotelCoverageUpdated') {
    const tripId = payload['tripId'] as string;
    const coveragePercent = payload['coveragePercent'] as number;
    const isResolved = coveragePercent >= 100;

    const data: Record<string, unknown> = {
      corporateId: event.corporateId,
      coveragePercent,
      coverageStatus: payload['coverageStatus'],
      totalNightsRequired: payload['totalNightsRequired'],
      nightsCovered: payload['nightsCovered'],
      calculatedAt: payload['calculatedAt'],
      isUnresolved: !isResolved,
      lastUpdatedAt: event.timestamp,
    };

    if (payload['matchedBookingIds'] != null) {
      data['matchedBookingIds'] = payload['matchedBookingIds'];
    }

    await deps.dutyOfCareRepo.upsert(tenantId, tripId, data);
    await deps.checkpointRepo.updateCheckpoint(
      PROJECTOR_NAME,
      event.eventId,
      new Date(event.timestamp),
    );

    return { processed: true, projectorName: PROJECTOR_NAME };
  }

  if (
    event.eventType === 'OpportunityCreated' &&
    payload['opportunityType'] === 'duty_of_care_gap'
  ) {
    const tripId = payload['tripId'] as string;

    const data: Record<string, unknown> = {
      corporateId: event.corporateId,
      opportunityId: payload['opportunityId'],
      travellerId: payload['travellerId'],
      isUnresolved: true,
      detectedAt: payload['detectedAt'],
      lastUpdatedAt: event.timestamp,
    };

    await deps.dutyOfCareRepo.upsert(tenantId, tripId, data);
    await deps.checkpointRepo.updateCheckpoint(
      PROJECTOR_NAME,
      event.eventId,
      new Date(event.timestamp),
    );

    return { processed: true, projectorName: PROJECTOR_NAME };
  }

  if (event.eventType === 'OpportunityClosed') {
    const tripId = payload['tripId'] as string;
    if (tripId) {
      const data: Record<string, unknown> = {
        corporateId: event.corporateId,
        isUnresolved: false,
        closedAt: payload['closedAt'],
        closureReason: payload['closureReason'],
        lastUpdatedAt: event.timestamp,
      };

      await deps.dutyOfCareRepo.upsert(tenantId, tripId, data);
      await deps.checkpointRepo.updateCheckpoint(
        PROJECTOR_NAME,
        event.eventId,
        new Date(event.timestamp),
      );

      return { processed: true, projectorName: PROJECTOR_NAME };
    }
  }

  return { processed: false, projectorName: PROJECTOR_NAME };
}

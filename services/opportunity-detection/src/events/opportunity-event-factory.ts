/**
 * Event factories for Opportunity Detection output events.
 * Maps domain entities to OpportunityCreated, OpportunityUpdated, OpportunityClosed, OpportunityRejected.
 */

import { createEnvelope } from '@hci/event-contracts';
import type { Opportunity } from '../domain/opportunity.js';
import type { EventFactoryResult, CorrelationContext } from './types.js';
import type { Priority, LifecycleState } from '../domain/enums.js';

const SOURCE_SERVICE = 'hci\\.opportunities';

export function createOpportunityCreatedEvent(
  opp: Opportunity,
  context: CorrelationContext = {},
): EventFactoryResult {
  try {
    const validCreatedStates = ['qualified', 'active', 'suppressed', 'awaiting_action'];
    if (!validCreatedStates.includes(opp.lifecycleState)) {
      return {
        success: false,
        error: `Cannot create OpportunityCreated event for state: ${opp.lifecycleState}`,
      };
    }

    const payload = {
      opportunityId: opp.opportunityId,
      tenantId: opp.tenantId,
      corporateId: opp.corporateId,
      travellerId: opp.travellerId,
      tripId: opp.tripId,
      opportunityType: opp.opportunityType,
      lifecycleState: opp.lifecycleState,
      score: opp.score,
      priority: opp.priority,
      detectedAt: opp.detectedAt.toISOString(),
      estimatedRoomNights: opp.estimatedRoomNights,
      estimatedSpend: opp.estimatedSpend,
      estimatedCommission: opp.estimatedCommission,
      destinationCity: opp.destinationCity,
      destinationCountry: opp.destinationCountry,
      departureDate: opp.departureDate ? opp.departureDate.toISOString().split('T')[0] : null,
      suppressedUntil: opp.suppressedUntil ? opp.suppressedUntil.toISOString() : null,
      primarySuppressionReason: opp.primarySuppressionReason,
      triggeringEventId: context.triggeringEventId ?? opp.triggeringEventId,
      triggeringEventType: context.triggeringEventType ?? opp.triggeringEventType,
      ruleIdsApplied: null,
    };

    const event = createEnvelope({
      eventType: 'OpportunityCreated',
      tenantId: opp.tenantId,
      corporateId: opp.corporateId,
      sourceService: SOURCE_SERVICE,
      correlationId: context.correlationId ?? opp.correlationId,
      payload,
    });
    return { success: true, event };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export function createOpportunityUpdatedEvent(
  opp: Opportunity,
  previousScore: number,
  previousPriority: Priority,
  previousState: LifecycleState | null,
  context: CorrelationContext = {},
): EventFactoryResult {
  try {
    const payload = {
      opportunityId: opp.opportunityId,
      tenantId: opp.tenantId,
      corporateId: opp.corporateId,
      tripId: opp.tripId,
      opportunityType: opp.opportunityType,
      lifecycleState: opp.lifecycleState,
      previousScore,
      newScore: opp.score,
      previousPriority,
      newPriority: opp.priority,
      updatedAt: opp.updatedAt.toISOString(),
      previousState: previousState,
      reopenCount: opp.reopenCount,
      triggeringEventId: context.triggeringEventId ?? opp.triggeringEventId,
      triggeringEventType: context.triggeringEventType ?? opp.triggeringEventType,
    };

    const event = createEnvelope({
      eventType: 'OpportunityUpdated',
      tenantId: opp.tenantId,
      corporateId: opp.corporateId,
      sourceService: SOURCE_SERVICE,
      correlationId: context.correlationId ?? opp.correlationId,
      payload,
    });
    return { success: true, event };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export function createOpportunityClosedEvent(
  opp: Opportunity,
  context: CorrelationContext = {},
): EventFactoryResult {
  try {
    if (
      opp.lifecycleState !== 'closed' &&
      opp.lifecycleState !== 'expired' &&
      opp.lifecycleState !== 'cancelled'
    ) {
      return {
        success: false,
        error: `Cannot create OpportunityClosed event for state: ${opp.lifecycleState}`,
      };
    }
    if (!opp.closureReason) {
      return { success: false, error: 'closureReason is required for OpportunityClosed' };
    }

    const payload = {
      opportunityId: opp.opportunityId,
      tenantId: opp.tenantId,
      corporateId: opp.corporateId,
      tripId: opp.tripId,
      travellerId: opp.travellerId,
      opportunityType: opp.opportunityType,
      closureReason: opp.closureReason,
      finalScore: opp.score,
      closedAt: (opp.closedAt ?? new Date()).toISOString(),
      reopenCount: opp.reopenCount,
      triggeringEventId: context.triggeringEventId ?? opp.triggeringEventId,
      triggeringEventType: context.triggeringEventType ?? opp.triggeringEventType,
    };

    const event = createEnvelope({
      eventType: 'OpportunityClosed',
      tenantId: opp.tenantId,
      corporateId: opp.corporateId,
      sourceService: SOURCE_SERVICE,
      correlationId: context.correlationId ?? opp.correlationId,
      payload,
    });
    return { success: true, event };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export function createOpportunityRejectedEvent(
  opp: Opportunity,
  previousState: LifecycleState | null,
  context: CorrelationContext = {},
): EventFactoryResult {
  try {
    if (opp.lifecycleState !== 'rejected') {
      return {
        success: false,
        error: `Cannot create OpportunityRejected event for state: ${opp.lifecycleState}`,
      };
    }
    if (!opp.rejectionReason) {
      return { success: false, error: 'rejectionReason is required for OpportunityRejected' };
    }

    const payload = {
      opportunityId: opp.opportunityId,
      tenantId: opp.tenantId,
      corporateId: opp.corporateId,
      tripId: opp.tripId,
      travellerId: opp.travellerId,
      opportunityType: opp.opportunityType,
      rejectionReason: opp.rejectionReason,
      rejectedAt: (opp.closedAt ?? new Date()).toISOString(),
      previousState: previousState,
      finalScore: opp.score,
      triggeringEventId: context.triggeringEventId ?? opp.triggeringEventId,
      triggeringEventType: context.triggeringEventType ?? opp.triggeringEventType,
    };

    const event = createEnvelope({
      eventType: 'OpportunityRejected',
      tenantId: opp.tenantId,
      corporateId: opp.corporateId,
      sourceService: SOURCE_SERVICE,
      correlationId: context.correlationId ?? opp.correlationId,
      payload,
    });
    return { success: true, event };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

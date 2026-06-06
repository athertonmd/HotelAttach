/**
 * Event factories for Behaviour Intelligence output events.
 * Maps engine results to event envelopes for all 9 Behaviour Intelligence event types.
 */

import { createEnvelope } from '@hci/event-contracts';
import type { EventFactoryResult, CorrelationContext } from './types.js';
import type {
  BehaviourProfileUpdatedPayload,
  ArchetypeAssignedPayload,
  BookingAttributedPayload,
  BehaviourDriftDetectedPayload,
  FatigueThresholdCrossedPayload,
  ActionRecommendedPayload,
  CommunicationSuppressedPayload,
  CommunicationSuppressedByFatiguePayload,
  PredictionOutcomeRecordedPayload,
} from '@hci/event-contracts';
import type { CreateEnvelopeOptions } from '@hci/event-contracts';

const SOURCE_SERVICE = 'hci\\.behaviour-intelligence';

/** Build envelope options, only including correlationId when defined */
function buildOptions<T extends object>(
  eventType: string,
  tenantId: string,
  corporateId: string,
  payload: T,
  context: CorrelationContext,
): CreateEnvelopeOptions<T> {
  const base = {
    eventType: eventType as CreateEnvelopeOptions<T>['eventType'],
    tenantId,
    corporateId,
    sourceService: SOURCE_SERVICE,
    payload,
  };
  if (context.correlationId) {
    return { ...base, correlationId: context.correlationId };
  }
  return base;
}

export function createBehaviourProfileUpdatedEvent(
  payload: BehaviourProfileUpdatedPayload,
  context: CorrelationContext = {},
): EventFactoryResult<BehaviourProfileUpdatedPayload> {
  try {
    const enrichedPayload: BehaviourProfileUpdatedPayload = {
      ...payload,
      triggeringEventId: context.triggeringEventId ?? payload.triggeringEventId,
      triggeringEventType: context.triggeringEventType ?? payload.triggeringEventType,
    };
    const event = createEnvelope(
      buildOptions(
        'BehaviourProfileUpdated',
        payload.tenantId,
        payload.corporateId,
        enrichedPayload,
        context,
      ),
    );
    return { success: true, event };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export function createArchetypeAssignedEvent(
  payload: ArchetypeAssignedPayload,
  context: CorrelationContext = {},
): EventFactoryResult<ArchetypeAssignedPayload> {
  try {
    const enrichedPayload: ArchetypeAssignedPayload = {
      ...payload,
      triggeringEventId: context.triggeringEventId ?? payload.triggeringEventId,
      triggeringEventType: context.triggeringEventType ?? payload.triggeringEventType,
    };
    const event = createEnvelope(
      buildOptions(
        'ArchetypeAssigned',
        payload.tenantId,
        payload.corporateId,
        enrichedPayload,
        context,
      ),
    );
    return { success: true, event };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export function createBookingAttributedEvent(
  payload: BookingAttributedPayload,
  context: CorrelationContext = {},
): EventFactoryResult<BookingAttributedPayload> {
  try {
    const enrichedPayload: BookingAttributedPayload = {
      ...payload,
      triggeringEventId: context.triggeringEventId ?? payload.triggeringEventId,
      triggeringEventType: context.triggeringEventType ?? payload.triggeringEventType,
    };
    const event = createEnvelope(
      buildOptions(
        'BookingAttributed',
        payload.tenantId,
        payload.corporateId,
        enrichedPayload,
        context,
      ),
    );
    return { success: true, event };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export function createBehaviourDriftDetectedEvent(
  payload: BehaviourDriftDetectedPayload,
  context: CorrelationContext = {},
): EventFactoryResult<BehaviourDriftDetectedPayload> {
  try {
    const enrichedPayload: BehaviourDriftDetectedPayload = {
      ...payload,
      triggeringEventId: context.triggeringEventId ?? payload.triggeringEventId,
      triggeringEventType: context.triggeringEventType ?? payload.triggeringEventType,
    };
    const event = createEnvelope(
      buildOptions(
        'BehaviourDriftDetected',
        payload.tenantId,
        payload.corporateId,
        enrichedPayload,
        context,
      ),
    );
    return { success: true, event };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export function createFatigueThresholdCrossedEvent(
  payload: FatigueThresholdCrossedPayload,
  context: CorrelationContext = {},
): EventFactoryResult<FatigueThresholdCrossedPayload> {
  try {
    const enrichedPayload: FatigueThresholdCrossedPayload = {
      ...payload,
      triggeringEventId: context.triggeringEventId ?? payload.triggeringEventId,
      triggeringEventType: context.triggeringEventType ?? payload.triggeringEventType,
    };
    const event = createEnvelope(
      buildOptions(
        'FatigueThresholdCrossed',
        payload.tenantId,
        payload.corporateId,
        enrichedPayload,
        context,
      ),
    );
    return { success: true, event };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export function createActionRecommendedEvent(
  payload: ActionRecommendedPayload,
  context: CorrelationContext = {},
): EventFactoryResult<ActionRecommendedPayload> {
  try {
    const enrichedPayload: ActionRecommendedPayload = {
      ...payload,
      triggeringEventId: context.triggeringEventId ?? payload.triggeringEventId,
      triggeringEventType: context.triggeringEventType ?? payload.triggeringEventType,
    };
    const event = createEnvelope(
      buildOptions(
        'ActionRecommended',
        payload.tenantId,
        payload.corporateId,
        enrichedPayload,
        context,
      ),
    );
    return { success: true, event };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export function createCommunicationSuppressedEvent(
  payload: CommunicationSuppressedPayload,
  context: CorrelationContext = {},
): EventFactoryResult<CommunicationSuppressedPayload> {
  try {
    const enrichedPayload: CommunicationSuppressedPayload = {
      ...payload,
      triggeringEventId: context.triggeringEventId ?? payload.triggeringEventId,
      triggeringEventType: context.triggeringEventType ?? payload.triggeringEventType,
    };
    const event = createEnvelope(
      buildOptions(
        'CommunicationSuppressed',
        payload.tenantId,
        payload.corporateId,
        enrichedPayload,
        context,
      ),
    );
    return { success: true, event };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export function createCommunicationSuppressedByFatigueEvent(
  payload: CommunicationSuppressedByFatiguePayload,
  context: CorrelationContext = {},
): EventFactoryResult<CommunicationSuppressedByFatiguePayload> {
  try {
    const enrichedPayload: CommunicationSuppressedByFatiguePayload = {
      ...payload,
      triggeringEventId: context.triggeringEventId ?? payload.triggeringEventId,
      triggeringEventType: context.triggeringEventType ?? payload.triggeringEventType,
    };
    const event = createEnvelope(
      buildOptions(
        'CommunicationSuppressedByFatigue',
        payload.tenantId,
        payload.corporateId,
        enrichedPayload,
        context,
      ),
    );
    return { success: true, event };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export function createPredictionOutcomeRecordedEvent(
  payload: PredictionOutcomeRecordedPayload,
  context: CorrelationContext = {},
): EventFactoryResult<PredictionOutcomeRecordedPayload> {
  try {
    const enrichedPayload: PredictionOutcomeRecordedPayload = {
      ...payload,
      triggeringEventId: context.triggeringEventId ?? payload.triggeringEventId,
      triggeringEventType: context.triggeringEventType ?? payload.triggeringEventType,
    };
    const event = createEnvelope(
      buildOptions(
        'PredictionOutcomeRecorded',
        payload.tenantId,
        payload.corporateId,
        enrichedPayload,
        context,
      ),
    );
    return { success: true, event };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

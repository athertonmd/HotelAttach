/**
 * Event factories for Traveller Engagement output events.
 * Maps domain entities to CommunicationSent, TravellerResponded, BookingRequestCreated.
 */

import { createEnvelope } from '@hci/event-contracts';
import type { Communication } from '../domain/communication.js';
import type { TravellerResponse } from '../domain/traveller-response.js';
import type { BookingRequest } from '../domain/booking-request.js';
import type { EventFactoryResult, CorrelationContext } from './types.js';

const SOURCE_SERVICE = 'hci\\.engagement';

export function createCommunicationSentEvent(
  comm: Communication,
  context: CorrelationContext = {},
): EventFactoryResult {
  try {
    const validSentStates = ['sent', 'opened', 'clicked', 'responded'];
    if (!validSentStates.includes(comm.status)) {
      return {
        success: false,
        error: `Cannot create CommunicationSent event for state: ${comm.status}`,
      };
    }

    const payload = {
      communicationId: comm.communicationId,
      opportunityId: comm.opportunityId,
      tenantId: comm.tenantId,
      corporateId: comm.corporateId,
      travellerId: comm.travellerId,
      communicationType: comm.communicationType,
      channel: comm.channel,
      sentAt: comm.sentAt ? comm.sentAt.toISOString() : new Date().toISOString(),
      triggeringEventId: context.triggeringEventId ?? null,
      triggeringEventType: context.triggeringEventType ?? null,
    };

    const event = createEnvelope({
      eventType: 'CommunicationSent',
      tenantId: comm.tenantId,
      corporateId: comm.corporateId,
      sourceService: SOURCE_SERVICE,
      correlationId: context.correlationId ?? comm.correlationId,
      payload,
    });
    return { success: true, event };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export function createTravellerRespondedEvent(
  response: TravellerResponse,
  context: CorrelationContext = {},
): EventFactoryResult {
  try {
    const payload = {
      responseId: response.responseId,
      communicationId: response.communicationId,
      opportunityId: response.opportunityId,
      tenantId: response.tenantId,
      corporateId: response.tenantId,
      travellerId: response.travellerId,
      responseType: response.responseType,
      respondedAt: response.respondedAt.toISOString(),
      notes: response.notes,
      triggeringEventId: context.triggeringEventId ?? null,
      triggeringEventType: context.triggeringEventType ?? null,
    };

    const event = createEnvelope({
      eventType: 'TravellerResponded',
      tenantId: response.tenantId,
      corporateId: response.tenantId,
      sourceService: SOURCE_SERVICE,
      correlationId: context.correlationId ?? response.correlationId,
      payload,
    });
    return { success: true, event };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export function createBookingRequestCreatedEvent(
  request: BookingRequest,
  context: CorrelationContext = {},
): EventFactoryResult {
  try {
    if (request.status !== 'created') {
      return {
        success: false,
        error: `Cannot create BookingRequestCreated event for state: ${request.status}`,
      };
    }

    const payload = {
      requestId: request.requestId,
      opportunityId: request.opportunityId,
      tenantId: request.tenantId,
      corporateId: request.corporateId,
      travellerId: request.travellerId,
      tripId: request.tripId,
      requestStatus: request.status,
      requestedAt: request.requestedAt.toISOString(),
      destinationCity: request.destinationCity,
      destinationCountry: request.destinationCountry,
      requestedNights: request.requestedNights,
      triggeringEventId: context.triggeringEventId ?? null,
      triggeringEventType: context.triggeringEventType ?? null,
    };

    const event = createEnvelope({
      eventType: 'BookingRequestCreated',
      tenantId: request.tenantId,
      corporateId: request.corporateId,
      sourceService: SOURCE_SERVICE,
      ...(context.correlationId ? { correlationId: context.correlationId } : {}),
      payload,
    });
    return { success: true, event };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

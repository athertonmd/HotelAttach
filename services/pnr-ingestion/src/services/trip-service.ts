/**
 * TripService — application service for trip management.
 * Orchestrates trip lifecycle, segment management, and timeline events.
 */

import {
  Trip,
  type CreateTripInput,
  type CreateSegmentInput,
  type UpdateSegmentInput,
} from '../domain/index.js';
import type { TripRepository } from '../repositories/interfaces.js';
import type { EventBusAdapter, TypeSpecificData } from '@hci/event-contracts';
import { createTripCreatedEvent, createTripUpdatedEvent } from '../events/trip-event-factory.js';
import {
  createSegmentAddedEvent,
  createSegmentUpdatedEvent,
  createSegmentRemovedEvent,
} from '../events/segment-event-factory.js';
import { buildTripEventContext, buildSegmentEventContext } from './event-helpers.js';
import type { TripStatus, TimelineEventType } from '../domain/value-objects.js';
import type { Segment } from '../domain/segment.js';
import type { ServiceResult, CorrelationContext } from './types.js';
import { randomUUID } from 'node:crypto';

export interface CreateTripServiceInput extends CreateTripInput {
  origin: string;
  destination: string;
  isInternational: boolean;
}

export interface AddSegmentInput extends CreateSegmentInput {
  typeSpecificData: TypeSpecificData;
  supplierCode?: string | null;
}

export interface UpdateSegmentServiceInput extends UpdateSegmentInput {
  segmentId: string;
  typeSpecificData: TypeSpecificData;
  supplierCode?: string | null;
}

export interface RemoveSegmentInput {
  segmentId: string;
  typeSpecificData: TypeSpecificData;
  supplierCode?: string | null;
}

export interface AddTimelineEventInput {
  eventType: TimelineEventType;
  eventData?: Record<string, unknown>;
}

export interface TripContextInput {
  origin: string;
  destination: string;
  isInternational: boolean;
}

export class TripService {
  constructor(
    private readonly tripRepo: TripRepository,
    private readonly eventBus: EventBusAdapter,
  ) {}

  async createTrip(input: CreateTripServiceInput): Promise<ServiceResult<Trip>> {
    try {
      const trip = Trip.create(input);
      await this.tripRepo.save(trip);
      return { success: true, data: trip };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  async updateTripStatus(
    tenantId: string,
    tripId: string,
    _newStatus: TripStatus,
    tripContext: TripContextInput,
    context: CorrelationContext = {},
  ): Promise<ServiceResult<Trip>> {
    try {
      const trip = await this.tripRepo.findById(tenantId, tripId);
      if (!trip) {
        return { success: false, error: `Trip ${tripId} not found` };
      }

      trip.addTimelineEvent({
        eventId: randomUUID(),
        tripId: trip.tripId,
        eventType: 'status_changed',
        eventData: { oldStatus: trip.status, newStatus: _newStatus },
      });

      await this.tripRepo.save(trip);

      if (trip.segments.length > 0) {
        const eventCtx = buildTripEventContext(
          tripContext.origin,
          tripContext.destination,
          tripContext.isInternational,
          context,
        );
        const eventResult = createTripUpdatedEvent(trip, eventCtx);
        if (eventResult.success && eventResult.event) {
          await this.eventBus.publish(eventResult.event);
        }
      }

      return { success: true, data: trip };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  async addSegment(
    tenantId: string,
    tripId: string,
    input: AddSegmentInput,
    tripContext: TripContextInput,
    context: CorrelationContext = {},
  ): Promise<ServiceResult<Segment>> {
    try {
      const trip = await this.tripRepo.findById(tenantId, tripId);
      if (!trip) {
        return { success: false, error: `Trip ${tripId} not found` };
      }

      const segment = trip.addSegment(input);

      trip.addTimelineEvent({
        eventId: randomUUID(),
        tripId: trip.tripId,
        eventType: 'segment_added',
        eventData: { segmentId: segment.segmentId, segmentType: segment.segmentType },
      });

      await this.tripRepo.save(trip);

      // Publish SegmentAdded event
      const segCtx = buildSegmentEventContext(input.typeSpecificData, input.supplierCode, context);
      const segmentEventResult = createSegmentAddedEvent(segment, segCtx);
      if (segmentEventResult.success && segmentEventResult.event) {
        await this.eventBus.publish(segmentEventResult.event);
      }

      // If first segment, also publish TripCreated
      if (trip.segments.length === 1) {
        const tripCtx = buildTripEventContext(
          tripContext.origin,
          tripContext.destination,
          tripContext.isInternational,
          context,
        );
        const tripEventResult = createTripCreatedEvent(trip, tripCtx);
        if (tripEventResult.success && tripEventResult.event) {
          await this.eventBus.publish(tripEventResult.event);
        }
      }

      return { success: true, data: segment };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  async updateSegment(
    tenantId: string,
    tripId: string,
    input: UpdateSegmentServiceInput,
    context: CorrelationContext = {},
  ): Promise<ServiceResult<Segment>> {
    try {
      const trip = await this.tripRepo.findById(tenantId, tripId);
      if (!trip) {
        return { success: false, error: `Trip ${tripId} not found` };
      }

      const updated = trip.updateSegment(input.segmentId, input);

      trip.addTimelineEvent({
        eventId: randomUUID(),
        tripId: trip.tripId,
        eventType: 'segment_updated',
        eventData: { segmentId: updated.segmentId },
      });

      await this.tripRepo.save(trip);

      const segCtx = buildSegmentEventContext(input.typeSpecificData, input.supplierCode, context);
      const eventResult = createSegmentUpdatedEvent(updated, segCtx);
      if (eventResult.success && eventResult.event) {
        await this.eventBus.publish(eventResult.event);
      }

      return { success: true, data: updated };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  async removeSegment(
    tenantId: string,
    tripId: string,
    input: RemoveSegmentInput,
    context: CorrelationContext = {},
  ): Promise<ServiceResult<Segment>> {
    try {
      const trip = await this.tripRepo.findById(tenantId, tripId);
      if (!trip) {
        return { success: false, error: `Trip ${tripId} not found` };
      }

      const removed = trip.removeSegment(input.segmentId);

      trip.addTimelineEvent({
        eventId: randomUUID(),
        tripId: trip.tripId,
        eventType: 'segment_removed',
        eventData: { segmentId: removed.segmentId, segmentType: removed.segmentType },
      });

      await this.tripRepo.save(trip);

      const segCtx = buildSegmentEventContext(input.typeSpecificData, input.supplierCode, context);
      const eventResult = createSegmentRemovedEvent(removed, segCtx);
      if (eventResult.success && eventResult.event) {
        await this.eventBus.publish(eventResult.event);
      }

      return { success: true, data: removed };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  async addTimelineEvent(
    tenantId: string,
    tripId: string,
    input: AddTimelineEventInput,
  ): Promise<ServiceResult> {
    try {
      const trip = await this.tripRepo.findById(tenantId, tripId);
      if (!trip) {
        return { success: false, error: `Trip ${tripId} not found` };
      }

      trip.addTimelineEvent({
        eventId: randomUUID(),
        tripId: trip.tripId,
        eventType: input.eventType,
        eventData: input.eventData ?? {},
      });

      await this.tripRepo.save(trip);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  }
}

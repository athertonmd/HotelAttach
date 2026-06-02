/**
 * Trip and Timeline controllers.
 * GET /trips/{id}, GET /trips, GET /timeline/{tripId}
 */

import type { RequestContext } from './request-context.js';
import type { ApiResponse } from './response.js';
import { successResponse, notFoundResponse, errorResponse } from './response.js';
import type { TripRepository } from '../repositories/interfaces.js';

export class TripController {
  constructor(private readonly tripRepo: TripRepository) {}

  async getTripById(tripId: string, ctx: RequestContext): Promise<ApiResponse> {
    if (!ctx.tenantId) {
      return errorResponse('tenantId is required', ctx.correlationId, 401);
    }
    if (!tripId) {
      return errorResponse('tripId is required', ctx.correlationId);
    }

    const trip = await this.tripRepo.findById(ctx.tenantId, tripId);
    if (!trip) {
      return notFoundResponse(`Trip ${tripId} not found`, ctx.correlationId);
    }

    return successResponse(
      {
        tripId: trip.tripId,
        travellerId: trip.travellerId,
        status: trip.status,
        startDate: trip.startDate?.toISOString() ?? null,
        endDate: trip.endDate?.toISOString() ?? null,
        segmentCount: trip.segments.length,
      },
      ctx.correlationId,
    );
  }

  async searchTrips(ctx: RequestContext): Promise<ApiResponse> {
    if (!ctx.tenantId) {
      return errorResponse('tenantId is required', ctx.correlationId, 401);
    }

    const trips = await this.tripRepo.findByTenant(ctx.tenantId);

    return successResponse(
      trips.map((t) => ({
        tripId: t.tripId,
        travellerId: t.travellerId,
        status: t.status,
        startDate: t.startDate?.toISOString() ?? null,
        endDate: t.endDate?.toISOString() ?? null,
      })),
      ctx.correlationId,
    );
  }

  async getTimeline(tripId: string, ctx: RequestContext): Promise<ApiResponse> {
    if (!ctx.tenantId) {
      return errorResponse('tenantId is required', ctx.correlationId, 401);
    }
    if (!tripId) {
      return errorResponse('tripId is required', ctx.correlationId);
    }

    const trip = await this.tripRepo.findById(ctx.tenantId, tripId);
    if (!trip) {
      return notFoundResponse(`Trip ${tripId} not found`, ctx.correlationId);
    }

    return successResponse(
      trip.timeline.map((e) => ({
        eventId: e.eventId,
        eventType: e.eventType,
        eventData: e.eventData,
        createdAt: e.createdAt.toISOString(),
      })),
      ctx.correlationId,
    );
  }
}

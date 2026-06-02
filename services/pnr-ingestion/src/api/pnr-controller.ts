/**
 * POST /pnrs controller.
 * Accepts Mantic Point itinerary payload and calls IngestionService.
 */

import type { RequestContext } from './request-context.js';
import type { ApiResponse } from './response.js';
import { successResponse, errorResponse } from './response.js';
import type { IngestionService } from '../adapter/ingestion-service.js';
import type { ManticPointPayload } from '../adapter/mantic-point-dto.js';

export class PNRController {
  constructor(private readonly ingestionService: IngestionService) {}

  async createPNR(payload: unknown, ctx: RequestContext): Promise<ApiResponse> {
    if (!ctx.tenantId) {
      return errorResponse('tenantId is required in request context', ctx.correlationId, 401);
    }

    if (!payload || typeof payload !== 'object') {
      return errorResponse('Request body must be a JSON object', ctx.correlationId);
    }

    // Inject tenantId/corporateId from auth context (not from payload)
    const enrichedPayload: ManticPointPayload = {
      ...(payload as ManticPointPayload),
      tenantId: ctx.tenantId,
      corporateId: ctx.corporateId,
    };

    const result = await this.ingestionService.ingest(enrichedPayload, {
      correlationId: ctx.correlationId,
    });

    if (!result.success) {
      return errorResponse(result.error ?? 'Ingestion failed', ctx.correlationId);
    }

    return successResponse(
      {
        travellerId: result.travellerId,
        pnrId: result.pnrId,
        tripId: result.tripId,
        segmentCount: result.segmentCount,
      },
      ctx.correlationId,
      201,
    );
  }
}

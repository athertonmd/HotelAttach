/**
 * GET /travellers/{id} controller.
 */

import type { RequestContext } from './request-context.js';
import type { ApiResponse } from './response.js';
import { successResponse, notFoundResponse, errorResponse } from './response.js';
import type { TravellerRepository } from '../repositories/interfaces.js';

export class TravellerController {
  constructor(private readonly travellerRepo: TravellerRepository) {}

  async getTravellerById(travellerId: string, ctx: RequestContext): Promise<ApiResponse> {
    if (!ctx.tenantId) {
      return errorResponse('tenantId is required', ctx.correlationId, 401);
    }
    if (!travellerId) {
      return errorResponse('travellerId is required', ctx.correlationId);
    }

    const traveller = await this.travellerRepo.findById(ctx.tenantId, travellerId);
    if (!traveller) {
      return notFoundResponse(`Traveller ${travellerId} not found`, ctx.correlationId);
    }

    return successResponse(
      {
        travellerId: traveller.travellerId,
        firstName: traveller.firstName,
        lastName: traveller.lastName,
        email: traveller.email,
        employeeNumber: traveller.employeeNumber,
        status: traveller.status,
      },
      ctx.correlationId,
    );
  }
}

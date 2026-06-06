/**
 * Behaviour Intelligence API controller handlers.
 * Validates context, delegates to query services, returns uniform ApiResponse.
 */

import type { RequestContext, QueryParams } from './request-context.js';
import type { ApiResponse } from './response.js';
import { successResponse, errorResponse } from './response.js';
import type { QueryServiceDeps } from '../queries/behaviour-query-service.js';
import {
  getBehaviourOverviewSummary,
  getArchetypeDistribution,
  getFatigueSummary,
  getRevenueRiskSummary,
  getActionPerformanceSummary,
  getPredictionAccuracySummary,
} from '../queries/behaviour-query-service.js';
import type {
  BehaviourOverviewSummary,
  ArchetypeDistributionSummary,
  FatigueSummary,
  RevenueRiskSummary,
  ActionPerformanceSummary,
  PredictionAccuracySummary,
} from '../queries/behaviour-query-service.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

function parsePagination(params: QueryParams): { page: number; pageSize: number } | null {
  const page = params.page ? parseInt(params.page, 10) : 1;
  const pageSize = params.pageSize ? parseInt(params.pageSize, 10) : 20;
  if (isNaN(page) || page < 1) return null;
  if (isNaN(pageSize) || pageSize < 1 || pageSize > 100) return null;
  return { page, pageSize };
}

function getCorporateId(ctx: RequestContext, params: QueryParams): string {
  return params.corporateId ?? ctx.corporateId ?? '';
}

// ─── Handlers ───────────────────────────────────────────────────────────────

export async function handleGetBehaviourOverview(
  ctx: RequestContext,
  params: QueryParams,
  deps: QueryServiceDeps,
): Promise<ApiResponse<BehaviourOverviewSummary>> {
  if (!ctx.tenantId) {
    return errorResponse(ctx.correlationId, 'UNAUTHORIZED', 'tenantId is required');
  }
  const corporateId = getCorporateId(ctx, params);
  if (!corporateId) {
    return errorResponse(ctx.correlationId, 'BAD_REQUEST', 'corporateId is required');
  }

  try {
    const data = await getBehaviourOverviewSummary({ tenantId: ctx.tenantId, corporateId }, deps);
    return successResponse(ctx.correlationId, data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse(ctx.correlationId, 'INTERNAL_ERROR', message);
  }
}

export async function handleGetArchetypes(
  ctx: RequestContext,
  params: QueryParams,
  deps: QueryServiceDeps,
): Promise<ApiResponse<ArchetypeDistributionSummary>> {
  if (!ctx.tenantId) {
    return errorResponse(ctx.correlationId, 'UNAUTHORIZED', 'tenantId is required');
  }
  const corporateId = getCorporateId(ctx, params);
  if (!corporateId) {
    return errorResponse(ctx.correlationId, 'BAD_REQUEST', 'corporateId is required');
  }

  try {
    const data = await getArchetypeDistribution({ tenantId: ctx.tenantId, corporateId }, deps);
    return successResponse(ctx.correlationId, data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse(ctx.correlationId, 'INTERNAL_ERROR', message);
  }
}

export async function handleGetFatigue(
  ctx: RequestContext,
  params: QueryParams,
  deps: QueryServiceDeps,
): Promise<ApiResponse<FatigueSummary>> {
  if (!ctx.tenantId) {
    return errorResponse(ctx.correlationId, 'UNAUTHORIZED', 'tenantId is required');
  }
  const corporateId = getCorporateId(ctx, params);
  if (!corporateId) {
    return errorResponse(ctx.correlationId, 'BAD_REQUEST', 'corporateId is required');
  }
  const pagination = parsePagination(params);
  if (!pagination) {
    return errorResponse(ctx.correlationId, 'BAD_REQUEST', 'Invalid pagination parameters');
  }

  try {
    const data = await getFatigueSummary(
      { tenantId: ctx.tenantId, corporateId, ...pagination },
      deps,
    );
    return successResponse(ctx.correlationId, data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse(ctx.correlationId, 'INTERNAL_ERROR', message);
  }
}

export async function handleGetRevenueRisk(
  ctx: RequestContext,
  params: QueryParams,
  deps: QueryServiceDeps,
): Promise<ApiResponse<RevenueRiskSummary>> {
  if (!ctx.tenantId) {
    return errorResponse(ctx.correlationId, 'UNAUTHORIZED', 'tenantId is required');
  }
  const corporateId = getCorporateId(ctx, params);
  if (!corporateId) {
    return errorResponse(ctx.correlationId, 'BAD_REQUEST', 'corporateId is required');
  }
  const pagination = parsePagination(params);
  if (!pagination) {
    return errorResponse(ctx.correlationId, 'BAD_REQUEST', 'Invalid pagination parameters');
  }

  try {
    const data = await getRevenueRiskSummary(
      { tenantId: ctx.tenantId, corporateId, ...pagination },
      deps,
    );
    return successResponse(ctx.correlationId, data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse(ctx.correlationId, 'INTERNAL_ERROR', message);
  }
}

export async function handleGetActionPerformance(
  ctx: RequestContext,
  params: QueryParams,
  deps: QueryServiceDeps,
): Promise<ApiResponse<ActionPerformanceSummary>> {
  if (!ctx.tenantId) {
    return errorResponse(ctx.correlationId, 'UNAUTHORIZED', 'tenantId is required');
  }
  const corporateId = getCorporateId(ctx, params);
  if (!corporateId) {
    return errorResponse(ctx.correlationId, 'BAD_REQUEST', 'corporateId is required');
  }

  try {
    const data = await getActionPerformanceSummary({ tenantId: ctx.tenantId, corporateId }, deps);
    return successResponse(ctx.correlationId, data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse(ctx.correlationId, 'INTERNAL_ERROR', message);
  }
}

export async function handleGetPredictionAccuracy(
  ctx: RequestContext,
  params: QueryParams,
  deps: QueryServiceDeps,
): Promise<ApiResponse<PredictionAccuracySummary>> {
  if (!ctx.tenantId) {
    return errorResponse(ctx.correlationId, 'UNAUTHORIZED', 'tenantId is required');
  }
  const corporateId = getCorporateId(ctx, params);
  if (!corporateId) {
    return errorResponse(ctx.correlationId, 'BAD_REQUEST', 'corporateId is required');
  }

  try {
    const data = await getPredictionAccuracySummary({ tenantId: ctx.tenantId, corporateId }, deps);
    return successResponse(ctx.correlationId, data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse(ctx.correlationId, 'INTERNAL_ERROR', message);
  }
}

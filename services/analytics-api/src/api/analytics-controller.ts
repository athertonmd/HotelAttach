/**
 * Analytics API controller handlers.
 * Each handler validates context, delegates to query functions, and returns a uniform ApiResponse.
 */

import type { RequestContext } from './request-context.js';
import type { ApiResponse } from './response.js';
import { successResponse, errorResponse } from './response.js';
import { getOpportunitySummary, getOpportunityList } from '../queries/opportunity-queries.js';
import { getDutyOfCareSummary } from '../queries/duty-of-care-queries.js';
import { getEngagementSummary } from '../queries/engagement-queries.js';
import { getEscalationSummary } from '../queries/escalation-queries.js';
import type {
  OpportunityPipelineRepository,
  DutyOfCareRepository,
  EngagementFunnelRepository,
  AgentEscalationAnalyticsRepository,
} from '../repositories/interfaces.js';
import type { OpportunitySummary } from '../queries/opportunity-queries.js';
import type { DutyOfCareSummary } from '../queries/duty-of-care-queries.js';
import type { EngagementSummary } from '../queries/engagement-queries.js';
import type { EscalationSummary } from '../queries/escalation-queries.js';

export interface AnalyticsControllerDeps {
  pipelineRepo: OpportunityPipelineRepository;
  dutyOfCareRepo: DutyOfCareRepository;
  engagementRepo: EngagementFunnelRepository;
  escalationRepo: AgentEscalationAnalyticsRepository;
}

export interface QueryParams {
  corporateId?: string | undefined;
  state?: string | undefined;
  priority?: string | undefined;
  limit?: string | undefined;
  offset?: string | undefined;
  periodStart?: string | undefined;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getMondayOfCurrentWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

// ─── Handlers ───────────────────────────────────────────────────────────────

export async function handleGetOpportunitySummary(
  ctx: RequestContext,
  deps: AnalyticsControllerDeps,
): Promise<ApiResponse<OpportunitySummary>> {
  if (!ctx.tenantId) {
    return errorResponse(ctx.correlationId, 'UNAUTHORIZED', 'tenantId is required');
  }

  try {
    const data = await getOpportunitySummary(ctx.tenantId, deps.pipelineRepo);
    return successResponse(ctx.correlationId, data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse(ctx.correlationId, 'INTERNAL_ERROR', message);
  }
}

export async function handleGetOpportunityList(
  ctx: RequestContext,
  params: QueryParams,
  deps: AnalyticsControllerDeps,
): Promise<ApiResponse<{ items: Record<string, unknown>[]; total: number }>> {
  if (!ctx.tenantId) {
    return errorResponse(ctx.correlationId, 'UNAUTHORIZED', 'tenantId is required');
  }

  const limitStr = params.limit;
  const offsetStr = params.offset;

  let limit = 50;
  let offset = 0;

  if (limitStr !== undefined) {
    const parsed = Number(limitStr);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
      return errorResponse(ctx.correlationId, 'INVALID_PAGINATION', 'limit must be a valid number');
    }
    limit = parsed;
  }

  if (offsetStr !== undefined) {
    const parsed = Number(offsetStr);
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
      return errorResponse(
        ctx.correlationId,
        'INVALID_PAGINATION',
        'offset must be a valid number',
      );
    }
    offset = parsed;
  }

  if (limit > 100 || limit < 1) {
    return errorResponse(
      ctx.correlationId,
      'INVALID_PAGINATION',
      'limit must be between 1 and 100',
    );
  }

  if (offset < 0) {
    return errorResponse(ctx.correlationId, 'INVALID_PAGINATION', 'offset must be non-negative');
  }

  try {
    const data = await getOpportunityList(
      {
        tenantId: ctx.tenantId,
        corporateId: params.corporateId,
        state: params.state,
        priority: params.priority,
        limit,
        offset,
      },
      deps.pipelineRepo,
    );
    return successResponse(ctx.correlationId, data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse(ctx.correlationId, 'INTERNAL_ERROR', message);
  }
}

export async function handleGetDutyOfCareSummary(
  ctx: RequestContext,
  deps: AnalyticsControllerDeps,
): Promise<ApiResponse<DutyOfCareSummary>> {
  if (!ctx.tenantId) {
    return errorResponse(ctx.correlationId, 'UNAUTHORIZED', 'tenantId is required');
  }

  try {
    const data = await getDutyOfCareSummary(ctx.tenantId, deps.dutyOfCareRepo);
    return successResponse(ctx.correlationId, data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse(ctx.correlationId, 'INTERNAL_ERROR', message);
  }
}

export async function handleGetEngagementSummary(
  ctx: RequestContext,
  params: QueryParams,
  deps: AnalyticsControllerDeps,
): Promise<ApiResponse<EngagementSummary>> {
  if (!ctx.tenantId) {
    return errorResponse(ctx.correlationId, 'UNAUTHORIZED', 'tenantId is required');
  }

  let periodStart: Date;

  if (params.periodStart !== undefined) {
    const parsed = new Date(params.periodStart);
    if (isNaN(parsed.getTime())) {
      return errorResponse(
        ctx.correlationId,
        'INVALID_DATE_RANGE',
        'periodStart must be a valid ISO date',
      );
    }
    periodStart = parsed;
  } else {
    periodStart = getMondayOfCurrentWeek();
  }

  try {
    const data = await getEngagementSummary(ctx.tenantId, periodStart, deps.engagementRepo);
    return successResponse(ctx.correlationId, data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse(ctx.correlationId, 'INTERNAL_ERROR', message);
  }
}

export async function handleGetEscalationSummary(
  ctx: RequestContext,
  deps: AnalyticsControllerDeps,
): Promise<ApiResponse<EscalationSummary>> {
  if (!ctx.tenantId) {
    return errorResponse(ctx.correlationId, 'UNAUTHORIZED', 'tenantId is required');
  }

  try {
    const data = await getEscalationSummary(ctx.tenantId, deps.escalationRepo);
    return successResponse(ctx.correlationId, data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return errorResponse(ctx.correlationId, 'INTERNAL_ERROR', message);
  }
}

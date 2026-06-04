/**
 * Query service functions for the Opportunity Pipeline dashboard.
 * Provides summary metrics and filtered list retrieval.
 */

import type { OpportunityPipelineRepository } from '../repositories/interfaces.js';

export interface OpportunitySummary {
  activeCount: number;
  criticalCount: number;
  awaitingActionCount: number;
  atRiskCount: number;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
}

export interface OpportunityListOptions {
  tenantId: string;
  corporateId?: string | undefined;
  state?: string | undefined;
  priority?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}

const CLOSED_STATES = ['closed', 'rejected', 'expired', 'cancelled'];
const RISK_THRESHOLD_MS = 48 * 60 * 60 * 1000;

export async function getOpportunitySummary(
  tenantId: string,
  repo: OpportunityPipelineRepository,
): Promise<OpportunitySummary> {
  const all = await repo.findByTenant(tenantId);
  const active = all.filter((r) => !CLOSED_STATES.includes(r['lifecycleState'] as string));

  const now = new Date();
  const atRisk = active.filter((r) => {
    const dep = r['departureDate'] as string | undefined;
    if (!dep) return false;
    return new Date(dep).getTime() - now.getTime() <= RISK_THRESHOLD_MS;
  });

  const byPriority: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const row of active) {
    const p = row['priority'] as string;
    const t = row['opportunityType'] as string;
    byPriority[p] = (byPriority[p] ?? 0) + 1;
    byType[t] = (byType[t] ?? 0) + 1;
  }

  return {
    activeCount: active.length,
    criticalCount: active.filter((r) => r['priority'] === 'critical').length,
    awaitingActionCount: active.filter((r) => r['lifecycleState'] === 'awaiting_action').length,
    atRiskCount: atRisk.length,
    byPriority,
    byType,
  };
}

export async function getOpportunityList(
  options: OpportunityListOptions,
  repo: OpportunityPipelineRepository,
): Promise<{ items: Record<string, unknown>[]; total: number }> {
  let rows: Record<string, unknown>[];

  if (options.state) {
    rows = await repo.findByState(options.tenantId, options.state);
  } else if (options.priority) {
    rows = await repo.findByPriority(options.tenantId, options.priority);
  } else {
    rows = await repo.findByTenant(options.tenantId);
  }

  // Filter by corporateId if provided
  if (options.corporateId) {
    rows = rows.filter((r) => r['corporateId'] === options.corporateId);
  }

  const total = rows.length;
  const offset = options.offset ?? 0;
  const limit = options.limit ?? 50;
  const items = rows.slice(offset, offset + limit);

  return { items, total };
}

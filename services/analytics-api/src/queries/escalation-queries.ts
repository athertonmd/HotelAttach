/**
 * Query service functions for the Agent Escalation Analytics dashboard.
 * Provides pending escalation counts and breakdowns.
 */

import type { AgentEscalationAnalyticsRepository } from '../repositories/interfaces.js';

export interface EscalationSummary {
  pendingCount: number;
  totalCount: number;
  byPriority: Record<string, number>;
  byReason: Record<string, number>;
}

export async function getEscalationSummary(
  tenantId: string,
  repo: AgentEscalationAnalyticsRepository,
): Promise<EscalationSummary> {
  const all = await repo.findByTenant(tenantId);
  const pending = await repo.findPending(tenantId);

  const byPriority: Record<string, number> = {};
  const byReason: Record<string, number> = {};
  for (const row of pending) {
    const p = row['priority'] as string;
    const r = row['reason'] as string;
    if (p) byPriority[p] = (byPriority[p] ?? 0) + 1;
    if (r) byReason[r] = (byReason[r] ?? 0) + 1;
  }

  return {
    pendingCount: pending.length,
    totalCount: all.length,
    byPriority,
    byReason,
  };
}

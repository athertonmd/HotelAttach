/**
 * Query service functions for the Duty of Care dashboard.
 * Provides traveller visibility and risk metrics.
 */

import type { DutyOfCareRepository } from '../repositories/interfaces.js';

export interface DutyOfCareSummary {
  totalTrips: number;
  resolvedCount: number;
  unresolvedCount: number;
  visibilityRate: number; // percentage 0-100
  highRiskUnresolved: number;
  approachingDeparture: number;
}

const APPROACH_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function getDutyOfCareSummary(
  tenantId: string,
  repo: DutyOfCareRepository,
): Promise<DutyOfCareSummary> {
  const all = await repo.findByTenant(tenantId);
  const unresolved = await repo.findUnresolved(tenantId);

  const resolved = all.length - unresolved.length;
  const visibilityRate = all.length > 0 ? Math.round((resolved / all.length) * 100) : 100;

  const highRiskUnresolved = unresolved.filter(
    (r) => r['destinationRiskLevel'] === 'high' || r['destinationRiskLevel'] === 'critical',
  ).length;

  const now = new Date();
  const approachingDeparture = unresolved.filter((r) => {
    const dep = r['departureDate'] as string | undefined;
    if (!dep) return false;
    const diff = new Date(dep).getTime() - now.getTime();
    return diff > 0 && diff <= APPROACH_THRESHOLD_MS;
  }).length;

  return {
    totalTrips: all.length,
    resolvedCount: resolved,
    unresolvedCount: unresolved.length,
    visibilityRate,
    highRiskUnresolved,
    approachingDeparture,
  };
}

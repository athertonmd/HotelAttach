/**
 * RevenueAtRisk — Calculates revenue risk from booking behaviour.
 * Source: BR-1701–BR-1708
 */

import type { RiskTier } from './enums.js';
import { deriveRiskTier } from './enums.js';

export interface RevenueAtRisk {
  readonly travellerId: string;
  readonly tenantId: string;
  readonly corporateId: string;
  readonly estimatedCommission: number;
  readonly attachmentLikelihood: number;
  readonly revenueAtRisk: number;
  readonly riskTier: RiskTier;
  readonly calculatedAt: Date;
}

export interface CalculateRevenueAtRiskInput {
  travellerId: string;
  tenantId: string;
  corporateId: string;
  estimatedCommission: number;
  attachmentLikelihood: number;
}

/**
 * Calculate revenue at risk.
 * BR-1701: Revenue at risk = commission × (1 - attachmentLikelihood/100)
 * BR-1702: Secure tier: >90% likelihood
 * BR-1703: Likely tier: 70–90%
 * BR-1704: Uncertain tier: 40–69%
 * BR-1705: At risk tier: 20–39%
 * BR-1706: Critical tier: <20%
 * BR-1707: Commission must be >= 0
 * BR-1708: Attachment likelihood clamped 0–100
 */
export function calculateRevenueAtRisk(input: CalculateRevenueAtRiskInput): RevenueAtRisk {
  if (!input.travellerId) throw new Error('travellerId is required');
  if (!input.tenantId) throw new Error('tenantId is required');
  if (!input.corporateId) throw new Error('corporateId is required');

  // BR-1707
  if (input.estimatedCommission < 0) {
    throw new Error('estimatedCommission must be >= 0 (BR-1707)');
  }

  // BR-1708: Clamp
  const attachmentLikelihood = Math.min(100, Math.max(0, input.attachmentLikelihood));

  // BR-1701: Risk = commission × (1 - likelihood/100)
  const revenueAtRisk = Math.round(input.estimatedCommission * (1 - attachmentLikelihood / 100));

  // BR-1702–BR-1706: Tier
  const riskTier = deriveRiskTier(attachmentLikelihood);

  return {
    travellerId: input.travellerId,
    tenantId: input.tenantId,
    corporateId: input.corporateId,
    estimatedCommission: input.estimatedCommission,
    attachmentLikelihood,
    revenueAtRisk,
    riskTier,
    calculatedAt: new Date(),
  };
}

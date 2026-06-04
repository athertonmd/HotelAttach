/**
 * OpportunityAssessment — immutable, append-only scoring record.
 * Source: Approved Project 3 Domain Entities
 */

import { randomUUID } from 'node:crypto';
import type { Priority } from './enums.js';
import { derivePriority } from './enums.js';

export interface CreateAssessmentInput {
  opportunityId: string;
  tenantId: string;
  correlationId: string;
  hotelRequirementConfidence: number;
  complianceSeverity: number;
  revenueOpportunity: number;
  dutyOfCareImpact: number;
  supplierContractImpact: number;
  timeToDeparture: number;
  ruleIdsApplied?: string[];
  previousScore?: number | null;
  scoreChangeReason?: string | null;
}

export class OpportunityAssessment {
  readonly assessmentId: string;
  readonly opportunityId: string;
  readonly tenantId: string;
  readonly correlationId: string;
  readonly hotelRequirementConfidence: number;
  readonly complianceSeverity: number;
  readonly revenueOpportunity: number;
  readonly dutyOfCareImpact: number;
  readonly supplierContractImpact: number;
  readonly timeToDeparture: number;
  readonly totalScore: number;
  readonly priority: Priority;
  readonly assessedAt: Date;
  readonly ruleIdsApplied: string[];
  readonly previousScore: number | null;
  readonly scoreChangeReason: string | null;

  private constructor(input: CreateAssessmentInput, score: number, now: Date) {
    this.assessmentId = randomUUID();
    this.opportunityId = input.opportunityId;
    this.tenantId = input.tenantId;
    this.correlationId = input.correlationId;
    this.hotelRequirementConfidence = input.hotelRequirementConfidence;
    this.complianceSeverity = input.complianceSeverity;
    this.revenueOpportunity = input.revenueOpportunity;
    this.dutyOfCareImpact = input.dutyOfCareImpact;
    this.supplierContractImpact = input.supplierContractImpact;
    this.timeToDeparture = input.timeToDeparture;
    this.totalScore = score;
    this.priority = derivePriority(score);
    this.assessedAt = now;
    this.ruleIdsApplied = input.ruleIdsApplied ?? [];
    this.previousScore = input.previousScore ?? null;
    this.scoreChangeReason = input.scoreChangeReason ?? null;
  }

  static create(input: CreateAssessmentInput): OpportunityAssessment {
    if (!input.opportunityId) throw new Error('opportunityId is required');
    if (!input.tenantId) throw new Error('tenantId is required');

    const components = [
      input.hotelRequirementConfidence,
      input.complianceSeverity,
      input.revenueOpportunity,
      input.dutyOfCareImpact,
      input.supplierContractImpact,
      input.timeToDeparture,
    ];
    for (const c of components) {
      if (c < 0 || c > 100) throw new Error('All scoring components must be between 0 and 100');
    }

    // Weighted score calculation (BR-600)
    const totalScore = Math.min(
      100,
      Math.round(
        input.hotelRequirementConfidence * 0.25 +
          input.complianceSeverity * 0.2 +
          input.revenueOpportunity * 0.2 +
          input.dutyOfCareImpact * 0.15 +
          input.supplierContractImpact * 0.1 +
          input.timeToDeparture * 0.1,
      ),
    );

    return new OpportunityAssessment(input, totalScore, new Date());
  }
}

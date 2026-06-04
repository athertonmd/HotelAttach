/**
 * OpportunityRecommendation — mutable (active/superseded).
 * Source: Approved Project 3 Domain Entities + Refinement 4
 */

import { randomUUID } from 'node:crypto';
import type { RecommendationType, Priority } from './enums.js';

export interface CreateRecommendationInput {
  opportunityId: string;
  tenantId: string;
  recommendationType: RecommendationType;
  recommendationText: string;
  priority: Priority;
  correlationId: string;
  preferredSupplierId?: string | null;
  estimatedNights?: number | null;
  estimatedCost?: number | null;
  expiresAt?: Date | null;
}

export class OpportunityRecommendation {
  readonly recommendationId: string;
  readonly opportunityId: string;
  readonly tenantId: string;
  readonly recommendationType: RecommendationType;
  readonly recommendationText: string;
  readonly priority: Priority;
  readonly correlationId: string;
  readonly preferredSupplierId: string | null;
  readonly estimatedNights: number | null;
  readonly estimatedCost: number | null;
  readonly createdAt: Date;
  readonly expiresAt: Date | null;

  private _isActive: boolean;
  private _supersededBy: string | null;

  get isActive(): boolean {
    return this._isActive;
  }
  get supersededBy(): string | null {
    return this._supersededBy;
  }

  private constructor(input: CreateRecommendationInput, now: Date) {
    this.recommendationId = randomUUID();
    this.opportunityId = input.opportunityId;
    this.tenantId = input.tenantId;
    this.recommendationType = input.recommendationType;
    this.recommendationText = input.recommendationText;
    this.priority = input.priority;
    this.correlationId = input.correlationId;
    this.preferredSupplierId = input.preferredSupplierId ?? null;
    this.estimatedNights = input.estimatedNights ?? null;
    this.estimatedCost = input.estimatedCost ?? null;
    this.createdAt = now;
    this.expiresAt = input.expiresAt ?? null;
    this._isActive = true;
    this._supersededBy = null;
  }

  static create(input: CreateRecommendationInput): OpportunityRecommendation {
    if (!input.opportunityId) throw new Error('opportunityId is required');
    if (!input.tenantId) throw new Error('tenantId is required');
    if (!input.recommendationType) throw new Error('recommendationType is required');
    if (!input.recommendationText) throw new Error('recommendationText is required');
    if (input.recommendationText.length > 1000) {
      throw new Error('recommendationText must be <= 1000 characters');
    }
    if (!input.priority) throw new Error('priority is required');
    if (!input.correlationId) throw new Error('correlationId is required');
    if (input.estimatedNights !== undefined && input.estimatedNights !== null) {
      if (input.estimatedNights < 1) throw new Error('estimatedNights must be at least 1');
    }
    if (input.estimatedCost !== undefined && input.estimatedCost !== null) {
      if (input.estimatedCost < 0) throw new Error('estimatedCost must be >= 0');
    }

    return new OpportunityRecommendation(input, new Date());
  }

  /** Supersede this recommendation with a new one */
  supersede(newRecommendationId: string): void {
    if (!this._isActive) {
      throw new Error('Recommendation is already inactive');
    }
    this._isActive = false;
    this._supersededBy = newRecommendationId;
  }
}

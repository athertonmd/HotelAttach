/**
 * Repository interfaces for Opportunity Detection.
 * All queries require tenantId for mandatory tenant isolation.
 */

import type { Opportunity } from '../domain/opportunity.js';
import type { OpportunityAssessment } from '../domain/opportunity-assessment.js';
import type { OpportunitySuppression } from '../domain/opportunity-suppression.js';
import type { OpportunityCommunication } from '../domain/opportunity-communication.js';
import type { OpportunityClosure } from '../domain/opportunity-closure.js';
import type { OpportunityAuditEntry } from '../domain/opportunity-audit-entry.js';
import type { LifecycleState, OpportunityType } from '../domain/enums.js';

export interface OpportunityRepository {
  save(opportunity: Opportunity): Promise<void>;
  findById(tenantId: string, opportunityId: string): Promise<Opportunity | undefined>;
  findByTravellerId(tenantId: string, travellerId: string): Promise<Opportunity[]>;
  findByTripId(tenantId: string, tripId: string): Promise<Opportunity[]>;
  findActiveByTraveller(tenantId: string, travellerId: string): Promise<Opportunity[]>;
  findByState(tenantId: string, state: LifecycleState): Promise<Opportunity[]>;
  findByType(tenantId: string, type: OpportunityType): Promise<Opportunity[]>;
  remove(tenantId: string, opportunityId: string): Promise<void>;
}

export interface OpportunityAssessmentRepository {
  save(assessment: OpportunityAssessment): Promise<void>;
  findByOpportunityId(tenantId: string, opportunityId: string): Promise<OpportunityAssessment[]>;
}

export interface OpportunitySuppressionRepository {
  save(suppression: OpportunitySuppression): Promise<void>;
  findActiveByOpportunityId(
    tenantId: string,
    opportunityId: string,
  ): Promise<OpportunitySuppression[]>;
  findExpiredSuppressions(tenantId: string, now: Date): Promise<OpportunitySuppression[]>;
}

export interface OpportunityCommunicationRepository {
  save(communication: OpportunityCommunication): Promise<void>;
  findByOpportunityId(tenantId: string, opportunityId: string): Promise<OpportunityCommunication[]>;
}

export interface OpportunityClosureRepository {
  save(closure: OpportunityClosure): Promise<void>;
  findByOpportunityId(tenantId: string, opportunityId: string): Promise<OpportunityClosure[]>;
}

export interface OpportunityAuditRepository {
  append(entry: OpportunityAuditEntry): Promise<void>;
  findByOpportunityId(tenantId: string, opportunityId: string): Promise<OpportunityAuditEntry[]>;
}

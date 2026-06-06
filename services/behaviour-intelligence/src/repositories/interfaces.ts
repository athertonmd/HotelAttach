/**
 * Repository interfaces for Behaviour Intelligence.
 * All queries require tenantId for mandatory tenant isolation.
 */

import type { TravellerBehaviourProfile } from '../domain/traveller-behaviour-profile.js';
import type { ArchetypeAssignment } from '../domain/traveller-archetype.js';
import type { BookingAttribution } from '../domain/booking-attribution.js';
import type { BehaviourDrift } from '../domain/behaviour-drift.js';
import type { CommunicationFatigue } from '../domain/communication-fatigue.js';
import type { RevenueAtRisk } from '../domain/revenue-at-risk.js';
import type { RecommendedAction } from '../domain/recommended-action.js';
import type { PredictionOutcome } from '../domain/prediction-outcome.js';

export interface TravellerBehaviourProfileRepository {
  save(tenantId: string, profile: TravellerBehaviourProfile): Promise<void>;
  findByTravellerId(
    tenantId: string,
    travellerId: string,
  ): Promise<TravellerBehaviourProfile | undefined>;
  findByCorporateId(tenantId: string, corporateId: string): Promise<TravellerBehaviourProfile[]>;
}

export interface TravellerArchetypeRepository {
  save(tenantId: string, travellerId: string, assignment: ArchetypeAssignment): Promise<void>;
  findByTravellerId(
    tenantId: string,
    travellerId: string,
  ): Promise<ArchetypeAssignment | undefined>;
  findByCorporateId(
    tenantId: string,
    corporateId: string,
    travellerIds: string[],
  ): Promise<Map<string, ArchetypeAssignment>>;
}

export interface BookingAttributionRepository {
  /** Append-only: attributions are never updated */
  append(tenantId: string, attribution: BookingAttribution): Promise<void>;
  findByBookingId(tenantId: string, bookingId: string): Promise<BookingAttribution | undefined>;
  findByTravellerId(tenantId: string, travellerId: string): Promise<BookingAttribution[]>;
  findByOpportunityId(tenantId: string, opportunityId: string): Promise<BookingAttribution[]>;
}

export interface BehaviourDriftRepository {
  save(tenantId: string, drift: BehaviourDrift): Promise<void>;
  findByTravellerId(tenantId: string, travellerId: string): Promise<BehaviourDrift | undefined>;
  findByCorporateId(tenantId: string, corporateId: string): Promise<BehaviourDrift[]>;
}

export interface CommunicationFatigueRepository {
  save(tenantId: string, fatigue: CommunicationFatigue): Promise<void>;
  findByTravellerId(
    tenantId: string,
    travellerId: string,
  ): Promise<CommunicationFatigue | undefined>;
  findByCorporateId(tenantId: string, corporateId: string): Promise<CommunicationFatigue[]>;
}

export interface RevenueAtRiskRepository {
  save(tenantId: string, risk: RevenueAtRisk): Promise<void>;
  findByTravellerId(tenantId: string, travellerId: string): Promise<RevenueAtRisk | undefined>;
  findByCorporateId(tenantId: string, corporateId: string): Promise<RevenueAtRisk[]>;
}

export interface RecommendedActionRepository {
  save(tenantId: string, opportunityId: string, action: RecommendedAction): Promise<void>;
  findActiveByOpportunityId(
    tenantId: string,
    opportunityId: string,
  ): Promise<RecommendedAction | undefined>;
  findByTravellerId(tenantId: string, travellerId: string): Promise<RecommendedAction[]>;
  remove(tenantId: string, opportunityId: string): Promise<void>;
}

export interface PredictionOutcomeRepository {
  /** Append-only: outcomes are never updated */
  append(tenantId: string, outcome: PredictionOutcome): Promise<void>;
  findByRecommendationId(
    tenantId: string,
    recommendationId: string,
  ): Promise<PredictionOutcome | undefined>;
  findByTravellerId(tenantId: string, travellerId: string): Promise<PredictionOutcome[]>;
  findByOpportunityId(tenantId: string, opportunityId: string): Promise<PredictionOutcome[]>;
}

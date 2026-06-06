/**
 * In-memory repository implementations for Behaviour Intelligence.
 * Designed for unit testing and local development.
 * All operations enforce tenant isolation.
 */

import type { TravellerBehaviourProfile } from '../domain/traveller-behaviour-profile.js';
import type { ArchetypeAssignment } from '../domain/traveller-archetype.js';
import type { BookingAttribution } from '../domain/booking-attribution.js';
import type { BehaviourDrift } from '../domain/behaviour-drift.js';
import type { CommunicationFatigue } from '../domain/communication-fatigue.js';
import type { RevenueAtRisk } from '../domain/revenue-at-risk.js';
import type { RecommendedAction } from '../domain/recommended-action.js';
import type { PredictionOutcome } from '../domain/prediction-outcome.js';
import type {
  TravellerBehaviourProfileRepository,
  TravellerArchetypeRepository,
  BookingAttributionRepository,
  BehaviourDriftRepository,
  CommunicationFatigueRepository,
  RevenueAtRiskRepository,
  RecommendedActionRepository,
  PredictionOutcomeRepository,
} from './interfaces.js';

function key(tenantId: string, id: string): string {
  return `${tenantId}::${id}`;
}

export class InMemoryProfileRepository implements TravellerBehaviourProfileRepository {
  private readonly store = new Map<string, TravellerBehaviourProfile>();

  async save(tenantId: string, profile: TravellerBehaviourProfile): Promise<void> {
    this.store.set(key(tenantId, profile.travellerId), profile);
  }

  async findByTravellerId(
    tenantId: string,
    travellerId: string,
  ): Promise<TravellerBehaviourProfile | undefined> {
    return this.store.get(key(tenantId, travellerId));
  }

  async findByCorporateId(
    tenantId: string,
    corporateId: string,
  ): Promise<TravellerBehaviourProfile[]> {
    const results: TravellerBehaviourProfile[] = [];
    for (const p of this.store.values()) {
      if (p.tenantId === tenantId && p.corporateId === corporateId) results.push(p);
    }
    return results;
  }
}

export class InMemoryArchetypeRepository implements TravellerArchetypeRepository {
  private readonly store = new Map<string, ArchetypeAssignment>();

  async save(
    tenantId: string,
    travellerId: string,
    assignment: ArchetypeAssignment,
  ): Promise<void> {
    this.store.set(key(tenantId, travellerId), assignment);
  }

  async findByTravellerId(
    tenantId: string,
    travellerId: string,
  ): Promise<ArchetypeAssignment | undefined> {
    return this.store.get(key(tenantId, travellerId));
  }

  async findByCorporateId(
    tenantId: string,
    _corporateId: string,
    travellerIds: string[],
  ): Promise<Map<string, ArchetypeAssignment>> {
    const result = new Map<string, ArchetypeAssignment>();
    for (const tid of travellerIds) {
      const assignment = this.store.get(key(tenantId, tid));
      if (assignment) result.set(tid, assignment);
    }
    return result;
  }
}

export class InMemoryAttributionRepository implements BookingAttributionRepository {
  private readonly store: BookingAttribution[] = [];

  async append(tenantId: string, attribution: BookingAttribution): Promise<void> {
    if (attribution.tenantId !== tenantId) {
      throw new Error('Tenant isolation violation');
    }
    this.store.push(attribution);
  }

  async findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<BookingAttribution | undefined> {
    return this.store.find((a) => a.tenantId === tenantId && a.bookingId === bookingId);
  }

  async findByTravellerId(tenantId: string, travellerId: string): Promise<BookingAttribution[]> {
    return this.store.filter((a) => a.tenantId === tenantId && a.travellerId === travellerId);
  }

  async findByOpportunityId(
    tenantId: string,
    opportunityId: string,
  ): Promise<BookingAttribution[]> {
    return this.store.filter((a) => a.tenantId === tenantId && a.opportunityId === opportunityId);
  }
}

export class InMemoryDriftRepository implements BehaviourDriftRepository {
  private readonly store = new Map<string, BehaviourDrift>();

  async save(tenantId: string, drift: BehaviourDrift): Promise<void> {
    this.store.set(key(tenantId, drift.travellerId), drift);
  }

  async findByTravellerId(
    tenantId: string,
    travellerId: string,
  ): Promise<BehaviourDrift | undefined> {
    return this.store.get(key(tenantId, travellerId));
  }

  async findByCorporateId(tenantId: string, corporateId: string): Promise<BehaviourDrift[]> {
    const results: BehaviourDrift[] = [];
    for (const d of this.store.values()) {
      if (d.tenantId === tenantId && d.corporateId === corporateId) results.push(d);
    }
    return results;
  }
}

export class InMemoryFatigueRepository implements CommunicationFatigueRepository {
  private readonly store = new Map<string, CommunicationFatigue>();

  async save(tenantId: string, fatigue: CommunicationFatigue): Promise<void> {
    this.store.set(key(tenantId, fatigue.travellerId), fatigue);
  }

  async findByTravellerId(
    tenantId: string,
    travellerId: string,
  ): Promise<CommunicationFatigue | undefined> {
    return this.store.get(key(tenantId, travellerId));
  }

  async findByCorporateId(tenantId: string, corporateId: string): Promise<CommunicationFatigue[]> {
    const results: CommunicationFatigue[] = [];
    for (const f of this.store.values()) {
      if (f.tenantId === tenantId && f.corporateId === corporateId) results.push(f);
    }
    return results;
  }
}

export class InMemoryRevenueAtRiskRepository implements RevenueAtRiskRepository {
  private readonly store = new Map<string, RevenueAtRisk>();

  async save(tenantId: string, risk: RevenueAtRisk): Promise<void> {
    this.store.set(key(tenantId, risk.travellerId), risk);
  }

  async findByTravellerId(
    tenantId: string,
    travellerId: string,
  ): Promise<RevenueAtRisk | undefined> {
    return this.store.get(key(tenantId, travellerId));
  }

  async findByCorporateId(tenantId: string, corporateId: string): Promise<RevenueAtRisk[]> {
    const results: RevenueAtRisk[] = [];
    for (const r of this.store.values()) {
      if (r.tenantId === tenantId && r.corporateId === corporateId) results.push(r);
    }
    return results;
  }
}

export class InMemoryRecommendedActionRepository implements RecommendedActionRepository {
  private readonly store = new Map<string, { action: RecommendedAction; travellerId: string }>();

  async save(tenantId: string, opportunityId: string, action: RecommendedAction): Promise<void> {
    // Store needs travellerId for lookup — derive from context
    this.store.set(key(tenantId, opportunityId), { action, travellerId: '' });
  }

  /** Save with travellerId for findByTravellerId support */
  async saveWithTraveller(
    tenantId: string,
    opportunityId: string,
    travellerId: string,
    action: RecommendedAction,
  ): Promise<void> {
    this.store.set(key(tenantId, opportunityId), { action, travellerId });
  }

  async findActiveByOpportunityId(
    tenantId: string,
    opportunityId: string,
  ): Promise<RecommendedAction | undefined> {
    const entry = this.store.get(key(tenantId, opportunityId));
    return entry?.action;
  }

  async findByTravellerId(tenantId: string, travellerId: string): Promise<RecommendedAction[]> {
    const results: RecommendedAction[] = [];
    for (const [k, v] of this.store.entries()) {
      if (k.startsWith(`${tenantId}::`) && v.travellerId === travellerId) {
        results.push(v.action);
      }
    }
    return results;
  }

  async remove(tenantId: string, opportunityId: string): Promise<void> {
    this.store.delete(key(tenantId, opportunityId));
  }
}

export class InMemoryPredictionOutcomeRepository implements PredictionOutcomeRepository {
  private readonly store: PredictionOutcome[] = [];

  async append(tenantId: string, outcome: PredictionOutcome): Promise<void> {
    if (outcome.tenantId !== tenantId) {
      throw new Error('Tenant isolation violation');
    }
    this.store.push(outcome);
  }

  async findByRecommendationId(
    tenantId: string,
    recommendationId: string,
  ): Promise<PredictionOutcome | undefined> {
    return this.store.find(
      (o) => o.tenantId === tenantId && o.recommendationId === recommendationId,
    );
  }

  async findByTravellerId(tenantId: string, travellerId: string): Promise<PredictionOutcome[]> {
    return this.store.filter((o) => o.tenantId === tenantId && o.travellerId === travellerId);
  }

  async findByOpportunityId(tenantId: string, opportunityId: string): Promise<PredictionOutcome[]> {
    return this.store.filter((o) => o.tenantId === tenantId && o.opportunityId === opportunityId);
  }
}

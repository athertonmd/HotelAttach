/**
 * Unit tests for Behaviour Intelligence in-memory repositories.
 * Tests tenant isolation, save/load, and query behaviour.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryProfileRepository,
  InMemoryArchetypeRepository,
  InMemoryAttributionRepository,
  InMemoryDriftRepository,
  InMemoryFatigueRepository,
  InMemoryRevenueAtRiskRepository,
  InMemoryRecommendedActionRepository,
  InMemoryPredictionOutcomeRepository,
} from '../repositories/in-memory.js';
import { createProfile } from '../domain/traveller-behaviour-profile.js';
import { createAttribution } from '../domain/booking-attribution.js';
import { evaluateOutcome } from '../domain/prediction-outcome.js';
import type { ArchetypeAssignment } from '../domain/traveller-archetype.js';
import type { BehaviourDrift } from '../domain/behaviour-drift.js';
import type { CommunicationFatigue } from '../domain/communication-fatigue.js';
import type { RevenueAtRisk } from '../domain/revenue-at-risk.js';
import type { RecommendedAction } from '../domain/recommended-action.js';

const T1 = 'tenant-001';
const T2 = 'tenant-002';
const CORP = 'corp-001';
const TRAV1 = 'trav-001';
const TRAV2 = 'trav-002';

describe('InMemoryProfileRepository', () => {
  let repo: InMemoryProfileRepository;

  beforeEach(() => {
    repo = new InMemoryProfileRepository();
  });

  it('saves and loads by travellerId', async () => {
    const profile = createProfile({
      travellerId: TRAV1,
      tenantId: T1,
      corporateId: CORP,
      avgLeadTimeDays: 7,
      bookingConsistency: 0.8,
      bookingVariabilityDays: 2,
      complianceRate: 90,
      avgResponseTimeHours: 4,
      preferredChannel: 'email',
      selfBookingRate: 75,
      tripsAnalysed: 10,
      tripCountUsed: 10,
      predictedLeadTimeDays: 6,
      segment: 'self_sufficient',
    });
    await repo.save(T1, profile);
    const loaded = await repo.findByTravellerId(T1, TRAV1);
    expect(loaded).toEqual(profile);
  });

  it('enforces tenant isolation', async () => {
    const profile = createProfile({
      travellerId: TRAV1,
      tenantId: T1,
      corporateId: CORP,
      avgLeadTimeDays: 7,
      bookingConsistency: 0.8,
      bookingVariabilityDays: 2,
      complianceRate: 90,
      avgResponseTimeHours: 4,
      preferredChannel: 'email',
      selfBookingRate: 75,
      tripsAnalysed: 10,
      tripCountUsed: 10,
      predictedLeadTimeDays: 6,
      segment: 'self_sufficient',
    });
    await repo.save(T1, profile);
    const cross = await repo.findByTravellerId(T2, TRAV1);
    expect(cross).toBeUndefined();
  });

  it('finds by corporateId', async () => {
    const p1 = createProfile({
      travellerId: TRAV1,
      tenantId: T1,
      corporateId: CORP,
      avgLeadTimeDays: 7,
      bookingConsistency: 0.8,
      bookingVariabilityDays: 2,
      complianceRate: 90,
      avgResponseTimeHours: 4,
      preferredChannel: 'email',
      selfBookingRate: 75,
      tripsAnalysed: 10,
      tripCountUsed: 10,
      predictedLeadTimeDays: 6,
      segment: 'self_sufficient',
    });
    const p2 = createProfile({
      travellerId: TRAV2,
      tenantId: T1,
      corporateId: CORP,
      avgLeadTimeDays: 5,
      bookingConsistency: 0.6,
      bookingVariabilityDays: 3,
      complianceRate: 70,
      avgResponseTimeHours: 8,
      preferredChannel: 'sms',
      selfBookingRate: 50,
      tripsAnalysed: 8,
      tripCountUsed: 8,
      predictedLeadTimeDays: 5,
      segment: 'reliable_late',
    });
    await repo.save(T1, p1);
    await repo.save(T1, p2);
    const results = await repo.findByCorporateId(T1, CORP);
    expect(results).toHaveLength(2);
  });
});

describe('InMemoryArchetypeRepository', () => {
  let repo: InMemoryArchetypeRepository;

  beforeEach(() => {
    repo = new InMemoryArchetypeRepository();
  });

  it('saves and loads archetype', async () => {
    const assignment: ArchetypeAssignment = {
      archetype: 'autopilot',
      confidence: 90,
      previousArchetype: null,
    };
    await repo.save(T1, TRAV1, assignment);
    const loaded = await repo.findByTravellerId(T1, TRAV1);
    expect(loaded?.archetype).toBe('autopilot');
  });

  it('enforces tenant isolation', async () => {
    const assignment: ArchetypeAssignment = {
      archetype: 'responsive',
      confidence: 70,
      previousArchetype: null,
    };
    await repo.save(T1, TRAV1, assignment);
    const cross = await repo.findByTravellerId(T2, TRAV1);
    expect(cross).toBeUndefined();
  });
});

describe('InMemoryAttributionRepository', () => {
  let repo: InMemoryAttributionRepository;

  beforeEach(() => {
    repo = new InMemoryAttributionRepository();
  });

  it('appends and finds by bookingId', async () => {
    const attr = createAttribution({
      bookingId: 'book-001',
      travellerId: TRAV1,
      tenantId: T1,
      corporateId: CORP,
      attributionType: 'email',
      estimatedCommission: 100,
    });
    await repo.append(T1, attr);
    const loaded = await repo.findByBookingId(T1, 'book-001');
    expect(loaded?.attributionId).toBe(attr.attributionId);
  });

  it('enforces tenant isolation on append', async () => {
    const attr = createAttribution({
      bookingId: 'book-001',
      travellerId: TRAV1,
      tenantId: T1,
      corporateId: CORP,
      attributionType: 'email',
      estimatedCommission: 100,
    });
    await expect(repo.append(T2, attr)).rejects.toThrow('Tenant isolation');
  });

  it('is append-only (multiple appends accumulate)', async () => {
    const a1 = createAttribution({
      bookingId: 'book-001',
      travellerId: TRAV1,
      tenantId: T1,
      corporateId: CORP,
      attributionType: 'email',
      estimatedCommission: 100,
    });
    const a2 = createAttribution({
      bookingId: 'book-002',
      travellerId: TRAV1,
      tenantId: T1,
      corporateId: CORP,
      attributionType: 'sms',
      estimatedCommission: 50,
    });
    await repo.append(T1, a1);
    await repo.append(T1, a2);
    const results = await repo.findByTravellerId(T1, TRAV1);
    expect(results).toHaveLength(2);
  });

  it('finds by opportunityId', async () => {
    const attr = createAttribution({
      bookingId: 'book-001',
      travellerId: TRAV1,
      tenantId: T1,
      corporateId: CORP,
      attributionType: 'email',
      opportunityId: 'opp-001',
      estimatedCommission: 100,
    });
    await repo.append(T1, attr);
    const results = await repo.findByOpportunityId(T1, 'opp-001');
    expect(results).toHaveLength(1);
  });
});

describe('InMemoryDriftRepository', () => {
  let repo: InMemoryDriftRepository;

  beforeEach(() => {
    repo = new InMemoryDriftRepository();
  });

  it('saves and loads by travellerId', async () => {
    const drift: BehaviourDrift = {
      travellerId: TRAV1,
      tenantId: T1,
      corporateId: CORP,
      driftScore: 25,
      stabilityScore: 75,
      driftStatus: 'stable',
      driftDirection: 'lateral',
      detectedAt: new Date(),
    };
    await repo.save(T1, drift);
    const loaded = await repo.findByTravellerId(T1, TRAV1);
    expect(loaded?.driftScore).toBe(25);
  });

  it('enforces tenant isolation', async () => {
    const drift: BehaviourDrift = {
      travellerId: TRAV1,
      tenantId: T1,
      corporateId: CORP,
      driftScore: 25,
      stabilityScore: 75,
      driftStatus: 'stable',
      driftDirection: 'lateral',
      detectedAt: new Date(),
    };
    await repo.save(T1, drift);
    expect(await repo.findByTravellerId(T2, TRAV1)).toBeUndefined();
  });
});

describe('InMemoryFatigueRepository', () => {
  let repo: InMemoryFatigueRepository;

  beforeEach(() => {
    repo = new InMemoryFatigueRepository();
  });

  it('saves and loads by travellerId', async () => {
    const fatigue: CommunicationFatigue = {
      travellerId: TRAV1,
      tenantId: T1,
      corporateId: CORP,
      fatigueScore: 45,
      fatigueLevel: 'medium',
      comms30d: 8,
      ignoredRate: 0.25,
      lastUpdated: new Date(),
    };
    await repo.save(T1, fatigue);
    const loaded = await repo.findByTravellerId(T1, TRAV1);
    expect(loaded?.fatigueScore).toBe(45);
  });

  it('finds by corporateId', async () => {
    const f1: CommunicationFatigue = {
      travellerId: TRAV1,
      tenantId: T1,
      corporateId: CORP,
      fatigueScore: 30,
      fatigueLevel: 'low',
      comms30d: 3,
      ignoredRate: 0.1,
      lastUpdated: new Date(),
    };
    const f2: CommunicationFatigue = {
      travellerId: TRAV2,
      tenantId: T1,
      corporateId: CORP,
      fatigueScore: 65,
      fatigueLevel: 'high',
      comms30d: 12,
      ignoredRate: 0.5,
      lastUpdated: new Date(),
    };
    await repo.save(T1, f1);
    await repo.save(T1, f2);
    const results = await repo.findByCorporateId(T1, CORP);
    expect(results).toHaveLength(2);
  });
});

describe('InMemoryRevenueAtRiskRepository', () => {
  let repo: InMemoryRevenueAtRiskRepository;

  beforeEach(() => {
    repo = new InMemoryRevenueAtRiskRepository();
  });

  it('saves and loads by travellerId', async () => {
    const risk: RevenueAtRisk = {
      travellerId: TRAV1,
      tenantId: T1,
      corporateId: CORP,
      estimatedCommission: 200,
      attachmentLikelihood: 60,
      revenueAtRisk: 80,
      riskTier: 'uncertain',
      calculatedAt: new Date(),
    };
    await repo.save(T1, risk);
    const loaded = await repo.findByTravellerId(T1, TRAV1);
    expect(loaded?.revenueAtRisk).toBe(80);
  });
});

describe('InMemoryRecommendedActionRepository', () => {
  let repo: InMemoryRecommendedActionRepository;

  beforeEach(() => {
    repo = new InMemoryRecommendedActionRepository();
  });

  it('saves and finds active by opportunityId', async () => {
    const action: RecommendedAction = {
      action: 'send_email',
      confidence: 75,
      explanationText: 'Email recommended.',
      fatigueLevel: 'low',
      driftStatus: 'stable',
      daysToDeparture: 8,
      predictedLeadTimeDays: 7,
    };
    await repo.save(T1, 'opp-001', action);
    const loaded = await repo.findActiveByOpportunityId(T1, 'opp-001');
    expect(loaded?.action).toBe('send_email');
  });

  it('enforces tenant isolation', async () => {
    const action: RecommendedAction = {
      action: 'wait',
      confidence: 80,
      explanationText: 'Waiting.',
      fatigueLevel: 'low',
      driftStatus: 'stable',
      daysToDeparture: 20,
      predictedLeadTimeDays: 7,
    };
    await repo.save(T1, 'opp-001', action);
    expect(await repo.findActiveByOpportunityId(T2, 'opp-001')).toBeUndefined();
  });

  it('remove deletes the active action', async () => {
    const action: RecommendedAction = {
      action: 'escalate',
      confidence: 85,
      explanationText: 'Escalating.',
      fatigueLevel: 'critical',
      driftStatus: 'significant',
      daysToDeparture: 2,
      predictedLeadTimeDays: 7,
    };
    await repo.save(T1, 'opp-001', action);
    await repo.remove(T1, 'opp-001');
    expect(await repo.findActiveByOpportunityId(T1, 'opp-001')).toBeUndefined();
  });
});

describe('InMemoryPredictionOutcomeRepository', () => {
  let repo: InMemoryPredictionOutcomeRepository;

  beforeEach(() => {
    repo = new InMemoryPredictionOutcomeRepository();
  });

  it('appends and finds by recommendationId', async () => {
    const outcome = evaluateOutcome({
      recommendationId: 'rec-001',
      travellerId: TRAV1,
      tenantId: T1,
      corporateId: CORP,
      opportunityId: 'opp-001',
      recommendedAction: 'send_email',
      actualOutcome: 'booked_after_communication',
      daysDifference: 1,
    });
    await repo.append(T1, outcome);
    const loaded = await repo.findByRecommendationId(T1, 'rec-001');
    expect(loaded?.wasCorrect).toBe(true);
  });

  it('enforces tenant isolation on append', async () => {
    const outcome = evaluateOutcome({
      recommendationId: 'rec-001',
      travellerId: TRAV1,
      tenantId: T1,
      corporateId: CORP,
      opportunityId: 'opp-001',
      recommendedAction: 'send_email',
      actualOutcome: 'booked_after_communication',
      daysDifference: 1,
    });
    await expect(repo.append(T2, outcome)).rejects.toThrow('Tenant isolation');
  });

  it('is append-only (accumulates)', async () => {
    const o1 = evaluateOutcome({
      recommendationId: 'rec-001',
      travellerId: TRAV1,
      tenantId: T1,
      corporateId: CORP,
      opportunityId: 'opp-001',
      recommendedAction: 'send_email',
      actualOutcome: 'booked_after_communication',
      daysDifference: 1,
    });
    const o2 = evaluateOutcome({
      recommendationId: 'rec-002',
      travellerId: TRAV1,
      tenantId: T1,
      corporateId: CORP,
      opportunityId: 'opp-002',
      recommendedAction: 'wait',
      actualOutcome: 'booked_independently',
      daysDifference: 0,
    });
    await repo.append(T1, o1);
    await repo.append(T1, o2);
    const results = await repo.findByTravellerId(T1, TRAV1);
    expect(results).toHaveLength(2);
  });

  it('finds by opportunityId', async () => {
    const outcome = evaluateOutcome({
      recommendationId: 'rec-001',
      travellerId: TRAV1,
      tenantId: T1,
      corporateId: CORP,
      opportunityId: 'opp-001',
      recommendedAction: 'escalate',
      actualOutcome: 'booked_after_escalation',
      daysDifference: 3,
    });
    await repo.append(T1, outcome);
    const results = await repo.findByOpportunityId(T1, 'opp-001');
    expect(results).toHaveLength(1);
  });
});

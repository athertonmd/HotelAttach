/**
 * End-to-end workflow tests for Behaviour Intelligence.
 * Validates complete event flows through the service using in-memory repositories.
 * No live database, no APIs, no frontend required.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryEventBus } from '@hci/event-contracts';
import type { HCIEventEnvelope } from '@hci/event-contracts';
import { BehaviourIntelligenceService } from '../services/behaviour-intelligence-service.js';
import type { BehaviourRepositories } from '../services/behaviour-intelligence-service.js';
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
import type { BehaviourDrift } from '../domain/behaviour-drift.js';
import type { CommunicationFatigue } from '../domain/communication-fatigue.js';

const T1 = 'tenant-001';
const T2 = 'tenant-002';
const C = 'corp-001';
const TRAV = 'trav-001';
const CORR = 'corr-e2e-001';

function buildRepos(): BehaviourRepositories {
  return {
    profiles: new InMemoryProfileRepository(),
    archetypes: new InMemoryArchetypeRepository(),
    attributions: new InMemoryAttributionRepository(),
    drift: new InMemoryDriftRepository(),
    fatigue: new InMemoryFatigueRepository(),
    revenueAtRisk: new InMemoryRevenueAtRiskRepository(),
    actions: new InMemoryRecommendedActionRepository(),
    outcomes: new InMemoryPredictionOutcomeRepository(),
  };
}

/** Validates an event has a proper envelope structure */
function assertValidEnvelope(event: HCIEventEnvelope): void {
  expect(event.eventId).toBeTruthy();
  expect(event.eventType).toBeTruthy();
  expect(event.tenantId).toBeTruthy();
  expect(event.corporateId).toBeTruthy();
  expect(event.sourceService).toBeTruthy();
  expect(event.timestamp).toBeTruthy();
  expect(event.correlationId).toBeTruthy();
  expect(event.payload).toBeDefined();
}

describe('E2E: Booking Created Flow', () => {
  let repos: BehaviourRepositories;
  let bus: InMemoryEventBus;
  let svc: BehaviourIntelligenceService;

  beforeEach(() => {
    repos = buildRepos();
    bus = new InMemoryEventBus();
    svc = new BehaviourIntelligenceService(repos, bus);
  });

  it('BookingCreated → profile updated + events emitted', async () => {
    const result = await svc.handleBookingCreated(
      {
        tenantId: T1,
        corporateId: C,
        travellerId: TRAV,
        bookingId: 'book-e2e-001',
        leadTimeDays: 7,
        hadHotelCompliance: true,
        estimatedCommission: 150,
        isIndependentBooking: true,
      },
      { correlationId: CORR },
    );

    expect(result.success).toBe(true);

    // Profile saved
    const profile = await repos.profiles.findByTravellerId(T1, TRAV);
    expect(profile).toBeDefined();
    expect(profile?.tripCountUsed).toBe(1);

    // BehaviourProfileUpdated emitted
    const profileEvents = bus.getEventsByType('BehaviourProfileUpdated');
    expect(profileEvents).toHaveLength(1);
    assertValidEnvelope(profileEvents[0] as HCIEventEnvelope);

    // BookingAttributed emitted
    const attrEvents = bus.getEventsByType('BookingAttributed');
    expect(attrEvents).toHaveLength(1);
    assertValidEnvelope(attrEvents[0] as HCIEventEnvelope);

    // Attribution stored
    const attrs = await repos.attributions.findByTravellerId(T1, TRAV);
    expect(attrs).toHaveLength(1);
  });
});

describe('E2E: Archetype Assignment Flow', () => {
  let repos: BehaviourRepositories;
  let bus: InMemoryEventBus;
  let svc: BehaviourIntelligenceService;

  beforeEach(() => {
    repos = buildRepos();
    bus = new InMemoryEventBus();
    svc = new BehaviourIntelligenceService(repos, bus);
  });

  it('multiple bookings → archetype assigned on 3rd trip', async () => {
    const base = {
      tenantId: T1,
      corporateId: C,
      travellerId: TRAV,
      leadTimeDays: 7,
      hadHotelCompliance: true,
      estimatedCommission: 100,
      isIndependentBooking: true,
    };

    await svc.handleBookingCreated({ ...base, bookingId: 'b1' });
    await svc.handleBookingCreated({ ...base, bookingId: 'b2' });
    bus.clear();
    await svc.handleBookingCreated({ ...base, bookingId: 'b3' });

    // Archetype assigned
    const archetypeEvents = bus.getEventsByType('ArchetypeAssigned');
    expect(archetypeEvents.length).toBeGreaterThanOrEqual(1);
    assertValidEnvelope(archetypeEvents[0] as HCIEventEnvelope);

    // Stored in repository
    const archetype = await repos.archetypes.findByTravellerId(T1, TRAV);
    expect(archetype).toBeDefined();
    expect(archetype?.archetype).toBeTruthy();
  });
});

describe('E2E: Communication Fatigue Flow', () => {
  let repos: BehaviourRepositories;
  let bus: InMemoryEventBus;
  let svc: BehaviourIntelligenceService;

  beforeEach(() => {
    repos = buildRepos();
    bus = new InMemoryEventBus();
    svc = new BehaviourIntelligenceService(repos, bus);
  });

  it('ignored responses trigger fatigue threshold crossing', async () => {
    // Seed fatigue near threshold
    const existing: CommunicationFatigue = {
      travellerId: TRAV,
      tenantId: T1,
      corporateId: C,
      fatigueScore: 38,
      fatigueLevel: 'low',
      comms30d: 15,
      ignoredRate: 0.3,
      lastUpdated: new Date(),
    };
    await repos.fatigue.save(T1, existing);

    // Ignored response pushes over threshold (38 + 8 = 46 → medium)
    await svc.handleTravellerResponded(
      { tenantId: T1, corporateId: C, travellerId: TRAV, responseType: 'ignored' },
      { correlationId: CORR },
    );

    // Fatigue updated
    const fatigue = await repos.fatigue.findByTravellerId(T1, TRAV);
    expect(fatigue?.fatigueLevel).toBe('medium');

    // FatigueThresholdCrossed emitted
    const events = bus.getEventsByType('FatigueThresholdCrossed');
    expect(events).toHaveLength(1);
    assertValidEnvelope(events[0] as HCIEventEnvelope);
  });
});

describe('E2E: Opportunity Recommendation Flow', () => {
  let repos: BehaviourRepositories;
  let bus: InMemoryEventBus;
  let svc: BehaviourIntelligenceService;

  beforeEach(async () => {
    repos = buildRepos();
    bus = new InMemoryEventBus();
    svc = new BehaviourIntelligenceService(repos, bus);

    // Seed profile, fatigue, drift
    const profile = createProfile({
      travellerId: TRAV,
      tenantId: T1,
      corporateId: C,
      avgLeadTimeDays: 7,
      bookingConsistency: 0.7,
      bookingVariabilityDays: 3,
      complianceRate: 80,
      avgResponseTimeHours: 6,
      preferredChannel: 'email',
      selfBookingRate: 60,
      tripsAnalysed: 10,
      tripCountUsed: 10,
      predictedLeadTimeDays: 7,
      segment: 'reliable_late',
    });
    await repos.profiles.save(T1, profile);

    const fatigue: CommunicationFatigue = {
      travellerId: TRAV,
      tenantId: T1,
      corporateId: C,
      fatigueScore: 20,
      fatigueLevel: 'low',
      comms30d: 3,
      ignoredRate: 0.1,
      lastUpdated: new Date(),
    };
    await repos.fatigue.save(T1, fatigue);

    const drift: BehaviourDrift = {
      travellerId: TRAV,
      tenantId: T1,
      corporateId: C,
      driftScore: 10,
      stabilityScore: 90,
      driftStatus: 'stable',
      driftDirection: 'lateral',
      detectedAt: new Date(),
    };
    await repos.drift.save(T1, drift);
  });

  it('OpportunityCreated → revenue at risk + ActionRecommended', async () => {
    await svc.handleOpportunityCreated(
      {
        tenantId: T1,
        corporateId: C,
        travellerId: TRAV,
        opportunityId: 'opp-e2e-001',
        estimatedCommission: 200,
        daysToDeparture: 10,
      },
      { correlationId: CORR },
    );

    // Revenue at risk calculated
    const risk = await repos.revenueAtRisk.findByTravellerId(T1, TRAV);
    expect(risk).toBeDefined();
    expect(risk?.revenueAtRisk).toBeGreaterThan(0);

    // ActionRecommended emitted
    const events = bus.getEventsByType('ActionRecommended');
    expect(events).toHaveLength(1);
    assertValidEnvelope(events[0] as HCIEventEnvelope);

    // Action stored
    const action = await repos.actions.findActiveByOpportunityId(T1, 'opp-e2e-001');
    expect(action).toBeDefined();
  });
});

describe('E2E: Opportunity Closure Prediction Flow', () => {
  let repos: BehaviourRepositories;
  let bus: InMemoryEventBus;
  let svc: BehaviourIntelligenceService;

  beforeEach(async () => {
    repos = buildRepos();
    bus = new InMemoryEventBus();
    svc = new BehaviourIntelligenceService(repos, bus);

    // Seed active action
    await repos.actions.save(T1, 'opp-e2e-001', {
      action: 'send_email',
      confidence: 75,
      explanationText: 'Email recommended.',
      fatigueLevel: 'low',
      driftStatus: 'stable',
      daysToDeparture: 8,
      predictedLeadTimeDays: 7,
    });
  });

  it('OpportunityClosed → PredictionOutcomeRecorded', async () => {
    await svc.handleOpportunityClosed(
      {
        tenantId: T1,
        corporateId: C,
        travellerId: TRAV,
        opportunityId: 'opp-e2e-001',
        closureReason: 'fulfilled',
      },
      { correlationId: CORR },
    );

    // PredictionOutcomeRecorded emitted
    const events = bus.getEventsByType('PredictionOutcomeRecorded');
    expect(events).toHaveLength(1);
    assertValidEnvelope(events[0] as HCIEventEnvelope);

    // Outcome stored
    const outcomes = await repos.outcomes.findByOpportunityId(T1, 'opp-e2e-001');
    expect(outcomes).toHaveLength(1);

    // Active action removed
    const action = await repos.actions.findActiveByOpportunityId(T1, 'opp-e2e-001');
    expect(action).toBeUndefined();
  });
});

describe('E2E: Tenant Isolation', () => {
  let repos: BehaviourRepositories;
  let bus: InMemoryEventBus;
  let svc: BehaviourIntelligenceService;

  beforeEach(() => {
    repos = buildRepos();
    bus = new InMemoryEventBus();
    svc = new BehaviourIntelligenceService(repos, bus);
  });

  it('Tenant A data not visible to Tenant B', async () => {
    await svc.handleBookingCreated({
      tenantId: T1,
      corporateId: C,
      travellerId: TRAV,
      bookingId: 'book-t1',
      leadTimeDays: 7,
      hadHotelCompliance: true,
      estimatedCommission: 100,
      isIndependentBooking: true,
    });

    // Tenant 1 can see
    const profileT1 = await repos.profiles.findByTravellerId(T1, TRAV);
    expect(profileT1).toBeDefined();

    // Tenant 2 cannot
    const profileT2 = await repos.profiles.findByTravellerId(T2, TRAV);
    expect(profileT2).toBeUndefined();

    // Attributions isolated
    const attrsT1 = await repos.attributions.findByTravellerId(T1, TRAV);
    expect(attrsT1).toHaveLength(1);
    const attrsT2 = await repos.attributions.findByTravellerId(T2, TRAV);
    expect(attrsT2).toHaveLength(0);
  });
});

describe('E2E: Correlation Propagation', () => {
  let repos: BehaviourRepositories;
  let bus: InMemoryEventBus;
  let svc: BehaviourIntelligenceService;

  beforeEach(() => {
    repos = buildRepos();
    bus = new InMemoryEventBus();
    svc = new BehaviourIntelligenceService(repos, bus);
  });

  it('correlationId preserved through all emitted events', async () => {
    await svc.handleBookingCreated(
      {
        tenantId: T1,
        corporateId: C,
        travellerId: TRAV,
        bookingId: 'book-corr',
        leadTimeDays: 5,
        hadHotelCompliance: true,
        estimatedCommission: 200,
        isIndependentBooking: false,
      },
      { correlationId: CORR },
    );

    const allEvents = bus.getPublishedEvents();
    expect(allEvents.length).toBeGreaterThan(0);
    for (const evt of allEvents) {
      expect(evt.correlationId).toBe(CORR);
    }
  });
});

describe('E2E: Event Envelope Validation', () => {
  let repos: BehaviourRepositories;
  let bus: InMemoryEventBus;
  let svc: BehaviourIntelligenceService;

  beforeEach(async () => {
    repos = buildRepos();
    bus = new InMemoryEventBus();
    svc = new BehaviourIntelligenceService(repos, bus);

    // Seed for full flow
    const profile = createProfile({
      travellerId: TRAV,
      tenantId: T1,
      corporateId: C,
      avgLeadTimeDays: 7,
      bookingConsistency: 0.7,
      bookingVariabilityDays: 3,
      complianceRate: 80,
      avgResponseTimeHours: 6,
      preferredChannel: 'email',
      selfBookingRate: 60,
      tripsAnalysed: 10,
      tripCountUsed: 10,
      predictedLeadTimeDays: 7,
      segment: 'reliable_late',
    });
    await repos.profiles.save(T1, profile);
    await repos.fatigue.save(T1, {
      travellerId: TRAV,
      tenantId: T1,
      corporateId: C,
      fatigueScore: 20,
      fatigueLevel: 'low',
      comms30d: 3,
      ignoredRate: 0.1,
      lastUpdated: new Date(),
    });
    await repos.drift.save(T1, {
      travellerId: TRAV,
      tenantId: T1,
      corporateId: C,
      driftScore: 10,
      stabilityScore: 90,
      driftStatus: 'stable',
      driftDirection: 'lateral',
      detectedAt: new Date(),
    });
  });

  it('all emitted events have valid envelope structure', async () => {
    // Trigger multiple flows
    await svc.handleBookingCreated({
      tenantId: T1,
      corporateId: C,
      travellerId: TRAV,
      bookingId: 'b-valid',
      leadTimeDays: 7,
      hadHotelCompliance: true,
      estimatedCommission: 150,
      isIndependentBooking: true,
    });
    await svc.handleOpportunityCreated({
      tenantId: T1,
      corporateId: C,
      travellerId: TRAV,
      opportunityId: 'opp-valid',
      estimatedCommission: 200,
      daysToDeparture: 10,
    });

    const allEvents = bus.getPublishedEvents();
    expect(allEvents.length).toBeGreaterThan(2);
    for (const evt of allEvents) {
      assertValidEnvelope(evt);
      expect(evt.tenantId).toBe(T1);
      expect(evt.corporateId).toBe(C);
      expect(evt.sourceService).toContain('behaviour-intelligence');
    }
  });
});

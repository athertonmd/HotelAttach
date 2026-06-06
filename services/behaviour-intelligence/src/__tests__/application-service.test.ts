/**
 * Unit tests for BehaviourIntelligenceService.
 * Tests event handling, repository interaction, and event publishing.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryEventBus } from '@hci/event-contracts';
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

const T = 'tenant-001';
const C = 'corp-001';
const TRAV = 'trav-001';

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

function buildService(repos: BehaviourRepositories, bus: InMemoryEventBus) {
  return new BehaviourIntelligenceService(repos, bus);
}

describe('BehaviourIntelligenceService', () => {
  let repos: BehaviourRepositories;
  let bus: InMemoryEventBus;
  let svc: BehaviourIntelligenceService;

  beforeEach(() => {
    repos = buildRepos();
    bus = new InMemoryEventBus();
    svc = buildService(repos, bus);
  });

  describe('handleBookingCreated', () => {
    const input = {
      tenantId: T,
      corporateId: C,
      travellerId: TRAV,
      bookingId: 'book-001',
      leadTimeDays: 7,
      hadHotelCompliance: true,
      estimatedCommission: 150,
      isIndependentBooking: true,
    };

    it('updates profile in repository', async () => {
      await svc.handleBookingCreated(input);
      const profile = await repos.profiles.findByTravellerId(T, TRAV);
      expect(profile).toBeDefined();
      expect(profile?.tripCountUsed).toBe(1);
    });

    it('publishes BehaviourProfileUpdated event', async () => {
      const result = await svc.handleBookingCreated(input);
      expect(result.success).toBe(true);
      const events = bus.getEventsByType('BehaviourProfileUpdated');
      expect(events).toHaveLength(1);
    });

    it('creates BookingAttributed event', async () => {
      await svc.handleBookingCreated(input);
      const events = bus.getEventsByType('BookingAttributed');
      expect(events).toHaveLength(1);
    });

    it('preserves tenantId in published events', async () => {
      await svc.handleBookingCreated(input);
      const events = bus.getPublishedEvents();
      for (const evt of events) {
        expect(evt.tenantId).toBe(T);
      }
    });

    it('preserves corporateId in published events', async () => {
      await svc.handleBookingCreated(input);
      const events = bus.getPublishedEvents();
      for (const evt of events) {
        expect(evt.corporateId).toBe(C);
      }
    });

    it('preserves correlationId from context', async () => {
      await svc.handleBookingCreated(input, { correlationId: 'corr-123' });
      const events = bus.getPublishedEvents();
      for (const evt of events) {
        expect(evt.correlationId).toBe('corr-123');
      }
    });

    it('publishes ArchetypeAssigned when 3+ trips', async () => {
      // Build up 2 trips first
      await svc.handleBookingCreated({ ...input, bookingId: 'b1' });
      await svc.handleBookingCreated({ ...input, bookingId: 'b2' });
      bus.clear();
      // 3rd trip triggers archetype
      await svc.handleBookingCreated({ ...input, bookingId: 'b3' });
      const events = bus.getEventsByType('ArchetypeAssigned');
      expect(events.length).toBeGreaterThanOrEqual(1);
    });

    it('stores attribution in append-only repository', async () => {
      await svc.handleBookingCreated(input);
      const attrs = await repos.attributions.findByTravellerId(T, TRAV);
      expect(attrs).toHaveLength(1);
      expect(attrs[0]?.bookingId).toBe('book-001');
    });
  });

  describe('handleCommunicationSent', () => {
    it('updates fatigue in repository', async () => {
      await svc.handleCommunicationSent({
        tenantId: T,
        corporateId: C,
        travellerId: TRAV,
        communicationId: 'comm-001',
        channel: 'email',
      });
      const fatigue = await repos.fatigue.findByTravellerId(T, TRAV);
      expect(fatigue).toBeDefined();
      expect(fatigue?.comms30d).toBe(1);
    });

    it('publishes FatigueThresholdCrossed when level changes', async () => {
      // Seed with fatigue at 38 (low). Adding comms will push base recalc over threshold.
      const existing: CommunicationFatigue = {
        travellerId: TRAV,
        tenantId: T,
        corporateId: C,
        fatigueScore: 38,
        fatigueLevel: 'low',
        comms30d: 19,
        ignoredRate: 0.3,
        lastUpdated: new Date(),
      };
      await repos.fatigue.save(T, existing);

      // This increments comms30d to 20, currentScore=38 stays, but no additional deltas
      // so score stays 38. We need to trigger with ignored responses instead.
      // Use handleTravellerResponded with 'ignored' to add +8 to score
      await svc.handleTravellerResponded({
        tenantId: T,
        corporateId: C,
        travellerId: TRAV,
        responseType: 'ignored',
      });
      const events = bus.getEventsByType('FatigueThresholdCrossed');
      expect(events).toHaveLength(1);
    });
  });

  describe('handleTravellerResponded', () => {
    it('ignored response increases fatigue', async () => {
      await svc.handleTravellerResponded({
        tenantId: T,
        corporateId: C,
        travellerId: TRAV,
        responseType: 'ignored',
      });
      const fatigue = await repos.fatigue.findByTravellerId(T, TRAV);
      expect(fatigue).toBeDefined();
      expect(fatigue?.fatigueScore).toBeGreaterThan(0);
    });
  });

  describe('handleOpportunityCreated', () => {
    it('calculates revenue at risk', async () => {
      await svc.handleOpportunityCreated({
        tenantId: T,
        corporateId: C,
        travellerId: TRAV,
        opportunityId: 'opp-001',
        estimatedCommission: 200,
        daysToDeparture: 10,
      });
      const risk = await repos.revenueAtRisk.findByTravellerId(T, TRAV);
      expect(risk).toBeDefined();
      expect(risk?.revenueAtRisk).toBeGreaterThan(0);
    });

    it('publishes ActionRecommended when profile+fatigue+drift exist', async () => {
      // Seed dependencies
      const profile = createProfile({
        travellerId: TRAV,
        tenantId: T,
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
      await repos.profiles.save(T, profile);
      const fatigue: CommunicationFatigue = {
        travellerId: TRAV,
        tenantId: T,
        corporateId: C,
        fatigueScore: 20,
        fatigueLevel: 'low',
        comms30d: 3,
        ignoredRate: 0.1,
        lastUpdated: new Date(),
      };
      await repos.fatigue.save(T, fatigue);
      const drift: BehaviourDrift = {
        travellerId: TRAV,
        tenantId: T,
        corporateId: C,
        driftScore: 10,
        stabilityScore: 90,
        driftStatus: 'stable',
        driftDirection: 'lateral',
        detectedAt: new Date(),
      };
      await repos.drift.save(T, drift);

      await svc.handleOpportunityCreated({
        tenantId: T,
        corporateId: C,
        travellerId: TRAV,
        opportunityId: 'opp-001',
        estimatedCommission: 200,
        daysToDeparture: 10,
      });
      const events = bus.getEventsByType('ActionRecommended');
      expect(events).toHaveLength(1);
    });
  });

  describe('handleOpportunityClosed', () => {
    it('records PredictionOutcome when active action exists', async () => {
      // Seed active action
      await repos.actions.save(T, 'opp-001', {
        action: 'send_email',
        confidence: 75,
        explanationText: 'Email sent.',
        fatigueLevel: 'low',
        driftStatus: 'stable',
        daysToDeparture: 8,
        predictedLeadTimeDays: 7,
      });

      await svc.handleOpportunityClosed({
        tenantId: T,
        corporateId: C,
        travellerId: TRAV,
        opportunityId: 'opp-001',
        closureReason: 'fulfilled',
      });
      const events = bus.getEventsByType('PredictionOutcomeRecorded');
      expect(events).toHaveLength(1);
    });

    it('removes active action after recording outcome', async () => {
      await repos.actions.save(T, 'opp-001', {
        action: 'wait',
        confidence: 80,
        explanationText: 'Waiting.',
        fatigueLevel: 'low',
        driftStatus: 'stable',
        daysToDeparture: 15,
        predictedLeadTimeDays: 7,
      });
      await svc.handleOpportunityClosed({
        tenantId: T,
        corporateId: C,
        travellerId: TRAV,
        opportunityId: 'opp-001',
        closureReason: 'expired',
      });
      const remaining = await repos.actions.findActiveByOpportunityId(T, 'opp-001');
      expect(remaining).toBeUndefined();
    });

    it('no events published when no active action', async () => {
      await svc.handleOpportunityClosed({
        tenantId: T,
        corporateId: C,
        travellerId: TRAV,
        opportunityId: 'opp-999',
        closureReason: 'fulfilled',
      });
      expect(bus.getPublishedEvents()).toHaveLength(0);
    });
  });

  describe('placeholder handlers', () => {
    it('handleTripCreated returns success with no events', async () => {
      const result = await svc.handleTripCreated({
        tenantId: T,
        corporateId: C,
        travellerId: TRAV,
      });
      expect(result.success).toBe(true);
      expect(result.publishedEvents).toHaveLength(0);
    });

    it('handleHotelMatched returns success with no events', async () => {
      const result = await svc.handleHotelMatched({
        tenantId: T,
        corporateId: C,
        travellerId: TRAV,
      });
      expect(result.success).toBe(true);
      expect(result.publishedEvents).toHaveLength(0);
    });
  });
});

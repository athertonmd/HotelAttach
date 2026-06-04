/**
 * E2E Tests: Traveller Engagement Full Flow
 * Proves complete workflows using in-memory repos, event bus, and schema validation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryEventBus } from '@hci/event-contracts';
import { SchemaValidator } from '@hci/validation';
import { TravellerEngagementService } from '../services/traveller-engagement-service.js';
import {
  InMemoryCommunicationRepository,
  InMemoryTravellerActionRepository,
  InMemoryTravellerResponseRepository,
  InMemoryBookingRequestRepository,
  InMemoryAgentEscalationRepository,
  InMemoryTravellerPreferenceRepository,
  InMemoryCommunicationAuditRepository,
} from '../repositories/in-memory.js';
import { TravellerPreference } from '../domain/traveller-preference.js';

const TENANT_A = 'aaaa1111-aaaa-4000-8000-aaaaaaaaaaaa';
const TENANT_B = 'bbbb2222-bbbb-4000-8000-bbbbbbbbbbbb';
const CORP = 'cccc3333-cccc-4000-8000-cccccccccccc';
const TRAVELLER = 'dddd4444-dddd-4000-8000-dddddddddddd';
const OPP = 'eeee5555-eeee-4000-8000-eeeeeeeeeeee';
const TRIP = 'ffff6666-ffff-4000-8000-ffffffffffff';
const CORR_ID = 'aaaa7777-aaaa-4000-8000-777777777777';

let service: TravellerEngagementService;
let communicationRepo: InMemoryCommunicationRepository;
let actionRepo: InMemoryTravellerActionRepository;
let responseRepo: InMemoryTravellerResponseRepository;
let bookingRequestRepo: InMemoryBookingRequestRepository;
let escalationRepo: InMemoryAgentEscalationRepository;
let preferenceRepo: InMemoryTravellerPreferenceRepository;
let auditRepo: InMemoryCommunicationAuditRepository;
let bus: InMemoryEventBus;
let validator: SchemaValidator;

beforeEach(() => {
  communicationRepo = new InMemoryCommunicationRepository();
  actionRepo = new InMemoryTravellerActionRepository();
  responseRepo = new InMemoryTravellerResponseRepository();
  bookingRequestRepo = new InMemoryBookingRequestRepository();
  escalationRepo = new InMemoryAgentEscalationRepository();
  preferenceRepo = new InMemoryTravellerPreferenceRepository();
  auditRepo = new InMemoryCommunicationAuditRepository();
  bus = new InMemoryEventBus();
  validator = new SchemaValidator();

  service = new TravellerEngagementService(
    communicationRepo,
    actionRepo,
    responseRepo,
    bookingRequestRepo,
    escalationRepo,
    preferenceRepo,
    auditRepo,
    bus,
  );
});

describe('E2E: Traveller Engagement', () => {
  describe('Scenario 1 — Missing Hotel Communication', () => {
    it('creates communication and emits CommunicationSent', async () => {
      const result = await service.handleOpportunityCreated(
        {
          tenantId: TENANT_A,
          corporateId: CORP,
          travellerId: TRAVELLER,
          tripId: TRIP,
          opportunityId: OPP,
          opportunityType: 'missing_hotel',
          priority: 'high',
          score: 65,
        },
        { correlationId: CORR_ID },
      );

      expect(result.success).toBe(true);
      expect(result.data?.communicationId).toBeDefined();

      const events = bus.getEventsByType('CommunicationSent');
      expect(events).toHaveLength(1);
      expect(events[0]!.payload).toMatchObject({
        opportunityId: OPP,
        tenantId: TENANT_A,
        travellerId: TRAVELLER,
        communicationType: 'initial_contact',
        channel: 'email',
      });
    });

    it('emitted CommunicationSent validates against schema', async () => {
      await service.handleOpportunityCreated({
        tenantId: TENANT_A,
        corporateId: CORP,
        travellerId: TRAVELLER,
        tripId: TRIP,
        opportunityId: OPP,
        opportunityType: 'missing_hotel',
        priority: 'high',
        score: 65,
      });

      const ev = bus.getEventsByType('CommunicationSent')[0]!;
      const result = validator.validateEvent('communication-sent', ev);
      expect(result.valid).toBe(true);
    });
  });

  describe('Scenario 2 — Suppressed Opportunity', () => {
    it('suppressed opportunity does not send and emits no events', async () => {
      const result = await service.handleOpportunityCreated({
        tenantId: TENANT_A,
        corporateId: CORP,
        travellerId: TRAVELLER,
        tripId: TRIP,
        opportunityId: OPP,
        opportunityType: 'missing_hotel',
        priority: 'high',
        score: 65,
        lifecycleState: 'suppressed',
      });

      expect(result.success).toBe(true);

      const events = bus.getPublishedEvents();
      expect(events).toHaveLength(0);

      const comms = await communicationRepo.findByOpportunityId(TENANT_A, OPP);
      expect(comms).toHaveLength(0);
    });
  });

  describe('Scenario 3 — Awaiting Agent Review', () => {
    it('creates escalation instead of sending communication', async () => {
      const result = await service.handleOpportunityCreated({
        tenantId: TENANT_A,
        corporateId: CORP,
        travellerId: TRAVELLER,
        tripId: TRIP,
        opportunityId: OPP,
        opportunityType: 'missing_hotel',
        priority: 'critical',
        score: 85,
        lifecycleState: 'awaiting_action',
      });

      expect(result.success).toBe(true);
      expect(result.data?.escalationId).toBeDefined();

      // No CommunicationSent event published
      const events = bus.getPublishedEvents();
      expect(events).toHaveLength(0);

      // Escalation created with correct reason
      const pending = await escalationRepo.findPending(TENANT_A);
      expect(pending).toHaveLength(1);
      expect(pending[0]!.reason).toBe('high_value_opportunity');
      expect(pending[0]!.priority).toBe('critical');
    });
  });

  describe('Scenario 4 — Traveller Accepts', () => {
    it('publishes TravellerResponded and BookingRequestCreated', async () => {
      // Create initial communication
      await service.handleOpportunityCreated({
        tenantId: TENANT_A,
        corporateId: CORP,
        travellerId: TRAVELLER,
        tripId: TRIP,
        opportunityId: OPP,
        opportunityType: 'missing_hotel',
        priority: 'high',
        score: 65,
      });
      bus.clear();

      // Find the action token
      const actions = await actionRepo.findExpired(TENANT_A, new Date('2099-01-01'));
      expect(actions).toHaveLength(1);
      const token = actions[0]!.token;

      // Traveller accepts
      const result = await service.handleTravellerAction(
        {
          tenantId: TENANT_A,
          token,
          responseType: 'accepted',
        },
        { correlationId: CORR_ID },
      );

      expect(result.success).toBe(true);
      expect(result.data?.responseId).toBeDefined();

      const respondedEvents = bus.getEventsByType('TravellerResponded');
      expect(respondedEvents).toHaveLength(1);

      const bookingEvents = bus.getEventsByType('BookingRequestCreated');
      expect(bookingEvents).toHaveLength(1);
    });

    it('emitted events validate against schemas', async () => {
      await service.handleOpportunityCreated({
        tenantId: TENANT_A,
        corporateId: CORP,
        travellerId: TRAVELLER,
        tripId: TRIP,
        opportunityId: OPP,
        opportunityType: 'missing_hotel',
        priority: 'high',
        score: 65,
      });
      bus.clear();

      const actions = await actionRepo.findExpired(TENANT_A, new Date('2099-01-01'));
      const token = actions[0]!.token;

      await service.handleTravellerAction(
        {
          tenantId: TENANT_A,
          token,
          responseType: 'accepted',
        },
        { correlationId: CORR_ID },
      );

      const responded = bus.getEventsByType('TravellerResponded')[0]!;
      const respondedResult = validator.validateEvent('traveller-responded', responded);
      expect(respondedResult.valid).toBe(true);

      const booking = bus.getEventsByType('BookingRequestCreated')[0]!;
      const bookingResult = validator.validateEvent('booking-request-created', booking);
      expect(bookingResult.valid).toBe(true);
    });
  });

  describe('Scenario 5 — Traveller Declines', () => {
    it('publishes TravellerResponded without BookingRequestCreated', async () => {
      await service.handleOpportunityCreated({
        tenantId: TENANT_A,
        corporateId: CORP,
        travellerId: TRAVELLER,
        tripId: TRIP,
        opportunityId: OPP,
        opportunityType: 'missing_hotel',
        priority: 'high',
        score: 65,
      });
      bus.clear();

      const actions = await actionRepo.findExpired(TENANT_A, new Date('2099-01-01'));
      const token = actions[0]!.token;

      const result = await service.handleTravellerAction(
        {
          tenantId: TENANT_A,
          token,
          responseType: 'declined',
          notes: 'Already booked externally',
        },
        { correlationId: CORR_ID },
      );

      expect(result.success).toBe(true);

      const respondedEvents = bus.getEventsByType('TravellerResponded');
      expect(respondedEvents).toHaveLength(1);
      expect(respondedEvents[0]!.payload).toMatchObject({ responseType: 'declined' });

      const bookingEvents = bus.getEventsByType('BookingRequestCreated');
      expect(bookingEvents).toHaveLength(0);
    });
  });

  describe('Scenario 6 — Opportunity Closed Before Send', () => {
    it('cancels active communications for the opportunity', async () => {
      // Create communication
      await service.handleOpportunityCreated({
        tenantId: TENANT_A,
        corporateId: CORP,
        travellerId: TRAVELLER,
        tripId: TRIP,
        opportunityId: OPP,
        opportunityType: 'missing_hotel',
        priority: 'high',
        score: 65,
      });

      // Close the opportunity
      const result = await service.handleOpportunityClosed({
        tenantId: TENANT_A,
        opportunityId: OPP,
      });

      expect(result.success).toBe(true);

      const comms = await communicationRepo.findByOpportunityId(TENANT_A, OPP);
      expect(comms).toHaveLength(1);
      expect(comms[0]!.status).toBe('cancelled');
    });
  });

  describe('Scenario 7 — Cooldown Enforcement', () => {
    it('second communication within 72h is suppressed', async () => {
      // First communication succeeds
      const result1 = await service.handleOpportunityCreated({
        tenantId: TENANT_A,
        corporateId: CORP,
        travellerId: TRAVELLER,
        tripId: TRIP,
        opportunityId: OPP,
        opportunityType: 'missing_hotel',
        priority: 'high',
        score: 65,
      });
      expect(result1.success).toBe(true);
      expect(result1.data?.communicationId).toBeDefined();

      const eventsAfterFirst = bus.getEventsByType('CommunicationSent');
      expect(eventsAfterFirst).toHaveLength(1);

      // Second attempt with different opportunity but same traveller (within 72h)
      const result2 = await service.handleOpportunityCreated({
        tenantId: TENANT_A,
        corporateId: CORP,
        travellerId: TRAVELLER,
        tripId: TRIP,
        opportunityId: 'aaaa8888-aaaa-4000-8000-888888888888',
        opportunityType: 'partial_coverage',
        priority: 'medium',
        score: 50,
      });
      expect(result2.success).toBe(true);
      // No new communicationId returned — cooldown enforced
      expect(result2.data).toBeUndefined();

      // Still only one CommunicationSent event
      const eventsAfterSecond = bus.getEventsByType('CommunicationSent');
      expect(eventsAfterSecond).toHaveLength(1);
    });
  });

  describe('Scenario 8 — Bounce and Retry', () => {
    it('bounced delivery creates escalation when retryCount exceeds threshold', async () => {
      // Create communication
      await service.handleOpportunityCreated({
        tenantId: TENANT_A,
        corporateId: CORP,
        travellerId: TRAVELLER,
        tripId: TRIP,
        opportunityId: OPP,
        opportunityType: 'missing_hotel',
        priority: 'high',
        score: 65,
      });

      const comms = await communicationRepo.findByOpportunityId(TENANT_A, OPP);
      const commId = comms[0]!.communicationId;

      // Delivery bounces
      const result = await service.handleDeliveryResult({
        tenantId: TENANT_A,
        communicationId: commId,
        delivered: false,
      });

      expect(result.success).toBe(true);

      // Communication marked bounced with retryCount = 1
      const updated = await communicationRepo.findById(TENANT_A, commId);
      expect(updated!.status).toBe('bounced');
      expect(updated!.retryCount).toBe(1);

      // Since MAX_RETRY_COUNT = 1, needsEscalation() returns true
      const pending = await escalationRepo.findPending(TENANT_A);
      expect(pending).toHaveLength(1);
      expect(pending[0]!.reason).toBe('delivery_bounced');
    });
  });

  describe('Scenario 9 — Tenant Isolation', () => {
    it('Tenant B cannot see Tenant A communications', async () => {
      await service.handleOpportunityCreated({
        tenantId: TENANT_A,
        corporateId: CORP,
        travellerId: TRAVELLER,
        tripId: TRIP,
        opportunityId: OPP,
        opportunityType: 'missing_hotel',
        priority: 'high',
        score: 65,
      });

      const tenantBComms = await communicationRepo.findByOpportunityId(TENANT_B, OPP);
      expect(tenantBComms).toHaveLength(0);

      const tenantBActions = await actionRepo.findExpired(TENANT_B, new Date('2099-01-01'));
      expect(tenantBActions).toHaveLength(0);
    });

    it('events preserve correct tenantId in envelope and payload', async () => {
      await service.handleOpportunityCreated({
        tenantId: TENANT_A,
        corporateId: CORP,
        travellerId: TRAVELLER,
        tripId: TRIP,
        opportunityId: OPP,
        opportunityType: 'missing_hotel',
        priority: 'high',
        score: 65,
      });

      for (const ev of bus.getPublishedEvents()) {
        expect(ev.tenantId).toBe(TENANT_A);
        const payload = ev.payload as Record<string, unknown>;
        expect(payload.tenantId).toBe(TENANT_A);
      }
    });
  });

  describe('Scenario 10 — Correlation Propagation', () => {
    it('correlationId preserved in CommunicationSent event', async () => {
      await service.handleOpportunityCreated(
        {
          tenantId: TENANT_A,
          corporateId: CORP,
          travellerId: TRAVELLER,
          tripId: TRIP,
          opportunityId: OPP,
          opportunityType: 'missing_hotel',
          priority: 'high',
          score: 65,
        },
        { correlationId: CORR_ID },
      );

      const events = bus.getEventsByType('CommunicationSent');
      expect(events).toHaveLength(1);
      expect(events[0]!.correlationId).toBe(CORR_ID);
    });

    it('correlationId preserved through traveller response flow', async () => {
      await service.handleOpportunityCreated(
        {
          tenantId: TENANT_A,
          corporateId: CORP,
          travellerId: TRAVELLER,
          tripId: TRIP,
          opportunityId: OPP,
          opportunityType: 'missing_hotel',
          priority: 'high',
          score: 65,
        },
        { correlationId: CORR_ID },
      );
      bus.clear();

      const actions = await actionRepo.findExpired(TENANT_A, new Date('2099-01-01'));
      const token = actions[0]!.token;

      await service.handleTravellerAction(
        {
          tenantId: TENANT_A,
          token,
          responseType: 'accepted',
        },
        { correlationId: CORR_ID },
      );

      for (const ev of bus.getPublishedEvents()) {
        expect(ev.correlationId).toBe(CORR_ID);
      }
    });
  });
});

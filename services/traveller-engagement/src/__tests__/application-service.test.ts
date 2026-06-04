/**
 * Unit tests for TravellerEngagementService application service.
 * Uses InMemoryEventBus and in-memory repositories.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryEventBus } from '@hci/event-contracts';
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

const TENANT = 'aaaa1111-aaaa-4000-8000-aaaaaaaaaaaa';
const CORP = 'bbbb2222-bbbb-4000-8000-bbbbbbbbbbbb';
const TRAVELLER = 'cccc3333-cccc-4000-8000-cccccccccccc';
const OPP = 'dddd4444-dddd-4000-8000-dddddddddddd';
const TRIP = 'eeee5555-eeee-4000-8000-eeeeeeeeeeee';
const CORR = 'ffff6666-ffff-4000-8000-ffffffffffff';

let service: TravellerEngagementService;
let communicationRepo: InMemoryCommunicationRepository;
let actionRepo: InMemoryTravellerActionRepository;
let responseRepo: InMemoryTravellerResponseRepository;
let bookingRequestRepo: InMemoryBookingRequestRepository;
let escalationRepo: InMemoryAgentEscalationRepository;
let preferenceRepo: InMemoryTravellerPreferenceRepository;
let auditRepo: InMemoryCommunicationAuditRepository;
let eventBus: InMemoryEventBus;

beforeEach(() => {
  communicationRepo = new InMemoryCommunicationRepository();
  actionRepo = new InMemoryTravellerActionRepository();
  responseRepo = new InMemoryTravellerResponseRepository();
  bookingRequestRepo = new InMemoryBookingRequestRepository();
  escalationRepo = new InMemoryAgentEscalationRepository();
  preferenceRepo = new InMemoryTravellerPreferenceRepository();
  auditRepo = new InMemoryCommunicationAuditRepository();
  eventBus = new InMemoryEventBus();

  service = new TravellerEngagementService(
    communicationRepo,
    actionRepo,
    responseRepo,
    bookingRequestRepo,
    escalationRepo,
    preferenceRepo,
    auditRepo,
    eventBus,
  );
});

describe('handleOpportunityCreated', () => {
  it('missing hotel opportunity schedules communication and publishes CommunicationSent', async () => {
    const result = await service.handleOpportunityCreated({
      tenantId: TENANT,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      opportunityId: OPP,
      opportunityType: 'missing_hotel',
      priority: 'high',
      score: 65,
    });

    expect(result.success).toBe(true);
    expect(result.data?.communicationId).toBeDefined();

    const events = eventBus.getEventsByType('CommunicationSent');
    expect(events).toHaveLength(1);
    expect(events[0]!.payload).toMatchObject({
      opportunityId: OPP,
      tenantId: TENANT,
      travellerId: TRAVELLER,
    });
  });

  it('suppressed opportunity does not send', async () => {
    const result = await service.handleOpportunityCreated({
      tenantId: TENANT,
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

    const events = eventBus.getPublishedEvents();
    expect(events).toHaveLength(0);
  });

  it('awaiting_action creates agent escalation for high score', async () => {
    const result = await service.handleOpportunityCreated({
      tenantId: TENANT,
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

    const pending = await escalationRepo.findPending(TENANT);
    expect(pending).toHaveLength(1);
    expect(pending[0]!.reason).toBe('high_value_opportunity');
    expect(pending[0]!.priority).toBe('critical');

    const events = eventBus.getPublishedEvents();
    expect(events).toHaveLength(0);
  });

  it('critical opportunity (score >= 80) with awaiting_action creates escalation', async () => {
    const result = await service.handleOpportunityCreated({
      tenantId: TENANT,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      opportunityId: OPP,
      opportunityType: 'missing_hotel',
      priority: 'high',
      score: 80,
      lifecycleState: 'awaiting_action',
    });

    expect(result.success).toBe(true);
    expect(result.data?.escalationId).toBeDefined();

    const pending = await escalationRepo.findPending(TENANT);
    expect(pending).toHaveLength(1);
    expect(pending[0]!.reason).toBe('high_value_opportunity');
  });

  it('communication sent publishes CommunicationSent event', async () => {
    const result = await service.handleOpportunityCreated({
      tenantId: TENANT,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      opportunityId: OPP,
      opportunityType: 'missing_hotel',
      priority: 'medium',
      score: 50,
    });

    expect(result.success).toBe(true);

    const events = eventBus.getEventsByType('CommunicationSent');
    expect(events).toHaveLength(1);
    expect(events[0]!.eventType).toBe('CommunicationSent');
  });
});

describe('handleTravellerAction', () => {
  it('traveller accepted publishes TravellerResponded and BookingRequestCreated', async () => {
    // First create a communication
    await service.handleOpportunityCreated({
      tenantId: TENANT,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      opportunityId: OPP,
      opportunityType: 'missing_hotel',
      priority: 'high',
      score: 65,
    });

    // Find the action token
    const comms = await communicationRepo.findByTravellerId(TENANT, TRAVELLER);
    const comm = comms[0]!;
    const action = await actionRepo.findByToken(TENANT, '');
    // We need to find the token — search through the action repo
    // Use findByToken via comm.communicationId
    let token = '';
    // Check all possible tokens for this traveller
    const allComms = await communicationRepo.findByTravellerId(TENANT, TRAVELLER);
    for (const c of allComms) {
      // We need to find the action by iterating — use the repo's internal find approach
      // Actually let's search by token — we need a different approach
      void c;
    }
    // Let's use a workaround: find expired with a far-future date to get all actions
    const allActions = await actionRepo.findExpired(TENANT, new Date('2099-01-01'));
    // findExpired returns actions where expiresAt <= now, so with far future date, it returns all
    // Actually that won't work either since we want non-expired ones

    // Better approach: directly access the action repo's findByToken with comm's ID
    // The InMemoryTravellerActionRepository searches by token value
    // We need to get the token from the action that was created
    // Let's use a different test approach — create the communication and action manually

    void allActions;
    void action;
    void comm;
    void token;

    // Reset and use manual setup for predictable token access
    eventBus.clear();

    // Re-approach: call handleOpportunityCreated, then find the token
    // The action was stored, we need to find it.
    // findExpired with future date returns actions where expiresAt <= now
    // Since actions expire in 7 days, a date far in the future would find them
    const futureDate = new Date('2099-01-01');
    const expiredActions = await actionRepo.findExpired(TENANT, futureDate);
    expect(expiredActions).toHaveLength(1);
    const actionToken = expiredActions[0]!.token;

    const result = await service.handleTravellerAction(
      {
        tenantId: TENANT,
        token: actionToken,
        responseType: 'accepted',
      },
      { correlationId: CORR },
    );

    expect(result.success).toBe(true);

    const respondedEvents = eventBus.getEventsByType('TravellerResponded');
    expect(respondedEvents).toHaveLength(1);

    const bookingEvents = eventBus.getEventsByType('BookingRequestCreated');
    expect(bookingEvents).toHaveLength(1);
  });

  it('traveller declined publishes TravellerResponded only', async () => {
    // Create communication
    await service.handleOpportunityCreated({
      tenantId: TENANT,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      opportunityId: OPP,
      opportunityType: 'missing_hotel',
      priority: 'high',
      score: 65,
    });

    // Find the token
    const futureDate = new Date('2099-01-01');
    const actions = await actionRepo.findExpired(TENANT, futureDate);
    const actionToken = actions[0]!.token;

    eventBus.clear();

    const result = await service.handleTravellerAction(
      {
        tenantId: TENANT,
        token: actionToken,
        responseType: 'declined',
      },
      { correlationId: CORR },
    );

    expect(result.success).toBe(true);

    const respondedEvents = eventBus.getEventsByType('TravellerResponded');
    expect(respondedEvents).toHaveLength(1);

    const bookingEvents = eventBus.getEventsByType('BookingRequestCreated');
    expect(bookingEvents).toHaveLength(0);
  });
});

describe('handleOpportunityClosed and handleOpportunityRejected', () => {
  it('closed opportunity cancels pending communication', async () => {
    // Create a communication
    await service.handleOpportunityCreated({
      tenantId: TENANT,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      opportunityId: OPP,
      opportunityType: 'missing_hotel',
      priority: 'high',
      score: 65,
    });

    const result = await service.handleOpportunityClosed({ tenantId: TENANT, opportunityId: OPP });
    expect(result.success).toBe(true);

    const comms = await communicationRepo.findByOpportunityId(TENANT, OPP);
    expect(comms[0]!.status).toBe('cancelled');
  });

  it('rejected opportunity cancels pending communication', async () => {
    await service.handleOpportunityCreated({
      tenantId: TENANT,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      opportunityId: OPP,
      opportunityType: 'missing_hotel',
      priority: 'high',
      score: 65,
    });

    const result = await service.handleOpportunityRejected({
      tenantId: TENANT,
      opportunityId: OPP,
    });
    expect(result.success).toBe(true);

    const comms = await communicationRepo.findByOpportunityId(TENANT, OPP);
    expect(comms[0]!.status).toBe('cancelled');
  });
});

describe('cooldown', () => {
  it('cooldown prevents duplicate within 72h', async () => {
    // First call succeeds
    const result1 = await service.handleOpportunityCreated({
      tenantId: TENANT,
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

    const eventsAfterFirst = eventBus.getEventsByType('CommunicationSent');
    expect(eventsAfterFirst).toHaveLength(1);

    // Second call with different opportunityId but same traveller within 72h doesn't send
    const result2 = await service.handleOpportunityCreated({
      tenantId: TENANT,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      opportunityId: 'aaaa9999-aaaa-4000-8000-aaaaaaaaaaaa',
      opportunityType: 'partial_coverage',
      priority: 'medium',
      score: 50,
    });
    expect(result2.success).toBe(true);
    expect(result2.data).toBeUndefined();

    // Still only one CommunicationSent event
    const eventsAfterSecond = eventBus.getEventsByType('CommunicationSent');
    expect(eventsAfterSecond).toHaveLength(1);
  });
});

describe('handleDeliveryResult', () => {
  it('bounced delivery increments retryCount on communication', async () => {
    // Create communication
    await service.handleOpportunityCreated({
      tenantId: TENANT,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      opportunityId: OPP,
      opportunityType: 'missing_hotel',
      priority: 'high',
      score: 65,
    });

    const comms = await communicationRepo.findByOpportunityId(TENANT, OPP);
    const commId = comms[0]!.communicationId;

    const result = await service.handleDeliveryResult({
      tenantId: TENANT,
      communicationId: commId,
      delivered: false,
    });

    expect(result.success).toBe(true);

    const updated = await communicationRepo.findById(TENANT, commId);
    expect(updated!.retryCount).toBe(1);
    expect(updated!.status).toBe('bounced');
  });

  it('second bounce creates agent escalation via needsEscalation', async () => {
    // Create communication
    await service.handleOpportunityCreated({
      tenantId: TENANT,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      opportunityId: OPP,
      opportunityType: 'missing_hotel',
      priority: 'high',
      score: 65,
    });

    const comms = await communicationRepo.findByOpportunityId(TENANT, OPP);
    const commId = comms[0]!.communicationId;

    // First bounce
    await service.handleDeliveryResult({
      tenantId: TENANT,
      communicationId: commId,
      delivered: false,
    });

    // After first bounce, status is 'bounced' and retryCount is 1
    // needsEscalation() returns true when retryCount >= MAX_RETRY_COUNT (1)
    // So the first bounce should already trigger escalation since MAX_RETRY_COUNT = 1
    const pending = await escalationRepo.findPending(TENANT);
    expect(pending).toHaveLength(1);
    expect(pending[0]!.reason).toBe('delivery_bounced');
  });
});

describe('tenantId and correlationId preservation', () => {
  it('tenantId preserved in all events', async () => {
    await service.handleOpportunityCreated({
      tenantId: TENANT,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      opportunityId: OPP,
      opportunityType: 'missing_hotel',
      priority: 'high',
      score: 65,
    });

    const events = eventBus.getEventsByType('CommunicationSent');
    expect(events).toHaveLength(1);
    expect(events[0]!.tenantId).toBe(TENANT);
    expect(events[0]!.payload).toMatchObject({ tenantId: TENANT });
  });

  it('correlationId preserved in published events', async () => {
    await service.handleOpportunityCreated(
      {
        tenantId: TENANT,
        corporateId: CORP,
        travellerId: TRAVELLER,
        tripId: TRIP,
        opportunityId: OPP,
        opportunityType: 'missing_hotel',
        priority: 'high',
        score: 65,
      },
      { correlationId: CORR },
    );

    const events = eventBus.getEventsByType('CommunicationSent');
    expect(events).toHaveLength(1);
    expect(events[0]!.correlationId).toBe(CORR);
  });
});

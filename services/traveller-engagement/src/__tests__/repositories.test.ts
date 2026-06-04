/**
 * Unit tests for in-memory repository implementations.
 * Validates tenant isolation, filtering, and append-only semantics.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Communication } from '../domain/communication.js';
import { TravellerAction } from '../domain/traveller-action.js';
import { TravellerResponse } from '../domain/traveller-response.js';
import { BookingRequest } from '../domain/booking-request.js';
import { AgentEscalation } from '../domain/agent-escalation.js';
import { TravellerPreference } from '../domain/traveller-preference.js';
import {
  InMemoryCommunicationRepository,
  InMemoryTravellerActionRepository,
  InMemoryTravellerResponseRepository,
  InMemoryBookingRequestRepository,
  InMemoryAgentEscalationRepository,
  InMemoryTravellerPreferenceRepository,
  InMemoryCommunicationAuditRepository,
} from '../repositories/in-memory.js';

describe('InMemoryCommunicationRepository', () => {
  let repo: InMemoryCommunicationRepository;

  beforeEach(() => {
    repo = new InMemoryCommunicationRepository();
  });

  function createComm(overrides: Record<string, unknown> = {}) {
    return Communication.create({
      tenantId: 'tenant-a',
      corporateId: 'corp-a',
      travellerId: 'trav-a',
      opportunityId: 'opp-a',
      communicationType: 'initial_contact',
      channel: 'email',
      ...overrides,
    });
  }

  describe('tenant isolation', () => {
    it('tenant A cannot see tenant B communications', async () => {
      const commA = createComm({ tenantId: 'tenant-a' });
      const commB = createComm({ tenantId: 'tenant-b' });

      await repo.save(commA);
      await repo.save(commB);

      const resultA = await repo.findById('tenant-a', commA.communicationId);
      const resultB = await repo.findById('tenant-a', commB.communicationId);

      expect(resultA).toBeDefined();
      expect(resultB).toBeUndefined();
    });

    it('findByTravellerId is tenant-scoped', async () => {
      const commA = createComm({ tenantId: 'tenant-a', travellerId: 'shared-trav' });
      const commB = createComm({ tenantId: 'tenant-b', travellerId: 'shared-trav' });

      await repo.save(commA);
      await repo.save(commB);

      const results = await repo.findByTravellerId('tenant-a', 'shared-trav');
      expect(results).toHaveLength(1);
      expect(results[0]!.tenantId).toBe('tenant-a');
    });
  });

  describe('save and findById', () => {
    it('returns saved communication', async () => {
      const comm = createComm();
      await repo.save(comm);

      const found = await repo.findById('tenant-a', comm.communicationId);
      expect(found).toBe(comm);
    });

    it('returns undefined for non-existent id', async () => {
      const found = await repo.findById('tenant-a', 'non-existent');
      expect(found).toBeUndefined();
    });
  });

  describe('findByOpportunityId', () => {
    it('returns all communications for opportunity', async () => {
      const c1 = createComm({ opportunityId: 'opp-x' });
      const c2 = createComm({ opportunityId: 'opp-x', communicationType: 'reminder' });
      const c3 = createComm({ opportunityId: 'opp-y' });

      await repo.save(c1);
      await repo.save(c2);
      await repo.save(c3);

      const results = await repo.findByOpportunityId('tenant-a', 'opp-x');
      expect(results).toHaveLength(2);
    });
  });

  describe('findByTravellerId', () => {
    it('returns all communications for traveller', async () => {
      const c1 = createComm({ travellerId: 'trav-x', opportunityId: 'opp-1' });
      const c2 = createComm({ travellerId: 'trav-x', opportunityId: 'opp-2' });
      const c3 = createComm({ travellerId: 'trav-y', opportunityId: 'opp-3' });

      await repo.save(c1);
      await repo.save(c2);
      await repo.save(c3);

      const results = await repo.findByTravellerId('tenant-a', 'trav-x');
      expect(results).toHaveLength(2);
    });
  });

  describe('findScheduled', () => {
    it('only returns communications with scheduled status', async () => {
      const scheduled = createComm({ opportunityId: 'opp-1' });
      scheduled.schedule(new Date('2026-01-15'));

      const pending = createComm({ opportunityId: 'opp-2' });

      await repo.save(scheduled);
      await repo.save(pending);

      const results = await repo.findScheduled('tenant-a');
      expect(results).toHaveLength(1);
      expect(results[0]!.status).toBe('scheduled');
    });
  });
});

describe('InMemoryTravellerActionRepository', () => {
  let repo: InMemoryTravellerActionRepository;

  beforeEach(() => {
    repo = new InMemoryTravellerActionRepository();
  });

  function createAction(overrides: Record<string, unknown> = {}) {
    return TravellerAction.create({
      communicationId: 'comm-a',
      tenantId: 'tenant-a',
      travellerId: 'trav-a',
      ...overrides,
    });
  }

  describe('save and findByToken', () => {
    it('returns action by token', async () => {
      const action = createAction();
      await repo.save(action);

      const found = await repo.findByToken('tenant-a', action.token);
      expect(found).toBe(action);
    });

    it('returns undefined for unknown token', async () => {
      const found = await repo.findByToken('tenant-a', 'unknown-token');
      expect(found).toBeUndefined();
    });
  });

  describe('findExpired', () => {
    it('returns expired unused actions', async () => {
      // Create action with a departure date in the past to force early expiry
      const expiredAction = TravellerAction.create({
        communicationId: 'comm-a',
        tenantId: 'tenant-a',
        travellerId: 'trav-a',
        departureDate: new Date('2020-01-01'),
      });

      await repo.save(expiredAction);

      const results = await repo.findExpired('tenant-a', new Date('2025-06-01'));
      expect(results).toHaveLength(1);
    });

    it('excludes used actions even if expired', async () => {
      const usedAction = TravellerAction.create({
        communicationId: 'comm-b',
        tenantId: 'tenant-a',
        travellerId: 'trav-a',
        departureDate: new Date('2020-01-01'),
      });
      usedAction.use();

      await repo.save(usedAction);

      const results = await repo.findExpired('tenant-a', new Date('2025-06-01'));
      expect(results).toHaveLength(0);
    });
  });
});

describe('InMemoryTravellerResponseRepository', () => {
  let repo: InMemoryTravellerResponseRepository;

  beforeEach(() => {
    repo = new InMemoryTravellerResponseRepository();
  });

  function createResponse(overrides: Record<string, unknown> = {}) {
    return TravellerResponse.create({
      communicationId: 'comm-a',
      opportunityId: 'opp-a',
      tenantId: 'tenant-a',
      travellerId: 'trav-a',
      responseType: 'accepted',
      ...overrides,
    });
  }

  describe('append accumulates', () => {
    it('multiple appends accumulate responses', async () => {
      const r1 = createResponse();
      const r2 = createResponse({ responseType: 'declined' });

      await repo.append(r1);
      await repo.append(r2);

      const results = await repo.findByCommunicationId('tenant-a', 'comm-a');
      expect(results).toHaveLength(2);
    });
  });

  describe('tenant scoped', () => {
    it('tenant A cannot see tenant B responses', async () => {
      const rA = createResponse({ tenantId: 'tenant-a' });
      const rB = createResponse({ tenantId: 'tenant-b' });

      await repo.append(rA);
      await repo.append(rB);

      const results = await repo.findByCommunicationId('tenant-a', 'comm-a');
      expect(results).toHaveLength(1);
      expect(results[0]!.tenantId).toBe('tenant-a');
    });
  });
});

describe('InMemoryBookingRequestRepository', () => {
  let repo: InMemoryBookingRequestRepository;

  beforeEach(() => {
    repo = new InMemoryBookingRequestRepository();
  });

  function createRequest(overrides: Record<string, unknown> = {}) {
    return BookingRequest.create({
      opportunityId: 'opp-a',
      tenantId: 'tenant-a',
      corporateId: 'corp-a',
      travellerId: 'trav-a',
      tripId: 'trip-a',
      ...overrides,
    });
  }

  describe('save and findById', () => {
    it('returns saved request', async () => {
      const request = createRequest();
      await repo.save(request);

      const found = await repo.findById('tenant-a', request.requestId);
      expect(found).toBe(request);
    });

    it('returns undefined for non-existent id', async () => {
      const found = await repo.findById('tenant-a', 'non-existent');
      expect(found).toBeUndefined();
    });
  });

  describe('findActive', () => {
    it('returns non-terminal requests', async () => {
      const created = createRequest({ tripId: 'trip-1' });
      const assigned = createRequest({ tripId: 'trip-2' });
      assigned.assign();
      const processing = createRequest({ tripId: 'trip-3' });
      processing.assign();
      processing.process();

      await repo.save(created);
      await repo.save(assigned);
      await repo.save(processing);

      const results = await repo.findActive('tenant-a');
      expect(results).toHaveLength(3);
    });

    it('excludes completed, failed, and cancelled requests', async () => {
      const completed = createRequest({ tripId: 'trip-1' });
      completed.assign();
      completed.process();
      completed.complete();

      const failed = createRequest({ tripId: 'trip-2' });
      failed.assign();
      failed.process();
      failed.fail();

      const cancelled = createRequest({ tripId: 'trip-3' });
      cancelled.cancel();

      await repo.save(completed);
      await repo.save(failed);
      await repo.save(cancelled);

      const results = await repo.findActive('tenant-a');
      expect(results).toHaveLength(0);
    });
  });
});

describe('InMemoryAgentEscalationRepository', () => {
  let repo: InMemoryAgentEscalationRepository;

  beforeEach(() => {
    repo = new InMemoryAgentEscalationRepository();
  });

  function createEscalation(overrides: Record<string, unknown> = {}) {
    return AgentEscalation.create({
      opportunityId: 'opp-a',
      tenantId: 'tenant-a',
      travellerId: 'trav-a',
      communicationId: 'comm-a',
      reason: 'high_value_opportunity',
      priority: 'high',
      ...overrides,
    });
  }

  describe('findPending', () => {
    it('returns only pending escalations', async () => {
      const pending = createEscalation({ communicationId: 'comm-1' });
      const assigned = createEscalation({ communicationId: 'comm-2' });
      assigned.assign('agent-1');

      await repo.save(pending);
      await repo.save(assigned);

      const results = await repo.findPending('tenant-a');
      expect(results).toHaveLength(1);
      expect(results[0]!.status).toBe('pending');
    });
  });

  describe('tenant scoped', () => {
    it('tenant A cannot see tenant B escalations', async () => {
      const escA = createEscalation({ tenantId: 'tenant-a' });
      const escB = createEscalation({ tenantId: 'tenant-b' });

      await repo.save(escA);
      await repo.save(escB);

      const resultsA = await repo.findPending('tenant-a');
      const resultsB = await repo.findPending('tenant-b');

      expect(resultsA).toHaveLength(1);
      expect(resultsA[0]!.tenantId).toBe('tenant-a');
      expect(resultsB).toHaveLength(1);
      expect(resultsB[0]!.tenantId).toBe('tenant-b');
    });
  });
});

describe('InMemoryTravellerPreferenceRepository', () => {
  let repo: InMemoryTravellerPreferenceRepository;

  beforeEach(() => {
    repo = new InMemoryTravellerPreferenceRepository();
  });

  function createPreference(overrides: Record<string, unknown> = {}) {
    return TravellerPreference.create({
      tenantId: 'tenant-a',
      travellerId: 'trav-a',
      ...overrides,
    });
  }

  describe('save and findByTravellerId', () => {
    it('returns saved preference', async () => {
      const pref = createPreference();
      await repo.save(pref);

      const found = await repo.findByTravellerId('tenant-a', 'trav-a');
      expect(found).toBe(pref);
    });

    it('returns undefined for unknown traveller', async () => {
      const found = await repo.findByTravellerId('tenant-a', 'unknown');
      expect(found).toBeUndefined();
    });
  });

  describe('tenant scoped', () => {
    it('tenant A cannot see tenant B preferences', async () => {
      const prefA = createPreference({ tenantId: 'tenant-a', travellerId: 'shared-trav' });
      const prefB = createPreference({ tenantId: 'tenant-b', travellerId: 'shared-trav' });

      await repo.save(prefA);
      await repo.save(prefB);

      const resultA = await repo.findByTravellerId('tenant-a', 'shared-trav');
      const resultB = await repo.findByTravellerId('tenant-b', 'shared-trav');

      expect(resultA).toBeDefined();
      expect(resultA!.tenantId).toBe('tenant-a');
      expect(resultB).toBeDefined();
      expect(resultB!.tenantId).toBe('tenant-b');
    });
  });
});

describe('InMemoryCommunicationAuditRepository', () => {
  let repo: InMemoryCommunicationAuditRepository;

  beforeEach(() => {
    repo = new InMemoryCommunicationAuditRepository();
  });

  describe('append accumulates in order', () => {
    it('entries are returned in insertion order', async () => {
      const e1 = {
        tenantId: 'tenant-a',
        communicationId: 'comm-a',
        action: 'created',
        occurredAt: new Date('2026-01-01'),
      };
      const e2 = {
        tenantId: 'tenant-a',
        communicationId: 'comm-a',
        action: 'scheduled',
        occurredAt: new Date('2026-01-02'),
      };
      const e3 = {
        tenantId: 'tenant-a',
        communicationId: 'comm-a',
        action: 'sent',
        occurredAt: new Date('2026-01-03'),
      };

      await repo.append(e1);
      await repo.append(e2);
      await repo.append(e3);

      const results = await repo.findByCommunicationId('tenant-a', 'comm-a');
      expect(results).toHaveLength(3);
      expect(results[0]).toBe(e1);
      expect(results[1]).toBe(e2);
      expect(results[2]).toBe(e3);
    });
  });

  describe('tenant scoped', () => {
    it('tenant A cannot see tenant B audit entries', async () => {
      const entryA = {
        tenantId: 'tenant-a',
        communicationId: 'comm-a',
        action: 'created',
        occurredAt: new Date(),
      };
      const entryB = {
        tenantId: 'tenant-b',
        communicationId: 'comm-a',
        action: 'created',
        occurredAt: new Date(),
      };

      await repo.append(entryA);
      await repo.append(entryB);

      const resultsA = await repo.findByCommunicationId('tenant-a', 'comm-a');
      const resultsB = await repo.findByCommunicationId('tenant-b', 'comm-a');

      expect(resultsA).toHaveLength(1);
      expect(resultsA[0]!.tenantId).toBe('tenant-a');
      expect(resultsB).toHaveLength(1);
      expect(resultsB[0]!.tenantId).toBe('tenant-b');
    });
  });
});

/**
 * Unit tests for Phase 1 projector functions.
 * Uses in-memory repositories to validate event projection logic.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import type { HCIEventEnvelope, EventType } from '@hci/event-contracts';
import {
  InMemoryProjectionCheckpointRepository,
  InMemoryOpportunityPipelineRepository,
  InMemoryDutyOfCareRepository,
  InMemoryEngagementFunnelRepository,
  InMemoryAgentEscalationAnalyticsRepository,
} from '../repositories/in-memory.js';
import type { ProjectorDeps } from '../projectors/types.js';
import { projectEvent } from '../projectors/index.js';

// --- Test helpers ---

function makeEvent(
  eventType: string,
  payload: Record<string, unknown>,
  overrides: Record<string, unknown> = {},
): HCIEventEnvelope {
  return {
    eventId: randomUUID(),
    eventType: eventType as EventType,
    schemaVersion: 1,
    tenantId: 'tenant-aaa',
    corporateId: 'corp-aaa',
    sourceService: 'hci.test',
    timestamp: new Date().toISOString(),
    correlationId: randomUUID(),
    payload,
    ...overrides,
  };
}

function makeDeps(): ProjectorDeps {
  return {
    checkpointRepo: new InMemoryProjectionCheckpointRepository(),
    pipelineRepo: new InMemoryOpportunityPipelineRepository(),
    dutyOfCareRepo: new InMemoryDutyOfCareRepository(),
    engagementRepo: new InMemoryEngagementFunnelRepository(),
    escalationRepo: new InMemoryAgentEscalationAnalyticsRepository(),
  };
}

// --- Tests ---

describe('Opportunity Pipeline Projector', () => {
  let deps: ProjectorDeps;

  beforeEach(() => {
    deps = makeDeps();
  });

  it('OpportunityCreated creates pipeline row', async () => {
    const event = makeEvent('OpportunityCreated', {
      opportunityId: 'opp-001',
      opportunityType: 'missing_hotel',
      lifecycleState: 'qualified',
      score: 85,
      priority: 'high',
      detectedAt: '2025-06-01T10:00:00Z',
      travellerId: 'trav-001',
      tripId: 'trip-001',
      estimatedSpend: 500,
      destinationCity: 'London',
    });

    const results = await projectEvent(event, deps);

    expect(results.some((r) => r.projectorName === 'opportunity-pipeline')).toBe(true);

    const rows = await deps.pipelineRepo.findByTenant('tenant-aaa');
    expect(rows).toHaveLength(1);
    expect(rows[0]!['opportunityId']).toBe('opp-001');
    expect(rows[0]!['opportunityType']).toBe('missing_hotel');
    expect(rows[0]!['lifecycleState']).toBe('qualified');
    expect(rows[0]!['score']).toBe(85);
    expect(rows[0]!['priority']).toBe('high');
    expect(rows[0]!['travellerId']).toBe('trav-001');
    expect(rows[0]!['tripId']).toBe('trip-001');
    expect(rows[0]!['estimatedSpend']).toBe(500);
    expect(rows[0]!['destinationCity']).toBe('London');
  });

  it('OpportunityUpdated updates existing pipeline row', async () => {
    const createEvent = makeEvent('OpportunityCreated', {
      opportunityId: 'opp-002',
      opportunityType: 'partial_coverage',
      lifecycleState: 'qualified',
      score: 70,
      priority: 'medium',
      detectedAt: '2025-06-01T10:00:00Z',
      travellerId: 'trav-002',
      tripId: 'trip-002',
    });
    await projectEvent(createEvent, deps);

    const updateEvent = makeEvent('OpportunityUpdated', {
      opportunityId: 'opp-002',
      opportunityType: 'partial_coverage',
      lifecycleState: 'active',
      previousScore: 70,
      newScore: 90,
      previousPriority: 'medium',
      newPriority: 'critical',
      updatedAt: '2025-06-02T10:00:00Z',
      tripId: 'trip-002',
    });
    await projectEvent(updateEvent, deps);

    const rows = await deps.pipelineRepo.findByTenant('tenant-aaa');
    expect(rows).toHaveLength(1);
    expect(rows[0]!['lifecycleState']).toBe('active');
    expect(rows[0]!['score']).toBe(90);
    expect(rows[0]!['priority']).toBe('critical');
  });

  it('OpportunityClosed marks closed with closureReason', async () => {
    const createEvent = makeEvent('OpportunityCreated', {
      opportunityId: 'opp-003',
      opportunityType: 'missing_hotel',
      lifecycleState: 'active',
      score: 80,
      priority: 'high',
      detectedAt: '2025-06-01T10:00:00Z',
      travellerId: 'trav-003',
      tripId: 'trip-003',
    });
    await projectEvent(createEvent, deps);

    const closeEvent = makeEvent('OpportunityClosed', {
      opportunityId: 'opp-003',
      opportunityType: 'missing_hotel',
      closureReason: 'hotel_added',
      finalScore: 80,
      closedAt: '2025-06-05T14:00:00Z',
      travellerId: 'trav-003',
      tripId: 'trip-003',
    });
    await projectEvent(closeEvent, deps);

    const rows = await deps.pipelineRepo.findByTenant('tenant-aaa');
    expect(rows).toHaveLength(1);
    expect(rows[0]!['lifecycleState']).toBe('closed');
    expect(rows[0]!['closureReason']).toBe('hotel_added');
    expect(rows[0]!['closedAt']).toBe('2025-06-05T14:00:00Z');
    expect(rows[0]!['score']).toBe(80);
  });

  it('OpportunityRejected marks rejected with rejectionReason', async () => {
    const createEvent = makeEvent('OpportunityCreated', {
      opportunityId: 'opp-004',
      opportunityType: 'direct_booked',
      lifecycleState: 'qualified',
      score: 60,
      priority: 'low',
      detectedAt: '2025-06-01T10:00:00Z',
      travellerId: 'trav-004',
      tripId: 'trip-004',
    });
    await projectEvent(createEvent, deps);

    const rejectEvent = makeEvent('OpportunityRejected', {
      opportunityId: 'opp-004',
      opportunityType: 'direct_booked',
      rejectionReason: 'traveller_declined',
      rejectedAt: '2025-06-05T16:00:00Z',
      travellerId: 'trav-004',
      tripId: 'trip-004',
    });
    await projectEvent(rejectEvent, deps);

    const rows = await deps.pipelineRepo.findByTenant('tenant-aaa');
    expect(rows).toHaveLength(1);
    expect(rows[0]!['lifecycleState']).toBe('rejected');
    expect(rows[0]!['rejectionReason']).toBe('traveller_declined');
    expect(rows[0]!['closedAt']).toBe('2025-06-05T16:00:00Z');
  });
});

describe('Duty of Care Projector', () => {
  let deps: ProjectorDeps;

  beforeEach(() => {
    deps = makeDeps();
  });

  it('HotelCoverageUpdated creates/updates duty of care row', async () => {
    const event = makeEvent('HotelCoverageUpdated', {
      tripId: 'trip-010',
      tenantId: 'tenant-aaa',
      coveragePercent: 60,
      coverageStatus: 'partially_covered',
      totalNightsRequired: 5,
      nightsCovered: 3,
      calculatedAt: '2025-06-01T12:00:00Z',
    });

    const results = await projectEvent(event, deps);

    expect(results.some((r) => r.projectorName === 'duty-of-care')).toBe(true);

    const rows = await deps.dutyOfCareRepo.findByTenant('tenant-aaa');
    expect(rows).toHaveLength(1);
    expect(rows[0]!['tripId']).toBe('trip-010');
    expect(rows[0]!['coveragePercent']).toBe(60);
    expect(rows[0]!['isUnresolved']).toBe(true);
  });

  it('OpportunityCreated with duty_of_care_gap marks unresolved', async () => {
    const event = makeEvent('OpportunityCreated', {
      opportunityId: 'opp-020',
      opportunityType: 'duty_of_care_gap',
      lifecycleState: 'qualified',
      score: 90,
      priority: 'critical',
      detectedAt: '2025-06-01T10:00:00Z',
      travellerId: 'trav-010',
      tripId: 'trip-020',
    });

    const results = await projectEvent(event, deps);

    expect(results.some((r) => r.projectorName === 'duty-of-care')).toBe(true);

    const unresolved = await deps.dutyOfCareRepo.findUnresolved('tenant-aaa');
    expect(unresolved).toHaveLength(1);
    expect(unresolved[0]!['tripId']).toBe('trip-020');
    expect(unresolved[0]!['isUnresolved']).toBe(true);
    expect(unresolved[0]!['opportunityId']).toBe('opp-020');
  });
});

describe('Engagement Funnel Projector', () => {
  let deps: ProjectorDeps;

  beforeEach(() => {
    deps = makeDeps();
  });

  it('CommunicationSent increments weekly sent count', async () => {
    // Use a Wednesday timestamp so Monday = June 2 2025
    const event = makeEvent(
      'CommunicationSent',
      {
        communicationId: 'comm-001',
        opportunityId: 'opp-030',
        travellerId: 'trav-020',
        communicationType: 'initial_contact',
        channel: 'email',
        sentAt: '2025-06-04T09:00:00Z',
      },
      { timestamp: '2025-06-04T09:00:00Z' },
    );

    const results = await projectEvent(event, deps);

    expect(results.some((r) => r.projectorName === 'engagement-funnel')).toBe(true);

    // Monday of the week containing June 4 2025 = June 2
    const periodStart = new Date('2025-06-02T00:00:00.000Z');
    const rows = await deps.engagementRepo.findByPeriod('tenant-aaa', periodStart);
    expect(rows).toHaveLength(1);
    expect(rows[0]!['communicationsSent']).toBe(1);
    expect(rows[0]!['responsesReceived']).toBe(0);
    expect(rows[0]!['bookingRequests']).toBe(0);
  });

  it('TravellerResponded increments response count', async () => {
    const event = makeEvent(
      'TravellerResponded',
      {
        responseId: 'resp-001',
        communicationId: 'comm-001',
        opportunityId: 'opp-030',
        travellerId: 'trav-020',
        responseType: 'accepted',
        respondedAt: '2025-06-04T15:00:00Z',
      },
      { timestamp: '2025-06-04T15:00:00Z' },
    );

    await projectEvent(event, deps);

    const periodStart = new Date('2025-06-02T00:00:00.000Z');
    const rows = await deps.engagementRepo.findByPeriod('tenant-aaa', periodStart);
    expect(rows).toHaveLength(1);
    expect(rows[0]!['responsesReceived']).toBe(1);
    expect(rows[0]!['communicationsSent']).toBe(0);
  });

  it('BookingRequestCreated increments booking count', async () => {
    const event = makeEvent(
      'BookingRequestCreated',
      {
        requestId: 'req-001',
        opportunityId: 'opp-030',
        travellerId: 'trav-020',
        tripId: 'trip-030',
        requestStatus: 'created',
        requestedAt: '2025-06-04T16:00:00Z',
      },
      { timestamp: '2025-06-04T16:00:00Z' },
    );

    await projectEvent(event, deps);

    const periodStart = new Date('2025-06-02T00:00:00.000Z');
    const rows = await deps.engagementRepo.findByPeriod('tenant-aaa', periodStart);
    expect(rows).toHaveLength(1);
    expect(rows[0]!['bookingRequests']).toBe(1);
    expect(rows[0]!['communicationsSent']).toBe(0);
    expect(rows[0]!['responsesReceived']).toBe(0);
  });
});

describe('Agent Escalation Projector', () => {
  let deps: ProjectorDeps;

  beforeEach(() => {
    deps = makeDeps();
  });

  it('OpportunityCreated with awaiting_action creates escalation row', async () => {
    const event = makeEvent('OpportunityCreated', {
      opportunityId: 'opp-040',
      opportunityType: 'missing_hotel',
      lifecycleState: 'awaiting_action',
      score: 95,
      priority: 'critical',
      detectedAt: '2025-06-01T10:00:00Z',
      travellerId: 'trav-030',
      tripId: 'trip-040',
    });

    const results = await projectEvent(event, deps);

    expect(results.some((r) => r.projectorName === 'agent-escalation')).toBe(true);

    const pending = await deps.escalationRepo.findPending('tenant-aaa');
    expect(pending).toHaveLength(1);
    expect(pending[0]!['opportunityId']).toBe('opp-040');
    expect(pending[0]!['status']).toBe('pending');
    expect(pending[0]!['priority']).toBe('critical');
    expect(pending[0]!['travellerId']).toBe('trav-030');
  });
});

describe('Event Dispatcher', () => {
  let deps: ProjectorDeps;

  beforeEach(() => {
    deps = makeDeps();
  });

  it('unsupported event type returns empty results', async () => {
    const event = makeEvent('PNRCreated', {
      pnrId: 'pnr-001',
      travellerId: 'trav-100',
    });

    const results = await projectEvent(event, deps);

    expect(results).toHaveLength(0);
  });

  it('duplicate event processing is idempotent', async () => {
    const event = makeEvent('OpportunityCreated', {
      opportunityId: 'opp-050',
      opportunityType: 'missing_hotel',
      lifecycleState: 'qualified',
      score: 80,
      priority: 'high',
      detectedAt: '2025-06-01T10:00:00Z',
      travellerId: 'trav-040',
      tripId: 'trip-050',
    });

    await projectEvent(event, deps);
    await projectEvent(event, deps);

    const rows = await deps.pipelineRepo.findByTenant('tenant-aaa');
    expect(rows).toHaveLength(1);
    expect(rows[0]!['opportunityId']).toBe('opp-050');
  });

  it('checkpoint advances after successful processing', async () => {
    const event = makeEvent('OpportunityCreated', {
      opportunityId: 'opp-060',
      opportunityType: 'missing_hotel',
      lifecycleState: 'qualified',
      score: 75,
      priority: 'medium',
      detectedAt: '2025-06-01T10:00:00Z',
      travellerId: 'trav-050',
      tripId: 'trip-060',
    });

    await projectEvent(event, deps);

    const checkpoint = await deps.checkpointRepo.getCheckpoint('opportunity-pipeline');
    expect(checkpoint).toBeDefined();
    expect(checkpoint!.lastEventId).toBe(event.eventId);
    expect(checkpoint!.eventsProcessedCount).toBe(1);
  });

  it('tenantId preserved in all projections', async () => {
    const tenantId = 'tenant-xyz';
    const event = makeEvent(
      'OpportunityCreated',
      {
        opportunityId: 'opp-070',
        opportunityType: 'duty_of_care_gap',
        lifecycleState: 'awaiting_action',
        score: 90,
        priority: 'critical',
        detectedAt: '2025-06-01T10:00:00Z',
        travellerId: 'trav-060',
        tripId: 'trip-070',
      },
      { tenantId },
    );

    await projectEvent(event, deps);

    // Pipeline row preserves tenantId
    const pipelineRows = await deps.pipelineRepo.findByTenant(tenantId);
    expect(pipelineRows).toHaveLength(1);
    expect(pipelineRows[0]!['tenantId']).toBe(tenantId);

    // Duty of care row preserves tenantId
    const docRows = await deps.dutyOfCareRepo.findByTenant(tenantId);
    expect(docRows).toHaveLength(1);
    expect(docRows[0]!['tenantId']).toBe(tenantId);

    // Escalation row preserves tenantId
    const escRows = await deps.escalationRepo.findByTenant(tenantId);
    expect(escRows).toHaveLength(1);
    expect(escRows[0]!['tenantId']).toBe(tenantId);
  });
});

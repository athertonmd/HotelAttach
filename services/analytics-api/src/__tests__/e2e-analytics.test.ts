/**
 * E2E Integration Tests for Analytics Phase 1.
 * Tests the full flow: event → projector → query service → API handler response.
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
import type { AnalyticsControllerDeps } from '../api/analytics-controller.js';
import {
  handleGetOpportunitySummary,
  handleGetDutyOfCareSummary,
  handleGetEngagementSummary,
  handleGetEscalationSummary,
} from '../api/analytics-controller.js';
import type { RequestContext } from '../api/request-context.js';

// ─── Constants ──────────────────────────────────────────────────────────────

const TENANT_A = 'tenant-aaa';
const TENANT_B = 'tenant-bbb';
const CORP = 'corp-aaa';
const CORR = 'corr-e2e-001';

// ─── Test helpers ───────────────────────────────────────────────────────────

function makeEvent(
  eventType: string,
  payload: Record<string, unknown>,
  overrides: Record<string, unknown> = {},
): HCIEventEnvelope {
  return {
    eventId: randomUUID(),
    eventType: eventType as EventType,
    schemaVersion: 1,
    tenantId: TENANT_A,
    corporateId: CORP,
    sourceService: 'hci.test',
    timestamp: '2025-06-04T09:00:00Z',
    correlationId: randomUUID(),
    payload,
    ...overrides,
  };
}

const ctxA: RequestContext = { tenantId: TENANT_A, correlationId: CORR };
const ctxB: RequestContext = { tenantId: TENANT_B, correlationId: CORR };

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('E2E: Analytics Phase 1', () => {
  let projectorDeps: ProjectorDeps;
  let apiDeps: AnalyticsControllerDeps;

  beforeEach(() => {
    const checkpointRepo = new InMemoryProjectionCheckpointRepository();
    const pipelineRepo = new InMemoryOpportunityPipelineRepository();
    const dutyOfCareRepo = new InMemoryDutyOfCareRepository();
    const engagementRepo = new InMemoryEngagementFunnelRepository();
    const escalationRepo = new InMemoryAgentEscalationAnalyticsRepository();

    projectorDeps = {
      checkpointRepo,
      pipelineRepo,
      dutyOfCareRepo,
      engagementRepo,
      escalationRepo,
    };
    apiDeps = { pipelineRepo, dutyOfCareRepo, engagementRepo, escalationRepo };
  });

  it('Scenario 1: OpportunityCreated → pipeline → API summary shows active count', async () => {
    const event = makeEvent('OpportunityCreated', {
      opportunityId: randomUUID(),
      opportunityType: 'hotel_booking',
      lifecycleState: 'open',
      priority: 'high',
      score: 85,
    });

    await projectEvent(event, projectorDeps);

    const response = await handleGetOpportunitySummary(ctxA, apiDeps);

    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.data.activeCount).toBe(1);
    }
  });

  it('Scenario 2: OpportunityClosed reduces active count', async () => {
    const opportunityId = randomUUID();

    const created = makeEvent('OpportunityCreated', {
      opportunityId,
      opportunityType: 'hotel_booking',
      lifecycleState: 'open',
      priority: 'high',
      score: 85,
    });

    const closed = makeEvent('OpportunityClosed', {
      opportunityId,
      closureReason: 'booked',
      closedAt: '2025-06-04T10:00:00Z',
    });

    await projectEvent(created, projectorDeps);
    await projectEvent(closed, projectorDeps);

    const response = await handleGetOpportunitySummary(ctxA, apiDeps);

    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.data.activeCount).toBe(0);
    }
  });

  it('Scenario 3: HotelCoverageUpdated → duty of care → API shows unresolved gap', async () => {
    const event = makeEvent('HotelCoverageUpdated', {
      tripId: randomUUID(),
      coveragePercent: 60,
      coverageStatus: 'partial',
      totalNightsRequired: 5,
      nightsCovered: 3,
      calculatedAt: '2025-06-04T09:00:00Z',
    });

    await projectEvent(event, projectorDeps);

    const response = await handleGetDutyOfCareSummary(ctxA, apiDeps);

    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.data.unresolvedCount).toBe(1);
    }
  });

  it('Scenario 4: CommunicationSent → engagement funnel → API shows sent count', async () => {
    const event = makeEvent('CommunicationSent', {
      communicationId: randomUUID(),
      travellerId: randomUUID(),
      channel: 'email',
    });

    await projectEvent(event, projectorDeps);

    // periodStart must match the Monday of the event week (2025-06-02 for Wed 2025-06-04)
    const response = await handleGetEngagementSummary(
      ctxA,
      { periodStart: '2025-06-02T00:00:00Z' },
      apiDeps,
    );

    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.data.communicationsSent).toBe(1);
    }
  });

  it('Scenario 5: TravellerResponded → engagement funnel → response count increments', async () => {
    const event = makeEvent('TravellerResponded', {
      communicationId: randomUUID(),
      travellerId: randomUUID(),
      responseType: 'accepted',
    });

    await projectEvent(event, projectorDeps);

    const response = await handleGetEngagementSummary(
      ctxA,
      { periodStart: '2025-06-02T00:00:00Z' },
      apiDeps,
    );

    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.data.responsesReceived).toBe(1);
    }
  });

  it('Scenario 6: OpportunityCreated awaiting_action → escalation → API shows pending', async () => {
    const event = makeEvent('OpportunityCreated', {
      opportunityId: randomUUID(),
      opportunityType: 'hotel_booking',
      lifecycleState: 'awaiting_action',
      priority: 'critical',
      score: 95,
      travellerId: randomUUID(),
      tripId: randomUUID(),
      detectedAt: '2025-06-04T08:00:00Z',
    });

    await projectEvent(event, projectorDeps);

    const response = await handleGetEscalationSummary(ctxA, apiDeps);

    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.data.pendingCount).toBe(1);
    }
  });

  it('Scenario 7: Tenant isolation — Tenant B cannot see Tenant A projections', async () => {
    const event = makeEvent('OpportunityCreated', {
      opportunityId: randomUUID(),
      opportunityType: 'hotel_booking',
      lifecycleState: 'open',
      priority: 'high',
      score: 80,
    });

    await projectEvent(event, projectorDeps);

    // Query with Tenant B context — should see nothing
    const response = await handleGetOpportunitySummary(ctxB, apiDeps);

    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.data.activeCount).toBe(0);
    }
  });

  it('Scenario 8: correlationId included in API response', async () => {
    const response = await handleGetOpportunitySummary(ctxA, apiDeps);

    expect(response.correlationId).toBe(CORR);
  });

  it('Scenario 9: Unsupported event does not change projections', async () => {
    const event = makeEvent('PNRCreated', {
      pnrId: randomUUID(),
      recordLocator: 'ABC123',
    });

    const results = await projectEvent(event, projectorDeps);

    // No projector handled this event
    expect(results.length).toBe(0);

    // Pipeline remains empty
    const response = await handleGetOpportunitySummary(ctxA, apiDeps);
    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.data.activeCount).toBe(0);
    }
  });

  it('Scenario 10: Multiple events accumulate correctly', async () => {
    // Project 3 OpportunityCreated events
    const ids = [randomUUID(), randomUUID(), randomUUID()];
    for (const opportunityId of ids) {
      const event = makeEvent('OpportunityCreated', {
        opportunityId,
        opportunityType: 'hotel_booking',
        lifecycleState: 'open',
        priority: 'high',
        score: 80,
      });
      await projectEvent(event, projectorDeps);
    }

    let response = await handleGetOpportunitySummary(ctxA, apiDeps);
    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.data.activeCount).toBe(3);
    }

    // Close 1 opportunity
    const closeEvent = makeEvent('OpportunityClosed', {
      opportunityId: ids[0],
      closureReason: 'booked',
      closedAt: '2025-06-04T11:00:00Z',
    });
    await projectEvent(closeEvent, projectorDeps);

    response = await handleGetOpportunitySummary(ctxA, apiDeps);
    expect(response.success).toBe(true);
    if (response.success) {
      expect(response.data.activeCount).toBe(2);
    }
  });
});

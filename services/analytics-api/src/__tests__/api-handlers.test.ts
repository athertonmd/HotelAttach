/**
 * Unit tests for Analytics API controller handlers.
 * Uses in-memory repositories to validate request context, validation, and response shapes.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryOpportunityPipelineRepository,
  InMemoryDutyOfCareRepository,
  InMemoryEngagementFunnelRepository,
  InMemoryAgentEscalationAnalyticsRepository,
} from '../repositories/in-memory.js';
import type { RequestContext } from '../api/request-context.js';
import type { AnalyticsControllerDeps } from '../api/analytics-controller.js';
import {
  handleGetOpportunitySummary,
  handleGetOpportunityList,
  handleGetDutyOfCareSummary,
  handleGetEngagementSummary,
  handleGetEscalationSummary,
} from '../api/analytics-controller.js';

const ctx: RequestContext = { tenantId: 'tenant-aaa', correlationId: 'corr-001' };
const noTenantCtx: RequestContext = { tenantId: '', correlationId: 'corr-002' };

function createDeps(): AnalyticsControllerDeps {
  return {
    pipelineRepo: new InMemoryOpportunityPipelineRepository(),
    dutyOfCareRepo: new InMemoryDutyOfCareRepository(),
    engagementRepo: new InMemoryEngagementFunnelRepository(),
    escalationRepo: new InMemoryAgentEscalationAnalyticsRepository(),
  };
}

// ─── Opportunity Summary ────────────────────────────────────────────────────

describe('handleGetOpportunitySummary', () => {
  let deps: AnalyticsControllerDeps;

  beforeEach(async () => {
    deps = createDeps();
    await deps.pipelineRepo.upsert('tenant-aaa', 'opp-1', {
      lifecycleState: 'awaiting_action',
      priority: 'critical',
      opportunityType: 'upsell',
      departureDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
    await deps.pipelineRepo.upsert('tenant-aaa', 'opp-2', {
      lifecycleState: 'in_progress',
      priority: 'high',
      opportunityType: 'new_booking',
    });
  });

  it('returns summary data on success', async () => {
    const result = await handleGetOpportunitySummary(ctx, deps);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.activeCount).toBe(2);
      expect(result.data.criticalCount).toBe(1);
    }
  });

  it('returns UNAUTHORIZED when tenantId is missing', async () => {
    const result = await handleGetOpportunitySummary(noTenantCtx, deps);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('UNAUTHORIZED');
    }
  });
});

// ─── Opportunity List ───────────────────────────────────────────────────────

describe('handleGetOpportunityList', () => {
  let deps: AnalyticsControllerDeps;

  beforeEach(async () => {
    deps = createDeps();
    for (let i = 0; i < 10; i++) {
      await deps.pipelineRepo.upsert('tenant-aaa', `opp-${i}`, {
        lifecycleState: i < 5 ? 'awaiting_action' : 'in_progress',
        priority: i % 2 === 0 ? 'high' : 'medium',
        corporateId: i < 3 ? 'corp-1' : 'corp-2',
      });
    }
  });

  it('returns list with default pagination', async () => {
    const result = await handleGetOpportunityList(ctx, {}, deps);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.total).toBe(10);
      expect(result.data.items).toHaveLength(10);
    }
  });

  it('filters by state', async () => {
    const result = await handleGetOpportunityList(ctx, { state: 'awaiting_action' }, deps);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.total).toBe(5);
    }
  });

  it('returns INVALID_PAGINATION when limit > 100', async () => {
    const result = await handleGetOpportunityList(ctx, { limit: '200' }, deps);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_PAGINATION');
    }
  });

  it('returns INVALID_PAGINATION when offset < 0', async () => {
    const result = await handleGetOpportunityList(ctx, { offset: '-1' }, deps);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_PAGINATION');
    }
  });

  it('forwards corporateId filter', async () => {
    const result = await handleGetOpportunityList(ctx, { corporateId: 'corp-1' }, deps);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.total).toBe(3);
    }
  });
});

// ─── Duty of Care Summary ───────────────────────────────────────────────────

describe('handleGetDutyOfCareSummary', () => {
  let deps: AnalyticsControllerDeps;

  beforeEach(async () => {
    deps = createDeps();
    await deps.dutyOfCareRepo.upsert('tenant-aaa', 'trip-1', {
      isUnresolved: false,
      destinationRiskLevel: 'low',
    });
    await deps.dutyOfCareRepo.upsert('tenant-aaa', 'trip-2', {
      isUnresolved: true,
      destinationRiskLevel: 'high',
      departureDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    });
  });

  it('returns duty of care summary on success', async () => {
    const result = await handleGetDutyOfCareSummary(ctx, deps);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.totalTrips).toBe(2);
      expect(result.data.unresolvedCount).toBe(1);
    }
  });
});

// ─── Engagement Summary ─────────────────────────────────────────────────────

describe('handleGetEngagementSummary', () => {
  let deps: AnalyticsControllerDeps;
  const periodStart = '2025-06-02T00:00:00Z';

  beforeEach(async () => {
    deps = createDeps();
    await deps.engagementRepo.upsert('tenant-aaa', 'corp-1', new Date(periodStart), {
      communicationsSent: 100,
      responsesReceived: 40,
      bookingRequests: 10,
    });
  });

  it('returns engagement summary with default period', async () => {
    // Default period is current week Monday — data might not match,
    // but the handler should succeed without error
    const result = await handleGetEngagementSummary(ctx, {}, deps);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveProperty('communicationsSent');
      expect(result.data).toHaveProperty('responseRate');
    }
  });

  it('returns INVALID_DATE_RANGE for invalid periodStart', async () => {
    const result = await handleGetEngagementSummary(ctx, { periodStart: 'not-a-date' }, deps);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_DATE_RANGE');
    }
  });
});

// ─── Escalation Summary ─────────────────────────────────────────────────────

describe('handleGetEscalationSummary', () => {
  let deps: AnalyticsControllerDeps;

  beforeEach(async () => {
    deps = createDeps();
    await deps.escalationRepo.upsert('tenant-aaa', 'esc-1', {
      status: 'pending',
      priority: 'high',
      reason: 'policy_violation',
    });
    await deps.escalationRepo.upsert('tenant-aaa', 'esc-2', {
      status: 'resolved',
      priority: 'low',
      reason: 'other',
    });
  });

  it('returns escalation summary on success', async () => {
    const result = await handleGetEscalationSummary(ctx, deps);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pendingCount).toBe(1);
      expect(result.data.totalCount).toBe(2);
    }
  });
});

// ─── Cross-cutting: correlationId ───────────────────────────────────────────

describe('correlationId handling', () => {
  it('includes correlationId in success responses', async () => {
    const deps = createDeps();
    const result = await handleGetOpportunitySummary(ctx, deps);
    expect(result.correlationId).toBe('corr-001');
  });

  it('includes correlationId in error responses', async () => {
    const deps = createDeps();
    const result = await handleGetOpportunitySummary(noTenantCtx, deps);
    expect(result.correlationId).toBe('corr-002');
  });
});

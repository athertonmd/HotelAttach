/**
 * Unit tests for Phase 1 dashboard query service functions.
 * Uses in-memory repositories pre-populated with test data.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  InMemoryOpportunityPipelineRepository,
  InMemoryDutyOfCareRepository,
  InMemoryEngagementFunnelRepository,
  InMemoryAgentEscalationAnalyticsRepository,
} from '../repositories/in-memory.js';
import { getOpportunitySummary, getOpportunityList } from '../queries/opportunity-queries.js';
import { getDutyOfCareSummary } from '../queries/duty-of-care-queries.js';
import { getEngagementSummary } from '../queries/engagement-queries.js';
import { getEscalationSummary } from '../queries/escalation-queries.js';

const TENANT_A = 'tenant-aaa';
const TENANT_B = 'tenant-bbb';

// ─── Opportunity Pipeline Queries ───────────────────────────────────────────

describe('getOpportunitySummary', () => {
  let repo: InMemoryOpportunityPipelineRepository;

  beforeEach(async () => {
    repo = new InMemoryOpportunityPipelineRepository();
    // Active opportunities
    await repo.upsert(TENANT_A, 'opp-1', {
      lifecycleState: 'awaiting_action',
      priority: 'critical',
      opportunityType: 'upsell',
      departureDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow – at risk
    });
    await repo.upsert(TENANT_A, 'opp-2', {
      lifecycleState: 'in_progress',
      priority: 'high',
      opportunityType: 'new_booking',
      departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days out
    });
    await repo.upsert(TENANT_A, 'opp-3', {
      lifecycleState: 'awaiting_action',
      priority: 'medium',
      opportunityType: 'upsell',
    });
    // Closed opportunity – should not be active
    await repo.upsert(TENANT_A, 'opp-4', {
      lifecycleState: 'closed',
      priority: 'low',
      opportunityType: 'retention',
    });
    // Different tenant
    await repo.upsert(TENANT_B, 'opp-5', {
      lifecycleState: 'awaiting_action',
      priority: 'critical',
      opportunityType: 'upsell',
    });
  });

  it('returns correct active and critical counts', async () => {
    const summary = await getOpportunitySummary(TENANT_A, repo);
    expect(summary.activeCount).toBe(3);
    expect(summary.criticalCount).toBe(1);
    expect(summary.awaitingActionCount).toBe(2);
  });

  it('tenant isolation – only sees own data', async () => {
    const summaryA = await getOpportunitySummary(TENANT_A, repo);
    const summaryB = await getOpportunitySummary(TENANT_B, repo);
    expect(summaryA.activeCount).toBe(3);
    expect(summaryB.activeCount).toBe(1);
  });

  it('calculates atRisk correctly (departure within 48h)', async () => {
    const summary = await getOpportunitySummary(TENANT_A, repo);
    expect(summary.atRiskCount).toBe(1);
  });

  it('aggregates byPriority and byType correctly', async () => {
    const summary = await getOpportunitySummary(TENANT_A, repo);
    expect(summary.byPriority['critical']).toBe(1);
    expect(summary.byPriority['high']).toBe(1);
    expect(summary.byPriority['medium']).toBe(1);
    expect(summary.byType['upsell']).toBe(2);
    expect(summary.byType['new_booking']).toBe(1);
  });
});

describe('getOpportunityList', () => {
  let repo: InMemoryOpportunityPipelineRepository;

  beforeEach(async () => {
    repo = new InMemoryOpportunityPipelineRepository();
    for (let i = 0; i < 10; i++) {
      await repo.upsert(TENANT_A, `opp-${i}`, {
        lifecycleState: i < 5 ? 'awaiting_action' : 'in_progress',
        priority: i % 2 === 0 ? 'high' : 'medium',
        corporateId: i < 3 ? 'corp-1' : 'corp-2',
      });
    }
  });

  it('filters by state', async () => {
    const result = await getOpportunityList({ tenantId: TENANT_A, state: 'awaiting_action' }, repo);
    expect(result.total).toBe(5);
    expect(result.items).toHaveLength(5);
  });

  it('paginates with limit and offset', async () => {
    const result = await getOpportunityList({ tenantId: TENANT_A, limit: 3, offset: 2 }, repo);
    expect(result.total).toBe(10);
    expect(result.items).toHaveLength(3);
  });

  it('filters by corporateId', async () => {
    const result = await getOpportunityList({ tenantId: TENANT_A, corporateId: 'corp-1' }, repo);
    expect(result.total).toBe(3);
    expect(result.items).toHaveLength(3);
  });

  it('filters by priority', async () => {
    const result = await getOpportunityList({ tenantId: TENANT_A, priority: 'high' }, repo);
    expect(result.total).toBe(5);
  });
});

// ─── Duty of Care Queries ───────────────────────────────────────────────────

describe('getDutyOfCareSummary', () => {
  let repo: InMemoryDutyOfCareRepository;

  beforeEach(async () => {
    repo = new InMemoryDutyOfCareRepository();
    // Resolved trips (isUnresolved = false)
    await repo.upsert(TENANT_A, 'trip-1', {
      isUnresolved: false,
      destinationRiskLevel: 'low',
    });
    await repo.upsert(TENANT_A, 'trip-2', {
      isUnresolved: false,
      destinationRiskLevel: 'medium',
    });
    // Unresolved trips
    await repo.upsert(TENANT_A, 'trip-3', {
      isUnresolved: true,
      destinationRiskLevel: 'high',
      departureDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
    });
    await repo.upsert(TENANT_A, 'trip-4', {
      isUnresolved: true,
      destinationRiskLevel: 'critical',
      departureDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
    });
    await repo.upsert(TENANT_A, 'trip-5', {
      isUnresolved: true,
      destinationRiskLevel: 'low',
      departureDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days
    });
  });

  it('returns correct visibility rate', async () => {
    const summary = await getDutyOfCareSummary(TENANT_A, repo);
    expect(summary.totalTrips).toBe(5);
    expect(summary.resolvedCount).toBe(2);
    expect(summary.unresolvedCount).toBe(3);
    // 2/5 = 40%
    expect(summary.visibilityRate).toBe(40);
  });

  it('identifies high-risk unresolved trips', async () => {
    const summary = await getDutyOfCareSummary(TENANT_A, repo);
    expect(summary.highRiskUnresolved).toBe(2); // high + critical
  });

  it('handles empty state (no trips)', async () => {
    const emptyRepo = new InMemoryDutyOfCareRepository();
    const summary = await getDutyOfCareSummary(TENANT_A, emptyRepo);
    expect(summary.totalTrips).toBe(0);
    expect(summary.visibilityRate).toBe(100);
    expect(summary.highRiskUnresolved).toBe(0);
    expect(summary.approachingDeparture).toBe(0);
  });

  it('counts approaching departure correctly (within 7 days)', async () => {
    const summary = await getDutyOfCareSummary(TENANT_A, repo);
    // trip-3 (3 days) and trip-5 (2 days) are within 7 days; trip-4 (14 days) is not
    expect(summary.approachingDeparture).toBe(2);
  });
});

// ─── Engagement Funnel Queries ──────────────────────────────────────────────

describe('getEngagementSummary', () => {
  let repo: InMemoryEngagementFunnelRepository;
  const periodStart = new Date('2025-06-01T00:00:00Z');

  beforeEach(async () => {
    repo = new InMemoryEngagementFunnelRepository();
    await repo.upsert(TENANT_A, 'corp-1', periodStart, {
      communicationsSent: 100,
      responsesReceived: 40,
      bookingRequests: 10,
    });
    await repo.upsert(TENANT_A, 'corp-2', periodStart, {
      communicationsSent: 50,
      responsesReceived: 20,
      bookingRequests: 5,
    });
    // Different period – should not be included
    await repo.upsert(TENANT_A, 'corp-1', new Date('2025-05-01T00:00:00Z'), {
      communicationsSent: 200,
      responsesReceived: 100,
      bookingRequests: 50,
    });
  });

  it('aggregates weekly data for a period', async () => {
    const summary = await getEngagementSummary(TENANT_A, periodStart, repo);
    expect(summary.communicationsSent).toBe(150);
    expect(summary.responsesReceived).toBe(60);
    expect(summary.bookingsCreated).toBe(15);
  });

  it('calculates rates correctly', async () => {
    const summary = await getEngagementSummary(TENANT_A, periodStart, repo);
    // 60/150 = 40%
    expect(summary.responseRate).toBe(40);
    // 15/150 = 10%
    expect(summary.conversionRate).toBe(10);
  });

  it('handles zero sent (no division by zero)', async () => {
    const emptyRepo = new InMemoryEngagementFunnelRepository();
    await emptyRepo.upsert(TENANT_A, 'corp-1', periodStart, {
      communicationsSent: 0,
      responsesReceived: 0,
      bookingRequests: 0,
    });
    const summary = await getEngagementSummary(TENANT_A, periodStart, emptyRepo);
    expect(summary.responseRate).toBe(0);
    expect(summary.conversionRate).toBe(0);
    expect(summary.communicationsSent).toBe(0);
  });
});

// ─── Escalation Analytics Queries ───────────────────────────────────────────

describe('getEscalationSummary', () => {
  let repo: InMemoryAgentEscalationAnalyticsRepository;

  beforeEach(async () => {
    repo = new InMemoryAgentEscalationAnalyticsRepository();
    // Pending escalations
    await repo.upsert(TENANT_A, 'esc-1', {
      status: 'pending',
      priority: 'high',
      reason: 'policy_violation',
    });
    await repo.upsert(TENANT_A, 'esc-2', {
      status: 'pending',
      priority: 'high',
      reason: 'rate_dispute',
    });
    await repo.upsert(TENANT_A, 'esc-3', {
      status: 'pending',
      priority: 'medium',
      reason: 'policy_violation',
    });
    // Resolved escalation
    await repo.upsert(TENANT_A, 'esc-4', {
      status: 'resolved',
      priority: 'low',
      reason: 'other',
    });
    // Different tenant
    await repo.upsert(TENANT_B, 'esc-5', {
      status: 'pending',
      priority: 'critical',
      reason: 'emergency',
    });
  });

  it('returns correct pending count', async () => {
    const summary = await getEscalationSummary(TENANT_A, repo);
    expect(summary.pendingCount).toBe(3);
    expect(summary.totalCount).toBe(4);
  });

  it('groups by priority and reason', async () => {
    const summary = await getEscalationSummary(TENANT_A, repo);
    expect(summary.byPriority['high']).toBe(2);
    expect(summary.byPriority['medium']).toBe(1);
    expect(summary.byReason['policy_violation']).toBe(2);
    expect(summary.byReason['rate_dispute']).toBe(1);
  });
});

// ─── Cross-cutting: Tenant Isolation ────────────────────────────────────────

describe('tenant isolation across all queries', () => {
  it('opportunity queries are tenant-isolated', async () => {
    const repo = new InMemoryOpportunityPipelineRepository();
    await repo.upsert(TENANT_A, 'opp-a', {
      lifecycleState: 'in_progress',
      priority: 'high',
      opportunityType: 'upsell',
    });
    await repo.upsert(TENANT_B, 'opp-b', {
      lifecycleState: 'in_progress',
      priority: 'critical',
      opportunityType: 'retention',
    });

    const summaryA = await getOpportunitySummary(TENANT_A, repo);
    const summaryB = await getOpportunitySummary(TENANT_B, repo);
    expect(summaryA.activeCount).toBe(1);
    expect(summaryA.criticalCount).toBe(0);
    expect(summaryB.activeCount).toBe(1);
    expect(summaryB.criticalCount).toBe(1);
  });

  it('escalation queries are tenant-isolated', async () => {
    const repo = new InMemoryAgentEscalationAnalyticsRepository();
    await repo.upsert(TENANT_A, 'esc-a', { status: 'pending', priority: 'high', reason: 'x' });
    await repo.upsert(TENANT_B, 'esc-b', { status: 'pending', priority: 'low', reason: 'y' });

    const summaryA = await getEscalationSummary(TENANT_A, repo);
    const summaryB = await getEscalationSummary(TENANT_B, repo);
    expect(summaryA.pendingCount).toBe(1);
    expect(summaryA.byPriority['high']).toBe(1);
    expect(summaryB.pendingCount).toBe(1);
    expect(summaryB.byPriority['low']).toBe(1);
  });
});

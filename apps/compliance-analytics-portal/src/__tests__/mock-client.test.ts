import { describe, it, expect } from 'vitest';
import { createMockClient } from '../api/mock-client';

describe('Mock API Client', () => {
  describe('getOpportunitySummary', () => {
    it('returns expected shape', async () => {
      const client = createMockClient({ delay: 0 });
      const result = await client.getOpportunitySummary();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.correlationId).toBeDefined();
        expect(result.data.activeCount).toBeTypeOf('number');
        expect(result.data.criticalCount).toBeTypeOf('number');
        expect(result.data.awaitingActionCount).toBeTypeOf('number');
        expect(result.data.atRiskCount).toBeTypeOf('number');
        expect(result.data.byPriority).toBeTypeOf('object');
        expect(result.data.byType).toBeTypeOf('object');
      }
    });
  });

  describe('getOpportunityList', () => {
    it('returns expected shape', async () => {
      const client = createMockClient({ delay: 0 });
      const result = await client.getOpportunityList();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items).toBeInstanceOf(Array);
        expect(result.data.total).toBeTypeOf('number');
        expect(result.data.items.length).toBeGreaterThan(0);
        const item = result.data.items[0];
        expect(item.opportunityId).toBeDefined();
        expect(item.tripId).toBeDefined();
        expect(item.priority).toBeDefined();
        expect(item.lifecycleState).toBeDefined();
      }
    });

    it('supports pagination with limit and offset', async () => {
      const client = createMockClient({ delay: 0 });
      const result = await client.getOpportunityList({ limit: 2, offset: 0 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(2);
        expect(result.data.total).toBe(6);
      }
    });

    it('supports pagination with offset', async () => {
      const client = createMockClient({ delay: 0 });
      const result = await client.getOpportunityList({ limit: 2, offset: 4 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(2);
        expect(result.data.total).toBe(6);
      }
    });

    it('filters by state', async () => {
      const client = createMockClient({ delay: 0 });
      const result = await client.getOpportunityList({ state: 'awaiting_action' });

      expect(result.success).toBe(true);
      if (result.success) {
        for (const item of result.data.items) {
          expect(item.lifecycleState).toBe('awaiting_action');
        }
      }
    });

    it('filters by priority', async () => {
      const client = createMockClient({ delay: 0 });
      const result = await client.getOpportunityList({ priority: 'critical' });

      expect(result.success).toBe(true);
      if (result.success) {
        for (const item of result.data.items) {
          expect(item.priority).toBe('critical');
        }
      }
    });
  });

  describe('getDutyOfCareSummary', () => {
    it('returns expected shape', async () => {
      const client = createMockClient({ delay: 0 });
      const result = await client.getDutyOfCareSummary();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalTrips).toBeTypeOf('number');
        expect(result.data.resolvedCount).toBeTypeOf('number');
        expect(result.data.unresolvedCount).toBeTypeOf('number');
        expect(result.data.visibilityRate).toBeTypeOf('number');
        expect(result.data.highRiskUnresolved).toBeTypeOf('number');
        expect(result.data.approachingDeparture).toBeTypeOf('number');
      }
    });
  });

  describe('getEngagementSummary', () => {
    it('returns expected shape', async () => {
      const client = createMockClient({ delay: 0 });
      const result = await client.getEngagementSummary();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.communicationsSent).toBeTypeOf('number');
        expect(result.data.responsesReceived).toBeTypeOf('number');
        expect(result.data.bookingsCreated).toBeTypeOf('number');
        expect(result.data.responseRate).toBeTypeOf('number');
        expect(result.data.conversionRate).toBeTypeOf('number');
      }
    });
  });

  describe('getEscalationSummary', () => {
    it('returns expected shape', async () => {
      const client = createMockClient({ delay: 0 });
      const result = await client.getEscalationSummary();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pendingCount).toBeTypeOf('number');
        expect(result.data.totalCount).toBeTypeOf('number');
        expect(result.data.byPriority).toBeTypeOf('object');
        expect(result.data.byReason).toBeTypeOf('object');
      }
    });
  });

  describe('error simulation', () => {
    it('returns error response when simulateError is true', async () => {
      const client = createMockClient({ delay: 0, simulateError: true });
      const result = await client.getOpportunitySummary();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.correlationId).toBeDefined();
        expect(result.error.code).toBe('INTERNAL_ERROR');
        expect(result.error.message).toBe('Simulated server error');
      }
    });

    it('error simulation works on all methods', async () => {
      const client = createMockClient({ delay: 0, simulateError: true });

      const results = await Promise.all([
        client.getOpportunitySummary(),
        client.getOpportunityList(),
        client.getDutyOfCareSummary(),
        client.getEngagementSummary(),
        client.getEscalationSummary(),
      ]);

      for (const result of results) {
        expect(result.success).toBe(false);
      }
    });
  });
});

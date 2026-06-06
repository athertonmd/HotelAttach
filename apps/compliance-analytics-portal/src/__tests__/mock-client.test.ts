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
        expect(result.data.total).toBe(50);
      }
    });

    it('supports pagination with offset', async () => {
      const client = createMockClient({ delay: 0 });
      const result = await client.getOpportunityList({ limit: 2, offset: 48 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(2);
        expect(result.data.total).toBe(50);
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
        client.getBehaviourOverview(),
        client.getBehaviourArchetypes(),
        client.getBehaviourFatigue(),
        client.getBehaviourRevenueRisk(),
        client.getBehaviourActionPerformance(),
        client.getBehaviourPredictionAccuracy(),
      ]);

      for (const result of results) {
        expect(result.success).toBe(false);
      }
    });
  });

  describe('getBehaviourOverview', () => {
    it('returns expected shape', async () => {
      const client = createMockClient({ delay: 0 });
      const result = await client.getBehaviourOverview();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalTravellers).toBeTypeOf('number');
        expect(result.data.archetypeDistribution).toBeTypeOf('object');
        expect(result.data.segmentDistribution).toBeTypeOf('object');
        expect(result.data.averageConfidence).toBeTypeOf('number');
        expect(result.data.highFatigueCount).toBeTypeOf('number');
        expect(result.data.significantDriftCount).toBeTypeOf('number');
      }
    });
  });

  describe('getBehaviourArchetypes', () => {
    it('returns expected shape', async () => {
      const client = createMockClient({ delay: 0 });
      const result = await client.getBehaviourArchetypes();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.distribution).toBeInstanceOf(Array);
        expect(result.data.total).toBeTypeOf('number');
        expect(result.data.distribution.length).toBeGreaterThan(0);
      }
    });
  });

  describe('getBehaviourFatigue', () => {
    it('returns expected shape', async () => {
      const client = createMockClient({ delay: 0 });
      const result = await client.getBehaviourFatigue();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.distribution).toBeTypeOf('object');
        expect(result.data.highCriticalTravellers).toBeInstanceOf(Array);
        expect(result.data.totalSuppressions).toBeTypeOf('number');
      }
    });
  });

  describe('getBehaviourRevenueRisk', () => {
    it('returns expected shape', async () => {
      const client = createMockClient({ delay: 0 });
      const result = await client.getBehaviourRevenueRisk();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.totalRevenueAtRisk).toBeTypeOf('number');
        expect(result.data.highestRiskTravellers).toBeInstanceOf(Array);
        expect(result.data.byRiskTier).toBeTypeOf('object');
      }
    });
  });

  describe('getBehaviourActionPerformance', () => {
    it('returns expected shape', async () => {
      const client = createMockClient({ delay: 0 });
      const result = await client.getBehaviourActionPerformance();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.actions).toBeInstanceOf(Array);
        expect(result.data.overallAccuracy).toBeTypeOf('number');
        expect(result.data.totalRecommendations).toBeTypeOf('number');
      }
    });
  });

  describe('getBehaviourPredictionAccuracy', () => {
    it('returns expected shape', async () => {
      const client = createMockClient({ delay: 0 });
      const result = await client.getBehaviourPredictionAccuracy();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.overallAccuracy).toBeTypeOf('number');
        expect(result.data.totalPredictions).toBeTypeOf('number');
        expect(result.data.correctPredictions).toBeTypeOf('number');
        expect(result.data.avgDaysDifference).toBeTypeOf('number');
      }
    });
  });
});

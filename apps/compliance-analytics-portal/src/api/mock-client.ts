/**
 * Mock API client for Phase 1 analytics dashboards.
 * Simulates network delay and supports optional error simulation.
 */

import type {
  ApiResponse,
  OpportunitySummary,
  OpportunityListResponse,
  OpportunityListParams,
  DutyOfCareSummary,
  EngagementSummary,
  EscalationSummary,
  BehaviourOverviewSummary,
  ArchetypeDistributionSummary,
  FatigueSummary,
  RevenueRiskSummary,
  ActionPerformanceSummary,
  PredictionAccuracySummary,
} from './types.js';
import {
  mockOpportunitySummary,
  mockOpportunityList,
  mockDutyOfCareSummary,
  mockEngagementSummary,
  mockEscalationSummary,
  mockBehaviourOverview,
  mockArchetypeDistribution,
  mockFatigueSummary,
  mockRevenueRiskSummary,
  mockActionPerformance,
  mockPredictionAccuracy,
} from './mock-data.js';

export interface MockClientOptions {
  /** Simulated network delay in ms (default: 300) */
  delay?: number;
  /** When true, all calls reject with a simulated error */
  simulateError?: boolean;
}

function generateCorrelationId(): string {
  return crypto.randomUUID();
}

async function simulateNetwork<T>(data: T, options: MockClientOptions): Promise<ApiResponse<T>> {
  const delay = options.delay ?? 300;
  await new Promise((resolve) => setTimeout(resolve, delay));

  if (options.simulateError) {
    return {
      success: false,
      correlationId: generateCorrelationId(),
      error: { code: 'INTERNAL_ERROR', message: 'Simulated server error' },
    };
  }

  return {
    success: true,
    correlationId: generateCorrelationId(),
    data,
  };
}

export interface MockClient {
  getOpportunitySummary(): Promise<ApiResponse<OpportunitySummary>>;
  getOpportunityList(params?: OpportunityListParams): Promise<ApiResponse<OpportunityListResponse>>;
  getDutyOfCareSummary(): Promise<ApiResponse<DutyOfCareSummary>>;
  getEngagementSummary(): Promise<ApiResponse<EngagementSummary>>;
  getEscalationSummary(): Promise<ApiResponse<EscalationSummary>>;
  getBehaviourOverview(): Promise<ApiResponse<BehaviourOverviewSummary>>;
  getBehaviourArchetypes(): Promise<ApiResponse<ArchetypeDistributionSummary>>;
  getBehaviourFatigue(): Promise<ApiResponse<FatigueSummary>>;
  getBehaviourRevenueRisk(): Promise<ApiResponse<RevenueRiskSummary>>;
  getBehaviourActionPerformance(): Promise<ApiResponse<ActionPerformanceSummary>>;
  getBehaviourPredictionAccuracy(): Promise<ApiResponse<PredictionAccuracySummary>>;
}

export function createMockClient(options: MockClientOptions = {}): MockClient {
  return {
    async getOpportunitySummary(): Promise<ApiResponse<OpportunitySummary>> {
      return simulateNetwork(mockOpportunitySummary, options);
    },

    async getOpportunityList(
      params: OpportunityListParams = {},
    ): Promise<ApiResponse<OpportunityListResponse>> {
      let filtered = [...mockOpportunityList];

      if (params.state) {
        filtered = filtered.filter((item) => item.lifecycleState === params.state);
      }
      if (params.priority) {
        filtered = filtered.filter((item) => item.priority === params.priority);
      }

      const offset = params.offset ?? 0;
      const limit = params.limit ?? 50;
      const items = filtered.slice(offset, offset + limit);

      return simulateNetwork({ items, total: filtered.length }, options);
    },

    async getDutyOfCareSummary(): Promise<ApiResponse<DutyOfCareSummary>> {
      return simulateNetwork(mockDutyOfCareSummary, options);
    },

    async getEngagementSummary(): Promise<ApiResponse<EngagementSummary>> {
      return simulateNetwork(mockEngagementSummary, options);
    },

    async getEscalationSummary(): Promise<ApiResponse<EscalationSummary>> {
      return simulateNetwork(mockEscalationSummary, options);
    },

    async getBehaviourOverview(): Promise<ApiResponse<BehaviourOverviewSummary>> {
      return simulateNetwork(mockBehaviourOverview, options);
    },

    async getBehaviourArchetypes(): Promise<ApiResponse<ArchetypeDistributionSummary>> {
      return simulateNetwork(mockArchetypeDistribution, options);
    },

    async getBehaviourFatigue(): Promise<ApiResponse<FatigueSummary>> {
      return simulateNetwork(mockFatigueSummary, options);
    },

    async getBehaviourRevenueRisk(): Promise<ApiResponse<RevenueRiskSummary>> {
      return simulateNetwork(mockRevenueRiskSummary, options);
    },

    async getBehaviourActionPerformance(): Promise<ApiResponse<ActionPerformanceSummary>> {
      return simulateNetwork(mockActionPerformance, options);
    },

    async getBehaviourPredictionAccuracy(): Promise<ApiResponse<PredictionAccuracySummary>> {
      return simulateNetwork(mockPredictionAccuracy, options);
    },
  };
}

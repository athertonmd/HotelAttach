/**
 * API response types matching the Phase 1 analytics-api response shapes.
 */

export interface ApiSuccessResponse<T> {
  success: true;
  correlationId: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  correlationId: string;
  error: { code: string; message: string };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// --- Opportunity Operations ---

export interface OpportunitySummary {
  activeCount: number;
  criticalCount: number;
  awaitingActionCount: number;
  atRiskCount: number;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
}

export interface OpportunityListItem {
  opportunityId: string;
  tripId: string;
  travellerId: string;
  opportunityType: string;
  priority: string;
  lifecycleState: string;
  score: number;
  departureDate: string;
  destination: string;
  estimatedCommission: number;
  createdAt: string;
}

export interface OpportunityListResponse {
  items: OpportunityListItem[];
  total: number;
}

export interface OpportunityListParams {
  state?: string;
  priority?: string;
  limit?: number;
  offset?: number;
}

// --- Duty of Care ---

export interface DutyOfCareSummary {
  totalTrips: number;
  resolvedCount: number;
  unresolvedCount: number;
  visibilityRate: number;
  highRiskUnresolved: number;
  approachingDeparture: number;
  byDestination: Record<string, number>;
  approachingDepartureList: DutyOfCareTrip[];
}

export interface DutyOfCareTrip {
  tripId: string;
  travellerId: string;
  destination: string;
  departureDate: string;
  riskLevel: string;
}

// --- Engagement ---

export interface EngagementSummary {
  communicationsSent: number;
  responsesReceived: number;
  bookingsCreated: number;
  responseRate: number;
  conversionRate: number;
  escalationCount: number;
  byChannel: Record<string, number>;
  byType: Record<string, number>;
  responsesByType: Record<string, number>;
}

// --- Escalations ---

export interface EscalationSummary {
  pendingCount: number;
  totalCount: number;
  criticalCount: number;
  assignedCount: number;
  byPriority: Record<string, number>;
  byReason: Record<string, number>;
  escalations: EscalationListItem[];
}

export interface EscalationListItem {
  escalationId: string;
  opportunityId: string;
  travellerId: string;
  reason: string;
  priority: string;
  status: string;
  assignedAgentId: string;
}

// --- Behaviour Intelligence ---

export interface BehaviourOverviewSummary {
  totalTravellers: number;
  archetypeDistribution: Record<string, number>;
  segmentDistribution: Record<string, number>;
  averageConfidence: number;
  highFatigueCount: number;
  significantDriftCount: number;
}

export interface ArchetypeDistributionSummary {
  distribution: { archetype: string; count: number }[];
  total: number;
}

export interface FatigueSummary {
  distribution: Record<string, number>;
  highCriticalTravellers: {
    travellerId: string;
    fatigueScore: number;
    fatigueLevel: string;
  }[];
  totalSuppressions: number;
}

export interface RevenueRiskSummary {
  totalRevenueAtRisk: number;
  highestRiskTravellers: {
    travellerId: string;
    revenueAtRisk: number;
    riskTier: string;
  }[];
  byRiskTier: Record<string, number>;
}

export interface ActionPerformanceSummary {
  actions: {
    action: string;
    totalRecommended: number;
    totalCorrect: number;
    accuracyRate: number;
  }[];
  overallAccuracy: number;
  totalRecommendations: number;
}

export interface PredictionAccuracySummary {
  overallAccuracy: number;
  totalPredictions: number;
  correctPredictions: number;
  avgDaysDifference: number;
}

// --- Behaviour Traveller Detail ---

export interface BehaviourTravellerRow {
  travellerId: string;
  archetype: string;
  confidence: number;
  fatigueLevel: string;
  fatigueScore: number;
  driftStatus: string;
  revenueAtRisk: number;
  recommendedChannel: string;
  suppressionCount: number;
  lastCommunication: string;
  recommendedAction: string;
}

export interface BehaviourTravellerListResponse {
  items: BehaviourTravellerRow[];
  total: number;
}

export interface BehaviourTravellerListParams {
  archetype?: string;
  fatigueLevel?: string;
  limit?: number;
  offset?: number;
}

/**
 * Realistic demo data for Phase 1 analytics dashboards.
 * 50 opportunities, 20 escalations, ~100 engagement communications.
 */

import type {
  OpportunitySummary,
  OpportunityListItem,
  DutyOfCareSummary,
  EngagementSummary,
  EscalationSummary,
} from './types.js';
import {
  generateOpportunities,
  generateEscalations,
  generateApproachingDepartures,
} from './mock-data-generator.js';

// --- Opportunities (50 items) ---

export const mockOpportunityList: OpportunityListItem[] = generateOpportunities(50);

export const mockOpportunitySummary: OpportunitySummary = {
  activeCount: 47,
  criticalCount: 8,
  awaitingActionCount: 12,
  atRiskCount: 5,
  byPriority: { critical: 8, high: 15, medium: 18, low: 6 },
  byType: {
    missing_hotel: 20,
    partial_coverage: 12,
    policy_violation: 8,
    rate_opportunity: 4,
    duty_of_care_gap: 3,
  },
};

// --- Duty of Care ---

export const mockDutyOfCareSummary: DutyOfCareSummary = {
  totalTrips: 312,
  resolvedCount: 264,
  unresolvedCount: 48,
  visibilityRate: 85,
  highRiskUnresolved: 11,
  approachingDeparture: 8,
  byDestination: {
    London: 9,
    'New York': 7,
    Paris: 6,
    Singapore: 5,
    Tokyo: 5,
    Dubai: 4,
    Mumbai: 4,
    Frankfurt: 3,
    Sydney: 3,
    'Hong Kong': 2,
  },
  approachingDepartureList: generateApproachingDepartures(8),
};

// --- Engagement (~100 communications) ---

export const mockEngagementSummary: EngagementSummary = {
  communicationsSent: 247,
  responsesReceived: 142,
  bookingsCreated: 58,
  responseRate: 57,
  conversionRate: 23,
  escalationCount: 20,
  byChannel: {
    email: 148,
    sms: 52,
    push_notification: 31,
    in_app: 16,
  },
  byType: {
    missing_hotel_prompt: 108,
    booking_confirmation: 56,
    policy_reminder: 47,
    departure_alert: 36,
  },
  responsesByType: {
    accepted: 58,
    declined: 34,
    deferred: 28,
    no_response: 22,
  },
};

// --- Escalations (20 items) ---

export const mockEscalationSummary: EscalationSummary = {
  pendingCount: 14,
  totalCount: 52,
  criticalCount: 5,
  assignedCount: 12,
  byPriority: { critical: 5, high: 7, medium: 5, low: 3 },
  byReason: {
    no_response: 6,
    departure_imminent: 5,
    policy_escalation: 4,
    manual_review: 3,
    high_value_trip: 2,
  },
  escalations: generateEscalations(20),
};

// --- Behaviour Intelligence Mock Data ---

import type {
  BehaviourOverviewSummary,
  ArchetypeDistributionSummary,
  FatigueSummary,
  RevenueRiskSummary,
  ActionPerformanceSummary,
  PredictionAccuracySummary,
} from './types.js';

export const mockBehaviourOverview: BehaviourOverviewSummary = {
  totalTravellers: 247,
  archetypeDistribution: {
    autopilot: 52,
    responsive: 68,
    nudge_needer: 45,
    procrastinator: 38,
    reluctant: 22,
    chaotic: 12,
    new_traveller: 10,
  },
  segmentDistribution: {
    self_sufficient: 65,
    reliable_late: 82,
    needs_prompting: 58,
    requires_intervention: 30,
    non_compliant: 12,
  },
  averageConfidence: 74,
  highFatigueCount: 18,
  significantDriftCount: 9,
};

export const mockArchetypeDistribution: ArchetypeDistributionSummary = {
  distribution: [
    { archetype: 'responsive', count: 68 },
    { archetype: 'autopilot', count: 52 },
    { archetype: 'nudge_needer', count: 45 },
    { archetype: 'procrastinator', count: 38 },
    { archetype: 'reluctant', count: 22 },
    { archetype: 'chaotic', count: 12 },
    { archetype: 'new_traveller', count: 10 },
  ],
  total: 247,
};

export const mockFatigueSummary: FatigueSummary = {
  distribution: { low: 152, medium: 58, high: 27, critical: 10 },
  highCriticalTravellers: [
    { travellerId: 'trav-101', fatigueScore: 92, fatigueLevel: 'critical' },
    { travellerId: 'trav-045', fatigueScore: 88, fatigueLevel: 'critical' },
    { travellerId: 'trav-178', fatigueScore: 82, fatigueLevel: 'critical' },
    { travellerId: 'trav-023', fatigueScore: 76, fatigueLevel: 'high' },
    { travellerId: 'trav-199', fatigueScore: 72, fatigueLevel: 'high' },
  ],
  totalSuppressions: 84,
};

export const mockRevenueRiskSummary: RevenueRiskSummary = {
  totalRevenueAtRisk: 45230,
  highestRiskTravellers: [
    { travellerId: 'trav-088', revenueAtRisk: 3200, riskTier: 'critical' },
    { travellerId: 'trav-042', revenueAtRisk: 2800, riskTier: 'critical' },
    { travellerId: 'trav-156', revenueAtRisk: 2100, riskTier: 'at_risk' },
    { travellerId: 'trav-073', revenueAtRisk: 1950, riskTier: 'at_risk' },
    { travellerId: 'trav-201', revenueAtRisk: 1600, riskTier: 'uncertain' },
  ],
  byRiskTier: { secure: 85, likely: 72, uncertain: 48, at_risk: 28, critical: 14 },
};

export const mockActionPerformance: ActionPerformanceSummary = {
  actions: [
    { action: 'send_email', totalRecommended: 120, totalCorrect: 84, accuracyRate: 70 },
    { action: 'send_sms', totalRecommended: 45, totalCorrect: 33, accuracyRate: 73 },
    { action: 'send_push', totalRecommended: 30, totalCorrect: 19, accuracyRate: 63 },
    { action: 'wait', totalRecommended: 65, totalCorrect: 52, accuracyRate: 80 },
    { action: 'do_nothing', totalRecommended: 40, totalCorrect: 35, accuracyRate: 88 },
    { action: 'escalate', totalRecommended: 18, totalCorrect: 14, accuracyRate: 78 },
  ],
  overallAccuracy: 74,
  totalRecommendations: 318,
};

export const mockPredictionAccuracy: PredictionAccuracySummary = {
  overallAccuracy: 74,
  totalPredictions: 318,
  correctPredictions: 237,
  avgDaysDifference: 2.3,
};

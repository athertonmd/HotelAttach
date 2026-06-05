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

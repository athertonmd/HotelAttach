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

// --- Behaviour Traveller Detail Mock Data ---

import type { BehaviourTravellerRow } from './types.js';

const archetypes = [
  'autopilot',
  'procrastinator',
  'responsive',
  'nudge_needer',
  'reluctant',
  'chaotic',
  'new_traveller',
];
const fatigueLevels = ['low', 'medium', 'high', 'critical'];
const driftStatuses = ['stable', 'moderate', 'significant'];
const channels = ['email', 'sms', 'push_notification', 'in_app'];
const actions = ['do_nothing', 'wait', 'send_email', 'send_sms', 'send_push', 'escalate'];

export const mockBehaviourTravellers: BehaviourTravellerRow[] = Array.from(
  { length: 30 },
  (_, i) => ({
    travellerId: `trav-${String(i + 1).padStart(3, '0')}`,
    archetype: archetypes[i % archetypes.length] as string,
    confidence: 50 + Math.round(Math.random() * 50),
    fatigueLevel: fatigueLevels[i % fatigueLevels.length] as string,
    fatigueScore: 10 + (i % fatigueLevels.length) * 25,
    driftStatus: driftStatuses[i % driftStatuses.length] as string,
    revenueAtRisk: Math.round(Math.random() * 3000),
    recommendedChannel: channels[i % channels.length] as string,
    suppressionCount: Math.floor(Math.random() * 5),
    lastCommunication: new Date(Date.now() - i * 86400000).toISOString(),
    recommendedAction: actions[i % actions.length] as string,
  }),
);

// --- Behaviour Timeline Mock Data ---

import type {
  BehaviourTimelineResponse,
  TravellerTimelineEntry,
  AggregateTimelineSummary,
} from './types.js';

const timelineArchetypes = [
  'autopilot',
  'procrastinator',
  'responsive',
  'nudge_needer',
  'reluctant',
  'chaotic',
];

function generateTimelineEvents(archetype: string): TravellerTimelineEntry['events'] {
  const leadDays = archetype === 'procrastinator' ? 2 : archetype === 'autopilot' ? 14 : 7;
  return [
    { type: 'trip_created', daysBefore: 30, label: 'Trip created' },
    {
      type: 'communication_sent',
      daysBefore: leadDays + 5,
      label: 'First email',
      channel: 'email',
    },
    { type: 'communication_sent', daysBefore: leadDays + 2, label: 'Reminder SMS', channel: 'sms' },
    { type: 'hotel_booked', daysBefore: leadDays, label: 'Hotel booked' },
    { type: 'departure', daysBefore: 0, label: 'Departure' },
  ];
}

export const mockTimelineTravellers: TravellerTimelineEntry[] = Array.from(
  { length: 15 },
  (_, i) => {
    const arch = timelineArchetypes[i % timelineArchetypes.length] as string;
    return {
      travellerId: `trav-${String(i + 1).padStart(3, '0')}`,
      archetype: arch,
      avgLeadTimeDays: arch === 'procrastinator' ? 2 : arch === 'autopilot' ? 14 : 7,
      consistency: 0.3 + Math.random() * 0.6,
      events: generateTimelineEvents(arch),
    };
  },
);

export const mockAggregateTimeline: AggregateTimelineSummary = {
  avgBookingLeadDays: 7.2,
  avgCommunicationLeadDays: 12.4,
  communicationsBeforeBooking: 1.8,
  lateBookerArchetypes: ['procrastinator', 'chaotic'],
  earlyCommPercentage: 34,
};

export const mockBehaviourTimeline: BehaviourTimelineResponse = {
  aggregate: mockAggregateTimeline,
  travellers: mockTimelineTravellers,
};

// --- Hotel Attachment Analytics Mock Data ---

import type {
  HotelAttachmentSummary,
  HotelAttachmentCurveResponse,
  HotelAttachmentCorporatesResponse,
  HotelAttachmentDelayResponse,
} from './types.js';

export const mockHotelAttachmentSummary: HotelAttachmentSummary = {
  currentRate: 78,
  targetRate: 85,
  attachmentGap: 7,
  pendingAssessmentCount: 23,
  avgAttachmentDelayDays: 4.2,
  estimatedRevenueImpact: 14400,
};

export const mockHotelAttachmentCurve: HotelAttachmentCurveResponse = {
  curve: [
    { daysBefore: 30, label: '30 days', rate: 12 },
    { daysBefore: 20, label: '20 days', rate: 28 },
    { daysBefore: 14, label: '14 days', rate: 42 },
    { daysBefore: 10, label: '10 days', rate: 55 },
    { daysBefore: 7, label: '7 days', rate: 64 },
    { daysBefore: 5, label: '5 days', rate: 70 },
    { daysBefore: 3, label: '3 days', rate: 74 },
    { daysBefore: 1, label: '1 day', rate: 77 },
    { daysBefore: 0, label: 'Departure', rate: 78 },
  ],
};

export const mockHotelAttachmentCorporates: HotelAttachmentCorporatesResponse = {
  corporates: [
    {
      corporateId: 'corp-001',
      corporateName: 'Acme Corp',
      attachmentRate: 92,
      target: 85,
      gap: -7,
      trend: 'improving',
    },
    {
      corporateId: 'corp-002',
      corporateName: 'Widget Industries',
      attachmentRate: 84,
      target: 85,
      gap: 1,
      trend: 'stable',
    },
    {
      corporateId: 'corp-003',
      corporateName: 'TechStart Ltd',
      attachmentRate: 76,
      target: 85,
      gap: 9,
      trend: 'declining',
    },
    {
      corporateId: 'corp-004',
      corporateName: 'Global Finance',
      attachmentRate: 71,
      target: 85,
      gap: 14,
      trend: 'declining',
    },
    {
      corporateId: 'corp-005',
      corporateName: 'MegaTravel Inc',
      attachmentRate: 88,
      target: 85,
      gap: -3,
      trend: 'improving',
    },
  ],
};

export const mockHotelAttachmentDelay: HotelAttachmentDelayResponse = {
  distribution: [
    { band: '0–24 hours', percentage: 35, count: 112 },
    { band: '24–48 hours', percentage: 25, count: 80 },
    { band: '48–72 hours', percentage: 18, count: 58 },
    { band: '3–7 days', percentage: 15, count: 48 },
    { band: '7+ days', percentage: 7, count: 22 },
  ],
  averageDays: 4.2,
};

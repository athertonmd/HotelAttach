/**
 * Generates realistic demo data for the analytics portal.
 * 50 opportunities, 20 escalations, engagement metrics for ~100 communications.
 */

import type { OpportunityListItem, DutyOfCareTrip, EscalationListItem } from './types.js';

const DESTINATIONS = [
  'London',
  'Paris',
  'New York',
  'Tokyo',
  'Singapore',
  'Dubai',
  'Mumbai',
  'Sydney',
  'Frankfurt',
  'Amsterdam',
  'Hong Kong',
  'Toronto',
  'Chicago',
  'San Francisco',
  'Berlin',
  'Zurich',
  'Geneva',
  'Madrid',
  'Milan',
  'Seoul',
  'Bangkok',
  'Shanghai',
  'Mexico City',
  'Sao Paulo',
  'Lagos',
];

const OPPORTUNITY_TYPES = [
  'missing_hotel',
  'missing_hotel',
  'missing_hotel',
  'partial_coverage',
  'partial_coverage',
  'policy_violation',
  'policy_violation',
  'rate_opportunity',
  'duty_of_care_gap',
];

const LIFECYCLE_STATES = [
  'awaiting_action',
  'awaiting_action',
  'awaiting_action',
  'identified',
  'identified',
  'communication_sent',
  'communication_sent',
  'escalated',
  'closed',
  'rejected',
];

const PRIORITIES = [
  'critical',
  'critical',
  'high',
  'high',
  'high',
  'medium',
  'medium',
  'medium',
  'medium',
  'low',
  'low',
];

const ESCALATION_REASONS = [
  'no_response',
  'departure_imminent',
  'policy_escalation',
  'manual_review',
  'high_value_trip',
];
const ESCALATION_STATUSES = [
  'pending',
  'pending',
  'pending',
  'assigned',
  'assigned',
  'in_progress',
  'resolved',
];
const RISK_LEVELS = ['critical', 'high', 'high', 'medium', 'medium', 'medium', 'low'];

function uuid(seed: number): string {
  const hex = seed.toString(16).padStart(8, '0');
  return `${hex}-e29b-41d4-a716-44665544${hex.slice(0, 4)}`;
}

function randomFrom<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function futureDate(daysFromNow: number): string {
  const d = new Date('2025-07-01');
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
}

function pastDate(daysAgo: number): string {
  const d = new Date('2025-06-01');
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

function commission(seed: number): number {
  const base = [85, 120, 145, 175, 210, 245, 280, 320, 365, 410, 485, 550, 620, 750];
  return base[seed % base.length];
}

export function generateOpportunities(count: number): OpportunityListItem[] {
  const items: OpportunityListItem[] = [];
  for (let i = 1; i <= count; i++) {
    items.push({
      opportunityId: uuid(0x55000000 + i),
      tripId: uuid(0x66000000 + i),
      travellerId: uuid(0x77000000 + i),
      opportunityType: randomFrom(OPPORTUNITY_TYPES, i),
      priority: randomFrom(PRIORITIES, i * 7),
      lifecycleState: randomFrom(LIFECYCLE_STATES, i * 3),
      score: 40 + ((i * 13) % 55),
      departureDate: futureDate(2 + ((i * 3) % 60)),
      destination: randomFrom(DESTINATIONS, i * 11),
      estimatedCommission: commission(i),
      createdAt: pastDate(1 + ((i * 2) % 30)),
    });
  }
  return items;
}

export function generateEscalations(count: number): EscalationListItem[] {
  const items: EscalationListItem[] = [];
  for (let i = 1; i <= count; i++) {
    items.push({
      escalationId: uuid(0xec000000 + i),
      opportunityId: uuid(0x55000000 + i),
      travellerId: uuid(0x77000000 + i),
      reason: randomFrom(ESCALATION_REASONS, i * 5),
      priority: randomFrom(PRIORITIES, i * 3),
      status: randomFrom(ESCALATION_STATUSES, i * 7),
      assignedAgentId: `agent-${String(1 + (i % 8)).padStart(3, '0')}`,
    });
  }
  return items;
}

export function generateApproachingDepartures(count: number): DutyOfCareTrip[] {
  const items: DutyOfCareTrip[] = [];
  for (let i = 1; i <= count; i++) {
    items.push({
      tripId: uuid(0xaa000000 + i),
      travellerId: uuid(0xbb000000 + i),
      destination: randomFrom(DESTINATIONS, i * 13),
      departureDate: futureDate(1 + (i % 7)),
      riskLevel: randomFrom(RISK_LEVELS, i * 5),
    });
  }
  return items;
}

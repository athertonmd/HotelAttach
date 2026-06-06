/**
 * Unit tests for Behaviour Intelligence Event Factories.
 * Tests envelope creation, field preservation, and correlation propagation.
 */

import { describe, it, expect } from 'vitest';
import {
  createBehaviourProfileUpdatedEvent,
  createArchetypeAssignedEvent,
  createBookingAttributedEvent,
  createBehaviourDriftDetectedEvent,
  createFatigueThresholdCrossedEvent,
  createActionRecommendedEvent,
  createCommunicationSuppressedEvent,
  createCommunicationSuppressedByFatigueEvent,
  createPredictionOutcomeRecordedEvent,
} from '../events/behaviour-event-factory.js';

const TENANT = 'tenant-001';
const CORP = 'corp-001';
const TRAVELLER = 'trav-001';
const CORR_ID = 'corr-001';
const TRIGGER_ID = 'evt-trigger-001';
const TRIGGER_TYPE = 'BookingCreated';

describe('BehaviourProfileUpdated factory', () => {
  const payload = {
    travellerId: TRAVELLER,
    tenantId: TENANT,
    corporateId: CORP,
    avgLeadTimeDays: 7,
    bookingConsistency: 0.8,
    bookingVariabilityDays: 2,
    complianceRate: 90,
    avgResponseTimeHours: 4,
    preferredChannel: 'email' as const,
    selfBookingRate: 75,
    tripsAnalysed: 12,
    tripCountUsed: 10,
    predictedLeadTimeDays: 6,
    confidenceScore: 100,
    segment: 'self_sufficient' as const,
    triggeringEventId: TRIGGER_ID,
    triggeringEventType: TRIGGER_TYPE,
    calculatedAt: '2025-01-15T10:00:00Z',
  };

  it('creates a valid event envelope', () => {
    const result = createBehaviourProfileUpdatedEvent(payload);
    expect(result.success).toBe(true);
    expect(result.event).toBeDefined();
    expect(result.event?.eventType).toBe('BehaviourProfileUpdated');
  });

  it('preserves tenantId and corporateId', () => {
    const result = createBehaviourProfileUpdatedEvent(payload);
    expect(result.event?.tenantId).toBe(TENANT);
    expect(result.event?.corporateId).toBe(CORP);
  });

  it('preserves payload fields', () => {
    const result = createBehaviourProfileUpdatedEvent(payload);
    expect(result.event?.payload.travellerId).toBe(TRAVELLER);
    expect(result.event?.payload.confidenceScore).toBe(100);
    expect(result.event?.payload.tripCountUsed).toBe(10);
  });

  it('propagates correlationId from context', () => {
    const result = createBehaviourProfileUpdatedEvent(payload, { correlationId: CORR_ID });
    expect(result.event?.correlationId).toBe(CORR_ID);
  });

  it('generates correlationId when not provided', () => {
    const result = createBehaviourProfileUpdatedEvent(payload);
    expect(result.event?.correlationId).toBeTruthy();
  });

  it('overrides triggeringEventId from context', () => {
    const result = createBehaviourProfileUpdatedEvent(payload, {
      triggeringEventId: 'override-id',
      triggeringEventType: 'PNRCreated',
    });
    expect(result.event?.payload.triggeringEventId).toBe('override-id');
    expect(result.event?.payload.triggeringEventType).toBe('PNRCreated');
  });
});

describe('ArchetypeAssigned factory', () => {
  const payload = {
    travellerId: TRAVELLER,
    tenantId: TENANT,
    corporateId: CORP,
    archetype: 'autopilot' as const,
    confidence: 92,
    triggeringEventId: TRIGGER_ID,
    triggeringEventType: TRIGGER_TYPE,
    assignedAt: '2025-01-15T10:00:00Z',
  };

  it('creates event with correct type', () => {
    const result = createArchetypeAssignedEvent(payload);
    expect(result.success).toBe(true);
    expect(result.event?.eventType).toBe('ArchetypeAssigned');
  });

  it('preserves archetype and confidence', () => {
    const result = createArchetypeAssignedEvent(payload);
    expect(result.event?.payload.archetype).toBe('autopilot');
    expect(result.event?.payload.confidence).toBe(92);
  });
});

describe('BookingAttributed factory', () => {
  const payload = {
    attributionId: 'attr-001',
    bookingId: 'book-001',
    travellerId: TRAVELLER,
    tenantId: TENANT,
    corporateId: CORP,
    attributionType: 'email' as const,
    confidence: 85,
    estimatedCommission: 150,
    triggeringEventId: TRIGGER_ID,
    triggeringEventType: TRIGGER_TYPE,
    attributedAt: '2025-01-15T10:00:00Z',
  };

  it('creates event with correct type', () => {
    const result = createBookingAttributedEvent(payload);
    expect(result.success).toBe(true);
    expect(result.event?.eventType).toBe('BookingAttributed');
  });

  it('preserves attribution fields', () => {
    const result = createBookingAttributedEvent(payload);
    expect(result.event?.payload.attributionType).toBe('email');
    expect(result.event?.payload.estimatedCommission).toBe(150);
  });
});

describe('BehaviourDriftDetected factory', () => {
  const payload = {
    travellerId: TRAVELLER,
    tenantId: TENANT,
    corporateId: CORP,
    driftScore: 45,
    stabilityScore: 55,
    driftStatus: 'moderate' as const,
    previousStatus: 'stable' as const,
    driftDirection: 'declining' as const,
    triggeringEventId: TRIGGER_ID,
    triggeringEventType: TRIGGER_TYPE,
    detectedAt: '2025-01-15T10:00:00Z',
  };

  it('creates event with correct type', () => {
    const result = createBehaviourDriftDetectedEvent(payload);
    expect(result.success).toBe(true);
    expect(result.event?.eventType).toBe('BehaviourDriftDetected');
  });

  it('preserves drift fields', () => {
    const result = createBehaviourDriftDetectedEvent(payload);
    expect(result.event?.payload.driftScore).toBe(45);
    expect(result.event?.payload.driftStatus).toBe('moderate');
    expect(result.event?.payload.driftDirection).toBe('declining');
  });
});

describe('FatigueThresholdCrossed factory', () => {
  const payload = {
    travellerId: TRAVELLER,
    tenantId: TENANT,
    corporateId: CORP,
    fatigueScore: 65,
    fatigueLevel: 'high' as const,
    previousLevel: 'medium' as const,
    direction: 'increasing' as const,
    comms30d: 12,
    ignoredRate: 0.4,
    triggeringEventId: TRIGGER_ID,
    triggeringEventType: TRIGGER_TYPE,
    crossedAt: '2025-01-15T10:00:00Z',
  };

  it('creates event with correct type', () => {
    const result = createFatigueThresholdCrossedEvent(payload);
    expect(result.success).toBe(true);
    expect(result.event?.eventType).toBe('FatigueThresholdCrossed');
  });

  it('preserves fatigue fields', () => {
    const result = createFatigueThresholdCrossedEvent(payload);
    expect(result.event?.payload.fatigueScore).toBe(65);
    expect(result.event?.payload.fatigueLevel).toBe('high');
  });
});

describe('ActionRecommended factory', () => {
  const payload = {
    recommendationId: 'rec-001',
    opportunityId: 'opp-001',
    travellerId: TRAVELLER,
    tenantId: TENANT,
    corporateId: CORP,
    action: 'send_email' as const,
    confidence: 75,
    explanationText: 'Email recommended based on profile.',
    predictedLeadTimeDays: 7,
    daysToDeparture: 8,
    estimatedRevenueAtRisk: 120,
    fatigueLevel: 'low' as const,
    driftStatus: 'stable' as const,
    archetype: 'responsive' as const,
    expiresAt: '2025-01-16T10:00:00Z',
    triggeringEventId: TRIGGER_ID,
    triggeringEventType: TRIGGER_TYPE,
    recommendedAt: '2025-01-15T10:00:00Z',
  };

  it('creates event with correct type', () => {
    const result = createActionRecommendedEvent(payload);
    expect(result.success).toBe(true);
    expect(result.event?.eventType).toBe('ActionRecommended');
  });

  it('preserves action and revenue fields', () => {
    const result = createActionRecommendedEvent(payload);
    expect(result.event?.payload.action).toBe('send_email');
    expect(result.event?.payload.estimatedRevenueAtRisk).toBe(120);
    expect(result.event?.payload.opportunityId).toBe('opp-001');
  });
});

describe('CommunicationSuppressed factory', () => {
  const payload = {
    suppressionId: 'sup-001',
    opportunityId: 'opp-001',
    travellerId: TRAVELLER,
    tenantId: TENANT,
    corporateId: CORP,
    suppressionReason: 'within_predicted_window' as const,
    suppressedChannel: 'email' as const,
    estimatedCostAvoided: 5,
    daysToDeparture: 10,
    triggeringEventId: TRIGGER_ID,
    triggeringEventType: TRIGGER_TYPE,
    suppressedAt: '2025-01-15T10:00:00Z',
  };

  it('creates event with correct type', () => {
    const result = createCommunicationSuppressedEvent(payload);
    expect(result.success).toBe(true);
    expect(result.event?.eventType).toBe('CommunicationSuppressed');
  });

  it('preserves suppression fields', () => {
    const result = createCommunicationSuppressedEvent(payload);
    expect(result.event?.payload.suppressionReason).toBe('within_predicted_window');
    expect(result.event?.payload.estimatedCostAvoided).toBe(5);
  });
});

describe('CommunicationSuppressedByFatigue factory', () => {
  const payload = {
    suppressionId: 'sup-002',
    opportunityId: 'opp-001',
    travellerId: TRAVELLER,
    tenantId: TENANT,
    corporateId: CORP,
    fatigueScore: 82,
    fatigueLevel: 'critical' as const,
    suppressedChannel: 'sms' as const,
    comms30d: 15,
    estimatedCostAvoided: 3,
    triggeringEventId: TRIGGER_ID,
    triggeringEventType: TRIGGER_TYPE,
    suppressedAt: '2025-01-15T10:00:00Z',
  };

  it('creates event with correct type', () => {
    const result = createCommunicationSuppressedByFatigueEvent(payload);
    expect(result.success).toBe(true);
    expect(result.event?.eventType).toBe('CommunicationSuppressedByFatigue');
  });

  it('preserves fatigue suppression fields', () => {
    const result = createCommunicationSuppressedByFatigueEvent(payload);
    expect(result.event?.payload.fatigueScore).toBe(82);
    expect(result.event?.payload.fatigueLevel).toBe('critical');
  });
});

describe('PredictionOutcomeRecorded factory', () => {
  const payload = {
    predictionId: 'pred-001',
    recommendationId: 'rec-001',
    travellerId: TRAVELLER,
    tenantId: TENANT,
    corporateId: CORP,
    opportunityId: 'opp-001',
    recommendedAction: 'send_email' as const,
    actualOutcome: 'booked_after_communication' as const,
    wasCorrect: true,
    daysDifference: 2,
    triggeringEventId: TRIGGER_ID,
    triggeringEventType: TRIGGER_TYPE,
    resolvedAt: '2025-01-15T10:00:00Z',
  };

  it('creates event with correct type', () => {
    const result = createPredictionOutcomeRecordedEvent(payload);
    expect(result.success).toBe(true);
    expect(result.event?.eventType).toBe('PredictionOutcomeRecorded');
  });

  it('preserves prediction outcome fields', () => {
    const result = createPredictionOutcomeRecordedEvent(payload);
    expect(result.event?.payload.wasCorrect).toBe(true);
    expect(result.event?.payload.daysDifference).toBe(2);
    expect(result.event?.payload.actualOutcome).toBe('booked_after_communication');
  });

  it('propagates correlation context', () => {
    const result = createPredictionOutcomeRecordedEvent(payload, {
      correlationId: CORR_ID,
      triggeringEventId: 'new-trigger',
      triggeringEventType: 'OpportunityClosed',
    });
    expect(result.event?.correlationId).toBe(CORR_ID);
    expect(result.event?.payload.triggeringEventId).toBe('new-trigger');
    expect(result.event?.payload.triggeringEventType).toBe('OpportunityClosed');
  });
});

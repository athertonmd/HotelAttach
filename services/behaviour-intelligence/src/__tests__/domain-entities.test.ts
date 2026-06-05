/**
 * Unit tests for Behaviour Intelligence domain entities.
 * Tests validation, business rules, and invariants.
 * Business Rules: BR-1201–BR-1899
 */

import { describe, it, expect } from 'vitest';
import {
  createProfile,
  determineArchetype,
  createAttribution,
  calculateDrift,
  calculateFatigue,
  applyDecay,
  applyEvent,
  calculateRevenueAtRisk,
  determineAction,
  evaluateOutcome,
  deriveRiskTier,
  deriveFatigueLevel,
  deriveDriftStatus,
  ATTRIBUTION_WINDOWS,
} from '../domain/index.js';
import type {
  TravellerBehaviourProfile,
  CommunicationFatigue,
  BehaviourDrift,
  HistoricalBaseline,
  CreateProfileInput,
} from '../domain/index.js';

// --- Test Helpers ---

const TENANT = 'tenant-001';
const CORP = 'corp-001';
const TRAVELLER = 'trav-001';

function validProfileInput(overrides: Partial<CreateProfileInput> = {}): CreateProfileInput {
  return {
    travellerId: TRAVELLER,
    tenantId: TENANT,
    corporateId: CORP,
    avgLeadTimeDays: 7,
    bookingConsistency: 0.75,
    bookingVariabilityDays: 3,
    complianceRate: 80,
    avgResponseTimeHours: 6,
    preferredChannel: 'email',
    selfBookingRate: 65,
    tripsAnalysed: 12,
    tripCountUsed: 10,
    predictedLeadTimeDays: 6,
    segment: 'reliable_late',
    ...overrides,
  };
}

function buildProfile(overrides: Partial<CreateProfileInput> = {}): TravellerBehaviourProfile {
  return createProfile(validProfileInput(overrides));
}

function buildFatigue(overrides: Partial<CommunicationFatigue> = {}): CommunicationFatigue {
  return {
    travellerId: TRAVELLER,
    tenantId: TENANT,
    corporateId: CORP,
    fatigueScore: 30,
    fatigueLevel: 'low',
    comms30d: 3,
    ignoredRate: 0.1,
    lastUpdated: new Date(),
    ...overrides,
  };
}

function buildDrift(overrides: Partial<BehaviourDrift> = {}): BehaviourDrift {
  return {
    travellerId: TRAVELLER,
    tenantId: TENANT,
    corporateId: CORP,
    driftScore: 15,
    stabilityScore: 85,
    driftStatus: 'stable',
    driftDirection: 'lateral',
    detectedAt: new Date(),
    ...overrides,
  };
}

function buildBaseline(overrides: Partial<HistoricalBaseline> = {}): HistoricalBaseline {
  return {
    avgLeadTimeDays: 7,
    bookingConsistency: 0.75,
    complianceRate: 80,
    selfBookingRate: 65,
    avgResponseTimeHours: 6,
    ...overrides,
  };
}

// ============================================================
// TravellerBehaviourProfile
// ============================================================

describe('TravellerBehaviourProfile', () => {
  it('creates a valid profile with computed confidence', () => {
    const profile = createProfile(validProfileInput());
    expect(profile.travellerId).toBe(TRAVELLER);
    expect(profile.tenantId).toBe(TENANT);
    expect(profile.corporateId).toBe(CORP);
    expect(profile.confidenceScore).toBe(100); // 10 trips = full confidence
    expect(profile.segment).toBe('reliable_late');
  });

  it('BR-1201: rejects tripCountUsed < 1', () => {
    expect(() => createProfile(validProfileInput({ tripCountUsed: 0 }))).toThrow('BR-1201');
  });

  it('rejects tripsAnalysed < 1', () => {
    expect(() => createProfile(validProfileInput({ tripsAnalysed: 0 }))).toThrow(
      'tripsAnalysed must be at least 1',
    );
  });

  it('rejects empty travellerId', () => {
    expect(() => createProfile(validProfileInput({ travellerId: '' }))).toThrow(
      'travellerId is required',
    );
  });

  it('rejects empty tenantId', () => {
    expect(() => createProfile(validProfileInput({ tenantId: '' }))).toThrow(
      'tenantId is required',
    );
  });

  it('rejects empty corporateId', () => {
    expect(() => createProfile(validProfileInput({ corporateId: '' }))).toThrow(
      'corporateId is required',
    );
  });

  it('BR-1204: clamps bookingConsistency to 0–1', () => {
    const over = createProfile(validProfileInput({ bookingConsistency: 1.5 }));
    expect(over.bookingConsistency).toBe(1);
    const under = createProfile(validProfileInput({ bookingConsistency: -0.5 }));
    expect(under.bookingConsistency).toBe(0);
  });

  it('clamps complianceRate to 0–100', () => {
    const over = createProfile(validProfileInput({ complianceRate: 150 }));
    expect(over.complianceRate).toBe(100);
    const under = createProfile(validProfileInput({ complianceRate: -10 }));
    expect(under.complianceRate).toBe(0);
  });

  it('clamps selfBookingRate to 0–100', () => {
    const over = createProfile(validProfileInput({ selfBookingRate: 120 }));
    expect(over.selfBookingRate).toBe(100);
  });

  it('BR-1207: confidence clamped 0–100', () => {
    const profile = createProfile(validProfileInput({ tripCountUsed: 1 }));
    expect(profile.confidenceScore).toBeGreaterThanOrEqual(0);
    expect(profile.confidenceScore).toBeLessThanOrEqual(100);
  });

  it('BR-1208: full confidence at 10+ trips', () => {
    const profile10 = createProfile(validProfileInput({ tripCountUsed: 10 }));
    expect(profile10.confidenceScore).toBe(100);
    const profile15 = createProfile(validProfileInput({ tripCountUsed: 15 }));
    expect(profile15.confidenceScore).toBe(100);
  });

  it('BR-1208: partial confidence below 10 trips', () => {
    const profile5 = createProfile(validProfileInput({ tripCountUsed: 5 }));
    expect(profile5.confidenceScore).toBe(50);
    const profile3 = createProfile(validProfileInput({ tripCountUsed: 3 }));
    expect(profile3.confidenceScore).toBe(30);
  });
});

// ============================================================
// TravellerArchetype
// ============================================================

describe('TravellerArchetype', () => {
  it('BR-1301: requires minimum 3 trips', () => {
    const profile = buildProfile({ tripCountUsed: 2 });
    expect(() => determineArchetype(profile, null)).toThrow('BR-1301');
  });

  it('BR-1308: assigns new_traveller for < 5 trips', () => {
    const profile = buildProfile({ tripCountUsed: 4 });
    const result = determineArchetype(profile, null);
    expect(result.archetype).toBe('new_traveller');
    expect(result.confidence).toBe(50);
  });

  it('BR-1302: assigns autopilot for high consistency, high self-booking, fast response', () => {
    const profile = buildProfile({
      tripCountUsed: 10,
      bookingConsistency: 0.92,
      selfBookingRate: 90,
      avgResponseTimeHours: 2,
    });
    const result = determineArchetype(profile, null);
    expect(result.archetype).toBe('autopilot');
  });

  it('BR-1307: assigns chaotic for high variability and low consistency', () => {
    const profile = buildProfile({
      tripCountUsed: 10,
      bookingVariabilityDays: 15,
      bookingConsistency: 0.2,
    });
    const result = determineArchetype(profile, null);
    expect(result.archetype).toBe('chaotic');
  });

  it('BR-1306: assigns reluctant for low compliance, low self-booking, high response time', () => {
    const profile = buildProfile({
      tripCountUsed: 10,
      complianceRate: 30,
      selfBookingRate: 15,
      avgResponseTimeHours: 48,
      bookingVariabilityDays: 5,
      bookingConsistency: 0.5,
    });
    const result = determineArchetype(profile, null);
    expect(result.archetype).toBe('reluctant');
  });

  it('BR-1303: assigns procrastinator for late bookers with moderate consistency', () => {
    const profile = buildProfile({
      tripCountUsed: 10,
      avgLeadTimeDays: 2,
      bookingConsistency: 0.5,
      bookingVariabilityDays: 5,
      complianceRate: 60,
      selfBookingRate: 50,
      avgResponseTimeHours: 10,
    });
    const result = determineArchetype(profile, null);
    expect(result.archetype).toBe('procrastinator');
  });

  it('BR-1304: assigns responsive for low variance, fast response, moderate self-booking', () => {
    const profile = buildProfile({
      tripCountUsed: 10,
      bookingVariabilityDays: 2,
      avgResponseTimeHours: 3,
      selfBookingRate: 60,
      bookingConsistency: 0.6,
      avgLeadTimeDays: 7,
      complianceRate: 70,
    });
    const result = determineArchetype(profile, null);
    expect(result.archetype).toBe('responsive');
  });

  it('BR-1305: assigns nudge_needer for moderate consistency and self-booking', () => {
    const profile = buildProfile({
      tripCountUsed: 10,
      bookingConsistency: 0.55,
      selfBookingRate: 45,
      bookingVariabilityDays: 5,
      avgLeadTimeDays: 7,
      avgResponseTimeHours: 10,
      complianceRate: 70,
    });
    const result = determineArchetype(profile, null);
    expect(result.archetype).toBe('nudge_needer');
  });

  it('preserves previousArchetype in result', () => {
    const profile = buildProfile({ tripCountUsed: 4 });
    const result = determineArchetype(profile, 'autopilot');
    expect(result.previousArchetype).toBe('autopilot');
  });
});

// ============================================================
// BookingAttribution
// ============================================================

describe('BookingAttribution', () => {
  it('creates a valid attribution', () => {
    const attr = createAttribution({
      bookingId: 'book-001',
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      attributionType: 'email',
      hoursFromCommunication: 12,
      estimatedCommission: 150,
    });
    expect(attr.attributionId).toBeTruthy();
    expect(attr.bookingId).toBe('book-001');
    expect(attr.attributionType).toBe('email');
    expect(attr.confidence).toBeGreaterThan(0);
    expect(attr.attributionWindowHours).toBe(72); // email = 72h
  });

  it('rejects empty bookingId', () => {
    expect(() =>
      createAttribution({
        bookingId: '',
        travellerId: TRAVELLER,
        tenantId: TENANT,
        corporateId: CORP,
        attributionType: 'email',
        estimatedCommission: 100,
      }),
    ).toThrow('bookingId is required');
  });

  it('rejects negative estimatedCommission', () => {
    expect(() =>
      createAttribution({
        bookingId: 'book-001',
        travellerId: TRAVELLER,
        tenantId: TENANT,
        corporateId: CORP,
        attributionType: 'email',
        estimatedCommission: -10,
      }),
    ).toThrow('estimatedCommission must be >= 0');
  });

  it('BR-1401: independent attribution has 95% confidence', () => {
    const attr = createAttribution({
      bookingId: 'book-001',
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      attributionType: 'independent',
      estimatedCommission: 200,
    });
    expect(attr.confidence).toBe(95);
  });

  it('BR-1403: confidence decreases with time from communication', () => {
    const early = createAttribution({
      bookingId: 'book-001',
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      attributionType: 'email',
      hoursFromCommunication: 5,
      estimatedCommission: 100,
    });
    const late = createAttribution({
      bookingId: 'book-002',
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      attributionType: 'email',
      hoursFromCommunication: 60,
      estimatedCommission: 100,
    });
    expect(early.confidence).toBeGreaterThan(late.confidence);
  });

  it('BR-1410: confidence floor of 30% within window', () => {
    const attr = createAttribution({
      bookingId: 'book-001',
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      attributionType: 'email',
      hoursFromCommunication: 71, // near end of 72h window
      estimatedCommission: 100,
    });
    expect(attr.confidence).toBeGreaterThanOrEqual(30);
  });

  it('BR-1409: unknown type gets low confidence', () => {
    const attr = createAttribution({
      bookingId: 'book-001',
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      attributionType: 'unknown',
      estimatedCommission: 100,
    });
    expect(attr.confidence).toBe(20);
  });

  it('BR-1404–1408: attribution window matches channel', () => {
    expect(ATTRIBUTION_WINDOWS['email']).toBe(72);
    expect(ATTRIBUTION_WINDOWS['sms']).toBe(24);
    expect(ATTRIBUTION_WINDOWS['push_notification']).toBe(12);
    expect(ATTRIBUTION_WINDOWS['in_app']).toBe(48);
    expect(ATTRIBUTION_WINDOWS['agent_intervention']).toBe(24);
  });

  it('sets opportunityId and communicationId when provided', () => {
    const attr = createAttribution({
      bookingId: 'book-001',
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      attributionType: 'sms',
      opportunityId: 'opp-001',
      communicationId: 'comm-001',
      hoursFromCommunication: 2,
      estimatedCommission: 100,
    });
    expect(attr.opportunityId).toBe('opp-001');
    expect(attr.communicationId).toBe('comm-001');
  });
});

// ============================================================
// BehaviourDrift
// ============================================================

describe('BehaviourDrift', () => {
  it('BR-1508: requires minimum 3 trips', () => {
    const profile = buildProfile({ tripCountUsed: 2 });
    expect(() => calculateDrift(profile, buildBaseline())).toThrow('BR-1508');
  });

  it('BR-1503: stable when drift score < 30', () => {
    const profile = buildProfile(); // matches baseline
    const drift = calculateDrift(profile, buildBaseline());
    expect(drift.driftStatus).toBe('stable');
    expect(drift.driftScore).toBeLessThan(30);
  });

  it('BR-1504: moderate when drift score 30–59', () => {
    const profile = buildProfile({
      avgLeadTimeDays: 14, // doubled from baseline of 7
      bookingConsistency: 0.4, // dropped from 0.75
    });
    const drift = calculateDrift(profile, buildBaseline());
    expect(drift.driftStatus).toBe('moderate');
  });

  it('BR-1505: significant when drift score >= 60', () => {
    const profile = buildProfile({
      avgLeadTimeDays: 30,
      bookingConsistency: 0.1,
      complianceRate: 20,
      selfBookingRate: 10,
      avgResponseTimeHours: 48,
    });
    const drift = calculateDrift(profile, buildBaseline());
    expect(drift.driftStatus).toBe('significant');
    expect(drift.driftScore).toBeGreaterThanOrEqual(60);
  });

  it('BR-1502: stabilityScore is 100 - driftScore', () => {
    const profile = buildProfile();
    const drift = calculateDrift(profile, buildBaseline());
    expect(drift.stabilityScore).toBe(100 - drift.driftScore);
  });

  it('BR-1506: direction is improving when metrics improve', () => {
    const profile = buildProfile({
      complianceRate: 95, // up from 80
      bookingConsistency: 0.85, // up from 0.75
      selfBookingRate: 80, // up from 65
      avgResponseTimeHours: 2, // down from 6
    });
    const drift = calculateDrift(profile, buildBaseline());
    expect(drift.driftDirection).toBe('improving');
  });

  it('BR-1506: direction is declining when metrics worsen', () => {
    const profile = buildProfile({
      complianceRate: 40, // down from 80
      bookingConsistency: 0.3, // down from 0.75
      selfBookingRate: 20, // down from 65
      avgResponseTimeHours: 24, // up from 6
    });
    const drift = calculateDrift(profile, buildBaseline());
    expect(drift.driftDirection).toBe('declining');
  });

  it('BR-1506: direction is lateral when signals are mixed', () => {
    const profile = buildProfile({
      complianceRate: 90, // up
      bookingConsistency: 0.6, // down
      selfBookingRate: 65, // same
      avgResponseTimeHours: 6, // same
    });
    const drift = calculateDrift(profile, buildBaseline());
    expect(drift.driftDirection).toBe('lateral');
  });
});

// ============================================================
// CommunicationFatigue
// ============================================================

describe('CommunicationFatigue', () => {
  it('calculates fatigue from scratch', () => {
    const fatigue = calculateFatigue({
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      comms30d: 5,
      ignoredCount: 2,
      declinedCount: 0,
      positiveResponses: 1,
      independentBookings: 0,
      daysSinceLastComm: 3,
    });
    // Base: 5*2 = 10, +2*8 = 16, -1*10 = -10 → total = 16
    expect(fatigue.fatigueScore).toBe(16);
    expect(fatigue.fatigueLevel).toBe('low');
  });

  it('rejects empty travellerId', () => {
    expect(() =>
      calculateFatigue({
        travellerId: '',
        tenantId: TENANT,
        corporateId: CORP,
        comms30d: 1,
        ignoredCount: 0,
        declinedCount: 0,
        positiveResponses: 0,
        independentBookings: 0,
        daysSinceLastComm: 0,
      }),
    ).toThrow('travellerId is required');
  });

  it('BR-1602: +8 per ignored communication', () => {
    const base = calculateFatigue({
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      comms30d: 2,
      ignoredCount: 0,
      declinedCount: 0,
      positiveResponses: 0,
      independentBookings: 0,
      daysSinceLastComm: 0,
    });
    const withIgnored = calculateFatigue({
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      comms30d: 2,
      ignoredCount: 1,
      declinedCount: 0,
      positiveResponses: 0,
      independentBookings: 0,
      daysSinceLastComm: 0,
    });
    expect(withIgnored.fatigueScore - base.fatigueScore).toBe(8);
  });

  it('BR-1603: +12 per declined communication', () => {
    const base = calculateFatigue({
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      comms30d: 2,
      ignoredCount: 0,
      declinedCount: 0,
      positiveResponses: 0,
      independentBookings: 0,
      daysSinceLastComm: 0,
    });
    const withDeclined = calculateFatigue({
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      comms30d: 2,
      ignoredCount: 0,
      declinedCount: 1,
      positiveResponses: 0,
      independentBookings: 0,
      daysSinceLastComm: 0,
    });
    expect(withDeclined.fatigueScore - base.fatigueScore).toBe(12);
  });

  it('BR-1604: -10 per positive response', () => {
    const fatigue = calculateFatigue({
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      comms30d: 5,
      ignoredCount: 3,
      declinedCount: 0,
      positiveResponses: 2,
      independentBookings: 0,
      daysSinceLastComm: 0,
    });
    // Base: 10, +24, -20 = 14
    expect(fatigue.fatigueScore).toBe(14);
  });

  it('BR-1605: -15 per independent booking', () => {
    const fatigue = calculateFatigue({
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      comms30d: 5,
      ignoredCount: 3,
      declinedCount: 0,
      positiveResponses: 0,
      independentBookings: 2,
      daysSinceLastComm: 0,
    });
    // Base: 10, +24, -30 = 4
    expect(fatigue.fatigueScore).toBe(4);
  });

  it('BR-1606: decay of -5 after 14 days no communication', () => {
    const recent = calculateFatigue({
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      comms30d: 5,
      ignoredCount: 2,
      declinedCount: 0,
      positiveResponses: 0,
      independentBookings: 0,
      daysSinceLastComm: 10,
    });
    const stale = calculateFatigue({
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      comms30d: 5,
      ignoredCount: 2,
      declinedCount: 0,
      positiveResponses: 0,
      independentBookings: 0,
      daysSinceLastComm: 14,
    });
    expect(stale.fatigueScore).toBe(recent.fatigueScore - 5);
  });

  it('BR-1607/BR-1611: score clamped 0–100', () => {
    const low = calculateFatigue({
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      comms30d: 1,
      ignoredCount: 0,
      declinedCount: 0,
      positiveResponses: 5,
      independentBookings: 5,
      daysSinceLastComm: 30,
    });
    expect(low.fatigueScore).toBe(0);

    const high = calculateFatigue({
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      comms30d: 20,
      ignoredCount: 10,
      declinedCount: 5,
      positiveResponses: 0,
      independentBookings: 0,
      daysSinceLastComm: 0,
    });
    expect(high.fatigueScore).toBe(100);
  });

  it('BR-1608: derives correct fatigue levels', () => {
    expect(deriveFatigueLevel(0)).toBe('low');
    expect(deriveFatigueLevel(39)).toBe('low');
    expect(deriveFatigueLevel(40)).toBe('medium');
    expect(deriveFatigueLevel(59)).toBe('medium');
    expect(deriveFatigueLevel(60)).toBe('high');
    expect(deriveFatigueLevel(79)).toBe('high');
    expect(deriveFatigueLevel(80)).toBe('critical');
    expect(deriveFatigueLevel(100)).toBe('critical');
  });

  it('BR-1610: ignored rate calculated correctly', () => {
    const fatigue = calculateFatigue({
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      comms30d: 10,
      ignoredCount: 3,
      declinedCount: 0,
      positiveResponses: 0,
      independentBookings: 0,
      daysSinceLastComm: 0,
    });
    expect(fatigue.ignoredRate).toBe(0.3);
  });

  it('applyDecay reduces score by 5', () => {
    const initial = buildFatigue({ fatigueScore: 50, fatigueLevel: 'medium' });
    const decayed = applyDecay(initial);
    expect(decayed.fatigueScore).toBe(45);
    expect(decayed.fatigueLevel).toBe('medium');
  });

  it('applyDecay does not go below 0', () => {
    const initial = buildFatigue({ fatigueScore: 3, fatigueLevel: 'low' });
    const decayed = applyDecay(initial);
    expect(decayed.fatigueScore).toBe(0);
  });

  it('applyEvent: ignored adds 8', () => {
    const initial = buildFatigue({ fatigueScore: 30, fatigueLevel: 'low' });
    const result = applyEvent(initial, 'ignored');
    expect(result.fatigueScore).toBe(38);
  });

  it('applyEvent: declined adds 12', () => {
    const initial = buildFatigue({ fatigueScore: 30, fatigueLevel: 'low' });
    const result = applyEvent(initial, 'declined');
    expect(result.fatigueScore).toBe(42);
    expect(result.fatigueLevel).toBe('medium');
  });

  it('applyEvent: positive_response subtracts 10', () => {
    const initial = buildFatigue({ fatigueScore: 50, fatigueLevel: 'medium' });
    const result = applyEvent(initial, 'positive_response');
    expect(result.fatigueScore).toBe(40);
    expect(result.fatigueLevel).toBe('medium');
  });

  it('applyEvent: independent_booking subtracts 15', () => {
    const initial = buildFatigue({ fatigueScore: 50, fatigueLevel: 'medium' });
    const result = applyEvent(initial, 'independent_booking');
    expect(result.fatigueScore).toBe(35);
    expect(result.fatigueLevel).toBe('low');
  });
});

// ============================================================
// RevenueAtRisk
// ============================================================

describe('RevenueAtRisk', () => {
  it('BR-1701: calculates revenue at risk correctly', () => {
    const result = calculateRevenueAtRisk({
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      estimatedCommission: 200,
      attachmentLikelihood: 60,
    });
    // 200 * (1 - 0.60) = 80
    expect(result.revenueAtRisk).toBe(80);
    expect(result.riskTier).toBe('uncertain');
  });

  it('BR-1707: rejects negative commission', () => {
    expect(() =>
      calculateRevenueAtRisk({
        travellerId: TRAVELLER,
        tenantId: TENANT,
        corporateId: CORP,
        estimatedCommission: -50,
        attachmentLikelihood: 50,
      }),
    ).toThrow('BR-1707');
  });

  it('BR-1708: clamps attachment likelihood to 0–100', () => {
    const over = calculateRevenueAtRisk({
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      estimatedCommission: 100,
      attachmentLikelihood: 150,
    });
    expect(over.revenueAtRisk).toBe(0); // 100% = no risk
    expect(over.riskTier).toBe('secure');

    const under = calculateRevenueAtRisk({
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      estimatedCommission: 100,
      attachmentLikelihood: -20,
    });
    expect(under.revenueAtRisk).toBe(100); // 0% = full risk
    expect(under.riskTier).toBe('critical');
  });

  it('BR-1702–1706: derives correct risk tiers', () => {
    expect(deriveRiskTier(95)).toBe('secure');
    expect(deriveRiskTier(75)).toBe('likely');
    expect(deriveRiskTier(50)).toBe('uncertain');
    expect(deriveRiskTier(30)).toBe('at_risk');
    expect(deriveRiskTier(10)).toBe('critical');
  });

  it('rejects empty travellerId', () => {
    expect(() =>
      calculateRevenueAtRisk({
        travellerId: '',
        tenantId: TENANT,
        corporateId: CORP,
        estimatedCommission: 100,
        attachmentLikelihood: 50,
      }),
    ).toThrow('travellerId is required');
  });

  it('zero commission results in zero revenue at risk', () => {
    const result = calculateRevenueAtRisk({
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      estimatedCommission: 0,
      attachmentLikelihood: 30,
    });
    expect(result.revenueAtRisk).toBe(0);
  });
});

// ============================================================
// RecommendedAction
// ============================================================

describe('RecommendedAction', () => {
  it('BR-1803: escalates when fatigue is critical and departure < 3 days', () => {
    const profile = buildProfile({ segment: 'needs_prompting' });
    const fatigue = buildFatigue({ fatigueScore: 85, fatigueLevel: 'critical' });
    const drift = buildDrift({ driftStatus: 'stable' });
    const result = determineAction({
      profile,
      fatigue,
      drift,
      daysToDeparture: 2,
      predictedLeadTimeDays: 5,
    });
    expect(result.action).toBe('escalate');
  });

  it('BR-1808: escalates when drift is significant and departure < 5 days', () => {
    const profile = buildProfile({ segment: 'needs_prompting' });
    const fatigue = buildFatigue({ fatigueScore: 30, fatigueLevel: 'low' });
    const drift = buildDrift({ driftStatus: 'significant', driftScore: 70 });
    const result = determineAction({
      profile,
      fatigue,
      drift,
      daysToDeparture: 3,
      predictedLeadTimeDays: 5,
    });
    expect(result.action).toBe('escalate');
  });

  it('BR-1801: do_nothing if self-sufficient and within predicted window', () => {
    const profile = buildProfile({ segment: 'self_sufficient' });
    const fatigue = buildFatigue({ fatigueScore: 10, fatigueLevel: 'low' });
    const drift = buildDrift({ driftStatus: 'stable' });
    const result = determineAction({
      profile,
      fatigue,
      drift,
      daysToDeparture: 10,
      predictedLeadTimeDays: 7,
    });
    expect(result.action).toBe('do_nothing');
  });

  it('BR-1804: suppresses when fatigue is high', () => {
    const profile = buildProfile({ segment: 'needs_prompting' });
    const fatigue = buildFatigue({ fatigueScore: 65, fatigueLevel: 'high' });
    const drift = buildDrift({ driftStatus: 'stable' });
    const result = determineAction({
      profile,
      fatigue,
      drift,
      daysToDeparture: 10,
      predictedLeadTimeDays: 7,
    });
    expect(result.action).toBe('do_nothing');
  });

  it('BR-1802: wait if well outside predicted window', () => {
    const profile = buildProfile({ segment: 'needs_prompting' });
    const fatigue = buildFatigue({ fatigueScore: 20, fatigueLevel: 'low' });
    const drift = buildDrift({ driftStatus: 'stable' });
    const result = determineAction({
      profile,
      fatigue,
      drift,
      daysToDeparture: 20,
      predictedLeadTimeDays: 7,
    });
    expect(result.action).toBe('wait');
  });

  it('BR-1806: send_sms if departure < 5 days and low fatigue', () => {
    const profile = buildProfile({ segment: 'needs_prompting' });
    const fatigue = buildFatigue({ fatigueScore: 15, fatigueLevel: 'low' });
    const drift = buildDrift({ driftStatus: 'stable' });
    const result = determineAction({
      profile,
      fatigue,
      drift,
      daysToDeparture: 4,
      predictedLeadTimeDays: 5,
    });
    expect(result.action).toBe('send_sms');
  });

  it('BR-1807: send_push for nudge_needer within window', () => {
    const profile = buildProfile({ segment: 'needs_prompting' });
    const fatigue = buildFatigue({ fatigueScore: 20, fatigueLevel: 'low' });
    const drift = buildDrift({ driftStatus: 'stable' });
    const result = determineAction({
      profile,
      fatigue,
      drift,
      daysToDeparture: 6,
      predictedLeadTimeDays: 5,
      archetype: 'nudge_needer',
    });
    expect(result.action).toBe('send_push');
  });

  it('BR-1805: send_email for responsive archetype', () => {
    const profile = buildProfile({ segment: 'needs_prompting' });
    const fatigue = buildFatigue({ fatigueScore: 20, fatigueLevel: 'low' });
    const drift = buildDrift({ driftStatus: 'stable' });
    const result = determineAction({
      profile,
      fatigue,
      drift,
      daysToDeparture: 8,
      predictedLeadTimeDays: 7,
      archetype: 'responsive',
    });
    expect(result.action).toBe('send_email');
  });

  it('BR-1809: confidence adjusted by profile confidence', () => {
    const lowConfProfile = buildProfile({ tripCountUsed: 3 }); // 30% confidence
    const fatigue = buildFatigue({ fatigueScore: 85, fatigueLevel: 'critical' });
    const drift = buildDrift({ driftStatus: 'stable' });
    const result = determineAction({
      profile: lowConfProfile,
      fatigue,
      drift,
      daysToDeparture: 2,
      predictedLeadTimeDays: 5,
    });
    // Base confidence 85, adjusted by 0.3 → ~26
    expect(result.confidence).toBeLessThan(85);
  });

  it('BR-1810: explanationText is always present', () => {
    const profile = buildProfile();
    const fatigue = buildFatigue();
    const drift = buildDrift();
    const result = determineAction({
      profile,
      fatigue,
      drift,
      daysToDeparture: 10,
      predictedLeadTimeDays: 7,
    });
    expect(result.explanationText).toBeTruthy();
    expect(result.explanationText.length).toBeGreaterThan(10);
  });
});

// ============================================================
// PredictionOutcome
// ============================================================

describe('PredictionOutcome', () => {
  it('creates a valid prediction outcome', () => {
    const outcome = evaluateOutcome({
      recommendationId: 'rec-001',
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      opportunityId: 'opp-001',
      recommendedAction: 'send_email',
      actualOutcome: 'booked_after_communication',
      daysDifference: 2,
    });
    expect(outcome.predictionId).toBeTruthy();
    expect(outcome.wasCorrect).toBe(true);
    expect(outcome.daysDifference).toBe(2);
  });

  it('rejects empty recommendationId', () => {
    expect(() =>
      evaluateOutcome({
        recommendationId: '',
        travellerId: TRAVELLER,
        tenantId: TENANT,
        corporateId: CORP,
        opportunityId: 'opp-001',
        recommendedAction: 'send_email',
        actualOutcome: 'booked_after_communication',
        daysDifference: 0,
      }),
    ).toThrow('recommendationId is required');
  });

  it('rejects empty opportunityId', () => {
    expect(() =>
      evaluateOutcome({
        recommendationId: 'rec-001',
        travellerId: TRAVELLER,
        tenantId: TENANT,
        corporateId: CORP,
        opportunityId: '',
        recommendedAction: 'send_email',
        actualOutcome: 'booked_after_communication',
        daysDifference: 0,
      }),
    ).toThrow('opportunityId is required');
  });

  it('do_nothing is correct when booked independently', () => {
    const outcome = evaluateOutcome({
      recommendationId: 'rec-001',
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      opportunityId: 'opp-001',
      recommendedAction: 'do_nothing',
      actualOutcome: 'booked_independently',
      daysDifference: 0,
    });
    expect(outcome.wasCorrect).toBe(true);
  });

  it('do_nothing is correct when cancelled', () => {
    const outcome = evaluateOutcome({
      recommendationId: 'rec-001',
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      opportunityId: 'opp-001',
      recommendedAction: 'do_nothing',
      actualOutcome: 'cancelled',
      daysDifference: 0,
    });
    expect(outcome.wasCorrect).toBe(true);
  });

  it('do_nothing is incorrect when expired unbooked', () => {
    const outcome = evaluateOutcome({
      recommendationId: 'rec-001',
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      opportunityId: 'opp-001',
      recommendedAction: 'do_nothing',
      actualOutcome: 'expired_unbooked',
      daysDifference: 5,
    });
    expect(outcome.wasCorrect).toBe(false);
  });

  it('send_email is correct when booked after communication', () => {
    const outcome = evaluateOutcome({
      recommendationId: 'rec-001',
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      opportunityId: 'opp-001',
      recommendedAction: 'send_email',
      actualOutcome: 'booked_after_communication',
      daysDifference: 1,
    });
    expect(outcome.wasCorrect).toBe(true);
  });

  it('send_email is incorrect when booked independently', () => {
    const outcome = evaluateOutcome({
      recommendationId: 'rec-001',
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      opportunityId: 'opp-001',
      recommendedAction: 'send_email',
      actualOutcome: 'booked_independently',
      daysDifference: 0,
    });
    expect(outcome.wasCorrect).toBe(false);
  });

  it('escalate is correct when booked after escalation', () => {
    const outcome = evaluateOutcome({
      recommendationId: 'rec-001',
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      opportunityId: 'opp-001',
      recommendedAction: 'escalate',
      actualOutcome: 'booked_after_escalation',
      daysDifference: 3,
    });
    expect(outcome.wasCorrect).toBe(true);
  });

  it('escalate is incorrect when expired unbooked', () => {
    const outcome = evaluateOutcome({
      recommendationId: 'rec-001',
      travellerId: TRAVELLER,
      tenantId: TENANT,
      corporateId: CORP,
      opportunityId: 'opp-001',
      recommendedAction: 'escalate',
      actualOutcome: 'expired_unbooked',
      daysDifference: 10,
    });
    expect(outcome.wasCorrect).toBe(false);
  });
});

// ============================================================
// Enum Derivation Functions
// ============================================================

describe('Enum Derivation Functions', () => {
  it('deriveDriftStatus boundaries', () => {
    expect(deriveDriftStatus(0)).toBe('stable');
    expect(deriveDriftStatus(29)).toBe('stable');
    expect(deriveDriftStatus(30)).toBe('moderate');
    expect(deriveDriftStatus(59)).toBe('moderate');
    expect(deriveDriftStatus(60)).toBe('significant');
    expect(deriveDriftStatus(100)).toBe('significant');
  });

  it('deriveRiskTier boundaries', () => {
    expect(deriveRiskTier(91)).toBe('secure');
    expect(deriveRiskTier(90)).toBe('likely');
    expect(deriveRiskTier(70)).toBe('likely');
    expect(deriveRiskTier(69)).toBe('uncertain');
    expect(deriveRiskTier(40)).toBe('uncertain');
    expect(deriveRiskTier(39)).toBe('at_risk');
    expect(deriveRiskTier(20)).toBe('at_risk');
    expect(deriveRiskTier(19)).toBe('critical');
    expect(deriveRiskTier(0)).toBe('critical');
  });

  it('deriveFatigueLevel boundaries', () => {
    expect(deriveFatigueLevel(0)).toBe('low');
    expect(deriveFatigueLevel(39)).toBe('low');
    expect(deriveFatigueLevel(40)).toBe('medium');
    expect(deriveFatigueLevel(59)).toBe('medium');
    expect(deriveFatigueLevel(60)).toBe('high');
    expect(deriveFatigueLevel(79)).toBe('high');
    expect(deriveFatigueLevel(80)).toBe('critical');
    expect(deriveFatigueLevel(100)).toBe('critical');
  });
});

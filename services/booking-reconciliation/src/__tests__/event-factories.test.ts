import { describe, it, expect } from 'vitest';
import {
  createHotelMatchedEvent,
  createHotelRejectedEvent,
  createHotelCoverageUpdatedEvent,
  createHotelOrphanDetectedEvent,
} from '../events/reconciliation-event-factory.js';
import { HotelBooking } from '../domain/hotel-booking.js';
import { CoverageAssessment } from '../domain/coverage-assessment.js';
import type { ReconciliationResult } from '../domain/reconciliation-decision.js';

const TENANT = 'tenant-001';
const CORR = 'corr-abc-123';

function matchedResult(): ReconciliationResult {
  return {
    tenantId: TENANT,
    bookingId: 'b-001',
    travellerId: 'trav-001',
    candidateTripId: 'trip-001',
    confidenceScore: 95,
    confidenceBand: 'matched',
    matchStatus: 'matched',
    matchReasons: [
      {
        ruleId: 'BR-201',
        ruleName: 'Exact Traveller Match',
        reasonCode: 'TRAVELLER_MATCH',
        score: 50,
      },
      { ruleId: 'BR-206', ruleName: 'Date Overlap', reasonCode: 'DATE_OVERLAP', score: 25 },
    ],
    ruleIdsApplied: ['BR-201', 'BR-206'],
    auditExplanation: 'Matched',
    rejectionReason: null,
    decidedAt: new Date('2026-06-01T10:00:00Z'),
  };
}

function rejectedResult(): ReconciliationResult {
  return {
    tenantId: TENANT,
    bookingId: 'b-002',
    travellerId: 'trav-002',
    candidateTripId: 'trip-002',
    confidenceScore: 25,
    confidenceBand: 'rejected',
    matchStatus: 'rejected',
    matchReasons: [
      { ruleId: 'BR-205', ruleName: 'Country Match', reasonCode: 'COUNTRY_MATCH', score: 10 },
    ],
    ruleIdsApplied: ['BR-205'],
    auditExplanation: 'Rejected',
    rejectionReason: 'LOW_CONFIDENCE',
    decidedAt: new Date('2026-06-01T10:00:00Z'),
  };
}

function orphanedResult(): ReconciliationResult {
  return {
    tenantId: TENANT,
    bookingId: 'b-003',
    travellerId: 'trav-003',
    candidateTripId: null,
    confidenceScore: 0,
    confidenceBand: 'rejected',
    matchStatus: 'unmatched',
    matchReasons: [],
    ruleIdsApplied: [],
    auditExplanation: 'Orphan',
    rejectionReason: null,
    decidedAt: new Date('2026-06-01T10:00:00Z'),
  };
}

function candidateResult(): ReconciliationResult {
  return {
    tenantId: TENANT,
    bookingId: 'b-004',
    travellerId: 'trav-004',
    candidateTripId: 'trip-004',
    confidenceScore: 65,
    confidenceBand: 'candidate',
    matchStatus: 'candidate',
    matchReasons: [
      {
        ruleId: 'BR-201',
        ruleName: 'Exact Traveller Match',
        reasonCode: 'TRAVELLER_MATCH',
        score: 50,
      },
    ],
    ruleIdsApplied: ['BR-201'],
    auditExplanation: 'Candidate',
    rejectionReason: null,
    decidedAt: new Date('2026-06-01T10:00:00Z'),
  };
}

describe('HotelMatched event factory', () => {
  it('should create event from matched result', () => {
    const r = createHotelMatchedEvent(matchedResult(), { correlationId: CORR });
    expect(r.success).toBe(true);
    expect(r.event?.eventType).toBe('HotelMatched');
    expect(r.event?.payload.confidence).toBe(95);
    expect(r.event?.payload.reasonCodes).toContain('TRAVELLER_MATCH');
    expect(r.event?.payload.tenantId).toBe(TENANT);
  });

  it('should preserve correlationId', () => {
    const r = createHotelMatchedEvent(matchedResult(), { correlationId: CORR });
    expect(r.event?.correlationId).toBe(CORR);
  });

  it('should reject non-matched result', () => {
    const r = createHotelMatchedEvent(rejectedResult());
    expect(r.success).toBe(false);
    expect(r.error).toContain('non-matched');
  });
});

describe('HotelRejected event factory', () => {
  it('should create event from rejected result', () => {
    const r = createHotelRejectedEvent(rejectedResult(), { correlationId: CORR });
    expect(r.success).toBe(true);
    expect(r.event?.eventType).toBe('HotelRejected');
    expect(r.event?.payload.reason).toBe('LOW_CONFIDENCE');
    expect(r.event?.payload.highestConfidence).toBe(25);
    expect(r.event?.payload.tenantId).toBe(TENANT);
  });

  it('should reject non-rejected result', () => {
    const r = createHotelRejectedEvent(matchedResult());
    expect(r.success).toBe(false);
  });
});

describe('HotelOrphanDetected event factory', () => {
  it('should create event from orphaned booking', () => {
    const booking = HotelBooking.create({
      tenantId: TENANT,
      bookingId: 'b-003',
      travellerId: 'trav-003',
      bookingVersion: 1,
      hotelName: 'Le Marais',
      city: 'Paris',
      country: 'FR',
      checkinDate: new Date('2026-06-15'),
      checkoutDate: new Date('2026-06-18'),
      bookingDate: new Date('2026-06-01'),
      roomNights: 3,
      status: 'confirmed',
    });
    const detected = new Date('2026-06-01T10:00:00Z');
    const deadline = new Date('2026-07-01T10:00:00Z');

    const r = createHotelOrphanDetectedEvent(booking, detected, deadline, { correlationId: CORR });
    expect(r.success).toBe(true);
    expect(r.event?.eventType).toBe('HotelOrphanDetected');
    expect(r.event?.payload.hotelName).toBe('Le Marais');
    expect(r.event?.payload.tenantId).toBe(TENANT);
    expect(r.event?.correlationId).toBe(CORR);
  });
});

describe('HotelCoverageUpdated event factory', () => {
  it('should create event from coverage assessment', () => {
    const assessment = CoverageAssessment.create({
      tenantId: TENANT,
      tripId: 'trip-001',
      totalNightsRequired: 5,
      nightsCovered: 4,
      matchedBookingIds: ['b-001'],
      previousCoveragePercent: 0,
    });

    const r = createHotelCoverageUpdatedEvent(assessment, { correlationId: CORR });
    expect(r.success).toBe(true);
    expect(r.event?.eventType).toBe('HotelCoverageUpdated');
    expect(r.event?.payload.coveragePercent).toBe(80);
    expect(r.event?.payload.coverageStatus).toBe('mostly_covered');
    expect(r.event?.payload.tenantId).toBe(TENANT);
    expect(r.event?.correlationId).toBe(CORR);
  });
});

describe('No event for candidate/manual-review', () => {
  it('HotelMatched rejects candidate result', () => {
    const r = createHotelMatchedEvent(candidateResult());
    expect(r.success).toBe(false);
  });

  it('HotelRejected rejects candidate result', () => {
    const r = createHotelRejectedEvent(candidateResult());
    expect(r.success).toBe(false);
  });
});

describe('tenantId in envelope and payload', () => {
  it('HotelMatched has tenantId in both', () => {
    const r = createHotelMatchedEvent(matchedResult());
    expect(r.event?.tenantId).toBe(TENANT);
    expect(r.event?.payload.tenantId).toBe(TENANT);
  });
});

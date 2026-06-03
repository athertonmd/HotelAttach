import { describe, it, expect } from 'vitest';
import { DateRange, ConfidenceScore } from '../domain/value-objects.js';
import type { MatchReason, ReconciliationAuditExplanation } from '../domain/types.js';
import type { MatchStatus, MatchConfidenceBand, CoverageStatus } from '../domain/enums.js';

describe('DateRange', () => {
  it('should create a valid date range', () => {
    const range = new DateRange(new Date('2026-06-15'), new Date('2026-06-19'));
    expect(range.start).toEqual(new Date('2026-06-15'));
    expect(range.end).toEqual(new Date('2026-06-19'));
  });

  it('should reject end before start', () => {
    expect(() => new DateRange(new Date('2026-06-19'), new Date('2026-06-15'))).toThrow(
      'end must be after start',
    );
  });

  it('should reject equal start and end', () => {
    const d = new Date('2026-06-15');
    expect(() => new DateRange(d, d)).toThrow('end must be after start');
  });

  it('should calculate nights', () => {
    const range = new DateRange(new Date('2026-06-15'), new Date('2026-06-19'));
    expect(range.nights).toBe(4);
  });

  it('should detect overlap', () => {
    const a = new DateRange(new Date('2026-06-15'), new Date('2026-06-19'));
    const b = new DateRange(new Date('2026-06-17'), new Date('2026-06-21'));
    expect(a.overlaps(b)).toBe(true);
  });

  it('should detect non-overlap', () => {
    const a = new DateRange(new Date('2026-06-15'), new Date('2026-06-17'));
    const b = new DateRange(new Date('2026-06-18'), new Date('2026-06-20'));
    expect(a.overlaps(b)).toBe(false);
  });

  it('should calculate overlap nights', () => {
    const a = new DateRange(new Date('2026-06-15'), new Date('2026-06-19'));
    const b = new DateRange(new Date('2026-06-17'), new Date('2026-06-21'));
    expect(a.overlapNights(b)).toBe(2);
  });
});

describe('ConfidenceScore', () => {
  it('should create a valid score', () => {
    const score = new ConfidenceScore(75);
    expect(score.value).toBe(75);
  });

  it('should reject score below 0', () => {
    expect(() => new ConfidenceScore(-1)).toThrow('must be between 0 and 100');
  });

  it('should reject score above 100', () => {
    expect(() => new ConfidenceScore(101)).toThrow('must be between 0 and 100');
  });

  it('should add points capped at 100', () => {
    const score = new ConfidenceScore(90);
    expect(score.add(20).value).toBe(100);
  });

  it('should round to integer', () => {
    const score = new ConfidenceScore(75.6);
    expect(score.value).toBe(76);
  });
});

describe('Enum availability', () => {
  it('MatchStatus values exist', () => {
    const statuses: MatchStatus[] = [
      'unmatched',
      'candidate',
      'matched',
      'verified',
      'rejected',
      'expired',
      'cancelled',
    ];
    expect(statuses).toHaveLength(7);
  });

  it('MatchConfidenceBand values exist', () => {
    const bands: MatchConfidenceBand[] = ['matched', 'candidate', 'rejected'];
    expect(bands).toHaveLength(3);
  });

  it('CoverageStatus values exist', () => {
    const statuses: CoverageStatus[] = [
      'fully_covered',
      'mostly_covered',
      'partially_covered',
      'minimally_covered',
      'no_accommodation',
    ];
    expect(statuses).toHaveLength(5);
  });
});

describe('Domain interfaces', () => {
  it('MatchReason supports ruleId', () => {
    const reason: MatchReason = {
      ruleId: 'BR-201',
      ruleName: 'Exact Traveller Match',
      reasonCode: 'TRAVELLER_MATCH',
      score: 50,
    };
    expect(reason.ruleId).toBe('BR-201');
  });

  it('ReconciliationAuditExplanation includes tenantId and ruleIds', () => {
    const audit: ReconciliationAuditExplanation = {
      tenantId: 'tenant-001',
      bookingId: 'booking-001',
      travellerId: 'trav-001',
      candidateTripId: 'trip-001',
      confidence: 85,
      confidenceBand: 'matched',
      matchStatus: 'matched',
      matchReasons: [
        {
          ruleId: 'BR-201',
          ruleName: 'Exact Traveller Match',
          reasonCode: 'TRAVELLER_MATCH',
          score: 50,
        },
      ],
      ruleIdsApplied: ['BR-201'],
      explanation: 'Matched via BR-201 (Exact Traveller Match)',
      decidedAt: new Date(),
    };
    expect(audit.tenantId).toBe('tenant-001');
    expect(audit.ruleIdsApplied).toContain('BR-201');
    expect(audit.matchReasons[0]?.ruleId).toBe('BR-201');
  });
});

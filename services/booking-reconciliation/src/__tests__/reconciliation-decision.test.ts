import { describe, it, expect } from 'vitest';
import { ReconciliationDecisionService } from '../domain/reconciliation-decision.js';
import { HotelBooking } from '../domain/hotel-booking.js';
import { ReconciliationCandidate } from '../domain/reconciliation-candidate.js';

const TENANT = 'tenant-001';

function makeBooking(overrides = {}) {
  return HotelBooking.create({
    tenantId: TENANT,
    bookingId: 'b-001',
    travellerId: 'trav-001',
    bookingVersion: 1,
    hotelName: 'Marriott',
    city: 'New York',
    country: 'US',
    checkinDate: new Date('2026-06-15'),
    checkoutDate: new Date('2026-06-19'),
    bookingDate: new Date('2026-06-01'),
    roomNights: 4,
    status: 'confirmed',
    employeeNumber: 'EMP-100',
    email: 'jane@corp.com',
    ...overrides,
  });
}

function makeCandidate(overrides = {}) {
  return ReconciliationCandidate.create({
    tenantId: TENANT,
    bookingId: 'b-001',
    travellerId: 'trav-001',
    candidateTripId: 'trip-001',
    tripStartDate: new Date('2026-06-14'),
    tripEndDate: new Date('2026-06-20'),
    tripDestinationCity: 'New York',
    tripDestinationCountry: 'US',
    candidateSource: 'booking_created',
    ...overrides,
  });
}

const service = new ReconciliationDecisionService();

describe('ReconciliationDecisionService', () => {
  it('no candidates gives orphaned result', () => {
    const result = service.evaluate(makeBooking(), []);
    expect(result.matchStatus).toBe('unmatched');
    expect(result.candidateTripId).toBeNull();
    expect(result.confidenceScore).toBe(0);
    expect(result.auditExplanation).toContain('orphan');
  });

  it('high confidence candidate gives matched result', () => {
    const result = service.evaluate(makeBooking(), [makeCandidate()], {
      travellerEmployeeNumber: 'EMP-100',
      travellerEmail: 'jane@corp.com',
      tripCreatedDate: new Date('2026-06-01'),
    });
    expect(result.matchStatus).toBe('matched');
    expect(result.confidenceBand).toBe('matched');
    expect(result.confidenceScore).toBeGreaterThanOrEqual(80);
    expect(result.candidateTripId).toBe('trip-001');
  });

  it('60-79 confidence gives candidate result', () => {
    // Traveller match (+50) + country match (+10) = 60
    const result = service.evaluate(
      makeBooking({
        city: 'Boston',
        country: 'US',
        email: null,
        employeeNumber: null,
        checkinDate: new Date('2026-01-10'),
        checkoutDate: new Date('2026-01-12'),
        roomNights: 2,
      }),
      [
        makeCandidate({
          tripDestinationCity: 'Chicago',
          tripDestinationCountry: 'US',
          tripStartDate: new Date('2026-06-14'),
          tripEndDate: new Date('2026-06-20'),
        }),
      ],
    );
    expect(result.matchStatus).toBe('candidate');
    expect(result.confidenceBand).toBe('candidate');
    expect(result.confidenceScore).toBeGreaterThanOrEqual(60);
    expect(result.confidenceScore).toBeLessThan(80);
  });

  it('<60 confidence gives rejected result', () => {
    // Only country match (+10) — different traveller, no other matches
    const result = service.evaluate(
      makeBooking({ city: 'Boston', email: null, employeeNumber: null }),
      [makeCandidate({ travellerId: 'trav-other', tripDestinationCity: 'Chicago' })],
    );
    expect(result.matchStatus).toBe('rejected');
    expect(result.confidenceBand).toBe('rejected');
    expect(result.confidenceScore).toBeLessThan(60);
    expect(result.rejectionReason).toBe('LOW_CONFIDENCE');
  });

  it('no matching rules gives rejected with zero score', () => {
    const result = service.evaluate(
      makeBooking({ city: 'London', country: 'UK', email: null, employeeNumber: null }),
      [
        makeCandidate({
          travellerId: 'trav-other',
          tripDestinationCity: 'Tokyo',
          tripDestinationCountry: 'JP',
          tripStartDate: new Date('2026-01-01'),
          tripEndDate: new Date('2026-01-05'),
        }),
      ],
    );
    expect(result.confidenceScore).toBe(0);
    expect(result.matchStatus).toBe('rejected');
  });

  it('highest scoring candidate selected', () => {
    const weakCandidate = makeCandidate({
      candidateTripId: 'trip-weak',
      travellerId: 'trav-other',
      tripDestinationCity: 'Chicago',
      tripDestinationCountry: 'JP',
      tripStartDate: new Date('2026-01-01'),
      tripEndDate: new Date('2026-01-05'),
    });
    const strongCandidate = makeCandidate({ candidateTripId: 'trip-strong' });

    const result = service.evaluate(makeBooking(), [weakCandidate, strongCandidate], {
      travellerEmployeeNumber: 'EMP-100',
      travellerEmail: 'jane@corp.com',
    });
    expect(result.candidateTripId).toBe('trip-strong');
  });

  it('confidence capped at 100', () => {
    // All rules fire: 50+40+30+15+10+25+20+10 = 200 → capped at 100
    const result = service.evaluate(makeBooking(), [makeCandidate()], {
      travellerEmployeeNumber: 'EMP-100',
      travellerEmail: 'jane@corp.com',
      tripCreatedDate: new Date('2026-06-01'),
    });
    expect(result.confidenceScore).toBeLessThanOrEqual(100);
  });

  it('ruleIdsApplied contains all applied rules', () => {
    const result = service.evaluate(makeBooking(), [makeCandidate()], {
      travellerEmployeeNumber: 'EMP-100',
      travellerEmail: 'jane@corp.com',
    });
    expect(result.ruleIdsApplied.length).toBeGreaterThan(0);
    for (const id of result.ruleIdsApplied) {
      expect(id).toMatch(/^BR-\d+$/);
    }
  });

  it('audit explanation contains key fields', () => {
    const result = service.evaluate(makeBooking(), [makeCandidate()]);
    expect(result.auditExplanation).toContain('trip-001');
    expect(result.auditExplanation.length).toBeGreaterThan(0);
  });

  it('tenantId preserved', () => {
    const result = service.evaluate(makeBooking({ tenantId: 'tenant-xyz' }), []);
    expect(result.tenantId).toBe('tenant-xyz');
  });

  it('rejectionReason set for rejected result', () => {
    const result = service.evaluate(
      makeBooking({ city: 'X', country: 'Y', email: null, employeeNumber: null }),
      [
        makeCandidate({
          travellerId: 'other',
          tripDestinationCity: 'A',
          tripDestinationCountry: 'B',
          tripStartDate: new Date('2026-01-01'),
          tripEndDate: new Date('2026-01-02'),
        }),
      ],
    );
    expect(result.rejectionReason).toBe('LOW_CONFIDENCE');
  });

  it('candidateTripId null for orphaned', () => {
    const result = service.evaluate(makeBooking(), []);
    expect(result.candidateTripId).toBeNull();
  });

  it('candidateTripId set for matched/candidate/rejected with candidates', () => {
    const result = service.evaluate(makeBooking(), [makeCandidate()]);
    expect(result.candidateTripId).toBe('trip-001');
  });
});

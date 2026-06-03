import { describe, it, expect } from 'vitest';
import { evaluateTravellerMatch } from '../domain/matching/traveller-match.js';
import { evaluateDestinationMatch } from '../domain/matching/destination-match.js';
import { evaluateDateMatch } from '../domain/matching/date-match.js';
import { evaluateBookingProximity } from '../domain/matching/booking-proximity.js';
import { DateRange } from '../domain/value-objects.js';

describe('BR-201: Exact Traveller Match', () => {
  it('should return +50 for matching traveller IDs', () => {
    const reasons = evaluateTravellerMatch({
      bookingTravellerId: 'trav-001',
      tripTravellerId: 'trav-001',
      bookingEmployeeNumber: null,
      tripEmployeeNumber: null,
      bookingEmail: null,
      tripEmail: null,
    });
    expect(reasons).toHaveLength(1);
    expect(reasons[0]?.ruleId).toBe('BR-201');
    expect(reasons[0]?.score).toBe(50);
  });

  it('should not match different traveller IDs', () => {
    const reasons = evaluateTravellerMatch({
      bookingTravellerId: 'trav-001',
      tripTravellerId: 'trav-002',
      bookingEmployeeNumber: null,
      tripEmployeeNumber: null,
      bookingEmail: null,
      tripEmail: null,
    });
    expect(reasons).toHaveLength(0);
  });
});

describe('BR-202: Employee Number Match', () => {
  it('should return +40 for matching employee numbers', () => {
    const reasons = evaluateTravellerMatch({
      bookingTravellerId: 'a',
      tripTravellerId: 'b',
      bookingEmployeeNumber: 'EMP-100',
      tripEmployeeNumber: 'EMP-100',
      bookingEmail: null,
      tripEmail: null,
    });
    const empMatch = reasons.find((r) => r.ruleId === 'BR-202');
    expect(empMatch?.score).toBe(40);
  });

  it('should not match when employee number is null', () => {
    const reasons = evaluateTravellerMatch({
      bookingTravellerId: 'a',
      tripTravellerId: 'b',
      bookingEmployeeNumber: null,
      tripEmployeeNumber: 'EMP-100',
      bookingEmail: null,
      tripEmail: null,
    });
    expect(reasons.find((r) => r.ruleId === 'BR-202')).toBeUndefined();
  });
});

describe('BR-203: Email Match', () => {
  it('should return +30 for matching emails (case-insensitive)', () => {
    const reasons = evaluateTravellerMatch({
      bookingTravellerId: 'a',
      tripTravellerId: 'b',
      bookingEmployeeNumber: null,
      tripEmployeeNumber: null,
      bookingEmail: 'Jane@Corp.com',
      tripEmail: 'jane@corp.com',
    });
    const emailMatch = reasons.find((r) => r.ruleId === 'BR-203');
    expect(emailMatch?.score).toBe(30);
  });

  it('should not match when email is null', () => {
    const reasons = evaluateTravellerMatch({
      bookingTravellerId: 'a',
      tripTravellerId: 'b',
      bookingEmployeeNumber: null,
      tripEmployeeNumber: null,
      bookingEmail: null,
      tripEmail: 'jane@corp.com',
    });
    expect(reasons.find((r) => r.ruleId === 'BR-203')).toBeUndefined();
  });
});

describe('BR-204: Destination City Match', () => {
  it('should return +15 for matching cities (case-insensitive)', () => {
    const reasons = evaluateDestinationMatch({
      hotelCity: 'new york',
      tripDestinationCity: 'New York',
      hotelCountry: 'US',
      tripDestinationCountry: 'UK',
    });
    const cityMatch = reasons.find((r) => r.ruleId === 'BR-204');
    expect(cityMatch?.score).toBe(15);
  });
});

describe('BR-205: Country Match', () => {
  it('should return +10 for matching countries (case-insensitive)', () => {
    const reasons = evaluateDestinationMatch({
      hotelCity: 'Paris',
      tripDestinationCity: 'Lyon',
      hotelCountry: 'fr',
      tripDestinationCountry: 'FR',
    });
    const countryMatch = reasons.find((r) => r.ruleId === 'BR-205');
    expect(countryMatch?.score).toBe(10);
  });
});

describe('BR-206: Date Overlap', () => {
  it('should return +25 when hotel dates overlap trip dates', () => {
    const reasons = evaluateDateMatch({
      hotelStayRange: new DateRange(new Date('2026-06-15'), new Date('2026-06-19')),
      tripRange: new DateRange(new Date('2026-06-14'), new Date('2026-06-20')),
    });
    const dateMatch = reasons.find((r) => r.ruleId === 'BR-206');
    expect(dateMatch?.score).toBe(25);
  });

  it('should not match when dates do not overlap', () => {
    const reasons = evaluateDateMatch({
      hotelStayRange: new DateRange(new Date('2026-06-01'), new Date('2026-06-05')),
      tripRange: new DateRange(new Date('2026-06-10'), new Date('2026-06-15')),
    });
    expect(reasons).toHaveLength(0);
  });
});

describe('BR-207: Full Night Coverage', () => {
  it('should return +20 when hotel covers entire trip', () => {
    const reasons = evaluateDateMatch({
      hotelStayRange: new DateRange(new Date('2026-06-14'), new Date('2026-06-21')),
      tripRange: new DateRange(new Date('2026-06-15'), new Date('2026-06-19')),
    });
    const coverage = reasons.find((r) => r.ruleId === 'BR-207');
    expect(coverage?.score).toBe(20);
  });

  it('should not return +20 when hotel only partially covers trip', () => {
    const reasons = evaluateDateMatch({
      hotelStayRange: new DateRange(new Date('2026-06-16'), new Date('2026-06-18')),
      tripRange: new DateRange(new Date('2026-06-15'), new Date('2026-06-20')),
    });
    const coverage = reasons.find((r) => r.ruleId === 'BR-207');
    expect(coverage).toBeUndefined();
  });
});

describe('BR-208: Booking Proximity', () => {
  it('should return +10 when booked within 30 days of trip creation', () => {
    const reasons = evaluateBookingProximity({
      hotelBookingDate: new Date('2026-06-05'),
      tripCreatedDate: new Date('2026-06-01'),
    });
    expect(reasons[0]?.ruleId).toBe('BR-208');
    expect(reasons[0]?.score).toBe(10);
  });

  it('should not match when booked more than 30 days from trip creation', () => {
    const reasons = evaluateBookingProximity({
      hotelBookingDate: new Date('2026-08-15'),
      tripCreatedDate: new Date('2026-06-01'),
    });
    expect(reasons).toHaveLength(0);
  });
});

describe('Combined matching', () => {
  it('should return multiple reasons when multiple rules match', () => {
    const travellerReasons = evaluateTravellerMatch({
      bookingTravellerId: 'trav-001',
      tripTravellerId: 'trav-001',
      bookingEmployeeNumber: 'EMP-100',
      tripEmployeeNumber: 'EMP-100',
      bookingEmail: 'jane@corp.com',
      tripEmail: 'jane@corp.com',
    });
    // All 3 traveller rules should fire
    expect(travellerReasons).toHaveLength(3);
    expect(travellerReasons.every((r) => r.ruleId.startsWith('BR-'))).toBe(true);
  });

  it('every reason has a ruleId', () => {
    const all = [
      ...evaluateTravellerMatch({
        bookingTravellerId: 't',
        tripTravellerId: 't',
        bookingEmployeeNumber: 'E',
        tripEmployeeNumber: 'E',
        bookingEmail: 'x@y.com',
        tripEmail: 'x@y.com',
      }),
      ...evaluateDestinationMatch({
        hotelCity: 'NYC',
        tripDestinationCity: 'NYC',
        hotelCountry: 'US',
        tripDestinationCountry: 'US',
      }),
      ...evaluateDateMatch({
        hotelStayRange: new DateRange(new Date('2026-06-14'), new Date('2026-06-21')),
        tripRange: new DateRange(new Date('2026-06-15'), new Date('2026-06-19')),
      }),
      ...evaluateBookingProximity({
        hotelBookingDate: new Date('2026-06-02'),
        tripCreatedDate: new Date('2026-06-01'),
      }),
    ];
    for (const reason of all) {
      expect(reason.ruleId).toMatch(/^BR-\d+$/);
      expect(reason.score).toBeGreaterThan(0);
    }
  });
});

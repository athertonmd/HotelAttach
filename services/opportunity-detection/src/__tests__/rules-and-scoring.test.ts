/**
 * Unit tests for detection rules, scoring engine, and stub providers.
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateMissingHotel,
  evaluatePartialAccommodation,
  evaluateNonPreferredSupplier,
  evaluateSupplierLeakage,
  evaluateDutyOfCareGap,
  evaluateSupplierContractRisk,
  calculateScore,
  calculateTimeToDepartureScore,
  calculateHotelRequirementConfidence,
  calculateDutyOfCareScore,
  calculateSupplierContractScore,
  calculateRevenueScore,
  getDefaultPolicyData,
  getDefaultSupplierContractData,
  getDefaultDestinationRiskData,
  estimateRevenue,
} from '../domain/rules/index.js';
import type { DetectionRuleContext } from '../domain/rules/types.js';

const BASE_CTX: DetectionRuleContext = {
  tenantId: 'tenant-1',
  corporateId: 'corp-1',
  travellerId: 'trav-1',
  tripId: 'trip-1',
};

describe('Detection Rules', () => {
  describe('BR-501 Missing Hotel', () => {
    it('triggers when hotel required and coverage is 0%', () => {
      const result = evaluateMissingHotel({
        ...BASE_CTX,
        tripDurationHours: 48,
        isMultiDay: true,
        coveragePercent: 0,
        coverageStatus: 'no_accommodation',
      });
      expect(result.triggered).toBe(true);
      expect(result.opportunityType).toBe('missing_hotel');
      expect(result.ruleIds).toContain('BR-501');
      expect(result.ruleIds).toContain('BR-102');
    });

    it('does not trigger for same-day return', () => {
      const result = evaluateMissingHotel({
        ...BASE_CTX,
        tripDurationHours: 8,
        isMultiDay: false,
        coveragePercent: 0,
      });
      expect(result.triggered).toBe(false);
    });

    it('does not trigger when coverage > 0', () => {
      const result = evaluateMissingHotel({
        ...BASE_CTX,
        tripDurationHours: 48,
        isMultiDay: true,
        coveragePercent: 50,
      });
      expect(result.triggered).toBe(false);
    });

    it('does not trigger when active orphan exists', () => {
      const result = evaluateMissingHotel({
        ...BASE_CTX,
        tripDurationHours: 48,
        isMultiDay: true,
        coveragePercent: 0,
        hasActiveOrphan: true,
      });
      expect(result.triggered).toBe(false);
    });
  });

  describe('BR-502 Partial Accommodation', () => {
    it('triggers when coverage is between 1-99%', () => {
      const result = evaluatePartialAccommodation({
        ...BASE_CTX,
        coveragePercent: 60,
      });
      expect(result.triggered).toBe(true);
      expect(result.opportunityType).toBe('partial_coverage');
      expect(result.ruleIds).toContain('BR-502');
    });

    it('does not trigger at 0%', () => {
      const result = evaluatePartialAccommodation({ ...BASE_CTX, coveragePercent: 0 });
      expect(result.triggered).toBe(false);
    });

    it('does not trigger at 100%', () => {
      const result = evaluatePartialAccommodation({ ...BASE_CTX, coveragePercent: 100 });
      expect(result.triggered).toBe(false);
    });

    it('does not trigger with active orphan', () => {
      const result = evaluatePartialAccommodation({
        ...BASE_CTX,
        coveragePercent: 50,
        hasActiveOrphan: true,
      });
      expect(result.triggered).toBe(false);
    });
  });

  describe('BR-503 Non-Preferred Supplier', () => {
    it('triggers when supplier is not preferred', () => {
      const result = evaluateNonPreferredSupplier({
        ...BASE_CTX,
        isPreferredSupplier: false,
      });
      expect(result.triggered).toBe(true);
      expect(result.opportunityType).toBe('out_of_policy');
      expect(result.ruleIds).toContain('BR-503');
      expect(result.ruleIds).toContain('BR-401');
    });

    it('does not trigger when preferred', () => {
      const result = evaluateNonPreferredSupplier({
        ...BASE_CTX,
        isPreferredSupplier: true,
      });
      expect(result.triggered).toBe(false);
    });
  });

  describe('BR-504 Supplier Leakage', () => {
    it('triggers when not managed channel', () => {
      const result = evaluateSupplierLeakage({ ...BASE_CTX, isManagedChannel: false });
      expect(result.triggered).toBe(true);
      expect(result.opportunityType).toBe('direct_booked');
      expect(result.ruleIds).toContain('BR-504');
    });

    it('does not trigger for managed channel', () => {
      const result = evaluateSupplierLeakage({ ...BASE_CTX, isManagedChannel: true });
      expect(result.triggered).toBe(false);
    });
  });

  describe('BR-505 Duty of Care Gap', () => {
    it('triggers when hotel required and accommodation unknown', () => {
      const result = evaluateDutyOfCareGap({
        ...BASE_CTX,
        tripDurationHours: 48,
        isMultiDay: true,
        accommodationUnknown: true,
      });
      expect(result.triggered).toBe(true);
      expect(result.opportunityType).toBe('duty_of_care_gap');
      expect(result.ruleIds).toContain('BR-505');
      expect(result.ruleIds).toContain('BR-703');
    });

    it('does not trigger when accommodation is known', () => {
      const result = evaluateDutyOfCareGap({
        ...BASE_CTX,
        tripDurationHours: 48,
        isMultiDay: true,
        accommodationUnknown: false,
      });
      expect(result.triggered).toBe(false);
    });
  });

  describe('BR-506 Supplier Contract Risk', () => {
    it('triggers when forecast below commitment', () => {
      const result = evaluateSupplierContractRisk({
        ...BASE_CTX,
        supplierForecastBelow: true,
      });
      expect(result.triggered).toBe(true);
      expect(result.opportunityType).toBe('preferred_supplier');
      expect(result.ruleIds).toContain('BR-506');
      expect(result.ruleIds).toContain('BR-801');
    });

    it('does not trigger when on track', () => {
      const result = evaluateSupplierContractRisk({
        ...BASE_CTX,
        supplierForecastBelow: false,
      });
      expect(result.triggered).toBe(false);
    });
  });
});

describe('Scoring Engine', () => {
  describe('calculateScore', () => {
    it('calculates weighted score correctly', () => {
      const result = calculateScore({
        hotelRequirementConfidence: 90,
        complianceSeverity: 60,
        revenueOpportunity: 80,
        dutyOfCareImpact: 40,
        supplierContractImpact: 0,
        timeToDeparture: 100,
      });
      // 90*0.25 + 60*0.2 + 80*0.2 + 40*0.15 + 0*0.1 + 100*0.1 = 22.5+12+16+6+0+10 = 66.5 → 67
      expect(result.totalScore).toBe(67);
      expect(result.priority).toBe('high');
    });

    it('caps total score at 100', () => {
      const result = calculateScore({
        hotelRequirementConfidence: 100,
        complianceSeverity: 100,
        revenueOpportunity: 100,
        dutyOfCareImpact: 100,
        supplierContractImpact: 100,
        timeToDeparture: 100,
      });
      expect(result.totalScore).toBe(100);
    });

    it('below minimum threshold is not eligible', () => {
      const result = calculateScore({
        hotelRequirementConfidence: 10,
        complianceSeverity: 0,
        revenueOpportunity: 0,
        dutyOfCareImpact: 0,
        supplierContractImpact: 0,
        timeToDeparture: 0,
      });
      // 10*0.25 = 2.5 → 3
      expect(result.totalScore).toBeLessThan(20);
      expect(result.eligible).toBe(false);
    });

    it('score 20-39 is eligible but not engagement eligible', () => {
      const result = calculateScore({
        hotelRequirementConfidence: 100,
        complianceSeverity: 0,
        revenueOpportunity: 0,
        dutyOfCareImpact: 0,
        supplierContractImpact: 0,
        timeToDeparture: 0,
      });
      // 100*0.25 = 25
      expect(result.totalScore).toBe(25);
      expect(result.eligible).toBe(true);
      expect(result.engagementEligible).toBe(false);
      expect(result.priority).toBe('low');
    });

    it('score >= 40 is engagement eligible', () => {
      const result = calculateScore({
        hotelRequirementConfidence: 80,
        complianceSeverity: 50,
        revenueOpportunity: 50,
        dutyOfCareImpact: 0,
        supplierContractImpact: 0,
        timeToDeparture: 0,
      });
      // 80*0.25 + 50*0.2 + 50*0.2 = 20+10+10 = 40
      expect(result.totalScore).toBe(40);
      expect(result.engagementEligible).toBe(true);
    });

    it('applies corporate compliance multiplier', () => {
      const baseResult = calculateScore({
        hotelRequirementConfidence: 50,
        complianceSeverity: 60,
        revenueOpportunity: 0,
        dutyOfCareImpact: 0,
        supplierContractImpact: 0,
        timeToDeparture: 0,
      });
      const multipliedResult = calculateScore(
        {
          hotelRequirementConfidence: 50,
          complianceSeverity: 60,
          revenueOpportunity: 0,
          dutyOfCareImpact: 0,
          supplierContractImpact: 0,
          timeToDeparture: 0,
        },
        { complianceSeverityMultiplier: 2.0 },
      );
      expect(multipliedResult.totalScore).toBeGreaterThan(baseResult.totalScore);
    });

    it('multiplier caps component at 100', () => {
      const result = calculateScore(
        {
          hotelRequirementConfidence: 0,
          complianceSeverity: 80,
          revenueOpportunity: 0,
          dutyOfCareImpact: 0,
          supplierContractImpact: 0,
          timeToDeparture: 0,
        },
        { complianceSeverityMultiplier: 2.0 },
      );
      // 80 * 2.0 = 160 → capped at 100 → 100 * 0.2 = 20
      expect(result.totalScore).toBe(20);
    });

    it('zero multiplier eliminates component', () => {
      const result = calculateScore(
        {
          hotelRequirementConfidence: 50,
          complianceSeverity: 100,
          revenueOpportunity: 0,
          dutyOfCareImpact: 0,
          supplierContractImpact: 0,
          timeToDeparture: 0,
        },
        { complianceSeverityMultiplier: 0 },
      );
      // 50*0.25 + 0 = 13 (rounded)
      expect(result.totalScore).toBe(13);
    });
  });

  describe('calculateTimeToDepartureScore', () => {
    it('≤2 days = 100 (BR-906)', () => {
      expect(calculateTimeToDepartureScore(1)).toBe(100);
      expect(calculateTimeToDepartureScore(2)).toBe(100);
    });
    it('3-7 days = 80', () => {
      expect(calculateTimeToDepartureScore(5)).toBe(80);
    });
    it('8-14 days = 60', () => {
      expect(calculateTimeToDepartureScore(10)).toBe(60);
    });
    it('15-30 days = 40', () => {
      expect(calculateTimeToDepartureScore(20)).toBe(40);
    });
    it('>30 days = 20', () => {
      expect(calculateTimeToDepartureScore(45)).toBe(20);
    });
  });

  describe('calculateHotelRequirementConfidence', () => {
    it('same-day return = 0', () => {
      expect(calculateHotelRequirementConfidence({ tripDurationHours: 8, isMultiDay: false })).toBe(
        0,
      );
    });
    it('international multi-day = 95', () => {
      expect(calculateHotelRequirementConfidence({ isInternational: true, isMultiDay: true })).toBe(
        95,
      );
    });
    it('>24 hours = 90', () => {
      expect(calculateHotelRequirementConfidence({ tripDurationHours: 36 })).toBe(90);
    });
    it('late arrival = 75', () => {
      expect(calculateHotelRequirementConfidence({ arrivalHour: 23 })).toBe(75);
    });
  });

  describe('calculateDutyOfCareScore', () => {
    it('unknown accommodation = 80', () => {
      expect(calculateDutyOfCareScore('unknown')).toBe(80);
    });
    it('partial = 40', () => {
      expect(calculateDutyOfCareScore('partial')).toBe(40);
    });
    it('known = 0', () => {
      expect(calculateDutyOfCareScore('known')).toBe(0);
    });
    it('high risk destination adds 20', () => {
      expect(calculateDutyOfCareScore('unknown', 'high')).toBe(100);
    });
  });

  describe('calculateSupplierContractScore', () => {
    it('high = 90 (BR-801)', () => {
      expect(calculateSupplierContractScore('high')).toBe(90);
    });
    it('watch = 60 (BR-802)', () => {
      expect(calculateSupplierContractScore('watch')).toBe(60);
    });
    it('on_track = 0 (BR-803)', () => {
      expect(calculateSupplierContractScore('on_track')).toBe(0);
    });
  });

  describe('calculateRevenueScore', () => {
    it('≥£200 = 100', () => {
      expect(calculateRevenueScore(250)).toBe(100);
    });
    it('£100-199 = 75', () => {
      expect(calculateRevenueScore(150)).toBe(75);
    });
    it('£50-99 = 50', () => {
      expect(calculateRevenueScore(75)).toBe(50);
    });
    it('<£50 = 25', () => {
      expect(calculateRevenueScore(30)).toBe(25);
    });
    it('0 = 0', () => {
      expect(calculateRevenueScore(0)).toBe(0);
    });
  });

  describe('Priority derivation', () => {
    it('80-100 → critical', () => {
      const r = calculateScore({
        hotelRequirementConfidence: 100,
        complianceSeverity: 100,
        revenueOpportunity: 100,
        dutyOfCareImpact: 100,
        supplierContractImpact: 100,
        timeToDeparture: 100,
      });
      expect(r.priority).toBe('critical');
    });
    it('60-79 → high', () => {
      const r = calculateScore({
        hotelRequirementConfidence: 90,
        complianceSeverity: 60,
        revenueOpportunity: 80,
        dutyOfCareImpact: 40,
        supplierContractImpact: 0,
        timeToDeparture: 100,
      });
      expect(r.priority).toBe('high');
    });
  });
});

describe('Stub Providers', () => {
  it('getDefaultPolicyData returns compliant defaults', () => {
    const p = getDefaultPolicyData();
    expect(p.isPreferredSupplier).toBe(true);
    expect(p.isLocationRestricted).toBe(false);
  });

  it('getDefaultSupplierContractData returns on_track', () => {
    const s = getDefaultSupplierContractData();
    expect(s.riskLevel).toBe('on_track');
    expect(s.gap).toBe(0);
  });

  it('getDefaultDestinationRiskData returns standard', () => {
    const d = getDefaultDestinationRiskData();
    expect(d.riskLevel).toBe('standard');
  });

  it('estimateRevenue calculates with country ADR', () => {
    const r = estimateRevenue('US', 4);
    expect(r.estimatedRoomNights).toBe(4);
    expect(r.averageDailyRate).toBe(180);
    expect(r.estimatedSpend).toBe(720);
    expect(r.estimatedCommission).toBe(72);
  });

  it('estimateRevenue uses default for unknown country', () => {
    const r = estimateRevenue('ZZ', 2);
    expect(r.averageDailyRate).toBe(120);
    expect(r.estimatedSpend).toBe(240);
  });

  it('estimateRevenue handles null country', () => {
    const r = estimateRevenue(null, 3);
    expect(r.averageDailyRate).toBe(120);
    expect(r.estimatedSpend).toBe(360);
  });
});

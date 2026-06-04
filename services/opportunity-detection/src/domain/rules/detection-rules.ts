/**
 * Opportunity Detection Rules — BR-501 to BR-506
 * Each function evaluates whether an opportunity should be created.
 * Source: Business Rules Catalogue, Approved Business Rules Mapping
 */

import type { DetectionRuleContext, DetectionRuleResult } from './types.js';

/**
 * BR-501: Missing Hotel
 * Condition: Hotel required AND coverage = 0%
 */
export function evaluateMissingHotel(ctx: DetectionRuleContext): DetectionRuleResult {
  const hotelRequired = isHotelRequired(ctx);
  const noCoverage = ctx.coveragePercent === 0 || ctx.coverageStatus === 'no_accommodation';

  const triggered = hotelRequired && noCoverage && !ctx.hasActiveOrphan;

  return {
    triggered,
    opportunityType: 'missing_hotel',
    ruleId: 'BR-501',
    ruleIds: triggered ? ['BR-501', ...getHotelRequirementRuleIds(ctx)] : [],
    reason: triggered
      ? 'Hotel required but no accommodation exists'
      : 'Conditions not met for missing hotel opportunity',
  };
}

/**
 * BR-502: Partial Accommodation
 * Condition: Coverage > 0% AND coverage < 100%
 */
export function evaluatePartialAccommodation(ctx: DetectionRuleContext): DetectionRuleResult {
  const coverage = ctx.coveragePercent ?? 0;
  const triggered = coverage > 0 && coverage < 100 && !ctx.hasActiveOrphan;

  return {
    triggered,
    opportunityType: 'partial_coverage',
    ruleId: 'BR-502',
    ruleIds: triggered ? ['BR-502'] : [],
    reason: triggered
      ? `Partial accommodation coverage at ${coverage}%`
      : 'Coverage is either 0% or 100%',
  };
}

/**
 * BR-503: Non-Preferred Supplier
 * Condition: Hotel matched AND supplier not approved
 */
export function evaluateNonPreferredSupplier(ctx: DetectionRuleContext): DetectionRuleResult {
  const triggered = ctx.isPreferredSupplier === false;

  return {
    triggered,
    opportunityType: 'out_of_policy',
    ruleId: 'BR-503',
    ruleIds: triggered ? ['BR-503', 'BR-401'] : [],
    reason: triggered
      ? 'Hotel booked with non-preferred supplier'
      : 'Supplier is preferred or unknown',
  };
}

/**
 * BR-504: Supplier Leakage
 * Condition: Hotel booked outside managed programme
 */
export function evaluateSupplierLeakage(ctx: DetectionRuleContext): DetectionRuleResult {
  const triggered = ctx.isManagedChannel === false;

  return {
    triggered,
    opportunityType: 'direct_booked',
    ruleId: 'BR-504',
    ruleIds: triggered ? ['BR-504'] : [],
    reason: triggered
      ? 'Hotel booked outside managed travel programme'
      : 'Booking is through managed channel or unknown',
  };
}

/**
 * BR-505: Duty of Care Gap
 * Condition: Trip exists AND accommodation unknown
 */
export function evaluateDutyOfCareGap(ctx: DetectionRuleContext): DetectionRuleResult {
  const hotelRequired = isHotelRequired(ctx);
  const triggered = hotelRequired && ctx.accommodationUnknown === true && !ctx.hasActiveOrphan;

  return {
    triggered,
    opportunityType: 'duty_of_care_gap',
    ruleId: 'BR-505',
    ruleIds: triggered ? ['BR-505', 'BR-703'] : [],
    reason: triggered
      ? 'Hotel required but accommodation location unknown'
      : 'Accommodation is known or hotel not required',
  };
}

/**
 * BR-506: Supplier Contract Risk
 * Condition: Forecast below commitment
 */
export function evaluateSupplierContractRisk(ctx: DetectionRuleContext): DetectionRuleResult {
  const triggered = ctx.supplierForecastBelow === true;

  return {
    triggered,
    opportunityType: 'preferred_supplier',
    ruleId: 'BR-506',
    ruleIds: triggered ? ['BR-506', 'BR-801'] : [],
    reason: triggered
      ? 'Supplier contract forecast below commitment'
      : 'Supplier contract on track or unknown',
  };
}

/**
 * Determine whether hotel is required based on trip characteristics.
 * Uses BR-101 to BR-108.
 */
function isHotelRequired(ctx: DetectionRuleContext): boolean {
  // BR-101: Same day return → not required
  if (ctx.tripDurationHours !== undefined && ctx.tripDurationHours <= 24 && !ctx.isMultiDay) {
    return false;
  }
  // BR-102: Trip > 24 hours → required
  if (ctx.tripDurationHours !== undefined && ctx.tripDurationHours > 24) return true;
  // BR-103: Multi-day → required
  if (ctx.isMultiDay) return true;
  // BR-106: International multi-day → required
  if (ctx.isInternational && ctx.isMultiDay) return true;
  // BR-104: Arrival after 22:00 → likely required
  if (ctx.arrivalHour !== undefined && ctx.arrivalHour >= 22) return true;
  // BR-105: Departure before 07:00 → likely required
  if (ctx.departureHour !== undefined && ctx.departureHour < 7) return true;

  // Default: if we have no trip duration info, assume required for safety
  return ctx.tripDurationHours === undefined;
}

/** Get rule IDs for the hotel requirement determination */
function getHotelRequirementRuleIds(ctx: DetectionRuleContext): string[] {
  const ids: string[] = [];
  if (ctx.tripDurationHours !== undefined && ctx.tripDurationHours > 24) ids.push('BR-102');
  if (ctx.isMultiDay) ids.push('BR-103');
  if (ctx.isInternational && ctx.isMultiDay) ids.push('BR-106');
  if (ctx.arrivalHour !== undefined && ctx.arrivalHour >= 22) ids.push('BR-104');
  if (ctx.departureHour !== undefined && ctx.departureHour < 7) ids.push('BR-105');
  return ids;
}

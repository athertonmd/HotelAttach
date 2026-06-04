/**
 * Shared types for opportunity detection rules and scoring.
 */

import type { OpportunityType } from '../enums.js';

/** Input context for opportunity detection rule evaluation */
export interface DetectionRuleContext {
  tenantId: string;
  corporateId: string;
  travellerId: string;
  tripId: string;
  /** Trip duration in hours */
  tripDurationHours?: number;
  /** Whether trip spans multiple calendar days */
  isMultiDay?: boolean;
  /** Whether trip is international */
  isInternational?: boolean;
  /** Arrival hour (0–23) */
  arrivalHour?: number;
  /** Departure hour (0–23) */
  departureHour?: number;
  /** Coverage percent from HotelCoverageUpdated (0–100) */
  coveragePercent?: number;
  /** Coverage status from Project 2 */
  coverageStatus?: string;
  /** Whether hotel is from approved supplier programme */
  isPreferredSupplier?: boolean;
  /** Whether hotel is booked via managed channel */
  isManagedChannel?: boolean;
  /** Whether any active orphan exists for this traveller */
  hasActiveOrphan?: boolean;
  /** Supplier contract forecast data */
  supplierForecastBelow?: boolean;
  /** Whether accommodation status is unknown */
  accommodationUnknown?: boolean;
}

/** Result of a detection rule evaluation */
export interface DetectionRuleResult {
  triggered: boolean;
  opportunityType: OpportunityType;
  ruleId: string;
  ruleIds: string[];
  reason: string;
}

/** Corporate-specific scoring multiplier configuration */
export interface CorporateScoringPolicy {
  corporateId: string;
  complianceSeverityMultiplier: number;
  supplierContractMultiplier: number;
  dutyOfCareMultiplier: number;
  revenueMultiplier: number;
  minimumCreationThreshold: number;
  engagementEligibilityThreshold: number;
}

/** Default corporate scoring policy */
export const DEFAULT_SCORING_POLICY: Omit<CorporateScoringPolicy, 'corporateId'> = {
  complianceSeverityMultiplier: 1.0,
  supplierContractMultiplier: 1.0,
  dutyOfCareMultiplier: 1.0,
  revenueMultiplier: 1.0,
  minimumCreationThreshold: 20,
  engagementEligibilityThreshold: 40,
};

/** Input for scoring engine */
export interface ScoringInput {
  hotelRequirementConfidence: number;
  complianceSeverity: number;
  revenueOpportunity: number;
  dutyOfCareImpact: number;
  supplierContractImpact: number;
  timeToDeparture: number;
}

/** Result of scoring engine */
export interface ScoringResult {
  totalScore: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  eligible: boolean;
  engagementEligible: boolean;
  components: ScoringInput;
  ruleIdsApplied: string[];
}

/** Stub data providers */
export interface PolicyData {
  isPreferredSupplier: boolean;
  rateCap?: number;
  isLocationRestricted: boolean;
  isRiskRestricted: boolean;
  isSustainabilityBelow: boolean;
}

export interface SupplierContractData {
  forecastNights: number;
  committedNights: number;
  gap: number;
  riskLevel: 'high' | 'watch' | 'on_track';
}

export interface DestinationRiskData {
  riskLevel: 'standard' | 'elevated' | 'high' | 'critical';
}

export interface RevenueEstimate {
  estimatedRoomNights: number;
  averageDailyRate: number;
  commissionRate: number;
  estimatedSpend: number;
  estimatedCommission: number;
}

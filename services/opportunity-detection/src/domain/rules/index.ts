export {
  evaluateMissingHotel,
  evaluatePartialAccommodation,
  evaluateNonPreferredSupplier,
  evaluateSupplierLeakage,
  evaluateDutyOfCareGap,
  evaluateSupplierContractRisk,
} from './detection-rules.js';
export {
  calculateScore,
  calculateTimeToDepartureScore,
  calculateHotelRequirementConfidence,
  calculateDutyOfCareScore,
  calculateSupplierContractScore,
  calculateRevenueScore,
} from './scoring-engine.js';
export {
  getDefaultPolicyData,
  getDefaultSupplierContractData,
  getDefaultDestinationRiskData,
  estimateRevenue,
} from './stub-providers.js';
export type {
  DetectionRuleContext,
  DetectionRuleResult,
  CorporateScoringPolicy,
  ScoringInput,
  ScoringResult,
  PolicyData,
  SupplierContractData,
  DestinationRiskData,
  RevenueEstimate,
} from './types.js';
export { DEFAULT_SCORING_POLICY } from './types.js';

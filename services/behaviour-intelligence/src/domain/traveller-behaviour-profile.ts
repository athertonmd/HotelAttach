/**
 * TravellerBehaviourProfile — Core entity for traveller booking behaviour.
 * Source: BR-1201–BR-1208
 */

import type { BehaviourSegment, BehaviourChannel } from './enums.js';

export interface CreateProfileInput {
  travellerId: string;
  tenantId: string;
  corporateId: string;
  avgLeadTimeDays: number;
  bookingConsistency: number;
  bookingVariabilityDays: number;
  complianceRate: number;
  avgResponseTimeHours: number;
  preferredChannel: BehaviourChannel;
  selfBookingRate: number;
  tripsAnalysed: number;
  tripCountUsed: number;
  predictedLeadTimeDays: number;
  segment: BehaviourSegment;
}

export interface TravellerBehaviourProfile {
  readonly travellerId: string;
  readonly tenantId: string;
  readonly corporateId: string;
  readonly avgLeadTimeDays: number;
  readonly bookingConsistency: number;
  readonly bookingVariabilityDays: number;
  readonly complianceRate: number;
  readonly avgResponseTimeHours: number;
  readonly preferredChannel: BehaviourChannel;
  readonly selfBookingRate: number;
  readonly tripsAnalysed: number;
  readonly tripCountUsed: number;
  readonly predictedLeadTimeDays: number;
  readonly confidenceScore: number;
  readonly segment: BehaviourSegment;
}

/**
 * Calculate confidence score based on trip count.
 * BR-1207: Confidence clamped 0–100
 * BR-1208: Full confidence requires 10+ trips
 */
function calculateConfidence(tripCountUsed: number): number {
  if (tripCountUsed >= 10) return 100;
  return Math.min(100, Math.max(0, Math.round((tripCountUsed / 10) * 100)));
}

/**
 * Clamp a value between min and max inclusive.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Factory: create a validated TravellerBehaviourProfile.
 * BR-1201: Requires minimum 1 trip
 * BR-1204: bookingConsistency clamped 0–1
 * BR-1207: confidenceScore clamped 0–100
 * BR-1208: Full confidence requires 10+ trips
 */
export function createProfile(input: CreateProfileInput): TravellerBehaviourProfile {
  if (!input.travellerId) throw new Error('travellerId is required');
  if (!input.tenantId) throw new Error('tenantId is required');
  if (!input.corporateId) throw new Error('corporateId is required');

  // BR-1201: Profile requires minimum 1 trip
  if (input.tripCountUsed < 1) {
    throw new Error('tripCountUsed must be at least 1 (BR-1201)');
  }

  if (input.tripsAnalysed < 1) {
    throw new Error('tripsAnalysed must be at least 1');
  }

  // BR-1204: Consistency clamped 0–1
  const bookingConsistency = clamp(input.bookingConsistency, 0, 1);

  // BR-1207 & BR-1208: Confidence calculation
  const confidenceScore = calculateConfidence(input.tripCountUsed);

  return {
    travellerId: input.travellerId,
    tenantId: input.tenantId,
    corporateId: input.corporateId,
    avgLeadTimeDays: input.avgLeadTimeDays,
    bookingConsistency,
    bookingVariabilityDays: input.bookingVariabilityDays,
    complianceRate: clamp(input.complianceRate, 0, 100),
    avgResponseTimeHours: input.avgResponseTimeHours,
    preferredChannel: input.preferredChannel,
    selfBookingRate: clamp(input.selfBookingRate, 0, 100),
    tripsAnalysed: input.tripsAnalysed,
    tripCountUsed: input.tripCountUsed,
    predictedLeadTimeDays: input.predictedLeadTimeDays,
    confidenceScore,
    segment: input.segment,
  };
}

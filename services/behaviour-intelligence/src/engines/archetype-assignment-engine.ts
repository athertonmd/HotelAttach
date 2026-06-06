/**
 * ArchetypeAssignmentEngine — Assigns traveller archetypes from profile metrics.
 * Pure computation: accepts profile data, returns archetype assignment.
 * Source: BR-1301–BR-1309
 */

import { createProfile, determineArchetype } from '../domain/index.js';
import type { ArchetypeEngineInput, ArchetypeEngineResult } from './types.js';

/**
 * Execute archetype assignment engine.
 * Creates a validated profile then runs archetype determination.
 */
export function computeArchetype(input: ArchetypeEngineInput): ArchetypeEngineResult {
  // Build profile via domain factory (applies validation/clamping)
  const profile = createProfile({
    travellerId: input.travellerId,
    tenantId: input.tenantId,
    corporateId: input.corporateId,
    avgLeadTimeDays: input.avgLeadTimeDays,
    bookingConsistency: input.bookingConsistency,
    bookingVariabilityDays: input.bookingVariabilityDays,
    complianceRate: input.complianceRate,
    avgResponseTimeHours: input.avgResponseTimeHours,
    preferredChannel: input.preferredChannel,
    selfBookingRate: input.selfBookingRate,
    tripsAnalysed: input.tripsAnalysed,
    tripCountUsed: input.tripCountUsed,
    predictedLeadTimeDays: input.predictedLeadTimeDays,
    segment: input.segment,
  });

  // Run archetype determination
  const assignment = determineArchetype(profile, input.previousArchetype);

  return {
    archetype: assignment.archetype,
    confidence: assignment.confidence,
    previousArchetype: assignment.previousArchetype,
    isChanged: assignment.archetype !== input.previousArchetype,
  };
}

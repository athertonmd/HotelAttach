/**
 * TravellerArchetype — Archetype assignment based on booking behaviour patterns.
 * Source: BR-1301–BR-1309
 */

import type { ArchetypeType } from './enums.js';
import type { TravellerBehaviourProfile } from './traveller-behaviour-profile.js';

export interface ArchetypeAssignment {
  readonly archetype: ArchetypeType;
  readonly confidence: number;
  readonly previousArchetype: ArchetypeType | null;
}

/**
 * Determine the traveller archetype based on profile metrics.
 * BR-1301: Requires minimum 3 trips analysed
 * BR-1302: Autopilot — high consistency (>0.85), high self-booking (>80%), low response time
 * BR-1303: Procrastinator — books late (avg lead time <3 days), moderate consistency
 * BR-1304: Responsive — low lead time variance, responds quickly (<4h), moderate self-booking
 * BR-1305: Nudge Needer — books after prompts, moderate consistency (0.4–0.7), self-booking 30–60%
 * BR-1306: Reluctant — low compliance (<50%), low self-booking (<30%), high response time
 * BR-1307: Chaotic — high variability (>10 days), low consistency (<0.3)
 * BR-1308: New Traveller — fewer than 5 trips
 * BR-1309: Reassessed on every profile update
 */
export function determineArchetype(
  profile: TravellerBehaviourProfile,
  previousArchetype: ArchetypeType | null,
): ArchetypeAssignment {
  // BR-1301: Requires minimum 3 trips
  if (profile.tripCountUsed < 3) {
    throw new Error('Archetype assignment requires minimum 3 trips (BR-1301)');
  }

  let archetype: ArchetypeType;
  let confidence: number;

  // BR-1308: New Traveller — fewer than 5 trips
  if (profile.tripCountUsed < 5) {
    archetype = 'new_traveller';
    confidence = 50;
  }
  // BR-1302: Autopilot
  else if (
    profile.bookingConsistency > 0.85 &&
    profile.selfBookingRate > 80 &&
    profile.avgResponseTimeHours < 4
  ) {
    archetype = 'autopilot';
    confidence = Math.min(100, Math.round(profile.bookingConsistency * 100));
  }
  // BR-1307: Chaotic — high variability, low consistency
  else if (profile.bookingVariabilityDays > 10 && profile.bookingConsistency < 0.3) {
    archetype = 'chaotic';
    confidence = Math.min(100, Math.round((1 - profile.bookingConsistency) * 80));
  }
  // BR-1306: Reluctant — low compliance, low self-booking, high response time
  else if (
    profile.complianceRate < 50 &&
    profile.selfBookingRate < 30 &&
    profile.avgResponseTimeHours > 24
  ) {
    archetype = 'reluctant';
    confidence = Math.min(100, Math.round((100 - profile.complianceRate) * 0.8));
  }
  // BR-1303: Procrastinator — books late, moderate consistency
  else if (profile.avgLeadTimeDays < 3 && profile.bookingConsistency >= 0.3) {
    archetype = 'procrastinator';
    confidence = Math.min(100, Math.round(70 + (3 - profile.avgLeadTimeDays) * 10));
  }
  // BR-1304: Responsive — low variance, responds quickly, moderate self-booking
  else if (
    profile.bookingVariabilityDays <= 3 &&
    profile.avgResponseTimeHours < 4 &&
    profile.selfBookingRate >= 40 &&
    profile.selfBookingRate <= 80
  ) {
    archetype = 'responsive';
    confidence = Math.min(100, Math.round(75 + (4 - profile.avgResponseTimeHours) * 5));
  }
  // BR-1305: Nudge Needer — moderate consistency, moderate self-booking
  else if (
    profile.bookingConsistency >= 0.4 &&
    profile.bookingConsistency <= 0.7 &&
    profile.selfBookingRate >= 30 &&
    profile.selfBookingRate <= 60
  ) {
    archetype = 'nudge_needer';
    confidence = 65;
  }
  // Default: responsive if no other pattern matches
  else {
    archetype = 'responsive';
    confidence = 55;
  }

  return {
    archetype,
    confidence,
    previousArchetype,
  };
}

/**
 * CommunicationFatigueEngine — Calculates communication fatigue and suppression decisions.
 * Pure computation: accepts communication metrics, returns fatigue state + suppression advice.
 * Source: BR-1601–BR-1611
 */

import { deriveFatigueLevel } from '../domain/index.js';
import type { FatigueEngineInput, FatigueEngineResult } from './types.js';

/** Fatigue threshold for suppression (BR-1609: high = 60+) */
const SUPPRESSION_THRESHOLD = 60;

/**
 * Execute the communication fatigue engine.
 * Calculates fatigue score and determines whether communication should be suppressed.
 */
export function computeFatigue(input: FatigueEngineInput): FatigueEngineResult {
  // Start from current score or calculate from base
  let score = input.currentScore ?? 0;

  // BR-1601: Base contribution from volume (2 points per comm in 30d)
  if (input.currentScore === undefined) {
    score = input.comms30d * 2;
  }

  // BR-1602: +8 per ignored
  score += input.ignoredCount * 8;

  // BR-1603: +12 per declined
  score += input.declinedCount * 12;

  // BR-1604: -10 per positive response
  score -= input.positiveResponses * 10;

  // BR-1605: -15 per independent booking
  score -= input.independentBookings * 15;

  // BR-1606: Decay after 14 days no comm
  if (input.daysSinceLastComm >= 14) {
    score -= 5;
  }

  // BR-1607 / BR-1611: Clamp 0–100
  const fatigueScore = Math.min(100, Math.max(0, Math.round(score)));

  // BR-1608: Level
  const fatigueLevel = deriveFatigueLevel(fatigueScore);

  // BR-1610: Ignored rate
  const ignoredRate =
    input.comms30d > 0 ? Math.round((input.ignoredCount / input.comms30d) * 100) / 100 : 0;

  // BR-1609: Suppression decision
  const shouldSuppress = fatigueScore >= SUPPRESSION_THRESHOLD;
  let suppressionReason: string | null = null;

  if (shouldSuppress) {
    if (fatigueLevel === 'critical') {
      suppressionReason = 'Fatigue is critical — all non-essential communication suppressed.';
    } else {
      suppressionReason = 'Fatigue is high — standard communication suppressed.';
    }
  }

  return {
    fatigueScore,
    fatigueLevel,
    comms30d: input.comms30d,
    ignoredRate,
    shouldSuppress,
    suppressionReason,
  };
}

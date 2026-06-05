/**
 * CommunicationFatigue — Models traveller fatigue from over-communication.
 * Source: BR-1601–BR-1611
 */

import type { FatigueLevel } from './enums.js';
import { deriveFatigueLevel } from './enums.js';

export interface CommunicationFatigue {
  readonly travellerId: string;
  readonly tenantId: string;
  readonly corporateId: string;
  readonly fatigueScore: number;
  readonly fatigueLevel: FatigueLevel;
  readonly comms30d: number;
  readonly ignoredRate: number;
  readonly lastUpdated: Date;
}

export interface CalculateFatigueInput {
  travellerId: string;
  tenantId: string;
  corporateId: string;
  comms30d: number;
  ignoredCount: number;
  declinedCount: number;
  positiveResponses: number;
  independentBookings: number;
  daysSinceLastComm: number;
  currentScore?: number;
}

/**
 * Calculate fatigue score from communication metrics.
 * BR-1601: Base score from communications in 30 days
 * BR-1602: +8 per ignored communication
 * BR-1603: +12 per declined communication
 * BR-1604: -10 for positive response
 * BR-1605: -15 for independent booking (shows self-sufficiency)
 * BR-1606: Decay of -5 after 14 days of no communication
 * BR-1607: Score clamped 0–100
 * BR-1608: Low < 40, Medium 40–59, High 60–79, Critical >= 80
 * BR-1609: Fatigue threshold for suppression = high (60+)
 * BR-1610: Ignored rate = ignoredCount / comms30d
 * BR-1611: Score never goes below 0
 */
export function calculateFatigue(input: CalculateFatigueInput): CommunicationFatigue {
  if (!input.travellerId) throw new Error('travellerId is required');
  if (!input.tenantId) throw new Error('tenantId is required');
  if (!input.corporateId) throw new Error('corporateId is required');

  // Start from current score or base of 0
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
  const ignoredRate = input.comms30d > 0 ? input.ignoredCount / input.comms30d : 0;

  return {
    travellerId: input.travellerId,
    tenantId: input.tenantId,
    corporateId: input.corporateId,
    fatigueScore,
    fatigueLevel,
    comms30d: input.comms30d,
    ignoredRate: Math.round(ignoredRate * 100) / 100,
    lastUpdated: new Date(),
  };
}

/**
 * Apply time-based decay to fatigue score.
 * BR-1606: -5 after 14 days of no communication
 */
export function applyDecay(current: CommunicationFatigue): CommunicationFatigue {
  const newScore = Math.max(0, current.fatigueScore - 5);
  return {
    ...current,
    fatigueScore: newScore,
    fatigueLevel: deriveFatigueLevel(newScore),
    lastUpdated: new Date(),
  };
}

/**
 * Apply an event to fatigue score.
 * BR-1602: +8 for ignored
 * BR-1603: +12 for declined
 * BR-1604: -10 for positive response
 * BR-1605: -15 for independent booking
 */
export function applyEvent(
  current: CommunicationFatigue,
  event: 'ignored' | 'declined' | 'positive_response' | 'independent_booking',
): CommunicationFatigue {
  let delta: number;
  switch (event) {
    case 'ignored':
      delta = 8;
      break;
    case 'declined':
      delta = 12;
      break;
    case 'positive_response':
      delta = -10;
      break;
    case 'independent_booking':
      delta = -15;
      break;
  }

  const newScore = Math.min(100, Math.max(0, current.fatigueScore + delta));
  return {
    ...current,
    fatigueScore: newScore,
    fatigueLevel: deriveFatigueLevel(newScore),
    lastUpdated: new Date(),
  };
}

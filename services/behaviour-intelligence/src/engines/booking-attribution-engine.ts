/**
 * BookingAttributionEngine — Determines what caused a booking to happen.
 * Pure computation: accepts booking + communication history, returns attribution.
 * Source: BR-1401–BR-1410
 */

import type { AttributionType } from '../domain/index.js';
import { ATTRIBUTION_WINDOWS } from '../domain/index.js';
import type {
  AttributionEngineInput,
  AttributionEngineResult,
  CommunicationRecord,
} from './types.js';

/**
 * Find the most recent communication within its attribution window.
 * Returns the best attribution match, or null if none qualifies.
 */
function findBestAttribution(
  communications: CommunicationRecord[],
  bookingTime: Date,
): { comm: CommunicationRecord; hoursFromComm: number } | null {
  let best: { comm: CommunicationRecord; hoursFromComm: number } | null = null;

  for (const comm of communications) {
    const sentTime = comm.sentAt instanceof Date ? comm.sentAt : new Date(comm.sentAt);
    const hoursFromComm = (bookingTime.getTime() - sentTime.getTime()) / (1000 * 60 * 60);

    // Must be after the communication was sent
    if (hoursFromComm < 0) continue;

    const window = ATTRIBUTION_WINDOWS[comm.channel];
    if (window === undefined) continue;

    // Must be within the attribution window
    if (hoursFromComm > window) continue;

    // Pick the most recent (smallest hoursFromComm)
    if (best === null || hoursFromComm < best.hoursFromComm) {
      best = { comm, hoursFromComm };
    }
  }

  return best;
}

/**
 * Calculate confidence based on attribution type and timing.
 * BR-1401–BR-1410
 */
function calculateConfidence(
  attributionType: AttributionType,
  hoursFromCommunication: number | null,
): number {
  if (attributionType === 'independent') return 95;
  if (attributionType === 'corporate_policy') return 90;
  if (attributionType === 'unknown') return 20;

  const window = ATTRIBUTION_WINDOWS[attributionType];
  if (window === undefined) return 20;
  if (hoursFromCommunication === null) return 50;
  if (hoursFromCommunication > window) return 20;

  // BR-1403 + BR-1410: Linear decay with 30% floor
  const ratio = 1 - hoursFromCommunication / window;
  return Math.max(30, Math.round(ratio * 100));
}

/**
 * Execute the booking attribution engine.
 * Determines what caused the booking based on communication history.
 */
export function computeAttribution(input: AttributionEngineInput): AttributionEngineResult {
  // BR-1401: Independent if no communications or explicitly independent
  if (input.isIndependentBooking || input.recentCommunications.length === 0) {
    return {
      attributionType: 'independent',
      communicationId: null,
      hoursFromCommunication: null,
      attributionWindowHours: null,
      confidence: 95,
      estimatedCommission: input.estimatedCommission,
    };
  }

  // Find best matching communication
  const now = new Date();
  const match = findBestAttribution(input.recentCommunications, now);

  if (match === null) {
    // BR-1409: Outside all windows
    return {
      attributionType: 'unknown',
      communicationId: null,
      hoursFromCommunication: null,
      attributionWindowHours: null,
      confidence: 20,
      estimatedCommission: input.estimatedCommission,
    };
  }

  const attributionType = match.comm.channel as AttributionType;
  const hoursFromCommunication = Math.round(match.hoursFromComm * 10) / 10;
  const attributionWindowHours = ATTRIBUTION_WINDOWS[attributionType] ?? null;
  const confidence = calculateConfidence(attributionType, hoursFromCommunication);

  return {
    attributionType,
    communicationId: match.comm.communicationId,
    hoursFromCommunication,
    attributionWindowHours,
    confidence,
    estimatedCommission: input.estimatedCommission,
  };
}

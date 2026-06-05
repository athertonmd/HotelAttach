/**
 * BookingAttribution — Determines what caused a booking to happen.
 * Source: BR-1401–BR-1410
 */

import { randomUUID } from 'node:crypto';
import type { AttributionType } from './enums.js';
import { ATTRIBUTION_WINDOWS } from './enums.js';

export interface BookingAttribution {
  readonly attributionId: string;
  readonly bookingId: string;
  readonly travellerId: string;
  readonly tenantId: string;
  readonly corporateId: string;
  readonly opportunityId: string | null;
  readonly attributionType: AttributionType;
  readonly communicationId: string | null;
  readonly attributionWindowHours: number | null;
  readonly hoursFromCommunication: number | null;
  readonly confidence: number;
  readonly estimatedCommission: number;
  readonly attributedAt: Date;
}

export interface CreateAttributionInput {
  bookingId: string;
  travellerId: string;
  tenantId: string;
  corporateId: string;
  opportunityId?: string | null;
  attributionType: AttributionType;
  communicationId?: string | null;
  hoursFromCommunication?: number | null;
  estimatedCommission: number;
}

/**
 * Calculate attribution confidence based on channel window and timing.
 * BR-1401: Independent attribution if no prior communication
 * BR-1402: Channel attribution if within window
 * BR-1403: Confidence decreases as time from communication increases
 * BR-1404: Email window = 72h
 * BR-1405: SMS window = 24h
 * BR-1406: Push window = 12h
 * BR-1407: In-app window = 48h
 * BR-1408: Agent intervention window = 24h
 * BR-1409: Unknown if outside all windows
 * BR-1410: Confidence floor of 30% for any channel attribution within window
 */
function calculateAttributionConfidence(
  attributionType: AttributionType,
  hoursFromCommunication: number | null,
): number {
  // Independent or corporate_policy or unknown = fixed confidence
  if (attributionType === 'independent') return 95;
  if (attributionType === 'corporate_policy') return 90;
  if (attributionType === 'unknown') return 20;

  const window = ATTRIBUTION_WINDOWS[attributionType];
  if (window === undefined) return 20;

  // If no timing data, provide base confidence
  if (hoursFromCommunication === null) return 50;

  // Outside window
  if (hoursFromCommunication > window) return 20;

  // BR-1403: Confidence decreases with time; BR-1410: floor of 30%
  const ratio = 1 - hoursFromCommunication / window;
  return Math.max(30, Math.round(ratio * 100));
}

/**
 * Factory: create a validated BookingAttribution.
 */
export function createAttribution(input: CreateAttributionInput): BookingAttribution {
  if (!input.bookingId) throw new Error('bookingId is required');
  if (!input.travellerId) throw new Error('travellerId is required');
  if (!input.tenantId) throw new Error('tenantId is required');
  if (!input.corporateId) throw new Error('corporateId is required');
  if (input.estimatedCommission < 0) {
    throw new Error('estimatedCommission must be >= 0');
  }

  const hoursFromCommunication = input.hoursFromCommunication ?? null;
  const attributionWindowHours = ATTRIBUTION_WINDOWS[input.attributionType] ?? null;
  const confidence = calculateAttributionConfidence(input.attributionType, hoursFromCommunication);

  return {
    attributionId: randomUUID(),
    bookingId: input.bookingId,
    travellerId: input.travellerId,
    tenantId: input.tenantId,
    corporateId: input.corporateId,
    opportunityId: input.opportunityId ?? null,
    attributionType: input.attributionType,
    communicationId: input.communicationId ?? null,
    attributionWindowHours,
    hoursFromCommunication,
    confidence,
    estimatedCommission: input.estimatedCommission,
    attributedAt: new Date(),
  };
}

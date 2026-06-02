/**
 * PNR Domain Events
 * Published by the PNR Ingestion bounded context.
 */

import { HCIEventEnvelope } from './envelope';

export interface PNRPayload {
  /** Unique PNR identifier (UUID v4) */
  pnrId: string;

  /** GDS record locator (e.g., "ABC123") */
  recordLocator: string;

  /** Reference to traveller (UUID v4) */
  travellerId: string;

  /** Reference to trip (UUID v4) */
  tripId: string;

  /** Source GDS system identifier */
  gdsSource: string;

  /** PNR creation timestamp (ISO-8601) */
  createdAt: string;

  /** Number of segments in this PNR */
  segmentCount: number;

  /** S3 location of raw PNR archive */
  rawPnrRef: string;
}

export type PNRCreatedEvent = HCIEventEnvelope<PNRPayload> & {
  eventType: 'PNRCreated';
};

export type PNRUpdatedEvent = HCIEventEnvelope<PNRPayload> & {
  eventType: 'PNRUpdated';
};

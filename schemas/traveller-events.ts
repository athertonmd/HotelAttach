/**
 * Traveller Domain Events
 * Published by the Traveller Management bounded context.
 */

import { HCIEventEnvelope } from './envelope';

export type TravellerStatus = 'active' | 'inactive';

export interface TravellerPayload {
  /** Unique traveller identifier (UUID v4) */
  travellerId: string;

  /** Corporate employee reference (null if not available) */
  employeeNumber: string | null;

  /** Traveller email address */
  email: string;

  /** First name */
  firstName: string;

  /** Last name */
  lastName: string;

  /** Corporate the traveller belongs to (UUID v4) */
  corporateId: string;

  /** Traveller status */
  status: TravellerStatus;
}

export type TravellerCreatedEvent = HCIEventEnvelope<TravellerPayload> & {
  eventType: 'TravellerCreated';
};

export type TravellerUpdatedEvent = HCIEventEnvelope<TravellerPayload> & {
  eventType: 'TravellerUpdated';
};

/**
 * Traveller Engagement Domain Events
 * Derived from: schemas/communication-sent, traveller-responded, booking-request-created
 * Published by the Traveller Engagement Platform.
 */

import type { HCIEventEnvelope } from './envelope.js';

// --- Shared enums ---

export type CommunicationType = 'initial_contact' | 'reminder' | 'escalation' | 'follow_up';

export type CommunicationChannel = 'email' | 'sms' | 'portal' | 'agent_call';

export type CommunicationDeliveryStatus = 'delivered' | 'pending' | 'failed';

export type TravellerResponseType =
  | 'accepted'
  | 'declined'
  | 'confirmed_external'
  | 'provided_details';

export type TravellerResponseChannel = 'portal' | 'email_reply' | 'phone' | 'agent_recorded';

export type BookingRequestStatus = 'created';

export type EngagementRecommendationType =
  | 'book_hotel'
  | 'add_nights'
  | 'move_to_preferred'
  | 'review_policy_exception'
  | 'contact_tmc'
  | 'confirm_accommodation'
  | 'cancel_external_booking';

// --- Payload interfaces ---

export interface CommunicationSentPayload {
  communicationId: string;
  opportunityId: string;
  tenantId: string;
  corporateId: string;
  travellerId: string;
  communicationType: CommunicationType;
  channel: CommunicationChannel;
  sentAt: string;
  templateId?: string | null;
  deliveryStatus?: CommunicationDeliveryStatus | null;
  triggeringEventId?: string | null;
  triggeringEventType?: string | null;
  recommendationType?: EngagementRecommendationType | null;
  scheduledAt?: string | null;
  retryCount?: number | null;
}

export interface TravellerRespondedPayload {
  responseId: string;
  communicationId: string;
  opportunityId: string;
  tenantId: string;
  corporateId: string;
  travellerId: string;
  responseType: TravellerResponseType;
  respondedAt: string;
  responseChannel?: TravellerResponseChannel | null;
  notes?: string | null;
  accommodationDetails?: string | null;
  triggeringEventId?: string | null;
  triggeringEventType?: string | null;
  actionTokenId?: string | null;
}

export interface BookingRequestCreatedPayload {
  requestId: string;
  opportunityId: string;
  tenantId: string;
  corporateId: string;
  travellerId: string;
  tripId: string;
  requestStatus: BookingRequestStatus;
  requestedAt: string;
  recommendationType?: EngagementRecommendationType | null;
  destinationCity?: string | null;
  destinationCountry?: string | null;
  requestedNights?: number | null;
  preferredSupplierId?: string | null;
  estimatedBudget?: number | null;
  checkinDate?: string | null;
  checkoutDate?: string | null;
  specialRequests?: string | null;
  triggeringEventId?: string | null;
  triggeringEventType?: string | null;
  responseId?: string | null;
}

// --- Event type aliases ---

export type CommunicationSentEvent = HCIEventEnvelope<CommunicationSentPayload> & {
  eventType: 'CommunicationSent';
};

export type TravellerRespondedEvent = HCIEventEnvelope<TravellerRespondedPayload> & {
  eventType: 'TravellerResponded';
};

export type BookingRequestCreatedEvent = HCIEventEnvelope<BookingRequestCreatedPayload> & {
  eventType: 'BookingRequestCreated';
};

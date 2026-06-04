/**
 * Traveller Engagement domain enums and constants.
 * Source: Approved Project 3 Design — Engagement Platform
 */

export type CommunicationType = 'initial_contact' | 'reminder' | 'escalation' | 'follow_up';

export type CommunicationChannel = 'email' | 'sms' | 'portal' | 'agent_call';

export type CommunicationStatus =
  | 'pending'
  | 'scheduled'
  | 'sent'
  | 'opened'
  | 'clicked'
  | 'responded'
  | 'bounced'
  | 'expired'
  | 'cancelled'
  | 'suppressed';

export type ResponseType = 'accepted' | 'declined' | 'confirmed_external' | 'provided_details';

export type BookingRequestStatus =
  | 'created'
  | 'assigned'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type AgentEscalationReason =
  | 'high_value_opportunity'
  | 'executive_traveller'
  | 'trip_within_48h'
  | 'delivery_bounced'
  | 'no_response_reminder'
  | 'manual_escalation';

export type CommunicationOutcome =
  | 'opened'
  | 'clicked'
  | 'accepted'
  | 'declined'
  | 'bounced'
  | 'no_response'
  | 'unsubscribed';

/** Maximum retries before escalation */
export const MAX_RETRY_COUNT = 1;

/** Cooldown period between communications (hours) */
export const COOLDOWN_HOURS = 72;

/** Token expiry for traveller action links (days) */
export const TOKEN_EXPIRY_DAYS = 7;

/** Communication states that are still in-flight */
export const ACTIVE_COMMUNICATION_STATES: readonly CommunicationStatus[] = [
  'pending',
  'scheduled',
  'sent',
  'opened',
  'clicked',
  'suppressed',
] as const;

/** Communication states that have reached an endpoint */
export const TERMINAL_COMMUNICATION_STATES: readonly CommunicationStatus[] = [
  'responded',
  'bounced',
  'expired',
  'cancelled',
] as const;

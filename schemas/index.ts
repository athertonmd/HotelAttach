/**
 * HCI Event Contracts — Itinerary Intelligence Platform
 *
 * This package defines all domain events published by the Itinerary Intelligence Platform.
 * These type definitions serve as the contract between the Itinerary service and all
 * downstream consumers (Reconciliation, Opportunity, Engagement, Analytics, Intelligence).
 *
 * Usage:
 *   import { TravellerCreatedEvent, TripPayload, HCIEventEnvelope } from '@hci/shared-contracts/events';
 */

export * from './envelope';
export * from './traveller-events';
export * from './pnr-events';
export * from './trip-events';
export * from './segment-events';

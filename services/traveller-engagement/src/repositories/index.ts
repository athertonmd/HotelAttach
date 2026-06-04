export type {
  CommunicationRepository,
  TravellerActionRepository,
  TravellerResponseRepository,
  BookingRequestRepository,
  AgentEscalationRepository,
  TravellerPreferenceRepository,
  CommunicationAuditRepository,
} from './interfaces.js';

export {
  InMemoryCommunicationRepository,
  InMemoryTravellerActionRepository,
  InMemoryTravellerResponseRepository,
  InMemoryBookingRequestRepository,
  InMemoryAgentEscalationRepository,
  InMemoryTravellerPreferenceRepository,
  InMemoryCommunicationAuditRepository,
} from './in-memory.js';

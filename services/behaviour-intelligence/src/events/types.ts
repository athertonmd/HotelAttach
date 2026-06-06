/**
 * Shared types for behaviour intelligence event factories.
 */

import type { HCIEventEnvelope } from '@hci/event-contracts';

export interface EventFactoryResult<T extends object = object> {
  success: boolean;
  event?: HCIEventEnvelope<T>;
  error?: string;
}

export interface CorrelationContext {
  correlationId?: string;
  triggeringEventId?: string;
  triggeringEventType?: string;
}

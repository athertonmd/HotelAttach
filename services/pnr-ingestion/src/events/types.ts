/**
 * Shared types for event factories.
 */

import type { HCIEventEnvelope } from '@hci/event-contracts';

export interface EventFactoryResult<T extends object = object> {
  /** Whether the event was created successfully */
  success: boolean;
  /** The created event (undefined if validation failed) */
  event?: HCIEventEnvelope<T>;
  /** Error message if creation failed */
  error?: string;
}

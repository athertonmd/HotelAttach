/**
 * Helper to build envelope options, omitting undefined optional fields.
 */

import type { CreateEnvelopeOptions, EventType } from '@hci/event-contracts';

export interface BuildEnvelopeInput<T extends object> {
  eventType: EventType;
  tenantId: string;
  corporateId: string;
  sourceService: string;
  correlationId: string | undefined;
  payload: T;
}

export function buildEnvelopeOptions<T extends object>(
  input: BuildEnvelopeInput<T>,
): CreateEnvelopeOptions<T> {
  const base: CreateEnvelopeOptions<T> = {
    eventType: input.eventType,
    tenantId: input.tenantId,
    corporateId: input.corporateId,
    sourceService: input.sourceService,
    payload: input.payload,
  };
  if (input.correlationId !== undefined) {
    base.correlationId = input.correlationId;
  }
  return base;
}

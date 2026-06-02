/**
 * PNRService — application service for PNR management.
 * Handles versioned PNR processing per Approved Decision Q8.
 */

import { PNR, type CreatePNRInput } from '../domain/pnr.js';
import type { PNRRepository } from '../repositories/interfaces.js';
import type { EventBusAdapter } from '@hci/event-contracts';
import { createPNRCreatedEvent, createPNRUpdatedEvent } from '../events/pnr-event-factory.js';
import { buildPNREventContext } from './event-helpers.js';
import type { ServiceResult, CorrelationContext } from './types.js';

export interface CreatePNRServiceInput extends CreatePNRInput {
  tripId: string;
  segmentCount: number;
}

export class PNRService {
  constructor(
    private readonly pnrRepo: PNRRepository,
    private readonly eventBus: EventBusAdapter,
  ) {}

  async createPNR(
    input: CreatePNRServiceInput,
    context: CorrelationContext = {},
  ): Promise<ServiceResult<PNR>> {
    try {
      const pnr = PNR.create(input);
      await this.pnrRepo.save(pnr);

      const eventContext = buildPNREventContext(input.tripId, input.segmentCount, context);
      const eventResult = createPNRCreatedEvent(pnr, eventContext);

      if (!eventResult.success || !eventResult.event) {
        return { success: false, error: eventResult.error ?? 'Failed to create PNRCreated event' };
      }

      await this.eventBus.publish(eventResult.event);
      return { success: true, data: pnr };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Update a PNR with version checking.
   * Per Approved Decision Q8:
   * - Newer versions supersede older versions
   * - Older versions received after newer versions must NOT overwrite canonical state
   */
  async updatePNR(
    input: CreatePNRServiceInput,
    context: CorrelationContext = {},
  ): Promise<ServiceResult<PNR>> {
    try {
      const existing = await this.pnrRepo.findById(input.tenantId, input.pnrId);

      if (!existing) {
        return this.createPNR(input, context);
      }

      if (!existing.shouldAcceptVersion(input.version)) {
        return {
          success: false,
          error: `PNR version ${input.version} is not newer than current version ${existing.version}. Update ignored.`,
        };
      }

      const updated = PNR.create(input);
      await this.pnrRepo.save(updated);

      const eventContext = buildPNREventContext(input.tripId, input.segmentCount, context);
      const eventResult = createPNRUpdatedEvent(updated, eventContext);

      if (!eventResult.success || !eventResult.event) {
        return { success: false, error: eventResult.error ?? 'Failed to create PNRUpdated event' };
      }

      await this.eventBus.publish(eventResult.event);
      return { success: true, data: updated };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  }
}

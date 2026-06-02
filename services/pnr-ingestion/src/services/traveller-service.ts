/**
 * TravellerService — application service for traveller management.
 * Orchestrates domain logic and event publishing.
 */

import { Traveller, type CreateTravellerInput } from '../domain/traveller.js';
import type { TravellerRepository } from '../repositories/interfaces.js';
import type { EventBusAdapter } from '@hci/event-contracts';
import { createEnvelope, type TravellerPayload } from '@hci/event-contracts';
import { buildEnvelopeOptions } from '../events/helpers.js';
import type { ServiceResult, CorrelationContext } from './types.js';

export interface UpdateTravellerInput {
  travellerId: string;
  tenantId: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  mobile?: string | null;
  employeeNumber?: string | null;
  costCentre?: string | null;
  country?: string | null;
}

export class TravellerService {
  constructor(
    private readonly travellerRepo: TravellerRepository,
    private readonly eventBus: EventBusAdapter,
  ) {}

  async createTraveller(
    input: CreateTravellerInput,
    context: CorrelationContext = {},
  ): Promise<ServiceResult<Traveller>> {
    try {
      const traveller = Traveller.create(input);
      await this.travellerRepo.save(traveller);

      const payload: TravellerPayload = {
        travellerId: traveller.travellerId,
        employeeNumber: traveller.employeeNumber,
        email: traveller.email,
        firstName: traveller.firstName,
        lastName: traveller.lastName,
        corporateId: traveller.corporateId,
        status: traveller.status,
      };

      const event = createEnvelope<TravellerPayload>(
        buildEnvelopeOptions({
          eventType: 'TravellerCreated',
          tenantId: traveller.tenantId,
          corporateId: traveller.corporateId,
          sourceService: 'hci\\.itinerary',
          correlationId: context.correlationId,
          payload,
        }),
      );

      await this.eventBus.publish(event);
      return { success: true, data: traveller };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  async updateTraveller(
    input: UpdateTravellerInput,
    context: CorrelationContext = {},
  ): Promise<ServiceResult<Traveller>> {
    try {
      const existing = await this.travellerRepo.findById(input.tenantId, input.travellerId);
      if (!existing) {
        return { success: false, error: `Traveller ${input.travellerId} not found` };
      }

      // Create updated traveller (re-create with merged fields)
      const updated = Traveller.create({
        travellerId: existing.travellerId,
        tenantId: existing.tenantId,
        corporateId: existing.corporateId,
        firstName: input.firstName ?? existing.firstName,
        lastName: input.lastName ?? existing.lastName,
        email: input.email ?? existing.email,
        mobile: input.mobile !== undefined ? input.mobile : existing.mobile,
        employeeNumber:
          input.employeeNumber !== undefined ? input.employeeNumber : existing.employeeNumber,
        costCentre: input.costCentre !== undefined ? input.costCentre : existing.costCentre,
        country: input.country !== undefined ? input.country : existing.country,
      });

      await this.travellerRepo.save(updated);

      const payload: TravellerPayload = {
        travellerId: updated.travellerId,
        employeeNumber: updated.employeeNumber,
        email: updated.email,
        firstName: updated.firstName,
        lastName: updated.lastName,
        corporateId: updated.corporateId,
        status: updated.status,
      };

      const event = createEnvelope<TravellerPayload>(
        buildEnvelopeOptions({
          eventType: 'TravellerUpdated',
          tenantId: updated.tenantId,
          corporateId: updated.corporateId,
          sourceService: 'hci\\.itinerary',
          correlationId: context.correlationId,
          payload,
        }),
      );

      await this.eventBus.publish(event);
      return { success: true, data: updated };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return { success: false, error: message };
    }
  }
}

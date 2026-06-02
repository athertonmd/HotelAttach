/**
 * Ingestion orchestration service.
 * Accepts validated Mantic Point payloads and calls application services.
 * Per Approved Decision Q1: this is the adapter layer boundary.
 */

import type { ManticPointPayload } from './mantic-point-dto.js';
import { validateManticPointPayload } from './validation.js';
import { mapTraveller, mapPNR, mapTrip, mapSegment } from './mapper.js';
import type { TravellerService } from '../services/traveller-service.js';
import type { PNRService } from '../services/pnr-service.js';
import type { TripService } from '../services/trip-service.js';
import type { CorrelationContext } from '../services/types.js';
import { randomUUID } from 'node:crypto';

export interface IngestionResult {
  success: boolean;
  travellerId?: string;
  pnrId?: string;
  tripId?: string;
  segmentCount?: number;
  error?: string;
}

export class IngestionService {
  constructor(
    private readonly travellerService: TravellerService,
    private readonly pnrService: PNRService,
    private readonly tripService: TripService,
  ) {}

  async ingest(
    payload: ManticPointPayload,
    context: CorrelationContext = {},
  ): Promise<IngestionResult> {
    // Validate payload
    const validation = validateManticPointPayload(payload);
    if (!validation.valid) {
      const msg = validation.errors.map((e) => `${e.field}: ${e.message}`).join('; ');
      return { success: false, error: `Validation failed: ${msg}` };
    }

    const correlationId = context.correlationId ?? randomUUID();
    const ctx: CorrelationContext = { correlationId };

    try {
      // 1. Create or find traveller
      const travellerInput = mapTraveller(payload);
      const travellerResult = await this.travellerService.createTraveller(travellerInput, ctx);
      if (!travellerResult.success || !travellerResult.data) {
        return { success: false, error: `Traveller creation failed: ${travellerResult.error}` };
      }
      const travellerId = travellerResult.data.travellerId;

      // 2. Create trip
      const tripInput = mapTrip(payload, travellerId);
      const tripResult = await this.tripService.createTrip(tripInput);
      if (!tripResult.success || !tripResult.data) {
        return { success: false, error: `Trip creation failed: ${tripResult.error}` };
      }
      const tripId = tripResult.data.tripId;

      // 3. Add segments to trip
      const tripContext = {
        origin: tripInput.origin,
        destination: tripInput.destination,
        isInternational: tripInput.isInternational,
      };

      for (const seg of payload.segments) {
        const segInput = mapSegment(seg, tripId);
        const segResult = await this.tripService.addSegment(
          payload.tenantId,
          tripId,
          segInput,
          tripContext,
          ctx,
        );
        if (!segResult.success) {
          return { success: false, error: `Segment addition failed: ${segResult.error}` };
        }
      }

      // 4. Create PNR record
      const pnrInput = mapPNR(payload, travellerId, tripId);
      const pnrResult = await this.pnrService.updatePNR(pnrInput, ctx);
      if (!pnrResult.success) {
        // Version conflict is not a hard failure — it means stale data was ignored
        if (pnrResult.error?.includes('not newer')) {
          return {
            success: true,
            travellerId,
            tripId,
            pnrId: pnrInput.pnrId,
            segmentCount: payload.segments.length,
            error: pnrResult.error,
          };
        }
        return { success: false, error: `PNR creation failed: ${pnrResult.error}` };
      }

      return {
        success: true,
        travellerId,
        pnrId: pnrResult.data?.pnrId ?? pnrInput.pnrId,
        tripId,
        segmentCount: payload.segments.length,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown ingestion error';
      return { success: false, error: message };
    }
  }
}

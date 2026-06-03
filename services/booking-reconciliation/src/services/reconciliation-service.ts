/**
 * BookingReconciliationService — application service orchestration.
 */

import { HotelBooking, type CreateHotelBookingInput } from '../domain/hotel-booking.js';
import { OrphanBooking } from '../domain/orphan-booking.js';
import { CoverageAssessment } from '../domain/coverage-assessment.js';
import { ReconciliationDecisionService } from '../domain/reconciliation-decision.js';
import type {
  HotelBookingRepository,
  ReconciliationMatchRepository,
  OrphanBookingRepository,
  CoverageAssessmentRepository,
  CandidateTripRepository,
} from '../repositories/interfaces.js';
import type { EventBusAdapter } from '@hci/event-contracts';
import {
  createHotelMatchedEvent,
  createHotelRejectedEvent,
  createHotelCoverageUpdatedEvent,
  createHotelOrphanDetectedEvent,
} from '../events/reconciliation-event-factory.js';
import type { CorrelationContext } from '../events/types.js';

export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export class BookingReconciliationService {
  private readonly decisionService = new ReconciliationDecisionService();

  constructor(
    private readonly bookingRepo: HotelBookingRepository,
    private readonly matchRepo: ReconciliationMatchRepository,
    private readonly orphanRepo: OrphanBookingRepository,
    private readonly coverageRepo: CoverageAssessmentRepository,
    private readonly candidateRepo: CandidateTripRepository,
    private readonly eventBus: EventBusAdapter,
  ) {}

  async handleBookingCreated(
    input: CreateHotelBookingInput,
    context: CorrelationContext = {},
  ): Promise<ServiceResult> {
    try {
      const booking = HotelBooking.create(input);
      await this.bookingRepo.save(booking);

      const candidates = await this.candidateRepo.findCandidatesForBooking(
        booking.tenantId,
        booking.travellerId,
      );
      const result = this.decisionService.evaluate(booking, candidates);
      await this.matchRepo.save(result);

      if (result.matchStatus === 'matched') {
        const ev = createHotelMatchedEvent(result, context);
        if (ev.success && ev.event) await this.eventBus.publish(ev.event);
        await this.publishCoverage(booking.tenantId, result.candidateTripId ?? '', context);
      } else if (result.matchStatus === 'unmatched') {
        const orphan = OrphanBooking.create({
          tenantId: booking.tenantId,
          bookingId: booking.bookingId,
          travellerId: booking.travellerId,
          hotelName: booking.hotelName,
          city: booking.city,
          country: booking.country,
          checkinDate: booking.checkinDate,
          checkoutDate: booking.checkoutDate,
          roomNights: booking.roomNights,
          hotelChain: booking.hotelChain,
        });
        await this.orphanRepo.save(orphan);
        const ev = createHotelOrphanDetectedEvent(
          booking,
          orphan.detectedAt,
          orphan.reassociationDeadline,
          context,
        );
        if (ev.success && ev.event) await this.eventBus.publish(ev.event);
      } else if (result.matchStatus === 'rejected') {
        const ev = createHotelRejectedEvent(result, context);
        if (ev.success && ev.event) await this.eventBus.publish(ev.event);
      }
      // candidate status: no external event published

      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  async handleBookingCancelled(
    tenantId: string,
    bookingId: string,
    context: CorrelationContext = {},
  ): Promise<ServiceResult> {
    try {
      const existingMatch = await this.matchRepo.findByBooking(tenantId, bookingId);
      await this.bookingRepo.remove(tenantId, bookingId);
      await this.matchRepo.removeByBooking(tenantId, bookingId);
      await this.orphanRepo.remove(tenantId, bookingId);

      if (existingMatch?.candidateTripId) {
        await this.publishCoverage(tenantId, existingMatch.candidateTripId, context);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  async handleBookingUpdated(
    input: CreateHotelBookingInput,
    context: CorrelationContext = {},
  ): Promise<ServiceResult> {
    // Reassess: remove old match and re-run
    await this.matchRepo.removeByBooking(input.tenantId, input.bookingId);
    await this.orphanRepo.remove(input.tenantId, input.bookingId);
    return this.handleBookingCreated(input, context);
  }

  async handleTripCreatedOrUpdated(
    tenantId: string,
    travellerId: string,
    context: CorrelationContext = {},
  ): Promise<ServiceResult> {
    try {
      // Reassess orphan bookings for this traveller
      const orphans = await this.orphanRepo.findByTraveller(tenantId, travellerId);
      for (const orphan of orphans) {
        const booking = await this.bookingRepo.findById(tenantId, orphan.bookingId);
        if (!booking) continue;

        const candidates = await this.candidateRepo.findCandidatesForBooking(tenantId, travellerId);
        const result = this.decisionService.evaluate(booking, candidates);
        await this.matchRepo.save(result);

        if (result.matchStatus === 'matched') {
          await this.orphanRepo.remove(tenantId, orphan.bookingId);
          const ev = createHotelMatchedEvent(result, context);
          if (ev.success && ev.event) await this.eventBus.publish(ev.event);
          await this.publishCoverage(tenantId, result.candidateTripId ?? '', context);
        }
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
  }

  private async publishCoverage(
    tenantId: string,
    tripId: string,
    context: CorrelationContext,
  ): Promise<void> {
    const matches = await this.matchRepo.findByTrip(tenantId, tripId);
    const nightsCovered = matches.length; // simplified: 1 match = 1 booking contributing
    const assessment = CoverageAssessment.create({
      tenantId,
      tripId,
      totalNightsRequired: Math.max(nightsCovered, 1),
      nightsCovered,
      matchedBookingIds: matches.map((m) => m.bookingId),
    });
    await this.coverageRepo.save(assessment);
    const ev = createHotelCoverageUpdatedEvent(assessment, context);
    if (ev.success && ev.event) await this.eventBus.publish(ev.event);
  }
}

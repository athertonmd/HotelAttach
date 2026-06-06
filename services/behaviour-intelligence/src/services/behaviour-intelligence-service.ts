/**
 * BehaviourIntelligenceService — Application orchestration layer.
 * Handles consumed events, coordinates engines, repositories, and event publishing.
 */

import type { EventBusAdapter, HCIEventEnvelope } from '@hci/event-contracts';
import { createProfile } from '../domain/traveller-behaviour-profile.js';
import { determineArchetype } from '../domain/traveller-archetype.js';
import { createAttribution } from '../domain/booking-attribution.js';
import { calculateFatigue } from '../domain/communication-fatigue.js';
import { calculateRevenueAtRisk } from '../domain/revenue-at-risk.js';
import { determineAction } from '../domain/recommended-action.js';
import { evaluateOutcome } from '../domain/prediction-outcome.js';
import type {
  TravellerBehaviourProfileRepository,
  TravellerArchetypeRepository,
  BookingAttributionRepository,
  BehaviourDriftRepository,
  CommunicationFatigueRepository,
  RevenueAtRiskRepository,
  RecommendedActionRepository,
  PredictionOutcomeRepository,
} from '../repositories/interfaces.js';
import {
  createBehaviourProfileUpdatedEvent,
  createArchetypeAssignedEvent,
  createBookingAttributedEvent,
  createFatigueThresholdCrossedEvent,
  createActionRecommendedEvent,
  createPredictionOutcomeRecordedEvent,
} from '../events/behaviour-event-factory.js';
import type { CorrelationContext } from '../events/types.js';

// ─── Input Types ────────────────────────────────────────────────────────────

export interface BookingCreatedInput {
  tenantId: string;
  corporateId: string;
  travellerId: string;
  bookingId: string;
  leadTimeDays: number;
  hadHotelCompliance: boolean;
  estimatedCommission: number;
  isIndependentBooking: boolean;
  opportunityId?: string;
}

export interface CommunicationSentInput {
  tenantId: string;
  corporateId: string;
  travellerId: string;
  communicationId: string;
  channel: string;
  opportunityId?: string;
}

export interface TravellerRespondedInput {
  tenantId: string;
  corporateId: string;
  travellerId: string;
  responseType: 'accepted' | 'declined' | 'ignored';
}

export interface OpportunityCreatedInput {
  tenantId: string;
  corporateId: string;
  travellerId: string;
  opportunityId: string;
  estimatedCommission: number;
  daysToDeparture: number;
}

export interface OpportunityClosedInput {
  tenantId: string;
  corporateId: string;
  travellerId: string;
  opportunityId: string;
  closureReason: string;
}

export interface ServiceResult {
  success: boolean;
  publishedEvents: HCIEventEnvelope[];
  error?: string;
}

// ─── Repositories Bundle ────────────────────────────────────────────────────

export interface BehaviourRepositories {
  profiles: TravellerBehaviourProfileRepository;
  archetypes: TravellerArchetypeRepository;
  attributions: BookingAttributionRepository;
  drift: BehaviourDriftRepository;
  fatigue: CommunicationFatigueRepository;
  revenueAtRisk: RevenueAtRiskRepository;
  actions: RecommendedActionRepository;
  outcomes: PredictionOutcomeRepository;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildContext(context: CorrelationContext, defaultType: string): CorrelationContext {
  const ctx: CorrelationContext = {
    triggeringEventId: context.triggeringEventId ?? 'unknown',
    triggeringEventType: context.triggeringEventType ?? defaultType,
  };
  if (context.correlationId) {
    ctx.correlationId = context.correlationId;
  }
  return ctx;
}

// ─── Service ────────────────────────────────────────────────────────────────

export class BehaviourIntelligenceService {
  private readonly repos: BehaviourRepositories;
  private readonly eventBus: EventBusAdapter;

  constructor(repos: BehaviourRepositories, eventBus: EventBusAdapter) {
    this.repos = repos;
    this.eventBus = eventBus;
  }

  async handleBookingCreated(
    input: BookingCreatedInput,
    context: CorrelationContext = {},
  ): Promise<ServiceResult> {
    const published: HCIEventEnvelope[] = [];
    const ctx = buildContext(context, 'BookingCreated');

    try {
      // 1. Update profile
      const existingProfile = await this.repos.profiles.findByTravellerId(
        input.tenantId,
        input.travellerId,
      );
      const tripCount = existingProfile ? existingProfile.tripCountUsed + 1 : 1;
      const avgLead = existingProfile
        ? (existingProfile.avgLeadTimeDays * existingProfile.tripCountUsed + input.leadTimeDays) /
          tripCount
        : input.leadTimeDays;

      const profile = createProfile({
        travellerId: input.travellerId,
        tenantId: input.tenantId,
        corporateId: input.corporateId,
        avgLeadTimeDays: Math.round(avgLead * 10) / 10,
        bookingConsistency: existingProfile?.bookingConsistency ?? 0.5,
        bookingVariabilityDays: existingProfile?.bookingVariabilityDays ?? 0,
        complianceRate: existingProfile?.complianceRate ?? (input.hadHotelCompliance ? 100 : 0),
        avgResponseTimeHours: existingProfile?.avgResponseTimeHours ?? 12,
        preferredChannel: existingProfile?.preferredChannel ?? 'email',
        selfBookingRate: existingProfile?.selfBookingRate ?? (input.isIndependentBooking ? 100 : 0),
        tripsAnalysed: tripCount,
        tripCountUsed: tripCount,
        predictedLeadTimeDays: existingProfile?.predictedLeadTimeDays ?? input.leadTimeDays,
        segment: existingProfile?.segment ?? 'reliable_late',
      });
      await this.repos.profiles.save(input.tenantId, profile);

      // Publish BehaviourProfileUpdated
      const profileEvent = createBehaviourProfileUpdatedEvent(
        {
          travellerId: profile.travellerId,
          tenantId: profile.tenantId,
          corporateId: profile.corporateId,
          avgLeadTimeDays: profile.avgLeadTimeDays,
          bookingConsistency: profile.bookingConsistency,
          bookingVariabilityDays: profile.bookingVariabilityDays,
          complianceRate: profile.complianceRate,
          avgResponseTimeHours: profile.avgResponseTimeHours,
          preferredChannel: profile.preferredChannel,
          selfBookingRate: profile.selfBookingRate,
          tripsAnalysed: profile.tripsAnalysed,
          tripCountUsed: profile.tripCountUsed,
          predictedLeadTimeDays: profile.predictedLeadTimeDays,
          confidenceScore: profile.confidenceScore,
          segment: profile.segment,
          triggeringEventId: ctx.triggeringEventId ?? 'unknown',
          triggeringEventType: ctx.triggeringEventType ?? 'BookingCreated',
          calculatedAt: new Date().toISOString(),
        },
        ctx,
      );
      if (profileEvent.success && profileEvent.event) {
        await this.eventBus.publish(profileEvent.event);
        published.push(profileEvent.event);
      }

      // 2. Archetype assignment (requires 3+ trips)
      if (tripCount >= 3) {
        const prevArchetype = await this.repos.archetypes.findByTravellerId(
          input.tenantId,
          input.travellerId,
        );
        const assignment = determineArchetype(profile, prevArchetype?.archetype ?? null);
        await this.repos.archetypes.save(input.tenantId, input.travellerId, assignment);

        if (assignment.archetype !== prevArchetype?.archetype) {
          const archetypeEvent = createArchetypeAssignedEvent(
            {
              travellerId: input.travellerId,
              tenantId: input.tenantId,
              corporateId: input.corporateId,
              archetype: assignment.archetype,
              confidence: assignment.confidence,
              triggeringEventId: ctx.triggeringEventId ?? 'unknown',
              triggeringEventType: ctx.triggeringEventType ?? 'BookingCreated',
              assignedAt: new Date().toISOString(),
            },
            ctx,
          );
          if (archetypeEvent.success && archetypeEvent.event) {
            await this.eventBus.publish(archetypeEvent.event);
            published.push(archetypeEvent.event);
          }
        }
      }

      // 3. Attribution
      const attrInput = {
        bookingId: input.bookingId,
        travellerId: input.travellerId,
        tenantId: input.tenantId,
        corporateId: input.corporateId,
        attributionType: (input.isIndependentBooking ? 'independent' : 'unknown') as
          | 'independent'
          | 'unknown',
        estimatedCommission: input.estimatedCommission,
      };
      const attribution = createAttribution(attrInput);
      await this.repos.attributions.append(input.tenantId, attribution);

      const attrEvent = createBookingAttributedEvent(
        {
          attributionId: attribution.attributionId,
          bookingId: attribution.bookingId,
          travellerId: attribution.travellerId,
          tenantId: attribution.tenantId,
          corporateId: attribution.corporateId,
          opportunityId: attribution.opportunityId,
          attributionType: attribution.attributionType,
          communicationId: attribution.communicationId,
          attributionWindowHours: attribution.attributionWindowHours,
          hoursFromCommunication: attribution.hoursFromCommunication,
          confidence: attribution.confidence,
          estimatedCommission: attribution.estimatedCommission,
          triggeringEventId: ctx.triggeringEventId ?? 'unknown',
          triggeringEventType: ctx.triggeringEventType ?? 'BookingCreated',
          attributedAt: attribution.attributedAt.toISOString(),
        },
        ctx,
      );
      if (attrEvent.success && attrEvent.event) {
        await this.eventBus.publish(attrEvent.event);
        published.push(attrEvent.event);
      }

      return { success: true, publishedEvents: published };
    } catch (err) {
      return {
        success: false,
        publishedEvents: published,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  async handleCommunicationSent(
    input: CommunicationSentInput,
    context: CorrelationContext = {},
  ): Promise<ServiceResult> {
    const published: HCIEventEnvelope[] = [];
    const ctx = buildContext(context, 'CommunicationSent');

    try {
      const existingFatigue = await this.repos.fatigue.findByTravellerId(
        input.tenantId,
        input.travellerId,
      );
      const previousLevel = existingFatigue?.fatigueLevel ?? 'low';

      const fatigueInput = {
        travellerId: input.travellerId,
        tenantId: input.tenantId,
        corporateId: input.corporateId,
        comms30d: (existingFatigue?.comms30d ?? 0) + 1,
        ignoredCount: 0,
        declinedCount: 0,
        positiveResponses: 0,
        independentBookings: 0,
        daysSinceLastComm: 0,
        ...(existingFatigue?.fatigueScore !== undefined
          ? { currentScore: existingFatigue.fatigueScore }
          : {}),
      };
      const fatigue = calculateFatigue(fatigueInput);
      await this.repos.fatigue.save(input.tenantId, fatigue);

      if (fatigue.fatigueLevel !== previousLevel) {
        const direction =
          fatigue.fatigueScore > (existingFatigue?.fatigueScore ?? 0) ? 'increasing' : 'decreasing';
        const fatigueEvent = createFatigueThresholdCrossedEvent(
          {
            travellerId: input.travellerId,
            tenantId: input.tenantId,
            corporateId: input.corporateId,
            fatigueScore: fatigue.fatigueScore,
            fatigueLevel: fatigue.fatigueLevel,
            previousLevel,
            direction: direction as 'increasing' | 'decreasing',
            comms30d: fatigue.comms30d,
            ignoredRate: fatigue.ignoredRate,
            triggeringEventId: ctx.triggeringEventId ?? 'unknown',
            triggeringEventType: ctx.triggeringEventType ?? 'CommunicationSent',
            crossedAt: new Date().toISOString(),
          },
          ctx,
        );
        if (fatigueEvent.success && fatigueEvent.event) {
          await this.eventBus.publish(fatigueEvent.event);
          published.push(fatigueEvent.event);
        }
      }

      return { success: true, publishedEvents: published };
    } catch (err) {
      return {
        success: false,
        publishedEvents: published,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  async handleTravellerResponded(
    input: TravellerRespondedInput,
    context: CorrelationContext = {},
  ): Promise<ServiceResult> {
    const published: HCIEventEnvelope[] = [];
    const ctx = buildContext(context, 'TravellerResponded');

    try {
      const existingFatigue = await this.repos.fatigue.findByTravellerId(
        input.tenantId,
        input.travellerId,
      );
      const previousLevel = existingFatigue?.fatigueLevel ?? 'low';

      const fatigueInput = {
        travellerId: input.travellerId,
        tenantId: input.tenantId,
        corporateId: input.corporateId,
        comms30d: existingFatigue?.comms30d ?? 1,
        ignoredCount: input.responseType === 'ignored' ? 1 : 0,
        declinedCount: input.responseType === 'declined' ? 1 : 0,
        positiveResponses: input.responseType === 'accepted' ? 1 : 0,
        independentBookings: 0,
        daysSinceLastComm: 0,
        ...(existingFatigue?.fatigueScore !== undefined
          ? { currentScore: existingFatigue.fatigueScore }
          : {}),
      };
      const fatigue = calculateFatigue(fatigueInput);
      await this.repos.fatigue.save(input.tenantId, fatigue);

      if (fatigue.fatigueLevel !== previousLevel) {
        const direction =
          fatigue.fatigueScore > (existingFatigue?.fatigueScore ?? 0) ? 'increasing' : 'decreasing';
        const fatigueEvent = createFatigueThresholdCrossedEvent(
          {
            travellerId: input.travellerId,
            tenantId: input.tenantId,
            corporateId: input.corporateId,
            fatigueScore: fatigue.fatigueScore,
            fatigueLevel: fatigue.fatigueLevel,
            previousLevel,
            direction: direction as 'increasing' | 'decreasing',
            comms30d: fatigue.comms30d,
            ignoredRate: fatigue.ignoredRate,
            triggeringEventId: ctx.triggeringEventId ?? 'unknown',
            triggeringEventType: ctx.triggeringEventType ?? 'TravellerResponded',
            crossedAt: new Date().toISOString(),
          },
          ctx,
        );
        if (fatigueEvent.success && fatigueEvent.event) {
          await this.eventBus.publish(fatigueEvent.event);
          published.push(fatigueEvent.event);
        }
      }

      return { success: true, publishedEvents: published };
    } catch (err) {
      return {
        success: false,
        publishedEvents: published,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  async handleOpportunityCreated(
    input: OpportunityCreatedInput,
    context: CorrelationContext = {},
  ): Promise<ServiceResult> {
    const published: HCIEventEnvelope[] = [];
    const ctx = buildContext(context, 'OpportunityCreated');

    try {
      const profile = await this.repos.profiles.findByTravellerId(
        input.tenantId,
        input.travellerId,
      );
      const attachmentLikelihood = profile ? profile.confidenceScore * 0.8 : 50;

      const risk = calculateRevenueAtRisk({
        travellerId: input.travellerId,
        tenantId: input.tenantId,
        corporateId: input.corporateId,
        estimatedCommission: input.estimatedCommission,
        attachmentLikelihood,
      });
      await this.repos.revenueAtRisk.save(input.tenantId, risk);

      const fatigue = await this.repos.fatigue.findByTravellerId(input.tenantId, input.travellerId);
      const drift = await this.repos.drift.findByTravellerId(input.tenantId, input.travellerId);

      if (profile && fatigue && drift) {
        const action = determineAction({
          profile,
          fatigue,
          drift,
          daysToDeparture: input.daysToDeparture,
          predictedLeadTimeDays: profile.predictedLeadTimeDays,
        });
        await this.repos.actions.save(input.tenantId, input.opportunityId, action);

        const actionEvent = createActionRecommendedEvent(
          {
            recommendationId: `rec-${input.opportunityId}`,
            opportunityId: input.opportunityId,
            travellerId: input.travellerId,
            tenantId: input.tenantId,
            corporateId: input.corporateId,
            action: action.action,
            confidence: action.confidence,
            explanationText: action.explanationText,
            predictedLeadTimeDays: action.predictedLeadTimeDays,
            daysToDeparture: action.daysToDeparture,
            estimatedRevenueAtRisk: risk.revenueAtRisk,
            fatigueLevel: action.fatigueLevel,
            driftStatus: action.driftStatus,
            archetype: profile.segment === 'self_sufficient' ? 'autopilot' : 'responsive',
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            triggeringEventId: ctx.triggeringEventId ?? 'unknown',
            triggeringEventType: ctx.triggeringEventType ?? 'OpportunityCreated',
            recommendedAt: new Date().toISOString(),
          },
          ctx,
        );
        if (actionEvent.success && actionEvent.event) {
          await this.eventBus.publish(actionEvent.event);
          published.push(actionEvent.event);
        }
      }

      return { success: true, publishedEvents: published };
    } catch (err) {
      return {
        success: false,
        publishedEvents: published,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  async handleOpportunityClosed(
    input: OpportunityClosedInput,
    context: CorrelationContext = {},
  ): Promise<ServiceResult> {
    const published: HCIEventEnvelope[] = [];
    const ctx = buildContext(context, 'OpportunityClosed');

    try {
      const activeAction = await this.repos.actions.findActiveByOpportunityId(
        input.tenantId,
        input.opportunityId,
      );

      if (activeAction) {
        const actualOutcome =
          input.closureReason === 'fulfilled' || input.closureReason === 'hotel_added'
            ? 'booked_after_communication'
            : input.closureReason === 'expired'
              ? 'expired_unbooked'
              : 'cancelled';

        const outcome = evaluateOutcome({
          recommendationId: `rec-${input.opportunityId}`,
          travellerId: input.travellerId,
          tenantId: input.tenantId,
          corporateId: input.corporateId,
          opportunityId: input.opportunityId,
          recommendedAction: activeAction.action,
          actualOutcome: actualOutcome as
            | 'booked_independently'
            | 'booked_after_communication'
            | 'booked_after_escalation'
            | 'expired_unbooked'
            | 'cancelled',
          daysDifference: 0,
        });
        await this.repos.outcomes.append(input.tenantId, outcome);

        const outcomeEvent = createPredictionOutcomeRecordedEvent(
          {
            predictionId: outcome.predictionId,
            recommendationId: outcome.recommendationId,
            travellerId: outcome.travellerId,
            tenantId: outcome.tenantId,
            corporateId: outcome.corporateId,
            opportunityId: outcome.opportunityId,
            recommendedAction: outcome.recommendedAction,
            actualOutcome: outcome.actualOutcome,
            wasCorrect: outcome.wasCorrect,
            daysDifference: outcome.daysDifference,
            triggeringEventId: ctx.triggeringEventId ?? 'unknown',
            triggeringEventType: ctx.triggeringEventType ?? 'OpportunityClosed',
            resolvedAt: outcome.resolvedAt.toISOString(),
          },
          ctx,
        );
        if (outcomeEvent.success && outcomeEvent.event) {
          await this.eventBus.publish(outcomeEvent.event);
          published.push(outcomeEvent.event);
        }

        await this.repos.actions.remove(input.tenantId, input.opportunityId);
      }

      return { success: true, publishedEvents: published };
    } catch (err) {
      return {
        success: false,
        publishedEvents: published,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }
  }

  async handleOpportunityRejected(
    input: OpportunityClosedInput,
    context: CorrelationContext = {},
  ): Promise<ServiceResult> {
    return this.handleOpportunityClosed({ ...input, closureReason: 'rejected' }, context);
  }

  async handleTripCreated(
    _input: { tenantId: string; corporateId: string; travellerId: string },
    _context: CorrelationContext = {},
  ): Promise<ServiceResult> {
    return { success: true, publishedEvents: [] };
  }

  async handleHotelMatched(
    _input: { tenantId: string; corporateId: string; travellerId: string },
    _context: CorrelationContext = {},
  ): Promise<ServiceResult> {
    return { success: true, publishedEvents: [] };
  }

  async handleBookingRequestCreated(
    _input: { tenantId: string; corporateId: string; travellerId: string },
    _context: CorrelationContext = {},
  ): Promise<ServiceResult> {
    return { success: true, publishedEvents: [] };
  }
}

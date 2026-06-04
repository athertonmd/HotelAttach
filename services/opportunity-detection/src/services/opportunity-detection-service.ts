/**
 * Opportunity Detection Application Service.
 * Orchestrates domain logic, persistence, and event publishing.
 * Source: Project 3 — Opportunity Detection Engine
 */

import type { EventBusAdapter } from '@hci/event-contracts';
import { Opportunity } from '../domain/opportunity.js';
import { OpportunitySuppression } from '../domain/opportunity-suppression.js';
import { ACTIVE_STATES } from '../domain/enums.js';
import {
  evaluateMissingHotel,
  evaluatePartialAccommodation,
} from '../domain/rules/detection-rules.js';
import { calculateScore } from '../domain/rules/scoring-engine.js';
import type { DetectionRuleContext } from '../domain/rules/types.js';
import {
  createOpportunityCreatedEvent,
  createOpportunityClosedEvent,
  createOpportunityRejectedEvent,
} from '../events/opportunity-event-factory.js';
import type { CorrelationContext } from '../events/types.js';
import type {
  OpportunityRepository,
  OpportunityAssessmentRepository,
  OpportunitySuppressionRepository,
  OpportunityCommunicationRepository,
  OpportunityClosureRepository,
  OpportunityAuditRepository,
} from '../repositories/interfaces.js';

// ─── Input & Result Types ───────────────────────────────────────────────────

export interface CoverageUpdatedInput {
  tenantId: string;
  corporateId: string;
  travellerId: string;
  tripId: string;
  coveragePercent: number;
  coverageStatus: string;
  triggeringEventId?: string;
}

export interface HotelMatchedInput {
  tenantId: string;
  tripId: string;
  triggeringEventId?: string;
}

export interface OrphanDetectedInput {
  tenantId: string;
  travellerId: string;
  reassociationDeadline: Date;
  triggeringEventId?: string;
}

export interface TravellerRespondedInput {
  tenantId: string;
  opportunityId: string;
  accepted: boolean;
  triggeringEventId?: string;
}

export interface ServiceResult {
  success: boolean;
  data?: { opportunityId?: string };
  error?: string;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildEventContext(
  ctx: CorrelationContext,
  triggeringEventId: string | undefined,
  triggeringEventType: string,
): CorrelationContext {
  const result: CorrelationContext = {};
  if (ctx.correlationId) {
    result.correlationId = ctx.correlationId;
  }
  if (triggeringEventId) {
    result.triggeringEventId = triggeringEventId;
  }
  result.triggeringEventType = triggeringEventType;
  return result;
}

// ─── Service ────────────────────────────────────────────────────────────────

export interface OpportunityDetectionServiceDeps {
  opportunityRepo: OpportunityRepository;
  assessmentRepo: OpportunityAssessmentRepository;
  suppressionRepo: OpportunitySuppressionRepository;
  communicationRepo: OpportunityCommunicationRepository;
  closureRepo: OpportunityClosureRepository;
  auditRepo: OpportunityAuditRepository;
  eventBus: EventBusAdapter;
}

export class OpportunityDetectionService {
  private readonly opportunityRepo: OpportunityRepository;
  private readonly suppressionRepo: OpportunitySuppressionRepository;
  private readonly eventBus: EventBusAdapter;

  // Stored for future use in audit trails, assessments, communications, closures
  private readonly deps: OpportunityDetectionServiceDeps;

  constructor(
    opportunityRepo: OpportunityRepository,
    assessmentRepo: OpportunityAssessmentRepository,
    suppressionRepo: OpportunitySuppressionRepository,
    communicationRepo: OpportunityCommunicationRepository,
    closureRepo: OpportunityClosureRepository,
    auditRepo: OpportunityAuditRepository,
    eventBus: EventBusAdapter,
  ) {
    this.opportunityRepo = opportunityRepo;
    this.suppressionRepo = suppressionRepo;
    this.eventBus = eventBus;
    this.deps = {
      opportunityRepo,
      assessmentRepo,
      suppressionRepo,
      communicationRepo,
      closureRepo,
      auditRepo,
      eventBus,
    };
  }

  /** Access to all dependencies for extension points. */
  getDeps(): OpportunityDetectionServiceDeps {
    return this.deps;
  }

  // ─── handleHotelCoverageUpdated ─────────────────────────────────────────

  async handleHotelCoverageUpdated(
    input: CoverageUpdatedInput,
    context?: CorrelationContext,
  ): Promise<ServiceResult> {
    const ctx = context ?? {};

    // Coverage 100% → close existing opportunities
    if (input.coveragePercent === 100) {
      return this.closeOpportunitiesForTrip(input.tenantId, input.tripId, 'coverage_complete', ctx);
    }

    // Build detection rule context
    const ruleContext: DetectionRuleContext = {
      tenantId: input.tenantId,
      corporateId: input.corporateId,
      travellerId: input.travellerId,
      tripId: input.tripId,
      coveragePercent: input.coveragePercent,
      coverageStatus: input.coverageStatus,
      isMultiDay: true, // assume multi-day for scoring defaults
    };

    // Evaluate detection rules
    let ruleResult;
    if (input.coveragePercent === 0) {
      ruleResult = evaluateMissingHotel(ruleContext);
    } else {
      ruleResult = evaluatePartialAccommodation(ruleContext);
    }

    if (!ruleResult.triggered) {
      return { success: true };
    }

    // Check for duplicate: same trip + type already active
    const existingForTrip = await this.opportunityRepo.findByTripId(input.tenantId, input.tripId);
    const duplicate = existingForTrip.find(
      (o) =>
        o.opportunityType === ruleResult.opportunityType &&
        ACTIVE_STATES.includes(o.lifecycleState),
    );
    if (duplicate) {
      return { success: true, data: { opportunityId: duplicate.opportunityId } };
    }

    // Check for active orphan suppression for this traveller
    const activeForTraveller = await this.opportunityRepo.findActiveByTraveller(
      input.tenantId,
      input.travellerId,
    );
    const hasSuppressedOrphan = activeForTraveller.some(
      (o) =>
        o.lifecycleState === 'suppressed' &&
        o.primarySuppressionReason === 'orphan_reassociation_window',
    );
    if (hasSuppressedOrphan) {
      return { success: true };
    }

    // Calculate score using scoring engine with reasonable defaults
    const scoringResult = calculateScore(
      {
        hotelRequirementConfidence: 90,
        complianceSeverity: 0,
        revenueOpportunity: 50,
        dutyOfCareImpact: 0,
        supplierContractImpact: 0,
        timeToDeparture: 40,
      },
      {},
      ruleResult.ruleIds,
    );

    // Score threshold check
    if (scoringResult.totalScore < 20) {
      return { success: true };
    }

    // Create opportunity
    const createInput: Parameters<typeof Opportunity.create>[0] = {
      tenantId: input.tenantId,
      corporateId: input.corporateId,
      travellerId: input.travellerId,
      tripId: input.tripId,
      opportunityType: ruleResult.opportunityType,
      score: scoringResult.totalScore,
      triggeringEventId: input.triggeringEventId ?? null,
      triggeringEventType: 'HotelCoverageUpdated',
    };
    if (ctx.correlationId) {
      createInput.correlationId = ctx.correlationId;
    }

    const opportunity = Opportunity.create(createInput);

    // Qualify the opportunity
    opportunity.qualify();

    // Persist
    await this.opportunityRepo.save(opportunity);

    // Publish OpportunityCreated event
    const eventContext = buildEventContext(ctx, input.triggeringEventId, 'HotelCoverageUpdated');
    const eventResult = createOpportunityCreatedEvent(opportunity, eventContext);
    if (eventResult.success && eventResult.event) {
      await this.eventBus.publish(eventResult.event);
    }

    return { success: true, data: { opportunityId: opportunity.opportunityId } };
  }

  // ─── handleHotelMatched ─────────────────────────────────────────────────

  async handleHotelMatched(
    input: HotelMatchedInput,
    context?: CorrelationContext,
  ): Promise<ServiceResult> {
    const ctx = context ?? {};

    const opportunities = await this.opportunityRepo.findByTripId(input.tenantId, input.tripId);

    const activeOps = opportunities.filter(
      (o) =>
        (o.opportunityType === 'missing_hotel' || o.opportunityType === 'partial_coverage') &&
        ACTIVE_STATES.includes(o.lifecycleState),
    );

    for (const opp of activeOps) {
      opp.close('hotel_added');
      await this.opportunityRepo.save(opp);

      const eventContext = buildEventContext(ctx, input.triggeringEventId, 'HotelMatched');
      const eventResult = createOpportunityClosedEvent(opp, eventContext);
      if (eventResult.success && eventResult.event) {
        await this.eventBus.publish(eventResult.event);
      }
    }

    return { success: true };
  }

  // ─── handleHotelOrphanDetected ──────────────────────────────────────────

  async handleHotelOrphanDetected(
    input: OrphanDetectedInput,
    _context?: CorrelationContext,
  ): Promise<ServiceResult> {
    const activeOps = await this.opportunityRepo.findActiveByTraveller(
      input.tenantId,
      input.travellerId,
    );

    for (const opp of activeOps) {
      opp.suppress('orphan_reassociation_window', input.reassociationDeadline);
      await this.opportunityRepo.save(opp);

      const suppression = OpportunitySuppression.create({
        opportunityId: opp.opportunityId,
        tenantId: input.tenantId,
        suppressionReason: 'orphan_reassociation_window',
        suppressedUntil: input.reassociationDeadline,
      });
      await this.suppressionRepo.save(suppression);
    }

    return { success: true };
  }

  // ─── handleTripCancelled ────────────────────────────────────────────────

  async handleTripCancelled(
    tenantId: string,
    tripId: string,
    context?: CorrelationContext,
  ): Promise<ServiceResult> {
    const ctx = context ?? {};

    const opportunities = await this.opportunityRepo.findByTripId(tenantId, tripId);
    const activeOps = opportunities.filter((o) => ACTIVE_STATES.includes(o.lifecycleState));

    for (const opp of activeOps) {
      opp.cancel();
      await this.opportunityRepo.save(opp);

      const eventContext = buildEventContext(ctx, undefined, 'TripCancelled');
      const eventResult = createOpportunityClosedEvent(opp, eventContext);
      if (eventResult.success && eventResult.event) {
        await this.eventBus.publish(eventResult.event);
      }
    }

    return { success: true };
  }

  // ─── handleTravellerResponded ───────────────────────────────────────────

  async handleTravellerResponded(
    input: TravellerRespondedInput,
    context?: CorrelationContext,
  ): Promise<ServiceResult> {
    const ctx = context ?? {};

    const opportunity = await this.opportunityRepo.findById(input.tenantId, input.opportunityId);

    if (!opportunity) {
      return { success: false, error: `Opportunity not found: ${input.opportunityId}` };
    }

    if (input.accepted) {
      // Transition towards converted — need to be in communicated state
      if (opportunity.lifecycleState === 'communicated') {
        opportunity.convert();
      } else if (opportunity.lifecycleState === 'active') {
        opportunity.markCommunicated();
        opportunity.convert();
      } else if (opportunity.lifecycleState === 'qualified') {
        opportunity.activate();
        opportunity.markCommunicated();
        opportunity.convert();
      }
      await this.opportunityRepo.save(opportunity);
      return { success: true, data: { opportunityId: opportunity.opportunityId } };
    } else {
      // Declined → reject
      const previousState = opportunity.lifecycleState;
      opportunity.reject('traveller_declined');
      await this.opportunityRepo.save(opportunity);

      const eventContext = buildEventContext(ctx, input.triggeringEventId, 'TravellerResponded');
      const eventResult = createOpportunityRejectedEvent(opportunity, previousState, eventContext);
      if (eventResult.success && eventResult.event) {
        await this.eventBus.publish(eventResult.event);
      }

      return { success: true, data: { opportunityId: opportunity.opportunityId } };
    }
  }

  // ─── handleManualClosure ────────────────────────────────────────────────

  async handleManualClosure(
    tenantId: string,
    opportunityId: string,
    _actorId: string,
    context?: CorrelationContext,
  ): Promise<ServiceResult> {
    const ctx = context ?? {};

    const opportunity = await this.opportunityRepo.findById(tenantId, opportunityId);
    if (!opportunity) {
      return { success: false, error: `Opportunity not found: ${opportunityId}` };
    }

    opportunity.close('manual_closure');
    await this.opportunityRepo.save(opportunity);

    const eventContext = buildEventContext(ctx, undefined, 'ManualClosure');
    const eventResult = createOpportunityClosedEvent(opportunity, eventContext);
    if (eventResult.success && eventResult.event) {
      await this.eventBus.publish(eventResult.event);
    }

    return { success: true, data: { opportunityId: opportunity.opportunityId } };
  }

  // ─── handleManualSuppression ────────────────────────────────────────────

  async handleManualSuppression(
    tenantId: string,
    opportunityId: string,
    _actorId: string,
    duration?: Date,
    _context?: CorrelationContext,
  ): Promise<ServiceResult> {
    const opportunity = await this.opportunityRepo.findById(tenantId, opportunityId);
    if (!opportunity) {
      return { success: false, error: `Opportunity not found: ${opportunityId}` };
    }

    opportunity.suppress('manual_suppression', duration);
    await this.opportunityRepo.save(opportunity);

    const suppression = OpportunitySuppression.create({
      opportunityId: opportunity.opportunityId,
      tenantId,
      suppressionReason: 'manual_suppression',
      suppressedUntil: duration ?? null,
    });
    await this.suppressionRepo.save(suppression);

    return { success: true, data: { opportunityId: opportunity.opportunityId } };
  }

  // ─── Private Helpers ────────────────────────────────────────────────────

  private async closeOpportunitiesForTrip(
    tenantId: string,
    tripId: string,
    reason: 'coverage_complete' | 'hotel_added',
    ctx: CorrelationContext,
  ): Promise<ServiceResult> {
    const opportunities = await this.opportunityRepo.findByTripId(tenantId, tripId);
    const activeOps = opportunities.filter((o) => ACTIVE_STATES.includes(o.lifecycleState));

    for (const opp of activeOps) {
      opp.close(reason);
      await this.opportunityRepo.save(opp);

      const eventContext = buildEventContext(ctx, undefined, 'HotelCoverageUpdated');
      const eventResult = createOpportunityClosedEvent(opp, eventContext);
      if (eventResult.success && eventResult.event) {
        await this.eventBus.publish(eventResult.event);
      }
    }

    return { success: true };
  }
}

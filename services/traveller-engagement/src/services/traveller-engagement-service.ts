/**
 * Traveller Engagement Application Service.
 * Orchestrates domain logic, persistence, and event publishing.
 * Source: Project 3 — Traveller Engagement Platform
 */

import type { EventBusAdapter } from '@hci/event-contracts';
import { Communication } from '../domain/communication.js';
import { TravellerAction } from '../domain/traveller-action.js';
import { TravellerResponse } from '../domain/traveller-response.js';
import { BookingRequest } from '../domain/booking-request.js';
import { AgentEscalation } from '../domain/agent-escalation.js';
import { COOLDOWN_HOURS } from '../domain/enums.js';
import type { CorrelationContext } from '../events/types.js';
import {
  createCommunicationSentEvent,
  createTravellerRespondedEvent,
  createBookingRequestCreatedEvent,
} from '../events/engagement-event-factory.js';
import type {
  CommunicationRepository,
  TravellerActionRepository,
  TravellerResponseRepository,
  BookingRequestRepository,
  AgentEscalationRepository,
  TravellerPreferenceRepository,
  CommunicationAuditRepository,
} from '../repositories/interfaces.js';

// ─── Input & Result Types ───────────────────────────────────────────────────

export interface OpportunityInput {
  tenantId: string;
  corporateId: string;
  travellerId: string;
  tripId: string;
  opportunityId: string;
  opportunityType: string;
  priority: string;
  score: number;
  lifecycleState?: string;
  departureDate?: Date | null;
}

export interface DeliveryResultInput {
  tenantId: string;
  communicationId: string;
  delivered: boolean;
}

export interface TravellerActionInput {
  tenantId: string;
  token: string;
  responseType: 'accepted' | 'declined' | 'confirmed_external' | 'provided_details';
  notes?: string;
}

export interface ServiceResult {
  success: boolean;
  data?: Record<string, string>;
  error?: string;
}

// ─── Service ────────────────────────────────────────────────────────────────

export class TravellerEngagementService {
  private readonly communicationRepo: CommunicationRepository;
  private readonly actionRepo: TravellerActionRepository;
  private readonly responseRepo: TravellerResponseRepository;
  private readonly bookingRequestRepo: BookingRequestRepository;
  private readonly escalationRepo: AgentEscalationRepository;
  private readonly preferenceRepo: TravellerPreferenceRepository;
  private readonly auditRepo: CommunicationAuditRepository;
  private readonly eventBus: EventBusAdapter;

  constructor(
    communicationRepo: CommunicationRepository,
    actionRepo: TravellerActionRepository,
    responseRepo: TravellerResponseRepository,
    bookingRequestRepo: BookingRequestRepository,
    escalationRepo: AgentEscalationRepository,
    preferenceRepo: TravellerPreferenceRepository,
    auditRepo: CommunicationAuditRepository,
    eventBus: EventBusAdapter,
  ) {
    this.communicationRepo = communicationRepo;
    this.actionRepo = actionRepo;
    this.responseRepo = responseRepo;
    this.bookingRequestRepo = bookingRequestRepo;
    this.escalationRepo = escalationRepo;
    this.preferenceRepo = preferenceRepo;
    this.auditRepo = auditRepo;
    this.eventBus = eventBus;
  }

  // ─── handleOpportunityCreated ─────────────────────────────────────────

  async handleOpportunityCreated(
    input: OpportunityInput,
    context?: CorrelationContext,
  ): Promise<ServiceResult> {
    const ctx = context ?? {};

    // Suppressed opportunities should not send
    if (input.lifecycleState === 'suppressed') {
      return { success: true };
    }

    // Awaiting action → create agent escalation instead of sending
    if (input.lifecycleState === 'awaiting_action') {
      const reason = input.score >= 80 ? 'high_value_opportunity' : 'executive_traveller';
      const comm = this.createCommunication(input, ctx);
      await this.communicationRepo.save(comm);

      const escalation = AgentEscalation.create({
        opportunityId: input.opportunityId,
        tenantId: input.tenantId,
        travellerId: input.travellerId,
        communicationId: comm.communicationId,
        reason,
        priority: input.score >= 80 ? 'critical' : 'high',
      });
      await this.escalationRepo.save(escalation);
      return { success: true, data: { escalationId: escalation.escalationId } };
    }

    // 72h cooldown check
    const recentComms = await this.communicationRepo.findByTravellerId(
      input.tenantId,
      input.travellerId,
    );
    const cooldownMs = COOLDOWN_HOURS * 60 * 60 * 1000;
    const now = Date.now();
    const withinCooldown = recentComms.some(
      (c) => c.sentAt !== null && now - c.sentAt.getTime() < cooldownMs,
    );
    if (withinCooldown) {
      return { success: true };
    }

    // Check traveller preference — if email is blocked, escalate
    const preference = await this.preferenceRepo.findByTravellerId(
      input.tenantId,
      input.travellerId,
    );
    if (preference && preference.isChannelBlocked('email')) {
      const comm = this.createCommunication(input, ctx);
      await this.communicationRepo.save(comm);

      const escalation = AgentEscalation.create({
        opportunityId: input.opportunityId,
        tenantId: input.tenantId,
        travellerId: input.travellerId,
        communicationId: comm.communicationId,
        reason: 'manual_escalation',
        priority: 'medium',
      });
      await this.escalationRepo.save(escalation);
      return { success: true, data: { escalationId: escalation.escalationId } };
    }

    // Create Communication and send immediately
    const comm = this.createCommunication(input, ctx);
    comm.send();

    // Create TravellerAction token
    const action = TravellerAction.create({
      communicationId: comm.communicationId,
      tenantId: input.tenantId,
      travellerId: input.travellerId,
      departureDate: input.departureDate ?? null,
    });

    // Persist
    await this.communicationRepo.save(comm);
    await this.actionRepo.save(action);

    // Audit
    await this.auditRepo.append({
      tenantId: input.tenantId,
      communicationId: comm.communicationId,
      action: 'sent',
      occurredAt: new Date(),
    });

    // Publish CommunicationSent event
    const eventResult = createCommunicationSentEvent(comm, ctx);
    if (eventResult.success && eventResult.event) {
      await this.eventBus.publish(eventResult.event);
    }

    return { success: true, data: { communicationId: comm.communicationId } };
  }

  // ─── handleOpportunityClosed ──────────────────────────────────────────

  async handleOpportunityClosed(
    input: { tenantId: string; opportunityId: string },
    _context?: CorrelationContext,
  ): Promise<ServiceResult> {
    return this.cancelCommunicationsForOpportunity(input.tenantId, input.opportunityId);
  }

  // ─── handleOpportunityRejected ────────────────────────────────────────

  async handleOpportunityRejected(
    input: { tenantId: string; opportunityId: string },
    _context?: CorrelationContext,
  ): Promise<ServiceResult> {
    return this.cancelCommunicationsForOpportunity(input.tenantId, input.opportunityId);
  }

  // ─── handleDeliveryResult ─────────────────────────────────────────────

  async handleDeliveryResult(input: DeliveryResultInput): Promise<ServiceResult> {
    const comm = await this.communicationRepo.findById(input.tenantId, input.communicationId);
    if (!comm) {
      return { success: false, error: `Communication not found: ${input.communicationId}` };
    }

    if (!input.delivered) {
      comm.markBounced();
      await this.communicationRepo.save(comm);

      if (comm.needsEscalation()) {
        const escalation = AgentEscalation.create({
          opportunityId: comm.opportunityId,
          tenantId: comm.tenantId,
          travellerId: comm.travellerId,
          communicationId: comm.communicationId,
          reason: 'delivery_bounced',
          priority: 'high',
        });
        await this.escalationRepo.save(escalation);
      }
    }

    return { success: true };
  }

  // ─── handleTravellerAction ────────────────────────────────────────────

  async handleTravellerAction(
    input: TravellerActionInput,
    context?: CorrelationContext,
  ): Promise<ServiceResult> {
    const ctx = context ?? {};

    const action = await this.actionRepo.findByToken(input.tenantId, input.token);
    if (!action) {
      return { success: false, error: 'Token not found' };
    }

    // Validate not expired
    if (action.isExpired(new Date())) {
      return { success: false, error: 'Token has expired' };
    }

    // Validate not used
    if (action.isUsed) {
      return { success: false, error: 'Token has already been used' };
    }

    // Mark used
    action.use();
    await this.actionRepo.save(action);

    // Find the communication
    const comm = await this.communicationRepo.findById(input.tenantId, action.communicationId);
    if (!comm) {
      return { success: false, error: `Communication not found: ${action.communicationId}` };
    }

    // Mark responded
    comm.markResponded();
    await this.communicationRepo.save(comm);

    // Create TravellerResponse
    const responseInput: Parameters<typeof TravellerResponse.create>[0] = {
      communicationId: comm.communicationId,
      opportunityId: comm.opportunityId,
      tenantId: input.tenantId,
      travellerId: action.travellerId,
      responseType: input.responseType,
      notes: input.notes ?? null,
    };
    if (ctx.correlationId) {
      responseInput.correlationId = ctx.correlationId;
    }
    const response = TravellerResponse.create(responseInput);
    await this.responseRepo.append(response);

    // Publish TravellerResponded event
    const respondedResult = createTravellerRespondedEvent(response, ctx);
    if (respondedResult.success && respondedResult.event) {
      await this.eventBus.publish(respondedResult.event);
    }

    // If accepted → create BookingRequest
    if (input.responseType === 'accepted') {
      const bookingRequest = BookingRequest.create({
        opportunityId: comm.opportunityId,
        tenantId: input.tenantId,
        corporateId: comm.corporateId,
        travellerId: action.travellerId,
        tripId: comm.opportunityId, // tripId from communication context
      });
      await this.bookingRequestRepo.save(bookingRequest);

      const bookingResult = createBookingRequestCreatedEvent(bookingRequest, ctx);
      if (bookingResult.success && bookingResult.event) {
        await this.eventBus.publish(bookingResult.event);
      }
    }

    return { success: true, data: { responseId: response.responseId } };
  }

  // ─── approveAgentReview ───────────────────────────────────────────────

  async approveAgentReview(
    tenantId: string,
    escalationId: string,
    context?: CorrelationContext,
  ): Promise<ServiceResult> {
    const ctx = context ?? {};

    const escalation = await this.escalationRepo.findById(tenantId, escalationId);
    if (!escalation) {
      return { success: false, error: `Escalation not found: ${escalationId}` };
    }

    // Resolve the escalation (must be assigned first)
    escalation.resolve();
    await this.escalationRepo.save(escalation);

    // Find the communication for that escalation
    const comm = await this.communicationRepo.findById(tenantId, escalation.communicationId);
    if (!comm) {
      return { success: false, error: `Communication not found: ${escalation.communicationId}` };
    }

    // Send the communication
    comm.send();
    await this.communicationRepo.save(comm);

    // Publish CommunicationSent event
    const eventResult = createCommunicationSentEvent(comm, ctx);
    if (eventResult.success && eventResult.event) {
      await this.eventBus.publish(eventResult.event);
    }

    return { success: true, data: { communicationId: comm.communicationId } };
  }

  // ─── manuallyAssignAgent ──────────────────────────────────────────────

  async manuallyAssignAgent(
    tenantId: string,
    escalationId: string,
    agentId: string,
  ): Promise<ServiceResult> {
    const escalation = await this.escalationRepo.findById(tenantId, escalationId);
    if (!escalation) {
      return { success: false, error: `Escalation not found: ${escalationId}` };
    }

    escalation.assign(agentId);
    await this.escalationRepo.save(escalation);

    return { success: true, data: { escalationId: escalation.escalationId } };
  }

  // ─── Private Helpers ──────────────────────────────────────────────────

  private createCommunication(input: OpportunityInput, ctx: CorrelationContext): Communication {
    const commInput: Parameters<typeof Communication.create>[0] = {
      tenantId: input.tenantId,
      corporateId: input.corporateId,
      travellerId: input.travellerId,
      opportunityId: input.opportunityId,
      communicationType: 'initial_contact',
      channel: 'email',
    };
    if (ctx.correlationId) {
      commInput.correlationId = ctx.correlationId;
    }
    return Communication.create(commInput);
  }

  private async cancelCommunicationsForOpportunity(
    tenantId: string,
    opportunityId: string,
  ): Promise<ServiceResult> {
    const comms = await this.communicationRepo.findByOpportunityId(tenantId, opportunityId);

    const activeStatuses = ['pending', 'scheduled', 'sent', 'opened', 'clicked', 'suppressed'];
    for (const comm of comms) {
      if (activeStatuses.includes(comm.status)) {
        comm.cancel();
        await this.communicationRepo.save(comm);
      }
    }

    return { success: true };
  }
}

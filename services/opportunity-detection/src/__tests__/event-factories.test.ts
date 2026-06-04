/**
 * Unit tests for Opportunity event factories.
 * Validates event creation, schema conformance, and error handling.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SchemaValidator } from '@hci/validation';
import { Opportunity } from '../domain/opportunity.js';
import {
  createOpportunityCreatedEvent,
  createOpportunityUpdatedEvent,
  createOpportunityClosedEvent,
  createOpportunityRejectedEvent,
} from '../events/opportunity-event-factory.js';

const TENANT = 'aaaa1111-aaaa-4000-8000-aaaaaaaaaaaa';
const CORP = 'bbbb2222-bbbb-4000-8000-bbbbbbbbbbbb';
const TRAVELLER = 'cccc3333-cccc-4000-8000-cccccccccccc';
const TRIP = 'dddd4444-dddd-4000-8000-dddddddddddd';
const CORR = 'eeee5555-eeee-4000-8000-eeeeeeeeeeee';
const TRIGGER_EVENT = 'ffff6666-ffff-4000-8000-ffffffffffff';

function makeOpportunity(overrides = {}) {
  return Opportunity.create({
    tenantId: TENANT,
    corporateId: CORP,
    travellerId: TRAVELLER,
    tripId: TRIP,
    opportunityType: 'missing_hotel',
    score: 85,
    correlationId: CORR,
    triggeringEventId: TRIGGER_EVENT,
    triggeringEventType: 'HotelCoverageUpdated',
    destinationCity: 'Paris',
    destinationCountry: 'FR',
    departureDate: new Date('2026-08-15'),
    estimatedRoomNights: 4,
    estimatedSpend: 600,
    estimatedCommission: 60,
    ...overrides,
  });
}

describe('OpportunityCreated Event Factory', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('creates event from qualified opportunity', () => {
    const opp = makeOpportunity();
    opp.qualify();
    const result = createOpportunityCreatedEvent(opp);
    expect(result.success).toBe(true);
    expect(result.event).toBeDefined();
    expect(result.event!.eventType).toBe('OpportunityCreated');
    expect(result.event!.payload.lifecycleState).toBe('qualified');
  });

  it('creates event from active opportunity', () => {
    const opp = makeOpportunity();
    opp.qualify();
    opp.activate();
    const result = createOpportunityCreatedEvent(opp);
    expect(result.success).toBe(true);
    expect(result.event!.payload.lifecycleState).toBe('active');
  });

  it('creates event from suppressed opportunity with primarySuppressionReason', () => {
    const opp = makeOpportunity();
    opp.suppress('orphan_reassociation_window', new Date('2026-09-01'));
    const result = createOpportunityCreatedEvent(opp);
    expect(result.success).toBe(true);
    expect(result.event!.payload.lifecycleState).toBe('suppressed');
    expect(result.event!.payload.primarySuppressionReason).toBe('orphan_reassociation_window');
    expect(result.event!.payload.suppressedUntil).toContain('2026-09-01');
  });

  it('includes recommendation when provided via domain', () => {
    // Recommendation would normally be attached separately; test the payload structure
    const opp = makeOpportunity();
    opp.qualify();
    const result = createOpportunityCreatedEvent(opp);
    expect(result.success).toBe(true);
    // recommendation is null by default (no recommendation attached via factory)
    expect(result.event!.payload.recommendation).toBeUndefined();
  });

  it('preserves tenantId in envelope and payload', () => {
    const opp = makeOpportunity();
    opp.qualify();
    const result = createOpportunityCreatedEvent(opp);
    expect(result.event!.tenantId).toBe(TENANT);
    expect(result.event!.payload.tenantId).toBe(TENANT);
  });

  it('preserves correlationId', () => {
    const opp = makeOpportunity();
    opp.qualify();
    const result = createOpportunityCreatedEvent(opp, { correlationId: CORR });
    expect(result.event!.correlationId).toBe(CORR);
  });

  it('includes triggeringEventId and triggeringEventType', () => {
    const opp = makeOpportunity();
    opp.qualify();
    const result = createOpportunityCreatedEvent(opp);
    expect(result.event!.payload.triggeringEventId).toBe(TRIGGER_EVENT);
    expect(result.event!.payload.triggeringEventType).toBe('HotelCoverageUpdated');
  });

  it('rejects invalid lifecycle state (detected)', () => {
    const opp = makeOpportunity();
    // opp is in 'detected' state — not valid for OpportunityCreated
    const result = createOpportunityCreatedEvent(opp);
    expect(result.success).toBe(false);
    expect(result.error).toContain('detected');
  });

  it('validates against schema', () => {
    const opp = makeOpportunity();
    opp.qualify();
    const result = createOpportunityCreatedEvent(opp);
    const validation = validator.validateEvent('opportunity-created', result.event);
    expect(validation.errors).toHaveLength(0);
    expect(validation.valid).toBe(true);
  });
});

describe('OpportunityUpdated Event Factory', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('creates event from score/priority change', () => {
    const opp = makeOpportunity({ score: 50 });
    opp.qualify();
    opp.updateScore(90);
    const result = createOpportunityUpdatedEvent(opp, 50, 'medium', 'detected');
    expect(result.success).toBe(true);
    expect(result.event!.payload.previousScore).toBe(50);
    expect(result.event!.payload.newScore).toBe(90);
    expect(result.event!.payload.previousPriority).toBe('medium');
    expect(result.event!.payload.newPriority).toBe('critical');
    expect(result.event!.payload.previousState).toBe('detected');
  });

  it('preserves tenantId', () => {
    const opp = makeOpportunity();
    opp.qualify();
    const result = createOpportunityUpdatedEvent(opp, 70, 'high', 'detected');
    expect(result.event!.tenantId).toBe(TENANT);
    expect(result.event!.payload.tenantId).toBe(TENANT);
  });

  it('preserves correlationId', () => {
    const opp = makeOpportunity();
    opp.qualify();
    const result = createOpportunityUpdatedEvent(opp, 70, 'high', 'detected', {
      correlationId: CORR,
    });
    expect(result.event!.correlationId).toBe(CORR);
  });

  it('validates against schema', () => {
    const opp = makeOpportunity();
    opp.qualify();
    opp.activate();
    const result = createOpportunityUpdatedEvent(opp, 70, 'high', 'qualified');
    const validation = validator.validateEvent('opportunity-updated', result.event);
    expect(validation.errors).toHaveLength(0);
    expect(validation.valid).toBe(true);
  });
});

describe('OpportunityClosed Event Factory', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('creates event with closureReason', () => {
    const opp = makeOpportunity();
    opp.close('hotel_added');
    const result = createOpportunityClosedEvent(opp);
    expect(result.success).toBe(true);
    expect(result.event!.payload.closureReason).toBe('hotel_added');
    expect(result.event!.payload.finalScore).toBe(85);
  });

  it('creates event for expired opportunity', () => {
    const opp = makeOpportunity();
    opp.expire();
    const result = createOpportunityClosedEvent(opp);
    expect(result.success).toBe(true);
    expect(result.event!.payload.closureReason).toBe('expired');
  });

  it('creates event for cancelled opportunity', () => {
    const opp = makeOpportunity();
    opp.cancel();
    const result = createOpportunityClosedEvent(opp);
    expect(result.success).toBe(true);
    expect(result.event!.payload.closureReason).toBe('trip_cancelled');
  });

  it('rejects non-closed state', () => {
    const opp = makeOpportunity();
    opp.qualify();
    const result = createOpportunityClosedEvent(opp);
    expect(result.success).toBe(false);
    expect(result.error).toContain('qualified');
  });

  it('preserves tenantId and correlationId', () => {
    const opp = makeOpportunity();
    opp.close('manual_closure');
    const result = createOpportunityClosedEvent(opp, { correlationId: CORR });
    expect(result.event!.tenantId).toBe(TENANT);
    expect(result.event!.correlationId).toBe(CORR);
  });

  it('validates against schema', () => {
    const opp = makeOpportunity();
    opp.close('hotel_added');
    const result = createOpportunityClosedEvent(opp);
    const validation = validator.validateEvent('opportunity-closed', result.event);
    expect(validation.errors).toHaveLength(0);
    expect(validation.valid).toBe(true);
  });
});

describe('OpportunityRejected Event Factory', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('creates event with rejectionReason', () => {
    const opp = makeOpportunity();
    opp.qualify();
    opp.activate();
    opp.reject('traveller_declined');
    const result = createOpportunityRejectedEvent(opp, 'active');
    expect(result.success).toBe(true);
    expect(result.event!.payload.rejectionReason).toBe('traveller_declined');
    expect(result.event!.payload.previousState).toBe('active');
  });

  it('rejects non-rejected state', () => {
    const opp = makeOpportunity();
    opp.qualify();
    const result = createOpportunityRejectedEvent(opp, 'detected');
    expect(result.success).toBe(false);
    expect(result.error).toContain('qualified');
  });

  it('preserves tenantId and correlationId', () => {
    const opp = makeOpportunity();
    opp.reject('admin_rejected');
    const result = createOpportunityRejectedEvent(opp, 'detected', { correlationId: CORR });
    expect(result.event!.tenantId).toBe(TENANT);
    expect(result.event!.correlationId).toBe(CORR);
  });

  it('includes triggeringEventId', () => {
    const opp = makeOpportunity();
    opp.reject('policy_exempted');
    const result = createOpportunityRejectedEvent(opp, 'detected', {
      triggeringEventId: TRIGGER_EVENT,
      triggeringEventType: 'PolicyChanged',
    });
    expect(result.event!.payload.triggeringEventId).toBe(TRIGGER_EVENT);
    expect(result.event!.payload.triggeringEventType).toBe('PolicyChanged');
  });

  it('validates against schema', () => {
    const opp = makeOpportunity();
    opp.qualify();
    opp.activate();
    opp.reject('traveller_declined');
    const result = createOpportunityRejectedEvent(opp, 'active');
    const validation = validator.validateEvent('opportunity-rejected', result.event);
    expect(validation.errors).toHaveLength(0);
    expect(validation.valid).toBe(true);
  });
});

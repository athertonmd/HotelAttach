/**
 * Unit tests for Project 3 domain entities.
 * Tests validation, lifecycle, and state transitions.
 */

import { describe, it, expect } from 'vitest';
import {
  Opportunity,
  OpportunityAssessment,
  OpportunityAction,
  OpportunitySuppression,
  OpportunityCommunication,
  OpportunityClosure,
  OpportunityRecommendation,
  OpportunityAuditEntry,
  derivePriority,
  SUPPRESSION_PRIORITY,
} from '../domain/index.js';

const TENANT = 'tenant-001';
const CORP = 'corp-001';
const TRAVELLER = 'trav-001';
const TRIP = 'trip-001';
const CORR = 'corr-001';

function validOpportunityInput(overrides = {}) {
  return {
    tenantId: TENANT,
    corporateId: CORP,
    travellerId: TRAVELLER,
    tripId: TRIP,
    opportunityType: 'missing_hotel' as const,
    score: 85,
    correlationId: CORR,
    ...overrides,
  };
}

describe('derivePriority', () => {
  it('80-100 is critical', () => {
    expect(derivePriority(80)).toBe('critical');
    expect(derivePriority(100)).toBe('critical');
  });
  it('60-79 is high', () => {
    expect(derivePriority(60)).toBe('high');
    expect(derivePriority(79)).toBe('high');
  });
  it('40-59 is medium', () => {
    expect(derivePriority(40)).toBe('medium');
    expect(derivePriority(59)).toBe('medium');
  });
  it('0-39 is low', () => {
    expect(derivePriority(0)).toBe('low');
    expect(derivePriority(39)).toBe('low');
  });
});

describe('Opportunity', () => {
  it('creates with valid input', () => {
    const opp = Opportunity.create(validOpportunityInput());
    expect(opp.tenantId).toBe(TENANT);
    expect(opp.lifecycleState).toBe('detected');
    expect(opp.score).toBe(85);
    expect(opp.priority).toBe('critical');
    expect(opp.isTerminal).toBe(false);
  });

  it('rejects missing tenantId', () => {
    expect(() => Opportunity.create(validOpportunityInput({ tenantId: '' }))).toThrow(
      'tenantId is required',
    );
  });

  it('rejects score < 0', () => {
    expect(() => Opportunity.create(validOpportunityInput({ score: -1 }))).toThrow(
      'score must be between 0 and 100',
    );
  });

  it('rejects score > 100', () => {
    expect(() => Opportunity.create(validOpportunityInput({ score: 101 }))).toThrow(
      'score must be between 0 and 100',
    );
  });

  it('rejects estimatedRoomNights < 1', () => {
    expect(() => Opportunity.create(validOpportunityInput({ estimatedRoomNights: 0 }))).toThrow(
      'estimatedRoomNights must be at least 1',
    );
  });

  it('lifecycle: detected → qualified', () => {
    const opp = Opportunity.create(validOpportunityInput());
    opp.qualify();
    expect(opp.lifecycleState).toBe('qualified');
    expect(opp.qualifiedAt).not.toBeNull();
  });

  it('lifecycle: qualified → active', () => {
    const opp = Opportunity.create(validOpportunityInput());
    opp.qualify();
    opp.activate();
    expect(opp.lifecycleState).toBe('active');
  });

  it('lifecycle: qualified → awaiting_action', () => {
    const opp = Opportunity.create(validOpportunityInput());
    opp.qualify();
    opp.awaitAction();
    expect(opp.lifecycleState).toBe('awaiting_action');
  });

  it('lifecycle: active → communicated → converted → fulfilled → closed', () => {
    const opp = Opportunity.create(validOpportunityInput());
    opp.qualify();
    opp.activate();
    opp.markCommunicated();
    expect(opp.lifecycleState).toBe('communicated');
    opp.convert();
    expect(opp.lifecycleState).toBe('converted');
    opp.fulfil();
    expect(opp.lifecycleState).toBe('fulfilled');
    opp.close('fulfilled');
    expect(opp.lifecycleState).toBe('closed');
    expect(opp.closureReason).toBe('fulfilled');
    expect(opp.isTerminal).toBe(true);
  });

  it('lifecycle: suppress from any non-terminal state', () => {
    const opp = Opportunity.create(validOpportunityInput());
    opp.suppress('orphan_reassociation_window', new Date('2026-08-01'));
    expect(opp.lifecycleState).toBe('suppressed');
    expect(opp.primarySuppressionReason).toBe('orphan_reassociation_window');
    expect(opp.suppressedUntil).toEqual(new Date('2026-08-01'));
  });

  it('lifecycle: cannot suppress from terminal state', () => {
    const opp = Opportunity.create(validOpportunityInput());
    opp.close('hotel_added');
    expect(() => opp.suppress('duplicate_opportunity')).toThrow('terminal state');
  });

  it('lifecycle: reject from active', () => {
    const opp = Opportunity.create(validOpportunityInput());
    opp.qualify();
    opp.activate();
    opp.reject('traveller_declined');
    expect(opp.lifecycleState).toBe('rejected');
    expect(opp.rejectionReason).toBe('traveller_declined');
    expect(opp.isTerminal).toBe(true);
  });

  it('lifecycle: expire from active', () => {
    const opp = Opportunity.create(validOpportunityInput());
    opp.qualify();
    opp.activate();
    opp.expire();
    expect(opp.lifecycleState).toBe('expired');
    expect(opp.closureReason).toBe('expired');
  });

  it('lifecycle: cancel from any non-terminal', () => {
    const opp = Opportunity.create(validOpportunityInput());
    opp.cancel();
    expect(opp.lifecycleState).toBe('cancelled');
    expect(opp.closureReason).toBe('trip_cancelled');
  });

  it('lifecycle: reopen from closed', () => {
    const opp = Opportunity.create(validOpportunityInput());
    opp.close('hotel_added');
    opp.reopen();
    expect(opp.lifecycleState).toBe('detected');
    expect(opp.reopenCount).toBe(1);
    expect(opp.closureReason).toBeNull();
  });

  it('lifecycle: cannot reopen from expired', () => {
    const opp = Opportunity.create(validOpportunityInput());
    opp.expire();
    expect(() => opp.reopen()).toThrow('Cannot reopen expired');
  });

  it('lifecycle: cannot reopen from non-terminal', () => {
    const opp = Opportunity.create(validOpportunityInput());
    expect(() => opp.reopen()).toThrow('non-terminal');
  });

  it('updateScore changes score and priority', () => {
    const opp = Opportunity.create(validOpportunityInput({ score: 50 }));
    expect(opp.priority).toBe('medium');
    opp.updateScore(90);
    expect(opp.score).toBe(90);
    expect(opp.priority).toBe('critical');
  });

  it('updateScore rejects invalid range', () => {
    const opp = Opportunity.create(validOpportunityInput());
    expect(() => opp.updateScore(101)).toThrow('score must be between 0 and 100');
  });

  it('version increments on state changes', () => {
    const opp = Opportunity.create(validOpportunityInput());
    expect(opp.version).toBe(1);
    opp.qualify();
    expect(opp.version).toBe(2);
    opp.activate();
    expect(opp.version).toBe(3);
  });
});

describe('OpportunityAssessment', () => {
  it('creates with valid input and calculates weighted score', () => {
    const a = OpportunityAssessment.create({
      opportunityId: 'opp-1',
      tenantId: TENANT,
      correlationId: CORR,
      hotelRequirementConfidence: 90,
      complianceSeverity: 60,
      revenueOpportunity: 80,
      dutyOfCareImpact: 40,
      supplierContractImpact: 0,
      timeToDeparture: 100,
    });
    // 90*0.25 + 60*0.2 + 80*0.2 + 40*0.15 + 0*0.1 + 100*0.1 = 22.5+12+16+6+0+10 = 66.5 → 67
    expect(a.totalScore).toBe(67);
    expect(a.priority).toBe('high');
  });

  it('rejects component > 100', () => {
    expect(() =>
      OpportunityAssessment.create({
        opportunityId: 'opp-1',
        tenantId: TENANT,
        correlationId: CORR,
        hotelRequirementConfidence: 110,
        complianceSeverity: 0,
        revenueOpportunity: 0,
        dutyOfCareImpact: 0,
        supplierContractImpact: 0,
        timeToDeparture: 0,
      }),
    ).toThrow('between 0 and 100');
  });

  it('caps total score at 100', () => {
    const a = OpportunityAssessment.create({
      opportunityId: 'opp-1',
      tenantId: TENANT,
      correlationId: CORR,
      hotelRequirementConfidence: 100,
      complianceSeverity: 100,
      revenueOpportunity: 100,
      dutyOfCareImpact: 100,
      supplierContractImpact: 100,
      timeToDeparture: 100,
    });
    expect(a.totalScore).toBe(100);
  });
});

describe('OpportunityAction', () => {
  it('creates with valid input', () => {
    const a = OpportunityAction.create({
      opportunityId: 'opp-1',
      tenantId: TENANT,
      fromState: 'detected',
      toState: 'qualified',
      trigger: 'scoring_complete',
      triggerSource: 'system',
      correlationId: CORR,
    });
    expect(a.fromState).toBe('detected');
    expect(a.toState).toBe('qualified');
    expect(a.triggerSource).toBe('system');
  });

  it('rejects missing required fields', () => {
    expect(() =>
      OpportunityAction.create({
        opportunityId: '',
        tenantId: TENANT,
        fromState: 'detected',
        toState: 'qualified',
        trigger: 'x',
        triggerSource: 'system',
        correlationId: CORR,
      }),
    ).toThrow('opportunityId is required');
  });
});

describe('OpportunitySuppression', () => {
  it('creates with correct priority', () => {
    const s = OpportunitySuppression.create({
      opportunityId: 'opp-1',
      tenantId: TENANT,
      suppressionReason: 'orphan_reassociation_window',
    });
    expect(s.isActive).toBe(true);
    expect(s.suppressionPriority).toBe(SUPPRESSION_PRIORITY['orphan_reassociation_window']);
    expect(s.suppressionPriority).toBe(4);
  });

  it('resolves correctly', () => {
    const s = OpportunitySuppression.create({
      opportunityId: 'opp-1',
      tenantId: TENANT,
      suppressionReason: 'communication_cooldown',
      suppressedUntil: new Date('2026-08-01'),
    });
    s.resolve('cooldown_expired');
    expect(s.isActive).toBe(false);
    expect(s.resolutionTrigger).toBe('cooldown_expired');
  });

  it('cannot resolve twice', () => {
    const s = OpportunitySuppression.create({
      opportunityId: 'opp-1',
      tenantId: TENANT,
      suppressionReason: 'manual_suppression',
    });
    s.resolve('admin_release');
    expect(() => s.resolve('again')).toThrow('already resolved');
  });

  it('isExpired checks time correctly', () => {
    const s = OpportunitySuppression.create({
      opportunityId: 'opp-1',
      tenantId: TENANT,
      suppressionReason: 'traveller_recently_declined',
      suppressedUntil: new Date('2020-01-01'),
    });
    expect(s.isExpired(new Date('2025-01-01'))).toBe(true);
    expect(s.isExpired(new Date('2019-01-01'))).toBe(false);
  });
});

describe('OpportunityCommunication', () => {
  it('creates with valid input', () => {
    const c = OpportunityCommunication.create({
      opportunityId: 'opp-1',
      tenantId: TENANT,
      travellerId: TRAVELLER,
      communicationType: 'initial_contact',
      channel: 'email',
      correlationId: CORR,
    });
    expect(c.communicationType).toBe('initial_contact');
    expect(c.communicationOutcome).toBeNull();
  });

  it('records outcome', () => {
    const c = OpportunityCommunication.create({
      opportunityId: 'opp-1',
      tenantId: TENANT,
      travellerId: TRAVELLER,
      communicationType: 'reminder',
      channel: 'sms',
      correlationId: CORR,
    });
    c.recordOutcome('accepted');
    expect(c.communicationOutcome).toBe('accepted');
    expect(c.responseReceivedAt).not.toBeNull();
  });
});

describe('OpportunityClosure', () => {
  it('creates for closed with closureReason', () => {
    const c = OpportunityClosure.create({
      opportunityId: 'opp-1',
      tenantId: TENANT,
      terminalState: 'closed',
      closureReason: 'hotel_added',
      correlationId: CORR,
    });
    expect(c.terminalState).toBe('closed');
    expect(c.closureReason).toBe('hotel_added');
  });

  it('creates for rejected with rejectionReason', () => {
    const c = OpportunityClosure.create({
      opportunityId: 'opp-1',
      tenantId: TENANT,
      terminalState: 'rejected',
      rejectionReason: 'traveller_declined',
      correlationId: CORR,
    });
    expect(c.rejectionReason).toBe('traveller_declined');
  });

  it('rejects closed without closureReason', () => {
    expect(() =>
      OpportunityClosure.create({
        opportunityId: 'opp-1',
        tenantId: TENANT,
        terminalState: 'closed',
        correlationId: CORR,
      }),
    ).toThrow('closureReason is required');
  });

  it('rejects rejected without rejectionReason', () => {
    expect(() =>
      OpportunityClosure.create({
        opportunityId: 'opp-1',
        tenantId: TENANT,
        terminalState: 'rejected',
        correlationId: CORR,
      }),
    ).toThrow('rejectionReason is required');
  });

  it('invalidate marks closure as invalidated', () => {
    const c = OpportunityClosure.create({
      opportunityId: 'opp-1',
      tenantId: TENANT,
      terminalState: 'closed',
      closureReason: 'hotel_added',
      correlationId: CORR,
    });
    c.invalidate('event-123');
    expect(c.invalidatedAt).not.toBeNull();
    expect(c.invalidationEventId).toBe('event-123');
  });

  it('cannot invalidate twice', () => {
    const c = OpportunityClosure.create({
      opportunityId: 'opp-1',
      tenantId: TENANT,
      terminalState: 'closed',
      closureReason: 'hotel_added',
      correlationId: CORR,
    });
    c.invalidate('event-1');
    expect(() => c.invalidate('event-2')).toThrow('already invalidated');
  });
});

describe('OpportunityRecommendation', () => {
  it('creates with valid input', () => {
    const r = OpportunityRecommendation.create({
      opportunityId: 'opp-1',
      tenantId: TENANT,
      recommendationType: 'book_hotel',
      recommendationText: 'Book hotel for 4 nights in Paris',
      priority: 'high',
      correlationId: CORR,
    });
    expect(r.isActive).toBe(true);
    expect(r.recommendationType).toBe('book_hotel');
  });

  it('rejects text > 1000 chars', () => {
    expect(() =>
      OpportunityRecommendation.create({
        opportunityId: 'opp-1',
        tenantId: TENANT,
        recommendationType: 'book_hotel',
        recommendationText: 'x'.repeat(1001),
        priority: 'high',
        correlationId: CORR,
      }),
    ).toThrow('1000 characters');
  });

  it('supersede marks inactive', () => {
    const r = OpportunityRecommendation.create({
      opportunityId: 'opp-1',
      tenantId: TENANT,
      recommendationType: 'book_hotel',
      recommendationText: 'Book hotel',
      priority: 'high',
      correlationId: CORR,
    });
    r.supersede('new-rec-id');
    expect(r.isActive).toBe(false);
    expect(r.supersededBy).toBe('new-rec-id');
  });

  it('cannot supersede already inactive', () => {
    const r = OpportunityRecommendation.create({
      opportunityId: 'opp-1',
      tenantId: TENANT,
      recommendationType: 'book_hotel',
      recommendationText: 'Book hotel',
      priority: 'high',
      correlationId: CORR,
    });
    r.supersede('new-1');
    expect(() => r.supersede('new-2')).toThrow('already inactive');
  });
});

describe('OpportunityAuditEntry', () => {
  it('creates with valid input', () => {
    const a = OpportunityAuditEntry.create({
      opportunityId: 'opp-1',
      tenantId: TENANT,
      entityType: 'Opportunity',
      entityId: 'opp-1',
      action: 'state_transition',
      actorType: 'system',
      correlationId: CORR,
    });
    expect(a.entityType).toBe('Opportunity');
    expect(a.action).toBe('state_transition');
  });

  it('rejects missing required fields', () => {
    expect(() =>
      OpportunityAuditEntry.create({
        opportunityId: 'opp-1',
        tenantId: TENANT,
        entityType: '',
        entityId: 'opp-1',
        action: 'state_transition',
        actorType: 'system',
        correlationId: CORR,
      }),
    ).toThrow('entityType is required');
  });
});

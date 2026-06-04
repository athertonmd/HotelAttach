/**
 * Unit tests for Traveller Engagement domain entities.
 * Tests validation, lifecycle, and state transitions.
 */

import { describe, it, expect } from 'vitest';
import {
  Communication,
  TravellerAction,
  TravellerResponse,
  BookingRequest,
  AgentEscalation,
  TravellerPreference,
  MAX_RETRY_COUNT,
  TOKEN_EXPIRY_DAYS,
} from '../domain/index.js';

const TENANT = 'tenant-001';
const CORP = 'corp-001';
const TRAVELLER = 'trav-001';
const OPP = 'opp-001';
const TRIP = 'trip-001';
const COMM = 'comm-001';

function validCommunicationInput(overrides = {}) {
  return {
    tenantId: TENANT,
    corporateId: CORP,
    travellerId: TRAVELLER,
    opportunityId: OPP,
    communicationType: 'initial_contact' as const,
    channel: 'email' as const,
    correlationId: 'corr-001',
    ...overrides,
  };
}

describe('Communication', () => {
  it('creates with valid input', () => {
    const c = Communication.create(validCommunicationInput());
    expect(c.tenantId).toBe(TENANT);
    expect(c.status).toBe('pending');
    expect(c.retryCount).toBe(0);
    expect(c.scheduledAt).toBeNull();
    expect(c.sentAt).toBeNull();
  });

  it('rejects missing tenantId', () => {
    expect(() => Communication.create(validCommunicationInput({ tenantId: '' }))).toThrow(
      'tenantId is required',
    );
  });

  it('schedule transitions pending → scheduled', () => {
    const c = Communication.create(validCommunicationInput());
    const schedDate = new Date('2026-01-15');
    c.schedule(schedDate);
    expect(c.status).toBe('scheduled');
    expect(c.scheduledAt).toEqual(schedDate);
  });

  it('send transitions scheduled → sent', () => {
    const c = Communication.create(validCommunicationInput());
    c.schedule(new Date());
    c.send();
    expect(c.status).toBe('sent');
    expect(c.sentAt).not.toBeNull();
  });

  it('send transitions pending → sent (immediate dispatch)', () => {
    const c = Communication.create(validCommunicationInput());
    c.send();
    expect(c.status).toBe('sent');
  });

  it('markOpened transitions sent → opened', () => {
    const c = Communication.create(validCommunicationInput());
    c.send();
    c.markOpened();
    expect(c.status).toBe('opened');
  });

  it('markClicked transitions opened → clicked', () => {
    const c = Communication.create(validCommunicationInput());
    c.send();
    c.markOpened();
    c.markClicked();
    expect(c.status).toBe('clicked');
  });

  it('markResponded transitions sent → responded', () => {
    const c = Communication.create(validCommunicationInput());
    c.send();
    c.markResponded();
    expect(c.status).toBe('responded');
  });

  it('markResponded transitions opened → responded', () => {
    const c = Communication.create(validCommunicationInput());
    c.send();
    c.markOpened();
    c.markResponded();
    expect(c.status).toBe('responded');
  });

  it('markBounced transitions sent → bounced and increments retryCount', () => {
    const c = Communication.create(validCommunicationInput());
    c.send();
    c.markBounced();
    expect(c.status).toBe('bounced');
    expect(c.retryCount).toBe(1);
  });

  it('canRetry returns true when retryCount < MAX_RETRY_COUNT', () => {
    const c = Communication.create(validCommunicationInput());
    expect(c.canRetry()).toBe(true);
  });

  it('canRetry returns false when retryCount >= MAX_RETRY_COUNT', () => {
    const c = Communication.create(validCommunicationInput());
    c.send();
    c.markBounced();
    expect(c.retryCount).toBe(MAX_RETRY_COUNT);
    expect(c.canRetry()).toBe(false);
  });

  it('needsEscalation returns true when bounced and retry exhausted', () => {
    const c = Communication.create(validCommunicationInput());
    c.send();
    c.markBounced();
    expect(c.needsEscalation()).toBe(true);
  });

  it('needsEscalation returns false when not bounced', () => {
    const c = Communication.create(validCommunicationInput());
    c.send();
    expect(c.needsEscalation()).toBe(false);
  });

  it('cancel from active state', () => {
    const c = Communication.create(validCommunicationInput());
    c.send();
    c.markOpened();
    c.cancel();
    expect(c.status).toBe('cancelled');
  });

  it('rejects invalid transition (cancelled → sent)', () => {
    const c = Communication.create(validCommunicationInput());
    c.cancel();
    expect(() => c.send()).toThrow();
  });

  it('suppress from active state', () => {
    const c = Communication.create(validCommunicationInput());
    c.schedule(new Date());
    c.suppress();
    expect(c.status).toBe('suppressed');
  });

  it('unsuppress transitions suppressed → scheduled', () => {
    const c = Communication.create(validCommunicationInput());
    c.schedule(new Date());
    c.suppress();
    c.unsuppress();
    expect(c.status).toBe('scheduled');
  });
});

describe('TravellerAction', () => {
  it('creates with 7-day token expiry by default', () => {
    const before = new Date();
    const action = TravellerAction.create({
      communicationId: COMM,
      tenantId: TENANT,
      travellerId: TRAVELLER,
    });
    const expectedExpiry = new Date(before.getTime() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    // Allow a small tolerance for test execution time
    expect(action.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedExpiry.getTime() - 1000);
    expect(action.expiresAt.getTime()).toBeLessThanOrEqual(expectedExpiry.getTime() + 1000);
    expect(action.isUsed).toBe(false);
  });

  it('uses departure date when earlier than 7 days', () => {
    const departureDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
    const action = TravellerAction.create({
      communicationId: COMM,
      tenantId: TENANT,
      travellerId: TRAVELLER,
      departureDate,
    });
    expect(action.expiresAt).toEqual(departureDate);
  });

  it('uses 7-day expiry when departure is further away', () => {
    const departureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const before = new Date();
    const action = TravellerAction.create({
      communicationId: COMM,
      tenantId: TENANT,
      travellerId: TRAVELLER,
      departureDate,
    });
    const expectedExpiry = new Date(before.getTime() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    expect(action.expiresAt.getTime()).toBeLessThanOrEqual(expectedExpiry.getTime() + 1000);
    expect(action.expiresAt.getTime()).toBeGreaterThanOrEqual(expectedExpiry.getTime() - 1000);
  });

  it('use marks as used', () => {
    const action = TravellerAction.create({
      communicationId: COMM,
      tenantId: TENANT,
      travellerId: TRAVELLER,
    });
    action.use();
    expect(action.isUsed).toBe(true);
    expect(action.usedAt).not.toBeNull();
  });

  it('cannot use twice', () => {
    const action = TravellerAction.create({
      communicationId: COMM,
      tenantId: TENANT,
      travellerId: TRAVELLER,
    });
    action.use();
    expect(() => action.use()).toThrow('already been used');
  });

  it('isExpired returns true for past expiry', () => {
    const action = TravellerAction.create({
      communicationId: COMM,
      tenantId: TENANT,
      travellerId: TRAVELLER,
    });
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    expect(action.isExpired(futureDate)).toBe(true);
  });

  it('isExpired returns false before expiry', () => {
    const action = TravellerAction.create({
      communicationId: COMM,
      tenantId: TENANT,
      travellerId: TRAVELLER,
    });
    const now = new Date();
    expect(action.isExpired(now)).toBe(false);
  });

  it('rejects missing tenantId', () => {
    expect(() =>
      TravellerAction.create({
        communicationId: COMM,
        tenantId: '',
        travellerId: TRAVELLER,
      }),
    ).toThrow('tenantId is required');
  });
});

describe('TravellerResponse', () => {
  it('creates with valid input', () => {
    const r = TravellerResponse.create({
      communicationId: COMM,
      opportunityId: OPP,
      tenantId: TENANT,
      travellerId: TRAVELLER,
      responseType: 'accepted',
      notes: 'Will book through TMC',
    });
    expect(r.responseType).toBe('accepted');
    expect(r.notes).toBe('Will book through TMC');
    expect(r.respondedAt).toBeInstanceOf(Date);
  });

  it('rejects notes exceeding 1000 characters', () => {
    expect(() =>
      TravellerResponse.create({
        communicationId: COMM,
        opportunityId: OPP,
        tenantId: TENANT,
        travellerId: TRAVELLER,
        responseType: 'declined',
        notes: 'x'.repeat(1001),
      }),
    ).toThrow('1000 characters');
  });

  it('rejects missing tenantId', () => {
    expect(() =>
      TravellerResponse.create({
        communicationId: COMM,
        opportunityId: OPP,
        tenantId: '',
        travellerId: TRAVELLER,
        responseType: 'accepted',
      }),
    ).toThrow('tenantId is required');
  });

  it('allows null notes', () => {
    const r = TravellerResponse.create({
      communicationId: COMM,
      opportunityId: OPP,
      tenantId: TENANT,
      travellerId: TRAVELLER,
      responseType: 'confirmed_external',
    });
    expect(r.notes).toBeNull();
  });
});

describe('BookingRequest', () => {
  it('creates with valid input', () => {
    const br = BookingRequest.create({
      opportunityId: OPP,
      tenantId: TENANT,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      destinationCity: 'Paris',
      destinationCountry: 'France',
      requestedNights: 3,
    });
    expect(br.status).toBe('created');
    expect(br.destinationCity).toBe('Paris');
    expect(br.requestedNights).toBe(3);
  });

  it('lifecycle: created → assigned → processing → completed', () => {
    const br = BookingRequest.create({
      opportunityId: OPP,
      tenantId: TENANT,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
    });
    br.assign();
    expect(br.status).toBe('assigned');
    br.process();
    expect(br.status).toBe('processing');
    br.complete();
    expect(br.status).toBe('completed');
  });

  it('processing → failed', () => {
    const br = BookingRequest.create({
      opportunityId: OPP,
      tenantId: TENANT,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
    });
    br.assign();
    br.process();
    br.fail();
    expect(br.status).toBe('failed');
  });

  it('cancel from non-terminal state', () => {
    const br = BookingRequest.create({
      opportunityId: OPP,
      tenantId: TENANT,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
    });
    br.assign();
    br.cancel();
    expect(br.status).toBe('cancelled');
  });

  it('rejects invalid transition (created → processing)', () => {
    const br = BookingRequest.create({
      opportunityId: OPP,
      tenantId: TENANT,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
    });
    expect(() => br.process()).toThrow();
  });

  it('rejects cancel from terminal state', () => {
    const br = BookingRequest.create({
      opportunityId: OPP,
      tenantId: TENANT,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
    });
    br.assign();
    br.process();
    br.complete();
    expect(() => br.cancel()).toThrow('terminal state');
  });

  it('rejects missing tenantId', () => {
    expect(() =>
      BookingRequest.create({
        opportunityId: OPP,
        tenantId: '',
        corporateId: CORP,
        travellerId: TRAVELLER,
        tripId: TRIP,
      }),
    ).toThrow('tenantId is required');
  });
});

describe('AgentEscalation', () => {
  it('creates with valid input', () => {
    const e = AgentEscalation.create({
      opportunityId: OPP,
      tenantId: TENANT,
      travellerId: TRAVELLER,
      communicationId: COMM,
      reason: 'delivery_bounced',
      priority: 'high',
    });
    expect(e.status).toBe('pending');
    expect(e.reason).toBe('delivery_bounced');
    expect(e.assignedAgentId).toBeNull();
  });

  it('assign transitions pending → assigned', () => {
    const e = AgentEscalation.create({
      opportunityId: OPP,
      tenantId: TENANT,
      travellerId: TRAVELLER,
      communicationId: COMM,
      reason: 'high_value_opportunity',
      priority: 'critical',
    });
    e.assign('agent-001');
    expect(e.status).toBe('assigned');
    expect(e.assignedAgentId).toBe('agent-001');
  });

  it('resolve transitions assigned → resolved', () => {
    const e = AgentEscalation.create({
      opportunityId: OPP,
      tenantId: TENANT,
      travellerId: TRAVELLER,
      communicationId: COMM,
      reason: 'executive_traveller',
      priority: 'medium',
    });
    e.assign('agent-001');
    e.resolve();
    expect(e.status).toBe('resolved');
  });

  it('rejects resolve from pending', () => {
    const e = AgentEscalation.create({
      opportunityId: OPP,
      tenantId: TENANT,
      travellerId: TRAVELLER,
      communicationId: COMM,
      reason: 'trip_within_48h',
      priority: 'critical',
    });
    expect(() => e.resolve()).toThrow();
  });

  it('rejects missing tenantId', () => {
    expect(() =>
      AgentEscalation.create({
        opportunityId: OPP,
        tenantId: '',
        travellerId: TRAVELLER,
        communicationId: COMM,
        reason: 'manual_escalation',
        priority: 'low',
      }),
    ).toThrow('tenantId is required');
  });
});

describe('TravellerPreference', () => {
  it('creates with defaults', () => {
    const p = TravellerPreference.create({
      tenantId: TENANT,
      travellerId: TRAVELLER,
    });
    expect(p.emailOptedOut).toBe(false);
    expect(p.smsOptedOut).toBe(false);
    expect(p.suppressedUntil).toBeNull();
  });

  it('unsubscribeEmail blocks email channel', () => {
    const p = TravellerPreference.create({
      tenantId: TENANT,
      travellerId: TRAVELLER,
    });
    p.unsubscribeEmail();
    expect(p.emailOptedOut).toBe(true);
    expect(p.isChannelBlocked('email')).toBe(true);
    expect(p.isChannelBlocked('sms')).toBe(false);
  });

  it('unsubscribeSms blocks sms channel', () => {
    const p = TravellerPreference.create({
      tenantId: TENANT,
      travellerId: TRAVELLER,
    });
    p.unsubscribeSms();
    expect(p.smsOptedOut).toBe(true);
    expect(p.isChannelBlocked('sms')).toBe(true);
  });

  it('portal and agent_call are never blocked', () => {
    const p = TravellerPreference.create({
      tenantId: TENANT,
      travellerId: TRAVELLER,
    });
    p.unsubscribeEmail();
    p.unsubscribeSms();
    expect(p.isChannelBlocked('portal')).toBe(false);
    expect(p.isChannelBlocked('agent_call')).toBe(false);
  });

  it('isSuppressed returns true during suppression window', () => {
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const p = TravellerPreference.create({
      tenantId: TENANT,
      travellerId: TRAVELLER,
      suppressedUntil: futureDate,
    });
    expect(p.isSuppressed(new Date())).toBe(true);
  });

  it('isSuppressed returns false after suppression window', () => {
    const pastDate = new Date('2020-01-01');
    const p = TravellerPreference.create({
      tenantId: TENANT,
      travellerId: TRAVELLER,
      suppressedUntil: pastDate,
    });
    expect(p.isSuppressed(new Date())).toBe(false);
  });

  it('isSuppressed returns false when no suppression set', () => {
    const p = TravellerPreference.create({
      tenantId: TENANT,
      travellerId: TRAVELLER,
    });
    expect(p.isSuppressed(new Date())).toBe(false);
  });

  it('rejects missing tenantId', () => {
    expect(() =>
      TravellerPreference.create({
        tenantId: '',
        travellerId: TRAVELLER,
      }),
    ).toThrow('tenantId is required');
  });
});

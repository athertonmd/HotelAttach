/**
 * Unit tests for Traveller Engagement event factories.
 * Validates event creation, schema conformance, and error handling.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { SchemaValidator } from '@hci/validation';
import { Communication } from '../domain/communication.js';
import { TravellerResponse } from '../domain/traveller-response.js';
import { BookingRequest } from '../domain/booking-request.js';
import {
  createCommunicationSentEvent,
  createTravellerRespondedEvent,
  createBookingRequestCreatedEvent,
} from '../events/engagement-event-factory.js';

const TENANT = 'aaaa1111-aaaa-4000-8000-aaaaaaaaaaaa';
const CORP = 'bbbb2222-bbbb-4000-8000-bbbbbbbbbbbb';
const TRAVELLER = 'cccc3333-cccc-4000-8000-cccccccccccc';
const OPP = 'dddd4444-dddd-4000-8000-dddddddddddd';
const TRIP = 'eeee5555-eeee-4000-8000-eeeeeeeeeeee';
const CORR = 'ffff6666-ffff-4000-8000-ffffffffffff';

function makeSentCommunication() {
  const comm = Communication.create({
    tenantId: TENANT,
    corporateId: CORP,
    travellerId: TRAVELLER,
    opportunityId: OPP,
    communicationType: 'initial_contact',
    channel: 'email',
    correlationId: CORR,
  });
  comm.send();
  return comm;
}

function makePendingCommunication() {
  return Communication.create({
    tenantId: TENANT,
    corporateId: CORP,
    travellerId: TRAVELLER,
    opportunityId: OPP,
    communicationType: 'reminder',
    channel: 'sms',
    correlationId: CORR,
  });
}

function makeTravellerResponse() {
  return TravellerResponse.create({
    communicationId: 'aaaa2222-aaaa-4000-8000-aaaaaaaaaaaa',
    opportunityId: OPP,
    tenantId: TENANT,
    travellerId: TRAVELLER,
    responseType: 'accepted',
  });
}

function makeBookingRequest() {
  return BookingRequest.create({
    opportunityId: OPP,
    tenantId: TENANT,
    corporateId: CORP,
    travellerId: TRAVELLER,
    tripId: TRIP,
    destinationCity: 'Paris',
    destinationCountry: 'FR',
    requestedNights: 3,
  });
}

function makeAssignedBookingRequest() {
  const req = BookingRequest.create({
    opportunityId: OPP,
    tenantId: TENANT,
    corporateId: CORP,
    travellerId: TRAVELLER,
    tripId: TRIP,
  });
  req.assign();
  return req;
}

describe('CommunicationSent Event Factory', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('creates event from sent Communication', () => {
    const comm = makeSentCommunication();
    const result = createCommunicationSentEvent(comm);
    expect(result.success).toBe(true);
    expect(result.event).toBeDefined();
    expect(result.event!.eventType).toBe('CommunicationSent');
    expect(result.event!.payload.communicationType).toBe('initial_contact');
    expect(result.event!.payload.channel).toBe('email');
  });

  it('validates against schema', () => {
    const comm = makeSentCommunication();
    const result = createCommunicationSentEvent(comm);
    const validation = validator.validateEvent('communication-sent', result.event);
    expect(validation.errors).toHaveLength(0);
    expect(validation.valid).toBe(true);
  });

  it('rejects pending Communication', () => {
    const comm = makePendingCommunication();
    const result = createCommunicationSentEvent(comm);
    expect(result.success).toBe(false);
    expect(result.error).toContain('pending');
  });

  it('preserves tenantId in envelope and payload', () => {
    const comm = makeSentCommunication();
    const result = createCommunicationSentEvent(comm);
    expect(result.event!.tenantId).toBe(TENANT);
    expect(result.event!.payload.tenantId).toBe(TENANT);
  });

  it('preserves correlationId', () => {
    const comm = makeSentCommunication();
    const result = createCommunicationSentEvent(comm, { correlationId: CORR });
    expect(result.event!.correlationId).toBe(CORR);
  });

  it('preserves opportunityId in payload', () => {
    const comm = makeSentCommunication();
    const result = createCommunicationSentEvent(comm);
    expect(result.event!.payload.opportunityId).toBe(OPP);
  });

  it('preserves travellerId in payload', () => {
    const comm = makeSentCommunication();
    const result = createCommunicationSentEvent(comm);
    expect(result.event!.payload.travellerId).toBe(TRAVELLER);
  });

  it('includes triggeringEventId when provided', () => {
    const comm = makeSentCommunication();
    const triggeringId = 'aaaa3333-aaaa-4000-8000-aaaaaaaaaaaa';
    const result = createCommunicationSentEvent(comm, {
      triggeringEventId: triggeringId,
      triggeringEventType: 'OpportunityCreated',
    });
    expect(result.event!.payload.triggeringEventId).toBe(triggeringId);
    expect(result.event!.payload.triggeringEventType).toBe('OpportunityCreated');
  });
});

describe('TravellerResponded Event Factory', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('creates event from valid TravellerResponse', () => {
    const response = makeTravellerResponse();
    const result = createTravellerRespondedEvent(response);
    expect(result.success).toBe(true);
    expect(result.event).toBeDefined();
    expect(result.event!.eventType).toBe('TravellerResponded');
    expect(result.event!.payload.responseType).toBe('accepted');
  });

  it('validates against schema', () => {
    const response = makeTravellerResponse();
    const result = createTravellerRespondedEvent(response);
    const validation = validator.validateEvent('traveller-responded', result.event);
    expect(validation.errors).toHaveLength(0);
    expect(validation.valid).toBe(true);
  });

  it('preserves tenantId in envelope and payload', () => {
    const response = makeTravellerResponse();
    const result = createTravellerRespondedEvent(response);
    expect(result.event!.tenantId).toBe(TENANT);
    expect(result.event!.payload.tenantId).toBe(TENANT);
  });

  it('preserves correlationId', () => {
    const response = makeTravellerResponse();
    const result = createTravellerRespondedEvent(response, { correlationId: CORR });
    expect(result.event!.correlationId).toBe(CORR);
  });

  it('preserves opportunityId in payload', () => {
    const response = makeTravellerResponse();
    const result = createTravellerRespondedEvent(response);
    expect(result.event!.payload.opportunityId).toBe(OPP);
  });

  it('preserves travellerId in payload', () => {
    const response = makeTravellerResponse();
    const result = createTravellerRespondedEvent(response);
    expect(result.event!.payload.travellerId).toBe(TRAVELLER);
  });

  it('includes triggeringEventId when provided', () => {
    const response = makeTravellerResponse();
    const triggeringId = 'aaaa3333-aaaa-4000-8000-aaaaaaaaaaaa';
    const result = createTravellerRespondedEvent(response, {
      triggeringEventId: triggeringId,
      triggeringEventType: 'CommunicationSent',
    });
    expect(result.event!.payload.triggeringEventId).toBe(triggeringId);
    expect(result.event!.payload.triggeringEventType).toBe('CommunicationSent');
  });
});

describe('BookingRequestCreated Event Factory', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('creates event from created BookingRequest', () => {
    const request = makeBookingRequest();
    const result = createBookingRequestCreatedEvent(request);
    expect(result.success).toBe(true);
    expect(result.event).toBeDefined();
    expect(result.event!.eventType).toBe('BookingRequestCreated');
    expect(result.event!.payload.requestStatus).toBe('created');
  });

  it('validates against schema', () => {
    const request = makeBookingRequest();
    const result = createBookingRequestCreatedEvent(request);
    const validation = validator.validateEvent('booking-request-created', result.event);
    expect(validation.errors).toHaveLength(0);
    expect(validation.valid).toBe(true);
  });

  it('rejects assigned BookingRequest', () => {
    const request = makeAssignedBookingRequest();
    const result = createBookingRequestCreatedEvent(request);
    expect(result.success).toBe(false);
    expect(result.error).toContain('assigned');
  });

  it('preserves tenantId in envelope and payload', () => {
    const request = makeBookingRequest();
    const result = createBookingRequestCreatedEvent(request);
    expect(result.event!.tenantId).toBe(TENANT);
    expect(result.event!.payload.tenantId).toBe(TENANT);
  });

  it('preserves correlationId', () => {
    const request = makeBookingRequest();
    const result = createBookingRequestCreatedEvent(request, { correlationId: CORR });
    expect(result.event!.correlationId).toBe(CORR);
  });

  it('preserves opportunityId in payload', () => {
    const request = makeBookingRequest();
    const result = createBookingRequestCreatedEvent(request);
    expect(result.event!.payload.opportunityId).toBe(OPP);
  });

  it('preserves travellerId in payload', () => {
    const request = makeBookingRequest();
    const result = createBookingRequestCreatedEvent(request);
    expect(result.event!.payload.travellerId).toBe(TRAVELLER);
  });

  it('includes triggeringEventId when provided', () => {
    const request = makeBookingRequest();
    const triggeringId = 'aaaa3333-aaaa-4000-8000-aaaaaaaaaaaa';
    const result = createBookingRequestCreatedEvent(request, {
      triggeringEventId: triggeringId,
      triggeringEventType: 'TravellerResponded',
    });
    expect(result.event!.payload.triggeringEventId).toBe(triggeringId);
    expect(result.event!.payload.triggeringEventType).toBe('TravellerResponded');
  });
});

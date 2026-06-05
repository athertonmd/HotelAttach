/**
 * Contract tests for HCI event schemas.
 *
 * Validates that:
 * 1. All schemas compile with Ajv
 * 2. Valid fixtures pass validation
 * 3. Invalid fixtures fail validation
 * 4. Event type constants match schema eventType.const values
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SchemaValidator, SCHEMA_FILES, type SchemaName } from '@hci/validation';
import { EVENT_TYPES } from '@hci/event-contracts';

const currentDir = dirname(fileURLToPath(import.meta.url));
const fixturesDir = resolve(currentDir, '..', 'fixtures');

function loadFixture(subdir: string, filename: string): unknown {
  const filePath = resolve(fixturesDir, subdir, filename);
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

describe('Schema Compilation', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('should instantiate SchemaValidator without errors (all schemas compile)', () => {
    expect(validator).toBeDefined();
  });

  it('should have compiled all expected schemas', () => {
    const expectedSchemas: SchemaName[] = [
      'envelope',
      'pnr-created',
      'pnr-updated',
      'trip-created',
      'trip-updated',
      'segment-added',
      'segment-updated',
      'segment-removed',
      'traveller-created',
      'traveller-updated',
      'booking-created',
      'booking-updated',
      'booking-cancelled',
      'hotel-matched',
      'hotel-rejected',
      'hotel-coverage-updated',
      'hotel-orphan-detected',
      'opportunity-created',
      'opportunity-updated',
      'opportunity-closed',
      'opportunity-rejected',
      'communication-sent',
      'traveller-responded',
      'booking-request-created',
      'behaviour-profile-updated',
      'archetype-assigned',
      'booking-attributed',
      'behaviour-drift-detected',
      'fatigue-threshold-crossed',
      'action-recommended',
      'communication-suppressed',
      'communication-suppressed-by-fatigue',
      'prediction-outcome-recorded',
    ];

    for (const name of expectedSchemas) {
      expect(SCHEMA_FILES[name]).toBeDefined();
    }
  });
});

describe('Event Type Constants', () => {
  let validator: SchemaValidator;
  let envelopeSchema: Record<string, unknown>;

  beforeAll(() => {
    validator = new SchemaValidator();
    const schemasDir = resolve(currentDir, '..', '..', 'schemas');
    envelopeSchema = JSON.parse(readFileSync(resolve(schemasDir, 'envelope.schema.json'), 'utf-8'));
  });

  it('should have EVENT_TYPES matching envelope schema eventType enum', () => {
    const schemaEnum = (envelopeSchema as { properties: { eventType: { enum: string[] } } })
      .properties.eventType.enum;

    const constantValues = Object.values(EVENT_TYPES);

    // Every constant should be in the schema enum
    for (const value of constantValues) {
      expect(schemaEnum).toContain(value);
    }

    // Every schema enum value should be in the constants
    for (const value of schemaEnum) {
      expect(constantValues).toContain(value);
    }
  });

  it('should match const values in individual event schemas', () => {
    const schemasDir = resolve(currentDir, '..', '..', 'schemas');

    const schemaToEventType: Record<string, string> = {
      'pnr-created.schema.json': 'PNRCreated',
      'pnr-updated.schema.json': 'PNRUpdated',
      'trip-created.schema.json': 'TripCreated',
      'trip-updated.schema.json': 'TripUpdated',
      'segment-added.schema.json': 'SegmentAdded',
      'segment-updated.schema.json': 'SegmentUpdated',
      'segment-removed.schema.json': 'SegmentRemoved',
      'traveller-created.schema.json': 'TravellerCreated',
      'traveller-updated.schema.json': 'TravellerUpdated',
      'booking-created.schema.json': 'BookingCreated',
      'booking-updated.schema.json': 'BookingUpdated',
      'booking-cancelled.schema.json': 'BookingCancelled',
      'hotel-matched.schema.json': 'HotelMatched',
      'hotel-rejected.schema.json': 'HotelRejected',
      'hotel-coverage-updated.schema.json': 'HotelCoverageUpdated',
      'hotel-orphan-detected.schema.json': 'HotelOrphanDetected',
      'opportunity-created.schema.json': 'OpportunityCreated',
      'opportunity-updated.schema.json': 'OpportunityUpdated',
      'opportunity-closed.schema.json': 'OpportunityClosed',
      'opportunity-rejected.schema.json': 'OpportunityRejected',
      'communication-sent.schema.json': 'CommunicationSent',
      'traveller-responded.schema.json': 'TravellerResponded',
      'booking-request-created.schema.json': 'BookingRequestCreated',
      'behaviour-profile-updated.schema.json': 'BehaviourProfileUpdated',
      'archetype-assigned.schema.json': 'ArchetypeAssigned',
      'booking-attributed.schema.json': 'BookingAttributed',
      'behaviour-drift-detected.schema.json': 'BehaviourDriftDetected',
      'fatigue-threshold-crossed.schema.json': 'FatigueThresholdCrossed',
      'action-recommended.schema.json': 'ActionRecommended',
      'communication-suppressed.schema.json': 'CommunicationSuppressed',
      'communication-suppressed-by-fatigue.schema.json': 'CommunicationSuppressedByFatigue',
      'prediction-outcome-recorded.schema.json': 'PredictionOutcomeRecorded',
    };

    for (const [file, expectedType] of Object.entries(schemaToEventType)) {
      const schema = JSON.parse(readFileSync(resolve(schemasDir, file), 'utf-8'));
      const constValue = schema.properties?.eventType?.const;
      expect(constValue).toBe(expectedType);
    }
  });
});

describe('Valid Fixtures — Envelope', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('should validate a valid envelope', () => {
    const data = loadFixture('valid', 'envelope.json');
    const result = validator.validateEnvelope(data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('Valid Fixtures — PNR Events', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('should validate a valid PNRCreated event', () => {
    const data = loadFixture('valid', 'pnr-created.json');
    const result = validator.validateEvent('pnr-created', data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a valid PNRUpdated event', () => {
    const data = loadFixture('valid', 'pnr-updated.json');
    const result = validator.validateEvent('pnr-updated', data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('Valid Fixtures — Trip Events', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('should validate a valid TripCreated event', () => {
    const data = loadFixture('valid', 'trip-created.json');
    const result = validator.validateEvent('trip-created', data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a valid TripUpdated event', () => {
    const data = loadFixture('valid', 'trip-updated.json');
    const result = validator.validateEvent('trip-updated', data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('Valid Fixtures — Segment Events', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('should validate a valid SegmentAdded (flight) event', () => {
    const data = loadFixture('valid', 'segment-added-flight.json');
    const result = validator.validateEvent('segment-added', data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a valid SegmentAdded (hotel) event', () => {
    const data = loadFixture('valid', 'segment-added-hotel.json');
    const result = validator.validateEvent('segment-added', data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a valid SegmentUpdated event', () => {
    const data = loadFixture('valid', 'segment-updated.json');
    const result = validator.validateEvent('segment-updated', data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a valid SegmentRemoved event', () => {
    const data = loadFixture('valid', 'segment-removed.json');
    const result = validator.validateEvent('segment-removed', data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('Valid Fixtures — Traveller Events', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('should validate a valid TravellerCreated event', () => {
    const data = loadFixture('valid', 'traveller-created.json');
    const result = validator.validateEvent('traveller-created', data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a valid TravellerUpdated event', () => {
    const data = loadFixture('valid', 'traveller-updated.json');
    const result = validator.validateEvent('traveller-updated', data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('Invalid Fixtures — Envelope', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('should reject envelope with extra field', () => {
    const data = loadFixture('invalid', 'envelope-extra-field.json');
    const result = validator.validateEnvelope(data);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should reject envelope missing eventId', () => {
    const data = loadFixture('invalid', 'envelope-missing-eventId.json');
    const result = validator.validateEnvelope(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'required')).toBe(true);
  });

  it('should reject envelope with invalid eventType', () => {
    const data = loadFixture('invalid', 'envelope-invalid-eventType.json');
    const result = validator.validateEnvelope(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'enum')).toBe(true);
  });

  it('should reject envelope missing tenantId', () => {
    const data = loadFixture('invalid', 'envelope-missing-tenantId.json');
    const result = validator.validateEnvelope(data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'required')).toBe(true);
  });
});

describe('Invalid Fixtures — PNR Events', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('should reject PNRCreated with missing tripId in payload', () => {
    const data = loadFixture('invalid', 'pnr-created-missing-payload-field.json');
    const result = validator.validateEvent('pnr-created', data);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should reject PNRCreated with invalid rawPnrRef pattern', () => {
    const data = loadFixture('invalid', 'pnr-created-invalid-rawPnrRef.json');
    const result = validator.validateEvent('pnr-created', data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'pattern')).toBe(true);
  });
});

describe('Invalid Fixtures — Trip Events', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('should reject TripCreated with empty segmentIds array', () => {
    const data = loadFixture('invalid', 'trip-created-empty-segmentIds.json');
    const result = validator.validateEvent('trip-created', data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'minItems')).toBe(true);
  });

  it('should reject TripCreated with invalid status', () => {
    const data = loadFixture('invalid', 'trip-created-invalid-status.json');
    const result = validator.validateEvent('trip-created', data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'enum')).toBe(true);
  });
});

describe('Invalid Fixtures — Segment Events', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('should reject SegmentAdded with invalid segmentType', () => {
    const data = loadFixture('invalid', 'segment-added-invalid-type.json');
    const result = validator.validateEvent('segment-added', data);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should reject SegmentAdded with zero roomNights', () => {
    const data = loadFixture('invalid', 'segment-added-zero-roomNights.json');
    const result = validator.validateEvent('segment-added', data);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe('Invalid Fixtures — Traveller Events', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('should reject TravellerCreated with invalid email format', () => {
    const data = loadFixture('invalid', 'traveller-created-invalid-email.json');
    const result = validator.validateEvent('traveller-created', data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'format')).toBe(true);
  });
});

// === Project 2 Schema Contract Tests ===

describe('Valid Fixtures — Booking Events', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('should validate a valid BookingCreated event', () => {
    const data = loadFixture('valid', 'booking-created.json');
    const result = validator.validateEvent('booking-created', data);
    expect(result.valid).toBe(true);
  });

  it('should validate a valid BookingUpdated event', () => {
    const data = loadFixture('valid', 'booking-updated.json');
    const result = validator.validateEvent('booking-updated', data);
    expect(result.valid).toBe(true);
  });

  it('should validate a valid BookingCancelled event', () => {
    const data = loadFixture('valid', 'booking-cancelled.json');
    const result = validator.validateEvent('booking-cancelled', data);
    expect(result.valid).toBe(true);
  });
});

describe('Valid Fixtures — Reconciliation Events', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('should validate a valid HotelMatched event', () => {
    const data = loadFixture('valid', 'hotel-matched.json');
    const result = validator.validateEvent('hotel-matched', data);
    expect(result.valid).toBe(true);
  });

  it('should validate a valid HotelRejected event', () => {
    const data = loadFixture('valid', 'hotel-rejected.json');
    const result = validator.validateEvent('hotel-rejected', data);
    expect(result.valid).toBe(true);
  });

  it('should validate a valid HotelCoverageUpdated event', () => {
    const data = loadFixture('valid', 'hotel-coverage-updated.json');
    const result = validator.validateEvent('hotel-coverage-updated', data);
    expect(result.valid).toBe(true);
  });

  it('should validate a valid HotelOrphanDetected event', () => {
    const data = loadFixture('valid', 'hotel-orphan-detected.json');
    const result = validator.validateEvent('hotel-orphan-detected', data);
    expect(result.valid).toBe(true);
  });
});

describe('Invalid Fixtures — Booking Events', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('should reject BookingCreated missing bookingId', () => {
    const data = loadFixture('invalid', 'booking-created-missing-bookingId.json');
    const result = validator.validateEvent('booking-created', data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'required')).toBe(true);
  });

  it('should reject BookingCreated with bookingVersion < 1', () => {
    const data = loadFixture('invalid', 'booking-created-invalid-version.json');
    const result = validator.validateEvent('booking-created', data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'minimum')).toBe(true);
  });
});

describe('Invalid Fixtures — Reconciliation Events', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('should reject HotelMatched with empty reasonCodes', () => {
    const data = loadFixture('invalid', 'hotel-matched-empty-reasons.json');
    const result = validator.validateEvent('hotel-matched', data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'minItems')).toBe(true);
  });

  it('should reject HotelMatched with confidence > 100', () => {
    const data = loadFixture('invalid', 'hotel-matched-invalid-confidence.json');
    const result = validator.validateEvent('hotel-matched', data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'maximum')).toBe(true);
  });

  it('should reject HotelCoverageUpdated with invalid coverageStatus', () => {
    const data = loadFixture('invalid', 'hotel-coverage-invalid-status.json');
    const result = validator.validateEvent('hotel-coverage-updated', data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'enum')).toBe(true);
  });
});

// === Project 3 Schema Contract Tests ===

describe('Valid Fixtures — Opportunity Events', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('should validate a valid OpportunityCreated event', () => {
    const data = loadFixture('valid', 'opportunity-created.json');
    const result = validator.validateEvent('opportunity-created', data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a valid OpportunityUpdated event', () => {
    const data = loadFixture('valid', 'opportunity-updated.json');
    const result = validator.validateEvent('opportunity-updated', data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a valid OpportunityClosed event', () => {
    const data = loadFixture('valid', 'opportunity-closed.json');
    const result = validator.validateEvent('opportunity-closed', data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a valid OpportunityRejected event', () => {
    const data = loadFixture('valid', 'opportunity-rejected.json');
    const result = validator.validateEvent('opportunity-rejected', data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('Invalid Fixtures — Opportunity Events', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('should reject OpportunityCreated with invalid opportunityType', () => {
    const data = loadFixture('invalid', 'opportunity-created-invalid-type.json');
    const result = validator.validateEvent('opportunity-created', data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'enum')).toBe(true);
  });

  it('should reject OpportunityCreated with score > 100', () => {
    const data = loadFixture('invalid', 'opportunity-created-score-over-100.json');
    const result = validator.validateEvent('opportunity-created', data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'maximum')).toBe(true);
  });

  it('should reject OpportunityClosed with invalid closureReason', () => {
    const data = loadFixture('invalid', 'opportunity-closed-invalid-reason.json');
    const result = validator.validateEvent('opportunity-closed', data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'enum')).toBe(true);
  });

  it('should reject OpportunityRejected missing rejectionReason', () => {
    const data = loadFixture('invalid', 'opportunity-rejected-missing-reason.json');
    const result = validator.validateEvent('opportunity-rejected', data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'required')).toBe(true);
  });
});

// === Project 4 Schema Contract Tests ===

describe('Valid Fixtures — Engagement Events', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('should validate a valid CommunicationSent event', () => {
    const data = loadFixture('valid', 'communication-sent.json');
    const result = validator.validateEvent('communication-sent', data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a valid TravellerResponded event', () => {
    const data = loadFixture('valid', 'traveller-responded.json');
    const result = validator.validateEvent('traveller-responded', data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a valid BookingRequestCreated event', () => {
    const data = loadFixture('valid', 'booking-request-created.json');
    const result = validator.validateEvent('booking-request-created', data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('Invalid Fixtures — Engagement Events', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('should reject CommunicationSent with invalid channel enum', () => {
    const data = loadFixture('invalid', 'communication-sent-invalid-channel.json');
    const result = validator.validateEvent('communication-sent', data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'enum')).toBe(true);
  });

  it('should reject TravellerResponded with invalid responseType', () => {
    const data = loadFixture('invalid', 'traveller-responded-invalid-type.json');
    const result = validator.validateEvent('traveller-responded', data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'enum')).toBe(true);
  });

  it('should reject BookingRequestCreated missing required tripId', () => {
    const data = loadFixture('invalid', 'booking-request-missing-tripId.json');
    const result = validator.validateEvent('booking-request-created', data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'required')).toBe(true);
  });
});

// === Project 6 Schema Contract Tests — Behaviour Intelligence ===

describe('Valid Fixtures — Behaviour Intelligence Events', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('should validate a valid BehaviourProfileUpdated event', () => {
    const data = loadFixture('valid', 'behaviour-profile-updated.json');
    const result = validator.validateEvent('behaviour-profile-updated', data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a valid ArchetypeAssigned event', () => {
    const data = loadFixture('valid', 'archetype-assigned.json');
    const result = validator.validateEvent('archetype-assigned', data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a valid BookingAttributed event', () => {
    const data = loadFixture('valid', 'booking-attributed.json');
    const result = validator.validateEvent('booking-attributed', data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a valid BehaviourDriftDetected event', () => {
    const data = loadFixture('valid', 'behaviour-drift-detected.json');
    const result = validator.validateEvent('behaviour-drift-detected', data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a valid FatigueThresholdCrossed event', () => {
    const data = loadFixture('valid', 'fatigue-threshold-crossed.json');
    const result = validator.validateEvent('fatigue-threshold-crossed', data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a valid ActionRecommended event', () => {
    const data = loadFixture('valid', 'action-recommended.json');
    const result = validator.validateEvent('action-recommended', data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a valid CommunicationSuppressed event', () => {
    const data = loadFixture('valid', 'communication-suppressed.json');
    const result = validator.validateEvent('communication-suppressed', data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a valid CommunicationSuppressedByFatigue event', () => {
    const data = loadFixture('valid', 'communication-suppressed-by-fatigue.json');
    const result = validator.validateEvent('communication-suppressed-by-fatigue', data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should validate a valid PredictionOutcomeRecorded event', () => {
    const data = loadFixture('valid', 'prediction-outcome-recorded.json');
    const result = validator.validateEvent('prediction-outcome-recorded', data);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('Invalid Fixtures — Behaviour Intelligence Events', () => {
  let validator: SchemaValidator;

  beforeAll(() => {
    validator = new SchemaValidator();
  });

  it('should reject BehaviourProfileUpdated with confidenceScore > 100', () => {
    const data = loadFixture('invalid', 'invalid-behaviour-profile-confidence.json');
    const result = validator.validateEvent('behaviour-profile-updated', data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'maximum')).toBe(true);
  });

  it('should reject BehaviourProfileUpdated missing tripCountUsed', () => {
    const data = loadFixture('invalid', 'missing-trip-count-used.json');
    const result = validator.validateEvent('behaviour-profile-updated', data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'required')).toBe(true);
  });

  it('should reject ArchetypeAssigned with invalid archetype enum', () => {
    const data = loadFixture('invalid', 'invalid-archetype.json');
    const result = validator.validateEvent('archetype-assigned', data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'enum')).toBe(true);
  });

  it('should reject BookingAttributed with invalid attributionType enum', () => {
    const data = loadFixture('invalid', 'invalid-attribution-type.json');
    const result = validator.validateEvent('booking-attributed', data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'enum')).toBe(true);
  });

  it('should reject BehaviourDriftDetected with driftScore > 100', () => {
    const data = loadFixture('invalid', 'invalid-drift-score.json');
    const result = validator.validateEvent('behaviour-drift-detected', data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'maximum')).toBe(true);
  });

  it('should reject FatigueThresholdCrossed with invalid fatigueLevel', () => {
    const data = loadFixture('invalid', 'invalid-fatigue-level.json');
    const result = validator.validateEvent('fatigue-threshold-crossed', data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'enum')).toBe(true);
  });

  it('should reject ActionRecommended with invalid action enum', () => {
    const data = loadFixture('invalid', 'invalid-recommended-action.json');
    const result = validator.validateEvent('action-recommended', data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'enum')).toBe(true);
  });

  it('should reject ActionRecommended missing estimatedRevenueAtRisk', () => {
    const data = loadFixture('invalid', 'missing-estimated-revenue-at-risk.json');
    const result = validator.validateEvent('action-recommended', data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'required')).toBe(true);
  });

  it('should reject CommunicationSuppressed with invalid suppressionReason', () => {
    const data = loadFixture('invalid', 'invalid-suppression-reason.json');
    const result = validator.validateEvent('communication-suppressed', data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'enum')).toBe(true);
  });

  it('should reject CommunicationSuppressedByFatigue with fatigueLevel "low"', () => {
    const data = loadFixture('invalid', 'invalid-fatigue-suppression.json');
    const result = validator.validateEvent('communication-suppressed-by-fatigue', data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'enum')).toBe(true);
  });

  it('should reject PredictionOutcomeRecorded with invalid actualOutcome', () => {
    const data = loadFixture('invalid', 'invalid-prediction-outcome.json');
    const result = validator.validateEvent('prediction-outcome-recorded', data);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.keyword === 'enum')).toBe(true);
  });
});

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

/**
 * Ajv-based schema validator for HCI events.
 * Validates event data against the authoritative JSON schemas.
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { loadSchema, type SchemaName, SCHEMA_FILES } from './schema-loader.js';
import type { ValidationResult, ValidationError } from './types.js';

export class SchemaValidator {
  private readonly ajv: Ajv;
  private readonly compiledSchemas = new Map<SchemaName, ReturnType<Ajv['compile']>>();

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      strict: false,
      validateFormats: true,
    });
    addFormats(this.ajv);

    // Load the envelope schema first (referenced by all event schemas)
    const envelopeSchema = loadSchema('envelope');
    this.ajv.addSchema(envelopeSchema, 'envelope.schema.json');

    // Pre-compile all event schemas
    for (const name of Object.keys(SCHEMA_FILES) as SchemaName[]) {
      if (name === 'envelope') continue;
      const schema = loadSchema(name);
      this.compiledSchemas.set(name, this.ajv.compile(schema));
    }

    // Also compile envelope standalone
    const envelopeValidate = this.ajv.compile(envelopeSchema);
    this.compiledSchemas.set('envelope', envelopeValidate);
  }

  /**
   * Validate data against a named schema.
   */
  validate(schemaName: SchemaName, data: unknown): ValidationResult {
    const validate = this.compiledSchemas.get(schemaName);
    if (!validate) {
      return {
        valid: false,
        errors: [
          {
            path: '',
            message: `Schema "${schemaName}" not found`,
            keyword: 'schema',
            params: { schemaName },
          },
        ],
      };
    }

    const valid = validate(data) as boolean;

    if (valid) {
      return { valid: true, errors: [] };
    }

    const errors: ValidationError[] = (validate.errors ?? []).map((err) => ({
      path: err.instancePath || '/',
      message: err.message ?? 'Unknown validation error',
      keyword: err.keyword,
      params: err.params as Record<string, unknown>,
    }));

    return { valid: false, errors };
  }

  /**
   * Validate an event envelope (checks only the envelope structure, not the specific payload).
   */
  validateEnvelope(data: unknown): ValidationResult {
    return this.validate('envelope', data);
  }

  /**
   * Validate a full event (envelope + payload) against its specific schema.
   */
  validateEvent(schemaName: SchemaName, data: unknown): ValidationResult {
    return this.validate(schemaName, data);
  }
}

/**
 * @hci/validation
 *
 * JSON Schema validation utilities for the HCI platform.
 * Uses Ajv to validate events against the authoritative schemas in /schemas.
 */

export { SchemaValidator } from './schema-validator.js';
export { loadSchema, loadAllSchemas, SCHEMA_FILES, type SchemaName } from './schema-loader.js';
export type { ValidationResult, ValidationError } from './types.js';

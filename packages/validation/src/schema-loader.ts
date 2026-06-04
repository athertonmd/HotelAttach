/**
 * Schema loading utilities.
 * Loads JSON Schema files from the /schemas directory.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * All schema files available in the platform.
 * Derived from the contents of /schemas/*.schema.json
 */
export const SCHEMA_FILES = {
  envelope: 'envelope.schema.json',
  'pnr-created': 'pnr-created.schema.json',
  'pnr-updated': 'pnr-updated.schema.json',
  'trip-created': 'trip-created.schema.json',
  'trip-updated': 'trip-updated.schema.json',
  'segment-added': 'segment-added.schema.json',
  'segment-updated': 'segment-updated.schema.json',
  'segment-removed': 'segment-removed.schema.json',
  'traveller-created': 'traveller-created.schema.json',
  'traveller-updated': 'traveller-updated.schema.json',
  'booking-created': 'booking-created.schema.json',
  'booking-updated': 'booking-updated.schema.json',
  'booking-cancelled': 'booking-cancelled.schema.json',
  'hotel-matched': 'hotel-matched.schema.json',
  'hotel-rejected': 'hotel-rejected.schema.json',
  'hotel-coverage-updated': 'hotel-coverage-updated.schema.json',
  'hotel-orphan-detected': 'hotel-orphan-detected.schema.json',
  'opportunity-created': 'opportunity-created.schema.json',
  'opportunity-updated': 'opportunity-updated.schema.json',
  'opportunity-closed': 'opportunity-closed.schema.json',
  'opportunity-rejected': 'opportunity-rejected.schema.json',
  'communication-sent': 'communication-sent.schema.json',
  'traveller-responded': 'traveller-responded.schema.json',
  'booking-request-created': 'booking-request-created.schema.json',
} as const;

export type SchemaName = keyof typeof SCHEMA_FILES;

/**
 * Resolves the path to the schemas directory.
 * Walks up from this file to find the workspace root.
 */
function getSchemasDir(): string {
  const currentDir = dirname(fileURLToPath(import.meta.url));
  // From packages/validation/src → workspace root is ../../..
  // From packages/validation/dist → workspace root is ../../..
  return resolve(currentDir, '..', '..', '..', 'schemas');
}

/**
 * Load a single schema by name.
 */
export function loadSchema(name: SchemaName): Record<string, unknown> {
  const schemasDir = getSchemasDir();
  const filePath = join(schemasDir, SCHEMA_FILES[name]);
  const content = readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as Record<string, unknown>;
}

/**
 * Load all schemas as a map of name → schema object.
 */
export function loadAllSchemas(): Record<SchemaName, Record<string, unknown>> {
  const result = {} as Record<SchemaName, Record<string, unknown>>;
  for (const name of Object.keys(SCHEMA_FILES) as SchemaName[]) {
    result[name] = loadSchema(name);
  }
  return result;
}

/**
 * Validation result types.
 */

export interface ValidationError {
  /** JSON pointer path to the invalid field */
  path: string;
  /** Human-readable error message */
  message: string;
  /** The validation keyword that failed (e.g., "required", "type", "format") */
  keyword: string;
  /** Additional parameters from the schema keyword */
  params: Record<string, unknown>;
}

export interface ValidationResult {
  /** Whether the data is valid against the schema */
  valid: boolean;
  /** Validation errors (empty array if valid) */
  errors: ValidationError[];
}

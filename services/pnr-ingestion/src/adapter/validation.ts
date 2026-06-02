/**
 * Payload validation for inbound Mantic Point DTOs.
 */

export interface ValidationFailure {
  field: string;
  message: string;
}

export interface PayloadValidationResult {
  valid: boolean;
  errors: ValidationFailure[];
}

export function validateManticPointPayload(payload: unknown): PayloadValidationResult {
  const errors: ValidationFailure[] = [];

  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: [{ field: 'payload', message: 'Payload must be an object' }] };
  }

  const p = payload as Record<string, unknown>;

  if (!p['tenantId'] || typeof p['tenantId'] !== 'string') {
    errors.push({ field: 'tenantId', message: 'tenantId is required' });
  }
  if (!p['corporateId'] || typeof p['corporateId'] !== 'string') {
    errors.push({ field: 'corporateId', message: 'corporateId is required' });
  }
  if (!p['recordLocator'] || typeof p['recordLocator'] !== 'string') {
    errors.push({ field: 'recordLocator', message: 'recordLocator is required' });
  }
  if (!p['sourceSystem'] || typeof p['sourceSystem'] !== 'string') {
    errors.push({ field: 'sourceSystem', message: 'sourceSystem is required' });
  }
  if (typeof p['pnrVersion'] !== 'number' || p['pnrVersion'] < 1) {
    errors.push({ field: 'pnrVersion', message: 'pnrVersion must be >= 1' });
  }
  if (!p['bookingDate'] || typeof p['bookingDate'] !== 'string') {
    errors.push({ field: 'bookingDate', message: 'bookingDate is required' });
  }

  if (!p['traveller'] || typeof p['traveller'] !== 'object') {
    errors.push({ field: 'traveller', message: 'traveller object is required' });
  } else {
    const t = p['traveller'] as Record<string, unknown>;
    if (!t['firstName'])
      errors.push({ field: 'traveller.firstName', message: 'firstName is required' });
    if (!t['lastName'])
      errors.push({ field: 'traveller.lastName', message: 'lastName is required' });
    if (!t['email']) errors.push({ field: 'traveller.email', message: 'email is required' });
  }

  if (!Array.isArray(p['segments']) || p['segments'].length === 0) {
    errors.push({ field: 'segments', message: 'At least one segment is required' });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Request context for all API handlers.
 * Extracted from JWT/auth headers in production.
 * For MVP, passed explicitly to handlers.
 */

export interface RequestContext {
  tenantId: string;
  corporateId: string;
  userId: string;
  correlationId: string;
}

/**
 * Request context extracted from auth token / middleware.
 * tenantId is mandatory for all analytics queries.
 */
export interface RequestContext {
  tenantId: string;
  corporateId?: string | undefined;
  userId?: string | undefined;
  correlationId: string;
}

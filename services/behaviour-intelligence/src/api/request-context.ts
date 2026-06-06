/**
 * Request context extracted from auth token / middleware.
 * tenantId is mandatory for all behaviour intelligence queries.
 */
export interface RequestContext {
  tenantId: string;
  corporateId?: string | undefined;
  userId?: string | undefined;
  correlationId: string;
}

export interface QueryParams {
  corporateId?: string | undefined;
  page?: string | undefined;
  pageSize?: string | undefined;
}

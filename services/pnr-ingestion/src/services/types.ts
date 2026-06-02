/**
 * Shared types for application services.
 */

export interface ServiceResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CorrelationContext {
  correlationId?: string;
  causationId?: string;
}

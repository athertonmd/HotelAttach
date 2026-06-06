/**
 * Consistent API response types for Behaviour Intelligence.
 */

export interface ApiSuccessResponse<T> {
  success: true;
  correlationId: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  correlationId: string;
  error: { code: string; message: string };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

export function successResponse<T>(correlationId: string, data: T): ApiSuccessResponse<T> {
  return { success: true, correlationId, data };
}

export function errorResponse(
  correlationId: string,
  code: string,
  message: string,
): ApiErrorResponse {
  return { success: false, correlationId, error: { code, message } };
}

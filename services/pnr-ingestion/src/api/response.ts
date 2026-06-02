/**
 * Consistent API response types.
 */

export interface ApiResponse<T = unknown> {
  status: number;
  body: {
    success: boolean;
    data?: T;
    error?: string;
    correlationId: string;
  };
}

export function successResponse<T>(data: T, correlationId: string, status = 200): ApiResponse<T> {
  return { status, body: { success: true, data, correlationId } };
}

export function errorResponse(error: string, correlationId: string, status = 400): ApiResponse {
  return { status, body: { success: false, error, correlationId } };
}

export function notFoundResponse(message: string, correlationId: string): ApiResponse {
  return { status: 404, body: { success: false, error: message, correlationId } };
}

/**
 * @hci/observability
 *
 * Structured logging, correlation ID management, and metrics for the HCI platform.
 *
 * This package contains:
 * - Structured JSON logger (CloudWatch-compatible)
 * - Correlation ID middleware (propagates correlationId across event chains)
 * - Tenant context middleware (extracts tenantId from JWT/event envelope)
 * - Request/response logging middleware
 * - Error logging with stack traces and context
 * - Metrics helpers (CloudWatch Embedded Metrics Format)
 *
 * All services must use this package for logging to ensure:
 * - Consistent log format across bounded contexts
 * - Correlation IDs thread through entire business workflows
 * - Tenant isolation is visible in logs
 * - Errors are traceable to source events
 *
 * See: Architecture & Integration Guide §13, §20
 */

export {};

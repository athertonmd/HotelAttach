/**
 * Idempotency support interface.
 * Prevents duplicate event processing in consumers.
 *
 * Implementations:
 * - InMemoryIdempotencyStore (for tests)
 * - DynamoDB-backed store (for production — future)
 * - PostgreSQL-backed store (for production — future)
 */

export interface IdempotencyStore {
  /**
   * Check if an event has already been processed.
   */
  hasProcessed(eventId: string): Promise<boolean>;

  /**
   * Mark an event as processed.
   */
  markProcessed(eventId: string): Promise<void>;

  /**
   * Clear all processed records (for testing only).
   */
  clear(): Promise<void>;
}

/**
 * In-memory idempotency store for testing.
 * Not suitable for production — use a persistent store instead.
 */
export class InMemoryIdempotencyStore implements IdempotencyStore {
  private readonly processed = new Set<string>();

  async hasProcessed(eventId: string): Promise<boolean> {
    return this.processed.has(eventId);
  }

  async markProcessed(eventId: string): Promise<void> {
    this.processed.add(eventId);
  }

  async clear(): Promise<void> {
    this.processed.clear();
  }
}

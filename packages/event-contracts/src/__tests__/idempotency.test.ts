import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryIdempotencyStore } from '../idempotency.js';

describe('InMemoryIdempotencyStore', () => {
  let store: InMemoryIdempotencyStore;

  beforeEach(() => {
    store = new InMemoryIdempotencyStore();
  });

  it('should return false for unprocessed events', async () => {
    const result = await store.hasProcessed('event-123');
    expect(result).toBe(false);
  });

  it('should return true after marking as processed', async () => {
    await store.markProcessed('event-123');
    const result = await store.hasProcessed('event-123');
    expect(result).toBe(true);
  });

  it('should handle multiple event IDs independently', async () => {
    await store.markProcessed('event-1');

    expect(await store.hasProcessed('event-1')).toBe(true);
    expect(await store.hasProcessed('event-2')).toBe(false);
  });

  it('should clear all processed records', async () => {
    await store.markProcessed('event-1');
    await store.markProcessed('event-2');
    await store.clear();

    expect(await store.hasProcessed('event-1')).toBe(false);
    expect(await store.hasProcessed('event-2')).toBe(false);
  });
});

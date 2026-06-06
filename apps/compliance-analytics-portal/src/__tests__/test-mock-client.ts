/**
 * Reusable test helper for creating complete MockClient objects.
 * Provides default successful responses for every method,
 * allowing tests to override only the methods they care about.
 */

import type { MockClient } from '../api/mock-client';
import { createMockClient as createRealMockClient } from '../api/mock-client';

const defaults = createRealMockClient({ delay: 0 });

export function createTestMockClient(overrides: Partial<MockClient> = {}): MockClient {
  return { ...defaults, ...overrides };
}

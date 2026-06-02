/**
 * Database client interface.
 * Abstracts PostgreSQL access so implementations can be swapped:
 * - Production: pg Pool/Client
 * - Tests: mock/stub
 *
 * This interface is intentionally minimal — just enough for repository implementations.
 */

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
}

export interface DatabaseClient {
  /**
   * Execute a parameterised SQL query.
   * Parameters use $1, $2, etc. placeholders.
   */
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
}

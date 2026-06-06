/**
 * Database client interface for Behaviour Intelligence.
 * Abstracts PostgreSQL access for dependency injection and testing.
 */

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
}

export interface DatabaseClient {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
}

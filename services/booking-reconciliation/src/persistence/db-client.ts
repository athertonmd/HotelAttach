/**
 * Database client interface for Booking Reconciliation.
 * Same pattern as Project 1 — abstracts PostgreSQL access.
 */

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
}

export interface DatabaseClient {
  query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<QueryResult<T>>;
}

export class VersionConflictError extends Error {
  constructor(
    public readonly entityType: string,
    public readonly entityId: string,
    public readonly expectedVersion: number,
    public readonly actualVersion: number,
  ) {
    super(
      `Version conflict on ${entityType} ${entityId}: expected ${expectedVersion}, found ${actualVersion}`,
    );
    this.name = 'VersionConflictError';
  }
}

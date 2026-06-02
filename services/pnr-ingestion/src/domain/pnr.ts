/**
 * PNR domain entity.
 * Source: Project 1 §FR2, §Database Design — PNRs
 * Implements versioned processing per Approved Decision Q8.
 */

import type { PNRStatus, AuditFields, TenantContext } from './value-objects.js';

export interface PNRProps extends TenantContext, AuditFields {
  readonly pnrId: string;
  readonly recordLocator: string;
  readonly sourceSystem: string;
  readonly bookingDate: Date;
  readonly ticketDate: Date | null;
  readonly status: PNRStatus;
  readonly travellerId: string;
  readonly version: number;
  readonly rawPnrRef: string | null;
}

export interface CreatePNRInput {
  pnrId: string;
  tenantId: string;
  corporateId: string;
  recordLocator: string;
  sourceSystem: string;
  bookingDate: Date;
  ticketDate?: Date | null;
  travellerId: string;
  version: number;
  rawPnrRef?: string | null;
}

export class PNR {
  readonly pnrId: string;
  readonly tenantId: string;
  readonly corporateId: string;
  readonly recordLocator: string;
  readonly sourceSystem: string;
  readonly bookingDate: Date;
  readonly ticketDate: Date | null;
  readonly status: PNRStatus;
  readonly travellerId: string;
  readonly version: number;
  readonly rawPnrRef: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: PNRProps) {
    this.pnrId = props.pnrId;
    this.tenantId = props.tenantId;
    this.corporateId = props.corporateId;
    this.recordLocator = props.recordLocator;
    this.sourceSystem = props.sourceSystem;
    this.bookingDate = props.bookingDate;
    this.ticketDate = props.ticketDate;
    this.status = props.status;
    this.travellerId = props.travellerId;
    this.version = props.version;
    this.rawPnrRef = props.rawPnrRef;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(input: CreatePNRInput): PNR {
    if (!input.pnrId) throw new Error('pnrId is required');
    if (!input.tenantId) throw new Error('tenantId is required');
    if (!input.corporateId) throw new Error('corporateId is required');
    if (!input.recordLocator) throw new Error('recordLocator is required');
    if (!input.sourceSystem) throw new Error('sourceSystem is required');
    if (!input.travellerId) throw new Error('travellerId is required');
    if (input.version < 1) throw new Error('version must be >= 1');

    const now = new Date();
    return new PNR({
      pnrId: input.pnrId,
      tenantId: input.tenantId,
      corporateId: input.corporateId,
      recordLocator: input.recordLocator,
      sourceSystem: input.sourceSystem,
      bookingDate: input.bookingDate,
      ticketDate: input.ticketDate ?? null,
      status: 'active',
      travellerId: input.travellerId,
      version: input.version,
      rawPnrRef: input.rawPnrRef ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Determines whether an incoming version should supersede this PNR.
   * Per Approved Decision Q8: newer versions supersede older versions.
   * Older versions received after newer versions must NOT overwrite canonical state.
   */
  shouldAcceptVersion(incomingVersion: number): boolean {
    return incomingVersion > this.version;
  }
}

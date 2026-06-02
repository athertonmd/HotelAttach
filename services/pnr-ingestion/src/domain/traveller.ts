/**
 * Traveller domain entity.
 * Source: Project 1 §FR1, §Database Design — Travellers
 */

import type { TravellerStatus, AuditFields, TenantContext } from './value-objects.js';

export interface TravellerProps extends TenantContext, AuditFields {
  readonly travellerId: string;
  readonly employeeNumber: string | null;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly mobile: string | null;
  readonly costCentre: string | null;
  readonly country: string | null;
  readonly status: TravellerStatus;
}

export interface CreateTravellerInput {
  travellerId: string;
  tenantId: string;
  corporateId: string;
  employeeNumber?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string | null;
  costCentre?: string | null;
  country?: string | null;
}

export class Traveller {
  readonly travellerId: string;
  readonly tenantId: string;
  readonly corporateId: string;
  readonly employeeNumber: string | null;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly mobile: string | null;
  readonly costCentre: string | null;
  readonly country: string | null;
  readonly status: TravellerStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: TravellerProps) {
    this.travellerId = props.travellerId;
    this.tenantId = props.tenantId;
    this.corporateId = props.corporateId;
    this.employeeNumber = props.employeeNumber;
    this.firstName = props.firstName;
    this.lastName = props.lastName;
    this.email = props.email;
    this.mobile = props.mobile;
    this.costCentre = props.costCentre;
    this.country = props.country;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(input: CreateTravellerInput): Traveller {
    if (!input.travellerId) throw new Error('travellerId is required');
    if (!input.tenantId) throw new Error('tenantId is required');
    if (!input.corporateId) throw new Error('corporateId is required');
    if (!input.firstName) throw new Error('firstName is required');
    if (!input.lastName) throw new Error('lastName is required');
    if (!input.email) throw new Error('email is required');

    const now = new Date();
    return new Traveller({
      travellerId: input.travellerId,
      tenantId: input.tenantId,
      corporateId: input.corporateId,
      employeeNumber: input.employeeNumber ?? null,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      mobile: input.mobile ?? null,
      costCentre: input.costCentre ?? null,
      country: input.country ?? null,
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });
  }
}

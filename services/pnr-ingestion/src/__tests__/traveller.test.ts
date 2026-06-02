import { describe, it, expect } from 'vitest';
import { Traveller } from '../domain/traveller.js';

describe('Traveller', () => {
  const validInput = {
    travellerId: 'trav-001',
    tenantId: 'tenant-001',
    corporateId: 'corp-001',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@acme.com',
  };

  it('should create a valid traveller', () => {
    const traveller = Traveller.create(validInput);

    expect(traveller.travellerId).toBe('trav-001');
    expect(traveller.tenantId).toBe('tenant-001');
    expect(traveller.corporateId).toBe('corp-001');
    expect(traveller.firstName).toBe('Jane');
    expect(traveller.lastName).toBe('Smith');
    expect(traveller.email).toBe('jane.smith@acme.com');
    expect(traveller.status).toBe('active');
    expect(traveller.createdAt).toBeInstanceOf(Date);
    expect(traveller.updatedAt).toBeInstanceOf(Date);
  });

  it('should set optional fields to null when not provided', () => {
    const traveller = Traveller.create(validInput);

    expect(traveller.employeeNumber).toBeNull();
    expect(traveller.mobile).toBeNull();
    expect(traveller.costCentre).toBeNull();
    expect(traveller.country).toBeNull();
  });

  it('should accept optional fields', () => {
    const traveller = Traveller.create({
      ...validInput,
      employeeNumber: 'EMP-123',
      mobile: '+44 7700 900000',
      costCentre: 'CC-100',
      country: 'GB',
    });

    expect(traveller.employeeNumber).toBe('EMP-123');
    expect(traveller.mobile).toBe('+44 7700 900000');
    expect(traveller.costCentre).toBe('CC-100');
    expect(traveller.country).toBe('GB');
  });

  it('should reject missing travellerId', () => {
    expect(() => Traveller.create({ ...validInput, travellerId: '' })).toThrow(
      'travellerId is required',
    );
  });

  it('should reject missing tenantId', () => {
    expect(() => Traveller.create({ ...validInput, tenantId: '' })).toThrow('tenantId is required');
  });

  it('should reject missing firstName', () => {
    expect(() => Traveller.create({ ...validInput, firstName: '' })).toThrow(
      'firstName is required',
    );
  });

  it('should reject missing email', () => {
    expect(() => Traveller.create({ ...validInput, email: '' })).toThrow('email is required');
  });
});

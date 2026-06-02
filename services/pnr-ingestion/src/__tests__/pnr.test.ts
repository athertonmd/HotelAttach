import { describe, it, expect } from 'vitest';
import { PNR } from '../domain/pnr.js';

describe('PNR', () => {
  const validInput = {
    pnrId: 'pnr-001',
    tenantId: 'tenant-001',
    corporateId: 'corp-001',
    recordLocator: 'ABC123',
    sourceSystem: 'Amadeus',
    bookingDate: new Date('2026-06-01'),
    travellerId: 'trav-001',
    version: 1,
  };

  it('should create a valid PNR', () => {
    const pnr = PNR.create(validInput);

    expect(pnr.pnrId).toBe('pnr-001');
    expect(pnr.tenantId).toBe('tenant-001');
    expect(pnr.corporateId).toBe('corp-001');
    expect(pnr.recordLocator).toBe('ABC123');
    expect(pnr.sourceSystem).toBe('Amadeus');
    expect(pnr.status).toBe('active');
    expect(pnr.version).toBe(1);
    expect(pnr.createdAt).toBeInstanceOf(Date);
  });

  it('should reject missing pnrId', () => {
    expect(() => PNR.create({ ...validInput, pnrId: '' })).toThrow('pnrId is required');
  });

  it('should reject missing recordLocator', () => {
    expect(() => PNR.create({ ...validInput, recordLocator: '' })).toThrow(
      'recordLocator is required',
    );
  });

  it('should reject version < 1', () => {
    expect(() => PNR.create({ ...validInput, version: 0 })).toThrow('version must be >= 1');
  });

  describe('version handling (Approved Decision Q8)', () => {
    it('should accept a newer version', () => {
      const pnr = PNR.create(validInput);
      expect(pnr.shouldAcceptVersion(2)).toBe(true);
    });

    it('should reject an older version', () => {
      const pnr = PNR.create({ ...validInput, version: 3 });
      expect(pnr.shouldAcceptVersion(2)).toBe(false);
    });

    it('should reject the same version', () => {
      const pnr = PNR.create(validInput);
      expect(pnr.shouldAcceptVersion(1)).toBe(false);
    });

    it('should accept version immediately after current', () => {
      const pnr = PNR.create({ ...validInput, version: 5 });
      expect(pnr.shouldAcceptVersion(6)).toBe(true);
    });
  });
});

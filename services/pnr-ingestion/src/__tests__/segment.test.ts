import { describe, it, expect } from 'vitest';
import { Segment } from '../domain/segment.js';

describe('Segment', () => {
  const validInput = {
    segmentId: 'seg-001',
    tripId: 'trip-001',
    segmentType: 'flight' as const,
    startDatetime: new Date('2026-06-15T08:00:00Z'),
    endDatetime: new Date('2026-06-15T11:30:00Z'),
    origin: 'LHR',
    destination: 'JFK',
  };

  it('should create a valid segment', () => {
    const segment = Segment.create(validInput);

    expect(segment.segmentId).toBe('seg-001');
    expect(segment.tripId).toBe('trip-001');
    expect(segment.segmentType).toBe('flight');
    expect(segment.origin).toBe('LHR');
    expect(segment.destination).toBe('JFK');
    expect(segment.status).toBe('confirmed');
    expect(segment.version).toBe(1);
  });

  it('should accept all valid segment types', () => {
    const types = ['flight', 'hotel', 'rail', 'car', 'transfer', 'other'] as const;
    for (const segmentType of types) {
      const segment = Segment.create({ ...validInput, segmentType });
      expect(segment.segmentType).toBe(segmentType);
    }
  });

  it('should reject invalid segment type', () => {
    expect(() => Segment.create({ ...validInput, segmentType: 'bus' as 'flight' })).toThrow(
      'Invalid segmentType',
    );
  });

  it('should reject missing segmentId', () => {
    expect(() => Segment.create({ ...validInput, segmentId: '' })).toThrow('segmentId is required');
  });

  it('should reject missing origin', () => {
    expect(() => Segment.create({ ...validInput, origin: '' })).toThrow('origin is required');
  });

  it('should reject endDatetime before startDatetime', () => {
    expect(() =>
      Segment.create({
        ...validInput,
        startDatetime: new Date('2026-06-15T12:00:00Z'),
        endDatetime: new Date('2026-06-15T08:00:00Z'),
      }),
    ).toThrow('endDatetime must be after startDatetime');
  });

  it('should reject endDatetime equal to startDatetime', () => {
    const sameTime = new Date('2026-06-15T08:00:00Z');
    expect(() =>
      Segment.create({
        ...validInput,
        startDatetime: sameTime,
        endDatetime: sameTime,
      }),
    ).toThrow('endDatetime must be after startDatetime');
  });

  describe('update', () => {
    it('should increment version on update', () => {
      const segment = Segment.create(validInput);
      const updated = segment.update({ origin: 'LGW' });

      expect(updated.version).toBe(2);
      expect(updated.origin).toBe('LGW');
      expect(updated.destination).toBe('JFK');
    });

    it('should preserve unchanged fields', () => {
      const segment = Segment.create(validInput);
      const updated = segment.update({ status: 'cancelled' });

      expect(updated.origin).toBe('LHR');
      expect(updated.destination).toBe('JFK');
      expect(updated.status).toBe('cancelled');
      expect(updated.segmentType).toBe('flight');
    });

    it('should reject invalid date range on update', () => {
      const segment = Segment.create(validInput);
      expect(() =>
        segment.update({
          startDatetime: new Date('2026-06-15T12:00:00Z'),
          endDatetime: new Date('2026-06-15T08:00:00Z'),
        }),
      ).toThrow('endDatetime must be after startDatetime');
    });
  });
});

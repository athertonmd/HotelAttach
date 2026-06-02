import { describe, it, expect } from 'vitest';
import { Trip } from '../domain/trip.js';

describe('Trip', () => {
  const validInput = {
    tripId: 'trip-001',
    tenantId: 'tenant-001',
    corporateId: 'corp-001',
    travellerId: 'trav-001',
  };

  it('should create a valid trip with draft status', () => {
    const trip = Trip.create(validInput);

    expect(trip.tripId).toBe('trip-001');
    expect(trip.tenantId).toBe('tenant-001');
    expect(trip.corporateId).toBe('corp-001');
    expect(trip.travellerId).toBe('trav-001');
    expect(trip.status).toBe('draft');
    expect(trip.startDate).toBeNull();
    expect(trip.endDate).toBeNull();
    expect(trip.segments).toHaveLength(0);
    expect(trip.timeline).toHaveLength(0);
  });

  it('should reject missing tripId', () => {
    expect(() => Trip.create({ ...validInput, tripId: '' })).toThrow('tripId is required');
  });

  it('should reject missing tenantId', () => {
    expect(() => Trip.create({ ...validInput, tenantId: '' })).toThrow('tenantId is required');
  });

  describe('segment management', () => {
    it('should add a segment to the trip', () => {
      const trip = Trip.create(validInput);
      const segment = trip.addSegment({
        segmentId: 'seg-001',
        tripId: 'trip-001',
        segmentType: 'flight',
        startDatetime: new Date('2026-06-15T08:00:00Z'),
        endDatetime: new Date('2026-06-15T11:30:00Z'),
        origin: 'LHR',
        destination: 'JFK',
      });

      expect(trip.segments).toHaveLength(1);
      expect(segment.segmentId).toBe('seg-001');
      expect(segment.tripId).toBe('trip-001');
    });

    it('should update an existing segment', () => {
      const trip = Trip.create(validInput);
      trip.addSegment({
        segmentId: 'seg-001',
        tripId: 'trip-001',
        segmentType: 'flight',
        startDatetime: new Date('2026-06-15T08:00:00Z'),
        endDatetime: new Date('2026-06-15T11:30:00Z'),
        origin: 'LHR',
        destination: 'JFK',
      });

      const updated = trip.updateSegment('seg-001', {
        startDatetime: new Date('2026-06-15T09:00:00Z'),
        endDatetime: new Date('2026-06-15T12:30:00Z'),
      });

      expect(updated.startDatetime).toEqual(new Date('2026-06-15T09:00:00Z'));
      expect(updated.version).toBe(2);
    });

    it('should throw when updating a non-existent segment', () => {
      const trip = Trip.create(validInput);
      expect(() => trip.updateSegment('seg-999', { origin: 'LGW' })).toThrow(
        'Segment seg-999 not found',
      );
    });

    it('should remove a segment from the trip', () => {
      const trip = Trip.create(validInput);
      trip.addSegment({
        segmentId: 'seg-001',
        tripId: 'trip-001',
        segmentType: 'flight',
        startDatetime: new Date('2026-06-15T08:00:00Z'),
        endDatetime: new Date('2026-06-15T11:30:00Z'),
        origin: 'LHR',
        destination: 'JFK',
      });

      const removed = trip.removeSegment('seg-001');
      expect(removed.segmentId).toBe('seg-001');
      expect(trip.segments).toHaveLength(0);
    });

    it('should throw when removing a non-existent segment', () => {
      const trip = Trip.create(validInput);
      expect(() => trip.removeSegment('seg-999')).toThrow('Segment seg-999 not found');
    });

    it('should check if a segment exists', () => {
      const trip = Trip.create(validInput);
      trip.addSegment({
        segmentId: 'seg-001',
        tripId: 'trip-001',
        segmentType: 'hotel',
        startDatetime: new Date('2026-06-15T15:00:00Z'),
        endDatetime: new Date('2026-06-19T11:00:00Z'),
        origin: 'New York',
        destination: 'New York',
      });

      expect(trip.hasSegment('seg-001')).toBe(true);
      expect(trip.hasSegment('seg-999')).toBe(false);
    });
  });

  describe('timeline events', () => {
    it('should add timeline events', () => {
      const trip = Trip.create(validInput);
      trip.addTimelineEvent({
        eventId: 'evt-001',
        tripId: 'trip-001',
        eventType: 'booking_created',
        eventData: { source: 'Amadeus' },
      });

      expect(trip.timeline).toHaveLength(1);
      expect(trip.timeline[0]?.eventType).toBe('booking_created');
    });

    it('should return timeline events in chronological order', async () => {
      const trip = Trip.create(validInput);

      trip.addTimelineEvent({
        eventId: 'evt-001',
        tripId: 'trip-001',
        eventType: 'booking_created',
      });

      // Small delay to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      trip.addTimelineEvent({
        eventId: 'evt-002',
        tripId: 'trip-001',
        eventType: 'flight_added',
      });

      const timeline = trip.timeline;
      expect(timeline).toHaveLength(2);
      expect(timeline[0]?.eventType).toBe('booking_created');
      expect(timeline[1]?.eventType).toBe('flight_added');
      expect(timeline[0]!.createdAt.getTime()).toBeLessThanOrEqual(
        timeline[1]!.createdAt.getTime(),
      );
    });
  });
});

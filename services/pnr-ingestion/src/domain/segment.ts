/**
 * Segment domain entity.
 * Source: Project 1 §FR4, §Database Design — Segments
 * Each segment is independently versioned.
 */

import type { SegmentType, SegmentStatus, AuditFields } from './value-objects.js';

export interface SegmentProps extends AuditFields {
  readonly segmentId: string;
  readonly tripId: string;
  readonly segmentType: SegmentType;
  readonly startDatetime: Date;
  readonly endDatetime: Date;
  readonly origin: string;
  readonly destination: string;
  readonly status: SegmentStatus;
  readonly version: number;
}

export interface CreateSegmentInput {
  segmentId: string;
  tripId: string;
  segmentType: SegmentType;
  startDatetime: Date;
  endDatetime: Date;
  origin: string;
  destination: string;
  status?: SegmentStatus;
  version?: number;
}

export interface UpdateSegmentInput {
  startDatetime?: Date;
  endDatetime?: Date;
  origin?: string;
  destination?: string;
  status?: SegmentStatus;
}

const VALID_SEGMENT_TYPES: SegmentType[] = ['flight', 'hotel', 'rail', 'car', 'transfer', 'other'];

export class Segment {
  readonly segmentId: string;
  readonly tripId: string;
  readonly segmentType: SegmentType;
  readonly startDatetime: Date;
  readonly endDatetime: Date;
  readonly origin: string;
  readonly destination: string;
  readonly status: SegmentStatus;
  readonly version: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: SegmentProps) {
    this.segmentId = props.segmentId;
    this.tripId = props.tripId;
    this.segmentType = props.segmentType;
    this.startDatetime = props.startDatetime;
    this.endDatetime = props.endDatetime;
    this.origin = props.origin;
    this.destination = props.destination;
    this.status = props.status;
    this.version = props.version;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(input: CreateSegmentInput): Segment {
    if (!input.segmentId) throw new Error('segmentId is required');
    if (!input.tripId) throw new Error('tripId is required');
    if (!VALID_SEGMENT_TYPES.includes(input.segmentType)) {
      throw new Error(`Invalid segmentType: ${input.segmentType}`);
    }
    if (!input.origin) throw new Error('origin is required');
    if (!input.destination) throw new Error('destination is required');
    if (input.endDatetime <= input.startDatetime) {
      throw new Error('endDatetime must be after startDatetime');
    }

    const now = new Date();
    return new Segment({
      segmentId: input.segmentId,
      tripId: input.tripId,
      segmentType: input.segmentType,
      startDatetime: input.startDatetime,
      endDatetime: input.endDatetime,
      origin: input.origin,
      destination: input.destination,
      status: input.status ?? 'confirmed',
      version: input.version ?? 1,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Creates an updated segment with a new version.
   */
  update(input: UpdateSegmentInput): Segment {
    const startDatetime = input.startDatetime ?? this.startDatetime;
    const endDatetime = input.endDatetime ?? this.endDatetime;

    if (endDatetime <= startDatetime) {
      throw new Error('endDatetime must be after startDatetime');
    }

    return new Segment({
      segmentId: this.segmentId,
      tripId: this.tripId,
      segmentType: this.segmentType,
      startDatetime,
      endDatetime,
      origin: input.origin ?? this.origin,
      destination: input.destination ?? this.destination,
      status: input.status ?? this.status,
      version: this.version + 1,
      createdAt: this.createdAt,
      updatedAt: new Date(),
    });
  }
}

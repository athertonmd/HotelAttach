/**
 * Trip domain entity (aggregate root).
 * Source: Project 1 §FR3, §FR6, §Database Design — Trips
 * Relationships: 1 Trip → Many Segments, 1 Trip → Many Timeline Events
 */

import type { TripStatus, AuditFields, TenantContext } from './value-objects.js';
import { Segment, type CreateSegmentInput, type UpdateSegmentInput } from './segment.js';
import { TimelineEvent, type CreateTimelineEventInput } from './timeline-event.js';

export interface TripProps extends TenantContext, AuditFields {
  readonly tripId: string;
  readonly travellerId: string;
  readonly status: TripStatus;
  readonly startDate: Date | null;
  readonly endDate: Date | null;
}

export interface CreateTripInput {
  tripId: string;
  tenantId: string;
  corporateId: string;
  travellerId: string;
  startDate?: Date | null;
  endDate?: Date | null;
}

export class Trip {
  readonly tripId: string;
  readonly tenantId: string;
  readonly corporateId: string;
  readonly travellerId: string;
  readonly status: TripStatus;
  readonly startDate: Date | null;
  readonly endDate: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private readonly _segments: Segment[] = [];
  private readonly _timeline: TimelineEvent[] = [];

  private constructor(props: TripProps) {
    this.tripId = props.tripId;
    this.tenantId = props.tenantId;
    this.corporateId = props.corporateId;
    this.travellerId = props.travellerId;
    this.status = props.status;
    this.startDate = props.startDate;
    this.endDate = props.endDate;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  get segments(): readonly Segment[] {
    return this._segments;
  }

  get timeline(): readonly TimelineEvent[] {
    return [...this._timeline].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  static create(input: CreateTripInput): Trip {
    if (!input.tripId) throw new Error('tripId is required');
    if (!input.tenantId) throw new Error('tenantId is required');
    if (!input.corporateId) throw new Error('corporateId is required');
    if (!input.travellerId) throw new Error('travellerId is required');

    const now = new Date();
    return new Trip({
      tripId: input.tripId,
      tenantId: input.tenantId,
      corporateId: input.corporateId,
      travellerId: input.travellerId,
      status: 'draft',
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }

  /**
   * Add a segment to this trip.
   */
  addSegment(input: CreateSegmentInput): Segment {
    const segment = Segment.create({ ...input, tripId: this.tripId });
    this._segments.push(segment);
    return segment;
  }

  /**
   * Update an existing segment by ID.
   * Returns the updated segment or throws if not found.
   */
  updateSegment(segmentId: string, input: UpdateSegmentInput): Segment {
    const index = this._segments.findIndex((s) => s.segmentId === segmentId);
    if (index === -1) {
      throw new Error(`Segment ${segmentId} not found in trip ${this.tripId}`);
    }
    const existing = this._segments[index];
    if (!existing) {
      throw new Error(`Segment ${segmentId} not found in trip ${this.tripId}`);
    }
    const updated = existing.update(input);
    this._segments[index] = updated;
    return updated;
  }

  /**
   * Remove a segment from this trip by ID.
   * Returns the removed segment or throws if not found.
   */
  removeSegment(segmentId: string): Segment {
    const index = this._segments.findIndex((s) => s.segmentId === segmentId);
    if (index === -1) {
      throw new Error(`Segment ${segmentId} not found in trip ${this.tripId}`);
    }
    const removed = this._segments[index];
    if (!removed) {
      throw new Error(`Segment ${segmentId} not found in trip ${this.tripId}`);
    }
    this._segments.splice(index, 1);
    return removed;
  }

  /**
   * Add a timeline event to this trip.
   * Timeline events are immutable once created.
   */
  addTimelineEvent(input: CreateTimelineEventInput): TimelineEvent {
    const event = TimelineEvent.create({ ...input, tripId: this.tripId });
    this._timeline.push(event);
    return event;
  }

  /**
   * Get a segment by ID.
   */
  getSegment(segmentId: string): Segment | undefined {
    return this._segments.find((s) => s.segmentId === segmentId);
  }

  /**
   * Check if a segment exists in this trip.
   */
  hasSegment(segmentId: string): boolean {
    return this._segments.some((s) => s.segmentId === segmentId);
  }
}

/**
 * TimelineEvent domain entity.
 * Source: Project 1 §FR5, §FR6, §Database Design — Timeline Events
 * Immutable history record — once created, never modified.
 */

import type { TimelineEventType } from './value-objects.js';

export interface TimelineEventProps {
  readonly eventId: string;
  readonly tripId: string;
  readonly eventType: TimelineEventType;
  readonly eventData: Record<string, unknown>;
  readonly createdAt: Date;
}

export interface CreateTimelineEventInput {
  eventId: string;
  tripId: string;
  eventType: TimelineEventType;
  eventData?: Record<string, unknown>;
}

export class TimelineEvent {
  readonly eventId: string;
  readonly tripId: string;
  readonly eventType: TimelineEventType;
  readonly eventData: Record<string, unknown>;
  readonly createdAt: Date;

  private constructor(props: TimelineEventProps) {
    this.eventId = props.eventId;
    this.tripId = props.tripId;
    this.eventType = props.eventType;
    this.eventData = props.eventData;
    this.createdAt = props.createdAt;
  }

  static create(input: CreateTimelineEventInput): TimelineEvent {
    if (!input.eventId) throw new Error('eventId is required');
    if (!input.tripId) throw new Error('tripId is required');
    if (!input.eventType) throw new Error('eventType is required');

    return new TimelineEvent({
      eventId: input.eventId,
      tripId: input.tripId,
      eventType: input.eventType,
      eventData: input.eventData ?? {},
      createdAt: new Date(),
    });
  }
}

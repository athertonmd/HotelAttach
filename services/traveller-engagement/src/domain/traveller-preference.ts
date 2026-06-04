/**
 * TravellerPreference — manages communication opt-out and suppression preferences.
 */

import { randomUUID } from 'node:crypto';
import type { CommunicationChannel } from './enums.js';

export interface CreateTravellerPreferenceInput {
  tenantId: string;
  travellerId: string;
  emailOptedOut?: boolean;
  smsOptedOut?: boolean;
  suppressedUntil?: Date | null;
}

export class TravellerPreference {
  readonly preferenceId: string;
  readonly tenantId: string;
  readonly travellerId: string;

  private _emailOptedOut: boolean;
  private _smsOptedOut: boolean;
  private _suppressedUntil: Date | null;
  private _updatedAt: Date;

  get emailOptedOut(): boolean {
    return this._emailOptedOut;
  }
  get smsOptedOut(): boolean {
    return this._smsOptedOut;
  }
  get suppressedUntil(): Date | null {
    return this._suppressedUntil;
  }
  get updatedAt(): Date {
    return this._updatedAt;
  }

  private constructor(input: CreateTravellerPreferenceInput, now: Date) {
    this.preferenceId = randomUUID();
    this.tenantId = input.tenantId;
    this.travellerId = input.travellerId;

    this._emailOptedOut = input.emailOptedOut ?? false;
    this._smsOptedOut = input.smsOptedOut ?? false;
    this._suppressedUntil = input.suppressedUntil ?? null;
    this._updatedAt = now;
  }

  static create(input: CreateTravellerPreferenceInput): TravellerPreference {
    if (!input.tenantId) throw new Error('tenantId is required');
    if (!input.travellerId) throw new Error('travellerId is required');

    return new TravellerPreference(input, new Date());
  }

  /** Opt out of email communications */
  unsubscribeEmail(): void {
    this._emailOptedOut = true;
    this._updatedAt = new Date();
  }

  /** Opt out of SMS communications */
  unsubscribeSms(): void {
    this._smsOptedOut = true;
    this._updatedAt = new Date();
  }

  /** Check if a specific channel is blocked by preferences */
  isChannelBlocked(channel: CommunicationChannel): boolean {
    if (channel === 'email') return this._emailOptedOut;
    if (channel === 'sms') return this._smsOptedOut;
    return false;
  }

  /** Check if the traveller is in a suppression window */
  isSuppressed(now: Date): boolean {
    if (this._suppressedUntil === null) return false;
    return now < this._suppressedUntil;
  }
}

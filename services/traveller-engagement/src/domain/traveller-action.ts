/**
 * TravellerAction — represents a secure action token for landing pages.
 * Allows travellers to respond to communications via a unique link.
 */

import { randomUUID } from 'node:crypto';
import { TOKEN_EXPIRY_DAYS } from './enums.js';

export interface CreateTravellerActionInput {
  communicationId: string;
  tenantId: string;
  travellerId: string;
  departureDate?: Date | null;
}

export class TravellerAction {
  readonly actionId: string;
  readonly communicationId: string;
  readonly tenantId: string;
  readonly travellerId: string;
  readonly token: string;
  readonly expiresAt: Date;
  readonly createdAt: Date;

  private _isUsed: boolean;
  private _usedAt: Date | null;

  get isUsed(): boolean {
    return this._isUsed;
  }
  get usedAt(): Date | null {
    return this._usedAt;
  }

  private constructor(input: CreateTravellerActionInput, now: Date) {
    this.actionId = randomUUID();
    this.communicationId = input.communicationId;
    this.tenantId = input.tenantId;
    this.travellerId = input.travellerId;
    this.token = randomUUID();
    this.createdAt = now;

    // Expiry is the earlier of TOKEN_EXPIRY_DAYS from now or departure date
    const defaultExpiry = new Date(now.getTime() + TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const departure = input.departureDate ?? null;
    this.expiresAt = departure && departure < defaultExpiry ? departure : defaultExpiry;

    this._isUsed = false;
    this._usedAt = null;
  }

  static create(input: CreateTravellerActionInput): TravellerAction {
    if (!input.tenantId) throw new Error('tenantId is required');
    if (!input.communicationId) throw new Error('communicationId is required');
    if (!input.travellerId) throw new Error('travellerId is required');

    return new TravellerAction(input, new Date());
  }

  /** Mark the token as used */
  use(): void {
    if (this._isUsed) {
      throw new Error('Token has already been used');
    }
    this._isUsed = true;
    this._usedAt = new Date();
  }

  /** Check if the token has expired */
  isExpired(now: Date): boolean {
    return now >= this.expiresAt;
  }
}

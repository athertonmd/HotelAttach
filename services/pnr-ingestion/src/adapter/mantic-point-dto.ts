/**
 * Mantic Point inbound DTO types.
 * These represent the external payload format received via webhook.
 * Per Approved Decision Q1: downstream services must never be coupled
 * to this format — the adapter transforms it to canonical HCI model.
 */

export interface ManticPointSegmentDTO {
  segmentId: string;
  type: 'AIR' | 'HTL' | 'RAIL' | 'CAR' | 'TRN' | 'OTH';
  departureDate: string;
  arrivalDate: string;
  origin: string;
  destination: string;
  status: 'HK' | 'XX' | 'HL';
  supplier?: string;
  flightNumber?: string;
  airline?: string;
  cabinClass?: string;
  bookingClass?: string;
  hotelName?: string;
  hotelChain?: string;
  roomNights?: number;
  trainNumber?: string;
  operator?: string;
  rentalCompany?: string;
  vehicleClass?: string;
}

export interface ManticPointTravellerDTO {
  firstName: string;
  lastName: string;
  email: string;
  employeeNumber?: string;
  mobile?: string;
}

export interface ManticPointPayload {
  tenantId: string;
  corporateId: string;
  recordLocator: string;
  sourceSystem: string;
  pnrVersion: number;
  bookingDate: string;
  traveller: ManticPointTravellerDTO;
  segments: ManticPointSegmentDTO[];
  isInternational?: boolean;
}

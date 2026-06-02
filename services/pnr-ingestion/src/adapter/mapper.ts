/**
 * Mapping functions from Mantic Point DTOs to canonical HCI domain inputs.
 * Per Approved Decision Q1: this adapter layer isolates the external format.
 */

import { randomUUID } from 'node:crypto';
import type { ManticPointPayload, ManticPointSegmentDTO } from './mantic-point-dto.js';
import type { CreateTravellerInput } from '../domain/traveller.js';
import type { CreateTripServiceInput, AddSegmentInput } from '../services/trip-service.js';
import type { CreatePNRServiceInput } from '../services/pnr-service.js';
import type { SegmentType, SegmentStatus } from '../domain/value-objects.js';
import type { TypeSpecificData } from '@hci/event-contracts';

export function mapSegmentType(mpType: string): SegmentType {
  const mapping: Record<string, SegmentType> = {
    AIR: 'flight',
    HTL: 'hotel',
    RAIL: 'rail',
    CAR: 'car',
    TRN: 'transfer',
    OTH: 'other',
  };
  const result = mapping[mpType];
  if (!result) {
    throw new Error(`Unsupported Mantic Point segment type: ${mpType}`);
  }
  return result;
}

function mapSegmentStatus(mpStatus: string): SegmentStatus {
  const mapping: Record<string, SegmentStatus> = {
    HK: 'confirmed',
    XX: 'cancelled',
    HL: 'waitlisted',
  };
  return mapping[mpStatus] ?? 'confirmed';
}

export function mapTypeSpecificData(seg: ManticPointSegmentDTO): TypeSpecificData {
  const segType = mapSegmentType(seg.type);

  switch (segType) {
    case 'flight':
      return {
        flightNumber: seg.flightNumber ?? 'UNKNOWN',
        airline: seg.airline ?? 'UNKNOWN',
        cabinClass:
          (seg.cabinClass as 'economy' | 'premium_economy' | 'business' | 'first') ?? 'economy',
        bookingClass: seg.bookingClass ?? 'Y',
      };
    case 'hotel':
      return {
        propertyName: seg.hotelName ?? 'Unknown Hotel',
        propertyCode: null,
        chainCode: seg.hotelChain ?? null,
        checkInDate: seg.departureDate,
        checkOutDate: seg.arrivalDate,
        roomNights: seg.roomNights ?? 1,
        rateCode: null,
        city: seg.destination,
        country: seg.destination,
      };
    case 'rail':
      return {
        trainNumber: seg.trainNumber ?? 'UNKNOWN',
        operator: seg.operator ?? 'UNKNOWN',
        seatClass: 'standard',
        stationCodes: [seg.origin, seg.destination],
      };
    case 'car':
      return {
        pickupLocation: seg.origin,
        dropoffLocation: seg.destination,
        rentalCompany: seg.rentalCompany ?? 'UNKNOWN',
        vehicleClass: seg.vehicleClass ?? 'standard',
      };
    default:
      // transfer and other — use flight as fallback for event schema
      return {
        flightNumber: 'N/A',
        airline: 'N/A',
        cabinClass: 'economy' as const,
        bookingClass: 'N/A',
      };
  }
}

export function mapTraveller(payload: ManticPointPayload): CreateTravellerInput {
  return {
    travellerId: randomUUID(),
    tenantId: payload.tenantId,
    corporateId: payload.corporateId,
    firstName: payload.traveller.firstName,
    lastName: payload.traveller.lastName,
    email: payload.traveller.email,
    employeeNumber: payload.traveller.employeeNumber ?? null,
    mobile: payload.traveller.mobile ?? null,
  };
}

export function mapPNR(
  payload: ManticPointPayload,
  travellerId: string,
  tripId: string,
): CreatePNRServiceInput {
  return {
    pnrId: randomUUID(),
    tenantId: payload.tenantId,
    corporateId: payload.corporateId,
    recordLocator: payload.recordLocator,
    sourceSystem: payload.sourceSystem,
    bookingDate: new Date(payload.bookingDate),
    travellerId,
    version: payload.pnrVersion,
    rawPnrRef: `s3://hci-raw-pnrs/${payload.recordLocator}-v${payload.pnrVersion}.json`,
    tripId,
    segmentCount: payload.segments.length,
  };
}

export function mapTrip(payload: ManticPointPayload, travellerId: string): CreateTripServiceInput {
  const firstSeg = payload.segments[0];
  const lastSeg = payload.segments[payload.segments.length - 1];
  return {
    tripId: randomUUID(),
    tenantId: payload.tenantId,
    corporateId: payload.corporateId,
    travellerId,
    startDate: firstSeg ? new Date(firstSeg.departureDate) : null,
    endDate: lastSeg ? new Date(lastSeg.arrivalDate) : null,
    origin: firstSeg?.origin ?? 'UNKNOWN',
    destination: firstSeg?.destination ?? 'UNKNOWN',
    isInternational: payload.isInternational ?? false,
  };
}

export function mapSegment(seg: ManticPointSegmentDTO, tripId: string): AddSegmentInput {
  return {
    segmentId: seg.segmentId || randomUUID(),
    tripId,
    segmentType: mapSegmentType(seg.type),
    startDatetime: new Date(seg.departureDate),
    endDatetime: new Date(seg.arrivalDate),
    origin: seg.origin,
    destination: seg.destination,
    status: mapSegmentStatus(seg.status),
    typeSpecificData: mapTypeSpecificData(seg),
    supplierCode: seg.supplier ?? null,
  };
}

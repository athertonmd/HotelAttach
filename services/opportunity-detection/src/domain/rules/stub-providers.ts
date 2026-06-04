/**
 * Stub/default data providers for MVP.
 * These return sensible defaults until external integrations are available.
 * Source: Approved Architecture Decisions — stubs for MVP
 */

import type {
  PolicyData,
  SupplierContractData,
  DestinationRiskData,
  RevenueEstimate,
} from './types.js';

/** Default ADR lookup by country (simplified for MVP) */
const DEFAULT_ADR_BY_COUNTRY: Record<string, number> = {
  US: 180,
  GB: 160,
  DE: 140,
  FR: 150,
  JP: 200,
  AU: 170,
  default: 120,
};

/** Default commission rate */
const DEFAULT_COMMISSION_RATE = 0.1;

/**
 * Stub policy data provider.
 * Returns default "compliant" policy until PolicyChanged events are available.
 */
export function getDefaultPolicyData(): PolicyData {
  return {
    isPreferredSupplier: true,
    isLocationRestricted: false,
    isRiskRestricted: false,
    isSustainabilityBelow: false,
  };
}

/**
 * Stub supplier contract data provider.
 * Returns "on track" until SupplierContractChanged events are available.
 */
export function getDefaultSupplierContractData(): SupplierContractData {
  return {
    forecastNights: 100,
    committedNights: 100,
    gap: 0,
    riskLevel: 'on_track',
  };
}

/**
 * Stub destination risk data provider.
 * Returns "standard" risk until external risk feed is integrated.
 */
export function getDefaultDestinationRiskData(): DestinationRiskData {
  return {
    riskLevel: 'standard',
  };
}

/**
 * Stub revenue estimate provider.
 * Uses per-country ADR lookup with default commission rate.
 */
export function estimateRevenue(
  destinationCountry: string | null,
  roomNights: number,
): RevenueEstimate {
  const country = destinationCountry ?? 'default';
  const adr = DEFAULT_ADR_BY_COUNTRY[country] ?? 120;
  const estimatedSpend = roomNights * adr;
  const estimatedCommission = estimatedSpend * DEFAULT_COMMISSION_RATE;

  return {
    estimatedRoomNights: roomNights,
    averageDailyRate: adr,
    commissionRate: DEFAULT_COMMISSION_RATE,
    estimatedSpend,
    estimatedCommission,
  };
}

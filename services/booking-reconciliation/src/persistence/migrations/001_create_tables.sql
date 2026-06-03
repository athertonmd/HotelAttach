-- Migration 001: Create Booking Reconciliation tables
-- Schema: booking_reconciliation (per Approved Decision Q4)
-- All tables enforce tenant isolation via tenant_id column.

CREATE SCHEMA IF NOT EXISTS booking_reconciliation;

-- Hotel Bookings
CREATE TABLE booking_reconciliation.hotel_bookings (
  booking_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  traveller_id UUID NOT NULL,
  booking_version INTEGER NOT NULL DEFAULT 1 CHECK (booking_version >= 1),
  hotel_name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  checkin_date TIMESTAMPTZ NOT NULL,
  checkout_date TIMESTAMPTZ NOT NULL,
  booking_date TIMESTAMPTZ NOT NULL,
  room_nights INTEGER NOT NULL CHECK (room_nights >= 1),
  status TEXT NOT NULL CHECK (status IN ('confirmed', 'waitlisted')),
  hotel_chain TEXT,
  confirmation_number TEXT,
  supplier_code TEXT,
  employee_number TEXT,
  email TEXT,
  source_segment_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (checkout_date > checkin_date)
);

CREATE INDEX idx_hotel_bookings_tenant ON booking_reconciliation.hotel_bookings (tenant_id);
CREATE INDEX idx_hotel_bookings_traveller ON booking_reconciliation.hotel_bookings (tenant_id, traveller_id);
CREATE INDEX idx_hotel_bookings_dates ON booking_reconciliation.hotel_bookings (tenant_id, checkin_date, checkout_date);

-- Reconciliation Matches
CREATE TABLE booking_reconciliation.reconciliation_matches (
  booking_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  traveller_id UUID NOT NULL,
  candidate_trip_id UUID,
  confidence_score INTEGER NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 100),
  confidence_band TEXT NOT NULL CHECK (confidence_band IN ('matched', 'candidate', 'rejected')),
  match_status TEXT NOT NULL CHECK (match_status IN ('unmatched', 'candidate', 'matched', 'verified', 'rejected', 'expired', 'cancelled')),
  match_reasons JSONB NOT NULL DEFAULT '[]',
  rule_ids_applied TEXT[] NOT NULL DEFAULT '{}',
  audit_explanation TEXT NOT NULL,
  rejection_reason TEXT,
  decided_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recon_matches_tenant ON booking_reconciliation.reconciliation_matches (tenant_id);
CREATE INDEX idx_recon_matches_trip ON booking_reconciliation.reconciliation_matches (tenant_id, candidate_trip_id);
CREATE INDEX idx_recon_matches_status ON booking_reconciliation.reconciliation_matches (tenant_id, match_status);

-- Orphan Bookings
CREATE TABLE booking_reconciliation.orphan_bookings (
  booking_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  traveller_id UUID NOT NULL,
  hotel_name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  checkin_date TIMESTAMPTZ NOT NULL,
  checkout_date TIMESTAMPTZ NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL,
  reassociation_deadline TIMESTAMPTZ NOT NULL,
  room_nights INTEGER,
  hotel_chain TEXT,
  CHECK (checkout_date > checkin_date)
);

CREATE INDEX idx_orphan_bookings_tenant ON booking_reconciliation.orphan_bookings (tenant_id);
CREATE INDEX idx_orphan_bookings_traveller ON booking_reconciliation.orphan_bookings (tenant_id, traveller_id);
CREATE INDEX idx_orphan_bookings_deadline ON booking_reconciliation.orphan_bookings (tenant_id, reassociation_deadline);

-- Coverage Assessments
CREATE TABLE booking_reconciliation.coverage_assessments (
  trip_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  total_nights_required INTEGER NOT NULL CHECK (total_nights_required >= 0),
  nights_covered INTEGER NOT NULL CHECK (nights_covered >= 0),
  coverage_percent INTEGER NOT NULL CHECK (coverage_percent >= 0 AND coverage_percent <= 100),
  coverage_status TEXT NOT NULL CHECK (coverage_status IN ('fully_covered', 'mostly_covered', 'partially_covered', 'minimally_covered', 'no_accommodation')),
  matched_booking_ids UUID[] NOT NULL DEFAULT '{}',
  calculated_at TIMESTAMPTZ NOT NULL,
  previous_coverage_percent INTEGER
);

CREATE INDEX idx_coverage_tenant ON booking_reconciliation.coverage_assessments (tenant_id);
CREATE INDEX idx_coverage_trip ON booking_reconciliation.coverage_assessments (tenant_id, trip_id);

-- Candidate Trips (read model for matching)
CREATE TABLE booking_reconciliation.candidate_trips (
  candidate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  traveller_id UUID NOT NULL,
  trip_id UUID NOT NULL,
  trip_start_date TIMESTAMPTZ NOT NULL,
  trip_end_date TIMESTAMPTZ NOT NULL,
  trip_destination_city TEXT NOT NULL,
  trip_destination_country TEXT NOT NULL,
  candidate_source TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_candidate_trips_tenant ON booking_reconciliation.candidate_trips (tenant_id);
CREATE INDEX idx_candidate_trips_traveller ON booking_reconciliation.candidate_trips (tenant_id, traveller_id);
CREATE INDEX idx_candidate_trips_trip ON booking_reconciliation.candidate_trips (tenant_id, trip_id);

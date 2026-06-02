-- Migration 001: Create Project 1 Itinerary Intelligence tables
-- Schema: pnr_ingestion (per Approved Decision Q4)
-- All tables enforce tenant isolation via tenant_id column.

CREATE SCHEMA IF NOT EXISTS pnr_ingestion;

-- Travellers
CREATE TABLE pnr_ingestion.travellers (
  traveller_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  corporate_id UUID NOT NULL,
  employee_number TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT,
  cost_centre TEXT,
  country TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_travellers_tenant ON pnr_ingestion.travellers (tenant_id);
CREATE INDEX idx_travellers_email ON pnr_ingestion.travellers (tenant_id, email);
CREATE INDEX idx_travellers_corporate ON pnr_ingestion.travellers (tenant_id, corporate_id);

-- PNRs
CREATE TABLE pnr_ingestion.pnrs (
  pnr_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  corporate_id UUID NOT NULL,
  record_locator TEXT NOT NULL,
  source_system TEXT NOT NULL,
  booking_date TIMESTAMPTZ NOT NULL,
  ticket_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'archived')),
  traveller_id UUID NOT NULL,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  raw_pnr_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pnrs_tenant ON pnr_ingestion.pnrs (tenant_id);
CREATE INDEX idx_pnrs_record_locator ON pnr_ingestion.pnrs (tenant_id, record_locator);
CREATE INDEX idx_pnrs_traveller ON pnr_ingestion.pnrs (tenant_id, traveller_id);

-- Trips
CREATE TABLE pnr_ingestion.trips (
  trip_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  corporate_id UUID NOT NULL,
  traveller_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'booked', 'ticketed', 'pre_trip', 'in_trip', 'completed', 'cancelled')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trips_tenant ON pnr_ingestion.trips (tenant_id);
CREATE INDEX idx_trips_traveller ON pnr_ingestion.trips (tenant_id, traveller_id);

-- Segments
CREATE TABLE pnr_ingestion.segments (
  segment_id UUID PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES pnr_ingestion.trips(trip_id),
  tenant_id UUID NOT NULL,
  segment_type TEXT NOT NULL CHECK (segment_type IN ('flight', 'hotel', 'rail', 'car', 'transfer', 'other')),
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'waitlisted')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_datetime > start_datetime)
);

CREATE INDEX idx_segments_tenant ON pnr_ingestion.segments (tenant_id);
CREATE INDEX idx_segments_trip ON pnr_ingestion.segments (tenant_id, trip_id);

-- Timeline Events (append-only, immutable)
CREATE TABLE pnr_ingestion.timeline_events (
  event_id UUID PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES pnr_ingestion.trips(trip_id),
  tenant_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_timeline_events_trip ON pnr_ingestion.timeline_events (tenant_id, trip_id, created_at);

-- Prevent updates/deletes on timeline_events (immutability rule)
CREATE OR REPLACE FUNCTION pnr_ingestion.prevent_timeline_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Timeline events are immutable and cannot be modified or deleted';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_timeline_no_update
  BEFORE UPDATE ON pnr_ingestion.timeline_events
  FOR EACH ROW EXECUTE FUNCTION pnr_ingestion.prevent_timeline_mutation();

CREATE TRIGGER trg_timeline_no_delete
  BEFORE DELETE ON pnr_ingestion.timeline_events
  FOR EACH ROW EXECUTE FUNCTION pnr_ingestion.prevent_timeline_mutation();

-- Migration 001: Analytics Phase 1 tables
-- Schema: analytics
-- All tables enforce tenant isolation via tenant_id.

CREATE SCHEMA IF NOT EXISTS analytics;

-- Projection Checkpoints (system table)
CREATE TABLE analytics.projection_checkpoints (
  projector_name TEXT PRIMARY KEY,
  last_event_id UUID,
  last_event_timestamp TIMESTAMPTZ,
  last_processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  events_processed_count BIGINT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'rebuilding'))
);

-- Opportunity Pipeline (real-time, row per opportunity)
CREATE TABLE analytics.opportunity_pipeline (
  tenant_id UUID NOT NULL,
  opportunity_id UUID NOT NULL,
  corporate_id UUID NOT NULL,
  traveller_id UUID NOT NULL,
  trip_id UUID NOT NULL,
  opportunity_type TEXT NOT NULL,
  lifecycle_state TEXT NOT NULL,
  score INTEGER NOT NULL,
  priority TEXT NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL,
  qualified_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  closure_reason TEXT,
  rejection_reason TEXT,
  estimated_room_nights INTEGER,
  estimated_spend DECIMAL(12,2),
  estimated_commission DECIMAL(12,2),
  destination_city TEXT,
  destination_country TEXT,
  departure_date DATE,
  last_updated_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (tenant_id, opportunity_id)
);

CREATE INDEX idx_pipeline_state ON analytics.opportunity_pipeline (tenant_id, lifecycle_state);
CREATE INDEX idx_pipeline_priority ON analytics.opportunity_pipeline (tenant_id, priority);
CREATE INDEX idx_pipeline_type ON analytics.opportunity_pipeline (tenant_id, opportunity_type);
CREATE INDEX idx_pipeline_departure ON analytics.opportunity_pipeline (tenant_id, departure_date);
CREATE INDEX idx_pipeline_corporate ON analytics.opportunity_pipeline (tenant_id, corporate_id);

-- Duty of Care Trips (real-time, row per trip)
CREATE TABLE analytics.duty_of_care_trips (
  tenant_id UUID NOT NULL,
  trip_id UUID NOT NULL,
  corporate_id UUID NOT NULL,
  traveller_id UUID NOT NULL,
  destination_city TEXT,
  destination_country TEXT,
  departure_date DATE,
  coverage_percent INTEGER,
  coverage_status TEXT,
  accommodation_known BOOLEAN NOT NULL DEFAULT FALSE,
  gap_detected_at TIMESTAMPTZ,
  gap_resolved_at TIMESTAMPTZ,
  resolution_time_days INTEGER,
  destination_risk_level TEXT NOT NULL DEFAULT 'standard',
  is_unresolved BOOLEAN NOT NULL DEFAULT FALSE,
  last_updated_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (tenant_id, trip_id)
);

CREATE INDEX idx_doc_unresolved ON analytics.duty_of_care_trips (tenant_id, is_unresolved);
CREATE INDEX idx_doc_risk ON analytics.duty_of_care_trips (tenant_id, destination_risk_level);
CREATE INDEX idx_doc_corporate ON analytics.duty_of_care_trips (tenant_id, corporate_id);
CREATE INDEX idx_doc_departure ON analytics.duty_of_care_trips (tenant_id, departure_date);

-- Engagement Funnel Weekly (rollup)
CREATE TABLE analytics.engagement_funnel_weekly (
  tenant_id UUID NOT NULL,
  corporate_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  communications_sent INTEGER NOT NULL DEFAULT 0,
  responses_received INTEGER NOT NULL DEFAULT 0,
  bookings_created INTEGER NOT NULL DEFAULT 0,
  response_rate DECIMAL(5,2),
  acceptance_rate DECIMAL(5,2),
  conversion_rate DECIMAL(5,2),
  average_response_time_hours DECIMAL(8,2),
  escalation_count INTEGER NOT NULL DEFAULT 0,
  communications_by_type JSONB NOT NULL DEFAULT '{}',
  communications_by_channel JSONB NOT NULL DEFAULT '{}',
  responses_by_type JSONB NOT NULL DEFAULT '{}',
  PRIMARY KEY (tenant_id, corporate_id, period_start)
);

CREATE INDEX idx_funnel_tenant ON analytics.engagement_funnel_weekly (tenant_id, period_start);

-- Agent Escalations (real-time)
CREATE TABLE analytics.agent_escalations (
  tenant_id UUID NOT NULL,
  escalation_id UUID NOT NULL,
  opportunity_id UUID NOT NULL,
  traveller_id UUID NOT NULL,
  communication_id UUID NOT NULL,
  reason TEXT NOT NULL,
  priority TEXT NOT NULL,
  status TEXT NOT NULL,
  assigned_agent_id UUID,
  created_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  age_minutes INTEGER,
  PRIMARY KEY (tenant_id, escalation_id)
);

CREATE INDEX idx_esc_status ON analytics.agent_escalations (tenant_id, status);
CREATE INDEX idx_esc_priority ON analytics.agent_escalations (tenant_id, priority, status);

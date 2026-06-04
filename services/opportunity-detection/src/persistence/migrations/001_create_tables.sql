-- Migration 001: Create Opportunity Detection tables
-- Schema: opportunity_detection (per Approved Decision Q4)
-- All tables enforce tenant isolation via tenant_id column.

CREATE SCHEMA IF NOT EXISTS opportunity_detection;

-- Opportunities (aggregate root)
CREATE TABLE opportunity_detection.opportunities (
  opportunity_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  corporate_id UUID NOT NULL,
  traveller_id UUID NOT NULL,
  trip_id UUID NOT NULL,
  opportunity_type TEXT NOT NULL CHECK (opportunity_type IN ('missing_hotel', 'partial_coverage', 'out_of_policy', 'direct_booked', 'preferred_supplier', 'duty_of_care_gap', 'orphan_hotel_review')),
  lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN ('detected', 'qualified', 'suppressed', 'awaiting_action', 'active', 'communicated', 'converted', 'fulfilled', 'closed', 'rejected', 'expired', 'cancelled')),
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  closure_reason TEXT CHECK (closure_reason IN ('hotel_added', 'coverage_complete', 'fulfilled', 'resolved_without_conversion', 'trip_cancelled', 'expired', 'manual_closure')),
  rejection_reason TEXT CHECK (rejection_reason IN ('traveller_declined', 'admin_rejected', 'no_action_required', 'policy_exempted', 'duplicate_opportunity', 'supplier_exempted')),
  primary_suppression_reason TEXT CHECK (primary_suppression_reason IN ('corporate_policy_override', 'manual_suppression', 'trip_cancellation_pending', 'orphan_reassociation_window', 'traveller_recently_declined', 'existing_booking_in_flight', 'duplicate_opportunity', 'existing_active_opportunity', 'communication_cooldown', 'executive_traveller_review', 'supplier_contract_exemption')),
  suppressed_until TIMESTAMPTZ,
  correlation_id UUID NOT NULL,
  triggering_event_id UUID,
  triggering_event_type TEXT,
  destination_city TEXT,
  destination_country TEXT,
  departure_date DATE,
  estimated_room_nights INTEGER CHECK (estimated_room_nights >= 1),
  estimated_spend DECIMAL(12,2) CHECK (estimated_spend >= 0),
  estimated_commission DECIMAL(12,2) CHECK (estimated_commission >= 0),
  reopen_count INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1 CHECK (version >= 1),
  detected_at TIMESTAMPTZ NOT NULL,
  qualified_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_opportunities_tenant ON opportunity_detection.opportunities (tenant_id);
CREATE INDEX idx_opportunities_traveller ON opportunity_detection.opportunities (tenant_id, traveller_id);
CREATE INDEX idx_opportunities_trip ON opportunity_detection.opportunities (tenant_id, trip_id);
CREATE INDEX idx_opportunities_state ON opportunity_detection.opportunities (tenant_id, lifecycle_state);
CREATE INDEX idx_opportunities_type ON opportunity_detection.opportunities (tenant_id, opportunity_type);
CREATE INDEX idx_opportunities_expires ON opportunity_detection.opportunities (tenant_id, expires_at);

-- Opportunity Assessments (append-only)
CREATE TABLE opportunity_detection.opportunity_assessments (
  assessment_id UUID PRIMARY KEY,
  opportunity_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  hotel_requirement_confidence INTEGER NOT NULL CHECK (hotel_requirement_confidence >= 0 AND hotel_requirement_confidence <= 100),
  compliance_severity INTEGER NOT NULL CHECK (compliance_severity >= 0 AND compliance_severity <= 100),
  revenue_opportunity INTEGER NOT NULL CHECK (revenue_opportunity >= 0 AND revenue_opportunity <= 100),
  duty_of_care_impact INTEGER NOT NULL CHECK (duty_of_care_impact >= 0 AND duty_of_care_impact <= 100),
  supplier_contract_impact INTEGER NOT NULL CHECK (supplier_contract_impact >= 0 AND supplier_contract_impact <= 100),
  time_to_departure INTEGER NOT NULL CHECK (time_to_departure >= 0 AND time_to_departure <= 100),
  total_score INTEGER NOT NULL CHECK (total_score >= 0 AND total_score <= 100),
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  correlation_id UUID NOT NULL,
  rule_ids_applied TEXT[] NOT NULL DEFAULT '{}',
  previous_score INTEGER,
  score_change_reason TEXT,
  assessed_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_assessments_tenant ON opportunity_detection.opportunity_assessments (tenant_id);
CREATE INDEX idx_assessments_opportunity ON opportunity_detection.opportunity_assessments (tenant_id, opportunity_id);

-- Opportunity Suppressions
CREATE TABLE opportunity_detection.opportunity_suppressions (
  suppression_id UUID PRIMARY KEY,
  opportunity_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  suppression_reason TEXT NOT NULL CHECK (suppression_reason IN ('corporate_policy_override', 'manual_suppression', 'trip_cancellation_pending', 'orphan_reassociation_window', 'traveller_recently_declined', 'existing_booking_in_flight', 'duplicate_opportunity', 'existing_active_opportunity', 'communication_cooldown', 'executive_traveller_review', 'supplier_contract_exemption')),
  suppression_priority INTEGER NOT NULL,
  suppressed_at TIMESTAMPTZ NOT NULL,
  suppressed_until TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  resolved_at TIMESTAMPTZ,
  resolution_trigger TEXT,
  actor_id UUID
);

CREATE INDEX idx_suppressions_tenant ON opportunity_detection.opportunity_suppressions (tenant_id);
CREATE INDEX idx_suppressions_opportunity ON opportunity_detection.opportunity_suppressions (tenant_id, opportunity_id);
CREATE INDEX idx_suppressions_active ON opportunity_detection.opportunity_suppressions (tenant_id, is_active);
CREATE INDEX idx_suppressions_until ON opportunity_detection.opportunity_suppressions (tenant_id, suppressed_until) WHERE is_active = TRUE;

-- Opportunity Communications
CREATE TABLE opportunity_detection.opportunity_communications (
  communication_id UUID PRIMARY KEY,
  opportunity_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  traveller_id UUID NOT NULL,
  communication_type TEXT NOT NULL CHECK (communication_type IN ('initial_contact', 'reminder', 'escalation', 'follow_up')),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'portal', 'agent_call')),
  sent_at TIMESTAMPTZ NOT NULL,
  correlation_id UUID NOT NULL,
  template_id TEXT,
  external_communication_id UUID,
  response_received_at TIMESTAMPTZ,
  communication_outcome TEXT CHECK (communication_outcome IN ('opened', 'clicked', 'accepted', 'declined', 'bounced', 'no_response', 'unsubscribed'))
);

CREATE INDEX idx_communications_tenant ON opportunity_detection.opportunity_communications (tenant_id);
CREATE INDEX idx_communications_opportunity ON opportunity_detection.opportunity_communications (tenant_id, opportunity_id);

-- Opportunity Closures
CREATE TABLE opportunity_detection.opportunity_closures (
  closure_id UUID PRIMARY KEY,
  opportunity_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  terminal_state TEXT NOT NULL CHECK (terminal_state IN ('closed', 'rejected', 'expired', 'cancelled')),
  closure_reason TEXT CHECK (closure_reason IN ('hotel_added', 'coverage_complete', 'fulfilled', 'resolved_without_conversion', 'trip_cancelled', 'expired', 'manual_closure')),
  rejection_reason TEXT CHECK (rejection_reason IN ('traveller_declined', 'admin_rejected', 'no_action_required', 'policy_exempted', 'duplicate_opportunity', 'supplier_exempted')),
  closed_at TIMESTAMPTZ NOT NULL,
  correlation_id UUID NOT NULL,
  causation_id UUID NOT NULL,
  actor_id UUID,
  actor_type TEXT CHECK (actor_type IN ('system', 'tmc_user', 'tmc_admin', 'corporate_admin', 'platform_admin')),
  notes TEXT,
  invalidated_at TIMESTAMPTZ,
  invalidation_event_id UUID
);

CREATE INDEX idx_closures_tenant ON opportunity_detection.opportunity_closures (tenant_id);
CREATE INDEX idx_closures_opportunity ON opportunity_detection.opportunity_closures (tenant_id, opportunity_id);

-- Opportunity Audit Entries (append-only)
CREATE TABLE opportunity_detection.opportunity_audit_entries (
  audit_id UUID PRIMARY KEY,
  opportunity_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('system', 'tmc_user', 'tmc_admin', 'corporate_admin', 'platform_admin')),
  correlation_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  actor_id UUID,
  previous_value JSONB,
  new_value JSONB,
  rule_id TEXT,
  reason TEXT
);

CREATE INDEX idx_audit_tenant ON opportunity_detection.opportunity_audit_entries (tenant_id);
CREATE INDEX idx_audit_opportunity ON opportunity_detection.opportunity_audit_entries (tenant_id, opportunity_id);

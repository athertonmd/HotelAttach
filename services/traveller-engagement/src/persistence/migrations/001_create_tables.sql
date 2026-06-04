-- Migration 001: Create Traveller Engagement tables
-- Schema: traveller_engagement (per Approved Decision Q4)
-- All tables enforce tenant isolation via tenant_id column.

CREATE SCHEMA IF NOT EXISTS traveller_engagement;

-- Communications (aggregate root)
CREATE TABLE traveller_engagement.communications (
  communication_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  corporate_id UUID NOT NULL,
  traveller_id UUID NOT NULL,
  opportunity_id UUID NOT NULL,
  communication_type TEXT NOT NULL CHECK (communication_type IN ('initial_contact', 'reminder', 'escalation', 'follow_up')),
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'portal', 'agent_call')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'scheduled', 'sent', 'opened', 'clicked', 'responded', 'bounced', 'expired', 'cancelled', 'suppressed')),
  correlation_id UUID NOT NULL,
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_communications_tenant ON traveller_engagement.communications (tenant_id);
CREATE INDEX idx_communications_opportunity ON traveller_engagement.communications (tenant_id, opportunity_id);
CREATE INDEX idx_communications_traveller ON traveller_engagement.communications (tenant_id, traveller_id);
CREATE INDEX idx_communications_status ON traveller_engagement.communications (tenant_id, status);

-- Traveller Actions (secure tokens for action links)
CREATE TABLE traveller_engagement.traveller_actions (
  action_id UUID PRIMARY KEY,
  communication_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  traveller_id UUID NOT NULL,
  token UUID NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_actions_tenant ON traveller_engagement.traveller_actions (tenant_id);
CREATE INDEX idx_actions_token ON traveller_engagement.traveller_actions (tenant_id, token);
CREATE INDEX idx_actions_expires ON traveller_engagement.traveller_actions (tenant_id, expires_at) WHERE NOT is_used;

-- Traveller Responses (append-only)
CREATE TABLE traveller_engagement.traveller_responses (
  response_id UUID PRIMARY KEY,
  communication_id UUID NOT NULL,
  opportunity_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  traveller_id UUID NOT NULL,
  response_type TEXT NOT NULL CHECK (response_type IN ('accepted', 'declined', 'confirmed_external', 'provided_details')),
  responded_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  correlation_id UUID NOT NULL
);

CREATE INDEX idx_responses_tenant ON traveller_engagement.traveller_responses (tenant_id);
CREATE INDEX idx_responses_communication ON traveller_engagement.traveller_responses (tenant_id, communication_id);

-- Booking Requests
CREATE TABLE traveller_engagement.booking_requests (
  request_id UUID PRIMARY KEY,
  opportunity_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  corporate_id UUID NOT NULL,
  traveller_id UUID NOT NULL,
  trip_id UUID NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('created', 'assigned', 'processing', 'completed', 'failed', 'cancelled')),
  requested_at TIMESTAMPTZ NOT NULL,
  destination_city TEXT,
  destination_country TEXT,
  requested_nights INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_booking_requests_tenant ON traveller_engagement.booking_requests (tenant_id);
CREATE INDEX idx_booking_requests_status ON traveller_engagement.booking_requests (tenant_id, status);

-- Agent Escalations
CREATE TABLE traveller_engagement.agent_escalations (
  escalation_id UUID PRIMARY KEY,
  opportunity_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  traveller_id UUID NOT NULL,
  communication_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('high_value_opportunity', 'executive_traveller', 'trip_within_48h', 'delivery_bounced', 'no_response_reminder', 'manual_escalation')),
  priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'assigned', 'resolved', 'expired')),
  assigned_agent_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_escalations_tenant ON traveller_engagement.agent_escalations (tenant_id);
CREATE INDEX idx_escalations_status ON traveller_engagement.agent_escalations (tenant_id, status);

-- Traveller Preferences
CREATE TABLE traveller_engagement.traveller_preferences (
  preference_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  traveller_id UUID NOT NULL,
  email_opted_out BOOLEAN NOT NULL DEFAULT FALSE,
  sms_opted_out BOOLEAN NOT NULL DEFAULT FALSE,
  suppressed_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(tenant_id, traveller_id)
);

CREATE INDEX idx_preferences_tenant ON traveller_engagement.traveller_preferences (tenant_id);
CREATE INDEX idx_preferences_traveller ON traveller_engagement.traveller_preferences (tenant_id, traveller_id);

-- Communication Audit Entries (append-only)
CREATE TABLE traveller_engagement.communication_audit_entries (
  audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  communication_id UUID NOT NULL,
  action TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  details TEXT
);

CREATE INDEX idx_audit_tenant ON traveller_engagement.communication_audit_entries (tenant_id);
CREATE INDEX idx_audit_communication ON traveller_engagement.communication_audit_entries (tenant_id, communication_id);

-- Migration 001: Create Behaviour Intelligence tables
-- Schema: behaviour_intelligence (per Approved Decision — per-service schemas)
-- All tables enforce tenant isolation via tenant_id column.

CREATE SCHEMA IF NOT EXISTS behaviour_intelligence;

-- Traveller Behaviour Profiles
CREATE TABLE behaviour_intelligence.traveller_behaviour_profiles (
  tenant_id UUID NOT NULL,
  traveller_id UUID NOT NULL,
  corporate_id UUID NOT NULL,
  avg_lead_time_days NUMERIC(6,1) NOT NULL,
  booking_consistency NUMERIC(4,2) NOT NULL CHECK (booking_consistency BETWEEN 0 AND 1),
  booking_variability_days NUMERIC(6,1) NOT NULL,
  compliance_rate NUMERIC(5,1) NOT NULL CHECK (compliance_rate BETWEEN 0 AND 100),
  avg_response_time_hours NUMERIC(8,1) NOT NULL,
  preferred_channel TEXT NOT NULL CHECK (preferred_channel IN ('email', 'sms', 'push_notification', 'in_app')),
  self_booking_rate NUMERIC(5,1) NOT NULL CHECK (self_booking_rate BETWEEN 0 AND 100),
  trips_analysed INTEGER NOT NULL CHECK (trips_analysed >= 1),
  trip_count_used INTEGER NOT NULL CHECK (trip_count_used >= 1),
  predicted_lead_time_days NUMERIC(6,1) NOT NULL,
  confidence_score INTEGER NOT NULL CHECK (confidence_score BETWEEN 0 AND 100),
  segment TEXT NOT NULL CHECK (segment IN ('self_sufficient', 'reliable_late', 'needs_prompting', 'requires_intervention', 'non_compliant')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, traveller_id)
);

CREATE INDEX idx_profiles_corporate ON behaviour_intelligence.traveller_behaviour_profiles (tenant_id, corporate_id);

-- Traveller Archetypes
CREATE TABLE behaviour_intelligence.traveller_archetypes (
  tenant_id UUID NOT NULL,
  traveller_id UUID NOT NULL,
  archetype TEXT NOT NULL CHECK (archetype IN ('autopilot', 'procrastinator', 'responsive', 'nudge_needer', 'reluctant', 'chaotic', 'new_traveller')),
  confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
  previous_archetype TEXT CHECK (previous_archetype IN ('autopilot', 'procrastinator', 'responsive', 'nudge_needer', 'reluctant', 'chaotic', 'new_traveller')),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, traveller_id)
);

-- Booking Attributions (append-only)
CREATE TABLE behaviour_intelligence.booking_attributions (
  attribution_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  booking_id UUID NOT NULL,
  traveller_id UUID NOT NULL,
  corporate_id UUID NOT NULL,
  opportunity_id UUID,
  attribution_type TEXT NOT NULL CHECK (attribution_type IN ('independent', 'email', 'sms', 'push_notification', 'in_app', 'agent_intervention', 'corporate_policy', 'unknown')),
  communication_id UUID,
  attribution_window_hours INTEGER,
  hours_from_communication NUMERIC(8,1),
  confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
  estimated_commission NUMERIC(10,2) NOT NULL CHECK (estimated_commission >= 0),
  attributed_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_attributions_tenant ON behaviour_intelligence.booking_attributions (tenant_id);
CREATE INDEX idx_attributions_booking ON behaviour_intelligence.booking_attributions (tenant_id, booking_id);
CREATE INDEX idx_attributions_traveller ON behaviour_intelligence.booking_attributions (tenant_id, traveller_id);
CREATE INDEX idx_attributions_opportunity ON behaviour_intelligence.booking_attributions (tenant_id, opportunity_id);

-- Behaviour Drifts
CREATE TABLE behaviour_intelligence.behaviour_drifts (
  tenant_id UUID NOT NULL,
  traveller_id UUID NOT NULL,
  corporate_id UUID NOT NULL,
  drift_score INTEGER NOT NULL CHECK (drift_score BETWEEN 0 AND 100),
  stability_score INTEGER NOT NULL CHECK (stability_score BETWEEN 0 AND 100),
  drift_status TEXT NOT NULL CHECK (drift_status IN ('stable', 'moderate', 'significant')),
  drift_direction TEXT NOT NULL CHECK (drift_direction IN ('improving', 'declining', 'lateral')),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, traveller_id)
);

CREATE INDEX idx_drifts_corporate ON behaviour_intelligence.behaviour_drifts (tenant_id, corporate_id);

-- Communication Fatigues
CREATE TABLE behaviour_intelligence.communication_fatigues (
  tenant_id UUID NOT NULL,
  traveller_id UUID NOT NULL,
  corporate_id UUID NOT NULL,
  fatigue_score INTEGER NOT NULL CHECK (fatigue_score BETWEEN 0 AND 100),
  fatigue_level TEXT NOT NULL CHECK (fatigue_level IN ('low', 'medium', 'high', 'critical')),
  comms_30d INTEGER NOT NULL DEFAULT 0,
  ignored_rate NUMERIC(4,2) NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, traveller_id)
);

CREATE INDEX idx_fatigues_corporate ON behaviour_intelligence.communication_fatigues (tenant_id, corporate_id);

-- Revenue At Risk
CREATE TABLE behaviour_intelligence.revenue_at_risks (
  tenant_id UUID NOT NULL,
  traveller_id UUID NOT NULL,
  corporate_id UUID NOT NULL,
  estimated_commission NUMERIC(10,2) NOT NULL CHECK (estimated_commission >= 0),
  attachment_likelihood NUMERIC(5,1) NOT NULL CHECK (attachment_likelihood BETWEEN 0 AND 100),
  revenue_at_risk NUMERIC(10,2) NOT NULL,
  risk_tier TEXT NOT NULL CHECK (risk_tier IN ('secure', 'likely', 'uncertain', 'at_risk', 'critical')),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, traveller_id)
);

CREATE INDEX idx_revenue_corporate ON behaviour_intelligence.revenue_at_risks (tenant_id, corporate_id);

-- Recommended Actions
CREATE TABLE behaviour_intelligence.recommended_actions (
  tenant_id UUID NOT NULL,
  opportunity_id UUID NOT NULL,
  traveller_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('do_nothing', 'wait', 'send_email', 'send_sms', 'send_push', 'escalate')),
  confidence INTEGER NOT NULL CHECK (confidence BETWEEN 0 AND 100),
  explanation_text TEXT NOT NULL,
  fatigue_level TEXT NOT NULL CHECK (fatigue_level IN ('low', 'medium', 'high', 'critical')),
  drift_status TEXT NOT NULL CHECK (drift_status IN ('stable', 'moderate', 'significant')),
  days_to_departure INTEGER NOT NULL,
  predicted_lead_time_days NUMERIC(6,1) NOT NULL,
  recommended_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, opportunity_id)
);

CREATE INDEX idx_actions_traveller ON behaviour_intelligence.recommended_actions (tenant_id, traveller_id);

-- Prediction Outcomes (append-only)
CREATE TABLE behaviour_intelligence.prediction_outcomes (
  prediction_id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  recommendation_id TEXT NOT NULL,
  traveller_id UUID NOT NULL,
  corporate_id UUID NOT NULL,
  opportunity_id UUID NOT NULL,
  recommended_action TEXT NOT NULL CHECK (recommended_action IN ('do_nothing', 'wait', 'send_email', 'send_sms', 'send_push', 'escalate')),
  actual_outcome TEXT NOT NULL CHECK (actual_outcome IN ('booked_independently', 'booked_after_communication', 'booked_after_escalation', 'expired_unbooked', 'cancelled')),
  was_correct BOOLEAN NOT NULL,
  days_difference INTEGER NOT NULL DEFAULT 0,
  resolved_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_outcomes_tenant ON behaviour_intelligence.prediction_outcomes (tenant_id);
CREATE INDEX idx_outcomes_traveller ON behaviour_intelligence.prediction_outcomes (tenant_id, traveller_id);
CREATE INDEX idx_outcomes_opportunity ON behaviour_intelligence.prediction_outcomes (tenant_id, opportunity_id);
CREATE INDEX idx_outcomes_recommendation ON behaviour_intelligence.prediction_outcomes (tenant_id, recommendation_id);

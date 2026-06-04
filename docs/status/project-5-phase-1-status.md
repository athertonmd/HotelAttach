Project 5 — Compliance Analytics Portal — Phase 1 Completion Summary

Status: Phase 1 Complete (backend analytics layer, ready for frontend dashboard implementation)

Implemented Tables/Read Models (5 + system):

Table Type Purpose
analytics.projection_checkpoints System Event replay position per projector
analytics.opportunity_pipeline Real-time Row per opportunity, current state
analytics.duty_of_care_trips Real-time Row per trip, coverage/gap tracking
analytics.engagement_funnel_weekly Weekly rollup Communication/response/booking counts
analytics.agent_escalations Real-time Row per escalation, status tracking
Projectors (4 + dispatcher):

Projector Events Consumed Output
OpportunityPipelineProjector OpportunityCreated, Updated, Closed, Rejected Pipeline read model
DutyOfCareProjector HotelCoverageUpdated, OpportunityCreated (duty_of_care_gap), OpportunityClosed DutyOfCare read model
EngagementFunnelProjector CommunicationSent, TravellerResponded, BookingRequestCreated Weekly funnel rollup
AgentEscalationProjector OpportunityCreated (awaiting_action) Escalation queue
projectEvent (dispatcher) All 23 event types Routes to correct projector
Query Services (4):

Service Key Metrics
getOpportunitySummary activeCount, criticalCount, awaitingAction, atRisk, byPriority, byType
getOpportunityList Filtered list with pagination (limit/offset), corporateId filter
getDutyOfCareSummary totalTrips, visibilityRate, unresolvedCount, highRiskUnresolved, approachingDeparture
getEngagementSummary communicationsSent, responsesReceived, bookingsCreated, responseRate, conversionRate
getEscalationSummary pendingCount, totalCount, byPriority, byReason
API Handlers (5):

Handler Route Validation
handleGetOpportunitySummary GET /analytics/opportunities/summary tenantId required
handleGetOpportunityList GET /analytics/opportunities Pagination (1–100), corporateId filter
handleGetDutyOfCareSummary GET /analytics/duty-of-care/summary tenantId required
handleGetEngagementSummary GET /analytics/engagement/summary periodStart date validation
handleGetEscalationSummary GET /analytics/escalations/summary tenantId required
E2E Scenarios (10):

OpportunityCreated → pipeline → API active count
OpportunityClosed → active count decreases
HotelCoverageUpdated → unresolved gap
CommunicationSent → weekly sent count
TravellerResponded → response count
awaiting_action → pending escalation
Tenant isolation (Tenant B sees nothing)
correlationId propagation
Unsupported event safety
Multiple events + closure accumulation
Test Counts:

analytics-api: 82 tests (18 repos + 8 pg-repos + 14 projectors + 19 queries + 13 api-handlers + 10 e2e)
Platform total: ~778 tests (35 + 52 + 142 + 152 + 190 + 134 + 82 — approximate, minus observability/validation which have 0)
Known Limitations:

No EventBridge consumer wiring (projectors called programmatically)
No real PostgreSQL connection (uses in-memory repos + mock Pg tests)
No authentication/RBAC (RequestContext constructed manually)
No frontend dashboard UI
Engagement funnel uses simple increment (no deduplication on replay without checkpoint check)
Agent escalation projector only handles OpportunityCreated awaiting_action (bounced delivery escalations not projected yet)
No historical snapshots for trend analysis
No export functionality (CSV/PDF)
No real-time WebSocket updates to dashboards
Deferred Phase 2 Read Models:

compliance_status_monthly (monthly rollup from out_of_policy/direct_booked)
revenue_forecast_monthly (pipeline value + conversion rate)
reconciliation_summary_monthly (match rates, confidence distribution)
Deferred Phase 3 Read Models:

supplier_attainment_monthly (requires contract configuration data)
programme_health_weekly (composite score from all other projections)
audit_entries (full event stream replay)
Post-MVP:

corporate_benchmark (cross-corporate anonymised comparison)
Readiness for Frontend Dashboard:

✅ All 5 API handler functions ready with consistent response shapes
✅ RequestContext abstraction ready for Cognito integration
✅ Tenant isolation proven through E2E tests
✅ Pagination supported for list endpoints
✅ Date range filtering supported
✅ Error responses standardised (UNAUTHORIZED, INVALID_PAGINATION, INVALID_DATE_RANGE, INTERNAL_ERROR)
✅ correlationId included in all responses for debugging

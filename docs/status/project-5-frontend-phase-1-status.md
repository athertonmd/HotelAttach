Project 5D — Analytics Portal Phase 1 Frontend — Complete
Status: All Phase 1 dashboard pages implemented with mock data

Routes Implemented (4)
Route Page Status
/analytics/opportunities Opportunity Operations Dashboard ✅
/analytics/duty-of-care Duty of Care Dashboard ✅
/analytics/engagement Traveller Engagement Dashboard ✅
/analytics/escalations Agent Escalations Dashboard ✅
Plus root / redirects to /analytics/opportunities.

Shared UI Components (8)
KpiCard, DataTable (with pagination), PageHeader, FilterBar, LoadingState, ErrorState, EmptyState, StatusBadge

Mock API Client
5 methods: getOpportunitySummary, getOpportunityList, getDutyOfCareSummary, getEngagementSummary, getEscalationSummary
Configurable delay, error simulation, pagination/filtering support
Response shapes match analytics-api query services
Injectable via props for testability
Dashboard Pages
Opportunity Operations — 4 KPI cards, priority/type breakdowns, filterable paginated table (7 columns), filter bar (priority + lifecycleState)

Duty of Care — 4 KPI cards (visibility rate %, unresolved gaps, high-risk, approaching departure), destination breakdown, approaching departure table

Traveller Engagement — 4 KPI cards (comms sent, response rate, conversion rate, escalations), channel/type/response-type breakdowns

Agent Escalations — 4 KPI cards (pending, total, critical, assigned), priority/reason breakdowns, escalation queue table (7 columns)

All pages include loading, error, and empty states.

Tests Added
Test File Tests
App.test.tsx 5
components.test.tsx 11
mock-client.test.ts 11
opportunities-page.test.tsx 7
duty-of-care-page.test.tsx 7
engagement-page.test.tsx 7
escalations-page.test.tsx 8
Portal Total 56
Platform total: ~820 (35 event-contracts + 52 contract-tests + 142 pnr-ingestion + 152 booking-reconciliation + 190 opportunity-detection + 134 traveller-engagement + 82 analytics-api + 56 portal — approximate, cached runs may vary)

Known Limitations
No live API integration — all data comes from mock client
No authentication/authorisation — no tenant context, no JWT
No charting library — breakdowns rendered as lists, not visual charts
No real-time updates — no WebSocket/polling
No corporate selector functionality (placeholder only)
No date range filtering on pages (supported by API types but not wired to UI)
No responsive/mobile layout optimisation
No theming or design system tokens
FilterBar type filter not wired on Opportunities page (only priority + status connected)
Mock data is static — no simulated state changes
Readiness for Live API Integration
The portal is structured for a straightforward swap from mock to live:

Replace createMockClient with a real HTTP client implementing the same MockClient interface — all 5 methods have typed request/response contracts
Add auth context — inject tenantId from JWT into API calls; pages already accept client via props
Wire corporate selector — FilterBar has the placeholder; pass corporateId to API methods
Add date range filters — OpportunityListParams already supports them; just wire UI controls
Swap to charts — breakdown sections have data in Record<string, number> shape, ready for any chart library
No structural changes required — the page components, data flow, and test patterns are all production-ready for the API swap.

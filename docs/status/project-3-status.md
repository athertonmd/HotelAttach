Project 3 — Opportunity Detection Engine — Completion Summary

Status: Complete (MVP domain logic, ready for Project 4 integration)

Total platform test count: 565 (35 event-contracts + 46 contract-tests + 142 pnr-ingestion + 152 booking-reconciliation + 190 opportunity-detection)

Implemented Components:

Phase Description
3A Design analysis: opportunity types, lifecycle, suppression, reopening, domain entities, event catalogue, business rules, scoring, architecture decisions
3B-2 Schema layer: 4 JSON schemas, envelope expansion to 20 event types, TypeScript payload types, fixtures, contract tests
3C-1 Domain model: 8 entities (Opportunity aggregate root + 7 children), full lifecycle state machine
3C-2 Business rules & scoring: BR-501–506 detection rules, BR-600 weighted scoring, corporate multipliers, stub providers
3C-3 Event factories: 4 factory functions mapping domain → schema-validated events
3D-1 Repository layer: 6 interfaces + 6 in-memory implementations with tenant isolation
3D-2 Application service: OpportunityDetectionService with 7 handler methods
3E-1 Persistence design: PostgreSQL migration (6 tables, 13 indexes), PgOpportunityRepository with version conflict handling
3E-2 E2E validation: 10 scenarios, 18 tests proving full workflow
Event Schemas (4):

opportunity-created.schema.json
opportunity-updated.schema.json
opportunity-closed.schema.json
opportunity-rejected.schema.json
Domain Model (8 entities):

Opportunity (aggregate root, 12-state lifecycle)
OpportunityAssessment (append-only scoring)
OpportunityAction (state transition log)
OpportunitySuppression (multiple active, priority-ordered)
OpportunityCommunication (outcome tracking)
OpportunityClosure (terminal reason with invalidation)
OpportunityRecommendation (actionable next steps)
OpportunityAuditEntry (BR-1104 compliance)
Business Rules Implemented:

BR-501–506 (detection rules)
BR-600 (weighted scoring with 6 components)
BR-701–704 (duty of care)
BR-801–803 (supplier contract)
BR-901–906 (engagement pre-rules as routing/suppression)
BR-1001–1005 (closure rules)
BR-1101–1104 (manual override and audit)
Minimum creation threshold (<20 = no opportunity)
Corporate severity multipliers (configurable per category)
Application Service Methods:

handleHotelCoverageUpdated
handleHotelMatched
handleHotelOrphanDetected
handleTripCancelled
handleTravellerResponded
handleManualClosure
handleManualSuppression
Repositories (6 interfaces + 6 in-memory + 1 Pg):

OpportunityRepository (with version conflict handling)
OpportunityAssessmentRepository
OpportunitySuppressionRepository
OpportunityCommunicationRepository
OpportunityClosureRepository
OpportunityAuditRepository
Persistence Design:

1 SQL migration creating opportunity_detection schema with 6 tables
13 indexes covering tenant, traveller, trip, state, type, expiry, suppression
Optimistic versioning on Opportunity aggregate
E2E Scenarios (10):

Missing hotel opportunity creation + schema validation
Partial coverage opportunity creation
Full coverage closure
Orphan suppression (prevents creation)
Traveller decline rejection
Manual closure
Duplicate prevention
Trip cancellation
Tenant isolation
Correlation propagation
Known Limitations:

Scoring uses hardcoded defaults (hotelRequirementConfidence=90, revenueOpportunity=50, timeToDeparture=40) — real scoring requires trip context data
Reopen logic is designed but not exercised in E2E (requires coverage drop after closure scenario)
No event consumer wiring — service is called programmatically, not via EventBridge subscription
No authentication/authorization middleware
Stub providers for policy, supplier contracts, destination risk, ADR
OpportunityRecommendation entity exists but not populated by application service yet
OpportunityAssessment not persisted during opportunity creation (scoring happens inline)
Deferred Items:

REST API layer (POST /opportunities/evaluate, GET /opportunities, etc.)
EventBridge consumer wiring (subscribe to HotelCoverageUpdated, HotelMatched, etc.)
Real policy engine integration (PolicyChanged events)
Real supplier contract data (SupplierContractChanged events)
Destination risk feed integration
Revenue estimation from corporate programme rates
Recommendation generation in service
Opportunity expiry timer (background scheduler)
Communication cooldown enforcement (requires Project 4 events)
Readiness for Project 4:

✅ OpportunityCreated events flow with all required payload fields
✅ OpportunityRejected events published when traveller declines
✅ OpportunityClosed events published on all closure scenarios
✅ Tenant isolation enforced and proven
✅ Correlation propagation maintained
✅ All events validate against authoritative JSON schemas
✅ Recommendation structure defined (Project 4 can consume)
✅ Suppression model prevents premature traveller contact
Project 4 (Traveller Engagement) can consume OpportunityCreated events to trigger communication workflows. The event payload includes opportunityType, priority, score, travellerId, tripId, and optional recommendation — sufficient for Project 4 to determine communication timing, channel, and template.

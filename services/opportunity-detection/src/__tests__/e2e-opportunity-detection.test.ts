/**
 * E2E Tests: Opportunity Detection Full Flow
 * Proves complete workflows using in-memory repos, event bus, and schema validation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryEventBus } from '@hci/event-contracts';
import { SchemaValidator } from '@hci/validation';
import { OpportunityDetectionService } from '../services/opportunity-detection-service.js';
import {
  InMemoryOpportunityRepository,
  InMemoryOpportunityAssessmentRepository,
  InMemoryOpportunitySuppressionRepository,
  InMemoryOpportunityCommunicationRepository,
  InMemoryOpportunityClosureRepository,
  InMemoryOpportunityAuditRepository,
} from '../repositories/in-memory.js';
import { Opportunity } from '../domain/opportunity.js';

const TENANT_A = 'aaaa1111-aaaa-4000-8000-aaaaaaaaaaaa';
const TENANT_B = 'bbbb2222-bbbb-4000-8000-bbbbbbbbbbbb';
const CORP = 'cccc3333-cccc-4000-8000-cccccccccccc';
const TRAVELLER = 'dddd4444-dddd-4000-8000-dddddddddddd';
const TRIP = 'eeee5555-eeee-4000-8000-eeeeeeeeeeee';
const CORR_ID = 'ffff6666-ffff-4000-8000-ffffffffffff';

let service: OpportunityDetectionService;
let opportunityRepo: InMemoryOpportunityRepository;
let bus: InMemoryEventBus;
let validator: SchemaValidator;

beforeEach(() => {
  opportunityRepo = new InMemoryOpportunityRepository();
  const assessmentRepo = new InMemoryOpportunityAssessmentRepository();
  const suppressionRepo = new InMemoryOpportunitySuppressionRepository();
  const communicationRepo = new InMemoryOpportunityCommunicationRepository();
  const closureRepo = new InMemoryOpportunityClosureRepository();
  const auditRepo = new InMemoryOpportunityAuditRepository();
  bus = new InMemoryEventBus();
  validator = new SchemaValidator();

  service = new OpportunityDetectionService(
    opportunityRepo,
    assessmentRepo,
    suppressionRepo,
    communicationRepo,
    closureRepo,
    auditRepo,
    bus,
  );
});

describe('Scenario 1 — Missing Hotel Opportunity', () => {
  it('creates opportunity and emits OpportunityCreated', async () => {
    const result = await service.handleHotelCoverageUpdated(
      {
        tenantId: TENANT_A,
        corporateId: CORP,
        travellerId: TRAVELLER,
        tripId: TRIP,
        coveragePercent: 0,
        coverageStatus: 'no_accommodation',
      },
      { correlationId: CORR_ID },
    );
    expect(result.success).toBe(true);
    expect(result.data?.opportunityId).toBeDefined();

    const events = bus.getEventsByType('OpportunityCreated');
    expect(events).toHaveLength(1);
    expect(events[0]!.payload).toMatchObject({ opportunityType: 'missing_hotel' });
  });

  it('stored opportunity is retrievable', async () => {
    const result = await service.handleHotelCoverageUpdated({
      tenantId: TENANT_A,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      coveragePercent: 0,
      coverageStatus: 'no_accommodation',
    });
    const opp = await opportunityRepo.findById(TENANT_A, result.data!.opportunityId!);
    expect(opp).toBeDefined();
    expect(opp!.opportunityType).toBe('missing_hotel');
    expect(opp!.lifecycleState).toBe('qualified');
  });

  it('emitted event validates against schema', async () => {
    await service.handleHotelCoverageUpdated({
      tenantId: TENANT_A,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      coveragePercent: 0,
      coverageStatus: 'no_accommodation',
    });
    const ev = bus.getEventsByType('OpportunityCreated')[0]!;
    const vr = validator.validateEvent('opportunity-created', ev);
    expect(vr.errors).toHaveLength(0);
    expect(vr.valid).toBe(true);
  });
});

describe('Scenario 2 — Partial Coverage Opportunity', () => {
  it('creates partial_coverage opportunity', async () => {
    const result = await service.handleHotelCoverageUpdated({
      tenantId: TENANT_A,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      coveragePercent: 60,
      coverageStatus: 'partially_covered',
    });
    expect(result.success).toBe(true);
    const events = bus.getEventsByType('OpportunityCreated');
    expect(events).toHaveLength(1);
    expect(events[0]!.payload).toMatchObject({ opportunityType: 'partial_coverage' });
  });

  it('score and priority are calculated', async () => {
    await service.handleHotelCoverageUpdated({
      tenantId: TENANT_A,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      coveragePercent: 40,
      coverageStatus: 'minimally_covered',
    });
    const ev = bus.getEventsByType('OpportunityCreated')[0]!;
    const payload = ev.payload as Record<string, unknown>;
    expect(payload.score).toBeGreaterThan(0);
    expect(payload.priority).toBeDefined();
  });
});

describe('Scenario 3 — Full Coverage Closure', () => {
  it('closes existing opportunity when coverage reaches 100%', async () => {
    // Create opportunity first
    await service.handleHotelCoverageUpdated({
      tenantId: TENANT_A,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      coveragePercent: 0,
      coverageStatus: 'no_accommodation',
    });
    bus.clear();

    // Coverage reaches 100%
    await service.handleHotelCoverageUpdated({
      tenantId: TENANT_A,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      coveragePercent: 100,
      coverageStatus: 'fully_covered',
    });

    const events = bus.getEventsByType('OpportunityClosed');
    expect(events).toHaveLength(1);
    expect(events[0]!.payload).toMatchObject({ closureReason: 'coverage_complete' });
  });

  it('OpportunityClosed validates against schema', async () => {
    await service.handleHotelCoverageUpdated({
      tenantId: TENANT_A,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      coveragePercent: 0,
      coverageStatus: 'no_accommodation',
    });
    bus.clear();
    await service.handleHotelCoverageUpdated({
      tenantId: TENANT_A,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      coveragePercent: 100,
      coverageStatus: 'fully_covered',
    });
    const ev = bus.getEventsByType('OpportunityClosed')[0]!;
    const vr = validator.validateEvent('opportunity-closed', ev);
    expect(vr.errors).toHaveLength(0);
    expect(vr.valid).toBe(true);
  });
});

describe('Scenario 4 — Orphan Suppression', () => {
  it('suppresses existing opportunities', async () => {
    await service.handleHotelCoverageUpdated({
      tenantId: TENANT_A,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      coveragePercent: 0,
      coverageStatus: 'no_accommodation',
    });
    const oppId = bus.getEventsByType('OpportunityCreated')[0]!.payload.opportunityId as string;
    bus.clear();

    await service.handleHotelOrphanDetected({
      tenantId: TENANT_A,
      travellerId: TRAVELLER,
      reassociationDeadline: new Date(Date.now() + 30 * 86400000),
    });

    const opp = await opportunityRepo.findById(TENANT_A, oppId);
    expect(opp!.lifecycleState).toBe('suppressed');
    expect(opp!.primarySuppressionReason).toBe('orphan_reassociation_window');
  });

  it('suppressed traveller does not get new opportunity', async () => {
    // Create and suppress
    await service.handleHotelCoverageUpdated({
      tenantId: TENANT_A,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      coveragePercent: 0,
      coverageStatus: 'no_accommodation',
    });
    await service.handleHotelOrphanDetected({
      tenantId: TENANT_A,
      travellerId: TRAVELLER,
      reassociationDeadline: new Date(Date.now() + 30 * 86400000),
    });
    bus.clear();

    // Attempt to create new opportunity for same traveller - different trip
    const result = await service.handleHotelCoverageUpdated({
      tenantId: TENANT_A,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: 'aaaa9999-aaaa-4000-8000-999999999999',
      coveragePercent: 0,
      coverageStatus: 'no_accommodation',
    });
    expect(result.success).toBe(true);
    // The suppression check looks for orphan_reassociation_window on the traveller
    expect(bus.getEventsByType('OpportunityCreated')).toHaveLength(0);
  });
});

describe('Scenario 5 — Traveller Decline', () => {
  it('rejects opportunity and emits OpportunityRejected', async () => {
    const createResult = await service.handleHotelCoverageUpdated({
      tenantId: TENANT_A,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      coveragePercent: 0,
      coverageStatus: 'no_accommodation',
    });
    bus.clear();

    await service.handleTravellerResponded({
      tenantId: TENANT_A,
      opportunityId: createResult.data!.opportunityId!,
      accepted: false,
    });

    const events = bus.getEventsByType('OpportunityRejected');
    expect(events).toHaveLength(1);
    expect(events[0]!.payload).toMatchObject({ rejectionReason: 'traveller_declined' });
  });

  it('OpportunityRejected validates against schema', async () => {
    const createResult = await service.handleHotelCoverageUpdated({
      tenantId: TENANT_A,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      coveragePercent: 0,
      coverageStatus: 'no_accommodation',
    });
    bus.clear();
    await service.handleTravellerResponded({
      tenantId: TENANT_A,
      opportunityId: createResult.data!.opportunityId!,
      accepted: false,
    });
    const ev = bus.getEventsByType('OpportunityRejected')[0]!;
    const vr = validator.validateEvent('opportunity-rejected', ev);
    expect(vr.errors).toHaveLength(0);
    expect(vr.valid).toBe(true);
  });
});

describe('Scenario 6 — Manual Closure', () => {
  it('closes with manual_closure reason', async () => {
    const createResult = await service.handleHotelCoverageUpdated({
      tenantId: TENANT_A,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      coveragePercent: 0,
      coverageStatus: 'no_accommodation',
    });
    bus.clear();

    await service.handleManualClosure(TENANT_A, createResult.data!.opportunityId!, 'admin-001');

    const events = bus.getEventsByType('OpportunityClosed');
    expect(events).toHaveLength(1);
    expect(events[0]!.payload).toMatchObject({ closureReason: 'manual_closure' });
  });
});

describe('Scenario 7 — Duplicate Prevention', () => {
  it('prevents duplicate opportunity for same trip+type', async () => {
    const r1 = await service.handleHotelCoverageUpdated({
      tenantId: TENANT_A,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      coveragePercent: 0,
      coverageStatus: 'no_accommodation',
    });
    const r2 = await service.handleHotelCoverageUpdated({
      tenantId: TENANT_A,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      coveragePercent: 0,
      coverageStatus: 'no_accommodation',
    });

    expect(r1.data?.opportunityId).toBe(r2.data?.opportunityId);
    expect(bus.getEventsByType('OpportunityCreated')).toHaveLength(1);
  });
});

describe('Scenario 8 — Trip Cancellation', () => {
  it('cancels all active trip opportunities', async () => {
    await service.handleHotelCoverageUpdated({
      tenantId: TENANT_A,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      coveragePercent: 0,
      coverageStatus: 'no_accommodation',
    });
    bus.clear();

    await service.handleTripCancelled(TENANT_A, TRIP);

    const events = bus.getEventsByType('OpportunityClosed');
    expect(events).toHaveLength(1);
    expect(events[0]!.payload).toMatchObject({ closureReason: 'trip_cancelled' });

    const opps = await opportunityRepo.findByTripId(TENANT_A, TRIP);
    expect(opps[0]!.lifecycleState).toBe('cancelled');
  });
});

describe('Scenario 9 — Tenant Isolation', () => {
  it('Tenant B cannot see Tenant A opportunities', async () => {
    await service.handleHotelCoverageUpdated({
      tenantId: TENANT_A,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      coveragePercent: 0,
      coverageStatus: 'no_accommodation',
    });

    const tenantBOpps = await opportunityRepo.findByTripId(TENANT_B, TRIP);
    expect(tenantBOpps).toHaveLength(0);
  });

  it('events preserve correct tenantId', async () => {
    await service.handleHotelCoverageUpdated({
      tenantId: TENANT_A,
      corporateId: CORP,
      travellerId: TRAVELLER,
      tripId: TRIP,
      coveragePercent: 0,
      coverageStatus: 'no_accommodation',
    });

    for (const ev of bus.getPublishedEvents()) {
      expect(ev.tenantId).toBe(TENANT_A);
      const payload = ev.payload as Record<string, unknown>;
      expect(payload.tenantId).toBe(TENANT_A);
    }
  });
});

describe('Scenario 10 — Correlation Propagation', () => {
  it('correlationId preserved across entire flow', async () => {
    await service.handleHotelCoverageUpdated(
      {
        tenantId: TENANT_A,
        corporateId: CORP,
        travellerId: TRAVELLER,
        tripId: TRIP,
        coveragePercent: 0,
        coverageStatus: 'no_accommodation',
      },
      { correlationId: CORR_ID },
    );

    for (const ev of bus.getPublishedEvents()) {
      expect(ev.correlationId).toBe(CORR_ID);
    }
  });

  it('correlationId preserved through closure flow', async () => {
    await service.handleHotelCoverageUpdated(
      {
        tenantId: TENANT_A,
        corporateId: CORP,
        travellerId: TRAVELLER,
        tripId: TRIP,
        coveragePercent: 0,
        coverageStatus: 'no_accommodation',
      },
      { correlationId: CORR_ID },
    );
    bus.clear();

    await service.handleHotelCoverageUpdated(
      {
        tenantId: TENANT_A,
        corporateId: CORP,
        travellerId: TRAVELLER,
        tripId: TRIP,
        coveragePercent: 100,
        coverageStatus: 'fully_covered',
      },
      { correlationId: CORR_ID },
    );

    for (const ev of bus.getPublishedEvents()) {
      expect(ev.correlationId).toBe(CORR_ID);
    }
  });
});

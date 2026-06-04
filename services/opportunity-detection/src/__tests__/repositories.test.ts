/**
 * Unit tests for in-memory repository implementations.
 * Validates tenant isolation, filtering, and append-only semantics.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Opportunity } from '../domain/opportunity.js';
import { OpportunityAssessment } from '../domain/opportunity-assessment.js';
import { OpportunitySuppression } from '../domain/opportunity-suppression.js';
import { OpportunityCommunication } from '../domain/opportunity-communication.js';
import { OpportunityClosure } from '../domain/opportunity-closure.js';
import { OpportunityAuditEntry } from '../domain/opportunity-audit-entry.js';
import {
  InMemoryOpportunityRepository,
  InMemoryOpportunityAssessmentRepository,
  InMemoryOpportunitySuppressionRepository,
  InMemoryOpportunityCommunicationRepository,
  InMemoryOpportunityClosureRepository,
  InMemoryOpportunityAuditRepository,
} from '../repositories/in-memory.js';

describe('InMemoryOpportunityRepository', () => {
  let repo: InMemoryOpportunityRepository;

  beforeEach(() => {
    repo = new InMemoryOpportunityRepository();
  });

  function createOpp(overrides: Record<string, unknown> = {}) {
    return Opportunity.create({
      tenantId: 'tenant-a',
      corporateId: 'corp-a',
      travellerId: 'trav-a',
      tripId: 'trip-a',
      opportunityType: 'missing_hotel',
      score: 85,
      ...overrides,
    });
  }

  describe('tenant isolation', () => {
    it('tenant A cannot read tenant B opportunities', async () => {
      const oppA = createOpp({ tenantId: 'tenant-a' });
      const oppB = createOpp({ tenantId: 'tenant-b' });

      await repo.save(oppA);
      await repo.save(oppB);

      const resultA = await repo.findById('tenant-a', oppA.opportunityId);
      const resultB = await repo.findById('tenant-a', oppB.opportunityId);

      expect(resultA).toBeDefined();
      expect(resultB).toBeUndefined();
    });

    it('findByTravellerId is tenant-scoped', async () => {
      const oppA = createOpp({ tenantId: 'tenant-a', travellerId: 'shared-trav' });
      const oppB = createOpp({ tenantId: 'tenant-b', travellerId: 'shared-trav' });

      await repo.save(oppA);
      await repo.save(oppB);

      const results = await repo.findByTravellerId('tenant-a', 'shared-trav');
      expect(results).toHaveLength(1);
      expect(results[0]!.tenantId).toBe('tenant-a');
    });
  });

  describe('findById', () => {
    it('returns correct opportunity', async () => {
      const opp = createOpp();
      await repo.save(opp);

      const found = await repo.findById('tenant-a', opp.opportunityId);
      expect(found).toBe(opp);
    });

    it('returns undefined for non-existent id', async () => {
      const found = await repo.findById('tenant-a', 'non-existent');
      expect(found).toBeUndefined();
    });
  });

  describe('findByTravellerId', () => {
    it('returns all opportunities for traveller', async () => {
      const opp1 = createOpp({ travellerId: 'trav-x', tripId: 'trip-1' });
      const opp2 = createOpp({ travellerId: 'trav-x', tripId: 'trip-2' });
      const opp3 = createOpp({ travellerId: 'trav-y', tripId: 'trip-3' });

      await repo.save(opp1);
      await repo.save(opp2);
      await repo.save(opp3);

      const results = await repo.findByTravellerId('tenant-a', 'trav-x');
      expect(results).toHaveLength(2);
    });
  });

  describe('findByTripId', () => {
    it('returns all opportunities for trip', async () => {
      const opp1 = createOpp({ tripId: 'trip-x' });
      const opp2 = createOpp({ tripId: 'trip-x', opportunityType: 'out_of_policy' });
      const opp3 = createOpp({ tripId: 'trip-y' });

      await repo.save(opp1);
      await repo.save(opp2);
      await repo.save(opp3);

      const results = await repo.findByTripId('tenant-a', 'trip-x');
      expect(results).toHaveLength(2);
    });
  });

  describe('findActiveByTraveller', () => {
    it('only returns active states', async () => {
      const active = createOpp({ travellerId: 'trav-z' });
      const closed = createOpp({ travellerId: 'trav-z', tripId: 'trip-closed' });
      closed.close('hotel_added');

      await repo.save(active);
      await repo.save(closed);

      const results = await repo.findActiveByTraveller('tenant-a', 'trav-z');
      expect(results).toHaveLength(1);
      expect(results[0]!.lifecycleState).toBe('detected');
    });

    it('includes qualified and suppressed states', async () => {
      const detected = createOpp({ travellerId: 'trav-m', tripId: 'trip-1' });
      const qualified = createOpp({ travellerId: 'trav-m', tripId: 'trip-2' });
      qualified.qualify();
      const suppressed = createOpp({ travellerId: 'trav-m', tripId: 'trip-3' });
      suppressed.suppress('manual_suppression');

      await repo.save(detected);
      await repo.save(qualified);
      await repo.save(suppressed);

      const results = await repo.findActiveByTraveller('tenant-a', 'trav-m');
      expect(results).toHaveLength(3);
    });
  });

  describe('findByState', () => {
    it('filters correctly by state', async () => {
      const detected = createOpp({ tripId: 'trip-1' });
      const qualified = createOpp({ tripId: 'trip-2' });
      qualified.qualify();

      await repo.save(detected);
      await repo.save(qualified);

      const detectedResults = await repo.findByState('tenant-a', 'detected');
      expect(detectedResults).toHaveLength(1);
      expect(detectedResults[0]!.lifecycleState).toBe('detected');

      const qualifiedResults = await repo.findByState('tenant-a', 'qualified');
      expect(qualifiedResults).toHaveLength(1);
      expect(qualifiedResults[0]!.lifecycleState).toBe('qualified');
    });
  });

  describe('findByType', () => {
    it('filters correctly by type', async () => {
      const missing = createOpp({ opportunityType: 'missing_hotel', tripId: 'trip-1' });
      const outOfPolicy = createOpp({ opportunityType: 'out_of_policy', tripId: 'trip-2' });

      await repo.save(missing);
      await repo.save(outOfPolicy);

      const results = await repo.findByType('tenant-a', 'missing_hotel');
      expect(results).toHaveLength(1);
      expect(results[0]!.opportunityType).toBe('missing_hotel');
    });
  });

  describe('remove', () => {
    it('removes opportunity for correct tenant only', async () => {
      const oppA = createOpp({ tenantId: 'tenant-a' });
      const oppB = createOpp({ tenantId: 'tenant-b' });

      await repo.save(oppA);
      await repo.save(oppB);

      await repo.remove('tenant-a', oppA.opportunityId);

      const resultA = await repo.findById('tenant-a', oppA.opportunityId);
      const resultB = await repo.findById('tenant-b', oppB.opportunityId);

      expect(resultA).toBeUndefined();
      expect(resultB).toBeDefined();
    });

    it('does not affect other tenants when id matches but tenant differs', async () => {
      const opp = createOpp({ tenantId: 'tenant-a' });
      await repo.save(opp);

      // Try to remove with wrong tenant
      await repo.remove('tenant-b', opp.opportunityId);

      const result = await repo.findById('tenant-a', opp.opportunityId);
      expect(result).toBeDefined();
    });
  });
});

describe('InMemoryOpportunityAssessmentRepository', () => {
  let repo: InMemoryOpportunityAssessmentRepository;

  beforeEach(() => {
    repo = new InMemoryOpportunityAssessmentRepository();
  });

  function createAssessment(overrides: Record<string, unknown> = {}) {
    return OpportunityAssessment.create({
      opportunityId: 'opp-1',
      tenantId: 'tenant-a',
      correlationId: 'corr-1',
      hotelRequirementConfidence: 80,
      complianceSeverity: 70,
      revenueOpportunity: 60,
      dutyOfCareImpact: 50,
      supplierContractImpact: 40,
      timeToDeparture: 90,
      ...overrides,
    });
  }

  it('multiple saves accumulate (append-only)', async () => {
    const a1 = createAssessment();
    const a2 = createAssessment({ hotelRequirementConfidence: 90 });

    await repo.save(a1);
    await repo.save(a2);

    const results = await repo.findByOpportunityId('tenant-a', 'opp-1');
    expect(results).toHaveLength(2);
  });

  it('is tenant-scoped', async () => {
    const a1 = createAssessment({ tenantId: 'tenant-a', opportunityId: 'opp-shared' });
    const a2 = createAssessment({ tenantId: 'tenant-b', opportunityId: 'opp-shared' });

    await repo.save(a1);
    await repo.save(a2);

    const results = await repo.findByOpportunityId('tenant-a', 'opp-shared');
    expect(results).toHaveLength(1);
    expect(results[0]!.tenantId).toBe('tenant-a');
  });
});

describe('InMemoryOpportunitySuppressionRepository', () => {
  let repo: InMemoryOpportunitySuppressionRepository;

  beforeEach(() => {
    repo = new InMemoryOpportunitySuppressionRepository();
  });

  function createSuppression(overrides: Record<string, unknown> = {}) {
    return OpportunitySuppression.create({
      opportunityId: 'opp-1',
      tenantId: 'tenant-a',
      suppressionReason: 'orphan_reassociation_window',
      suppressedUntil: new Date('2026-08-01'),
      ...overrides,
    });
  }

  describe('findActiveByOpportunityId', () => {
    it('only returns isActive=true suppressions', async () => {
      const active = createSuppression();
      const resolved = createSuppression({ suppressionReason: 'manual_suppression' });
      resolved.resolve('test_trigger');

      await repo.save(active);
      await repo.save(resolved);

      const results = await repo.findActiveByOpportunityId('tenant-a', 'opp-1');
      expect(results).toHaveLength(1);
      expect(results[0]!.isActive).toBe(true);
    });

    it('is tenant-scoped', async () => {
      const suppA = createSuppression({ tenantId: 'tenant-a' });
      const suppB = createSuppression({ tenantId: 'tenant-b' });

      await repo.save(suppA);
      await repo.save(suppB);

      const results = await repo.findActiveByOpportunityId('tenant-a', 'opp-1');
      expect(results).toHaveLength(1);
      expect(results[0]!.tenantId).toBe('tenant-a');
    });
  });

  describe('findExpiredSuppressions', () => {
    it('returns active suppressions where suppressedUntil <= now', async () => {
      const expired = createSuppression({ suppressedUntil: new Date('2024-01-01') });
      const notExpired = createSuppression({
        suppressedUntil: new Date('2099-01-01'),
        suppressionReason: 'manual_suppression',
      });
      const noExpiry = createSuppression({
        suppressedUntil: null,
        suppressionReason: 'corporate_policy_override',
      });

      await repo.save(expired);
      await repo.save(notExpired);
      await repo.save(noExpiry);

      const now = new Date('2025-06-01');
      const results = await repo.findExpiredSuppressions('tenant-a', now);
      expect(results).toHaveLength(1);
      expect(results[0]!.suppressedUntil!.getTime()).toBeLessThanOrEqual(now.getTime());
    });

    it('does not return resolved suppressions even if expired', async () => {
      const resolved = createSuppression({ suppressedUntil: new Date('2024-01-01') });
      resolved.resolve('test');

      await repo.save(resolved);

      const results = await repo.findExpiredSuppressions('tenant-a', new Date('2025-06-01'));
      expect(results).toHaveLength(0);
    });
  });
});

describe('InMemoryOpportunityCommunicationRepository', () => {
  let repo: InMemoryOpportunityCommunicationRepository;

  beforeEach(() => {
    repo = new InMemoryOpportunityCommunicationRepository();
  });

  function createComm(overrides: Record<string, unknown> = {}) {
    return OpportunityCommunication.create({
      opportunityId: 'opp-1',
      tenantId: 'tenant-a',
      travellerId: 'trav-a',
      communicationType: 'initial_contact',
      channel: 'email',
      correlationId: 'corr-1',
      ...overrides,
    });
  }

  it('findByOpportunityId returns all communications', async () => {
    const c1 = createComm();
    const c2 = createComm({ communicationType: 'reminder' });

    await repo.save(c1);
    await repo.save(c2);

    const results = await repo.findByOpportunityId('tenant-a', 'opp-1');
    expect(results).toHaveLength(2);
  });

  it('is tenant-scoped', async () => {
    const commA = createComm({ tenantId: 'tenant-a' });
    const commB = createComm({ tenantId: 'tenant-b' });

    await repo.save(commA);
    await repo.save(commB);

    const results = await repo.findByOpportunityId('tenant-a', 'opp-1');
    expect(results).toHaveLength(1);
  });
});

describe('InMemoryOpportunityClosureRepository', () => {
  let repo: InMemoryOpportunityClosureRepository;

  beforeEach(() => {
    repo = new InMemoryOpportunityClosureRepository();
  });

  function createClosure(overrides: Record<string, unknown> = {}) {
    return OpportunityClosure.create({
      opportunityId: 'opp-1',
      tenantId: 'tenant-a',
      terminalState: 'closed',
      closureReason: 'hotel_added',
      correlationId: 'corr-1',
      ...overrides,
    });
  }

  it('findByOpportunityId returns all closures', async () => {
    const c1 = createClosure();
    const c2 = createClosure({ closureReason: 'fulfilled' });

    await repo.save(c1);
    await repo.save(c2);

    const results = await repo.findByOpportunityId('tenant-a', 'opp-1');
    expect(results).toHaveLength(2);
  });

  it('is tenant-scoped', async () => {
    const closureA = createClosure({ tenantId: 'tenant-a' });
    const closureB = createClosure({ tenantId: 'tenant-b' });

    await repo.save(closureA);
    await repo.save(closureB);

    const results = await repo.findByOpportunityId('tenant-a', 'opp-1');
    expect(results).toHaveLength(1);
  });
});

describe('InMemoryOpportunityAuditRepository', () => {
  let repo: InMemoryOpportunityAuditRepository;

  beforeEach(() => {
    repo = new InMemoryOpportunityAuditRepository();
  });

  function createAuditEntry(overrides: Record<string, unknown> = {}) {
    return OpportunityAuditEntry.create({
      opportunityId: 'opp-1',
      tenantId: 'tenant-a',
      entityType: 'Opportunity',
      entityId: 'opp-1',
      action: 'state_transition',
      actorType: 'system',
      correlationId: 'corr-1',
      ...overrides,
    });
  }

  it('append adds entries and findByOpportunityId returns in order', async () => {
    const e1 = createAuditEntry({ action: 'created' });
    const e2 = createAuditEntry({ action: 'qualified' });
    const e3 = createAuditEntry({ action: 'activated' });

    await repo.append(e1);
    await repo.append(e2);
    await repo.append(e3);

    const results = await repo.findByOpportunityId('tenant-a', 'opp-1');
    expect(results).toHaveLength(3);
    expect(results[0]).toBe(e1);
    expect(results[1]).toBe(e2);
    expect(results[2]).toBe(e3);
  });

  it('tenant B cannot read tenant A audit entries', async () => {
    const entryA = createAuditEntry({ tenantId: 'tenant-a' });
    const entryB = createAuditEntry({ tenantId: 'tenant-b' });

    await repo.append(entryA);
    await repo.append(entryB);

    const resultsA = await repo.findByOpportunityId('tenant-a', 'opp-1');
    const resultsB = await repo.findByOpportunityId('tenant-b', 'opp-1');

    expect(resultsA).toHaveLength(1);
    expect(resultsA[0]!.tenantId).toBe('tenant-a');
    expect(resultsB).toHaveLength(1);
    expect(resultsB[0]!.tenantId).toBe('tenant-b');
  });

  it('entries for different opportunities are isolated', async () => {
    const e1 = createAuditEntry({ opportunityId: 'opp-1' });
    const e2 = createAuditEntry({ opportunityId: 'opp-2', entityId: 'opp-2' });

    await repo.append(e1);
    await repo.append(e2);

    const results = await repo.findByOpportunityId('tenant-a', 'opp-1');
    expect(results).toHaveLength(1);
  });
});

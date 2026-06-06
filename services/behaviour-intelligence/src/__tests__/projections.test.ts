/**
 * Unit tests for Behaviour Intelligence projections.
 * Tests projector event handling and read model updates.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createEnvelope } from '@hci/event-contracts';
import type { HCIEventEnvelope } from '@hci/event-contracts';
import { projectBehaviourEvent } from '../projections/behaviour-projector.js';
import type { ProjectorDeps } from '../projections/behaviour-projector.js';
import {
  InMemoryBehaviourOverviewRepo,
  InMemoryArchetypeDistributionRepo,
  InMemoryFatigueMonitoringRepo,
  InMemoryRevenueRiskMonitoringRepo,
  InMemoryActionPerformanceRepo,
  InMemoryPredictionAccuracyRepo,
} from '../projections/in-memory-projections.js';

const T = 'tenant-001';
const C = 'corp-001';
const TRAV = 'trav-001';

function buildDeps(): ProjectorDeps {
  return {
    overviewRepo: new InMemoryBehaviourOverviewRepo(),
    archetypeDistRepo: new InMemoryArchetypeDistributionRepo(),
    fatigueRepo: new InMemoryFatigueMonitoringRepo(),
    revenueRiskRepo: new InMemoryRevenueRiskMonitoringRepo(),
    actionPerfRepo: new InMemoryActionPerformanceRepo(),
    predictionAccRepo: new InMemoryPredictionAccuracyRepo(),
  };
}

function makeEvent(eventType: string, payload: Record<string, unknown>): HCIEventEnvelope {
  return createEnvelope({
    eventType: eventType as never,
    tenantId: T,
    corporateId: C,
    sourceService: 'hci\\.behaviour-intelligence',
    payload,
  });
}

describe('Behaviour Projector', () => {
  let deps: ProjectorDeps;

  beforeEach(() => {
    deps = buildDeps();
  });

  it('BehaviourProfileUpdated creates overview entry', async () => {
    const event = makeEvent('BehaviourProfileUpdated', {
      travellerId: TRAV,
      segment: 'reliable_late',
      confidenceScore: 80,
    });
    const result = await projectBehaviourEvent(event, deps);
    expect(result.processed).toBe(true);

    const overview = await deps.overviewRepo.findByTravellerId(T, TRAV);
    expect(overview?.segment).toBe('reliable_late');
    expect(overview?.confidenceScore).toBe(80);
  });

  it('ArchetypeAssigned updates overview and distribution', async () => {
    // Seed overview
    await deps.overviewRepo.upsert(T, {
      tenantId: T,
      corporateId: C,
      travellerId: TRAV,
      segment: 'reliable_late',
      archetype: null,
      confidenceScore: 80,
      fatigueLevel: 'low',
      driftStatus: 'stable',
      riskTier: null,
      lastUpdatedAt: new Date().toISOString(),
    });

    const event = makeEvent('ArchetypeAssigned', {
      travellerId: TRAV,
      archetype: 'autopilot',
      confidence: 90,
    });
    await projectBehaviourEvent(event, deps);

    const overview = await deps.overviewRepo.findByTravellerId(T, TRAV);
    expect(overview?.archetype).toBe('autopilot');

    const dist = await deps.archetypeDistRepo.findByCorporateId(T, C);
    expect(dist).toHaveLength(1);
    expect(dist[0]?.count).toBe(1);
  });

  it('FatigueThresholdCrossed updates overview and fatigue monitoring', async () => {
    await deps.overviewRepo.upsert(T, {
      tenantId: T,
      corporateId: C,
      travellerId: TRAV,
      segment: 'reliable_late',
      archetype: null,
      confidenceScore: 80,
      fatigueLevel: 'low',
      driftStatus: 'stable',
      riskTier: null,
      lastUpdatedAt: new Date().toISOString(),
    });

    const event = makeEvent('FatigueThresholdCrossed', {
      travellerId: TRAV,
      fatigueScore: 65,
      fatigueLevel: 'high',
      comms30d: 12,
    });
    await projectBehaviourEvent(event, deps);

    const overview = await deps.overviewRepo.findByTravellerId(T, TRAV);
    expect(overview?.fatigueLevel).toBe('high');

    const fatigue = await deps.fatigueRepo.findByTravellerId(T, TRAV);
    expect(fatigue?.fatigueScore).toBe(65);
  });

  it('BehaviourDriftDetected updates overview driftStatus', async () => {
    await deps.overviewRepo.upsert(T, {
      tenantId: T,
      corporateId: C,
      travellerId: TRAV,
      segment: 'reliable_late',
      archetype: null,
      confidenceScore: 80,
      fatigueLevel: 'low',
      driftStatus: 'stable',
      riskTier: null,
      lastUpdatedAt: new Date().toISOString(),
    });

    const event = makeEvent('BehaviourDriftDetected', {
      travellerId: TRAV,
      driftStatus: 'moderate',
      driftScore: 45,
    });
    await projectBehaviourEvent(event, deps);

    const overview = await deps.overviewRepo.findByTravellerId(T, TRAV);
    expect(overview?.driftStatus).toBe('moderate');
  });

  it('ActionRecommended updates revenue risk monitoring', async () => {
    const event = makeEvent('ActionRecommended', {
      travellerId: TRAV,
      estimatedRevenueAtRisk: 120,
      action: 'send_email',
    });
    await projectBehaviourEvent(event, deps);

    const risk = await deps.revenueRiskRepo.findByTravellerId(T, TRAV);
    expect(risk?.revenueAtRisk).toBe(120);
  });

  it('CommunicationSuppressed increments suppression count', async () => {
    await deps.fatigueRepo.upsert(T, {
      tenantId: T,
      corporateId: C,
      travellerId: TRAV,
      fatigueScore: 65,
      fatigueLevel: 'high',
      comms30d: 10,
      suppressionCount: 0,
      lastUpdatedAt: new Date().toISOString(),
    });

    const event = makeEvent('CommunicationSuppressed', { travellerId: TRAV });
    await projectBehaviourEvent(event, deps);

    const fatigue = await deps.fatigueRepo.findByTravellerId(T, TRAV);
    expect(fatigue?.suppressionCount).toBe(1);
  });

  it('PredictionOutcomeRecorded updates action performance and accuracy', async () => {
    const event = makeEvent('PredictionOutcomeRecorded', {
      travellerId: TRAV,
      recommendedAction: 'send_email',
      wasCorrect: true,
      daysDifference: 2,
    });
    await projectBehaviourEvent(event, deps);

    const perf = await deps.actionPerfRepo.findByCorporateId(T, C);
    expect(perf).toHaveLength(1);
    expect(perf[0]?.totalRecommended).toBe(1);
    expect(perf[0]?.totalCorrect).toBe(1);
    expect(perf[0]?.accuracyRate).toBe(100);

    const acc = await deps.predictionAccRepo.findByCorporateId(T, C);
    expect(acc?.totalPredictions).toBe(1);
    expect(acc?.accuracyRate).toBe(100);
  });

  it('PredictionOutcomeRecorded accumulates across multiple events', async () => {
    const correct = makeEvent('PredictionOutcomeRecorded', {
      travellerId: TRAV,
      recommendedAction: 'send_email',
      wasCorrect: true,
      daysDifference: 1,
    });
    const incorrect = makeEvent('PredictionOutcomeRecorded', {
      travellerId: TRAV,
      recommendedAction: 'send_email',
      wasCorrect: false,
      daysDifference: 5,
    });
    await projectBehaviourEvent(correct, deps);
    await projectBehaviourEvent(incorrect, deps);

    const acc = await deps.predictionAccRepo.findByCorporateId(T, C);
    expect(acc?.totalPredictions).toBe(2);
    expect(acc?.correctPredictions).toBe(1);
    expect(acc?.accuracyRate).toBe(50);
  });

  it('unknown event type is not processed', async () => {
    const event = makeEvent('SomeUnknownEvent' as never, {});
    const result = await projectBehaviourEvent(event, deps);
    expect(result.processed).toBe(false);
  });

  it('findHighFatigue returns only high/critical entries', async () => {
    await deps.fatigueRepo.upsert(T, {
      tenantId: T,
      corporateId: C,
      travellerId: 'trav-low',
      fatigueScore: 20,
      fatigueLevel: 'low',
      comms30d: 3,
      suppressionCount: 0,
      lastUpdatedAt: new Date().toISOString(),
    });
    await deps.fatigueRepo.upsert(T, {
      tenantId: T,
      corporateId: C,
      travellerId: 'trav-high',
      fatigueScore: 70,
      fatigueLevel: 'high',
      comms30d: 12,
      suppressionCount: 2,
      lastUpdatedAt: new Date().toISOString(),
    });
    const high = await deps.fatigueRepo.findHighFatigue(T, C);
    expect(high).toHaveLength(1);
    expect(high[0]?.travellerId).toBe('trav-high');
  });
});

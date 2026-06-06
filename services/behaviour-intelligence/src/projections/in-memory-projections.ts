/**
 * In-memory projection repository implementations.
 */

import type {
  TravellerBehaviourOverview,
  ArchetypeDistribution,
  FatigueMonitoringEntry,
  RevenueRiskMonitoringEntry,
  ActionPerformanceEntry,
  PredictionAccuracyEntry,
} from './read-models.js';
import type {
  BehaviourOverviewRepository,
  ArchetypeDistributionRepository,
  FatigueMonitoringRepository,
  RevenueRiskMonitoringRepository,
  ActionPerformanceRepository,
  PredictionAccuracyRepository,
} from './projection-repositories.js';

function key(tenantId: string, id: string): string {
  return `${tenantId}::${id}`;
}

export class InMemoryBehaviourOverviewRepo implements BehaviourOverviewRepository {
  private readonly store = new Map<string, TravellerBehaviourOverview>();

  async upsert(tenantId: string, entry: TravellerBehaviourOverview): Promise<void> {
    this.store.set(key(tenantId, entry.travellerId), entry);
  }

  async findByTravellerId(
    tenantId: string,
    travellerId: string,
  ): Promise<TravellerBehaviourOverview | undefined> {
    return this.store.get(key(tenantId, travellerId));
  }

  async findByCorporateId(
    tenantId: string,
    corporateId: string,
  ): Promise<TravellerBehaviourOverview[]> {
    const results: TravellerBehaviourOverview[] = [];
    for (const v of this.store.values()) {
      if (v.tenantId === tenantId && v.corporateId === corporateId) results.push(v);
    }
    return results;
  }
}

export class InMemoryArchetypeDistributionRepo implements ArchetypeDistributionRepository {
  private readonly store = new Map<string, ArchetypeDistribution>();

  async upsert(tenantId: string, entry: ArchetypeDistribution): Promise<void> {
    this.store.set(key(tenantId, `${entry.corporateId}::${entry.archetype}`), entry);
  }

  async findByCorporateId(tenantId: string, corporateId: string): Promise<ArchetypeDistribution[]> {
    const results: ArchetypeDistribution[] = [];
    for (const v of this.store.values()) {
      if (v.tenantId === tenantId && v.corporateId === corporateId) results.push(v);
    }
    return results;
  }
}

export class InMemoryFatigueMonitoringRepo implements FatigueMonitoringRepository {
  private readonly store = new Map<string, FatigueMonitoringEntry>();

  async upsert(tenantId: string, entry: FatigueMonitoringEntry): Promise<void> {
    this.store.set(key(tenantId, entry.travellerId), entry);
  }

  async findByTravellerId(
    tenantId: string,
    travellerId: string,
  ): Promise<FatigueMonitoringEntry | undefined> {
    return this.store.get(key(tenantId, travellerId));
  }

  async findByCorporateId(
    tenantId: string,
    corporateId: string,
  ): Promise<FatigueMonitoringEntry[]> {
    const results: FatigueMonitoringEntry[] = [];
    for (const v of this.store.values()) {
      if (v.tenantId === tenantId && v.corporateId === corporateId) results.push(v);
    }
    return results;
  }

  async findHighFatigue(tenantId: string, corporateId: string): Promise<FatigueMonitoringEntry[]> {
    return (await this.findByCorporateId(tenantId, corporateId)).filter(
      (e) => e.fatigueLevel === 'high' || e.fatigueLevel === 'critical',
    );
  }
}

export class InMemoryRevenueRiskMonitoringRepo implements RevenueRiskMonitoringRepository {
  private readonly store = new Map<string, RevenueRiskMonitoringEntry>();

  async upsert(tenantId: string, entry: RevenueRiskMonitoringEntry): Promise<void> {
    this.store.set(key(tenantId, entry.travellerId), entry);
  }

  async findByTravellerId(
    tenantId: string,
    travellerId: string,
  ): Promise<RevenueRiskMonitoringEntry | undefined> {
    return this.store.get(key(tenantId, travellerId));
  }

  async findByCorporateId(
    tenantId: string,
    corporateId: string,
  ): Promise<RevenueRiskMonitoringEntry[]> {
    const results: RevenueRiskMonitoringEntry[] = [];
    for (const v of this.store.values()) {
      if (v.tenantId === tenantId && v.corporateId === corporateId) results.push(v);
    }
    return results;
  }
}

export class InMemoryActionPerformanceRepo implements ActionPerformanceRepository {
  private readonly store = new Map<string, ActionPerformanceEntry>();

  async upsert(tenantId: string, entry: ActionPerformanceEntry): Promise<void> {
    this.store.set(key(tenantId, `${entry.corporateId}::${entry.action}`), entry);
  }

  async findByCorporateId(
    tenantId: string,
    corporateId: string,
  ): Promise<ActionPerformanceEntry[]> {
    const results: ActionPerformanceEntry[] = [];
    for (const v of this.store.values()) {
      if (v.tenantId === tenantId && v.corporateId === corporateId) results.push(v);
    }
    return results;
  }
}

export class InMemoryPredictionAccuracyRepo implements PredictionAccuracyRepository {
  private readonly store = new Map<string, PredictionAccuracyEntry>();

  async upsert(tenantId: string, entry: PredictionAccuracyEntry): Promise<void> {
    this.store.set(key(tenantId, entry.corporateId), entry);
  }

  async findByCorporateId(
    tenantId: string,
    corporateId: string,
  ): Promise<PredictionAccuracyEntry | undefined> {
    return this.store.get(key(tenantId, corporateId));
  }
}

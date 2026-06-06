/**
 * PostgreSQL repository implementations for Behaviour Intelligence.
 * All queries enforce tenant isolation via tenant_id parameter.
 */

import type { DatabaseClient } from './db-client.js';
import type { TravellerBehaviourProfile } from '../domain/traveller-behaviour-profile.js';
import type { ArchetypeAssignment } from '../domain/traveller-archetype.js';
import type { BookingAttribution } from '../domain/booking-attribution.js';
import type { BehaviourDrift } from '../domain/behaviour-drift.js';
import type { CommunicationFatigue } from '../domain/communication-fatigue.js';
import type { RevenueAtRisk } from '../domain/revenue-at-risk.js';
import type { RecommendedAction } from '../domain/recommended-action.js';
import type { PredictionOutcome } from '../domain/prediction-outcome.js';
import type {
  TravellerBehaviourProfileRepository,
  TravellerArchetypeRepository,
  BookingAttributionRepository,
  BehaviourDriftRepository,
  CommunicationFatigueRepository,
  RevenueAtRiskRepository,
  RecommendedActionRepository,
  PredictionOutcomeRepository,
} from '../repositories/interfaces.js';
import type {
  BehaviourSegment,
  BehaviourChannel,
  ArchetypeType,
  DriftStatus,
  DriftDirection,
  FatigueLevel,
  RiskTier,
  RecommendedActionType,
  PredictionOutcomeType,
  AttributionType,
} from '../domain/enums.js';

const SCHEMA = 'behaviour_intelligence';

// ─── Profile ────────────────────────────────────────────────────────────────

export class PgProfileRepository implements TravellerBehaviourProfileRepository {
  constructor(private readonly db: DatabaseClient) {}

  async save(tenantId: string, profile: TravellerBehaviourProfile): Promise<void> {
    await this.db.query(
      `INSERT INTO ${SCHEMA}.traveller_behaviour_profiles
       (tenant_id, traveller_id, corporate_id, avg_lead_time_days, booking_consistency,
        booking_variability_days, compliance_rate, avg_response_time_hours, preferred_channel,
        self_booking_rate, trips_analysed, trip_count_used, predicted_lead_time_days,
        confidence_score, segment, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW())
       ON CONFLICT (tenant_id, traveller_id) DO UPDATE SET
        corporate_id=EXCLUDED.corporate_id, avg_lead_time_days=EXCLUDED.avg_lead_time_days,
        booking_consistency=EXCLUDED.booking_consistency, booking_variability_days=EXCLUDED.booking_variability_days,
        compliance_rate=EXCLUDED.compliance_rate, avg_response_time_hours=EXCLUDED.avg_response_time_hours,
        preferred_channel=EXCLUDED.preferred_channel, self_booking_rate=EXCLUDED.self_booking_rate,
        trips_analysed=EXCLUDED.trips_analysed, trip_count_used=EXCLUDED.trip_count_used,
        predicted_lead_time_days=EXCLUDED.predicted_lead_time_days, confidence_score=EXCLUDED.confidence_score,
        segment=EXCLUDED.segment, updated_at=NOW()`,
      [
        tenantId,
        profile.travellerId,
        profile.corporateId,
        profile.avgLeadTimeDays,
        profile.bookingConsistency,
        profile.bookingVariabilityDays,
        profile.complianceRate,
        profile.avgResponseTimeHours,
        profile.preferredChannel,
        profile.selfBookingRate,
        profile.tripsAnalysed,
        profile.tripCountUsed,
        profile.predictedLeadTimeDays,
        profile.confidenceScore,
        profile.segment,
      ],
    );
  }

  async findByTravellerId(
    tenantId: string,
    travellerId: string,
  ): Promise<TravellerBehaviourProfile | undefined> {
    const result = await this.db.query(
      `SELECT * FROM ${SCHEMA}.traveller_behaviour_profiles WHERE tenant_id = $1 AND traveller_id = $2`,
      [tenantId, travellerId],
    );
    return result.rows[0] ? this.toProfile(result.rows[0]) : undefined;
  }

  async findByCorporateId(
    tenantId: string,
    corporateId: string,
  ): Promise<TravellerBehaviourProfile[]> {
    const result = await this.db.query(
      `SELECT * FROM ${SCHEMA}.traveller_behaviour_profiles WHERE tenant_id = $1 AND corporate_id = $2`,
      [tenantId, corporateId],
    );
    return result.rows.map((r) => this.toProfile(r));
  }

  private toProfile(row: Record<string, unknown>): TravellerBehaviourProfile {
    return {
      travellerId: row['traveller_id'] as string,
      tenantId: row['tenant_id'] as string,
      corporateId: row['corporate_id'] as string,
      avgLeadTimeDays: Number(row['avg_lead_time_days']),
      bookingConsistency: Number(row['booking_consistency']),
      bookingVariabilityDays: Number(row['booking_variability_days']),
      complianceRate: Number(row['compliance_rate']),
      avgResponseTimeHours: Number(row['avg_response_time_hours']),
      preferredChannel: row['preferred_channel'] as BehaviourChannel,
      selfBookingRate: Number(row['self_booking_rate']),
      tripsAnalysed: Number(row['trips_analysed']),
      tripCountUsed: Number(row['trip_count_used']),
      predictedLeadTimeDays: Number(row['predicted_lead_time_days']),
      confidenceScore: Number(row['confidence_score']),
      segment: row['segment'] as BehaviourSegment,
    };
  }
}

// ─── Archetype ──────────────────────────────────────────────────────────────

export class PgArchetypeRepository implements TravellerArchetypeRepository {
  constructor(private readonly db: DatabaseClient) {}

  async save(
    tenantId: string,
    travellerId: string,
    assignment: ArchetypeAssignment,
  ): Promise<void> {
    await this.db.query(
      `INSERT INTO ${SCHEMA}.traveller_archetypes (tenant_id, traveller_id, archetype, confidence, previous_archetype, assigned_at)
       VALUES ($1,$2,$3,$4,$5,NOW())
       ON CONFLICT (tenant_id, traveller_id) DO UPDATE SET
        archetype=EXCLUDED.archetype, confidence=EXCLUDED.confidence,
        previous_archetype=EXCLUDED.previous_archetype, assigned_at=NOW()`,
      [
        tenantId,
        travellerId,
        assignment.archetype,
        assignment.confidence,
        assignment.previousArchetype,
      ],
    );
  }

  async findByTravellerId(
    tenantId: string,
    travellerId: string,
  ): Promise<ArchetypeAssignment | undefined> {
    const result = await this.db.query(
      `SELECT * FROM ${SCHEMA}.traveller_archetypes WHERE tenant_id = $1 AND traveller_id = $2`,
      [tenantId, travellerId],
    );
    if (!result.rows[0]) return undefined;
    const row = result.rows[0];
    return {
      archetype: row['archetype'] as ArchetypeType,
      confidence: Number(row['confidence']),
      previousArchetype: (row['previous_archetype'] as ArchetypeType) ?? null,
    };
  }

  async findByCorporateId(
    tenantId: string,
    _corporateId: string,
    travellerIds: string[],
  ): Promise<Map<string, ArchetypeAssignment>> {
    const placeholders = travellerIds.map((_, i) => `$${i + 2}`).join(',');
    const result = await this.db.query(
      `SELECT * FROM ${SCHEMA}.traveller_archetypes WHERE tenant_id = $1 AND traveller_id IN (${placeholders})`,
      [tenantId, ...travellerIds],
    );
    const map = new Map<string, ArchetypeAssignment>();
    for (const row of result.rows) {
      map.set(row['traveller_id'] as string, {
        archetype: row['archetype'] as ArchetypeType,
        confidence: Number(row['confidence']),
        previousArchetype: (row['previous_archetype'] as ArchetypeType) ?? null,
      });
    }
    return map;
  }
}

// ─── Attribution ────────────────────────────────────────────────────────────

export class PgAttributionRepository implements BookingAttributionRepository {
  constructor(private readonly db: DatabaseClient) {}

  async append(tenantId: string, attribution: BookingAttribution): Promise<void> {
    await this.db.query(
      `INSERT INTO ${SCHEMA}.booking_attributions
       (attribution_id, tenant_id, booking_id, traveller_id, corporate_id, opportunity_id,
        attribution_type, communication_id, attribution_window_hours, hours_from_communication,
        confidence, estimated_commission, attributed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
      [
        attribution.attributionId,
        tenantId,
        attribution.bookingId,
        attribution.travellerId,
        attribution.corporateId,
        attribution.opportunityId,
        attribution.attributionType,
        attribution.communicationId,
        attribution.attributionWindowHours,
        attribution.hoursFromCommunication,
        attribution.confidence,
        attribution.estimatedCommission,
        attribution.attributedAt.toISOString(),
      ],
    );
  }

  async findByBookingId(
    tenantId: string,
    bookingId: string,
  ): Promise<BookingAttribution | undefined> {
    const result = await this.db.query(
      `SELECT * FROM ${SCHEMA}.booking_attributions WHERE tenant_id = $1 AND booking_id = $2 LIMIT 1`,
      [tenantId, bookingId],
    );
    return result.rows[0] ? this.toAttribution(result.rows[0]) : undefined;
  }

  async findByTravellerId(tenantId: string, travellerId: string): Promise<BookingAttribution[]> {
    const result = await this.db.query(
      `SELECT * FROM ${SCHEMA}.booking_attributions WHERE tenant_id = $1 AND traveller_id = $2`,
      [tenantId, travellerId],
    );
    return result.rows.map((r) => this.toAttribution(r));
  }

  async findByOpportunityId(
    tenantId: string,
    opportunityId: string,
  ): Promise<BookingAttribution[]> {
    const result = await this.db.query(
      `SELECT * FROM ${SCHEMA}.booking_attributions WHERE tenant_id = $1 AND opportunity_id = $2`,
      [tenantId, opportunityId],
    );
    return result.rows.map((r) => this.toAttribution(r));
  }

  private toAttribution(row: Record<string, unknown>): BookingAttribution {
    return {
      attributionId: row['attribution_id'] as string,
      bookingId: row['booking_id'] as string,
      travellerId: row['traveller_id'] as string,
      tenantId: row['tenant_id'] as string,
      corporateId: row['corporate_id'] as string,
      opportunityId: (row['opportunity_id'] as string) ?? null,
      attributionType: row['attribution_type'] as AttributionType,
      communicationId: (row['communication_id'] as string) ?? null,
      attributionWindowHours:
        row['attribution_window_hours'] != null ? Number(row['attribution_window_hours']) : null,
      hoursFromCommunication:
        row['hours_from_communication'] != null ? Number(row['hours_from_communication']) : null,
      confidence: Number(row['confidence']),
      estimatedCommission: Number(row['estimated_commission']),
      attributedAt: new Date(row['attributed_at'] as string),
    };
  }
}

// ─── Drift ──────────────────────────────────────────────────────────────────

export class PgDriftRepository implements BehaviourDriftRepository {
  constructor(private readonly db: DatabaseClient) {}

  async save(tenantId: string, drift: BehaviourDrift): Promise<void> {
    await this.db.query(
      `INSERT INTO ${SCHEMA}.behaviour_drifts (tenant_id, traveller_id, corporate_id, drift_score, stability_score, drift_status, drift_direction, detected_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
       ON CONFLICT (tenant_id, traveller_id) DO UPDATE SET
        corporate_id=EXCLUDED.corporate_id, drift_score=EXCLUDED.drift_score,
        stability_score=EXCLUDED.stability_score, drift_status=EXCLUDED.drift_status,
        drift_direction=EXCLUDED.drift_direction, detected_at=NOW()`,
      [
        tenantId,
        drift.travellerId,
        drift.corporateId,
        drift.driftScore,
        drift.stabilityScore,
        drift.driftStatus,
        drift.driftDirection,
      ],
    );
  }

  async findByTravellerId(
    tenantId: string,
    travellerId: string,
  ): Promise<BehaviourDrift | undefined> {
    const result = await this.db.query(
      `SELECT * FROM ${SCHEMA}.behaviour_drifts WHERE tenant_id = $1 AND traveller_id = $2`,
      [tenantId, travellerId],
    );
    if (!result.rows[0]) return undefined;
    const row = result.rows[0];
    return {
      travellerId: row['traveller_id'] as string,
      tenantId: row['tenant_id'] as string,
      corporateId: row['corporate_id'] as string,
      driftScore: Number(row['drift_score']),
      stabilityScore: Number(row['stability_score']),
      driftStatus: row['drift_status'] as DriftStatus,
      driftDirection: row['drift_direction'] as DriftDirection,
      detectedAt: new Date(row['detected_at'] as string),
    };
  }

  async findByCorporateId(tenantId: string, corporateId: string): Promise<BehaviourDrift[]> {
    const result = await this.db.query(
      `SELECT * FROM ${SCHEMA}.behaviour_drifts WHERE tenant_id = $1 AND corporate_id = $2`,
      [tenantId, corporateId],
    );
    return result.rows.map((row) => ({
      travellerId: row['traveller_id'] as string,
      tenantId: row['tenant_id'] as string,
      corporateId: row['corporate_id'] as string,
      driftScore: Number(row['drift_score']),
      stabilityScore: Number(row['stability_score']),
      driftStatus: row['drift_status'] as DriftStatus,
      driftDirection: row['drift_direction'] as DriftDirection,
      detectedAt: new Date(row['detected_at'] as string),
    }));
  }
}

// ─── Fatigue ────────────────────────────────────────────────────────────────

export class PgFatigueRepository implements CommunicationFatigueRepository {
  constructor(private readonly db: DatabaseClient) {}

  async save(tenantId: string, fatigue: CommunicationFatigue): Promise<void> {
    await this.db.query(
      `INSERT INTO ${SCHEMA}.communication_fatigues (tenant_id, traveller_id, corporate_id, fatigue_score, fatigue_level, comms_30d, ignored_rate, last_updated)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
       ON CONFLICT (tenant_id, traveller_id) DO UPDATE SET
        corporate_id=EXCLUDED.corporate_id, fatigue_score=EXCLUDED.fatigue_score,
        fatigue_level=EXCLUDED.fatigue_level, comms_30d=EXCLUDED.comms_30d,
        ignored_rate=EXCLUDED.ignored_rate, last_updated=NOW()`,
      [
        tenantId,
        fatigue.travellerId,
        fatigue.corporateId,
        fatigue.fatigueScore,
        fatigue.fatigueLevel,
        fatigue.comms30d,
        fatigue.ignoredRate,
      ],
    );
  }

  async findByTravellerId(
    tenantId: string,
    travellerId: string,
  ): Promise<CommunicationFatigue | undefined> {
    const result = await this.db.query(
      `SELECT * FROM ${SCHEMA}.communication_fatigues WHERE tenant_id = $1 AND traveller_id = $2`,
      [tenantId, travellerId],
    );
    if (!result.rows[0]) return undefined;
    const row = result.rows[0];
    return {
      travellerId: row['traveller_id'] as string,
      tenantId: row['tenant_id'] as string,
      corporateId: row['corporate_id'] as string,
      fatigueScore: Number(row['fatigue_score']),
      fatigueLevel: row['fatigue_level'] as FatigueLevel,
      comms30d: Number(row['comms_30d']),
      ignoredRate: Number(row['ignored_rate']),
      lastUpdated: new Date(row['last_updated'] as string),
    };
  }

  async findByCorporateId(tenantId: string, corporateId: string): Promise<CommunicationFatigue[]> {
    const result = await this.db.query(
      `SELECT * FROM ${SCHEMA}.communication_fatigues WHERE tenant_id = $1 AND corporate_id = $2`,
      [tenantId, corporateId],
    );
    return result.rows.map((row) => ({
      travellerId: row['traveller_id'] as string,
      tenantId: row['tenant_id'] as string,
      corporateId: row['corporate_id'] as string,
      fatigueScore: Number(row['fatigue_score']),
      fatigueLevel: row['fatigue_level'] as FatigueLevel,
      comms30d: Number(row['comms_30d']),
      ignoredRate: Number(row['ignored_rate']),
      lastUpdated: new Date(row['last_updated'] as string),
    }));
  }
}

// ─── Revenue At Risk ────────────────────────────────────────────────────────

export class PgRevenueAtRiskRepository implements RevenueAtRiskRepository {
  constructor(private readonly db: DatabaseClient) {}

  async save(tenantId: string, risk: RevenueAtRisk): Promise<void> {
    await this.db.query(
      `INSERT INTO ${SCHEMA}.revenue_at_risks (tenant_id, traveller_id, corporate_id, estimated_commission, attachment_likelihood, revenue_at_risk, risk_tier, calculated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
       ON CONFLICT (tenant_id, traveller_id) DO UPDATE SET
        corporate_id=EXCLUDED.corporate_id, estimated_commission=EXCLUDED.estimated_commission,
        attachment_likelihood=EXCLUDED.attachment_likelihood, revenue_at_risk=EXCLUDED.revenue_at_risk,
        risk_tier=EXCLUDED.risk_tier, calculated_at=NOW()`,
      [
        tenantId,
        risk.travellerId,
        risk.corporateId,
        risk.estimatedCommission,
        risk.attachmentLikelihood,
        risk.revenueAtRisk,
        risk.riskTier,
      ],
    );
  }

  async findByTravellerId(
    tenantId: string,
    travellerId: string,
  ): Promise<RevenueAtRisk | undefined> {
    const result = await this.db.query(
      `SELECT * FROM ${SCHEMA}.revenue_at_risks WHERE tenant_id = $1 AND traveller_id = $2`,
      [tenantId, travellerId],
    );
    if (!result.rows[0]) return undefined;
    const row = result.rows[0];
    return {
      travellerId: row['traveller_id'] as string,
      tenantId: row['tenant_id'] as string,
      corporateId: row['corporate_id'] as string,
      estimatedCommission: Number(row['estimated_commission']),
      attachmentLikelihood: Number(row['attachment_likelihood']),
      revenueAtRisk: Number(row['revenue_at_risk']),
      riskTier: row['risk_tier'] as RiskTier,
      calculatedAt: new Date(row['calculated_at'] as string),
    };
  }

  async findByCorporateId(tenantId: string, corporateId: string): Promise<RevenueAtRisk[]> {
    const result = await this.db.query(
      `SELECT * FROM ${SCHEMA}.revenue_at_risks WHERE tenant_id = $1 AND corporate_id = $2`,
      [tenantId, corporateId],
    );
    return result.rows.map((row) => ({
      travellerId: row['traveller_id'] as string,
      tenantId: row['tenant_id'] as string,
      corporateId: row['corporate_id'] as string,
      estimatedCommission: Number(row['estimated_commission']),
      attachmentLikelihood: Number(row['attachment_likelihood']),
      revenueAtRisk: Number(row['revenue_at_risk']),
      riskTier: row['risk_tier'] as RiskTier,
      calculatedAt: new Date(row['calculated_at'] as string),
    }));
  }
}

// ─── Recommended Action ─────────────────────────────────────────────────────

export class PgRecommendedActionRepository implements RecommendedActionRepository {
  constructor(private readonly db: DatabaseClient) {}

  async save(tenantId: string, opportunityId: string, action: RecommendedAction): Promise<void> {
    await this.db.query(
      `INSERT INTO ${SCHEMA}.recommended_actions (tenant_id, opportunity_id, traveller_id, action, confidence, explanation_text, fatigue_level, drift_status, days_to_departure, predicted_lead_time_days, recommended_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW())
       ON CONFLICT (tenant_id, opportunity_id) DO UPDATE SET
        action=EXCLUDED.action, confidence=EXCLUDED.confidence, explanation_text=EXCLUDED.explanation_text,
        fatigue_level=EXCLUDED.fatigue_level, drift_status=EXCLUDED.drift_status,
        days_to_departure=EXCLUDED.days_to_departure, predicted_lead_time_days=EXCLUDED.predicted_lead_time_days,
        recommended_at=NOW()`,
      [
        tenantId,
        opportunityId,
        '',
        action.action,
        action.confidence,
        action.explanationText,
        action.fatigueLevel,
        action.driftStatus,
        action.daysToDeparture,
        action.predictedLeadTimeDays,
      ],
    );
  }

  async findActiveByOpportunityId(
    tenantId: string,
    opportunityId: string,
  ): Promise<RecommendedAction | undefined> {
    const result = await this.db.query(
      `SELECT * FROM ${SCHEMA}.recommended_actions WHERE tenant_id = $1 AND opportunity_id = $2`,
      [tenantId, opportunityId],
    );
    if (!result.rows[0]) return undefined;
    const row = result.rows[0];
    return {
      action: row['action'] as RecommendedActionType,
      confidence: Number(row['confidence']),
      explanationText: row['explanation_text'] as string,
      fatigueLevel: row['fatigue_level'] as FatigueLevel,
      driftStatus: row['drift_status'] as DriftStatus,
      daysToDeparture: Number(row['days_to_departure']),
      predictedLeadTimeDays: Number(row['predicted_lead_time_days']),
    };
  }

  async findByTravellerId(tenantId: string, travellerId: string): Promise<RecommendedAction[]> {
    const result = await this.db.query(
      `SELECT * FROM ${SCHEMA}.recommended_actions WHERE tenant_id = $1 AND traveller_id = $2`,
      [tenantId, travellerId],
    );
    return result.rows.map((row) => ({
      action: row['action'] as RecommendedActionType,
      confidence: Number(row['confidence']),
      explanationText: row['explanation_text'] as string,
      fatigueLevel: row['fatigue_level'] as FatigueLevel,
      driftStatus: row['drift_status'] as DriftStatus,
      daysToDeparture: Number(row['days_to_departure']),
      predictedLeadTimeDays: Number(row['predicted_lead_time_days']),
    }));
  }

  async remove(tenantId: string, opportunityId: string): Promise<void> {
    await this.db.query(
      `DELETE FROM ${SCHEMA}.recommended_actions WHERE tenant_id = $1 AND opportunity_id = $2`,
      [tenantId, opportunityId],
    );
  }
}

// ─── Prediction Outcome ─────────────────────────────────────────────────────

export class PgPredictionOutcomeRepository implements PredictionOutcomeRepository {
  constructor(private readonly db: DatabaseClient) {}

  async append(tenantId: string, outcome: PredictionOutcome): Promise<void> {
    await this.db.query(
      `INSERT INTO ${SCHEMA}.prediction_outcomes
       (prediction_id, tenant_id, recommendation_id, traveller_id, corporate_id, opportunity_id,
        recommended_action, actual_outcome, was_correct, days_difference, resolved_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        outcome.predictionId,
        tenantId,
        outcome.recommendationId,
        outcome.travellerId,
        outcome.corporateId,
        outcome.opportunityId,
        outcome.recommendedAction,
        outcome.actualOutcome,
        outcome.wasCorrect,
        outcome.daysDifference,
        outcome.resolvedAt.toISOString(),
      ],
    );
  }

  async findByRecommendationId(
    tenantId: string,
    recommendationId: string,
  ): Promise<PredictionOutcome | undefined> {
    const result = await this.db.query(
      `SELECT * FROM ${SCHEMA}.prediction_outcomes WHERE tenant_id = $1 AND recommendation_id = $2 LIMIT 1`,
      [tenantId, recommendationId],
    );
    return result.rows[0] ? this.toOutcome(result.rows[0]) : undefined;
  }

  async findByTravellerId(tenantId: string, travellerId: string): Promise<PredictionOutcome[]> {
    const result = await this.db.query(
      `SELECT * FROM ${SCHEMA}.prediction_outcomes WHERE tenant_id = $1 AND traveller_id = $2`,
      [tenantId, travellerId],
    );
    return result.rows.map((r) => this.toOutcome(r));
  }

  async findByOpportunityId(tenantId: string, opportunityId: string): Promise<PredictionOutcome[]> {
    const result = await this.db.query(
      `SELECT * FROM ${SCHEMA}.prediction_outcomes WHERE tenant_id = $1 AND opportunity_id = $2`,
      [tenantId, opportunityId],
    );
    return result.rows.map((r) => this.toOutcome(r));
  }

  private toOutcome(row: Record<string, unknown>): PredictionOutcome {
    return {
      predictionId: row['prediction_id'] as string,
      recommendationId: row['recommendation_id'] as string,
      travellerId: row['traveller_id'] as string,
      tenantId: row['tenant_id'] as string,
      corporateId: row['corporate_id'] as string,
      opportunityId: row['opportunity_id'] as string,
      recommendedAction: row['recommended_action'] as RecommendedActionType,
      actualOutcome: row['actual_outcome'] as PredictionOutcomeType,
      wasCorrect: row['was_correct'] as boolean,
      daysDifference: Number(row['days_difference']),
      resolvedAt: new Date(row['resolved_at'] as string),
    };
  }
}

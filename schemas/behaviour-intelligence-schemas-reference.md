# Behaviour Intelligence Schema Reference

This file contains the complete JSON schema definitions for the 9 Behaviour Intelligence events.
Create each schema as the corresponding `.schema.json` file in this directory.

---

## 1. behaviour-profile-updated.schema.json

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://hci.platform/schemas/behaviour-profile-updated.schema.json",
  "title": "BehaviourProfileUpdated Event",
  "description": "Published when a traveller's behaviour profile metrics have been recalculated by the Behaviour Intelligence service",
  "type": "object",
  "allOf": [
    {
      "$ref": "envelope.schema.json"
    }
  ],
  "properties": {
    "eventType": {
      "const": "BehaviourProfileUpdated"
    },
    "payload": {
      "$ref": "#/definitions/BehaviourProfileUpdatedPayload"
    }
  },
  "definitions": {
    "BehaviourProfileUpdatedPayload": {
      "type": "object",
      "description": "Payload for BehaviourProfileUpdated events",
      "required": [
        "travellerId",
        "tenantId",
        "corporateId",
        "avgLeadTimeDays",
        "bookingConsistency",
        "bookingVariabilityDays",
        "complianceRate",
        "avgResponseTimeHours",
        "preferredChannel",
        "selfBookingRate",
        "tripsAnalysed",
        "tripCountUsed",
        "predictedLeadTimeDays",
        "confidenceScore",
        "segment",
        "triggeringEventId",
        "triggeringEventType",
        "calculatedAt"
      ],
      "properties": {
        "travellerId": {
          "type": "string",
          "format": "uuid"
        },
        "tenantId": {
          "type": "string",
          "format": "uuid"
        },
        "corporateId": {
          "type": "string",
          "format": "uuid"
        },
        "avgLeadTimeDays": {
          "type": "number",
          "minimum": 0,
          "maximum": 365
        },
        "bookingConsistency": {
          "type": "number",
          "minimum": 0,
          "maximum": 1
        },
        "bookingVariabilityDays": {
          "type": "number",
          "minimum": 0
        },
        "complianceRate": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        },
        "avgResponseTimeHours": {
          "type": "number",
          "minimum": 0
        },
        "preferredChannel": {
          "type": "string",
          "enum": ["email", "sms", "push_notification", "in_app"]
        },
        "selfBookingRate": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        },
        "tripsAnalysed": {
          "type": "integer",
          "minimum": 1
        },
        "tripCountUsed": {
          "type": "integer",
          "minimum": 1
        },
        "predictedLeadTimeDays": {
          "type": "number",
          "minimum": 0
        },
        "confidenceScore": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        },
        "segment": {
          "type": "string",
          "enum": [
            "self_sufficient",
            "reliable_late",
            "needs_prompting",
            "requires_intervention",
            "non_compliant"
          ]
        },
        "triggeringEventId": {
          "type": "string",
          "format": "uuid"
        },
        "triggeringEventType": {
          "type": "string"
        },
        "calculatedAt": {
          "type": "string",
          "format": "date-time"
        }
      },
      "additionalProperties": false
    }
  }
}
```

---

## 2. archetype-assigned.schema.json

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://hci.platform/schemas/archetype-assigned.schema.json",
  "title": "ArchetypeAssigned Event",
  "description": "Published when a traveller has been assigned or reassigned to a behaviour archetype",
  "type": "object",
  "allOf": [
    {
      "$ref": "envelope.schema.json"
    }
  ],
  "properties": {
    "eventType": {
      "const": "ArchetypeAssigned"
    },
    "payload": {
      "$ref": "#/definitions/ArchetypeAssignedPayload"
    }
  },
  "definitions": {
    "ArchetypeAssignedPayload": {
      "type": "object",
      "description": "Payload for ArchetypeAssigned events",
      "required": [
        "travellerId",
        "tenantId",
        "corporateId",
        "archetype",
        "confidence",
        "triggeringEventId",
        "triggeringEventType",
        "assignedAt"
      ],
      "properties": {
        "travellerId": {
          "type": "string",
          "format": "uuid"
        },
        "tenantId": {
          "type": "string",
          "format": "uuid"
        },
        "corporateId": {
          "type": "string",
          "format": "uuid"
        },
        "archetype": {
          "type": "string",
          "enum": [
            "autopilot",
            "procrastinator",
            "responsive",
            "nudge_needer",
            "reluctant",
            "chaotic",
            "new_traveller"
          ]
        },
        "previousArchetype": {
          "type": ["string", "null"],
          "enum": [
            "autopilot",
            "procrastinator",
            "responsive",
            "nudge_needer",
            "reluctant",
            "chaotic",
            "new_traveller",
            null
          ]
        },
        "confidence": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        },
        "triggeringEventId": {
          "type": "string",
          "format": "uuid"
        },
        "triggeringEventType": {
          "type": "string"
        },
        "assignedAt": {
          "type": "string",
          "format": "date-time"
        }
      },
      "additionalProperties": false
    }
  }
}
```

---

## 3. booking-attributed.schema.json

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://hci.platform/schemas/booking-attributed.schema.json",
  "title": "BookingAttributed Event",
  "description": "Published when a hotel booking has been attributed to a trigger — enables channel ROI and revenue attribution reporting",
  "type": "object",
  "allOf": [
    {
      "$ref": "envelope.schema.json"
    }
  ],
  "properties": {
    "eventType": {
      "const": "BookingAttributed"
    },
    "payload": {
      "$ref": "#/definitions/BookingAttributedPayload"
    }
  },
  "definitions": {
    "BookingAttributedPayload": {
      "type": "object",
      "description": "Payload for BookingAttributed events",
      "required": [
        "attributionId",
        "bookingId",
        "travellerId",
        "tenantId",
        "corporateId",
        "attributionType",
        "confidence",
        "estimatedCommission",
        "triggeringEventId",
        "triggeringEventType",
        "attributedAt"
      ],
      "properties": {
        "attributionId": {
          "type": "string",
          "format": "uuid"
        },
        "bookingId": {
          "type": "string",
          "format": "uuid"
        },
        "travellerId": {
          "type": "string",
          "format": "uuid"
        },
        "tenantId": {
          "type": "string",
          "format": "uuid"
        },
        "corporateId": {
          "type": "string",
          "format": "uuid"
        },
        "opportunityId": {
          "type": ["string", "null"],
          "format": "uuid"
        },
        "attributionType": {
          "type": "string",
          "enum": [
            "independent",
            "email",
            "sms",
            "push_notification",
            "in_app",
            "agent_intervention",
            "corporate_policy",
            "unknown"
          ]
        },
        "communicationId": {
          "type": ["string", "null"],
          "format": "uuid"
        },
        "attributionWindowHours": {
          "type": ["number", "null"],
          "minimum": 0
        },
        "hoursFromCommunication": {
          "type": ["number", "null"],
          "minimum": 0
        },
        "confidence": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        },
        "estimatedCommission": {
          "type": "number",
          "minimum": 0
        },
        "triggeringEventId": {
          "type": "string",
          "format": "uuid"
        },
        "triggeringEventType": {
          "type": "string"
        },
        "attributedAt": {
          "type": "string",
          "format": "date-time"
        }
      },
      "additionalProperties": false
    }
  }
}
```

---

## 4. behaviour-drift-detected.schema.json

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://hci.platform/schemas/behaviour-drift-detected.schema.json",
  "title": "BehaviourDriftDetected Event",
  "description": "Published when a traveller's behaviour has deviated from their established baseline",
  "type": "object",
  "allOf": [
    {
      "$ref": "envelope.schema.json"
    }
  ],
  "properties": {
    "eventType": {
      "const": "BehaviourDriftDetected"
    },
    "payload": {
      "$ref": "#/definitions/BehaviourDriftDetectedPayload"
    }
  },
  "definitions": {
    "BehaviourDriftDetectedPayload": {
      "type": "object",
      "description": "Payload for BehaviourDriftDetected events",
      "required": [
        "travellerId",
        "tenantId",
        "corporateId",
        "driftScore",
        "stabilityScore",
        "driftStatus",
        "previousStatus",
        "driftDirection",
        "triggeringEventId",
        "triggeringEventType",
        "detectedAt"
      ],
      "properties": {
        "travellerId": {
          "type": "string",
          "format": "uuid"
        },
        "tenantId": {
          "type": "string",
          "format": "uuid"
        },
        "corporateId": {
          "type": "string",
          "format": "uuid"
        },
        "driftScore": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        },
        "stabilityScore": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        },
        "driftStatus": {
          "type": "string",
          "enum": ["stable", "moderate", "significant"]
        },
        "previousStatus": {
          "type": "string",
          "enum": ["stable", "moderate", "significant"]
        },
        "driftDirection": {
          "type": "string",
          "enum": ["improving", "declining", "lateral"]
        },
        "triggeringEventId": {
          "type": "string",
          "format": "uuid"
        },
        "triggeringEventType": {
          "type": "string"
        },
        "detectedAt": {
          "type": "string",
          "format": "date-time"
        }
      },
      "additionalProperties": false
    }
  }
}
```

---

## 5. fatigue-threshold-crossed.schema.json

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://hci.platform/schemas/fatigue-threshold-crossed.schema.json",
  "title": "FatigueThresholdCrossed Event",
  "description": "Published when a traveller's communication fatigue has crossed a tier boundary",
  "type": "object",
  "allOf": [
    {
      "$ref": "envelope.schema.json"
    }
  ],
  "properties": {
    "eventType": {
      "const": "FatigueThresholdCrossed"
    },
    "payload": {
      "$ref": "#/definitions/FatigueThresholdCrossedPayload"
    }
  },
  "definitions": {
    "FatigueThresholdCrossedPayload": {
      "type": "object",
      "description": "Payload for FatigueThresholdCrossed events",
      "required": [
        "travellerId",
        "tenantId",
        "corporateId",
        "fatigueScore",
        "fatigueLevel",
        "previousLevel",
        "direction",
        "comms30d",
        "ignoredRate",
        "triggeringEventId",
        "triggeringEventType",
        "crossedAt"
      ],
      "properties": {
        "travellerId": {
          "type": "string",
          "format": "uuid"
        },
        "tenantId": {
          "type": "string",
          "format": "uuid"
        },
        "corporateId": {
          "type": "string",
          "format": "uuid"
        },
        "fatigueScore": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        },
        "fatigueLevel": {
          "type": "string",
          "enum": ["low", "medium", "high", "critical"]
        },
        "previousLevel": {
          "type": "string",
          "enum": ["low", "medium", "high", "critical"]
        },
        "direction": {
          "type": "string",
          "enum": ["increasing", "decreasing"]
        },
        "comms30d": {
          "type": "integer",
          "minimum": 0
        },
        "ignoredRate": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        },
        "triggeringEventId": {
          "type": "string",
          "format": "uuid"
        },
        "triggeringEventType": {
          "type": "string"
        },
        "crossedAt": {
          "type": "string",
          "format": "date-time"
        }
      },
      "additionalProperties": false
    }
  }
}
```

---

## 6. action-recommended.schema.json

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://hci.platform/schemas/action-recommended.schema.json",
  "title": "ActionRecommended Event",
  "description": "Published when the Behaviour Intelligence engine generates a recommended action for an opportunity",
  "type": "object",
  "allOf": [
    {
      "$ref": "envelope.schema.json"
    }
  ],
  "properties": {
    "eventType": {
      "const": "ActionRecommended"
    },
    "payload": {
      "$ref": "#/definitions/ActionRecommendedPayload"
    }
  },
  "definitions": {
    "ActionRecommendedPayload": {
      "type": "object",
      "description": "Payload for ActionRecommended events",
      "required": [
        "recommendationId",
        "opportunityId",
        "travellerId",
        "tenantId",
        "corporateId",
        "action",
        "confidence",
        "explanationText",
        "predictedLeadTimeDays",
        "daysToDeparture",
        "estimatedRevenueAtRisk",
        "fatigueLevel",
        "driftStatus",
        "archetype",
        "expiresAt",
        "triggeringEventId",
        "triggeringEventType",
        "recommendedAt"
      ],
      "properties": {
        "recommendationId": {
          "type": "string",
          "format": "uuid"
        },
        "opportunityId": {
          "type": "string",
          "format": "uuid"
        },
        "travellerId": {
          "type": "string",
          "format": "uuid"
        },
        "tenantId": {
          "type": "string",
          "format": "uuid"
        },
        "corporateId": {
          "type": "string",
          "format": "uuid"
        },
        "action": {
          "type": "string",
          "enum": ["do_nothing", "wait", "send_email", "send_sms", "send_push", "escalate"]
        },
        "confidence": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        },
        "explanationText": {
          "type": "string",
          "minLength": 10,
          "maxLength": 500
        },
        "predictedLeadTimeDays": {
          "type": "number",
          "minimum": 0
        },
        "daysToDeparture": {
          "type": "number",
          "minimum": 0
        },
        "estimatedRevenueAtRisk": {
          "type": "number",
          "minimum": 0
        },
        "fatigueLevel": {
          "type": "string",
          "enum": ["low", "medium", "high", "critical"]
        },
        "driftStatus": {
          "type": "string",
          "enum": ["stable", "moderate", "significant"]
        },
        "archetype": {
          "type": "string",
          "enum": [
            "autopilot",
            "procrastinator",
            "responsive",
            "nudge_needer",
            "reluctant",
            "chaotic",
            "new_traveller"
          ]
        },
        "expiresAt": {
          "type": "string",
          "format": "date-time"
        },
        "triggeringEventId": {
          "type": "string",
          "format": "uuid"
        },
        "triggeringEventType": {
          "type": "string"
        },
        "recommendedAt": {
          "type": "string",
          "format": "date-time"
        }
      },
      "additionalProperties": false
    }
  }
}
```

---

## 7. communication-suppressed.schema.json

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://hci.platform/schemas/communication-suppressed.schema.json",
  "title": "CommunicationSuppressed Event",
  "description": "Published when behaviour intelligence prevents a communication from being sent",
  "type": "object",
  "allOf": [
    {
      "$ref": "envelope.schema.json"
    }
  ],
  "properties": {
    "eventType": {
      "const": "CommunicationSuppressed"
    },
    "payload": {
      "$ref": "#/definitions/CommunicationSuppressedPayload"
    }
  },
  "definitions": {
    "CommunicationSuppressedPayload": {
      "type": "object",
      "description": "Payload for CommunicationSuppressed events",
      "required": [
        "suppressionId",
        "opportunityId",
        "travellerId",
        "tenantId",
        "corporateId",
        "suppressionReason",
        "suppressedChannel",
        "estimatedCostAvoided",
        "daysToDeparture",
        "triggeringEventId",
        "triggeringEventType",
        "suppressedAt"
      ],
      "properties": {
        "suppressionId": {
          "type": "string",
          "format": "uuid"
        },
        "opportunityId": {
          "type": "string",
          "format": "uuid"
        },
        "travellerId": {
          "type": "string",
          "format": "uuid"
        },
        "tenantId": {
          "type": "string",
          "format": "uuid"
        },
        "corporateId": {
          "type": "string",
          "format": "uuid"
        },
        "suppressionReason": {
          "type": "string",
          "enum": [
            "within_predicted_window",
            "self_sufficient_traveller",
            "recent_communication",
            "fatigue_threshold",
            "booking_detected"
          ]
        },
        "suppressedChannel": {
          "type": "string",
          "enum": ["email", "sms", "push_notification", "in_app"]
        },
        "estimatedCostAvoided": {
          "type": "number",
          "minimum": 0
        },
        "daysToDeparture": {
          "type": "number",
          "minimum": 0
        },
        "predictedBookingDate": {
          "type": ["string", "null"],
          "format": "date"
        },
        "triggeringEventId": {
          "type": "string",
          "format": "uuid"
        },
        "triggeringEventType": {
          "type": "string"
        },
        "suppressedAt": {
          "type": "string",
          "format": "date-time"
        }
      },
      "additionalProperties": false
    }
  }
}
```

---

## 8. communication-suppressed-by-fatigue.schema.json

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://hci.platform/schemas/communication-suppressed-by-fatigue.schema.json",
  "title": "CommunicationSuppressedByFatigue Event",
  "description": "Published when a communication is suppressed specifically due to traveller fatigue levels",
  "type": "object",
  "allOf": [
    {
      "$ref": "envelope.schema.json"
    }
  ],
  "properties": {
    "eventType": {
      "const": "CommunicationSuppressedByFatigue"
    },
    "payload": {
      "$ref": "#/definitions/CommunicationSuppressedByFatiguePayload"
    }
  },
  "definitions": {
    "CommunicationSuppressedByFatiguePayload": {
      "type": "object",
      "description": "Payload for CommunicationSuppressedByFatigue events",
      "required": [
        "suppressionId",
        "opportunityId",
        "travellerId",
        "tenantId",
        "corporateId",
        "fatigueScore",
        "fatigueLevel",
        "suppressedChannel",
        "comms30d",
        "estimatedCostAvoided",
        "triggeringEventId",
        "triggeringEventType",
        "suppressedAt"
      ],
      "properties": {
        "suppressionId": {
          "type": "string",
          "format": "uuid"
        },
        "opportunityId": {
          "type": "string",
          "format": "uuid"
        },
        "travellerId": {
          "type": "string",
          "format": "uuid"
        },
        "tenantId": {
          "type": "string",
          "format": "uuid"
        },
        "corporateId": {
          "type": "string",
          "format": "uuid"
        },
        "fatigueScore": {
          "type": "number",
          "minimum": 0,
          "maximum": 100
        },
        "fatigueLevel": {
          "type": "string",
          "enum": ["high", "critical"]
        },
        "suppressedChannel": {
          "type": "string",
          "enum": ["email", "sms", "push_notification", "in_app"]
        },
        "comms30d": {
          "type": "integer",
          "minimum": 0
        },
        "estimatedCostAvoided": {
          "type": "number",
          "minimum": 0
        },
        "triggeringEventId": {
          "type": "string",
          "format": "uuid"
        },
        "triggeringEventType": {
          "type": "string"
        },
        "suppressedAt": {
          "type": "string",
          "format": "date-time"
        }
      },
      "additionalProperties": false
    }
  }
}
```

---

## 9. prediction-outcome-recorded.schema.json

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "$id": "https://hci.platform/schemas/prediction-outcome-recorded.schema.json",
  "title": "PredictionOutcomeRecorded Event",
  "description": "Published when a behaviour intelligence prediction is validated against the actual outcome — enables prediction accuracy tracking",
  "type": "object",
  "allOf": [
    {
      "$ref": "envelope.schema.json"
    }
  ],
  "properties": {
    "eventType": {
      "const": "PredictionOutcomeRecorded"
    },
    "payload": {
      "$ref": "#/definitions/PredictionOutcomeRecordedPayload"
    }
  },
  "definitions": {
    "PredictionOutcomeRecordedPayload": {
      "type": "object",
      "description": "Payload for PredictionOutcomeRecorded events",
      "required": [
        "predictionId",
        "recommendationId",
        "travellerId",
        "tenantId",
        "corporateId",
        "opportunityId",
        "recommendedAction",
        "actualOutcome",
        "wasCorrect",
        "daysDifference",
        "triggeringEventId",
        "triggeringEventType",
        "resolvedAt"
      ],
      "properties": {
        "predictionId": {
          "type": "string",
          "format": "uuid"
        },
        "recommendationId": {
          "type": "string",
          "format": "uuid"
        },
        "travellerId": {
          "type": "string",
          "format": "uuid"
        },
        "tenantId": {
          "type": "string",
          "format": "uuid"
        },
        "corporateId": {
          "type": "string",
          "format": "uuid"
        },
        "opportunityId": {
          "type": "string",
          "format": "uuid"
        },
        "recommendedAction": {
          "type": "string",
          "enum": ["do_nothing", "wait", "send_email", "send_sms", "send_push", "escalate"]
        },
        "actualOutcome": {
          "type": "string",
          "enum": [
            "booked_independently",
            "booked_after_communication",
            "booked_after_escalation",
            "expired_unbooked",
            "cancelled"
          ]
        },
        "wasCorrect": {
          "type": "boolean"
        },
        "daysDifference": {
          "type": "number"
        },
        "confidenceAtPrediction": {
          "type": ["number", "null"],
          "minimum": 0,
          "maximum": 100
        },
        "archetype": {
          "type": ["string", "null"],
          "enum": [
            "autopilot",
            "procrastinator",
            "responsive",
            "nudge_needer",
            "reluctant",
            "chaotic",
            "new_traveller",
            null
          ]
        },
        "destination": {
          "type": ["string", "null"]
        },
        "triggeringEventId": {
          "type": "string",
          "format": "uuid"
        },
        "triggeringEventType": {
          "type": "string"
        },
        "resolvedAt": {
          "type": "string",
          "format": "date-time"
        }
      },
      "additionalProperties": false
    }
  }
}
```

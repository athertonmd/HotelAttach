# HCI Platform — Infrastructure

This directory contains Infrastructure-as-Code (IaC) for the HCI platform AWS deployment.

## Technology

AWS CDK (TypeScript)

## Infrastructure Components

| Component         | Purpose                                            |
| ----------------- | -------------------------------------------------- |
| `cdk/eventbridge` | EventBridge event bus, rules, and targets          |
| `cdk/database`    | Aurora PostgreSQL cluster with per-service schemas |
| `cdk/api-gateway` | API Gateway configuration, routes, authorisers     |
| `cdk/cognito`     | User pools, identity pools, role mappings          |
| `cdk/ses`         | SES configuration, sending identities, templates   |
| `cdk/monitoring`  | CloudWatch dashboards, alarms, log groups          |
| `cdk/networking`  | VPC, subnets, security groups                      |
| `environments`    | Per-environment configuration (dev, staging, prod) |

## Database Topology (Approved Decision Q4)

One Aurora PostgreSQL cluster with separate schemas per bounded context:

- `pnr_ingestion` schema
- `trip_management` schema
- `segment_management` schema
- `traveller` schema
- `booking_reconciliation` schema
- `opportunity_detection` schema
- `traveller_engagement` schema
- `analytics_read_model` schema
- `portal` schema

No service may write to another service's schema.

## Multi-Tenant Isolation

- Application-layer isolation via `tenant_id` columns
- Cognito user pools with tenant claims in JWT
- API Gateway authorisers validate tenant scope
- All infrastructure supports the 5-role hierarchy

## Capacity Planning (Approved Decision Q9)

Infrastructure must support:

- 50,000 PNRs/day
- 25,000 trips/day
- 150,000 segments/day
- 50,000 hotel bookings/day
- 10,000 opportunities/day
- 25,000 communications/day

## Sources

- Architecture & Integration Guide §5, §9, §12
- PRD §11 (Technology Standards)
- Programme Steering Document §Shared Standards
- Approved Decisions Q4, Q6, Q9

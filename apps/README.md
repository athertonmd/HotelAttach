# HCI Platform — Apps

This directory contains user-facing applications for the HCI platform.

## Applications

| App                           | Purpose                                            | Technology                       |
| ----------------------------- | -------------------------------------------------- | -------------------------------- |
| `compliance-analytics-portal` | Operational command centre for TMCs and Corporates | React + TypeScript + Material UI |

## Architecture

The portal is a frontend application that:

- Authenticates via AWS Cognito
- Consumes the Analytics API service for all data
- Does NOT own domain logic or make domain decisions
- Publishes PolicyChanged and SupplierContractChanged events for admin workflows
- Is served via CloudFront + AWS Amplify

## Sources

- Architecture & Integration Guide §4.8
- Project 5 Specification

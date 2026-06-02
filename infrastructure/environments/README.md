# Environment Configuration

Per-environment configuration for the HCI platform.

## Environments

- `dev` — Development environment for active feature work
- `staging` — Pre-production environment for integration testing
- `prod` — Production environment

Each environment file contains:

- AWS account/region
- Database connection parameters
- EventBridge bus name
- Cognito pool IDs
- SES configuration
- Feature flags
- Capacity settings

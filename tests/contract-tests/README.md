# Contract Tests

Validate that event schemas are consistent between publishers and consumers.

Every event type in the platform must have a contract test that:

1. Validates a sample payload against the JSON schema
2. Confirms the envelope structure is correct
3. Verifies required fields are present
4. Tests edge cases (missing optional fields, boundary values)

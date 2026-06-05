#!/bin/bash
set -euo pipefail

BUCKET="${DEMO_S3_BUCKET:-}"
DISTRIBUTION="${DEMO_CLOUDFRONT_DISTRIBUTION_ID:-}"

if [ -z "$BUCKET" ]; then
  echo "Error: Set DEMO_S3_BUCKET environment variable"
  exit 1
fi

echo "Building portal..."
pnpm --filter @hci/compliance-analytics-portal build

echo "Syncing to s3://$BUCKET..."
aws s3 sync apps/compliance-analytics-portal/dist/ "s3://$BUCKET" --delete

if [ -n "$DISTRIBUTION" ]; then
  echo "Invalidating CloudFront cache..."
  aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION" --paths "/*"
fi

echo "Deploy complete!"

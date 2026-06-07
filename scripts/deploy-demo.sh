#!/bin/bash
set -euo pipefail

# HCI Compliance Analytics Portal — Demo Deployment Script
# Runs quality checks, builds the portal, syncs to S3, and invalidates CloudFront cache.
#
# Required environment variables:
#   DEMO_S3_BUCKET                  — S3 bucket name
#   DEMO_CLOUDFRONT_DISTRIBUTION_ID — CloudFront distribution ID
#
# Optional:
#   AWS_REGION (default: eu-west-2)
#   SKIP_CHECKS (set to "true" to skip test/lint/typecheck)

BUCKET="${DEMO_S3_BUCKET:?Error: Set DEMO_S3_BUCKET environment variable}"
DIST_ID="${DEMO_CLOUDFRONT_DISTRIBUTION_ID:?Error: Set DEMO_CLOUDFRONT_DISTRIBUTION_ID environment variable}"
REGION="${AWS_REGION:-eu-west-2}"
SKIP_CHECKS="${SKIP_CHECKS:-false}"
APP_DIR="apps/compliance-analytics-portal"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

echo "============================================"
echo "HCI Demo Portal Deployment"
echo "============================================"
echo "Bucket:       $BUCKET"
echo "Distribution: $DIST_ID"
echo "Region:       $REGION"
echo "============================================"
echo ""

# Step 1: Quality checks
if [ "$SKIP_CHECKS" != "true" ]; then
  echo "▶ Running tests..."
  pnpm --filter @hci/compliance-analytics-portal test

  echo ""
  echo "▶ Running lint..."
  pnpm --filter @hci/compliance-analytics-portal lint

  echo ""
  echo "▶ Running typecheck..."
  pnpm --filter @hci/compliance-analytics-portal typecheck

  echo ""
  echo "✓ All checks passed"
  echo ""
else
  echo "⚠ Skipping checks (SKIP_CHECKS=true)"
  echo ""
fi

# Step 2: Build
echo "▶ Building portal..."
pnpm --filter @hci/compliance-analytics-portal build

if [ ! -f "$APP_DIR/dist/index.html" ]; then
  echo "✗ Build failed — dist/index.html not found"
  exit 1
fi

echo "✓ Build complete"
echo ""

# Step 3: Sync to S3
echo "▶ Syncing to S3..."
aws s3 sync "$APP_DIR/dist/" "s3://$BUCKET" \
  --delete \
  --region "$REGION" \
  --no-progress

echo "✓ S3 sync complete"
echo ""

# Step 4: Invalidate CloudFront cache
echo "▶ Invalidating CloudFront cache..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$DIST_ID" \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)

echo "✓ Invalidation created: $INVALIDATION_ID"
echo ""
echo "============================================"
echo "✓ Deployment complete"
echo "  Cache invalidation typically takes 1-2 minutes."
echo "  Check status: aws cloudfront get-invalidation --distribution-id $DIST_ID --id $INVALIDATION_ID"
echo "============================================"

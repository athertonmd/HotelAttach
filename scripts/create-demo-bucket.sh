#!/bin/bash
set -euo pipefail

# HCI Demo Portal — S3 Bucket Creation Script
# Creates a private S3 bucket with Block Public Access and versioning enabled.
#
# Optional environment variables:
#   DEMO_S3_BUCKET (default: hci-demo-portal-<account-id>)
#   AWS_REGION     (default: eu-west-2)

REGION="${AWS_REGION:-eu-west-2}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET="${DEMO_S3_BUCKET:-hci-demo-portal-$ACCOUNT_ID}"

echo "============================================"
echo "HCI Demo Portal — Create S3 Bucket"
echo "============================================"
echo "Bucket:  $BUCKET"
echo "Region:  $REGION"
echo "Account: $ACCOUNT_ID"
echo "============================================"
echo ""

# Step 1: Create bucket
echo "▶ Creating S3 bucket..."
aws s3api create-bucket \
  --bucket "$BUCKET" \
  --region "$REGION" \
  --create-bucket-configuration LocationConstraint="$REGION"

echo "✓ Bucket created: $BUCKET"
echo ""

# Step 2: Block Public Access
echo "▶ Enabling Block Public Access..."
aws s3api put-public-access-block \
  --bucket "$BUCKET" \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

echo "✓ Block Public Access enabled"
echo ""

# Step 3: Enable versioning
echo "▶ Enabling versioning..."
aws s3api put-bucket-versioning \
  --bucket "$BUCKET" \
  --versioning-configuration Status=Enabled

echo "✓ Versioning enabled"
echo ""

# Step 4: Add tags
echo "▶ Adding tags..."
aws s3api put-bucket-tagging \
  --bucket "$BUCKET" \
  --tagging 'TagSet=[{Key=Project,Value=hci-demo-portal},{Key=Environment,Value=demo},{Key=ManagedBy,Value=manual}]'

echo "✓ Tags applied"
echo ""

echo "============================================"
echo "✓ S3 bucket ready"
echo ""
echo "Next steps:"
echo "  1. Run: ./scripts/create-demo-cloudfront.sh"
echo "  2. Apply bucket policy after CloudFront distribution is created"
echo ""
echo "Export for other scripts:"
echo "  export DEMO_S3_BUCKET=$BUCKET"
echo "============================================"

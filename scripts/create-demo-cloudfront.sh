#!/bin/bash
set -euo pipefail

# HCI Demo Portal — CloudFront Distribution Creation Script
# Creates Origin Access Control, Basic Auth function, and CloudFront distribution.
#
# Prerequisites:
#   - S3 bucket already created (run create-demo-bucket.sh first)
#   - cloudfront/cloudfront-config.json template exists
#   - cloudfront/basic-auth-function.js exists
#   - cloudfront/bucket-policy-template.json exists
#
# Required environment variables:
#   DEMO_S3_BUCKET — S3 bucket name
#
# Optional:
#   AWS_REGION (default: eu-west-2)

BUCKET="${DEMO_S3_BUCKET:?Error: Set DEMO_S3_BUCKET environment variable}"
REGION="${AWS_REGION:-eu-west-2}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "============================================"
echo "HCI Demo Portal — Create CloudFront Distribution"
echo "============================================"
echo "Bucket:  $BUCKET"
echo "Region:  $REGION"
echo "Account: $ACCOUNT_ID"
echo "============================================"
echo ""

# Step 1: Create Origin Access Control
echo "▶ Creating Origin Access Control..."
OAC_ID=$(aws cloudfront create-origin-access-control \
  --origin-access-control-config \
    "Name=hci-demo-portal-oac,Description=OAC for HCI demo portal S3 bucket,SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3" \
  --query 'OriginAccessControl.Id' \
  --output text)

echo "✓ OAC created: $OAC_ID"
echo ""

# Step 2: Create CloudFront Function for Basic Auth
echo "▶ Creating Basic Auth CloudFront Function..."
FUNCTION_NAME="hci-demo-basic-auth"

aws cloudfront create-function \
  --name "$FUNCTION_NAME" \
  --function-config '{"Comment":"Basic Auth for HCI demo portal","Runtime":"cloudfront-js-2.0"}' \
  --function-code "fileb://$ROOT_DIR/cloudfront/basic-auth-function.js" \
  --no-cli-pager

echo "▶ Publishing CloudFront Function..."
FUNCTION_ETAG=$(aws cloudfront describe-function \
  --name "$FUNCTION_NAME" \
  --query 'ETag' \
  --output text)

aws cloudfront publish-function \
  --name "$FUNCTION_NAME" \
  --if-match "$FUNCTION_ETAG" \
  --no-cli-pager

FUNCTION_ARN=$(aws cloudfront describe-function \
  --name "$FUNCTION_NAME" \
  --stage LIVE \
  --query 'FunctionSummary.FunctionMetadata.FunctionARN' \
  --output text)

echo "✓ Function published: $FUNCTION_ARN"
echo ""

# Step 3: Prepare CloudFront distribution config
echo "▶ Preparing distribution config..."
TEMP_CONFIG=$(mktemp)

sed -e "s|BUCKET_NAME|$BUCKET|g" \
    -e "s|OAC_ID_HERE|$OAC_ID|g" \
    -e "s|BASIC_AUTH_FUNCTION_ARN_HERE|$FUNCTION_ARN|g" \
    "$ROOT_DIR/cloudfront/cloudfront-config.json" > "$TEMP_CONFIG"

echo "✓ Config prepared"
echo ""

# Step 4: Create CloudFront distribution
echo "▶ Creating CloudFront distribution..."
DISTRIBUTION_OUTPUT=$(aws cloudfront create-distribution \
  --distribution-config "file://$TEMP_CONFIG" \
  --output json)

DISTRIBUTION_ID=$(echo "$DISTRIBUTION_OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['Distribution']['Id'])")
DISTRIBUTION_DOMAIN=$(echo "$DISTRIBUTION_OUTPUT" | python3 -c "import sys,json; print(json.load(sys.stdin)['Distribution']['DomainName'])")

echo "✓ Distribution created: $DISTRIBUTION_ID"
echo "  Domain: $DISTRIBUTION_DOMAIN"
echo ""

rm -f "$TEMP_CONFIG"

# Step 5: Apply S3 bucket policy
echo "▶ Applying S3 bucket policy..."
TEMP_POLICY=$(mktemp)

sed -e "s|BUCKET_NAME|$BUCKET|g" \
    -e "s|ACCOUNT_ID|$ACCOUNT_ID|g" \
    -e "s|DISTRIBUTION_ID|$DISTRIBUTION_ID|g" \
    "$ROOT_DIR/cloudfront/bucket-policy-template.json" > "$TEMP_POLICY"

aws s3api put-bucket-policy \
  --bucket "$BUCKET" \
  --policy "file://$TEMP_POLICY"

echo "✓ Bucket policy applied"
echo ""

rm -f "$TEMP_POLICY"

# Step 6: Summary
echo "============================================"
echo "✓ CloudFront distribution created"
echo ""
echo "Distribution ID:     $DISTRIBUTION_ID"
echo "Distribution Domain: https://$DISTRIBUTION_DOMAIN"
echo "OAC ID:              $OAC_ID"
echo "Function ARN:        $FUNCTION_ARN"
echo ""
echo "Status: Deploying (takes 5-10 minutes)"
echo ""
echo "Check status:"
echo "  aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.Status'"
echo ""
echo "Default credentials (change before sharing):"
echo "  Username: hci-demo"
echo "  Password: ManticPoint2026!"
echo ""
echo "Export for deploy script:"
echo "  export DEMO_S3_BUCKET=$BUCKET"
echo "  export DEMO_CLOUDFRONT_DISTRIBUTION_ID=$DISTRIBUTION_ID"
echo ""
echo "Next steps:"
echo "  1. Wait for distribution status to become 'Deployed'"
echo "  2. Run: ./scripts/deploy-demo.sh"
echo "  3. Verify: https://$DISTRIBUTION_DOMAIN"
echo "============================================"

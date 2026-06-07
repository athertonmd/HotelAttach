# DEPLOY-1 — AWS CloudFront Mock Demo Deployment Plan

## Purpose

Deploy the HCI Compliance Analytics Portal (mock data only) so the remote Mantic Point team can review the UI prototype without requiring local development setup.

**This is a demo deployment. No live APIs. No real data. No production authentication.**

---

## 1. Recommended AWS Architecture

```
Viewer (Mantic Point team)
    │
    ▼ HTTPS
CloudFront Distribution
    │  Origin Access Control (OAC)
    ▼
S3 Bucket (private, Block Public Access enabled)
    │
    └── /index.html
    └── /assets/...
```

**Components:**

| Component                       | Purpose                                                                           |
| ------------------------------- | --------------------------------------------------------------------------------- |
| S3 Bucket                       | Stores built static files. Private — no public access.                            |
| CloudFront Distribution         | CDN edge delivery. Provides HTTPS, SPA routing, caching.                          |
| Origin Access Control (OAC)     | Grants CloudFront permission to read from private S3 bucket. Replaces legacy OAI. |
| CloudFront Functions (optional) | Basic password protection via Viewer Request function.                            |

**Why OAC over OAI:**

- OAC is AWS's recommended replacement for Origin Access Identity
- Supports S3 server-side encryption (SSE-KMS)
- Supports S3 multi-region access points
- OAI is now legacy and will eventually be deprecated

---

## 2. Build Command

From the monorepo root:

```bash
pnpm --filter @hci/compliance-analytics-portal build
```

Or from the app directory:

```bash
cd apps/compliance-analytics-portal
pnpm build
```

**Pre-flight checks (run before building for deployment):**

```bash
pnpm --filter @hci/compliance-analytics-portal test
pnpm --filter @hci/compliance-analytics-portal lint
pnpm --filter @hci/compliance-analytics-portal typecheck
```

---

## 3. Expected Dist Folder

```
apps/compliance-analytics-portal/dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ... (chunked vendor files)
└── (no other top-level files expected)
```

Vite outputs hashed filenames for cache-busting. The `index.html` references these via absolute paths (`/assets/...`).

**Important:** The Vite config does not set a `base` path, so it defaults to `/`. This is correct for CloudFront serving from the root domain.

---

## 4. Manual Deployment Steps

### 4.1 Create S3 Bucket

```bash
BUCKET_NAME="hci-demo-portal-$(aws sts get-caller-identity --query Account --output text)"
AWS_REGION="eu-west-2"

aws s3api create-bucket \
  --bucket "$BUCKET_NAME" \
  --region "$AWS_REGION" \
  --create-bucket-configuration LocationConstraint="$AWS_REGION"
```

### 4.2 Enable Block Public Access

```bash
aws s3api put-public-access-block \
  --bucket "$BUCKET_NAME" \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
```

### 4.3 Create Origin Access Control

```bash
aws cloudfront create-origin-access-control \
  --origin-access-control-config \
    Name="hci-demo-portal-oac",Description="OAC for HCI demo portal",SigningProtocol=sigv4,SigningBehavior=always,OriginAccessControlOriginType=s3
```

Save the returned `Id` (e.g., `E1XXXXXXXXXXXXXX`).

### 4.4 Create CloudFront Distribution

```bash
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

See Section 5 for the full configuration including SPA routing.

### 4.5 Add S3 Bucket Policy

After creating the distribution, apply a bucket policy granting CloudFront access:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::BUCKET_NAME/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::ACCOUNT_ID:distribution/DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

```bash
aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy file://bucket-policy.json
```

### 4.6 Upload Built Files

```bash
aws s3 sync apps/compliance-analytics-portal/dist/ "s3://$BUCKET_NAME" --delete
```

### 4.7 Invalidate Cache (first deploy won't need this)

```bash
aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*"
```

---

## 5. CloudFront SPA Routing Settings

React Router uses client-side routing. When a user refreshes on `/analytics/hotel-attachment`, CloudFront would return a 403 (S3 can't find that key). The fix is custom error responses.

### Custom Error Responses

| HTTP Error Code | Response Page Path | Response Code |
| --------------- | ------------------ | ------------- |
| 403             | `/index.html`      | 200           |
| 404             | `/index.html`      | 200           |

### Distribution Configuration (cloudfront-config.json)

```json
{
  "CallerReference": "hci-demo-portal-2026-06",
  "Comment": "HCI Compliance Analytics Portal — Demo",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-hci-demo-portal",
        "DomainName": "BUCKET_NAME.s3.eu-west-2.amazonaws.com",
        "OriginAccessControlId": "OAC_ID_HERE",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-hci-demo-portal",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET", "HEAD"]
    },
    "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
    "Compress": true
  },
  "CustomErrorResponses": {
    "Quantity": 2,
    "Items": [
      {
        "ErrorCode": 403,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 10
      },
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 10
      }
    ]
  },
  "ViewerCertificate": {
    "CloudFrontDefaultCertificate": true
  },
  "PriceClass": "PriceClass_100"
}
```

**Notes:**

- `CachePolicyId` above is the AWS managed "CachingOptimized" policy
- `PriceClass_100` limits edge locations to North America and Europe (cheapest)
- `OriginAccessIdentity` must be empty string when using OAC

---

## 6. Cache Invalidation Steps

### After Every Deployment

```bash
# Sync new files
aws s3 sync apps/compliance-analytics-portal/dist/ "s3://$BUCKET_NAME" --delete

# Invalidate all paths
aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*"
```

### Check Invalidation Status

```bash
aws cloudfront get-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --id "$INVALIDATION_ID"
```

**Timing:** Invalidations typically complete in 1–2 minutes. The first 1,000 path invalidations per month are free. Using `/*` counts as one path.

### Why `--delete` Flag

The `--delete` flag on `s3 sync` removes old hashed asset files that no longer exist in the new build. Without it, the bucket accumulates stale files.

---

## 7. Security Notes

### What This Deployment Contains

- Static HTML/CSS/JS only
- Mock data hardcoded in JavaScript bundle
- No API calls to external services
- No real traveller, booking, or corporate data
- No real authentication — role selector is cosmetic

### Access Protection Options

**Option A — CloudFront Function (Basic Auth) — Recommended for Demo**

Create a CloudFront Function that checks for a shared password:

```javascript
function handler(event) {
  var request = event.request;
  var headers = request.headers;
  var authString = 'Basic ' + 'BASE64_USER_PASS';

  if (typeof headers.authorization === 'undefined' || headers.authorization.value !== authString) {
    return {
      statusCode: 401,
      statusDescription: 'Unauthorized',
      headers: {
        'www-authenticate': { value: 'Basic realm="HCI Demo"' },
      },
    };
  }
  return request;
}
```

- Cost: free (included in CloudFront)
- Complexity: low
- Suitable for: internal team sharing a demo password

**Option B — AWS WAF IP Allowlist**

Restrict to Mantic Point office IP ranges. More secure but requires knowing their IPs and updating if they change.

**Option C — CloudFront Signed URLs / Cookies**

Most secure but more complex to set up and share.

### Recommendations

1. Use Option A (Basic Auth via CloudFront Function) for initial demo sharing
2. Share credentials via secure channel (not email)
3. Rotate the password monthly or after each review cycle
4. Consider adding WAF IP allowlist later if the demo runs long-term

### What NOT To Do

- Do not disable S3 Block Public Access
- Do not add real API endpoints to the mock client
- Do not store any credentials in the built bundle
- Do not connect to production databases
- Do not deploy to the same AWS account as production services (if possible)

---

## 8. Rollback Process

### Scenario: Bad Deployment

If a deployment introduces broken UI:

```bash
# Option A: Redeploy previous build
git checkout <previous-commit>
pnpm --filter @hci/compliance-analytics-portal build
aws s3 sync apps/compliance-analytics-portal/dist/ "s3://$BUCKET_NAME" --delete
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*"
```

```bash
# Option B: Restore from S3 versioning (if enabled)
aws s3api list-object-versions --bucket "$BUCKET_NAME" --prefix "index.html"
# Restore specific version
```

### Scenario: Take Offline

```bash
# Disable the distribution
aws cloudfront get-distribution-config --id "$DISTRIBUTION_ID" > dist-config.json
# Edit: set "Enabled": false
aws cloudfront update-distribution --id "$DISTRIBUTION_ID" \
  --distribution-config file://dist-config-disabled.json \
  --if-match "$ETAG"
```

### Recommendation

Enable S3 versioning on the bucket so previous file versions are preserved:

```bash
aws s3api put-bucket-versioning \
  --bucket "$BUCKET_NAME" \
  --versioning-configuration Status=Enabled
```

---

## 9. Estimated Ongoing AWS Cost

### Monthly Cost Estimate (Demo Usage)

| Service                        | Usage Assumption                      | Estimated Cost     |
| ------------------------------ | ------------------------------------- | ------------------ |
| S3 Storage                     | ~5 MB static files                    | < £0.01/mo         |
| S3 Requests                    | ~1,000 GET/mo                         | < £0.01/mo         |
| CloudFront Data Transfer       | ~500 MB/mo (5 users × 100 page views) | ~£0.04/mo          |
| CloudFront Requests            | ~5,000 requests/mo                    | < £0.01/mo         |
| CloudFront Functions           | ~5,000 invocations/mo                 | Free (10M free/mo) |
| Route 53 (optional domain)     | 1 hosted zone                         | £0.40/mo           |
| **Total (no custom domain)**   |                                       | **< £0.10/mo**     |
| **Total (with custom domain)** |                                       | **~£0.50/mo**      |

### Cost Controls

- `PriceClass_100` limits to cheapest edge regions
- No NAT gateways, ALBs, or compute resources
- No data transfer to origin (S3 in same region)
- Set a billing alarm at £5/mo as a safety net

### When To Tear Down

If the demo is no longer needed:

1. Disable and delete the CloudFront distribution
2. Empty and delete the S3 bucket
3. Remove the OAC
4. Remove any Route 53 records

---

## 10. Deployment Checklist

### Pre-Deployment

- [ ] All tests pass: `pnpm --filter @hci/compliance-analytics-portal test`
- [ ] Lint clean: `pnpm --filter @hci/compliance-analytics-portal lint`
- [ ] Type check: `pnpm --filter @hci/compliance-analytics-portal typecheck`
- [ ] Build succeeds: `pnpm --filter @hci/compliance-analytics-portal build`
- [ ] `dist/` folder contains `index.html` and `assets/`
- [ ] No secrets or real API keys in source code
- [ ] AWS CLI configured with appropriate credentials
- [ ] Decided on access protection method (Basic Auth recommended)

### Infrastructure (One-Time)

- [ ] S3 bucket created with Block Public Access enabled
- [ ] S3 versioning enabled
- [ ] Origin Access Control created
- [ ] CloudFront distribution created with OAC
- [ ] Custom error responses configured (403→200, 404→200)
- [ ] Default root object set to `index.html`
- [ ] S3 bucket policy grants CloudFront service principal access
- [ ] HTTPS enforced (viewer-protocol-policy: redirect-to-https)
- [ ] Basic Auth CloudFront Function deployed (if using Option A)
- [ ] Distribution deployed and status is "Deployed"

### Each Release

- [ ] Run pre-deployment checks (tests, lint, typecheck, build)
- [ ] Sync dist to S3: `aws s3 sync dist/ s3://BUCKET --delete`
- [ ] Invalidate CloudFront: `aws cloudfront create-invalidation --distribution-id ID --paths "/*"`
- [ ] Verify site loads at CloudFront domain
- [ ] Verify SPA routing works (navigate directly to `/analytics/hotel-attachment`)
- [ ] Verify Basic Auth prompt appears (if configured)
- [ ] Share URL and credentials with Mantic Point team via secure channel

### Post-Deployment Verification

- [ ] Homepage loads
- [ ] All 6 dashboard pages accessible via sidebar navigation
- [ ] Role selector works (switches between Platform Admin, TMC Admin, etc.)
- [ ] Demo Data badge visible
- [ ] No console errors in browser dev tools
- [ ] Page refresh on sub-routes returns the correct page (SPA routing working)

---

## Optional: Custom Domain (Later)

If a friendly URL like `demo.hci-analytics.manticpoint.com` is needed:

1. Register/delegate domain in Route 53
2. Request ACM certificate in `us-east-1` (required for CloudFront)
3. Validate certificate via DNS
4. Add alternate domain name (CNAME) to CloudFront distribution
5. Create Route 53 A record (alias to CloudFront)
6. Update Basic Auth function if domain changes

This can be added at any time without rebuilding the application.

---

## Quick Reference — Deploy Script

```bash
#!/bin/bash
set -euo pipefail

BUCKET="${DEMO_S3_BUCKET:?Set DEMO_S3_BUCKET}"
DIST_ID="${DEMO_CLOUDFRONT_DISTRIBUTION_ID:?Set DEMO_CLOUDFRONT_DISTRIBUTION_ID}"
APP_DIR="apps/compliance-analytics-portal"

echo "Running checks..."
pnpm --filter @hci/compliance-analytics-portal test
pnpm --filter @hci/compliance-analytics-portal lint
pnpm --filter @hci/compliance-analytics-portal typecheck

echo "Building..."
pnpm --filter @hci/compliance-analytics-portal build

echo "Uploading to S3..."
aws s3 sync "$APP_DIR/dist/" "s3://$BUCKET" --delete

echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*"

echo "Done. Site will be available in ~60 seconds."
```

Save as `scripts/deploy-demo.sh` and `chmod +x`.

---

_Document version: 1.0 — June 2026_

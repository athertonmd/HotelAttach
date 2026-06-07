# AWS Demo Deployment Guide — HCI Compliance Analytics Portal

## Overview

This guide deploys the mock-data HCI Compliance Analytics Portal to AWS CloudFront for internal Mantic Point team review.

**What this deploys:**

- Static React application with mock data
- No live APIs, no databases, no backend services
- Protected by HTTP Basic Authentication via CloudFront Function

**Architecture:**

```
Browser → CloudFront (Basic Auth + HTTPS) → S3 Private Bucket
```

---

## Prerequisites

| Requirement | Details                                               |
| ----------- | ----------------------------------------------------- |
| AWS CLI v2  | Installed and configured with appropriate credentials |
| AWS Account | With permissions for S3, CloudFront, IAM              |
| Node.js     | v18+                                                  |
| pnpm        | Installed globally                                    |
| python3     | For JSON parsing in scripts                           |

### Required AWS Permissions

The deploying user/role needs:

- `s3:CreateBucket`, `s3:PutBucketPolicy`, `s3:PutBucketVersioning`, `s3:PutPublicAccessBlock`, `s3:PutBucketTagging`, `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket`
- `cloudfront:CreateDistribution`, `cloudfront:CreateInvalidation`, `cloudfront:CreateOriginAccessControl`, `cloudfront:CreateFunction`, `cloudfront:PublishFunction`, `cloudfront:DescribeFunction`, `cloudfront:GetDistribution`, `cloudfront:GetDistributionConfig`, `cloudfront:UpdateDistribution`
- `sts:GetCallerIdentity`

---

## Quick Start (All Steps)

```bash
# 1. Create S3 bucket
./scripts/create-demo-bucket.sh

# 2. Export bucket name
export DEMO_S3_BUCKET="hci-demo-portal-<your-account-id>"

# 3. Create CloudFront distribution
./scripts/create-demo-cloudfront.sh

# 4. Wait for distribution to deploy (5-10 min)
aws cloudfront get-distribution --id <DIST_ID> --query 'Distribution.Status'

# 5. Export distribution ID
export DEMO_CLOUDFRONT_DISTRIBUTION_ID="<DIST_ID>"

# 6. Deploy portal
./scripts/deploy-demo.sh

# 7. Access portal
# URL: https://<distribution-id>.cloudfront.net
# Username: hci-demo
# Password: ManticPoint2026!
```

---

## Step-by-Step Guide

### Step 1: Make Scripts Executable

```bash
chmod +x scripts/deploy-demo.sh
chmod +x scripts/create-demo-bucket.sh
chmod +x scripts/create-demo-cloudfront.sh
```

### Step 2: Create S3 Bucket

```bash
./scripts/create-demo-bucket.sh
```

This creates:

- Private S3 bucket named `hci-demo-portal-<account-id>`
- Block Public Access enabled (all four settings)
- Versioning enabled
- Tags applied

**Verify:**

```bash
aws s3api get-bucket-versioning --bucket "$DEMO_S3_BUCKET"
# Expected: {"Status": "Enabled"}

aws s3api get-public-access-block --bucket "$DEMO_S3_BUCKET"
# Expected: all four settings = true
```

### Step 3: Create CloudFront Distribution

```bash
export DEMO_S3_BUCKET="hci-demo-portal-<your-account-id>"
./scripts/create-demo-cloudfront.sh
```

This creates:

- Origin Access Control (OAC) for S3
- CloudFront Function with Basic Auth
- CloudFront distribution with SPA routing
- S3 bucket policy granting CloudFront access

**Wait for deployment:**

```bash
# Check every 60 seconds until status is "Deployed"
aws cloudfront get-distribution --id "$DEMO_CLOUDFRONT_DISTRIBUTION_ID" \
  --query 'Distribution.Status' --output text
```

### Step 4: Deploy Portal

```bash
export DEMO_S3_BUCKET="hci-demo-portal-<your-account-id>"
export DEMO_CLOUDFRONT_DISTRIBUTION_ID="EXXXXXXXXXXXXX"
./scripts/deploy-demo.sh
```

This:

1. Runs tests
2. Runs lint
3. Runs typecheck
4. Builds the portal
5. Syncs `dist/` to S3 (with `--delete`)
6. Invalidates CloudFront cache

### Step 5: Verify

Open `https://<distribution-domain>.cloudfront.net` in a browser.

- Basic Auth prompt should appear
- Enter: `hci-demo` / `ManticPoint2026!`
- Portal should load with Hotel Attachment dashboard

---

## SPA Routing Configuration

React Router requires that all sub-routes return `index.html`. This is handled by CloudFront custom error responses:

| S3 Error            | CloudFront Returns | HTTP Code |
| ------------------- | ------------------ | --------- |
| 403 (key not found) | `/index.html`      | 200       |
| 404 (key not found) | `/index.html`      | 200       |

This means:

- Direct navigation to `/analytics/hotel-attachment` works
- Browser refresh on any route works
- Bookmarked URLs work

The `ErrorCachingMinTTL` is set to 10 seconds to allow rapid redeployment during demos.

---

## Updating the Portal

After code changes:

```bash
./scripts/deploy-demo.sh
```

The script handles build, sync, and cache invalidation. New content is live within 1-2 minutes.

**Skip checks for quick iteration:**

```bash
SKIP_CHECKS=true ./scripts/deploy-demo.sh
```

---

## Basic Auth Credentials

### Default Credentials

- Username: `hci-demo`
- Password: `ManticPoint2026!`

### Changing Credentials

1. Generate new base64 string:

```bash
echo -n "newuser:newpassword" | base64
```

2. Edit `cloudfront/basic-auth-function.js`:

```javascript
var CREDENTIALS = '<new-base64-string>';
```

3. Update the function:

```bash
FUNCTION_ETAG=$(aws cloudfront describe-function --name hci-demo-basic-auth --query 'ETag' --output text)

aws cloudfront update-function \
  --name hci-demo-basic-auth \
  --if-match "$FUNCTION_ETAG" \
  --function-config '{"Comment":"Basic Auth for HCI demo portal","Runtime":"cloudfront-js-2.0"}' \
  --function-code fileb://cloudfront/basic-auth-function.js

NEW_ETAG=$(aws cloudfront describe-function --name hci-demo-basic-auth --query 'ETag' --output text)

aws cloudfront publish-function \
  --name hci-demo-basic-auth \
  --if-match "$NEW_ETAG"
```

4. Wait 1-2 minutes for propagation.

---

## Teardown

To remove all demo infrastructure:

```bash
# 1. Disable distribution
ETAG=$(aws cloudfront get-distribution-config --id "$DEMO_CLOUDFRONT_DISTRIBUTION_ID" --query 'ETag' --output text)
aws cloudfront get-distribution-config --id "$DEMO_CLOUDFRONT_DISTRIBUTION_ID" --query 'DistributionConfig' --output json | \
  python3 -c "import sys,json; c=json.load(sys.stdin); c['Enabled']=False; print(json.dumps(c))" > /tmp/disable-config.json
aws cloudfront update-distribution --id "$DEMO_CLOUDFRONT_DISTRIBUTION_ID" --distribution-config file:///tmp/disable-config.json --if-match "$ETAG"

# 2. Wait for distribution to be disabled
aws cloudfront get-distribution --id "$DEMO_CLOUDFRONT_DISTRIBUTION_ID" --query 'Distribution.Status'

# 3. Delete distribution
ETAG=$(aws cloudfront get-distribution-config --id "$DEMO_CLOUDFRONT_DISTRIBUTION_ID" --query 'ETag' --output text)
aws cloudfront delete-distribution --id "$DEMO_CLOUDFRONT_DISTRIBUTION_ID" --if-match "$ETAG"

# 4. Delete CloudFront Function
ETAG=$(aws cloudfront describe-function --name hci-demo-basic-auth --query 'ETag' --output text)
aws cloudfront delete-function --name hci-demo-basic-auth --if-match "$ETAG"

# 5. Delete OAC
aws cloudfront delete-origin-access-control --id "$OAC_ID" --if-match "$(aws cloudfront get-origin-access-control --id "$OAC_ID" --query 'ETag' --output text)"

# 6. Empty and delete S3 bucket
aws s3 rm "s3://$DEMO_S3_BUCKET" --recursive
aws s3api delete-bucket --bucket "$DEMO_S3_BUCKET" --region eu-west-2
```

---

## Troubleshooting

| Problem                    | Cause                                 | Fix                                                        |
| -------------------------- | ------------------------------------- | ---------------------------------------------------------- |
| 403 on root URL            | Distribution not yet deployed         | Wait for status = "Deployed"                               |
| 403 after deployment       | Bucket policy incorrect               | Re-apply bucket policy with correct distribution ARN       |
| Blank page on sub-route    | Custom error responses not configured | Check distribution has 403→200 and 404→200 error responses |
| Basic Auth not prompting   | Function not associated               | Check DefaultCacheBehavior.FunctionAssociations            |
| Stale content after deploy | Cache not invalidated                 | Run `aws cloudfront create-invalidation`                   |
| Build fails                | Dependencies not installed            | Run `pnpm install` from monorepo root                      |

---

## Cost Estimate

| Component                     | Monthly Cost           |
| ----------------------------- | ---------------------- |
| S3 storage (~5 MB)            | < £0.01                |
| S3 requests (~1,000/mo)       | < £0.01                |
| CloudFront transfer (~500 MB) | ~£0.04                 |
| CloudFront requests (~5,000)  | < £0.01                |
| CloudFront Functions          | Free (10M/mo included) |
| **Total**                     | **< £0.10/month**      |

---

## Deployment Verification Checklist

After each deployment, verify:

- [ ] Homepage loads at CloudFront URL
- [ ] Basic Auth prompt appears (credentials required)
- [ ] Hotel Attachment dashboard renders with hero KPI
- [ ] All 6 sidebar navigation items clickable
- [ ] Refresh on `/analytics/hotel-attachment` returns the page (SPA routing)
- [ ] Refresh on `/analytics/behaviour` returns the page
- [ ] Demo Data badge visible on dashboard
- [ ] Role selector changes visible navigation items
- [ ] No JavaScript console errors
- [ ] HTTPS enforced (HTTP redirects to HTTPS)

---

_Document version: 1.0 — June 2026_

# Demo Deployment Guide — HCI Compliance Analytics Portal

## Overview

This guide covers deploying the **demo** version of the HCI Compliance Analytics Portal to AWS using S3 static hosting and CloudFront as CDN.

> ⚠️ **Security Warning**: This portal uses **mock data only** and has no real authentication. Do not deploy to production or expose to public internet without proper access controls.

---

## 1. Build

```bash
pnpm --filter @hci/compliance-analytics-portal build
```

Output folder: `apps/compliance-analytics-portal/dist/`

---

## 2. S3 Bucket Setup

1. Create an S3 bucket (e.g., `hci-demo-portal-<account-id>`).
2. Enable **Static Website Hosting**:
   - Index document: `index.html`
   - Error document: `index.html` (for SPA client-side routing)
3. **Option A — Public read** (simplest for internal demo):
   - Disable "Block all public access"
   - Add a bucket policy allowing `s3:GetObject` for `*`
4. **Option B — CloudFront OAI** (recommended):
   - Keep bucket private
   - Create an Origin Access Identity (OAI) in CloudFront
   - Add a bucket policy granting `s3:GetObject` to the OAI principal

---

## 3. CloudFront Distribution

1. Create a CloudFront distribution with origin pointing to the S3 bucket.
2. **SPA Routing**: Create custom error responses:
   - Error code `403` → Response page `/index.html`, Response code `200`
   - Error code `404` → Response page `/index.html`, Response code `200`
3. Set default root object to `index.html`.
4. Enable HTTPS (use default CloudFront certificate or a custom ACM certificate).
5. Optionally restrict access with WAF or signed URLs for internal-only demos.

---

## 4. Cache Invalidation

After deploying new files, invalidate the CloudFront cache:

```bash
aws cloudfront create-invalidation \
  --distribution-id DEMO_CLOUDFRONT_DISTRIBUTION_ID \
  --paths "/*"
```

---

## 5. Deploying Updates

1. Rebuild: `pnpm --filter @hci/compliance-analytics-portal build`
2. Sync to S3: `aws s3 sync apps/compliance-analytics-portal/dist/ s3://YOUR_BUCKET --delete`
3. Invalidate CloudFront cache (see above)

Or use the provided script:

```bash
DEMO_S3_BUCKET=your-bucket DEMO_CLOUDFRONT_DISTRIBUTION_ID=EXXXXXXX ./scripts/deploy-demo.sh
```

---

## 6. Environment Variables

| Variable                          | Required | Description                                         |
| --------------------------------- | -------- | --------------------------------------------------- |
| `DEMO_S3_BUCKET`                  | Yes      | S3 bucket name for the demo portal                  |
| `DEMO_CLOUDFRONT_DISTRIBUTION_ID` | No       | CloudFront distribution ID (for cache invalidation) |

---

## 7. Security Considerations

- This deployment contains **mock data only** — no real guest, booking, or compliance data.
- There is **no real authentication** — the role selector is for demonstration purposes.
- Consider restricting access via:
  - CloudFront signed URLs/cookies
  - AWS WAF IP allowlisting
  - VPN-only access
- Do **not** connect this portal to production APIs or databases.
- Rotate any AWS credentials used for deployment regularly.

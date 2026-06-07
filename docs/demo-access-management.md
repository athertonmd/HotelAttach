# Demo Access Management

## Overview

The HCI Demo Portal uses HTTP Basic Authentication via a CloudFront Function to control access. This document covers credential management, access sharing, and security procedures.

---

## Current Access Method

| Method          | Technology                           | Scope                            |
| --------------- | ------------------------------------ | -------------------------------- |
| HTTP Basic Auth | CloudFront Function (viewer-request) | All requests to the distribution |

Basic Auth is simple, stateless, and free to run. It provides sufficient protection for an internal demo with mock data only.

---

## Default Credentials

| Field    | Value              |
| -------- | ------------------ |
| Username | `hci-demo`         |
| Password | `ManticPoint2026!` |

**These must be changed before sharing with anyone outside the immediate team.**

---

## Password Rotation

### When to Rotate

- Before sharing with a new group of stakeholders
- After a review session ends and access should be revoked
- Monthly if the demo runs long-term
- If credentials are accidentally shared via insecure channel

### How to Rotate

1. Choose a new username and password:

```bash
# Generate a random password
openssl rand -base64 12
```

2. Create the base64 credential string:

```bash
echo -n "newuser:newpassword" | base64
```

3. Update `cloudfront/basic-auth-function.js`:

```javascript
var CREDENTIALS = '<paste-base64-output-here>';
```

4. Deploy the updated function:

```bash
# Get current ETag
FUNCTION_ETAG=$(aws cloudfront describe-function \
  --name hci-demo-basic-auth \
  --query 'ETag' \
  --output text)

# Update function code
aws cloudfront update-function \
  --name hci-demo-basic-auth \
  --if-match "$FUNCTION_ETAG" \
  --function-config '{"Comment":"Basic Auth for HCI demo portal","Runtime":"cloudfront-js-2.0"}' \
  --function-code fileb://cloudfront/basic-auth-function.js

# Publish to LIVE stage
NEW_ETAG=$(aws cloudfront describe-function \
  --name hci-demo-basic-auth \
  --query 'ETag' \
  --output text)

aws cloudfront publish-function \
  --name hci-demo-basic-auth \
  --if-match "$NEW_ETAG"
```

5. Wait 1-2 minutes for propagation to edge locations.

6. Verify old credentials are rejected and new credentials work.

### Rotation Checklist

- [ ] New credentials chosen (avoid dictionary words)
- [ ] Base64 string generated correctly
- [ ] Function code updated
- [ ] Function published to LIVE stage
- [ ] Old credentials no longer work
- [ ] New credentials shared via secure channel
- [ ] Git commit made with updated function file

---

## Sharing Credentials

### Secure Channels (Recommended)

| Channel                         | Suitability                      |
| ------------------------------- | -------------------------------- |
| Microsoft Teams direct message  | Good — encrypted, auditable      |
| Slack direct message            | Good — encrypted                 |
| 1Password/LastPass shared vault | Best — purpose-built             |
| Verbal (phone/video call)       | Good — no written record to leak |

### Insecure Channels (Do NOT Use)

| Channel                | Risk                                |
| ---------------------- | ----------------------------------- |
| Email                  | Forwarded, searchable, persistent   |
| Confluence/Wiki        | Broadly accessible, cached          |
| Shared documents       | Version history retains credentials |
| Chat channels (non-DM) | Visible to entire channel           |

### Sharing Template

> Hi [name],
>
> The HCI Analytics demo portal is available for review:
>
> **URL:** https://[distribution].cloudfront.net
>
> I'll send the access credentials separately.
>
> The portal shows mock data representing the analytics dashboards we've built. You can explore all 6 dashboards using the sidebar. Use the role selector (bottom-left) to switch between different user perspectives.
>
> Let me know if you have trouble accessing it.

Send the credentials in a separate message (not the same message as the URL).

---

## Removing Access

### Option 1: Rotate Password (Recommended)

Changing the password immediately revokes all existing access. Anyone with the old credentials will see a 401 Unauthorized response.

Follow the "How to Rotate" steps above.

### Option 2: Disable the Distribution

For complete shutdown:

```bash
# Get current config and ETag
ETAG=$(aws cloudfront get-distribution-config \
  --id "$DEMO_CLOUDFRONT_DISTRIBUTION_ID" \
  --query 'ETag' \
  --output text)

aws cloudfront get-distribution-config \
  --id "$DEMO_CLOUDFRONT_DISTRIBUTION_ID" \
  --query 'DistributionConfig' \
  --output json | \
  python3 -c "import sys,json; c=json.load(sys.stdin); c['Enabled']=False; print(json.dumps(c))" \
  > /tmp/disable-dist.json

aws cloudfront update-distribution \
  --id "$DEMO_CLOUDFRONT_DISTRIBUTION_ID" \
  --distribution-config file:///tmp/disable-dist.json \
  --if-match "$ETAG"

rm /tmp/disable-dist.json
```

This takes 5-10 minutes to propagate. After propagation, the URL returns an error page.

### Option 3: Remove Function Association

Remove Basic Auth entirely (not recommended — leaves portal open):

This should only be done if replacing with a different access control mechanism.

---

## Re-enabling Access

If the distribution was disabled:

```bash
ETAG=$(aws cloudfront get-distribution-config \
  --id "$DEMO_CLOUDFRONT_DISTRIBUTION_ID" \
  --query 'ETag' \
  --output text)

aws cloudfront get-distribution-config \
  --id "$DEMO_CLOUDFRONT_DISTRIBUTION_ID" \
  --query 'DistributionConfig' \
  --output json | \
  python3 -c "import sys,json; c=json.load(sys.stdin); c['Enabled']=True; print(json.dumps(c))" \
  > /tmp/enable-dist.json

aws cloudfront update-distribution \
  --id "$DEMO_CLOUDFRONT_DISTRIBUTION_ID" \
  --distribution-config file:///tmp/enable-dist.json \
  --if-match "$ETAG"

rm /tmp/enable-dist.json
```

---

## Security Considerations

### What Basic Auth Protects Against

- Casual browsing (someone finding the URL)
- Automated scanners
- Search engine indexing

### What Basic Auth Does NOT Protect Against

- Determined attackers (credentials sent in every request header)
- Network sniffing (mitigated by HTTPS — always enforced)
- Credential sharing (anyone with credentials can share them)

### Acceptable Risk for This Demo

This is acceptable because:

- The portal contains only mock data — no real traveller or corporate information
- The demo is short-lived — days or weeks, not months
- The audience is a known, trusted internal team
- HTTPS is enforced — credentials are encrypted in transit

### If Stronger Protection Is Needed Later

| Option                 | Complexity | Cost        |
| ---------------------- | ---------- | ----------- |
| AWS WAF IP allowlist   | Medium     | ~£5/mo      |
| CloudFront signed URLs | High       | Free        |
| Cognito authentication | High       | Usage-based |

For the current demo phase, Basic Auth is sufficient.

---

## Access Log

Maintain a manual log of who has been given access:

| Date | Recipient | Credentials Version | Purpose | Access Revoked |
| ---- | --------- | ------------------- | ------- | -------------- |
|      |           |                     |         |                |

Update this log each time credentials are shared or rotated.

---

_Document version: 1.0 — June 2026_

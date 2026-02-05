# VibeAff API Outline

## Authentication
- Merchant and affiliate API keys (scoped).
- Admin endpoints require elevated scopes.
- Webhooks are signed with HMAC.

## Core Endpoints
### Merchants
- `POST /merchants` create merchant profile
- `POST /merchants/{id}/integrations` connect analytics/ad sources
- `POST /merchants/{id}/programs` create affiliate program

### Affiliates
- `POST /affiliates` create affiliate profile
- `POST /affiliates/{id}/campaigns` create campaign
- `POST /campaigns/{id}/creatives` purchase creatives

### Tracking
- `POST /links` create tracking link
- `POST /clicks` ingest click (server-side)
- `POST /conversions` ingest conversion (server-side signed)

### Payouts
- `GET /payouts` list payouts
- `POST /payouts/{id}/approve` approve payout
- `POST /payouts/{id}/hold` hold payout

## Webhooks
- `conversion.verified`
- `payout.released`
- `payout.held`
- `campaign.flagged`

## One-Command Integration
Example install command:
```
npx vibeaff-init --merchant-id <id> --api-key <key>
```

## SDK Responsibilities
- Capture click IDs and attribution parameters.
- Send signed conversion events to VibeAff webhook.
- Health check endpoint for integration status.

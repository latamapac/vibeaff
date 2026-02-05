# VibeAff Product Requirements

## Overview
VibeAff is a B2B affiliate + performance marketing platform that combines
classic referral tracking with a VibeAff module that helps merchants pick
audiences, channels, and creatives, and enables affiliates to run paid traffic
against products. Affiliates are paid commissions from verified sales and may
opt for crypto payouts.

## Goals
- Enable merchants to launch affiliate programs in hours.
- Provide affiliates a guided workflow to target audiences and channels.
- Ensure attribution, payout, and fraud controls are production-ready.
- Offer a one-command integration module for quick adoption.

## Non-Goals
- Running ads on behalf of the merchant without explicit permissions.
- Serving as a full ad agency or creative studio for custom work.

## User Roles
- Merchant: owns products, sets commissions, approves affiliates, pays out.
- Affiliate: creates campaigns, buys creatives/traffic, earns commission.
- Admin/Backoffice: risk review, payouts, compliance, and integrations.

## Core User Flows
### Merchant Onboarding
1. Connect analytics (e.g., GA) and install tracking module.
2. Create program: commission rules, attribution window, categories.
3. Approve affiliates and set payout method.

### Affiliate Campaign
1. Select merchant program + product.
2. Enter target audience (region, persona, demographics, intent signals).
3. Choose channels (search, social, video, native, influencer).
4. Purchase creatives and traffic budget.
5. Track conversions and earnings; request payout.

### VibeAff Module
- Analyze merchant via analytics + ads library to identify best-performing
  channels, ad formats, and messaging themes.
- Translate affiliate target audience into channel-specific creative variants.
- Provide budget suggestions and estimated conversion benchmarks.

## Data Sources and Permissions
- Google Analytics or equivalent: events, conversions, traffic sources.
- Ads library: historical ads, creative themes, compliance flags.
- Optional: product catalog feeds, CRM order data, webhooks.

## Payments and Payouts
- Commissions calculated per verified conversion.
- Payouts held for a configurable delay to mitigate refunds/chargebacks.
- Support fiat and crypto payout rails.

## Security and Integrity Requirements
- Conversion verification via signed server-side events or webhooks.
- Deduplicate events and block self-referrals.
- Velocity checks, IP/device fingerprinting, and suspicious traffic scoring.
- Refund/chargeback signals automatically pause payouts.

## MVP Scope
- Basic referral tracking (link, click, conversion).
- Attribution model: last-click with configurable window.
- Affiliate onboarding + campaign setup.
- Creatives purchase + traffic budget input.
- Payout queue with hold period and manual approval.

## Success Metrics
- Merchant onboarding time < 1 day.
- Verified conversion rate and payout accuracy.
- Reduction in chargeback-related payouts.
- Affiliate retention and ROI.

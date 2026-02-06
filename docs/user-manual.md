# VibeAff User Manual

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [For Merchants/Partners](#for-merchantspartners)
3. [For Affiliates](#for-affiliates)
4. [For VibeAff Admins](#for-vibeaff-admins)

---

## Platform Overview

### What is VibeAff?

VibeAff is a modern affiliate marketing platform that connects merchants with affiliates to drive sales through performance-based partnerships. The platform provides comprehensive tools for tracking, attribution, creative generation, and payouts.

### User Roles

| Role | Description |
|------|-------------|
| **Merchant/Partner** | Businesses that create affiliate programs and pay commissions for referred sales |
| **Affiliate** | Content creators, influencers, and marketers who promote merchant products for commission |
| **Admin** | VibeAff platform administrators who manage the system, payouts, and fraud detection |

### How They Interact

```
Merchant creates program --> Affiliates apply --> Generate tracking links
                                  |
                                  v
                          Drive traffic --> Clicks tracked
                                  |
                                  v
                          Conversions recorded --> Commission calculated
                                  |
                                  v
                          Payout processed --> Affiliate paid
```

---

## For Merchants/Partners

### Program Setup

#### Creating an Affiliate Program

1. Navigate to **Partner Dashboard** > **Programs**
2. Click **Create Program**
3. Configure your program:
   - **Name**: A descriptive program name
   - **Commission Type**: Percentage or fixed amount
   - **Commission Value**: The amount or percentage per conversion
   - **Cookie Duration**: Attribution window (e.g., 30 days)
   - **Terms**: Program terms and conditions

#### Commission Rates

| Commission Type | Use Case |
|-----------------|----------|
| **Percentage** | Best for variable-priced products (e.g., 15% of sale) |
| **Fixed** | Best for subscriptions or flat-rate products (e.g., $50 per signup) |
| **Recurring** | For subscription products with ongoing commissions |

#### Attribution Windows

The cookie duration determines how long after a click a conversion is attributed:

- **7 days**: High-intent products with quick purchase cycles
- **30 days**: Standard for most e-commerce
- **60-90 days**: B2B or high-consideration purchases

### Affiliate Approval Workflow

1. Affiliates apply to your program
2. Review applications in **Partner Dashboard** > **Affiliates** > **Pending**
3. Evaluate based on:
   - Traffic sources
   - Audience demographics
   - Content quality
   - Previous performance
4. **Approve** or **Reject** with feedback

### Creative Governance

Control what affiliates can use to promote your brand:

- **Approved Creatives**: Upload banners, copy, and assets to the Creative Library
- **Brand Guidelines**: Set rules for logo usage, messaging, and prohibited claims
- **Review Queue**: Approve affiliate-submitted creatives before they go live

### Payout Controls

#### Hold Periods

Set a hold period (e.g., 14-30 days) before commissions become payable to:
- Allow time for refunds/chargebacks
- Verify conversion quality
- Detect fraudulent activity

#### Approval Flow

1. Conversions are recorded with **pending** status
2. After hold period, status changes to **approved**
3. Approved commissions are batched for payout
4. Payouts are processed on your schedule (weekly, bi-weekly, monthly)

### Analytics and Reporting

Access real-time data on:

- **Clicks**: Total and unique click counts
- **Conversions**: Sales attributed to affiliates
- **Revenue**: Total revenue from affiliate traffic
- **Commission**: Pending and paid commissions
- **Top Performers**: Leaderboard of best affiliates
- **Channel Performance**: Breakdown by traffic source

### Integration Setup

#### One-Command SDK Installation

```bash
npx vibeaff-sdk init --api-key YOUR_API_KEY
```

#### Tracking Script

Add to your checkout page:

```html
<script src="https://cdn.vibeaff.com/sdk.js" data-key="YOUR_API_KEY"></script>
```

#### Server-Side Postback

For secure conversion tracking:

```bash
curl -X POST https://api.vibeaff.com/v1/conversions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "linkId": "lnk_xxx",
    "orderId": "order_123",
    "amount": 99.00,
    "currency": "USD"
  }'
```

---

## For Affiliates

### Getting Started

#### Registration

1. Visit [vibeaff.com/register](https://vibeaff.com/register)
2. Create your account with email and password
3. Complete your profile:
   - Display name
   - Website/social handles
   - Payout preferences
4. Verify your email address

#### Program Discovery

Browse available programs in the **Marketplace**:

- Filter by category (SaaS, E-commerce, Finance, etc.)
- Sort by commission rate, cookie duration, or popularity
- View program details and terms
- Apply to join programs

### Audience Builder

Define your target audience for better creative recommendations:

#### Regions
Select geographic regions you target:
- Americas
- Europe
- Asia-Pacific
- Middle East & Africa

#### Personas
Choose audience personas:
- Tech-savvy professionals
- Small business owners
- Content creators
- Bargain hunters
- Early adopters

#### Interests
Specify audience interests:
- Technology
- Business/Finance
- Health & Wellness
- Entertainment
- Education

### Creative Packs

#### Generate Copy

Use AI-powered copy generation:

1. Go to **Creative Tools** > **Generate Copy**
2. Select the product/program
3. Choose tone (professional, casual, urgent, friendly)
4. Set maximum length
5. Generate and customize

#### Request Images

Create promotional images:

1. Go to **Creative Tools** > **Generate Image**
2. Describe what you need
3. Select dimensions (social, banner, etc.)
4. Download generated assets

#### Translations

Localize your content:

1. Select existing copy
2. Choose target language
3. AI translates while preserving tone
4. Review and edit as needed

### Traffic Planning

#### Channel Selection

Register your traffic channels:

| Channel Type | Examples |
|--------------|----------|
| **Website** | Blog, niche site, review site |
| **Social** | Instagram, TikTok, YouTube, Twitter |
| **Email** | Newsletter, email list |
| **Search** | SEO, Google Ads |
| **Push** | Push notification networks |

#### Budget Allocation

For paid traffic campaigns:

1. Set daily/monthly budgets per channel
2. Track ROI against commission earned
3. Optimize based on performance data

### Link Tracking

#### How Attribution Works

1. **Click**: User clicks your unique tracking link
2. **Cookie**: A tracking cookie is set (duration varies by program)
3. **Browse**: User may leave and return
4. **Convert**: User makes a purchase
5. **Attribute**: Sale is attributed to you if cookie is still valid
6. **Commission**: You earn commission on the sale

#### Click to Conversion Flow

```
Your Link --> VibeAff Redirect --> Merchant Site --> Purchase
    |                                                    |
    +--------------- Cookie Tracking -------------------+
                           |
                    Conversion Recorded
                           |
                    Commission Calculated
```

### Performance Hub

#### Stats Dashboard

Track your performance:

- **Today's Clicks**: Real-time click count
- **Pending Conversions**: Awaiting approval
- **Approved Earnings**: Ready for payout
- **Lifetime Earnings**: Total earned

#### Tiers

Unlock benefits as you grow:

| Tier | Requirements | Benefits |
|------|--------------|----------|
| **Bronze** | $0+ earned | Standard commission |
| **Silver** | $1,000+ earned | +5% commission bonus |
| **Gold** | $5,000+ earned | +10% commission, priority support |
| **Diamond** | $25,000+ earned | +15% commission, dedicated manager |

#### Badges

Earn recognition:

- **First Sale**: Complete your first conversion
- **Streak 7**: 7 consecutive days with conversions
- **Streak 30**: 30 consecutive days with conversions
- **Top 10**: Rank in top 10 on monthly leaderboard
- **Top Performer**: #1 on monthly leaderboard

#### Leaderboard

Compete with other affiliates:

- View daily, weekly, and monthly rankings
- See anonymized earnings and conversion counts
- Earn badges for top placements

### Payouts

#### Payout Methods

| Method | Minimum | Processing Time |
|--------|---------|-----------------|
| **PayPal** | $50 | 1-2 business days |
| **Bank Transfer** | $100 | 3-5 business days |
| **Crypto (USDC/USDT)** | $50 | Same day |

#### Payout Statuses

| Status | Description |
|--------|-------------|
| **Pending** | Conversion recorded, in hold period |
| **Approved** | Hold period complete, ready for payout |
| **Processing** | Payout initiated |
| **Paid** | Funds sent |
| **Held** | Under review (fraud check) |

#### Hold Periods

Merchants set hold periods (typically 14-30 days) to protect against:
- Refunds
- Chargebacks
- Fraudulent conversions

---

## For VibeAff Admins

### Backoffice Dashboard

#### Key Metrics

Monitor platform health:

- **Total GMV**: Gross merchandise value processed
- **Active Programs**: Number of live affiliate programs
- **Active Affiliates**: Affiliates with recent activity
- **Pending Payouts**: Total amount awaiting payout
- **Fraud Rate**: Percentage of flagged conversions

#### Alerts

Configure alerts for:

- Unusual traffic spikes
- High fraud scores
- Payout threshold breaches
- System errors

### Payout Queue Management

#### Review Queue

1. Access **Admin** > **Payouts**
2. Filter by status: Pending, Ready, Processing, Held
3. Review individual payouts or batch process
4. Approve, hold, or reject with notes

#### Batch Processing

- Select multiple payouts
- Apply bulk actions (approve, hold)
- Export for external payment processing

### Fraud Detection

#### Velocity Checks

Automatic detection of:

- Abnormal click velocity (too many clicks/minute)
- Duplicate conversions
- Self-referral attempts
- VPN/proxy usage patterns

#### Flagging System

| Flag Level | Trigger | Action |
|------------|---------|--------|
| **Low** | Minor anomaly | Monitor |
| **Medium** | Multiple anomalies | Review required |
| **High** | Clear fraud pattern | Auto-hold payout |
| **Critical** | Confirmed fraud | Account suspension |

#### Fraud Scores

Each conversion receives a fraud score (0-100):

- **0-25**: Clean, auto-approve
- **26-50**: Low risk, spot check
- **51-75**: Medium risk, manual review
- **76-100**: High risk, auto-hold

### Channel Library Management

#### Verification

Verify affiliate channels:

1. Review submitted channel URLs
2. Check domain ownership
3. Verify social account authenticity
4. Approve or request more information

#### Categories

Manage channel categories:
- Social Media
- Content Sites
- Email Lists
- Search/PPC
- In-App/Native

### Integration Connections

#### OAuth Flows

Support OAuth integrations with:

- **Google Ads**: Import conversion data
- **Meta Ads**: Sync with Facebook/Instagram campaigns
- **Microsoft Ads**: Connect Bing advertising

#### Webhook Management

Configure incoming webhooks from:

- Shopify
- Stripe
- WooCommerce
- Custom platforms

### Audit Logs

Track all platform actions:

- **User Actions**: Login, logout, password changes
- **Payout Actions**: Approve, reject, hold, release
- **Admin Actions**: Settings changes, user management
- **System Actions**: Automated processes, scheduled jobs

Filter logs by:
- User ID
- Action type
- Date range
- Resource type

### Access Matrix and RBAC

#### Role Definitions

| Role | Permissions |
|------|-------------|
| **Super Admin** | Full platform access |
| **Finance Admin** | Payout management, financial reports |
| **Operations Admin** | Affiliate/merchant management |
| **Support Admin** | Read-only access, ticket handling |
| **Viewer** | Read-only dashboard access |

#### Permission Groups

- **Users**: Create, read, update, delete users
- **Payouts**: View, approve, hold, reject payouts
- **Programs**: Manage affiliate programs
- **Reports**: Access analytics and reporting
- **Settings**: Platform configuration
- **Audit**: View audit logs

---

## Support

For assistance:

- **Documentation**: [docs.vibeaff.com](https://docs.vibeaff.com)
- **Email**: support@vibeaff.com
- **Status**: [status.vibeaff.com](https://status.vibeaff.com)

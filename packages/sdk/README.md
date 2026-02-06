# @vibeaff/sdk

VibeAff affiliate tracking SDK - one-command integration for tracking affiliate conversions and managing attribution.

## Quick Start

```bash
npx @vibeaff/sdk --merchant-id YOUR_MERCHANT_ID --api-key YOUR_API_KEY
```

This command will:
- Auto-detect your framework (Next.js, Express, or generic HTML)
- Create `.env.vibeaff` with your credentials
- Generate framework-specific integration files
- Provide setup instructions

## Installation

```bash
npm install @vibeaff/sdk
# or
yarn add @vibeaff/sdk
```

## Browser SDK

### Basic Usage

Add the script tag to your HTML:

```html
<script 
  src="https://cdn.vibeaff.com/v1/browser.js" 
  data-api-url="https://api.vibeaff.com" 
  data-merchant-id="YOUR_MERCHANT_ID">
</script>
```

Or use the local file:

```html
<script 
  src="/vibeaff-tracking.js" 
  data-api-url="https://api.vibeaff.com" 
  data-merchant-id="YOUR_MERCHANT_ID">
</script>
```

### API Reference

#### `VibeAff.init({ apiUrl, merchantId })`

Manually configure the SDK (optional if using data attributes).

```javascript
VibeAff.init({
  apiUrl: 'https://api.vibeaff.com',
  merchantId: 'your-merchant-id'
});
```

#### `VibeAff.getAttribution()`

Get current attribution data from cookies.

```javascript
const attribution = VibeAff.getAttribution();
// Returns: { clickId: '...', affiliateId: '...', programId: '...' }
```

#### `VibeAff.trackConversion({ orderId, orderTotal, currency })`

Track a conversion event.

```javascript
VibeAff.trackConversion({
  orderId: 'ORDER_123',
  orderTotal: 99.99,
  currency: 'USD'
});
```

**Parameters:**
- `orderId` (string, required) - Unique order identifier
- `orderTotal` (number, required) - Order total amount
- `currency` (string, optional) - Currency code (default: 'USD')

**Returns:** Promise that resolves with API response

### How It Works

1. **Automatic Tracking Capture**: On page load, the SDK reads `vclick`, `vaff`, and `vprg` parameters from the URL
2. **Cookie Storage**: Tracking parameters are stored in cookies with 30-day expiry:
   - `vibeaff_click` - Click ID
   - `vibeaff_affiliate` - Affiliate ID
   - `vibeaff_program` - Program ID
3. **Conversion Tracking**: When `trackConversion()` is called, attribution data is automatically included

## Node.js SDK

### Basic Usage

```javascript
const { createVibeAffClient, getTrackingParams } = require('@vibeaff/sdk');

// Create client
const client = createVibeAffClient({
  apiUrl: 'https://api.vibeaff.com',
  apiKey: process.env.VIBEAFF_API_KEY
});

// Track conversion
await client.trackConversion({
  programId: 'program_123',
  affiliateId: 'affiliate_456',
  orderId: 'ORDER_789',
  orderTotal: 99.99,
  currency: 'USD'
});
```

### API Reference

#### `createVibeAffClient({ apiUrl, apiKey })`

Creates a VibeAff client instance.

**Parameters:**
- `apiUrl` (string, optional) - API base URL (default: 'https://api.vibeaff.com')
- `apiKey` (string, required) - API key for authentication

**Returns:** Client object with methods

#### `client.trackConversion({ programId, affiliateId, orderId, orderTotal, currency })`

Track a conversion server-side.

**Parameters:**
- `programId` (string|null, optional) - Program ID
- `affiliateId` (string|null, optional) - Affiliate ID
- `orderId` (string, required) - Order ID
- `orderTotal` (number, required) - Order total amount
- `currency` (string, optional) - Currency code (default: 'USD')

**Returns:** Promise that resolves with API response

#### `client.verifyWebhook(payload, signature, secret)`

Verify webhook signature using HMAC.

**Parameters:**
- `payload` (string|Object) - Webhook payload
- `signature` (string) - Signature from `X-VibeAff-Signature` header
- `secret` (string) - Webhook secret

**Returns:** Boolean indicating if signature is valid

#### `getTrackingParams(url)`

Extract tracking parameters from a URL.

**Parameters:**
- `url` (string) - URL to parse

**Returns:** Object with `clickId`, `affiliateId`, `programId` properties

## Framework Guides

### Next.js

1. **Run the init command:**
   ```bash
   npx @vibeaff/sdk --merchant-id YOUR_ID --api-key YOUR_KEY
   ```

2. **Add to your app:**
   ```jsx
   // pages/_app.js or app/layout.js
   import Script from 'next/script';
   
   export default function App({ Component, pageProps }) {
     return (
       <>
         <Script
           src="/vibeaff-tracking.js"
           data-api-url="https://api.vibeaff.com"
           data-merchant-id={process.env.NEXT_PUBLIC_VIBEAFF_MERCHANT_ID}
         />
         <Component {...pageProps} />
       </>
     );
   }
   ```

3. **Track conversions:**
   ```jsx
   // pages/checkout/confirmation.js
   import { useEffect } from 'react';
   
   export default function Confirmation({ order }) {
     useEffect(() => {
       if (typeof window !== 'undefined' && window.VibeAff) {
         window.VibeAff.trackConversion({
           orderId: order.id,
           orderTotal: order.total,
           currency: order.currency
         });
       }
     }, [order]);
     
     return <div>Order confirmed!</div>;
   }
   ```

### Express.js

1. **Run the init command:**
   ```bash
   npx @vibeaff/sdk --merchant-id YOUR_ID --api-key YOUR_KEY
   ```

2. **Use the middleware:**
   ```javascript
   const express = require('express');
   const { vibeaffMiddleware, trackConversion } = require('./vibeaff-middleware');
   
   const app = express();
   
   // Add middleware to capture tracking params
   app.use(vibeaffMiddleware);
   
   // Order confirmation route
   app.post('/api/orders/:orderId/confirm', async (req, res) => {
     const order = await getOrder(req.params.orderId);
     
     // Track conversion with attribution
     if (req.vibeaff) {
       await trackConversion({
         orderId: order.id,
         orderTotal: order.total,
         currency: order.currency,
         clickId: req.vibeaff.clickId,
         affiliateId: req.vibeaff.affiliateId,
         programId: req.vibeaff.programId
       });
     }
     
     res.json({ success: true });
   });
   ```

3. **The middleware:**
   - Captures `vclick`, `vaff`, `vprg` from URL parameters
   - Sets cookies for browser SDK
   - Adds `req.vibeaff` object with tracking data

### HTML/Static Sites

1. **Add the script tag:**
   ```html
   <head>
     <script 
       src="https://cdn.vibeaff.com/v1/browser.js" 
       data-api-url="https://api.vibeaff.com" 
       data-merchant-id="YOUR_MERCHANT_ID">
     </script>
   </head>
   ```

2. **Track conversions:**
   ```html
   <script>
     // On order confirmation page
     window.VibeAff.trackConversion({
       orderId: 'ORDER_123',
       orderTotal: 99.99,
       currency: 'USD'
     });
   </script>
   ```

## Tracking Parameters

Affiliate links should include these URL parameters:

- `vclick` - Click ID (unique identifier for the click)
- `vaff` - Affiliate ID (identifier for the affiliate)
- `vprg` - Program ID (identifier for the affiliate program)

Example:
```
https://yoursite.com/products/item?vclick=click_123&vaff=aff_456&vprg=prog_789
```

## Environment Variables

Create a `.env.vibeaff` file (or use your existing env system):

```env
VIBEAFF_MERCHANT_ID=your_merchant_id
VIBEAFF_API_KEY=your_api_key
VIBEAFF_API_URL=https://api.vibeaff.com
```

## Webhook Verification

```javascript
const express = require('express');
const { createVibeAffClient } = require('@vibeaff/sdk');

const app = express();

app.post('/webhooks/vibeaff', express.raw({ type: 'application/json' }), (req, res) => {
  const signature = req.headers['x-vibeaff-signature'];
  const secret = process.env.VIBEAFF_WEBHOOK_SECRET;
  
  const client = createVibeAffClient({ apiKey: 'dummy' }); // Key not needed for verify
  const isValid = client.verifyWebhook(req.body, signature, secret);
  
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const payload = JSON.parse(req.body);
  // Process webhook...
  
  res.json({ received: true });
});
```

## Error Handling

Both browser and Node.js SDKs throw errors that should be caught:

```javascript
// Browser
try {
  await window.VibeAff.trackConversion({ orderId: '123', orderTotal: 99.99 });
} catch (error) {
  console.error('Conversion tracking failed:', error);
}

// Node.js
try {
  await client.trackConversion({ orderId: '123', orderTotal: 99.99 });
} catch (error) {
  console.error('Conversion tracking failed:', error);
}
```

## Testing

After integration, test by visiting `/health` on your API endpoint to verify the setup is working correctly.

## License

MIT

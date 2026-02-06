#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

// Parse command line arguments
const args = process.argv.slice(2);
const argMap = {};
for (let i = 0; i < args.length; i += 2) {
  if (args[i] && args[i].startsWith("--")) {
    const key = args[i].slice(2);
    const value = args[i + 1];
    if (value && !value.startsWith("--")) {
      argMap[key] = value;
    }
  }
}

const merchantId = argMap["merchant-id"];
const apiKey = argMap["api-key"];

if (!merchantId || !apiKey) {
  console.error("❌ Error: Missing required arguments");
  console.log("\nUsage: npx @vibeaff/sdk --merchant-id <id> --api-key <key>");
  process.exit(1);
}

// Colors for terminal output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

function log(color, ...args) {
  console.log(`${colors[color]}${args.join(" ")}${colors.reset}`);
}

// Auto-detect framework
function detectFramework() {
  const cwd = process.cwd();
  
  // Check for Next.js
  if (fs.existsSync(path.join(cwd, "next.config.js")) ||
      fs.existsSync(path.join(cwd, "next.config.ts")) ||
      fs.existsSync(path.join(cwd, "next.config.mjs"))) {
    return "nextjs";
  }
  
  // Check for Nuxt
  if (fs.existsSync(path.join(cwd, "nuxt.config.js")) ||
      fs.existsSync(path.join(cwd, "nuxt.config.ts"))) {
    return "nuxt";
  }
  
  // Check package.json for Express/Node indicators
  const packageJsonPath = path.join(cwd, "package.json");
  if (fs.existsSync(packageJsonPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      const scripts = pkg.scripts || {};
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      if (deps.express || scripts.start?.includes("express") || scripts.dev?.includes("express")) {
        return "express";
      }
      
      if (deps.koa || scripts.start?.includes("koa")) {
        return "express"; // Treat Koa similar to Express
      }
    } catch (e) {
      // Ignore parse errors
    }
  }
  
  return "generic";
}

// Create .env.vibeaff file
function createEnvFile() {
  const envPath = path.join(process.cwd(), ".env.vibeaff");
  const content = `VIBEAFF_MERCHANT_ID=${merchantId}
VIBEAFF_API_KEY=${apiKey}
VIBEAFF_API_URL=https://api.vibeaff.com
`;
  
  if (fs.existsSync(envPath)) {
    log("yellow", `⚠️  .env.vibeaff already exists. Skipping.`);
  } else {
    fs.writeFileSync(envPath, content, "utf8");
    log("green", `✅ Created .env.vibeaff`);
  }
}

// Create Next.js integration
function createNextJsIntegration() {
  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  
  const trackingFile = path.join(publicDir, "vibeaff-tracking.js");
  const content = `<!-- VibeAff Tracking Script -->
<script src="/vibeaff-tracking.js" data-api-url="https://api.vibeaff.com" data-merchant-id="${merchantId}"></script>
`;
  
  // Create a placeholder file that will be replaced with actual browser SDK
  const browserSDKPath = path.join(__dirname, "..", "dist", "browser.js");
  if (fs.existsSync(browserSDKPath)) {
    fs.copyFileSync(browserSDKPath, trackingFile);
    log("green", `✅ Created public/vibeaff-tracking.js`);
  } else {
    log("yellow", `⚠️  Browser SDK not found. Please copy dist/browser.js to public/vibeaff-tracking.js`);
  }
  
  // Create instructions file
  const instructionsPath = path.join(process.cwd(), "VIBEAFF_SETUP.md");
  const instructions = `# VibeAff Next.js Integration

## Setup Complete! 🎉

### Next Steps:

1. **Add the tracking script to your app:**
   Add this to your \`pages/_app.js\` or \`app/layout.js\`:
   
   \`\`\`jsx
   import Script from 'next/script';
   
   export default function App({ Component, pageProps }) {
     return (
       <>
         <Script
           src="/vibeaff-tracking.js"
           data-api-url="https://api.vibeaff.com"
           data-merchant-id="${merchantId}"
         />
         <Component {...pageProps} />
       </>
     );
   }
   \`\`\`

2. **Track conversions:**
   In your checkout/order confirmation page:
   
   \`\`\`jsx
   import { useEffect } from 'react';
   
   useEffect(() => {
     if (typeof window !== 'undefined' && window.VibeAff) {
       window.VibeAff.trackConversion({
         orderId: order.id,
         orderTotal: order.total,
         currency: 'USD'
       });
     }
   }, [order]);
   \`\`\`

3. **Test the integration:**
   Visit: \`/health\` on your API to verify setup.
`;
  
  fs.writeFileSync(instructionsPath, instructions, "utf8");
  log("green", `✅ Created VIBEAFF_SETUP.md with instructions`);
}

// Create Express/Node integration
function createExpressIntegration() {
  const middlewareFile = path.join(process.cwd(), "vibeaff-middleware.js");
  const content = `const { createVibeAffClient, getTrackingParams } = require('@vibeaff/sdk');
const crypto = require('crypto');

// Load environment variables
require('dotenv').config({ path: '.env.vibeaff' });

const client = createVibeAffClient({
  apiUrl: process.env.VIBEAFF_API_URL || 'https://api.vibeaff.com',
  apiKey: process.env.VIBEAFF_API_KEY
});

/**
 * Express middleware to capture affiliate tracking parameters
 * Adds tracking params to req.vibeaff for use in your routes
 */
function vibeaffMiddleware(req, res, next) {
  const tracking = getTrackingParams(req.url);
  
  if (tracking.clickId || tracking.affiliateId || tracking.programId) {
    req.vibeaff = tracking;
    
    // Set cookies for browser SDK
    if (tracking.clickId) {
      res.cookie('vibeaff_click', tracking.clickId, { 
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        httpOnly: false // Allow browser SDK to read
      });
    }
    if (tracking.affiliateId) {
      res.cookie('vibeaff_affiliate', tracking.affiliateId, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: false
      });
    }
    if (tracking.programId) {
      res.cookie('vibeaff_program', tracking.programId, {
        maxAge: 30 * 24 * 60 * 60 * 1000,
        httpOnly: false
      });
    }
  }
  
  next();
}

/**
 * Track a conversion server-side
 */
async function trackConversion({ orderId, orderTotal, currency, clickId, affiliateId, programId }) {
  try {
    await client.trackConversion({
      programId: programId || null,
      affiliateId: affiliateId || null,
      orderId,
      orderTotal,
      currency: currency || 'USD'
    });
  } catch (error) {
    console.error('VibeAff conversion tracking error:', error);
    throw error;
  }
}

module.exports = {
  vibeaffMiddleware,
  trackConversion,
  client
};
`;
  
  fs.writeFileSync(middlewareFile, content, "utf8");
  log("green", `✅ Created vibeaff-middleware.js`);
  
  // Create usage example
  const exampleFile = path.join(process.cwd(), "vibeaff-example.js");
  const example = `// Example Express.js usage
const express = require('express');
const { vibeaffMiddleware, trackConversion } = require('./vibeaff-middleware');

const app = express();

// Add middleware to capture tracking params
app.use(vibeaffMiddleware);

// Example: Order confirmation route
app.post('/api/orders/:orderId/confirm', async (req, res) => {
  const { orderId } = req.params;
  const order = await getOrder(orderId);
  
  // Track conversion with attribution from req.vibeaff
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

app.listen(3000);
`;
  
  fs.writeFileSync(exampleFile, example, "utf8");
  log("green", `✅ Created vibeaff-example.js`);
}

// Create generic HTML integration
function createGenericIntegration() {
  const scriptTag = `<script src="https://cdn.vibeaff.com/v1/browser.js" data-api-url="https://api.vibeaff.com" data-merchant-id="${merchantId}"></script>`;
  
  const instructionsFile = path.join(process.cwd(), "VIBEAFF_SETUP.md");
  const instructions = `# VibeAff Integration

## Setup Complete! 🎉

### Add to your HTML:

Add this script tag to your \`<head>\` section:

\`\`\`html
${scriptTag}
\`\`\`

### Track Conversions:

In your checkout/order confirmation page, add:

\`\`\`html
<script>
  window.VibeAff.trackConversion({
    orderId: 'ORDER_123',
    orderTotal: 99.99,
    currency: 'USD'
  });
</script>
\`\`\`

### Test:

Visit: \`/health\` on your API to verify setup.
`;
  
  fs.writeFileSync(instructionsFile, instructions, "utf8");
  log("green", `✅ Created VIBEAFF_SETUP.md with integration instructions`);
  log("cyan", `\n📋 Script tag to add to your HTML:\n${scriptTag}\n`);
}

// Main execution
log("bright", "\n🚀 VibeAff SDK Initialization\n");

createEnvFile();

const framework = detectFramework();
log("cyan", `🔍 Detected framework: ${framework.toUpperCase()}\n`);

switch (framework) {
  case "nextjs":
    createNextJsIntegration();
    break;
  case "express":
    createExpressIntegration();
    break;
  case "nuxt":
    log("yellow", "⚠️  Nuxt.js detected. Please refer to VIBEAFF_SETUP.md for manual integration.");
    createGenericIntegration();
    break;
  default:
    createGenericIntegration();
}

// Print colorful summary
log("bright", "\n" + "=".repeat(50));
log("green", "✅ Integration Complete!");
log("bright", "=".repeat(50));
log("cyan", "\n📦 What was set up:");
log("reset", "   • .env.vibeaff file with your credentials");
if (framework === "nextjs") {
  log("reset", "   • public/vibeaff-tracking.js browser SDK");
  log("reset", "   • VIBEAFF_SETUP.md with Next.js instructions");
} else if (framework === "express") {
  log("reset", "   • vibeaff-middleware.js Express middleware");
  log("reset", "   • vibeaff-example.js usage example");
} else {
  log("reset", "   • VIBEAFF_SETUP.md with integration instructions");
}
log("cyan", "\n🧪 Test your integration:");
log("yellow", "   Visit /health on your API to verify setup.");
log("cyan", "\n📚 Next steps:");
log("reset", "   1. Review the setup files created");
log("reset", "   2. Add the tracking code to your app");
log("reset", "   3. Test with a conversion event");
log("reset", "\n");
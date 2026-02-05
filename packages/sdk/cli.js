#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const argMap = args.reduce((acc, arg, index) => {
  if (arg.startsWith("--")) {
    acc[arg.slice(2)] = args[index + 1];
  }
  return acc;
}, {});

const merchantId = argMap["merchant-id"];
const apiKey = argMap["api-key"];

if (!merchantId || !apiKey) {
  console.log("Usage: vibeaff-init --merchant-id <id> --api-key <key>");
  process.exit(1);
}

const targetPath = path.join(process.cwd(), ".env.vibeaff");
const content = `VIBEAFF_MERCHANT_ID=${merchantId}\nVIBEAFF_API_KEY=${apiKey}\nVIBEAFF_API_URL=https://api.vibeaff.com\n`;

if (!fs.existsSync(targetPath)) {
  fs.writeFileSync(targetPath, content, "utf8");
  console.log(`Created ${targetPath}`);
} else {
  console.log(`${targetPath} already exists. Skipping.`);
}

console.log("Next steps:");
console.log("- Add the VibeAff client SDK to your app.");
console.log("- Send signed conversion events to /v1/conversions.");
console.log("- Configure your webhooks in the VibeAff dashboard.");

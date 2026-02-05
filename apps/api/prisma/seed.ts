import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create demo admin user
  const passwordHash = await bcrypt.hash("admin", 10);
  await prisma.user.upsert({
    where: { email: "admin@vibeaff.com" },
    update: {
      passwordHash,
      role: "admin",
    },
    create: {
      email: "admin@vibeaff.com",
      passwordHash,
      role: "admin",
    },
  });

  const channelData = [
    { name: "Google Ads", category: "Search", status: "connected", provider: "google" },
    { name: "Meta Ads", category: "Social", status: "connected", provider: "meta" },
    { name: "Microsoft Ads", category: "Search", status: "ready", provider: "microsoft" },
    { name: "PropellerAds", category: "Push / Pop", status: "ready", provider: "propellerads" },
    { name: "Unity Ads", category: "In-game / Apps", status: "planned", provider: "unity" },
    { name: "Taboola", category: "Native", status: "planned", provider: "taboola" },
  ];

  const toolData = [
    { name: "Copy Studio", type: "text", status: "ready" },
    { name: "Visual Studio", type: "visual", status: "planned" },
    { name: "Landing Builder", type: "web", status: "planned" },
    { name: "Translation Engine", type: "translation", status: "ready" },
  ];

  for (const channel of channelData) {
    await prisma.channel.upsert({
      where: { name: channel.name },
      update: channel,
      create: channel,
    });
  }

  for (const tool of toolData) {
    await prisma.creativeTool.upsert({
      where: { name: tool.name },
      update: tool,
      create: tool,
    });
  }
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

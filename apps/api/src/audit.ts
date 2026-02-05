import { PrismaClient } from "@prisma/client";

export async function logAudit(
  prisma: PrismaClient,
  params: {
    userId?: string;
    action: string;
    entity: string;
    entityId?: string;
    details?: string;
    ipAddress?: string;
  }
) {
  await prisma.auditLog.create({ data: params });
}

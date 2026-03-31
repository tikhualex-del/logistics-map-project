import { prisma } from "@/lib/prisma";

type WriteAuditLogInput = {
  companyId: string;
  actorUserId: string;
  targetUserId?: string | null;
  targetMembershipId?: string | null;
  action: string;
  meta?: Record<string, unknown> | null;
};

export async function writeAuditLog(input: WriteAuditLogInput) {
  const {
    companyId,
    actorUserId,
    targetUserId,
    targetMembershipId,
    action,
    meta,
  } = input;

  return prisma.auditLog.create({
    data: {
      companyId,
      actorUserId,
      targetUserId: targetUserId ?? null,
      targetMembershipId: targetMembershipId ?? null,
      action,
      metaJson: meta ? JSON.stringify(meta) : null,
    },
  });
}
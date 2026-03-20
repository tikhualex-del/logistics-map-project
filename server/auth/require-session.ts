import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCurrentSessionWithCompany } from "@/server/auth/auth.service";

export type AuthContext = {
  sessionId: string;
  userId: string;
  companyId: string;
  role: string;
  expiresAt: Date;
};

export async function requireSession(): Promise<AuthContext> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) {
    throw new Error("Not authenticated");
  }

  const session = await getCurrentSessionWithCompany(sessionToken);

  // получаем роль пользователя в компании
  const membership = await prisma.membership.findFirst({
    where: {
      userId: session.userId,
      companyId: session.companyId,
      isActive: true,
    },
  });

  if (!membership) {
    throw new Error("User has no active membership in this company");
  }

  return {
    sessionId: session.id,
    userId: session.userId,
    companyId: session.companyId,
    role: membership.role,
    expiresAt: session.expiresAt,
  };
}
import type { AuthContext } from "@/server/auth/require-session";

const rolePriority: Record<string, number> = {
  viewer: 1,
  dispatcher: 2,
  admin: 3,
  owner: 4,
};

export function requireMinRole(
  session: AuthContext,
  minRole: "viewer" | "dispatcher" | "admin" | "owner"
) {
  const currentRole = String(session.role || "").toLowerCase();
  const currentPriority = rolePriority[currentRole] || 0;
  const requiredPriority = rolePriority[minRole];

  if (currentPriority < requiredPriority) {
    throw new Error("Forbidden");
  }
}
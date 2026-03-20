import { cookies } from "next/headers";
import { getCurrentSessionWithCompany } from "./auth.service";

export async function requireAuth() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) {
    throw new Error("UNAUTHORIZED");
  }

  try {
    const session = await getCurrentSessionWithCompany(sessionToken);
    return session;
  } catch {
    throw new Error("UNAUTHORIZED");
  }
}
import Link from "next/link";
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUserBySessionToken } from "@/server/auth/auth.service";
import { isAdminEmail } from "@/server/admin/admin-access";
import AdminTopBar from "@/components/admin/AdminTopBar";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;

  if (!sessionToken) {
    redirect("/login?next=/admin");
  }

  try {
    const current = await getCurrentUserBySessionToken(sessionToken);

    if (!isAdminEmail(current.user.email)) {
      redirect("/settings");
    }
  } catch {
    redirect("/login?next=/admin");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#eef2f8",
      }}
    >
      <AdminTopBar />

      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "20px",
          boxSizing: "border-box",
        }}
      >
        {children}
      </div>
    </div>
  );
}
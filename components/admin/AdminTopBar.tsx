"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const adminNavItems = [
  { href: "/admin", label: "Обзор" },
  { href: "/admin/companies", label: "Компании" },
  { href: "/admin/users", label: "Пользователи" },
  { href: "/admin/integrations", label: "Интеграции" },
];

export default function AdminTopBar() {
  const pathname = usePathname();
  const router = useRouter();

  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutError, setLogoutError] = useState("");

  async function handleLogout() {
    try {
      setLogoutLoading(true);
      setLogoutError("");

      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      const result = await response.json().catch(() => null);

      if (!response.ok || !result?.success) {
        setLogoutError(result?.message || "Не удалось выйти из аккаунта");
        return;
      }

      router.push("/login");
      router.refresh();
    } catch {
      setLogoutError("Ошибка сети или сервера при выходе");
    } finally {
      setLogoutLoading(false);
    }
  }

  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 20,
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(10px)",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "16px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 800,
              color: "#4338ca",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Internal Admin
          </div>

          <div
            style={{
              fontSize: "20px",
              fontWeight: 900,
              color: "#111827",
              lineHeight: 1.2,
            }}
          >
            SaaS Control Panel
          </div>
        </div>

        <nav
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
          }}
        >
          {adminNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  height: "40px",
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "0 14px",
                  borderRadius: "12px",
                  textDecoration: "none",
                  fontSize: "14px",
                  fontWeight: 800,
                  border: isActive ? "none" : "1px solid #d1d5db",
                  background: isActive ? "#4338ca" : "#ffffff",
                  color: isActive ? "#ffffff" : "#111827",
                }}
              >
                {item.label}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={handleLogout}
            disabled={logoutLoading}
            style={{
              height: "40px",
              padding: "0 14px",
              borderRadius: "12px",
              border: "1px solid #fecaca",
              background: "#fef2f2",
              color: "#b91c1c",
              fontSize: "14px",
              fontWeight: 800,
              cursor: logoutLoading ? "not-allowed" : "pointer",
            }}
          >
            {logoutLoading ? "Выход..." : "Выйти"}
          </button>
        </nav>
      </div>

      {logoutError ? (
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "0 20px 14px",
          }}
        >
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              borderRadius: "12px",
              padding: "10px 12px",
              fontSize: "14px",
              lineHeight: 1.5,
            }}
          >
            {logoutError}
          </div>
        </div>
      ) : null}
    </header>
  );
}
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";

type ProtectedLayoutProps = {
  children: ReactNode;
};

const navItems = [
  { href: "/settings", label: "Launch" },
  { href: "/settings/integrations", label: "Интеграции" },
  { href: "/settings/orders", label: "Заказы" },
  { href: "/map", label: "Карта" },
];

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const pathname = usePathname();
  const isMapPage = pathname === "/map";
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
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f4f6",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "14px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#2563eb",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              Logistics SaaS
            </div>

            <div
              style={{
                fontSize: "18px",
                fontWeight: 800,
                color: "#111827",
                lineHeight: 1.2,
              }}
            >
              Client Workspace
            </div>
          </div>

          <nav
            style={{
              display: "flex",
              gap: "8px",
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/settings" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    height: "38px",
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "0 14px",
                    borderRadius: "10px",
                    textDecoration: "none",
                    fontSize: "14px",
                    fontWeight: 700,
                    border: isActive ? "none" : "1px solid #d1d5db",
                    background: isActive ? "#2563eb" : "#ffffff",
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
                height: "38px",
                padding: "0 14px",
                borderRadius: "10px",
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#b91c1c",
                fontSize: "14px",
                fontWeight: 700,
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
              padding: "0 16px 12px",
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

      {isMapPage ? (
        <div
          style={{
            width: "100%",
          }}
        >
          {children}
        </div>
      ) : (
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "20px 16px 32px",
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
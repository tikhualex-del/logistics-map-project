"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import TopBar from "./TopBar";

const sidebarItems = [
  { id: "couriers", label: "Курьеры", icon: "👤", href: "/couriers" },
  { id: "analytics", label: "Аналитика", icon: "📦", href: "/analytics" },
  { id: "settings", label: "Настройки", icon: "⚙️", href: "/settings" },
];

type AppShellProps = {
  children: React.ReactNode;
};

const publicRoutes = new Set(["/", "/login", "/register"]);

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  const isPublicRoute = publicRoutes.has(pathname);
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const deliveryDate = searchParams.get("deliveryDate");

  function buildHref(baseHref: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (deliveryDate) {
      params.set("deliveryDate", deliveryDate);
    } else {
      params.delete("deliveryDate");
    }

    const query = params.toString();
    return query ? `${baseHref}?${query}` : baseHref;
  }

  if (isPublicRoute || isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <aside
        onMouseEnter={() => setIsSidebarHovered(true)}
        onMouseLeave={() => setIsSidebarHovered(false)}
        style={{
          position: "fixed",
          top: "68px",
          left: "16px",
          bottom: "16px",
          width: isSidebarHovered ? "168px" : "64px",
          minWidth: isSidebarHovered ? "168px" : "64px",
          transition: "width 0.22s ease, min-width 0.22s ease",
          background: "rgba(255,255,255,0.88)",
          border: "1px solid rgba(229,231,235,0.9)",
          borderRadius: "16px",
          boxShadow: "0 10px 28px rgba(15,23,42,0.10)",
          backdropFilter: "blur(10px)",
          color: "#111827",
          display: "flex",
          flexDirection: "column",
          padding: "12px 10px",
          boxSizing: "border-box",
          overflow: "hidden",
          zIndex: 100,
        }}
      >
        <div
          style={{
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "999px",
              background: "#22c55e",
              boxShadow: "0 0 0 4px rgba(34,197,94,0.12)",
            }}
          />
        </div>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            marginTop: "8px",
          }}
        >
          {sidebarItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.id}
                href={buildHref(item.href)}
                style={{
                  width: "100%",
                  height: "46px",
                  borderRadius: "12px",
                  background: isActive ? "#dbeafe" : "transparent",
                  color: isActive ? "#2563eb" : "#4b5563",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "0 10px",
                  cursor: "pointer",
                  textAlign: "left",
                  textDecoration: "none",
                  transition: "background 0.18s ease, color 0.18s ease",
                  boxSizing: "border-box",
                }}
              >
                <span
                  style={{
                    width: "24px",
                    minWidth: "24px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                  }}
                >
                  {item.icon}
                </span>

                <span
                  style={{
                    opacity: isSidebarHovered ? 1 : 0,
                    transform: isSidebarHovered
                      ? "translateX(0)"
                      : "translateX(-8px)",
                    transition: "opacity 0.18s ease, transform 0.18s ease",
                    whiteSpace: "nowrap",
                    pointerEvents: isSidebarHovered ? "auto" : "none",
                    fontSize: "13px",
                    fontWeight: isActive ? 700 : 600,
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        <div
          style={{
            borderTop: "1px solid rgba(229,231,235,0.9)",
            paddingTop: "12px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            minHeight: "44px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              minWidth: "32px",
              borderRadius: "10px",
              background: "#f3f4f6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
            }}
          >
            👤
          </div>

          <div
            style={{
              opacity: isSidebarHovered ? 1 : 0,
              transform: isSidebarHovered ? "translateX(0)" : "translateX(-8px)",
              transition: "opacity 0.18s ease, transform 0.18s ease",
              whiteSpace: "nowrap",
              pointerEvents: isSidebarHovered ? "auto" : "none",
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: 700 }}>Dispatcher</div>
            <div style={{ fontSize: "11px", color: "#6b7280" }}>Online</div>
          </div>
        </div>
      </aside>

      <TopBar />

      {children}
    </>
  );
}
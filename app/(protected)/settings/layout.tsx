"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

type SettingsLayoutProps = {
  children: ReactNode;
};

const navItems = [
  { href: "/settings", label: "Общее" },
  { href: "/settings/warehouses", label: "Склады" },
  { href: "/settings/integrations", label: "Интеграции" },
  { href: "/settings/mappings", label: "Mappings" },
  { href: "/settings/orders", label: "Заказы" },
];

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        paddingTop: "96px",
        paddingLeft: "96px",
        paddingRight: "24px",
        paddingBottom: "24px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "240px minmax(0, 1fr)",
          gap: "20px",
          alignItems: "start",
        }}
      >
        <aside
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "18px",
            boxShadow: "0 10px 24px rgba(15,23,42,0.06)",
            position: "sticky",
            top: "96px",
            alignSelf: "start",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: 800,
              color: "#111827",
              marginBottom: "14px",
            }}
          >
            Settings
          </div>

          <nav
            style={{
              display: "grid",
              gap: "8px",
            }}
          >
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    minHeight: "40px",
                    padding: "0 14px",
                    borderRadius: "12px",
                    textDecoration: "none",
                    fontSize: "14px",
                    fontWeight: 700,
                    background: isActive ? "#2563eb" : "#f3f4f6",
                    color: isActive ? "#ffffff" : "#374151",
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <section
          style={{
            minWidth: 0,
            display: "grid",
            gap: "20px",
          }}
        >
          {children}
        </section>
      </div>
    </div>
  );
}
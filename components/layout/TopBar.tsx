"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 5a4 4 0 0 0-4 4v1.4c0 .9-.3 1.8-.8 2.5l-1 1.4c-.5.8 0 1.7 1 1.7h9.6c1 0 1.5-.9 1-1.7l-1-1.4a4.4 4.4 0 0 1-.8-2.5V9a4 4 0 0 0-4-4Z"
        stroke="#4b5563"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M10 18a2 2 0 0 0 4 0"
        stroke="#4b5563"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TopBarContent() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const deliveryDate = searchParams.get("deliveryDate") || "";
  const [logoutLoading, setLogoutLoading] = useState(false);

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

  function handleDeliveryDateChange(nextDate: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextDate) {
      params.set("deliveryDate", nextDate);
    } else {
      params.delete("deliveryDate");
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  async function handleLogout() {
    try {
      setLogoutLoading(true);

      const res = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        alert("Не удалось выйти из системы");
        return;
      }

      router.replace("/login");
    } catch {
      alert("Ошибка при выходе из системы");
    } finally {
      setLogoutLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        top: "12px",
        left: "88px",
        right: "16px",
        zIndex: 90,
        pointerEvents: "auto",
      }}
    >
      <div
        style={{
          background: "rgba(255,255,255,0.94)",
          border: "1px solid rgba(229,231,235,0.9)",
          borderRadius: "16px",
          boxShadow: "0 10px 28px rgba(15,23,42,0.10)",
          backdropFilter: "blur(10px)",
          padding: "10px 14px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            minWidth: 0,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: 800,
              color: "#111827",
              lineHeight: 1.1,
              whiteSpace: "nowrap",
            }}
          >
            Логистический центр
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Link
              href={buildHref("/map")}
              style={{
                height: "34px",
                padding: "0 14px",
                borderRadius: "10px",
                border:
                  pathname === "/map"
                    ? "1px solid #bfdbfe"
                    : "1px solid transparent",
                background: pathname === "/map" ? "#eff6ff" : "transparent",
                color: pathname === "/map" ? "#2563eb" : "#4b5563",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
              }}
            >
              Карта
            </Link>

            <Link
              href={buildHref("/routes")}
              style={{
                height: "34px",
                padding: "0 14px",
                borderRadius: "10px",
                border:
                  pathname === "/routes"
                    ? "1px solid #bfdbfe"
                    : "1px solid transparent",
                background: pathname === "/routes" ? "#eff6ff" : "transparent",
                color: pathname === "/routes" ? "#2563eb" : "#4b5563",
                fontSize: "13px",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
              }}
            >
              Маршруты
            </Link>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "12px",
            minWidth: 0,
            flex: 1,
          }}
        >
          <div
            style={{
              width: "1px",
              height: "32px",
              background: "#dbe3f0",
              borderRadius: "999px",
              flexShrink: 0,
            }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button
              type="button"
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="Уведомления"
            >
              <BellIcon />
            </button>

            <div
              style={{
                position: "relative",
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                border: deliveryDate
                  ? "1px solid #bfdbfe"
                  : "1px solid #e5e7eb",
                background: deliveryDate ? "#eff6ff" : "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
              title={deliveryDate ? `Дата: ${deliveryDate}` : "Выбрать дату"}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
                style={{ pointerEvents: "none" }}
              >
                <rect
                  x="4"
                  y="5"
                  width="16"
                  height="15"
                  rx="2.5"
                  stroke="#4b5563"
                  strokeWidth="2"
                />
                <path
                  d="M8 3v4M16 3v4M4 9h16"
                  stroke="#4b5563"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>

              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => {
                  handleDeliveryDateChange(e.target.value);
                }}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  cursor: "pointer",
                }}
                aria-label="Выбрать дату"
              />
            </div>

            <button
              type="button"
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                padding: 0,
              }}
              title="Пользователь"
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                }}
              >
                👤
              </div>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutLoading}
              style={{
                height: "34px",
                minWidth: "96px",
                borderRadius: "10px",
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                color: "#111827",
                fontSize: "13px",
                fontWeight: 700,
                cursor: logoutLoading ? "not-allowed" : "pointer",
                padding: "0 14px",
                opacity: logoutLoading ? 0.7 : 1,
              }}
            >
              {logoutLoading ? "Выходим..." : "Выйти"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TopBar() {
  return (
    <Suspense fallback={null}>
      <TopBarContent />
    </Suspense>
  );
}
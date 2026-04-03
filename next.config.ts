import type { NextConfig } from "next";

// Защита: NODE_TLS_REJECT_UNAUTHORIZED=0 разрешён только в локальной разработке.
// Это нужно для GigaChat (Sberbank использует нестандартный SSL).
// В production это отключает проверку SSL у ВСЕХ исходящих запросов — критическая уязвимость.
if (
  process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0" &&
  process.env.NODE_ENV === "production"
) {
  throw new Error(
    "[SECURITY] NODE_TLS_REJECT_UNAUTHORIZED=0 запрещён в production. " +
    "Удали эту переменную из prod окружения."
  );
}

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
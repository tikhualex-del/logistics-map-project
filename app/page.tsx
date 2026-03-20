import Link from "next/link";

export default function LandingPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, rgba(246,185,129,0.20) 0%, rgba(201,235,214,0.24) 100%)",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "960px",
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: "24px",
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.92)",
            border: "1px solid #e5e7eb",
            borderRadius: "28px",
            padding: "40px",
            boxShadow: "0 24px 60px rgba(15,23,42,0.10)",
            backdropFilter: "blur(8px)",
            display: "grid",
            gap: "18px",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "fit-content",
              height: "32px",
              padding: "0 12px",
              borderRadius: "999px",
              background: "#dbeafe",
              color: "#1d4ed8",
              fontSize: "12px",
              fontWeight: 800,
            }}
          >
            Logistics SaaS
          </div>

          <div
            style={{
              fontSize: "44px",
              lineHeight: 1.05,
              fontWeight: 900,
              color: "#111827",
              maxWidth: "560px",
            }}
          >
            Управление доставкой и маршрутами в одном кабинете
          </div>

          <div
            style={{
              fontSize: "17px",
              lineHeight: 1.6,
              color: "#4b5563",
              maxWidth: "620px",
            }}
          >
            Подключайте свою CRM, загружайте заказы, работайте с картой,
            стройте маршруты и используйте AI-помощника для планирования
            last-mile доставки.
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "12px",
              marginTop: "6px",
            }}
          >
            <Link
              href="/register"
              style={{
                height: "48px",
                padding: "0 20px",
                borderRadius: "14px",
                background: "#0f4bb8",
                color: "#ffffff",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "15px",
                fontWeight: 800,
              }}
            >
              Зарегистрироваться
            </Link>

            <Link
              href="/login"
              style={{
                height: "48px",
                padding: "0 20px",
                borderRadius: "14px",
                background: "#ffffff",
                color: "#111827",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "15px",
                fontWeight: 800,
                border: "1px solid #d1d5db",
              }}
            >
              Войти
            </Link>
          </div>
        </div>

        <div
          style={{
            background: "rgba(17,24,39,0.92)",
            borderRadius: "28px",
            padding: "32px",
            color: "#ffffff",
            boxShadow: "0 24px 60px rgba(15,23,42,0.12)",
            display: "grid",
            gap: "18px",
            alignContent: "start",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: 800,
              color: "#93c5fd",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Что внутри
          </div>

          <div
            style={{
              display: "grid",
              gap: "14px",
            }}
          >
            {[
              "Карта заказов и контроль доставок по дате",
              "Маршруты, курьеры и подготовка рейсов",
              "Интеграции с внешними системами и mapping",
              "AI-помощник для диспетчера и планирования",
            ].map((item) => (
              <div
                key={item}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "16px",
                  padding: "14px 16px",
                  fontSize: "15px",
                  lineHeight: 1.45,
                  color: "#e5e7eb",
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
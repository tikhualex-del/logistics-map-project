export default function AdminPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f4f6fb",
        padding: "32px 24px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          display: "grid",
          gap: "24px",
        }}
      >
        <section
          style={{
            background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
            borderRadius: "28px",
            padding: "32px",
            color: "#ffffff",
            boxShadow: "0 24px 60px rgba(15,23,42,0.12)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: "28px",
              padding: "0 12px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.14)",
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Internal Admin
          </div>

          <h1
            style={{
              margin: "18px 0 12px",
              fontSize: "40px",
              lineHeight: 1.05,
              fontWeight: 900,
            }}
          >
            SaaS Control Panel
          </h1>

          <p
            style={{
              margin: 0,
              maxWidth: "760px",
              color: "rgba(255,255,255,0.82)",
              fontSize: "17px",
              lineHeight: 1.7,
            }}
          >
            Внутренняя панель управления платформой для контроля компаний,
            пользователей, интеграций и операционных процессов.
          </p>
        </section>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "18px",
          }}
        >
          {[
            { title: "Компании", value: "—", hint: "Список tenant-компаний" },
            { title: "Пользователи", value: "—", hint: "Owner и staff аккаунты" },
            { title: "Интеграции", value: "—", hint: "Подключения и статусы" },
            { title: "Ошибки", value: "—", hint: "Сбои импорта и синхронизации" },
          ].map((item) => (
            <div
              key={item.title}
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "22px",
                padding: "22px",
                boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#6b7280",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {item.title}
              </div>

              <div
                style={{
                  marginTop: "12px",
                  fontSize: "34px",
                  lineHeight: 1,
                  fontWeight: 900,
                  color: "#111827",
                }}
              >
                {item.value}
              </div>

              <div
                style={{
                  marginTop: "10px",
                  fontSize: "14px",
                  lineHeight: 1.5,
                  color: "#6b7280",
                }}
              >
                {item.hint}
              </div>
            </div>
          ))}
        </section>

        <section
          style={{
            background: "#ffffff",
            border: "1px solid #e5e7eb",
            borderRadius: "24px",
            padding: "24px",
            boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "24px",
              lineHeight: 1.2,
              fontWeight: 800,
              color: "#111827",
            }}
          >
            Следующие разделы
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: "16px",
              marginTop: "20px",
            }}
          >
            {[
              "Компании",
              "Пользователи",
              "Интеграции",
              "Cron / Import Jobs",
              "Системные ошибки",
              "Support Actions",
            ].map((item) => (
              <div
                key={item}
                style={{
                  borderRadius: "16px",
                  background: "#f8fafc",
                  border: "1px solid #e5e7eb",
                  padding: "16px 18px",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#1f2937",
                }}
              >
                {item}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
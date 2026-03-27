import Link from "next/link";

const featureCards = [
  {
    title: "Быстрое подключение CRM",
    description:
      "Подключайте источник заказов и начинайте работу без сложного ручного ввода.",
    icon: "✦",
  },
  {
    title: "Визуализация заказов",
    description:
      "Все точки доставки на одной карте с понятным отображением статусов и адресов.",
    icon: "◉",
  },
  {
    title: "Умная маршрутизация",
    description:
      "Планируйте маршруты с учетом логики доставки, нагрузки и ежедневной работы команды.",
    icon: "↗",
  },
  {
    title: "Контроль курьеров",
    description:
      "Следите за процессом доставки и управляйте операционной работой в одном кабинете.",
    icon: "⌁",
  },
];

const steps = [
  "Подключите CRM",
  "Импортируйте заказы",
  "Определите координаты",
  "Постройте маршруты",
  "Управляйте доставкой",
];

const heroFeatures = [
  "Карта заказов и контроль доставок по дате",
  "Маршруты, курьеры и подготовка рейсов",
  "Интеграции с внешними системами и mapping",
  "AI-помощник для диспетчера и планирования",
];

export default function LandingPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        color: "#0f172a",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "24px 24px 56px",
          boxSizing: "border-box",
        }}
      >
        <header
          style={{
            height: "72px",
            borderRadius: "20px",
            background: "rgba(255,255,255,0.92)",
            border: "1px solid #e5e7eb",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            boxSizing: "border-box",
            boxShadow: "0 12px 30px rgba(15,23,42,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "28px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                fontSize: "20px",
                fontWeight: 800,
                color: "#111827",
                whiteSpace: "nowrap",
              }}
            >
              Логистический центр
            </div>

            <nav
              style={{
                display: "flex",
                alignItems: "center",
                gap: "18px",
                flexWrap: "wrap",
              }}
            >
              {["Карта", "Маршруты", "Возможности", "Цены"].map((item) => (
                <span
                  key={item}
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#4b5563",
                  }}
                >
                  {item}
                </span>
              ))}
            </nav>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <Link
              href="/login"
              style={{
                textDecoration: "none",
                color: "#111827",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              Войти
            </Link>

            <Link
              href="/register"
              style={{
                height: "42px",
                padding: "0 18px",
                borderRadius: "14px",
                background: "#4338ca",
                color: "#ffffff",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: 800,
                boxShadow: "0 10px 24px rgba(67,56,202,0.28)",
              }}
            >
              Начать
            </Link>
          </div>
        </header>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.15fr 0.85fr",
            gap: "28px",
            alignItems: "start",
            marginTop: "32px",
          }}
        >
          <div style={{ paddingTop: "24px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "#374151",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "999px",
                  background: "#111827",
                  display: "inline-block",
                }}
              />
              Logistics SaaS
            </div>

            <h1
              style={{
                margin: "24px 0 18px",
                fontSize: "72px",
                lineHeight: 0.98,
                fontWeight: 900,
                letterSpacing: "-0.04em",
                maxWidth: "720px",
              }}
            >
              Управление
              <br />
              доставкой и
              <br />
              маршрутами в{" "}
              <span style={{ color: "#4338ca" }}>одном кабинете</span>
            </h1>

            <p
              style={{
                margin: 0,
                maxWidth: "600px",
                fontSize: "20px",
                lineHeight: 1.7,
                color: "#6b7280",
              }}
            >
              Подключайте свою CRM, загружайте заказы, работайте с
              картой, стройте маршруты и используйте AI для планирования
              last-mile доставки.
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "14px",
                marginTop: "28px",
              }}
            >
              <Link
                href="/register"
                style={{
                  height: "52px",
                  padding: "0 24px",
                  borderRadius: "16px",
                  background: "#4338ca",
                  color: "#ffffff",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "15px",
                  fontWeight: 800,
                  boxShadow: "0 12px 28px rgba(67,56,202,0.28)",
                }}
              >
                Зарегистрироваться
              </Link>

              <Link
                href="/login"
                style={{
                  height: "52px",
                  padding: "0 24px",
                  borderRadius: "16px",
                  background: "#eef2ff",
                  color: "#111827",
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "15px",
                  fontWeight: 800,
                  border: "1px solid #dbe3f0",
                }}
              >
                Войти в систему
              </Link>
            </div>
          </div>

          <div
            style={{
              paddingTop: "42px",
              display: "grid",
              gap: "14px",
            }}
          >
            {heroFeatures.map((item, index) => (
              <div
                key={item}
                style={{
                  background: index === heroFeatures.length - 1 ? "#4338ca" : "#ffffff",
                  color: index === heroFeatures.length - 1 ? "#ffffff" : "#111827",
                  border: index === heroFeatures.length - 1 ? "none" : "1px solid #eef2f7",
                  borderRadius: "18px",
                  minHeight: "72px",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "0 18px",
                  boxSizing: "border-box",
                  boxShadow:
                    index === heroFeatures.length - 1
                      ? "0 16px 34px rgba(67,56,202,0.22)"
                      : "0 10px 24px rgba(15,23,42,0.05)",
                  marginLeft:
                    index === 0 ? "24px" : index === 1 ? "0" : index === 2 ? "18px" : "8px",
                }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    minWidth: "34px",
                    borderRadius: "10px",
                    background:
                      index === heroFeatures.length - 1
                        ? "rgba(255,255,255,0.16)"
                        : "#eef2ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    fontWeight: 800,
                  }}
                >
                  {index + 1}
                </div>

                <div
                  style={{
                    fontSize: "14px",
                    lineHeight: 1.4,
                    fontWeight: 700,
                  }}
                >
                  {item}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "24px 24px 72px",
          boxSizing: "border-box",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "34px" }}>
          <h2
            style={{
              margin: 0,
              fontSize: "44px",
              lineHeight: 1.1,
              fontWeight: 900,
              color: "#111827",
            }}
          >
            Эффективность на каждом этапе
          </h2>

          <p
            style={{
              margin: "14px auto 0",
              maxWidth: "700px",
              fontSize: "17px",
              lineHeight: 1.6,
              color: "#6b7280",
            }}
          >
            Инструменты, которые превращают хаос доставки в прозрачный и
            предсказуемый процесс.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "18px",
          }}
        >
          {featureCards.map((item) => (
            <div
              key={item.title}
              style={{
                background: "#f8faff",
                border: "1px solid #edf2f7",
                borderRadius: "22px",
                padding: "24px",
                boxShadow: "0 10px 24px rgba(15,23,42,0.04)",
              }}
            >
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "14px",
                  background: "#eef2ff",
                  color: "#4338ca",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  fontWeight: 800,
                  marginBottom: "18px",
                }}
              >
                {item.icon}
              </div>

              <div
                style={{
                  fontSize: "22px",
                  lineHeight: 1.2,
                  fontWeight: 800,
                  color: "#111827",
                  marginBottom: "12px",
                }}
              >
                {item.title}
              </div>

              <div
                style={{
                  fontSize: "15px",
                  lineHeight: 1.7,
                  color: "#6b7280",
                }}
              >
                {item.description}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section
        style={{
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "8px 24px 72px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            borderRadius: "28px",
            border: "1px solid #edf2f7",
            padding: "44px 36px",
            boxShadow: "0 18px 36px rgba(15,23,42,0.04)",
          }}
        >
          <h2
            style={{
              margin: 0,
              textAlign: "center",
              fontSize: "42px",
              lineHeight: 1.1,
              fontWeight: 900,
              color: "#111827",
            }}
          >
            Как это работает
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              gap: "16px",
              marginTop: "34px",
            }}
          >
            {steps.map((step, index) => (
              <div
                key={step}
                style={{
                  display: "grid",
                  gap: "14px",
                  justifyItems: "center",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    width: "54px",
                    height: "54px",
                    borderRadius: "999px",
                    background: index === steps.length - 1 ? "#4338ca" : "#eef2ff",
                    color: index === steps.length - 1 ? "#ffffff" : "#4338ca",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "18px",
                    fontWeight: 900,
                    boxShadow:
                      index === steps.length - 1
                        ? "0 12px 28px rgba(67,56,202,0.22)"
                        : "none",
                  }}
                >
                  {index + 1}
                </div>

                <div
                  style={{
                    fontSize: "16px",
                    lineHeight: 1.4,
                    fontWeight: 700,
                    color: "#111827",
                    maxWidth: "180px",
                  }}
                >
                  {step}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 24px 72px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            borderRadius: "32px",
            overflow: "hidden",
            background:
              "linear-gradient(180deg, #2b3240 0%, #101826 100%)",
            boxShadow: "0 28px 60px rgba(15,23,42,0.12)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div
            style={{
              height: "56px",
              background: "#8891a2",
              opacity: 0.85,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0 18px",
              boxSizing: "border-box",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "999px",
                  background: "#f97316",
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "999px",
                  background: "#facc15",
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "999px",
                  background: "#22c55e",
                  display: "inline-block",
                }}
              />
            </div>

            <div
              style={{
                fontSize: "13px",
                color: "#e5e7eb",
                fontWeight: 600,
              }}
            >
              app.logistics-center.ru/dashboard
            </div>

            <div style={{ width: "64px" }} />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "280px 1fr",
              minHeight: "520px",
            }}
          >
            <div
              style={{
                background: "#8d95a6",
                padding: "22px 18px",
                boxSizing: "border-box",
              }}
            >
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#dbe3f0",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "18px",
                }}
              >
                Активные заказы
              </div>

              {[8842, 8845, 8848].map((orderId, index) => (
                <div
                  key={orderId}
                  style={{
                    background: index === 0 ? "#17305a" : "#70798a",
                    color: "#ffffff",
                    borderRadius: "14px",
                    padding: "14px",
                    marginBottom: "12px",
                    boxShadow:
                      index === 0 ? "0 10px 24px rgba(15,23,42,0.18)" : "none",
                  }}
                >
                  <div style={{ fontSize: "15px", fontWeight: 800 }}>
                    Заказ #{orderId}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#d1d5db",
                      marginTop: "6px",
                    }}
                  >
                    г. Москва, с 8:00 до 18:00
                  </div>
                </div>
              ))}

              <div
                style={{
                  marginTop: "26px",
                  paddingTop: "18px",
                  borderTop: "1px solid rgba(255,255,255,0.16)",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#dbe3f0",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    В пути
                  </div>
                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "28px",
                      fontWeight: 900,
                      color: "#ffffff",
                    }}
                  >
                    42
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#dbe3f0",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    Доставлено
                  </div>
                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "28px",
                      fontWeight: 900,
                      color: "#7dd3fc",
                    }}
                  >
                    128
                  </div>
                </div>
              </div>
            </div>

            <div
              style={{
                position: "relative",
                background:
                  "radial-gradient(circle at 50% 50%, rgba(96,165,250,0.10) 0%, rgba(15,23,42,0) 46%), linear-gradient(180deg, #0b1220 0%, #0f172a 100%)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage:
                    "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
                  backgroundSize: "48px 48px",
                  opacity: 0.22,
                }}
              />

              <svg
                viewBox="0 0 800 520"
                preserveAspectRatio="none"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                }}
              >
                <polyline
                  points="150,170 320,210 420,350 640,300"
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="4"
                  strokeDasharray="8 10"
                />
                {[
                  { cx: 150, cy: 170 },
                  { cx: 320, cy: 210 },
                  { cx: 420, cy: 350 },
                  { cx: 640, cy: 300 },
                ].map((point, index) => (
                  <g key={index}>
                    <circle cx={point.cx} cy={point.cy} r="8" fill="#4f46e5" />
                    <circle
                      cx={point.cx}
                      cy={point.cy}
                      r="18"
                      fill="rgba(79,70,229,0.18)"
                    />
                  </g>
                ))}
              </svg>

              <div
                style={{
                  position: "absolute",
                  top: "22px",
                  right: "22px",
                  borderRadius: "14px",
                  background: "rgba(15,23,42,0.72)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#ffffff",
                  padding: "14px 16px",
                  fontSize: "13px",
                  lineHeight: 1.5,
                  boxShadow: "0 10px 24px rgba(15,23,42,0.24)",
                }}
              >
                <div style={{ fontWeight: 800 }}>AI Оптимизация</div>
                <div style={{ color: "#cbd5e1", marginTop: "4px" }}>
                  Маршрут пересчитан
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 24px 72px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            borderRadius: "32px",
            padding: "56px 24px",
            textAlign: "center",
            color: "#ffffff",
            background:
              "linear-gradient(135deg, #312e81 0%, #4338ca 50%, #4f46e5 100%)",
            boxShadow: "0 26px 56px rgba(67,56,202,0.24)",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "52px",
              lineHeight: 1.02,
              fontWeight: 900,
              maxWidth: "760px",
              marginInline: "auto",
            }}
          >
            Начните управлять доставкой уже сегодня
          </h2>

          <p
            style={{
              margin: "18px auto 0",
              maxWidth: "720px",
              fontSize: "18px",
              lineHeight: 1.7,
              color: "rgba(255,255,255,0.84)",
            }}
          >
            Присоединяйтесь к компаниям, которые уже автоматизируют доставку,
            маршруты и ежедневную операционную работу в одном кабинете.
          </p>

          <div style={{ marginTop: "28px" }}>
            <Link
              href="/register"
              style={{
                height: "54px",
                padding: "0 28px",
                borderRadius: "18px",
                background: "#ffffff",
                color: "#111827",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "15px",
                fontWeight: 800,
                boxShadow: "0 12px 28px rgba(255,255,255,0.14)",
              }}
            >
              Создать аккаунт
            </Link>
          </div>

          <div
            style={{
              marginTop: "18px",
              fontSize: "13px",
              color: "rgba(255,255,255,0.66)",
            }}
          >
            Бесплатный пробный период 14 дней. Карточка не требуется.
          </div>
        </div>
      </section>

      <footer
        style={{
          width: "100%",
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "0 24px 32px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            paddingTop: "22px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "18px",
                fontWeight: 800,
                color: "#111827",
              }}
            >
              Логистический центр
            </div>
            <div
              style={{
                marginTop: "6px",
                fontSize: "13px",
                color: "#6b7280",
              }}
            >
              © 2026 Логистический центр. Все права защищены.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "18px",
              flexWrap: "wrap",
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            <span>О продукте</span>
            <span>Контакты</span>
            <span>Политика</span>
            <span>API</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
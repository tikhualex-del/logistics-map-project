"use client";

import { useEffect, useState } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

type Courier = {
  id: string;
  fullName: string;
  phone: string | null;
  courierType: string;
  maxCapacityPoints: number | null;
  homeAddress: string | null;
  scheduleJson: string | null;
  isActive: boolean;
  createdAt: string;
};

type ScheduleDay = { enabled: boolean; from: string; to: string };
type Schedule = { mon: ScheduleDay; tue: ScheduleDay; wed: ScheduleDay; thu: ScheduleDay; fri: ScheduleDay; sat: ScheduleDay; sun: ScheduleDay };

type MotivationSystemPreset = {
  id: string;
  name: string;
  icon: string;
  description: string;
  example: string;
  fields: { key: string; label: string; placeholder: string; suffix: string }[];
};

type CustomMotivationRule = { key: string; value: string };
type ActiveMotivation = { presetId: string; values: CustomMotivationRule[] } | null;

// ─── Constants ───────────────────────────────────────────────────────────────

const DAY_LABELS: { key: keyof Schedule; label: string; full: string }[] = [
  { key: "mon", label: "Пн", full: "Понедельник" },
  { key: "tue", label: "Вт", full: "Вторник" },
  { key: "wed", label: "Ср", full: "Среда" },
  { key: "thu", label: "Чт", full: "Четверг" },
  { key: "fri", label: "Пт", full: "Пятница" },
  { key: "sat", label: "Сб", full: "Суббота" },
  { key: "sun", label: "Вс", full: "Воскресенье" },
];

const COURIER_TYPE_OPTIONS = [
  { value: "walk", label: "Пеший", icon: "🚶" },
  { value: "bike", label: "Велокурьер", icon: "🚴" },
  { value: "car", label: "Автокурьер", icon: "🚗" },
];

const MOTIVATION_PRESETS: MotivationSystemPreset[] = [
  {
    id: "fixed",
    name: "Фиксированная ставка",
    icon: "💼",
    description: "Курьер получает фиксированный оклад за период независимо от количества доставок.",
    example: "Пример: 50 000 ₽ в месяц",
    fields: [{ key: "salary", label: "Оклад в месяц", placeholder: "50000", suffix: "₽" }],
  },
  {
    id: "per_order",
    name: "За каждую доставку",
    icon: "📦",
    description: "Курьер получает фиксированную выплату за каждый выполненный заказ.",
    example: "Пример: 150 ₽ за заказ",
    fields: [{ key: "rate", label: "Ставка за заказ", placeholder: "150", suffix: "₽" }],
  },
  {
    id: "base_plus_bonus",
    name: "Оклад + бонус",
    icon: "💰",
    description: "Базовый оклад плюс бонус за каждый выполненный заказ сверх нормы.",
    example: "Пример: 25 000 ₽ + 80 ₽ за заказ сверх 100",
    fields: [
      { key: "base", label: "Базовый оклад", placeholder: "25000", suffix: "₽" },
      { key: "bonus_rate", label: "Бонус за заказ", placeholder: "80", suffix: "₽" },
      { key: "bonus_threshold", label: "Норма заказов", placeholder: "100", suffix: "шт" },
    ],
  },
  {
    id: "per_km",
    name: "По километражу",
    icon: "🛣️",
    description: "Выплата рассчитывается на основе пройденного расстояния. Требует указания домашнего адреса курьера.",
    example: "Пример: 12 ₽ за км",
    fields: [{ key: "rate_per_km", label: "Ставка за км", placeholder: "12", suffix: "₽/км" }],
  },
  {
    id: "kpi",
    name: "KPI-система",
    icon: "📊",
    description: "Выплата зависит от достижения ключевых показателей: процент успешных доставок, скорость, рейтинг.",
    example: "Пример: оклад × коэффициент KPI (0.8 – 1.3)",
    fields: [
      { key: "base", label: "Базовый оклад", placeholder: "40000", suffix: "₽" },
      { key: "kpi_min", label: "Мин. коэффициент", placeholder: "0.8", suffix: "×" },
      { key: "kpi_max", label: "Макс. коэффициент", placeholder: "1.3", suffix: "×" },
    ],
  },
  {
    id: "custom",
    name: "Своя система",
    icon: "⚙️",
    description: "Создайте собственную формулу начисления зарплаты с нужными параметрами.",
    example: "Любое сочетание ставок и бонусов",
    fields: [],
  },
];

const SALARY_STATUSES = [
  { value: "draft", label: "Черновик", color: "#6b7280", bg: "#f3f4f6" },
  { value: "submitted", label: "Отправлен", color: "#92400e", bg: "#fef3c7" },
  { value: "confirmed", label: "Подтверждён", color: "#15803d", bg: "#dcfce7" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function emptySchedule(): Schedule {
  const d = (): ScheduleDay => ({ enabled: false, from: "09:00", to: "18:00" });
  return { mon: d(), tue: d(), wed: d(), thu: d(), fri: d(), sat: d(), sun: d() };
}

function parseSchedule(raw: string | null): Schedule {
  if (!raw) return emptySchedule();
  try { return { ...emptySchedule(), ...JSON.parse(raw) }; }
  catch { return emptySchedule(); }
}

function courierTypeLabel(type: string) {
  return COURIER_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
}

function courierTypeIcon(type: string) {
  return COURIER_TYPE_OPTIONS.find((o) => o.value === type)?.icon ?? "🚶";
}

function formatScheduleCell(day: ScheduleDay) {
  if (!day.enabled) return null;
  return `${day.from}–${day.to}`;
}

function currentMonthLabel() {
  return new Date().toLocaleString("ru-RU", { month: "long", year: "numeric" });
}

// ─── Shared styles ───────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: "8px",
  border: "1px solid #d1d5db", fontSize: "14px", outline: "none",
  background: "#fff", color: "#111827", boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  fontSize: "13px", fontWeight: 600, color: "#374151", marginBottom: "5px", display: "block",
};

const cardStyle: React.CSSProperties = {
  background: "#fff", borderRadius: "14px", border: "1px solid #e5e7eb",
  padding: "20px", display: "flex", flexDirection: "column", gap: "10px",
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CouriersPage() {
  const [activeTab, setActiveTab] = useState<"list" | "schedule" | "salary" | "motivation">("list");

  const [couriers, setCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [courierType, setCourierType] = useState("walk");
  const [maxCapacity, setMaxCapacity] = useState("");
  const [homeAddress, setHomeAddress] = useState("");
  const [formSchedule, setFormSchedule] = useState<Schedule>(emptySchedule());
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Schedule tab state
  const [scheduleEdits, setScheduleEdits] = useState<Record<string, Schedule>>({});
  const [scheduleSaving, setScheduleSaving] = useState<Record<string, boolean>>({});
  const [scheduleSaved, setScheduleSaved] = useState<Record<string, boolean>>({});

  // Salary tab state
  const [salaryPeriod, setSalaryPeriod] = useState(currentMonthLabel());
  const [salaryStatuses, setSalaryStatuses] = useState<Record<string, string>>({});

  // Motivation tab state
  const [activeMotivation, setActiveMotivation] = useState<ActiveMotivation>(null);
  const [motivationValues, setMotivationValues] = useState<Record<string, Record<string, string>>>({});
  const [motivationSaved, setMotivationSaved] = useState(false);
  const [customRules, setCustomRules] = useState<CustomMotivationRule[]>([
    { key: "Правило 1", value: "" },
  ]);

  async function loadCouriers() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/couriers");
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Ошибка загрузки");
      setCouriers(data.couriers);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось загрузить курьеров");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCouriers(); }, []);

  // ── Couriers list logic ──────────────────────────────────────────────────

  function resetForm() {
    setFullName(""); setPhone(""); setCourierType("walk");
    setMaxCapacity(""); setHomeAddress(""); setFormSchedule(emptySchedule());
    setFormError(""); setEditId(null);
  }

  function openAdd() { resetForm(); setShowForm(true); }

  function openEdit(courier: Courier) {
    setFullName(courier.fullName);
    setPhone(courier.phone || "");
    setCourierType(courier.courierType);
    setMaxCapacity(courier.maxCapacityPoints != null ? String(courier.maxCapacityPoints) : "");
    setHomeAddress(courier.homeAddress || "");
    setFormSchedule(parseSchedule(courier.scheduleJson));
    setFormError(""); setEditId(courier.id); setShowForm(true);
  }

  async function handleSave() {
    if (!fullName.trim()) { setFormError("Укажите имя курьера"); return; }
    try {
      setSaving(true); setFormError("");
      const payload = {
        fullName: fullName.trim(), phone: phone.trim() || null,
        courierType, maxCapacityPoints: maxCapacity ? Number(maxCapacity) : null,
        homeAddress: homeAddress.trim() || null, scheduleJson: formSchedule,
      };
      const res = await fetch(editId ? `/api/couriers/${editId}` : "/api/couriers", {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Ошибка сохранения");
      setShowForm(false); resetForm(); await loadCouriers();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Не удалось сохранить");
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    try {
      setDeleteLoading(true);
      const res = await fetch(`/api/couriers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Ошибка удаления");
      setDeleteId(null); await loadCouriers();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось удалить");
    } finally { setDeleteLoading(false); }
  }

  async function handleToggleActive(courier: Courier) {
    try {
      const res = await fetch(`/api/couriers/${courier.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !courier.isActive }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      await loadCouriers();
    } catch { /* silent */ }
  }

  function updateFormScheduleDay(key: keyof Schedule, field: keyof ScheduleDay, value: string | boolean) {
    setFormSchedule((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  // ── Schedule tab logic ───────────────────────────────────────────────────

  function getEditSchedule(courier: Courier): Schedule {
    return scheduleEdits[courier.id] ?? parseSchedule(courier.scheduleJson);
  }

  function updateScheduleEdit(courierId: string, key: keyof Schedule, field: keyof ScheduleDay, value: string | boolean) {
    setScheduleEdits((prev) => {
      const base = prev[courierId] ?? parseSchedule(couriers.find((c) => c.id === courierId)?.scheduleJson ?? null);
      return { ...prev, [courierId]: { ...base, [key]: { ...base[key], [field]: value } } };
    });
  }

  async function saveSchedule(courierId: string) {
    const sched = scheduleEdits[courierId];
    if (!sched) return;
    try {
      setScheduleSaving((p) => ({ ...p, [courierId]: true }));
      const res = await fetch(`/api/couriers/${courierId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleJson: sched }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setScheduleSaved((p) => ({ ...p, [courierId]: true }));
      setTimeout(() => setScheduleSaved((p) => ({ ...p, [courierId]: false })), 2000);
      await loadCouriers();
    } catch { /* silent */ }
    finally { setScheduleSaving((p) => ({ ...p, [courierId]: false })); }
  }

  // ── Motivation logic ─────────────────────────────────────────────────────

  function setMotivationFieldValue(presetId: string, key: string, value: string) {
    setMotivationValues((prev) => ({
      ...prev,
      [presetId]: { ...(prev[presetId] ?? {}), [key]: value },
    }));
  }

  function selectMotivation(presetId: string) {
    const vals = motivationValues[presetId] ?? {};
    setActiveMotivation({ presetId, values: Object.entries(vals).map(([k, v]) => ({ key: k, value: v })) });
    setMotivationSaved(true);
    setTimeout(() => setMotivationSaved(false), 2500);
  }

  // ─── Tabs ────────────────────────────────────────────────────────────────

  const TABS = [
    { key: "list" as const, label: "Все курьеры" },
    { key: "schedule" as const, label: "Расписание" },
    { key: "salary" as const, label: "Зарплаты и документы" },
    { key: "motivation" as const, label: "Система мотивации" },
  ];

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <main style={{ minHeight: "100vh", padding: "32px", boxSizing: "border-box", background: "#f8fafc" }}>

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 800, color: "#111827" }}>Курьеры</h1>
          <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: "14px" }}>
            Управление командой курьеров, расписание, зарплаты и мотивация
          </p>
        </div>
        {activeTab === "list" && (
          <button type="button" onClick={openAdd}
            style={{ height: "40px", padding: "0 18px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}>
            + Добавить курьера
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "4px", background: "#e5e7eb", borderRadius: "12px", padding: "4px", marginBottom: "28px", width: "fit-content", flexWrap: "wrap" }}>
        {TABS.map((tab) => (
          <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
            style={{
              padding: "8px 16px", borderRadius: "9px", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer",
              background: activeTab === tab.key ? "#fff" : "transparent",
              color: activeTab === tab.key ? "#111827" : "#6b7280",
              boxShadow: activeTab === tab.key ? "0 1px 3px rgba(0,0,0,0.12)" : "none",
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Global error */}
      {error ? (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px 16px", color: "#b91c1c", fontSize: "14px", marginBottom: "20px" }}>
          {error}
        </div>
      ) : null}

      {/* ═══════════════════════════════════════════════════════════
          TAB 1 — Все курьеры
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "list" && (
        <>
          {loading ? (
            <div style={{ color: "#6b7280", fontSize: "14px" }}>Загрузка...</div>
          ) : couriers.length === 0 ? (
            <div style={{ ...cardStyle, alignItems: "center", padding: "48px 24px", textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🚴</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>Курьеров пока нет</div>
              <div style={{ fontSize: "14px", color: "#6b7280", marginBottom: "20px" }}>
                Добавьте первого курьера, чтобы начать планировать маршруты
              </div>
              <button type="button" onClick={openAdd}
                style={{ padding: "10px 20px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
                + Добавить курьера
              </button>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "24px" }}>
                {[
                  { label: "Всего", value: couriers.length },
                  { label: "Активных", value: couriers.filter((c) => c.isActive).length },
                  { label: "Авто", value: couriers.filter((c) => c.courierType === "car").length },
                  { label: "Пеших", value: couriers.filter((c) => c.courierType === "walk").length },
                  { label: "Вело", value: couriers.filter((c) => c.courierType === "bike").length },
                ].map((stat) => (
                  <div key={stat.label} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "12px 18px", minWidth: "80px", textAlign: "center" }}>
                    <div style={{ fontSize: "22px", fontWeight: 800, color: "#111827" }}>{stat.value}</div>
                    <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "14px" }}>
                {couriers.map((courier) => {
                  const isExpanded = expandedId === courier.id;
                  return (
                    <div key={courier.id} style={{ ...cardStyle, opacity: courier.isActive ? 1 : 0.65 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                        <div style={{
                          width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0,
                          background: courier.courierType === "car" ? "#dbeafe" : courier.courierType === "bike" ? "#dcfce7" : "#fef9c3",
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px",
                        }}>
                          {courierTypeIcon(courier.courierType)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "15px", fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {courier.fullName}
                          </div>
                          <div style={{ fontSize: "13px", color: "#6b7280", marginTop: "2px" }}>
                            {courierTypeLabel(courier.courierType)}
                            {courier.maxCapacityPoints != null ? ` · до ${courier.maxCapacityPoints} ед.` : ""}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                          <button type="button" onClick={() => openEdit(courier)}
                            style={{ padding: "5px 10px", borderRadius: "7px", border: "1px solid #d1d5db", background: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer", color: "#374151" }}>
                            Изменить
                          </button>
                          <button type="button" onClick={() => setDeleteId(courier.id)}
                            style={{ padding: "5px 10px", borderRadius: "7px", border: "1px solid #fecaca", background: "#fef2f2", fontSize: "12px", fontWeight: 600, cursor: "pointer", color: "#b91c1c" }}>
                            ✕
                          </button>
                        </div>
                      </div>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", fontSize: "13px" }}>
                        {courier.phone ? (
                          <span style={{ background: "#f3f4f6", borderRadius: "6px", padding: "3px 8px", color: "#374151" }}>📞 {courier.phone}</span>
                        ) : (
                          <span style={{ color: "#9ca3af", fontSize: "12px" }}>Телефон не указан</span>
                        )}
                        <span onClick={() => handleToggleActive(courier)} title="Нажмите для смены статуса"
                          style={{ background: courier.isActive ? "#dcfce7" : "#f3f4f6", color: courier.isActive ? "#15803d" : "#6b7280", borderRadius: "6px", padding: "3px 8px", cursor: "pointer", fontWeight: 600 }}>
                          {courier.isActive ? "Активен" : "Неактивен"}
                        </span>
                      </div>

                      <button type="button" onClick={() => setExpandedId(isExpanded ? null : courier.id)}
                        style={{ background: "none", border: "none", padding: 0, color: "#6b7280", fontSize: "12px", fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
                        {isExpanded ? "▲ Скрыть детали" : "▼ Детали"}
                      </button>

                      {isExpanded && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid #f3f4f6", paddingTop: "10px" }}>
                          {courier.homeAddress ? (
                            <div style={{ fontSize: "13px", color: "#374151" }}>
                              <span style={{ fontWeight: 600 }}>Адрес:</span> {courier.homeAddress}
                            </div>
                          ) : (
                            <div style={{ fontSize: "12px", color: "#9ca3af" }}>Адрес проживания не указан (нужен для расчёта км)</div>
                          )}
                          <div style={{ fontSize: "13px", color: "#374151" }}>
                            <span style={{ fontWeight: 600 }}>График: </span>
                            <span style={{ color: "#6b7280" }}>
                              {(() => {
                                const s = parseSchedule(courier.scheduleJson);
                                const active = DAY_LABELS.filter((d) => s[d.key]?.enabled);
                                return active.length === 0 ? "Не задан" : active.map((d) => `${d.label} ${s[d.key].from}–${s[d.key].to}`).join(", ");
                              })()}
                            </span>
                          </div>
                          <div style={{ fontSize: "12px", color: "#9ca3af" }}>
                            💬 Чат с курьером — будет доступен после запуска мобильного приложения
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 2 — Расписание
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "schedule" && (
        <>
          {loading ? (
            <div style={{ color: "#6b7280", fontSize: "14px" }}>Загрузка...</div>
          ) : couriers.length === 0 ? (
            <div style={{ ...cardStyle, alignItems: "center", padding: "48px 24px", textAlign: "center" }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>📅</div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#111827", marginBottom: "6px" }}>Нет курьеров</div>
              <div style={{ fontSize: "14px", color: "#6b7280" }}>Добавьте курьеров во вкладке «Все курьеры»</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {couriers.filter((c) => c.isActive).map((courier) => {
                const sched = getEditSchedule(courier);
                const hasChanges = !!scheduleEdits[courier.id];
                const isSaving = !!scheduleSaving[courier.id];
                const isSaved = !!scheduleSaved[courier.id];
                return (
                  <div key={courier.id} style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e5e7eb", padding: "18px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                      <span style={{ fontSize: "20px" }}>{courierTypeIcon(courier.courierType)}</span>
                      <span style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>{courier.fullName}</span>
                      <span style={{ fontSize: "12px", color: "#6b7280", background: "#f3f4f6", borderRadius: "6px", padding: "2px 8px" }}>
                        {courierTypeLabel(courier.courierType)}
                      </span>
                      <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
                        {isSaved && <span style={{ fontSize: "12px", color: "#15803d", fontWeight: 600 }}>✓ Сохранено</span>}
                        {hasChanges && (
                          <button type="button" onClick={() => saveSchedule(courier.id)} disabled={isSaving}
                            style={{ padding: "6px 14px", borderRadius: "8px", border: "none", background: "#2563eb", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: isSaving ? "not-allowed" : "pointer", opacity: isSaving ? 0.7 : 1 }}>
                            {isSaving ? "Сохранение..." : "Сохранить"}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Day rows */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {DAY_LABELS.map(({ key, label, full }) => {
                        const day = sched[key];
                        return (
                          <div key={key} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "6px 8px", borderRadius: "8px", background: day.enabled ? "#f0fdf4" : "#f9fafb" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: "6px", width: "120px", cursor: "pointer", flexShrink: 0 }}>
                              <input type="checkbox" checked={day.enabled}
                                onChange={(e) => updateScheduleEdit(courier.id, key, "enabled", e.target.checked)}
                                style={{ width: "15px", height: "15px", cursor: "pointer", accentColor: "#2563eb" }} />
                              <span style={{ fontSize: "13px", fontWeight: 700, color: day.enabled ? "#15803d" : "#6b7280" }}>{full}</span>
                            </label>
                            {day.enabled ? (
                              <>
                                <input type="time" value={day.from}
                                  onChange={(e) => updateScheduleEdit(courier.id, key, "from", e.target.value)}
                                  style={{ ...inputStyle, width: "110px", color: "#111827" }} />
                                <span style={{ color: "#9ca3af", fontSize: "13px" }}>—</span>
                                <input type="time" value={day.to}
                                  onChange={(e) => updateScheduleEdit(courier.id, key, "to", e.target.value)}
                                  style={{ ...inputStyle, width: "110px", color: "#111827" }} />
                              </>
                            ) : (
                              <span style={{ fontSize: "13px", color: "#9ca3af" }}>Выходной</span>
                            )}
                            {day.enabled && (
                              <span style={{ fontSize: "12px", color: "#6b7280", marginLeft: "auto" }}>
                                {(() => {
                                  const [fh, fm] = day.from.split(":").map(Number);
                                  const [th, tm] = day.to.split(":").map(Number);
                                  const diff = (th * 60 + tm) - (fh * 60 + fm);
                                  if (diff <= 0) return "";
                                  return `${Math.floor(diff / 60)}ч ${diff % 60 > 0 ? diff % 60 + "м" : ""}`.trim();
                                })()}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {couriers.filter((c) => !c.isActive).length > 0 && (
                <div style={{ fontSize: "13px", color: "#9ca3af", marginTop: "8px" }}>
                  Неактивные курьеры скрыты. Активируйте их во вкладке «Все курьеры», чтобы редактировать расписание.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 3 — Зарплаты и документы
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "salary" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {/* Period selector + action */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>Период:</div>
            <input type="month" defaultValue={new Date().toISOString().slice(0, 7)}
              onChange={(e) => {
                const d = new Date(e.target.value + "-01");
                setSalaryPeriod(d.toLocaleString("ru-RU", { month: "long", year: "numeric" }));
              }}
              style={{ ...inputStyle, width: "160px", color: "#111827" }} />
            <button type="button"
              style={{ padding: "9px 16px", borderRadius: "9px", border: "none", background: "#2563eb", color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}>
              Сформировать ведомость
            </button>
            <button type="button"
              style={{ padding: "9px 16px", borderRadius: "9px", border: "1px solid #d1d5db", background: "#fff", color: "#374151", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
              Экспорт PDF
            </button>
          </div>

          {/* App notice */}
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "12px 16px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
            <span style={{ fontSize: "18px" }}>📱</span>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#1d4ed8", marginBottom: "3px" }}>
                Подтверждение через мобильное приложение
              </div>
              <div style={{ fontSize: "12px", color: "#3b82f6" }}>
                После отправки ведомости курьеры смогут подтвердить начисления прямо из приложения. Функция появится после запуска курьерского приложения.
              </div>
            </div>
          </div>

          {/* Table */}
          {couriers.length === 0 ? (
            <div style={{ ...cardStyle, alignItems: "center", padding: "40px 24px", textAlign: "center" }}>
              <div style={{ fontSize: "36px", marginBottom: "12px" }}>💳</div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>Нет данных</div>
              <div style={{ fontSize: "14px", color: "#6b7280", marginTop: "6px" }}>Добавьте курьеров, чтобы формировать ведомости</div>
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                      {["Курьер", "Тип", "Заказов", "Расстояние", "Начислено", "Статус", "Действия"].map((h) => (
                        <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontSize: "12px", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {couriers.map((courier, i) => {
                      const status = salaryStatuses[courier.id] || "draft";
                      const statusInfo = SALARY_STATUSES.find((s) => s.value === status) ?? SALARY_STATUSES[0];
                      return (
                        <tr key={courier.id} style={{ borderBottom: i < couriers.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "18px" }}>{courierTypeIcon(courier.courierType)}</span>
                              <div>
                                <div style={{ fontWeight: 700, color: "#111827" }}>{courier.fullName}</div>
                                {courier.phone && <div style={{ fontSize: "12px", color: "#6b7280" }}>{courier.phone}</div>}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: "14px 16px", color: "#6b7280" }}>{courierTypeLabel(courier.courierType)}</td>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{ color: "#9ca3af", fontSize: "13px" }}>Нет данных</span>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            {courier.homeAddress ? (
                              <span style={{ color: "#9ca3af", fontSize: "13px" }}>Нет данных</span>
                            ) : (
                              <span style={{ color: "#d1d5db", fontSize: "12px" }}>Адрес не указан</span>
                            )}
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{ color: "#9ca3af", fontSize: "13px" }}>
                              {activeMotivation ? "Зависит от системы" : "Система не выбрана"}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <span style={{ background: statusInfo.bg, color: statusInfo.color, borderRadius: "6px", padding: "3px 8px", fontSize: "12px", fontWeight: 700 }}>
                              {statusInfo.label}
                            </span>
                          </td>
                          <td style={{ padding: "14px 16px" }}>
                            <div style={{ display: "flex", gap: "6px" }}>
                              {status === "draft" && (
                                <button type="button"
                                  onClick={() => setSalaryStatuses((p) => ({ ...p, [courier.id]: "submitted" }))}
                                  style={{ padding: "5px 10px", borderRadius: "7px", border: "1px solid #fbbf24", background: "#fffbeb", fontSize: "12px", fontWeight: 600, cursor: "pointer", color: "#92400e", whiteSpace: "nowrap" }}>
                                  Отправить
                                </button>
                              )}
                              {status === "submitted" && (
                                <button type="button"
                                  onClick={() => setSalaryStatuses((p) => ({ ...p, [courier.id]: "confirmed" }))}
                                  style={{ padding: "5px 10px", borderRadius: "7px", border: "1px solid #bbf7d0", background: "#f0fdf4", fontSize: "12px", fontWeight: 600, cursor: "pointer", color: "#15803d", whiteSpace: "nowrap" }}>
                                  Подтвердить
                                </button>
                              )}
                              <button type="button"
                                style={{ padding: "5px 10px", borderRadius: "7px", border: "1px solid #d1d5db", background: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer", color: "#374151" }}>
                                Документ
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Hint about order data */}
          {couriers.length > 0 && (
            <div style={{ fontSize: "12px", color: "#9ca3af", background: "#f9fafb", borderRadius: "10px", padding: "12px 16px", border: "1px solid #e5e7eb" }}>
              ℹ️ Для автоматического расчёта зарплат необходимо связать курьеров с заказами из CRM. Настройте систему мотивации во вкладке «Система мотивации».
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 4 — Система мотивации
      ═══════════════════════════════════════════════════════════ */}
      {activeTab === "motivation" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>

          {motivationSaved && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "12px 16px", color: "#15803d", fontSize: "14px", fontWeight: 600 }}>
              ✓ Система мотивации сохранена
            </div>
          )}

          <div style={{ fontSize: "14px", color: "#6b7280" }}>
            Выберите готовую систему или создайте свою. Выбранная система будет применяться при расчёте зарплат в разделе «Зарплаты и документы».
          </div>

          {activeMotivation && (
            <div style={{ background: "#eff6ff", border: "2px solid #2563eb", borderRadius: "12px", padding: "14px 16px", display: "flex", gap: "10px", alignItems: "center" }}>
              <span style={{ fontSize: "20px" }}>{MOTIVATION_PRESETS.find((p) => p.id === activeMotivation.presetId)?.icon}</span>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#1d4ed8" }}>
                  Активная система: {MOTIVATION_PRESETS.find((p) => p.id === activeMotivation.presetId)?.name}
                </div>
                {activeMotivation.values.length > 0 && (
                  <div style={{ fontSize: "12px", color: "#3b82f6", marginTop: "3px" }}>
                    {activeMotivation.values.map((v) => `${v.key}: ${v.value}`).join(" · ")}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => setActiveMotivation(null)}
                style={{ marginLeft: "auto", padding: "5px 10px", borderRadius: "7px", border: "1px solid #bfdbfe", background: "#fff", fontSize: "12px", fontWeight: 600, cursor: "pointer", color: "#1d4ed8" }}>
                Сменить
              </button>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "14px" }}>
            {MOTIVATION_PRESETS.map((preset) => {
              const isActive = activeMotivation?.presetId === preset.id;
              const vals = motivationValues[preset.id] ?? {};
              return (
                <div key={preset.id} style={{
                  background: "#fff", borderRadius: "14px", padding: "20px",
                  border: isActive ? "2px solid #2563eb" : "1px solid #e5e7eb",
                  display: "flex", flexDirection: "column", gap: "12px",
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <span style={{ fontSize: "28px", lineHeight: 1 }}>{preset.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "15px", fontWeight: 700, color: "#111827" }}>{preset.name}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>{preset.description}</div>
                    </div>
                  </div>

                  <div style={{ fontSize: "12px", background: "#f9fafb", borderRadius: "8px", padding: "8px 10px", color: "#374151", fontStyle: "italic" }}>
                    {preset.example}
                  </div>

                  {preset.id === "custom" ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {customRules.map((rule, idx) => (
                        <div key={idx} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                          <input type="text" value={rule.key} placeholder="Название"
                            onChange={(e) => setCustomRules((p) => p.map((r, i) => i === idx ? { ...r, key: e.target.value } : r))}
                            style={{ ...inputStyle, width: "120px", flex: "0 0 auto" }} />
                          <input type="text" value={rule.value} placeholder="Значение"
                            onChange={(e) => setCustomRules((p) => p.map((r, i) => i === idx ? { ...r, value: e.target.value } : r))}
                            style={{ ...inputStyle, flex: 1 }} />
                          {customRules.length > 1 && (
                            <button type="button" onClick={() => setCustomRules((p) => p.filter((_, i) => i !== idx))}
                              style={{ padding: "5px 8px", border: "1px solid #fecaca", background: "#fef2f2", borderRadius: "6px", cursor: "pointer", color: "#b91c1c", fontSize: "12px" }}>✕</button>
                          )}
                        </div>
                      ))}
                      <button type="button" onClick={() => setCustomRules((p) => [...p, { key: `Правило ${p.length + 1}`, value: "" }])}
                        style={{ padding: "6px 12px", border: "1px dashed #d1d5db", background: "transparent", borderRadius: "8px", cursor: "pointer", color: "#6b7280", fontSize: "13px", fontWeight: 600 }}>
                        + Добавить правило
                      </button>
                    </div>
                  ) : preset.fields.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {preset.fields.map((field) => (
                        <div key={field.key}>
                          <label style={labelStyle}>{field.label}</label>
                          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                            <input type="number" value={vals[field.key] ?? ""} placeholder={field.placeholder}
                              onChange={(e) => setMotivationFieldValue(preset.id, field.key, e.target.value)}
                              style={{ ...inputStyle }} />
                            <span style={{ fontSize: "13px", color: "#6b7280", whiteSpace: "nowrap" }}>{field.suffix}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <button type="button" onClick={() => selectMotivation(preset.id)}
                    style={{
                      padding: "10px", borderRadius: "9px", fontSize: "13px", fontWeight: 700, cursor: "pointer",
                      border: isActive ? "none" : "1px solid #d1d5db",
                      background: isActive ? "#2563eb" : "#f9fafb",
                      color: isActive ? "#fff" : "#374151",
                      marginTop: "auto",
                    }}>
                    {isActive ? "✓ Выбрана" : "Выбрать эту систему"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          MODALS
      ═══════════════════════════════════════════════════════════ */}

      {/* Add/Edit courier modal */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); resetForm(); } }}>
          <div style={{ background: "#fff", borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#111827" }}>
                {editId ? "Редактировать курьера" : "Добавить курьера"}
              </h2>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#6b7280" }}>✕</button>
            </div>

            {formError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "10px 12px", color: "#b91c1c", fontSize: "14px" }}>
                {formError}
              </div>
            )}

            <div>
              <label style={labelStyle}>Имя и фамилия *</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Иван Иванов" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Телефон</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 900 000 00 00" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Тип курьера</label>
              <div style={{ display: "flex", gap: "8px" }}>
                {COURIER_TYPE_OPTIONS.map((opt) => (
                  <button key={opt.value} type="button" onClick={() => setCourierType(opt.value)}
                    style={{
                      flex: 1, padding: "10px 8px", borderRadius: "9px", fontSize: "13px", fontWeight: 700, cursor: "pointer",
                      border: courierType === opt.value ? "2px solid #2563eb" : "1px solid #d1d5db",
                      background: courierType === opt.value ? "#eff6ff" : "#fff",
                      color: courierType === opt.value ? "#1d4ed8" : "#374151",
                    }}>
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label style={labelStyle}>Вместимость (в единицах заказов)</label>
              <input type="number" value={maxCapacity} onChange={(e) => setMaxCapacity(e.target.value)} placeholder="Например: 20" min={1} style={inputStyle} />
              <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>Необязательно. Используется при автоматическом планировании.</div>
            </div>

            <div>
              <label style={labelStyle}>Адрес проживания</label>
              <input type="text" value={homeAddress} onChange={(e) => setHomeAddress(e.target.value)} placeholder="Москва, ул. Примерная, д. 1" style={inputStyle} />
              <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>Необязательно. Нужен для расчёта пробега.</div>
            </div>

            <div>
              <label style={labelStyle}>Рабочий график</label>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {DAY_LABELS.map(({ key, label }) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", width: "60px", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#374151", flexShrink: 0 }}>
                      <input type="checkbox" checked={formSchedule[key].enabled}
                        onChange={(e) => updateFormScheduleDay(key, "enabled", e.target.checked)}
                        style={{ width: "15px", height: "15px", cursor: "pointer" }} />
                      {label}
                    </label>
                    <input type="time" value={formSchedule[key].from} disabled={!formSchedule[key].enabled}
                      onChange={(e) => updateFormScheduleDay(key, "from", e.target.value)}
                      style={{ ...inputStyle, width: "110px", opacity: formSchedule[key].enabled ? 1 : 0.4 }} />
                    <span style={{ fontSize: "13px", color: "#9ca3af" }}>—</span>
                    <input type="time" value={formSchedule[key].to} disabled={!formSchedule[key].enabled}
                      onChange={(e) => updateFormScheduleDay(key, "to", e.target.value)}
                      style={{ ...inputStyle, width: "110px", opacity: formSchedule[key].enabled ? 1 : 0.4 }} />
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "12px 14px", border: "1px dashed #d1d5db" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#374151", marginBottom: "4px" }}>💬 Чат с курьером</div>
              <div style={{ fontSize: "12px", color: "#9ca3af" }}>Будет доступен после запуска мобильного приложения</div>
            </div>

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", paddingTop: "4px" }}>
              <button type="button" onClick={() => { setShowForm(false); resetForm(); }} disabled={saving}
                style={{ padding: "10px 18px", borderRadius: "9px", border: "1px solid #d1d5db", background: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer", color: "#374151" }}>
                Отмена
              </button>
              <button type="button" onClick={handleSave} disabled={saving}
                style={{ padding: "10px 20px", borderRadius: "9px", border: "none", background: "#2563eb", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1 }}>
                {saving ? "Сохранение..." : editId ? "Сохранить" : "Добавить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
          onClick={(e) => { if (e.target === e.currentTarget) setDeleteId(null); }}>
          <div style={{ background: "#fff", borderRadius: "14px", padding: "28px", width: "100%", maxWidth: "400px" }}>
            <h3 style={{ margin: "0 0 10px", fontSize: "17px", fontWeight: 800, color: "#111827" }}>Удалить курьера?</h3>
            <p style={{ margin: "0 0 20px", fontSize: "14px", color: "#6b7280" }}>Это действие нельзя отменить. Данные курьера будут удалены.</p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => setDeleteId(null)} disabled={deleteLoading}
                style={{ padding: "9px 16px", borderRadius: "9px", border: "1px solid #d1d5db", background: "#fff", fontSize: "14px", fontWeight: 600, cursor: "pointer", color: "#374151" }}>
                Отмена
              </button>
              <button type="button" onClick={() => handleDelete(deleteId)} disabled={deleteLoading}
                style={{ padding: "9px 16px", borderRadius: "9px", border: "none", background: "#dc2626", color: "#fff", fontSize: "14px", fontWeight: 700, cursor: deleteLoading ? "not-allowed" : "pointer", opacity: deleteLoading ? 0.7 : 1 }}>
                {deleteLoading ? "Удаление..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type StaffItem = {
    id: string;
    userId: string;
    fullName: string;
    email: string;
    role: string;
    isActive: boolean;
    createdAt: string;
};

type MeResponseData = {
    user: {
        id: string;
        email: string;
        fullName: string;
    };
    company: {
        id: string;
        name: string;
        timezone: string;
    };
    session: {
        id: string;
        expiresAt: string;
    };
    role: string;
};

type ApiResponse<T> = {
    success: boolean;
    message?: string;
    data?: T;
};

type StaffFilter = "all" | "active" | "inactive";

const roleLabels: Record<string, string> = {
    owner: "Владелец",
    admin: "Администратор",
    dispatcher: "Диспетчер",
    viewer: "Наблюдатель",
};

export default function StaffPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [staff, setStaff] = useState<StaffItem[]>([]);
    const [currentUserRole, setCurrentUserRole] = useState("");
    const [currentUserId, setCurrentUserId] = useState("");
    const [staffFilter, setStaffFilter] = useState<StaffFilter>("all");

    const [createLoading, setCreateLoading] = useState(false);
    const [createError, setCreateError] = useState("");
    const [createSuccess, setCreateSuccess] = useState("");

    const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
    const [actionError, setActionError] = useState("");
    const [actionSuccess, setActionSuccess] = useState("");

    const [roleLoadingId, setRoleLoadingId] = useState<string | null>(null);
    const [roleDrafts, setRoleDrafts] = useState<Record<string, string>>({});

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("viewer");

    const availableRoleOptions = useMemo(() => {
        if (currentUserRole === "owner") {
            return [
                { value: "viewer", label: "Наблюдатель" },
                { value: "dispatcher", label: "Диспетчер" },
                { value: "admin", label: "Администратор" },
            ];
        }

        return [
            { value: "viewer", label: "Наблюдатель" },
            { value: "dispatcher", label: "Диспетчер" },
        ];
    }, [currentUserRole]);

    const filteredStaff = useMemo(() => {
        if (staffFilter === "active") {
            return staff.filter((item) => item.isActive);
        }

        if (staffFilter === "inactive") {
            return staff.filter((item) => !item.isActive);
        }

        return staff;
    }, [staff, staffFilter]);

    function canDeactivateStaff(item: StaffItem) {
        if (!item.isActive) {
            return false;
        }

        if (currentUserRole === "owner") {
            if (item.userId === currentUserId) {
                return false;
            }

            return true;
        }

        if (currentUserRole === "admin") {
            if (item.role === "owner" || item.role === "admin") {
                return false;
            }

            return true;
        }

        return false;
    }

    function canRestoreStaff(item: StaffItem) {
        if (item.isActive) {
            return false;
        }

        if (currentUserRole === "owner") {
            return true;
        }

        if (currentUserRole === "admin") {
            if (item.role === "owner" || item.role === "admin") {
                return false;
            }

            return true;
        }

        return false;
    }

    function canEditRole(item: StaffItem) {
        if (item.role === "owner") {
            return false;
        }

        if (currentUserRole === "owner") {
            if (item.userId === currentUserId) {
                return false;
            }

            return true;
        }

        if (currentUserRole === "admin") {
            if (item.role === "admin" || item.role === "owner") {
                return false;
            }

            return true;
        }

        return false;
    }

    function getEditableRoleOptions(item: StaffItem) {
        if (currentUserRole === "owner") {
            return [
                { value: "viewer", label: "Наблюдатель" },
                { value: "dispatcher", label: "Диспетчер" },
                { value: "admin", label: "Администратор" },
            ];
        }

        if (currentUserRole === "admin") {
            return [
                { value: "viewer", label: "Наблюдатель" },
                { value: "dispatcher", label: "Диспетчер" },
            ];
        }

        return [{ value: item.role, label: roleLabels[item.role] || item.role }];
    }

    async function loadPageData() {
        try {
            setLoading(true);
            setError("");

            const [meResponse, staffResponse] = await Promise.all([
                fetch("/api/auth/me", {
                    method: "GET",
                    cache: "no-store",
                    credentials: "include",
                }),
                fetch("/api/staff", {
                    method: "GET",
                    cache: "no-store",
                    credentials: "include",
                }),
            ]);

            const meResult: ApiResponse<MeResponseData> = await meResponse.json();
            const staffResult: ApiResponse<StaffItem[]> = await staffResponse.json();

            if (meResponse.status === 401 || staffResponse.status === 401) {
                router.replace("/login");
                return;
            }

            if (staffResponse.status === 403) {
                setError("У вас нет доступа к разделу сотрудников");
                return;
            }

            if (!meResponse.ok || !meResult.success) {
                throw new Error(meResult.message || "Не удалось загрузить текущего пользователя");
            }

            if (!staffResponse.ok || !staffResult.success) {
                throw new Error(staffResult.message || "Не удалось загрузить сотрудников");
            }

            const loadedStaff = Array.isArray(staffResult.data) ? staffResult.data : [];

            setCurrentUserRole(String(meResult.data?.role || ""));
            setCurrentUserId(String(meResult.data?.user?.id || ""));
            setStaff(loadedStaff);

            const nextDrafts: Record<string, string> = {};
            loadedStaff.forEach((item) => {
                nextDrafts[item.id] = item.role;
            });
            setRoleDrafts(nextDrafts);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Ошибка загрузки страницы сотрудников";
            setError(message);
        } finally {
            setLoading(false);
        }
    }

    async function loadStaff() {
        try {
            const response = await fetch("/api/staff", {
                method: "GET",
                cache: "no-store",
                credentials: "include",
            });

            const result: ApiResponse<StaffItem[]> = await response.json();

            if (response.status === 401) {
                router.replace("/login");
                return;
            }

            if (response.status === 403) {
                setError("У вас нет доступа к разделу сотрудников");
                return;
            }

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Не удалось загрузить сотрудников");
            }

            const loadedStaff = Array.isArray(result.data) ? result.data : [];
            setStaff(loadedStaff);

            const nextDrafts: Record<string, string> = {};
            loadedStaff.forEach((item) => {
                nextDrafts[item.id] = item.role;
            });
            setRoleDrafts(nextDrafts);
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Ошибка загрузки сотрудников";
            setError(message);
        }
    }

    async function handleCreateStaff(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            setCreateLoading(true);
            setCreateError("");
            setCreateSuccess("");
            setActionError("");
            setActionSuccess("");

            const response = await fetch("/api/staff", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    fullName,
                    email,
                    password,
                    role,
                }),
            });

            const result: ApiResponse<StaffItem> = await response.json();

            if (response.status === 401) {
                router.replace("/login");
                return;
            }

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Не удалось создать сотрудника");
            }

            setCreateSuccess("Сотрудник успешно добавлен");
            setFullName("");
            setEmail("");
            setPassword("");
            setRole("viewer");

            await loadStaff();
            setStaffFilter("all");
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Ошибка создания сотрудника";
            setCreateError(message);
        } finally {
            setCreateLoading(false);
        }
    }

    async function handleDeactivateStaff(staffId: string) {
        const confirmed = window.confirm(
            "Вы уверены, что хотите отключить этого сотрудника?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setActionLoadingId(staffId);
            setActionError("");
            setActionSuccess("");
            setCreateError("");
            setCreateSuccess("");

            const response = await fetch(`/api/staff/${staffId}/deactivate`, {
                method: "POST",
                credentials: "include",
            });

            const result: ApiResponse<StaffItem> = await response.json();

            if (response.status === 401) {
                router.replace("/login");
                return;
            }

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Не удалось отключить сотрудника");
            }

            setActionSuccess("Сотрудник успешно отключен");
            await loadStaff();
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Ошибка отключения сотрудника";
            setActionError(message);
        } finally {
            setActionLoadingId(null);
        }
    }

    async function handleRestoreStaff(staffId: string) {
        const confirmed = window.confirm(
            "Вы уверены, что хотите восстановить этого сотрудника?"
        );

        if (!confirmed) {
            return;
        }

        try {
            setActionLoadingId(staffId);
            setActionError("");
            setActionSuccess("");
            setCreateError("");
            setCreateSuccess("");

            const response = await fetch(`/api/staff/${staffId}/restore`, {
                method: "POST",
                credentials: "include",
            });

            const result: ApiResponse<StaffItem> = await response.json();

            if (response.status === 401) {
                router.replace("/login");
                return;
            }

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Не удалось восстановить сотрудника");
            }

            setActionSuccess("Сотрудник успешно восстановлен");
            await loadStaff();
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Ошибка восстановления сотрудника";
            setActionError(message);
        } finally {
            setActionLoadingId(null);
        }
    }

    async function handleSaveRole(staffId: string) {
        const selectedRole = String(roleDrafts[staffId] || "").trim().toLowerCase();

        try {
            setRoleLoadingId(staffId);
            setActionError("");
            setActionSuccess("");
            setCreateError("");
            setCreateSuccess("");

            const response = await fetch(`/api/staff/${staffId}/role`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    role: selectedRole,
                }),
            });

            const result: ApiResponse<StaffItem> = await response.json();

            if (response.status === 401) {
                router.replace("/login");
                return;
            }

            if (!response.ok || !result.success) {
                throw new Error(result.message || "Не удалось изменить роль сотрудника");
            }

            setActionSuccess("Роль сотрудника успешно изменена");
            await loadStaff();
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Ошибка изменения роли сотрудника";
            setActionError(message);
        } finally {
            setRoleLoadingId(null);
        }
    }

    useEffect(() => {
        loadPageData();
    }, []);

    return (
        <main
            style={{
                minHeight: "100vh",
                background: "#f8fafc",
                padding: "32px 16px 48px",
            }}
        >
            <div
                style={{
                    maxWidth: "1120px",
                    margin: "0 auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                }}
            >
                <section
                    style={{
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "20px",
                        padding: "24px",
                        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
                    }}
                >
                    <div
                        style={{
                            fontSize: "12px",
                            fontWeight: 700,
                            color: "#2563eb",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: "10px",
                        }}
                    >
                        Settings
                    </div>

                    <h1
                        style={{
                            margin: 0,
                            fontSize: "30px",
                            lineHeight: 1.15,
                            fontWeight: 800,
                            color: "#111827",
                        }}
                    >
                        Сотрудники
                    </h1>

                    <p
                        style={{
                            marginTop: "10px",
                            marginBottom: 0,
                            fontSize: "15px",
                            lineHeight: 1.7,
                            color: "#4b5563",
                            maxWidth: "760px",
                        }}
                    >
                        Здесь отображаются сотрудники текущей компании.
                    </p>
                </section>

                <section
                    style={{
                        background: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "20px",
                        padding: "24px",
                        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.05)",
                    }}
                >
                    <div
                        style={{
                            marginBottom: "24px",
                            border: "1px solid #e5e7eb",
                            borderRadius: "16px",
                            padding: "20px",
                            background: "#f9fafb",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "18px",
                                fontWeight: 800,
                                color: "#111827",
                                marginBottom: "6px",
                            }}
                        >
                            Добавить сотрудника
                        </div>

                        <div
                            style={{
                                marginBottom: "14px",
                                fontSize: "13px",
                                color: "#6b7280",
                            }}
                        >
                            Ваша роль: {roleLabels[currentUserRole] || "—"}
                        </div>

                        <form
                            onSubmit={handleCreateStaff}
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                                gap: "12px",
                                alignItems: "end",
                            }}
                        >
                            <div>
                                <label style={labelStyle}>Имя</label>
                                <input
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Например, Иван Петров"
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Email</label>
                                <input
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="user@company.com"
                                    type="email"
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Пароль</label>
                                <input
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Введите пароль"
                                    type="password"
                                    style={inputStyle}
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Роль</label>
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value)}
                                    style={inputStyle}
                                >
                                    {availableRoleOptions.map((item) => (
                                        <option key={item.value} value={item.value}>
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={createLoading}
                                    style={{
                                        height: "44px",
                                        borderRadius: "12px",
                                        border: "none",
                                        background: "#2563eb",
                                        color: "#ffffff",
                                        fontSize: "14px",
                                        fontWeight: 700,
                                        padding: "0 16px",
                                        cursor: createLoading ? "not-allowed" : "pointer",
                                        width: "100%",
                                    }}
                                >
                                    {createLoading ? "Создание..." : "Добавить сотрудника"}
                                </button>
                            </div>
                        </form>

                        {createError ? (
                            <div
                                style={errorBoxStyle}
                            >
                                {createError}
                            </div>
                        ) : null}

                        {createSuccess ? (
                            <div
                                style={successBoxStyle}
                            >
                                {createSuccess}
                            </div>
                        ) : null}

                        {actionError ? (
                            <div
                                style={errorBoxStyle}
                            >
                                {actionError}
                            </div>
                        ) : null}

                        {actionSuccess ? (
                            <div
                                style={successBoxStyle}
                            >
                                {actionSuccess}
                            </div>
                        ) : null}
                    </div>

                    <div
                        style={{
                            display: "flex",
                            gap: "10px",
                            flexWrap: "wrap",
                            marginBottom: "16px",
                        }}
                    >
                        <button
                            type="button"
                            onClick={() => setStaffFilter("all")}
                            style={getFilterButtonStyle(staffFilter === "all")}
                        >
                            Все
                        </button>

                        <button
                            type="button"
                            onClick={() => setStaffFilter("active")}
                            style={getFilterButtonStyle(staffFilter === "active")}
                        >
                            Активные
                        </button>

                        <button
                            type="button"
                            onClick={() => setStaffFilter("inactive")}
                            style={getFilterButtonStyle(staffFilter === "inactive")}
                        >
                            Отключенные
                        </button>
                    </div>

                    {loading ? (
                        <div
                            style={{
                                border: "1px solid #e5e7eb",
                                borderRadius: "16px",
                                padding: "18px",
                                background: "#f9fafb",
                                fontSize: "14px",
                                color: "#4b5563",
                            }}
                        >
                            Загрузка сотрудников...
                        </div>
                    ) : error ? (
                        <div
                            style={{
                                border: "1px solid #fecaca",
                                background: "#fef2f2",
                                color: "#b91c1c",
                                borderRadius: "16px",
                                padding: "16px",
                                fontSize: "14px",
                                lineHeight: 1.6,
                            }}
                        >
                            {error}
                        </div>
                    ) : filteredStaff.length === 0 ? (
                        <div
                            style={{
                                border: "1px solid #e5e7eb",
                                background: "#f9fafb",
                                color: "#4b5563",
                                borderRadius: "16px",
                                padding: "16px",
                                fontSize: "14px",
                                lineHeight: 1.6,
                            }}
                        >
                            По выбранному фильтру сотрудников нет.
                        </div>
                    ) : (
                        <div style={{ overflowX: "auto" }}>
                            <table
                                style={{
                                    width: "100%",
                                    borderCollapse: "collapse",
                                    fontSize: "14px",
                                }}
                            >
                                <thead>
                                    <tr style={{ background: "#f9fafb" }}>
                                        <th style={thStyle}>Имя</th>
                                        <th style={thStyle}>Email</th>
                                        <th style={thStyle}>Роль</th>
                                        <th style={thStyle}>Статус</th>
                                        <th style={thStyle}>Управление ролью</th>
                                        <th style={thStyle}>Действие</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStaff.map((item) => {
                                        const editable = canEditRole(item);
                                        const roleChanged = (roleDrafts[item.id] || item.role) !== item.role;
                                        const editableOptions = getEditableRoleOptions(item);

                                        return (
                                            <tr key={item.id}>
                                                <td style={tdStyle}>{item.fullName}</td>
                                                <td style={tdStyle}>{item.email}</td>
                                                <td style={tdStyle}>
                                                    {roleLabels[item.role] || item.role}
                                                </td>
                                                <td style={tdStyle}>
                                                    {item.isActive ? "Активен" : "Отключен"}
                                                </td>
                                                <td style={tdStyle}>
                                                    {editable ? (
                                                        <div
                                                            style={{
                                                                display: "flex",
                                                                gap: "8px",
                                                                alignItems: "center",
                                                                flexWrap: "wrap",
                                                            }}
                                                        >
                                                            <select
                                                                value={roleDrafts[item.id] || item.role}
                                                                onChange={(e) =>
                                                                    setRoleDrafts((prev) => ({
                                                                        ...prev,
                                                                        [item.id]: e.target.value,
                                                                    }))
                                                                }
                                                                style={smallSelectStyle}
                                                            >
                                                                {editableOptions.map((option) => (
                                                                    <option key={option.value} value={option.value}>
                                                                        {option.label}
                                                                    </option>
                                                                ))}
                                                            </select>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleSaveRole(item.id)}
                                                                disabled={roleLoadingId === item.id || !roleChanged}
                                                                style={{
                                                                    ...secondarySmallButtonStyle,
                                                                    cursor:
                                                                        roleLoadingId === item.id || !roleChanged
                                                                            ? "not-allowed"
                                                                            : "pointer",
                                                                    opacity:
                                                                        roleLoadingId === item.id || !roleChanged ? 0.6 : 1,
                                                                }}
                                                            >
                                                                {roleLoadingId === item.id ? "Сохранение..." : "Сохранить"}
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span
                                                            style={{
                                                                fontSize: "13px",
                                                                color: "#9ca3af",
                                                            }}
                                                        >
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                                <td style={tdStyle}>
                                                    {canDeactivateStaff(item) ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDeactivateStaff(item.id)}
                                                            disabled={actionLoadingId === item.id}
                                                            style={{
                                                                ...dangerButtonStyle,
                                                                cursor:
                                                                    actionLoadingId === item.id
                                                                        ? "not-allowed"
                                                                        : "pointer",
                                                            }}
                                                        >
                                                            {actionLoadingId === item.id
                                                                ? "Отключение..."
                                                                : "Отключить"}
                                                        </button>
                                                    ) : canRestoreStaff(item) ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRestoreStaff(item.id)}
                                                            disabled={actionLoadingId === item.id}
                                                            style={{
                                                                ...successButtonStyle,
                                                                cursor:
                                                                    actionLoadingId === item.id
                                                                        ? "not-allowed"
                                                                        : "pointer",
                                                            }}
                                                        >
                                                            {actionLoadingId === item.id
                                                                ? "Восстановление..."
                                                                : "Восстановить"}
                                                        </button>
                                                    ) : (
                                                        <span
                                                            style={{
                                                                fontSize: "13px",
                                                                color: "#9ca3af",
                                                            }}
                                                        >
                                                            —
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}

function getFilterButtonStyle(isActive: boolean): React.CSSProperties {
    return {
        height: "38px",
        borderRadius: "10px",
        border: isActive ? "none" : "1px solid #d1d5db",
        background: isActive ? "#2563eb" : "#ffffff",
        color: isActive ? "#ffffff" : "#111827",
        fontSize: "14px",
        fontWeight: 700,
        padding: "0 14px",
        cursor: "pointer",
    };
}

const thStyle: React.CSSProperties = {
    textAlign: "left",
    padding: "14px 12px",
    borderBottom: "1px solid #e5e7eb",
    color: "#374151",
    fontWeight: 700,
    fontSize: "13px",
};

const tdStyle: React.CSSProperties = {
    padding: "14px 12px",
    borderBottom: "1px solid #e5e7eb",
    color: "#111827",
};

const labelStyle: React.CSSProperties = {
    display: "block",
    marginBottom: "6px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#374151",
};

const inputStyle: React.CSSProperties = {
    width: "100%",
    height: "44px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    padding: "0 12px",
    fontSize: "14px",
    color: "#111827",
    outline: "none",
};

const smallSelectStyle: React.CSSProperties = {
    height: "36px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    padding: "0 10px",
    fontSize: "13px",
    color: "#111827",
};

const dangerButtonStyle: React.CSSProperties = {
    height: "36px",
    borderRadius: "10px",
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#b91c1c",
    fontSize: "13px",
    fontWeight: 700,
    padding: "0 12px",
};

const successButtonStyle: React.CSSProperties = {
    height: "36px",
    borderRadius: "10px",
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    color: "#166534",
    fontSize: "13px",
    fontWeight: 700,
    padding: "0 12px",
};

const secondarySmallButtonStyle: React.CSSProperties = {
    height: "36px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    background: "#ffffff",
    color: "#111827",
    fontSize: "13px",
    fontWeight: 700,
    padding: "0 12px",
};

const errorBoxStyle: React.CSSProperties = {
    marginTop: "12px",
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#b91c1c",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "14px",
    lineHeight: 1.5,
};

const successBoxStyle: React.CSSProperties = {
    marginTop: "12px",
    border: "1px solid #bbf7d0",
    background: "#f0fdf4",
    color: "#166534",
    borderRadius: "12px",
    padding: "12px 14px",
    fontSize: "14px",
    lineHeight: 1.5,
};
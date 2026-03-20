"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ProtectedLayoutProps = {
    children: ReactNode;
};

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
    const router = useRouter();
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        async function checkAuth() {
            try {
                const res = await fetch("/api/auth/me", {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                });

                const data = await res.json();

                if (!res.ok || !data.success) {
                    router.replace("/login");
                    return;
                }

                setAuthLoading(false);
            } catch {
                router.replace("/login");
            }
        }

        checkAuth();
    }, [router]);

    if (authLoading) {
        return (
            <main
                style={{
                    width: "100vw",
                    height: "100vh",
                    minHeight: "100vh",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                        "linear-gradient(135deg, rgba(246,185,129,0.34) 0%, rgba(201,235,214,0.32) 100%)",
                }}
            >
                <div style={{ fontSize: "18px", color: "#374151" }}>
                    Проверка доступа...
                </div>
            </main>
        );
    }

    return <>{children}</>;
}
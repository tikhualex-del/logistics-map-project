export function isAuthenticated() {
  if (typeof window === "undefined") return false;

  const raw = localStorage.getItem("auth");
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw);
    return !!parsed;
  } catch {
    return false;
  }
}
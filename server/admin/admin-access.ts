const DEFAULT_ADMIN_EMAILS = ["tikhualex@gmail.com"];

export function getAllowedAdminEmails() {
  const raw = process.env.ADMIN_EMAILS?.trim();

  if (!raw) {
    return DEFAULT_ADMIN_EMAILS;
  }

  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  return getAllowedAdminEmails().includes(normalizedEmail);
}
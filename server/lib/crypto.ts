import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

function getKey() {
  const secret = process.env.ENCRYPTION_SECRET;

  if (!secret) {
    throw new Error("ENCRYPTION_SECRET is not set");
  }

  return crypto.createHash("sha256").update(secret).digest();
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey();

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  return iv.toString("hex") + ":" + encrypted;
}

export function decrypt(text: string): string {
  if (!text || typeof text !== "string") {
    throw new Error("Encrypted text is empty");
  }

  const parts = text.split(":");

  if (parts.length !== 2) {
    throw new Error("Encrypted text has invalid format");
  }

  const [ivHex, encrypted] = parts;

  if (!ivHex || !encrypted) {
    throw new Error("Encrypted text is incomplete");
  }

  const iv = Buffer.from(ivHex, "hex");

  if (iv.length !== IV_LENGTH) {
    throw new Error("Encrypted text has invalid IV");
  }

  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
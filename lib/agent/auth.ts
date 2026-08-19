import { randomBytes, createHash } from "node:crypto";

// Device auth is a bearer API key, not Supabase Auth — the desktop agent
// has no browser session/cookies. The key is shown to the user exactly
// once (at pairing time); only its SHA-256 hash is ever stored
// (devices.api_key_hash), same principle as a password hash.

const PAIRING_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I — avoids transcription errors
const PAIRING_CODE_LENGTH = 8;
const PAIRING_CODE_TTL_MINUTES = 10;

export function generatePairingCode(): { code: string; expiresAt: string } {
  const bytes = randomBytes(PAIRING_CODE_LENGTH);
  const code = Array.from(bytes, (b) => PAIRING_CODE_ALPHABET[b % PAIRING_CODE_ALPHABET.length]).join("");
  const expiresAt = new Date(Date.now() + PAIRING_CODE_TTL_MINUTES * 60_000).toISOString();
  return { code, expiresAt };
}

export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = `wpa_${randomBytes(32).toString("hex")}`; // wpa = Work Pulse Agent
  return { raw, hash: hashApiKey(raw), prefix: raw.slice(0, 12) };
}

export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export function extractBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader?.startsWith("Bearer ")) return null;
  const token = authorizationHeader.slice("Bearer ".length).trim();
  return token || null;
}

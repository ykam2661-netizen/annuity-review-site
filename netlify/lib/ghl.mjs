import crypto from "node:crypto";

const BASE = "https://services.leadconnectorhq.com";
export const env = (k) => (globalThis.Netlify?.env?.get(k) ?? process.env[k] ?? "").trim();

export function cfg() {
  return {
    token: env("GHL_TOKEN"),
    locationId: env("GHL_LOCATION_ID"),
    calendarId: env("GHL_CALENDAR_ID"),
    tag: env("GHL_LEAD_TAG") || "annuity lead",
    secret: env("TOKEN_SECRET") || crypto.createHash("sha256").update("ncr:" + env("GHL_TOKEN")).digest("hex"),
  };
}

export async function ghl(path, { method = "GET", body, version = "2021-07-28" } = {}) {
  const c = cfg();
  const res = await fetch(BASE + path, {
    method,
    headers: {
      Authorization: `Bearer ${c.token}`,
      Version: version,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) console.error(`GHL ${method} ${path} -> ${res.status}`, text.slice(0, 500));
  return { ok: res.ok, status: res.status, data };
}

export const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

// Signed, expiring token that ties the booking step to the contact we created.
export function signToken(contactId, hours = 72) {
  const exp = Math.floor(Date.now() / 1000) + hours * 3600;
  const payload = `${contactId}.${exp}`;
  const sig = crypto.createHmac("sha256", cfg().secret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function readToken(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  const [id, exp, sig] = parts;
  const good = crypto.createHmac("sha256", cfg().secret).update(`${id}.${exp}`).digest("base64url");
  if (sig.length !== good.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  return id;
}

export function toE164(phone) {
  const d = String(phone || "").replace(/\D/g, "");
  if (d.length === 10) return "+1" + d;
  if (d.length === 11 && d[0] === "1") return "+" + d;
  return null;
}

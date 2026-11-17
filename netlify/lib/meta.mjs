import crypto from "node:crypto";
import { env } from "./ghl.mjs";

// Value Meta optimizes on, by investable-assets answer. More assets = higher value.
// "Under $100k" is disqualified and never reaches Meta.
export const TIERS = {
  "$100k – $250k": { tier: 1, value: 100 },
  "$250k – $500k": { tier: 2, value: 250 },
  "$500k – $1M": { tier: 3, value: 500 },
  "$1M – $1.5M": { tier: 4, value: 1000 },
  "Over $1.5M": { tier: 5, value: 1500 },
};
export const TIER_VALUES = { 0: 50, 1: 100, 2: 250, 3: 500, 4: 1000, 5: 1500 };
export const tierFor = (savings) => TIERS[savings]?.tier ?? 0;
export const valueFor = (tier) => TIER_VALUES[tier] ?? TIER_VALUES[0];

const sha = (v) => (v ? crypto.createHash("sha256").update(String(v).trim().toLowerCase()).digest("hex") : undefined);

function cookie(req, name) {
  const m = (req.headers.get("cookie") || "").match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[1]) : undefined;
}

// Everything Meta needs to match the event to a person, hashed where Meta requires it.
export function userData(req, { email, phone, firstName, lastName, externalId, fbclid, fbclidAt }) {
  let fbc = cookie(req, "_fbc");
  if (!fbc && fbclid) fbc = `fb.1.${fbclidAt || Date.now()}.${fbclid}`;
  return {
    em: email ? [sha(email)] : undefined,
    ph: phone ? [sha(String(phone).replace(/\D/g, ""))] : undefined,
    fn: firstName ? [sha(firstName)] : undefined,
    ln: lastName ? [sha(lastName)] : undefined,
    country: [sha("us")],
    external_id: externalId ? [sha(externalId)] : undefined,
    client_ip_address: req.headers.get("x-nf-client-connection-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
    client_user_agent: req.headers.get("user-agent") || undefined,
    fbp: cookie(req, "_fbp"),
    fbc,
  };
}

// Sends one server-side event. Same event_id as the browser Pixel so Meta de-duplicates them.
export async function sendEvent(req, { eventName, eventId, value, user, sourceUrl }) {
  const pixelId = env("META_PIXEL_ID");
  const token = env("META_CAPI_TOKEN");
  if (!pixelId || !token || !eventId) return { skipped: true };
  const body = {
    data: [{
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: "website",
      event_source_url: sourceUrl || req.headers.get("referer") || "https://chapterretire.cc/",
      user_data: user,
      custom_data: { value, currency: "USD", content_name: "Free Retirement Review" },
    }],
  };
  const test = env("META_TEST_EVENT_CODE");
  if (test) body.test_event_code = test;
  try {
    const r = await fetch(`https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const t = await r.text();
    if (!r.ok) console.error(`CAPI ${eventName} -> ${r.status}`, t.slice(0, 400));
    else console.log(`CAPI ${eventName} ok`, t.slice(0, 200));
    return { ok: r.ok };
  } catch (e) {
    console.error(`CAPI ${eventName} failed`, e?.message);
    return { ok: false };
  }
}

import crypto from "node:crypto";
import { env } from "./ghl.mjs";

// Values Meta optimizes on. A booked call is worth far more than a filled application,
// and a closed client is worth the most. More investable assets = higher value at each step.
// "Under $100k" is disqualified and never reaches Meta.
export const TIERS = {
  "$100k – $250k": 1,
  "$250k – $500k": 2,
  "$500k – $1M": 3,
  "$1M – $1.5M": 4,
  "Over $1.5M": 5,
};
export const VALUES = {
  //            tier: 0(unknown) 1      2      3      4      5
  application: [25,           25,    50,    100,   150,   200],
  schedule:    [250,          250,   500,   1000,  1500,  2000],
};
export const CLOSE_VALUE = 5000;
export const tierFor = (savings) => TIERS[savings] ?? 0;
export const valueFor = (tier, kind = "application") => (VALUES[kind] || VALUES.application)[tier] ?? VALUES[kind][0];

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
export async function sendEvent(req, { eventName, eventId, value, user, sourceUrl, actionSource = "website" }) {
  const pixelId = env("META_PIXEL_ID");
  const token = env("META_CAPI_TOKEN");
  if (!pixelId || !token || !eventId) return { skipped: true };
  const body = {
    data: [{
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: eventId,
      action_source: actionSource,
      event_source_url: actionSource === "website" ? (sourceUrl || req.headers.get("referer") || "https://chapterretire.cc/") : undefined,
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

import { cfg, ghl, json } from "../lib/ghl.mjs";

export const config = { path: "/api/slots" };

const validTz = (tz) => { try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; } catch { return false; } };

export default async (req) => {
  const c = cfg();
  if (!c.token || !c.calendarId) return json({ ok: false, error: "not_configured" }, 500);
  const url = new URL(req.url);
  let tz = url.searchParams.get("tz") || "America/New_York";
  if (!validTz(tz)) tz = "America/New_York";

  const start = Date.now() + 60 * 60 * 1000; // at least 1 hour out
  const end = start + 14 * 24 * 60 * 60 * 1000;
  const r = await ghl(`/calendars/${c.calendarId}/free-slots?startDate=${start}&endDate=${end}&timezone=${encodeURIComponent(tz)}`, { version: "2021-04-15" });
  if (!r.ok) return json({ ok: false, error: "ghl_slots" }, 502);

  const days = Object.keys(r.data)
    .filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k))
    .sort()
    .map((date) => ({ date, slots: (r.data[date]?.slots || []).filter((s) => new Date(s).getTime() > start) }))
    .filter((d) => d.slots.length)
    .slice(0, 5);

  return json({ ok: true, tz, days });
};

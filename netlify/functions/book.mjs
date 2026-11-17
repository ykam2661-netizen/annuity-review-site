import { cfg, ghl, json, readToken } from "../lib/ghl.mjs";

export const config = { path: "/api/book" };

const OPEN = ["Yes", "Depends on the Advisor", "No"];

export default async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "method" }, 405);
  let b;
  try { b = await req.json(); } catch { return json({ ok: false, error: "bad_json" }, 400); }

  const contactId = readToken(b.token);
  if (!contactId) return json({ ok: false, error: "bad_token" }, 401);
  const startMs = Date.parse(b.start);
  if (!startMs || startMs < Date.now()) return json({ ok: false, error: "bad_time" }, 400);
  const open = OPEN.includes(b.open) ? b.open : "";

  const c = cfg();
  if (!c.token || !c.calendarId || !c.locationId) return json({ ok: false, error: "not_configured" }, 500);

  const r = await ghl("/calendars/events/appointments", {
    method: "POST",
    version: "2021-04-15",
    body: {
      calendarId: c.calendarId,
      locationId: c.locationId,
      contactId,
      startTime: b.start,
      title: "Free Retirement Review",
      appointmentStatus: "confirmed",
      toNotify: true,
    },
  });

  const id = r.data?.id || r.data?.appointment?.id || r.data?.event?.id;
  if (!r.ok || !id) {
    const msg = JSON.stringify(r.data || {}).toLowerCase();
    if (msg.includes("slot") || msg.includes("available")) return json({ ok: false, error: "taken" }, 409);
    return json({ ok: false, error: "ghl_book" }, 502);
  }

  if (open) {
    await ghl(`/contacts/${contactId}/notes`, { method: "POST", body: { body: `Booked Free Retirement Review.\n• Open to discussing annuities: ${open}` } });
  }

  return json({ ok: true, confirmed: true, appointmentId: id, start: b.start });
};

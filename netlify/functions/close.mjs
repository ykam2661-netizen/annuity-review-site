import { env, ghl, json } from "../lib/ghl.mjs";
import { STAGE_EVENTS, userData, sendEvent } from "../lib/meta.mjs";

// Called by GHL workflow webhooks when an opportunity moves stage in the Marketing Pipeline.
//   Follow up Call -> https://chapterretire.cc/api/close?key=<CLOSE_WEBHOOK_KEY>&stage=followup  (Lead, $2,500)
//   Closed Client  -> https://chapterretire.cc/api/close?key=<CLOSE_WEBHOOK_KEY>&stage=closed    (Purchase, $5,000)
// Events go to Meta through the Conversions API, matched by the contact's email, phone, name and contact ID.
export const config = { path: "/api/close" };

export default async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "method" }, 405);
  const url = new URL(req.url);
  const key = env("CLOSE_WEBHOOK_KEY");
  if (!key || url.searchParams.get("key") !== key) return json({ ok: false, error: "unauthorized" }, 401);
  const stage = url.searchParams.get("stage") || "closed";
  const ev = STAGE_EVENTS[stage];
  if (!ev) return json({ ok: false, error: "unknown_stage" }, 400);

  let b = {};
  try { b = await req.json(); } catch {}
  const contactId = b.contact_id || b.contactId || b.contact?.id || "";
  if (!contactId) return json({ ok: false, error: "no_contact" }, 400);

  // Pull the contact from GHL so matching data is complete even if the webhook payload is thin.
  const ct = (await ghl(`/contacts/${contactId}`)).data?.contact || {};

  const r = await sendEvent(req, {
    eventName: ev.event,
    eventId: `${stage}-${contactId}`, // one per contact per stage; repeated webhooks are de-duplicated by Meta
    value: ev.value,
    actionSource: "system_generated",
    user: userData(new Request(req.url), {
      email: ct.email || b.email, phone: ct.phone || b.phone,
      firstName: ct.firstName || b.first_name, lastName: ct.lastName || b.last_name, externalId: contactId,
    }),
  });

  await ghl(`/contacts/${contactId}/notes`, { method: "POST", body: { body: `${ev.label}: ${ev.event} event worth $${ev.value} sent to Meta.` } });
  return json({ ok: true, stage, event: ev.event, value: ev.value, sent: !!r.ok });
};

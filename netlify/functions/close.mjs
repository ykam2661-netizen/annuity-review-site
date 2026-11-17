import { env, ghl, json } from "../lib/ghl.mjs";
import { CLOSE_VALUE, userData, sendEvent } from "../lib/meta.mjs";

// Called by a GHL workflow webhook when a client closes.
// URL: https://chapterretire.cc/api/close?key=<CLOSE_WEBHOOK_KEY>
// Sends a Purchase event worth $5,000 to Meta through the Conversions API.
export const config = { path: "/api/close" };

export default async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "method" }, 405);
  const key = env("CLOSE_WEBHOOK_KEY");
  if (!key || new URL(req.url).searchParams.get("key") !== key) return json({ ok: false, error: "unauthorized" }, 401);

  let b = {};
  try { b = await req.json(); } catch {}
  const contactId = b.contact_id || b.contactId || b.contact?.id || "";
  if (!contactId) return json({ ok: false, error: "no_contact" }, 400);

  // Pull the contact from GHL so matching data is complete even if the webhook payload is thin.
  const ct = (await ghl(`/contacts/${contactId}`)).data?.contact || {};
  const email = ct.email || b.email;
  const phone = ct.phone || b.phone;

  const r = await sendEvent(req, {
    eventName: "Purchase",
    eventId: `close-${contactId}`, // one close per contact, repeated webhooks are de-duplicated by Meta
    value: CLOSE_VALUE,
    actionSource: "system_generated",
    user: userData(new Request(req.url), { email, phone, firstName: ct.firstName || b.first_name, lastName: ct.lastName || b.last_name, externalId: contactId }),
  });

  await ghl(`/contacts/${contactId}/notes`, { method: "POST", body: { body: `Closed client: Purchase event worth $${CLOSE_VALUE} sent to Meta.` } });
  return json({ ok: true, sent: !!r.ok, value: CLOSE_VALUE });
};

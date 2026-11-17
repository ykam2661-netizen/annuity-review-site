import { cfg, ghl, json, signToken, toE164 } from "../lib/ghl.mjs";

export const config = { path: "/api/lead" };

const LABELS = { retired: "Currently retired", worry: "Biggest retirement worry", savings: "Retirement savings", timeline: "Decision timeline" };

export default async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "method" }, 405);
  let b;
  try { b = await req.json(); } catch { return json({ ok: false, error: "bad_json" }, 400); }

  // Honeypot: bots fill the hidden "company" field. Pretend success, save nothing.
  if (b.company) return json({ ok: true, token: "" });

  const name = String(b.fullName || "").trim().replace(/\s+/g, " ").slice(0, 120);
  const email = String(b.email || "").trim().toLowerCase().slice(0, 200);
  const phone = toE164(b.phone);
  if (!name || !phone || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false, error: "invalid" }, 400);

  const c = cfg();
  if (!c.token || !c.locationId) return json({ ok: false, error: "not_configured" }, 500);

  const [firstName, ...rest] = name.split(" ");
  const answers = b.answers && typeof b.answers === "object" ? b.answers : {};
  const attr = b.attribution && typeof b.attribution === "object" ? b.attribution : {};

  const up = await ghl("/contacts/upsert", {
    method: "POST",
    body: {
      locationId: c.locationId,
      firstName,
      lastName: rest.join(" "),
      name,
      email,
      phone,
      timezone: typeof b.tz === "string" ? b.tz.slice(0, 60) : undefined,
      source: "Next Chapter Retirement - Annuity Review Site",
      tags: [c.tag],
    },
  });
  const contactId = up.data?.contact?.id;
  if (!up.ok || !contactId) return json({ ok: false, error: "ghl_contact" }, 502);

  // Make sure the tag is added even if the contact already existed.
  await ghl(`/contacts/${contactId}/tags`, { method: "POST", body: { tags: [c.tag] } });

  const lines = ["Annuity Review survey answers:"];
  for (const k of Object.keys(LABELS)) if (answers[k]) lines.push(`• ${LABELS[k]}: ${String(answers[k]).slice(0, 120)}`);
  const attrLines = Object.entries(attr).filter(([, v]) => v).map(([k, v]) => `• ${k}: ${String(v).slice(0, 300)}`);
  if (attrLines.length) lines.push("", "Attribution:", ...attrLines);
  await ghl(`/contacts/${contactId}/notes`, { method: "POST", body: { body: lines.join("\n") } });

  return json({ ok: true, token: signToken(contactId) });
};

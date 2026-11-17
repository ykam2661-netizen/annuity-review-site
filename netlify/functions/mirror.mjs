import { getStore } from "@netlify/blobs";
export const config = { path: "/api/mirror-once" };
const FILES = ["agent.jpeg", "favicon.ico", ...["allianz","athene","american-equity","north-american","nationwide","pacific-life","protective","midland-national","global-atlantic","lincoln"].map(n => `carriers/${n}.png`)];
export default async () => {
  const store = getStore("mirror");
  const out = {};
  for (const f of FILES) {
    const r = await fetch(`https://chapterretire.cc/assets/${f}`);
    const buf = await r.arrayBuffer();
    if (r.ok) await store.set(f.replace("/", "__"), buf);
    out[f] = [r.status, buf.byteLength];
  }
  return Response.json(out);
};

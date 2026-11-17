/* Tracking + small helpers shared by every page (window.NCR). */
(function () {
  var C = window.FUNNEL || {};
  var params = new URLSearchParams(location.search);
  var NCR = window.NCR = {};
  NCR.preview = params.get("preview") === "1";

  NCR.ss = {
    get: function (k) { try { return sessionStorage.getItem(k) || ""; } catch (e) { return ""; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };

  NCR.uuid = function () {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
  };

  // Keep UTM / click IDs from the landing URL for the whole session so they reach GHL.
  var keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"];
  keys.forEach(function (k) { var v = params.get(k); if (v) NCR.ss.set("ncr_" + k, v); });
  if (params.get("fbclid")) NCR.ss.set("ncr_fbclidAt", String(Date.now()));
  NCR.attribution = function () {
    var o = {}; keys.forEach(function (k) { var v = NCR.ss.get("ncr_" + k); if (v) o[k] = v; });
    if (o.fbclid) o.fbclidAt = Number(NCR.ss.get("ncr_fbclidAt")) || undefined;
    o.landingPage = NCR.ss.get("ncr_landing") || location.href.split("?")[0];
    return o;
  };
  if (!NCR.ss.get("ncr_landing")) NCR.ss.set("ncr_landing", location.href.split("?")[0]);

  NCR.post = function (url, body) {
    return fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, status: r.status, data: d || {} }; }); })
      .catch(function () { return { ok: false, status: 0, data: {} }; });
  };

  // Meta Pixel
  // Pages that set window.NCR_NO_PIXEL (the disqualified page) never load the pixel.
  if (C.metaPixelId && !NCR.preview && !window.NCR_NO_PIXEL) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    fbq("init", C.metaPixelId);
    fbq("track", "PageView");
  }
  // Browser event; the server sends the same event_id through the Conversions API so Meta de-duplicates.
  NCR.pixel = function (name, eventId, data) { if (window.fbq) fbq("track", name, data || {}, { eventID: eventId }); };
  NCR.event = function (name, data) { if (window.fbq) fbq("trackCustom", name, data || {}); };
})();

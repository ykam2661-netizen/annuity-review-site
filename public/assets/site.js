/* Shared header, footer and carrier strip. All text comes from config.js. */
(function () {
  var C = window.FUNNEL, y = new Date().getFullYear();
  var esc = function (s) { var d = document.createElement("div"); d.textContent = s; return d.innerHTML; };
  var flag = '<svg class="ncr-flag" viewBox="0 0 38 24" aria-hidden="true"><rect width="38" height="24" fill="#FFF"/><path d="M0 0h38v1.85H0zM0 3.69h38v1.85H0zM0 7.38h38v1.85H0zM0 11.08h38v1.85H0zM0 14.77h38v1.85H0zM0 18.46h38v1.85H0zM0 22.15h38V24H0z" fill="#B22234"/><rect width="15.2" height="12.92" fill="#3C3B6E"/><g fill="#FFF"><circle cx="2.5" cy="2.3" r=".75"/><circle cx="6.1" cy="2.3" r=".75"/><circle cx="9.7" cy="2.3" r=".75"/><circle cx="13.3" cy="2.3" r=".75"/><circle cx="4.3" cy="4.9" r=".75"/><circle cx="7.9" cy="4.9" r=".75"/><circle cx="11.5" cy="4.9" r=".75"/><circle cx="2.5" cy="7.5" r=".75"/><circle cx="6.1" cy="7.5" r=".75"/><circle cx="9.7" cy="7.5" r=".75"/><circle cx="13.3" cy="7.5" r=".75"/><circle cx="4.3" cy="10.1" r=".75"/><circle cx="7.9" cy="10.1" r=".75"/><circle cx="11.5" cy="10.1" r=".75"/></g></svg>';
  var top = document.getElementById("site-header");
  if (top) top.innerHTML = '<header class="ncr-bar"><div class="ncr-inner"><div class="ncr-brand"><svg class="ncr-mark" viewBox="0 0 40 40" aria-hidden="true"><path d="M14 20a6 6 0 0 1 12 0"/><path d="M20 9.5v2.5M12.6 12.6l1.8 1.8M27.4 12.6l-1.8 1.8M9 20h2.5M28.5 20H31"/><path d="M20 24.5c-3.5-2-8-2.3-12-1.2v9.5c4-1.1 8.5-.8 12 1.2 3.5-2 8-2.3 12-1.2v-9.5c-4-1.1-8.5-.8-12 1.2Z"/><path d="M20 24.5V34"/></svg><div class="ncr-lockup"><span class="ncr-name">' + esc(C.brand) + '</span><span class="ncr-by">Operated by <b>' + esc(C.legalEntity) + '</b></span></div></div><span class="ncr-badge">' + flag + 'American Owned</span></div><div class="ncr-progress"><i></i></div></header>';
  var foot = document.getElementById("site-footer");
  if (foot) foot.innerHTML = '<footer class="foot"><div class="foot-in">' +
    '<p>Annuities are insurance products. They are not bank deposits and are not FDIC or NCUA insured. All guarantees are backed by the financial strength and claims-paying ability of the issuing insurance company. This site is for general educational and informational purposes only and does not constitute financial, investment, legal, or tax advice. Consult a properly licensed professional before making any financial decisions.</p>' +
    '<p>© ' + y + ' ' + esc(C.brand) + ', operated by ' + esc(C.legalEntity) + ', ' + esc(C.entityState) + '. ' + esc(C.legalEntity) + ' is a marketing service that connects consumers with licensed insurance agents. We are not an insurance company and do not issue annuities. Information you submit may be shared with licensed agents. Annuities are insurance products. They are not bank deposits and are not FDIC insured. Guarantees are backed by the financial strength and claims-paying ability of the issuing insurer. Not affiliated with any government agency.</p>' +
    '<p class="tight">Insurance company names and logos are trademarks of their respective owners. Showing them does not mean any carrier endorses or is affiliated with us.</p>' +
    '<p class="tight">Questions? Email <u>' + esc(C.email) + '</u> or call <u>' + esc(C.phone) + '</u><br>' + esc(C.legalEntity) + ' · ' + esc(C.address) + '</p>' +
    '<p class="copy">© ' + y + ' ' + esc(C.brand) + ', operated by ' + esc(C.legalEntity) + ' | <a href="' + esc(C.privacyUrl) + '">Privacy Policy</a> | <a href="' + esc(C.termsUrl) + '">Terms of Use</a> | <a href="' + esc(C.disclaimerUrl) + '">Disclaimer</a></p></div></footer>';
  document.querySelectorAll("[data-c]").forEach(function (e) { e.textContent = C[e.dataset.c]; });
  document.querySelectorAll("[data-href]").forEach(function (e) { e.href = C[e.dataset.href]; });
  var track = document.getElementById("carrier-track");
  if (track) {
    var li = C.carriers.map(function (c) { return '<li><img loading="lazy" decoding="async" src="assets/carriers/' + c[0] + '.png" alt="' + esc(c[1]) + '" width="' + c[2] + '" height="' + c[3] + '"></li>'; }).join("");
    track.innerHTML = "<ul>" + li + '</ul><ul aria-hidden="true">' + li.replace(/alt="[^"]*"/g, 'alt=""') + "</ul>";
  }
})();

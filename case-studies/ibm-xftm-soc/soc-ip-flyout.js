/* IP reputation flyout for SOC prototype */
(function () {
  var SCORE_LABELS = {
    low: "Low risk",
    medium: "Moderate risk",
    high: "High risk",
    critical: "Critical risk",
  };

  /** @type {Record<string, Array<{author: string, time: string, text: string}>>} */
  var commentsByIp = {};

  function scoreTier(score) {
    var n = Number(score) || 0;
    if (n >= 9) return "critical";
    if (n >= 7) return "high";
    if (n >= 4) return "medium";
    return "low";
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function vendorIntel(score) {
    var n = Math.max(1, Math.min(10, Number(score) || 1));
    var vtMalicious = Math.min(
      94,
      Math.round(n <= 2 ? 0 : n <= 3 ? 1 : (n / 10) * 22 + (n >= 8 ? 4 : 0))
    );
    var ipvoidHits = Math.min(
      45,
      Math.round(n <= 2 ? 0 : n <= 4 ? n - 2 : (n / 10) * 16 + (n >= 8 ? 3 : 0))
    );
    var xforce = n;
    var xforceCats =
      n >= 9
        ? "Malware, Botnet, Spam"
        : n >= 7
          ? "Anonymization, Spam"
          : n >= 4
            ? "Suspicious"
            : "Clean";

    return {
      vtMalicious: vtMalicious,
      vtTotal: 94,
      vtHarmless: Math.max(0, 94 - vtMalicious - Math.round(n * 0.4)),
      ipvoidHits: ipvoidHits,
      ipvoidTotal: 45,
      xforce: xforce,
      xforceCats: xforceCats,
      xforceConfidence: n >= 7 ? "High" : n >= 4 ? "Medium" : "Low",
    };
  }

  function sourceTier(hits, total) {
    var ratio = total ? hits / total : 0;
    if (ratio >= 0.25 || hits >= 12) return "critical";
    if (ratio >= 0.12 || hits >= 6) return "high";
    if (ratio > 0 || hits >= 1) return "medium";
    return "low";
  }

  function seedComments(ip, score, notes) {
    if (commentsByIp[ip]) return commentsByIp[ip];

    var n = Number(score) || 1;
    var seeded = [];

    if (notes) {
      seeded.push({
        author: "ATDS",
        time: "May 28 · 07:54",
        text: notes,
      });
    }

    if (n <= 3) {
      seeded.push({
        author: "Sam Taylor",
        time: "May 12 · 14:22",
        text: "Previously associated with approved IT automation. Low outbound risk from this host.",
      });
      seeded.push({
        author: "Alex Johnson",
        time: "May 28 · 08:16",
        text: "Matches closed case SOCJ233244 pattern. Prefer associate over escalate unless new IOCs appear.",
      });
    } else if (n <= 6) {
      seeded.push({
        author: "Sam Taylor",
        time: "May 28 · 08:05",
        text: "Mixed reputation hosting range. Correlated with concurrent session anomaly — keep monitoring.",
      });
    } else if (n <= 8) {
      seeded.push({
        author: "Sam Taylor",
        time: "May 28 · 08:12",
        text: "VPN / anonymizer indicators. Check impossible-travel distance against prior successful login.",
      });
      seeded.push({
        author: "Alex Johnson",
        time: "May 28 · 08:19",
        text: "Recommend enrichment against recent phishing infra lists before closing related alerts.",
      });
    } else {
      seeded.push({
        author: "Sam Taylor",
        time: "May 28 · 06:52",
        text: "High-confidence malicious hosting. Block at edge and preserve evidence for case notes.",
      });
      seeded.push({
        author: "Alex Johnson",
        time: "May 28 · 07:08",
        text: "X-Force + VT aligned on elevated risk. Do not whitelist without manager approval.",
      });
    }

    commentsByIp[ip] = seeded;
    return seeded;
  }

  function formatNow() {
    var d = new Date();
    var months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    var hh = String(d.getHours()).padStart(2, "0");
    var mm = String(d.getMinutes()).padStart(2, "0");
    return months[d.getMonth()] + " " + d.getDate() + " · " + hh + ":" + mm;
  }

  function renderComments(list) {
    if (!list.length) {
      return '<p class="soc-flyout__empty">No analyst comments yet.</p>';
    }

    return (
      '<ul class="soc-ip-comments">' +
      list
        .map(function (item) {
          return (
            '<li class="soc-ip-comment">' +
            '<div class="soc-ip-comment__meta">' +
            "<strong>" +
            escapeHtml(item.author) +
            "</strong>" +
            "<time>" +
            escapeHtml(item.time) +
            "</time>" +
            "</div>" +
            "<p>" +
            escapeHtml(item.text) +
            "</p>" +
            "</li>"
          );
        })
        .join("") +
      "</ul>"
    );
  }

  function bindCommentForm(panel, ip) {
    var form = panel.querySelector("[data-soc-ip-comment-form]");
    var listEl = panel.querySelector("[data-soc-ip-comments]");
    var input = panel.querySelector("[data-soc-ip-comment-input]");
    if (!form || !listEl || !input) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var text = input.value.trim();
      if (!text) return;

      if (!commentsByIp[ip]) commentsByIp[ip] = [];
      commentsByIp[ip].push({
        author: "Alex Johnson",
        time: formatNow(),
        text: text,
      });

      listEl.innerHTML = renderComments(commentsByIp[ip]);
      input.value = "";
      input.focus();
      listEl.scrollTop = listEl.scrollHeight;
    });
  }

  function ensureFlyout() {
    var existing = document.getElementById("soc-ip-flyout");
    if (existing) return existing;

    var backdrop = document.createElement("div");
    backdrop.className = "soc-flyout-backdrop";
    backdrop.hidden = true;
    backdrop.setAttribute("data-soc-ip-backdrop", "");

    var panel = document.createElement("aside");
    panel.id = "soc-ip-flyout";
    panel.className = "soc-flyout";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "soc-ip-flyout-title");
    panel.innerHTML =
      '<div class="soc-flyout__head">' +
      '<div class="soc-flyout__titles">' +
      '<p class="soc-flyout__label">IP reputation</p>' +
      '<h2 id="soc-ip-flyout-title" class="soc-flyout__title"></h2>' +
      "</div>" +
      '<button type="button" class="soc-flyout__close" aria-label="Close IP details">' +
      '<svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">' +
      '<path d="M17.414 16 24 9.414 22.586 8 16 14.586 9.414 8 8 9.414 14.586 16 8 22.586 9.414 24 16 17.414 22.586 24 24 22.586 17.414 16z"/>' +
      "</svg>" +
      "</button>" +
      "</div>" +
      '<div class="soc-flyout__body" data-soc-ip-body></div>';

    document.body.appendChild(backdrop);
    document.body.appendChild(panel);

    backdrop.addEventListener("click", function (event) {
      event.preventDefault();
      closeFlyout();
    });

    panel.querySelector(".soc-flyout__close").addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      closeFlyout();
    });

    panel.addEventListener("click", function (event) {
      event.stopPropagation();
    });

    return panel;
  }

  function closeFlyout() {
    var panel = document.getElementById("soc-ip-flyout");
    var backdrop = document.querySelector("[data-soc-ip-backdrop]");
    if (panel) {
      panel.hidden = true;
      panel.classList.remove("is-open");
    }
    if (backdrop) {
      backdrop.hidden = true;
      backdrop.classList.remove("is-open");
    }
    document.body.classList.remove("soc-flyout-open");
  }

  function openFlyout(btn) {
    var panel = ensureFlyout();
    var backdrop = document.querySelector("[data-soc-ip-backdrop]");
    var body = panel.querySelector("[data-soc-ip-body]");
    var title = panel.querySelector("#soc-ip-flyout-title");

    var ip = btn.getAttribute("data-ip") || btn.textContent.trim();
    var country = btn.getAttribute("data-country") || "Unknown";
    var flag = btn.getAttribute("data-flag") || "";
    var score = btn.getAttribute("data-score") || "1";
    var asn = btn.getAttribute("data-asn") || "—";
    var org = btn.getAttribute("data-org") || "—";
    var type = btn.getAttribute("data-type") || "—";
    var firstSeen = btn.getAttribute("data-first-seen") || "—";
    var lastSeen = btn.getAttribute("data-last-seen") || "—";
    var categories = btn.getAttribute("data-categories") || "—";
    var notes = btn.getAttribute("data-notes") || "";
    var tier = scoreTier(score);
    var vendors = vendorIntel(score);
    var vtTier = sourceTier(vendors.vtMalicious, vendors.vtTotal);
    var ipvoidTier = sourceTier(vendors.ipvoidHits, vendors.ipvoidTotal);
    var xfTier = scoreTier(vendors.xforce);
    var comments = seedComments(ip, score, notes);

    title.textContent = ip;

    body.innerHTML =
      '<div class="soc-flyout__score-row">' +
      '<span class="soc-ip-score soc-ip-score--' +
      tier +
      '">' +
      escapeHtml(score) +
      "/10</span>" +
      '<span class="soc-flyout__score-label">' +
      SCORE_LABELS[tier] +
      " · aggregated · 10 is most dangerous</span>" +
      "</div>" +
      '<section class="soc-flyout__sources" aria-label="Reputation by source">' +
      "<h3>Reputation by source</h3>" +
      '<ul class="soc-rep-sources">' +
      '<li class="soc-rep-source">' +
      '<div class="soc-rep-source__head">' +
      "<strong>VirusTotal</strong>" +
      '<span class="soc-ip-score soc-ip-score--' +
      vtTier +
      '">' +
      vendors.vtMalicious +
      "/" +
      vendors.vtTotal +
      "</span>" +
      "</div>" +
      '<p class="soc-rep-source__meta">' +
      vendors.vtMalicious +
      " malicious · " +
      vendors.vtHarmless +
      " harmless · " +
      (vendors.vtTotal - vendors.vtMalicious - vendors.vtHarmless) +
      " undetected</p>" +
      '<p class="soc-rep-source__detail">Community and AV engine detections for this IP.</p>' +
      "</li>" +
      '<li class="soc-rep-source">' +
      '<div class="soc-rep-source__head">' +
      "<strong>IPVoid</strong>" +
      '<span class="soc-ip-score soc-ip-score--' +
      ipvoidTier +
      '">' +
      vendors.ipvoidHits +
      "/" +
      vendors.ipvoidTotal +
      "</span>" +
      "</div>" +
      '<p class="soc-rep-source__meta">' +
      vendors.ipvoidHits +
      " blacklist hits of " +
      vendors.ipvoidTotal +
      " checked</p>" +
      '<p class="soc-rep-source__detail">Aggregated blacklist / DNSBL reputation scan.</p>' +
      "</li>" +
      '<li class="soc-rep-source">' +
      '<div class="soc-rep-source__head">' +
      "<strong>IBM X-Force Exchange</strong>" +
      '<span class="soc-ip-score soc-ip-score--' +
      xfTier +
      '">' +
      vendors.xforce +
      "/10</span>" +
      "</div>" +
      '<p class="soc-rep-source__meta">Risk score · confidence ' +
      vendors.xforceConfidence +
      "</p>" +
      '<p class="soc-rep-source__detail">Categories: ' +
      escapeHtml(vendors.xforceCats) +
      "</p>" +
      "</li>" +
      "</ul>" +
      "</section>" +
      '<dl class="soc-kv soc-flyout__kv">' +
      "<dt>Country</dt><dd>" +
      '<span class="soc-ip-flag" aria-hidden="true">' +
      flag +
      "</span> " +
      escapeHtml(country) +
      "</dd>" +
      "<dt>ASN</dt><dd>" +
      escapeHtml(asn) +
      "</dd>" +
      "<dt>Organization</dt><dd>" +
      escapeHtml(org) +
      "</dd>" +
      "<dt>Network type</dt><dd>" +
      escapeHtml(type) +
      "</dd>" +
      "<dt>Categories</dt><dd>" +
      escapeHtml(categories) +
      "</dd>" +
      "<dt>First seen</dt><dd>" +
      escapeHtml(firstSeen) +
      "</dd>" +
      "<dt>Last seen</dt><dd>" +
      escapeHtml(lastSeen) +
      "</dd>" +
      "</dl>" +
      '<section class="soc-flyout__comments" aria-label="Analyst comments">' +
      "<h3>Analyst comments</h3>" +
      '<div data-soc-ip-comments>' +
      renderComments(comments) +
      "</div>" +
      '<form class="soc-ip-comment-form" data-soc-ip-comment-form>' +
      '<label class="soc-ip-comment-form__label" for="soc-ip-comment-input">Add comment</label>' +
      '<textarea id="soc-ip-comment-input" data-soc-ip-comment-input rows="3" placeholder="Share context for other analysts…" required></textarea>' +
      '<button type="submit" class="soc-btn soc-btn--primary">Add comment</button>' +
      "</form>" +
      "</section>" +
      '<p class="soc-flyout__hint">Aggregated score 1–10 (10 = most dangerous). Vendor rows show native scales: VirusTotal detections, IPVoid blacklist hits, X-Force risk score.</p>';

    bindCommentForm(panel, ip);

    backdrop.hidden = false;
    panel.hidden = false;
    backdrop.classList.add("is-open");
    panel.classList.add("is-open");
    document.body.classList.add("soc-flyout-open");
    panel.querySelector(".soc-flyout__close").focus();
  }

  document.addEventListener("click", function (event) {
    var btn = event.target.closest(".soc-ip-link");
    if (!btn) return;
    event.preventDefault();
    event.stopPropagation();
    openFlyout(btn);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeFlyout();
  });
})();

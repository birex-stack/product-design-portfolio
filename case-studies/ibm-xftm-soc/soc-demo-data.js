/**
 * Deterministic demo corpus for the XFTM SOC prototype.
 * Target: ~156 open alerts, plus draft cases and open incidents.
 */
(function (global) {
  var TOTAL_ALERTS = 156;

  var SEVERITIES = [
    { key: "critical", label: "Critical", tag: "soc-tag--critical", weight: 8 },
    { key: "high", label: "High", tag: "soc-tag--high", weight: 36 },
    { key: "medium", label: "Medium", tag: "soc-tag--medium", weight: 62 },
    { key: "low", label: "Low", tag: "soc-tag--low", weight: 50 },
  ];

  /* Weights sum to TOTAL_ALERTS — skewed so the top-rules chart isn’t flat */
  var RULES = [
    { title: "Suspicious PowerShell", family: "endpoint", weight: 28, atds: ["Close / Associate", "Investigate", "Escalate"] },
    { title: "Encoded command", family: "endpoint", weight: 16, atds: ["Close / Associate", "Investigate"] },
    { title: "Unusual SMB shares", family: "endpoint", weight: 15, atds: ["Monitor", "Investigate", "Escalate"] },
    { title: "DNS tunneling spike", family: "network", weight: 12, atds: ["Investigate", "Monitor"] },
    { title: "Anomalous OAuth consent", family: "identity", weight: 10, atds: ["Investigate", "Escalate"] },
    { title: "Lookalike domain click", family: "phishing", weight: 9, atds: ["Investigate", "Escalate"] },
    { title: "Geo velocity", family: "identity", weight: 8, atds: ["Investigate", "Escalate"] },
    { title: "Lateral movement attempt", family: "endpoint", weight: 7, atds: ["Escalate", "Investigate"] },
    { title: "Inbox forwarding rule", family: "phishing", weight: 6, atds: ["Escalate", "Investigate"] },
    { title: "Credential harvest URL", family: "phishing", weight: 6, atds: ["Escalate", "Investigate"] },
    { title: "Rare process tree", family: "endpoint", weight: 5, atds: ["Investigate", "Monitor"] },
    { title: "Brute force auth", family: "identity", weight: 5, atds: ["Investigate", "Escalate"] },
    { title: "Malware beaconing", family: "endpoint", weight: 5, atds: ["Escalate", "Investigate"] },
    { title: "New device auth", family: "identity", weight: 4, atds: ["Monitor", "Investigate"] },
    { title: "Concurrent sessions", family: "identity", weight: 4, atds: ["Investigate", "Monitor"] },
    { title: "Cloud storage exfil", family: "network", weight: 4, atds: ["Investigate", "Escalate"] },
    { title: "Scheduled task update", family: "endpoint", weight: 3, atds: ["Close / Associate", "Monitor"] },
    { title: "Suspicious reply-all", family: "phishing", weight: 3, atds: ["Monitor", "Investigate"] },
    { title: "Privileged group change", family: "identity", weight: 3, atds: ["Investigate", "Escalate"] },
    { title: "RDP from rare ASN", family: "network", weight: 3, atds: ["Investigate", "Monitor"] },
  ];

  var HOSTS = [
    "endpoint-fin-04",
    "endpoint-fin-12",
    "endpoint-hr-03",
    "endpoint-eng-21",
    "vpn-gateway",
    "idp-sso",
    "m365",
    "mail-gateway",
    "proxy",
    "dns-sensor",
    "file-fin-01",
    "jump-host-02",
    "laptop-sales-09",
    "server-app-07",
  ];

  var IPS = [
    { ip: "10.48.12.104", country: "Poland", flag: "🇵🇱", code: "PL", score: 2, asn: "AS5617", org: "Acme Finance Corp (internal)", type: "Corporate LAN", categories: "Internal, Whitelisted" },
    { ip: "10.48.8.22", country: "Poland", flag: "🇵🇱", code: "PL", score: 3, asn: "AS5617", org: "Acme Finance Corp (file server)", type: "Corporate LAN", categories: "Internal" },
    { ip: "10.48.3.55", country: "Poland", flag: "🇵🇱", code: "PL", score: 2, asn: "AS5617", org: "Acme Corp (HR VLAN)", type: "Corporate LAN", categories: "Internal" },
    { ip: "10.52.1.18", country: "Poland", flag: "🇵🇱", code: "PL", score: 4, asn: "AS5617", org: "Acme Corp (Engineering)", type: "Corporate LAN", categories: "Internal" },
    { ip: "91.219.237.144", country: "Netherlands", flag: "🇳🇱", code: "NL", score: 7, asn: "AS49981", org: "WorldStream B.V.", type: "Hosting / VPN", categories: "VPN, Anonymous proxy" },
    { ip: "185.220.101.42", country: "Germany", flag: "🇩🇪", code: "DE", score: 9, asn: "AS60729", org: "Zwiebelfreunde e.V.", type: "Tor exit node", categories: "Tor, Anonymizer, Abuse" },
    { ip: "45.33.32.156", country: "United States", flag: "🇺🇸", code: "US", score: 5, asn: "AS63949", org: "Akamai Connected Cloud", type: "Cloud hosting", categories: "Hosting, Mixed reputation" },
    { ip: "185.100.87.240", country: "Romania", flag: "🇷🇴", code: "RO", score: 8, asn: "AS9009", org: "M247 Europe SRL", type: "Hosting / bulletproof", categories: "Spam, Phishing infrastructure" },
    { ip: "45.142.214.88", country: "Russia", flag: "🇷🇺", code: "RU", score: 10, asn: "AS210644", org: "AEZA International Ltd", type: "Malicious hosting", categories: "Phishing, Malware C2, Credential theft" },
    { ip: "104.21.32.11", country: "United States", flag: "🇺🇸", code: "US", score: 3, asn: "AS13335", org: "Cloudflare, Inc.", type: "CDN / shared", categories: "CDN, Mixed tenants" },
    { ip: "193.32.216.55", country: "France", flag: "🇫🇷", code: "FR", score: 8, asn: "AS211252", org: "Delis LLC", type: "Hosting", categories: "Phishing, Lookalike domains" },
    { ip: "5.188.86.19", country: "Russia", flag: "🇷🇺", code: "RU", score: 9, asn: "AS50867", org: "HOSTKEY B.V.", type: "Hosting", categories: "Scanning, Abuse" },
    { ip: "203.0.113.44", country: "Australia", flag: "🇦🇺", code: "AU", score: 6, asn: "AS64500", org: "Example Hosting AU", type: "Cloud VPS", categories: "Hosting" },
    { ip: "198.51.100.77", country: "United States", flag: "🇺🇸", code: "US", score: 4, asn: "AS64501", org: "Example Cloud US", type: "Cloud", categories: "Cloud SaaS" },
    { ip: "77.88.55.66", country: "Germany", flag: "🇩🇪", code: "DE", score: 5, asn: "AS13238", org: "Yandex LLC", type: "Cloud / CDN", categories: "CDN" },
  ];

  var DRAFT_TEMPLATES = [
    { title: "Suspected ransomware staging", client: "Finance", severity: "high" },
    { title: "Impossible travel cluster", client: "Remote access", severity: "high" },
    { title: "Phishing click → mailbox rule", client: "Messaging", severity: "high" },
    { title: "OAuth consent anomaly", client: "Identity", severity: "medium" },
    { title: "DNS tunneling watch", client: "Network", severity: "medium" },
    { title: "Privileged escalation chain", client: "IT ops", severity: "critical" },
    { title: "Cloud exfil pattern", client: "Engineering", severity: "high" },
    { title: "Brute force on VPN", client: "Remote access", severity: "medium" },
    { title: "Lookalike domain campaign", client: "Messaging", severity: "critical" },
    { title: "Endpoint beacon cluster", client: "Finance", severity: "high" },
    { title: "Shared mailbox compromise", client: "HR", severity: "medium" },
    { title: "RDP from rare geography", client: "IT ops", severity: "medium" },
    { title: "Suspicious task scheduler wave", client: "Finance", severity: "low" },
    { title: "Tor-sourced auth attempts", client: "Identity", severity: "high" },
    { title: "SMB staging on file shares", client: "Finance", severity: "medium" },
  ];

  var OPEN_CASE_TEMPLATES = [
    { id: "INC-2025-4821", title: "Suspected ransomware staging", client: "Finance", severity: "high", assignee: "me", updated: "12m ago" },
    { id: "INC-2025-4818", title: "Impossible travel — exec account", client: "Remote access", severity: "medium", assignee: "me", updated: "41m ago" },
    { id: "INC-2025-4812", title: "Phishing → mailbox compromise", client: "Messaging", severity: "high", assignee: "other", updated: "2h ago" },
    { id: "INC-2025-4809", title: "Cloud storage bulk download", client: "Engineering", severity: "medium", assignee: "me", updated: "3h ago" },
    { id: "INC-2025-4804", title: "Privileged group modification", client: "IT ops", severity: "critical", assignee: "other", updated: "4h ago" },
    { id: "INC-2025-4798", title: "Malware beacon — sales laptop", client: "Sales", severity: "high", assignee: "other", updated: "5h ago" },
    { id: "INC-2025-4791", title: "VPN brute-force campaign", client: "Remote access", severity: "medium", assignee: "me", updated: "6h ago" },
    { id: "INC-2025-4785", title: "Lookalike finance domain", client: "Messaging", severity: "critical", assignee: "other", updated: "8h ago" },
    { id: "INC-2025-4779", title: "Anomalous OAuth grants", client: "Identity", severity: "medium", assignee: "other", updated: "9h ago" },
    { id: "INC-2025-4772", title: "DNS anomaly — plant network", client: "OT / plant", severity: "low", assignee: "me", updated: "11h ago" },
  ];

  function mulberry32(a) {
    return function () {
      var t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
  }

  function pad(n, w) {
    var s = String(n);
    while (s.length < w) s = "0" + s;
    return s;
  }

  function hhmmFromIndex(i) {
    // Spread across ~08:00–12:59
    var total = 8 * 60 + (i % 300);
    var h = Math.floor(total / 60);
    var m = total % 60;
    return pad(h, 2) + ":" + pad(m, 2);
  }

  function buildSeverityQueue() {
    var q = [];
    SEVERITIES.forEach(function (s) {
      for (var i = 0; i < s.weight; i++) q.push(s);
    });
    while (q.length < TOTAL_ALERTS) q.push(SEVERITIES[2]);
    return q.slice(0, TOTAL_ALERTS);
  }

  function buildRuleQueue() {
    var q = [];
    RULES.forEach(function (r) {
      for (var i = 0; i < r.weight; i++) q.push(r);
    });
    while (q.length < TOTAL_ALERTS) q.push(RULES[0]);
    return q.slice(0, TOTAL_ALERTS);
  }

  function scoreClass(score) {
    if (score >= 9) return "critical";
    if (score >= 7) return "high";
    if (score >= 4) return "medium";
    return "low";
  }

  function buildCorpus() {
    var rng = mulberry32(20250528);
    var sevQ = buildSeverityQueue();
    var ruleQ = buildRuleQueue();
    // shuffle queues deterministically (independent passes)
    for (var i = sevQ.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = sevQ[i];
      sevQ[i] = sevQ[j];
      sevQ[j] = tmp;
    }
    for (var ri = ruleQ.length - 1; ri > 0; ri--) {
      var rj = Math.floor(rng() * (ri + 1));
      var rtmp = ruleQ[ri];
      ruleQ[ri] = ruleQ[rj];
      ruleQ[rj] = rtmp;
    }

    var alerts = [];
    for (var n = 0; n < TOTAL_ALERTS; n++) {
      var idNum = 88550 - n;
      var id = "ALT-" + idNum;
      var rule = ruleQ[n];
      var sev = sevQ[n];
      var ip = IPS[n % IPS.length];
      var host = HOSTS[n % HOSTS.length];
      var atdsVerb = pick(rng, rule.atds);
      var conf = 35 + Math.floor(rng() * 55);
      var fpHint =
        atdsVerb.indexOf("Close") !== -1 || atdsVerb === "Monitor"
          ? " · " + conf + "% FP"
          : " · " + conf + "%";
      alerts.push({
        id: id,
        title: rule.title,
        family: rule.family,
        severity: sev.key,
        severityLabel: sev.label,
        severityTag: sev.tag,
        source: host,
        ip: Object.assign({}, ip),
        atds: atdsVerb + fpHint,
        atdsVerb: atdsVerb,
        confidence: conf,
        lastSeen: hhmmFromIndex(n),
        caseId: null,
        draftId: null,
      });
    }

    // Preserve well-known hero alerts at the front with familiar IDs/titles
    var heroes = [
      { id: "ALT-88421", title: "Suspicious PowerShell", severity: "high", source: "endpoint-fin-04", ip: IPS[0], atds: "Close / Associate · 72% FP", caseId: "INC-2025-4821" },
      { id: "ALT-88419", title: "Encoded command", severity: "high", source: "endpoint-fin-04", ip: IPS[0], atds: "Close / Associate · 68% FP", caseId: "INC-2025-4821" },
      { id: "ALT-88411", title: "Rare process tree", severity: "medium", source: "endpoint-fin-04", ip: IPS[0], atds: "Investigate · 54%", caseId: "INC-2025-4821" },
      { id: "ALT-88405", title: "Unusual SMB shares", severity: "low", source: "endpoint-fin-04", ip: IPS[1], atds: "Monitor · 41% FP", caseId: "INC-2025-4821" },
      { id: "ALT-88398", title: "Scheduled task update", severity: "low", source: "endpoint-fin-04", ip: IPS[0], atds: "Close / Associate · 70% FP", caseId: "INC-2025-4821" },
      { id: "ALT-88390", title: "Geo velocity", severity: "high", source: "vpn-gateway", ip: IPS[4], atds: "Investigate · 71%", caseId: "INC-2025-4818" },
      { id: "ALT-88388", title: "New device auth", severity: "medium", source: "idp-sso", ip: IPS[5], atds: "Monitor · 54% FP", caseId: "INC-2025-4818" },
      { id: "ALT-88385", title: "Concurrent sessions", severity: "medium", source: "vpn-gateway", ip: IPS[6], atds: "Investigate · 62%", caseId: "INC-2025-4818" },
      { id: "ALT-88341", title: "Inbox forwarding rule", severity: "high", source: "m365", ip: IPS[7], atds: "Escalate · 79%", caseId: "INC-2025-4812" },
      { id: "ALT-88340", title: "Credential harvest URL", severity: "critical", source: "mail-gateway", ip: IPS[8], atds: "Escalate · 81%", caseId: "INC-2025-4812" },
      { id: "ALT-88338", title: "Suspicious reply-all", severity: "low", source: "m365", ip: IPS[9], atds: "Monitor · 48% FP", caseId: "INC-2025-4812" },
      { id: "ALT-88335", title: "Lookalike domain click", severity: "critical", source: "proxy", ip: IPS[10], atds: "Investigate · 66%", caseId: "INC-2025-4812" },
      { id: "ALT-88428", title: "Lateral movement attempt", severity: "high", source: "endpoint-fin-04", ip: IPS[0], atds: "Escalate · 84%", caseId: "INC-2025-4821" },
      { id: "ALT-88425", title: "DNS tunneling spike", severity: "medium", source: "dns-sensor", ip: IPS[6], atds: "Investigate · 61%", caseId: null },
      { id: "ALT-88422", title: "Anomalous OAuth consent", severity: "medium", source: "m365", ip: IPS[9], atds: "Investigate · 58%", caseId: null },
    ];

    var byId = {};
    alerts.forEach(function (a) {
      byId[a.id] = a;
    });
    heroes.forEach(function (h) {
      var sevMeta = SEVERITIES.find(function (s) {
        return s.key === h.severity;
      });
      var existing = byId[h.id];
      var row = existing || {
        id: h.id,
        family: "endpoint",
        confidence: 60,
        lastSeen: "08:41",
        draftId: null,
      };
      row.id = h.id;
      row.title = h.title;
      row.severity = h.severity;
      row.severityLabel = sevMeta.label;
      row.severityTag = sevMeta.tag;
      row.source = h.source;
      row.ip = Object.assign({}, h.ip);
      row.atds = h.atds;
      row.atdsVerb = h.atds.split(" · ")[0];
      row.caseId = h.caseId;
      row.scoreClass = scoreClass(h.ip.score);
      if (!existing) alerts.unshift(row);
      byId[h.id] = row;
    });

    // Trim / pad to exact TOTAL
    alerts = alerts.slice(0, TOTAL_ALERTS);
    while (alerts.length < TOTAL_ALERTS) {
      var extra = Object.assign({}, alerts[alerts.length - 1]);
      extra.id = "ALT-" + (88000 - alerts.length);
      alerts.push(extra);
    }

    // Assign remaining alerts to open cases and drafts
    var openCases = OPEN_CASE_TEMPLATES.map(function (c, idx) {
      return {
        id: c.id,
        title: c.title,
        client: c.client,
        severity: c.severity,
        severityTag: SEVERITIES.find(function (s) {
          return s.key === c.severity;
        }).tag,
        assignee: c.assignee,
        updated: c.updated,
        kind: "open",
        alertIds: [],
      };
    });

    var drafts = DRAFT_TEMPLATES.map(function (d, idx) {
      return {
        id: "DRAFT-" + (4900 - idx),
        title: d.title,
        client: d.client,
        severity: d.severity,
        severityTag: SEVERITIES.find(function (s) {
          return s.key === d.severity;
        }).tag,
        updated: 8 + (idx % 40) + "m ago",
        kind: "draft",
        alertIds: [],
      };
    });

    // First pass: honor hero case assignments
    alerts.forEach(function (a) {
      if (!a.caseId) return;
      var c = openCases.find(function (x) {
        return x.id === a.caseId;
      });
      if (c && c.alertIds.indexOf(a.id) === -1) c.alertIds.push(a.id);
    });

    var unassigned = alerts.filter(function (a) {
      return !a.caseId && !a.draftId;
    });

    // Fill open cases to 4–8 alerts each
    openCases.forEach(function (c, ci) {
      var need = Math.max(0, 4 + (ci % 5) - c.alertIds.length);
      while (need > 0 && unassigned.length) {
        var a = unassigned.shift();
        a.caseId = c.id;
        c.alertIds.push(a.id);
        need--;
      }
    });

    // Remaining → drafts (3–7 each), leftover stay ungrouped
    drafts.forEach(function (d, di) {
      var need = 3 + (di % 5);
      while (need > 0 && unassigned.length) {
        var a = unassigned.shift();
        a.draftId = d.id;
        d.alertIds.push(a.id);
        need--;
      }
    });

    // Drop empty drafts
    drafts = drafts.filter(function (d) {
      return d.alertIds.length > 0;
    });

    alerts.forEach(function (a) {
      a.scoreClass = scoreClass(a.ip.score);
    });

    return { alerts: alerts, openCases: openCases, drafts: drafts };
  }

  var corpus = buildCorpus();

  function alertsById() {
    var map = {};
    corpus.alerts.forEach(function (a) {
      map[a.id] = a;
    });
    return map;
  }

  function severityCounts(list) {
    var c = { critical: 0, high: 0, medium: 0, low: 0 };
    list.forEach(function (a) {
      c[a.severity] = (c[a.severity] || 0) + 1;
    });
    return c;
  }

  function topRules(list, limit) {
    var map = {};
    list.forEach(function (a) {
      map[a.title] = (map[a.title] || 0) + 1;
    });
    return Object.keys(map)
      .map(function (k) {
        return { title: k, count: map[k] };
      })
      .sort(function (a, b) {
        return b.count - a.count;
      })
      .slice(0, limit || 6);
  }

  function familyBars(list) {
    var map = {
      phishing: { label: "Phishing / mailbox", count: 0 },
      identity: { label: "Geo / identity", count: 0 },
      endpoint: { label: "Endpoint / malware", count: 0 },
      network: { label: "Network / DNS", count: 0 },
    };
    list.forEach(function (a) {
      if (map[a.family]) map[a.family].count++;
    });
    return Object.keys(map)
      .map(function (k) {
        return map[k];
      })
      .sort(function (a, b) {
        return b.count - a.count;
      });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function ipButton(ip) {
    return (
      '<button type="button" class="soc-ip-link" data-ip="' +
      escapeHtml(ip.ip) +
      '" data-country="' +
      escapeHtml(ip.country) +
      '" data-flag="' +
      escapeHtml(ip.flag) +
      '" data-score="' +
      escapeHtml(ip.score) +
      '" data-asn="' +
      escapeHtml(ip.asn) +
      '" data-org="' +
      escapeHtml(ip.org) +
      '" data-type="' +
      escapeHtml(ip.type) +
      '" data-categories="' +
      escapeHtml(ip.categories) +
      '" data-first-seen="2024-01-01" data-last-seen="2025-05-28">' +
      escapeHtml(ip.ip) +
      "</button>"
    );
  }

  function renderAllAlertsRow(a) {
    var incident =
      a.caseId ||
      (a.draftId ? a.draftId : "—");
    return (
      "<tr>" +
      '<td><span class="soc-tag soc-tag--severity ' +
      a.severityTag +
      '">' +
      a.severityLabel +
      "</span></td>" +
      "<td><a href=\"./alert.html?id=" +
      encodeURIComponent(a.id) +
      '">' +
      escapeHtml(a.id) +
      " · " +
      escapeHtml(a.title) +
      "</a></td>" +
      "<td>" +
      escapeHtml(a.atds) +
      "</td>" +
      "<td>" +
      escapeHtml(incident) +
      "</td>" +
      "<td>" +
      escapeHtml(a.source) +
      "</td>" +
      "<td>" +
      ipButton(a.ip) +
      "</td>" +
      '<td><span class="soc-ip-flag" title="' +
      escapeHtml(a.ip.country) +
      '" aria-label="' +
      escapeHtml(a.ip.country) +
      '">' +
      escapeHtml(a.ip.code || a.ip.flag) +
      "</span></td>" +
      '<td><span class="soc-ip-score soc-ip-score--' +
      a.scoreClass +
      '">' +
      a.ip.score +
      "/10</span></td>" +
      "<td>" +
      escapeHtml(a.lastSeen) +
      "</td>" +
      "</tr>"
    );
  }

  function renderGroupedAlertRow(a) {
    return (
      "<tr>" +
      "<td><a href=\"./alert.html?id=" +
      encodeURIComponent(a.id) +
      '">' +
      escapeHtml(a.id) +
      " · " +
      escapeHtml(a.title) +
      "</a></td>" +
      "<td>" +
      escapeHtml(a.atds) +
      "</td>" +
      "<td>" +
      escapeHtml(a.source) +
      "</td>" +
      "<td>" +
      ipButton(a.ip) +
      "</td>" +
      '<td><span class="soc-ip-flag" title="' +
      escapeHtml(a.ip.country) +
      '" aria-label="' +
      escapeHtml(a.ip.country) +
      '">' +
      escapeHtml(a.ip.code || a.ip.flag) +
      "</span></td>" +
      '<td><span class="soc-ip-score soc-ip-score--' +
      a.scoreClass +
      '">' +
      a.ip.score +
      "/10</span></td>" +
      "<td>" +
      escapeHtml(a.lastSeen) +
      "</td>" +
      "</tr>"
    );
  }

  /*
   * List rows → Carbon Data table (no nested alert tables).
   * Nested detail belongs on case/alert pages or Side Panel.
   * @see https://carbondesignsystem.com/components/data-table/usage/
   */
  function renderDraftRow(draft) {
    var sevLabel = escapeHtml(
      SEVERITIES.find(function (s) {
        return s.key === draft.severity;
      }).label
    );
    var n = (draft.alertIds && draft.alertIds.length) || 0;
    return (
      '<tr class="soc-cases-row">' +
      '<td><span class="soc-tag soc-tag--severity ' +
      draft.severityTag +
      '">' +
      sevLabel +
      "</span></td>" +
      "<td>" +
      '<a class="soc-cases-row__link" href="./incident.html?case=' +
      encodeURIComponent(draft.id) +
      '">' +
      '<span class="soc-cases-row__id">' +
      escapeHtml(draft.id) +
      "</span>" +
      '<span class="soc-cases-row__title">' +
      escapeHtml(draft.title) +
      "</span></a></td>" +
      "<td>" +
      escapeHtml(draft.client) +
      "</td>" +
      "<td>" +
      n +
      "</td>" +
      '<td><span class="soc-tag soc-tag--draft">Draft</span></td>' +
      "<td>" +
      escapeHtml(draft.updated) +
      "</td>" +
      "<td>ATDS grouped</td>" +
      "</tr>"
    );
  }

  /** @deprecated Prefer renderDraftRow */
  function renderDraftGroup(draft) {
    return renderDraftRow(draft);
  }

  function renderOpenCaseRow(c) {
    var sevLabel = escapeHtml(
      SEVERITIES.find(function (s) {
        return s.key === c.severity;
      }).label
    );
    var assigneeLabel = c.assignee === "me" ? "You" : "Teammate";
    var n = (c.alertIds && c.alertIds.length) || 0;
    return (
      '<tr class="soc-cases-row" data-assignee="' +
      escapeHtml(c.assignee) +
      '">' +
      '<td><span class="soc-tag soc-tag--severity ' +
      c.severityTag +
      '">' +
      sevLabel +
      "</span></td>" +
      "<td>" +
      '<a class="soc-cases-row__link" href="./incident.html?case=' +
      encodeURIComponent(c.id) +
      '">' +
      '<span class="soc-cases-row__id">' +
      escapeHtml(c.id) +
      "</span>" +
      '<span class="soc-cases-row__title">' +
      escapeHtml(c.title) +
      "</span></a></td>" +
      "<td>" +
      escapeHtml(c.client) +
      "</td>" +
      "<td>" +
      n +
      "</td>" +
      "<td>" +
      assigneeLabel +
      "</td>" +
      "<td>" +
      escapeHtml(c.updated) +
      "</td>" +
      "<td>In progress</td>" +
      "</tr>"
    );
  }

  /** @deprecated Prefer renderOpenCaseRow for Cases list */
  function renderOpenCaseGroup(c, alertMap) {
    return renderOpenCaseRow(c);
  }

  /**
   * Carbon Pagination — items per page (default 10) + range + page + prev/next
   * @see https://carbondesignsystem.com/components/pagination/usage/
   * @param {{
   *   pager: HTMLElement|null,
   *   rangeEl?: HTMLElement|null,
   *   sizeEl?: HTMLSelectElement|null,
   *   selectEl?: HTMLSelectElement|null,
   *   ofEl?: HTMLElement|null,
   *   prevBtn?: HTMLButtonElement|null,
   *   nextBtn?: HTMLButtonElement|null,
   *   getItems: () => any[],
   *   renderRows: (pageItems: any[]) => void,
   *   pageSize?: number,
   *   onPage?: () => void
   * }} opts
   */
  function bindCarbonPagination(opts) {
    var pageSize = opts.pageSize || 10;
    var page = 1;

    function render() {
      var items = opts.getItems() || [];
      var pageCount = Math.max(1, Math.ceil(items.length / pageSize));
      page = Math.min(Math.max(1, page), pageCount);
      var start = (page - 1) * pageSize;
      var end = Math.min(start + pageSize, items.length);
      opts.renderRows(items.slice(start, end));

      if (opts.pager) {
        opts.pager.hidden = items.length === 0;
        if (opts.rangeEl) {
          opts.rangeEl.textContent =
            items.length === 0
              ? "0 items"
              : start + 1 + "–" + end + " of " + items.length + " items";
        }
        if (opts.sizeEl) opts.sizeEl.value = String(pageSize);
        if (opts.ofEl) {
          opts.ofEl.textContent =
            "of " + pageCount + (pageCount === 1 ? " page" : " pages");
        }
        if (opts.selectEl) {
          if (opts.selectEl.options.length !== pageCount) {
            opts.selectEl.innerHTML = Array.from(
              { length: pageCount },
              function (_, i) {
                return (
                  '<option value="' + (i + 1) + '">' + (i + 1) + "</option>"
                );
              }
            ).join("");
          }
          opts.selectEl.value = String(page);
        }
        if (opts.prevBtn) opts.prevBtn.disabled = page <= 1;
        if (opts.nextBtn) opts.nextBtn.disabled = page >= pageCount;
      }
      if (typeof opts.onPage === "function") opts.onPage();
    }

    if (opts.sizeEl) {
      opts.sizeEl.addEventListener("change", function () {
        pageSize = parseInt(opts.sizeEl.value, 10) || 10;
        page = 1;
        render();
      });
    }
    if (opts.selectEl) {
      opts.selectEl.addEventListener("change", function () {
        page = parseInt(opts.selectEl.value, 10) || 1;
        render();
      });
    }
    if (opts.prevBtn) {
      opts.prevBtn.addEventListener("click", function () {
        page -= 1;
        render();
      });
    }
    if (opts.nextBtn) {
      opts.nextBtn.addEventListener("click", function () {
        page += 1;
        render();
      });
    }

    return {
      render: render,
      reset: function () {
        page = 1;
        render();
      },
      setPageSize: function (n) {
        pageSize = n || 10;
        page = 1;
        render();
      },
    };
  }

  global.SocDemoData = {
    TOTAL_ALERTS: TOTAL_ALERTS,
    corpus: corpus,
    alertsById: alertsById,
    severityCounts: severityCounts,
    topRules: topRules,
    familyBars: familyBars,
    renderAllAlertsRow: renderAllAlertsRow,
    renderDraftGroup: renderDraftGroup,
    renderDraftRow: renderDraftRow,
    renderOpenCaseGroup: renderOpenCaseGroup,
    renderOpenCaseRow: renderOpenCaseRow,
    bindCarbonPagination: bindCarbonPagination,
    getAlert: function (id) {
      return alertsById()[id] || null;
    },
  };
})(window);

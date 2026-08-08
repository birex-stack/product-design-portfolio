/* Render Cases page from SocDemoData — Carbon Data table (no nested alerts). */
(function () {
  if (!window.SocDemoData) return;
  var data = SocDemoData.corpus;
  var total = data.alerts.length;

  document.querySelectorAll(".soc-nav a[href*='alerts'] .soc-nav-badge").forEach(function (el) {
    el.textContent = String(total);
  });

  var root = document.getElementById("cases-root");
  if (!root) return;

  root.innerHTML = data.openCases
    .map(function (c) {
      return SocDemoData.renderOpenCaseRow
        ? SocDemoData.renderOpenCaseRow(c)
        : SocDemoData.renderOpenCaseGroup(c);
    })
    .join("");

  if (typeof window.socEnhanceSeverity === "function") {
    window.socEnhanceSeverity();
  } else if (typeof window.socEnhanceIpEntityChips === "function") {
    window.socEnhanceIpEntityChips();
  }

  var mineCount = data.openCases.filter(function (c) {
    return c.assignee === "me";
  }).length;
  var allCount = data.openCases.length;
  var mineBadge = document.getElementById("tab-cases-mine-count");
  var allBadge = document.getElementById("tab-cases-all-count");
  if (mineBadge) mineBadge.textContent = String(mineCount);
  if (allBadge) allBadge.textContent = String(allCount);

  function paintDonut(donut, legendRoot, sevCounts, totalN) {
    if (!donut) return;
    donut.setAttribute(
      "aria-label",
      totalN +
        " open cases. Critical " +
        sevCounts.critical +
        ", High " +
        sevCounts.high +
        ", Medium " +
        sevCounts.medium +
        ", Low " +
        sevCounts.low
    );
    var segs = [
      { sel: ".soc-donut-seg--critical", n: sevCounts.critical },
      { sel: ".soc-donut-seg--high", n: sevCounts.high },
      { sel: ".soc-donut-seg--medium", n: sevCounts.medium },
      { sel: ".soc-donut-seg--low", n: sevCounts.low },
    ];
    var offset = 0;
    segs.forEach(function (s) {
      var el = donut.querySelector(s.sel);
      if (!el) return;
      var pct = totalN ? (s.n / totalN) * 100 : 0;
      el.setAttribute(
        "stroke-dasharray",
        pct.toFixed(2) + " " + (100 - pct).toFixed(2)
      );
      el.setAttribute("stroke-dashoffset", String(-offset));
      offset += pct;
    });
    var center = donut.querySelector(".soc-donut-center-value");
    if (center) center.textContent = String(totalN);
    if (legendRoot) {
      var legend = legendRoot.querySelectorAll("strong");
      if (legend.length >= 4) {
        legend[0].textContent = String(sevCounts.critical);
        legend[1].textContent = String(sevCounts.high);
        legend[2].textContent = String(sevCounts.medium);
        legend[3].textContent = String(sevCounts.low);
      }
    }
  }

  var barColors = [
    "soc-bar-fill--phishing",
    "soc-bar-fill--unauth",
    "soc-bar-fill--malware",
    "",
    "soc-bar-fill--exfil",
    "",
  ];

  function paintBars(panel, rows) {
    if (!panel) return;
    var max = rows[0] ? rows[0].count : 1;
    panel.innerHTML = rows
      .map(function (r, i) {
        var w = max ? Math.round((r.count / max) * 100) : 0;
        var cls = barColors[i] || "";
        return (
          '<div class="soc-bar-row">' +
          '<span title="' +
          r.title +
          '">' +
          r.title +
          "</span>" +
          '<div class="soc-bar-track"><div class="soc-bar-fill ' +
          cls +
          '" style="width: ' +
          w +
          '%"></div></div>' +
          "<span>" +
          r.count +
          "</span></div>"
        );
      })
      .join("");
  }

  function casesForFilter(filter) {
    return data.openCases.filter(function (c) {
      return filter === "all" || c.assignee === "me";
    });
  }

  function renderSummary(filter) {
    var list = casesForFilter(filter);
    var sev = { critical: 0, high: 0, medium: 0, low: 0 };
    var alertTotal = 0;
    list.forEach(function (c) {
      sev[c.severity] = (sev[c.severity] || 0) + 1;
      alertTotal += (c.alertIds && c.alertIds.length) || 0;
    });
    var n = list.length;
    var sub = document.getElementById("summary-cases-sub");
    if (sub) {
      sub.textContent =
        n +
        " open case" +
        (n === 1 ? "" : "s") +
        (filter === "mine" ? " assigned to me" : "") +
        " · " +
        alertTotal +
        " alerts · Critical " +
        sev.critical +
        " · High " +
        sev.high +
        " · Medium " +
        sev.medium +
        " · Low " +
        sev.low;
    }
    paintDonut(
      document.getElementById("summary-cases-donut"),
      document.getElementById("summary-cases-legend"),
      sev,
      n
    );
    var top = list
      .slice()
      .sort(function (a, b) {
        return (b.alertIds.length || 0) - (a.alertIds.length || 0);
      })
      .slice(0, 6)
      .map(function (c) {
        return {
          title: c.title,
          count: (c.alertIds && c.alertIds.length) || 0,
        };
      });
    var barsSub = document.getElementById("summary-cases-bars-sub");
    if (barsSub) {
      barsSub.textContent =
        alertTotal +
        " alerts across " +
        n +
        " open case" +
        (n === 1 ? "" : "s");
    }
    paintBars(document.getElementById("summary-cases-bars"), top);
  }

  var switcher = document.querySelector(".soc-switcher");

  function applyFilter(filter) {
    document.querySelectorAll(".soc-cases-row[data-assignee]").forEach(function (row) {
      var assignee = row.getAttribute("data-assignee");
      row.hidden = !(filter === "all" || assignee === "me");
    });
    renderSummary(filter);
  }

  if (!switcher) {
    renderSummary("mine");
    return;
  }

  switcher.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-filter]");
    if (!btn) return;
    switcher.querySelectorAll("[data-filter]").forEach(function (tab) {
      var active = tab === btn;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    applyFilter(btn.getAttribute("data-filter"));
  });

  applyFilter("mine");
})();

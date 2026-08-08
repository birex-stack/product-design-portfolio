/* Render Alerts page from SocDemoData (~156 alerts). */
(function () {
  if (!window.SocDemoData) return;
  var data = SocDemoData.corpus;
  var counts = SocDemoData.severityCounts(data.alerts);
  var total = data.alerts.length;

  document.querySelectorAll(".soc-nav-badge").forEach(function (el) {
    if (el.closest('a[href*="alerts"]')) el.textContent = String(total);
  });

  var tabAllCount = document.getElementById("tab-ungrouped-count");
  if (tabAllCount) tabAllCount.textContent = String(total);
  var tabGroupedCount = document.getElementById("tab-grouped-count");
  if (tabGroupedCount) {
    tabGroupedCount.textContent = String(data.drafts.length);
  }

  function paintDonut(donut, legendRoot, sevCounts, totalN, centerLabel) {
    if (!donut) return;
    donut.setAttribute(
      "aria-label",
      totalN +
        " " +
        centerLabel +
        ". Critical " +
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
    /* ~1px gap at r=50, pathLength=100. Last arc absorbs float remainder. */
    var GAP = 0.25;
    var activeIdx = [];
    segs.forEach(function (s, i) {
      if (s.n > 0) activeIdx.push(i);
    });
    var available = Math.max(0, 100 - activeIdx.length * GAP);
    var remaining = available;
    var offset = 0;
    segs.forEach(function (s, i) {
      var el = donut.querySelector(s.sel);
      if (!el) return;
      var pct = 0;
      if (totalN && s.n > 0) {
        var isLast = i === activeIdx[activeIdx.length - 1];
        pct = isLast
          ? remaining
          : Math.min(remaining, (s.n / totalN) * available);
        remaining = Math.max(0, remaining - pct);
      }
      el.setAttribute(
        "stroke-dasharray",
        pct.toFixed(2) + " " + (100 - pct).toFixed(2)
      );
      el.setAttribute("stroke-dashoffset", String(-offset));
      if (pct > 0) offset += pct + GAP;
    });
    var center = donut.querySelector(".soc-donut-center-value");
    if (center) center.textContent = String(totalN);
    var centerLbl = donut.querySelector(".soc-donut-center-label");
    if (centerLbl) centerLbl.textContent = centerLabel;
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

  /* Carbon blue 10→60, light → dark by rank */
  var barColors = [
    "soc-bar-fill--blue-10",
    "soc-bar-fill--blue-20",
    "soc-bar-fill--blue-30",
    "soc-bar-fill--blue-40",
    "soc-bar-fill--blue-50",
    "soc-bar-fill--blue-60",
  ];

  function paintBars(panel, rows) {
    if (!panel) return;
    var max = rows[0] ? rows[0].count : 1;
    panel.innerHTML = rows
      .map(function (r, i) {
        var w = Math.round((r.count / max) * 100);
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

  // All alerts summary
  var alertsSub = document.getElementById("summary-alerts-sub");
  if (alertsSub) {
    alertsSub.textContent =
      total +
      " open · Critical " +
      counts.critical +
      " · High " +
      counts.high +
      " · Medium " +
      counts.medium +
      " · Low " +
      counts.low;
  }
  paintDonut(
    document.getElementById("summary-alerts-donut"),
    document.getElementById("summary-alerts-legend"),
    counts,
    total,
    "open"
  );
  paintBars(
    document.getElementById("summary-alerts-rules"),
    SocDemoData.topRules(data.alerts, 6)
  );

  // ATDS Grouped summary — draft cases, not the open-alert queue
  var draftSev = { critical: 0, high: 0, medium: 0, low: 0 };
  var draftAlertTotal = 0;
  data.drafts.forEach(function (d) {
    draftSev[d.severity] = (draftSev[d.severity] || 0) + 1;
    draftAlertTotal += d.alertIds.length;
  });
  var draftCount = data.drafts.length;
  var draftsSub = document.getElementById("summary-drafts-sub");
  if (draftsSub) {
    draftsSub.textContent =
      draftCount +
      " draft cases · " +
      draftAlertTotal +
      " alerts correlated · Critical " +
      draftSev.critical +
      " · High " +
      draftSev.high +
      " · Medium " +
      draftSev.medium +
      " · Low " +
      draftSev.low;
  }
  paintDonut(
    document.getElementById("summary-drafts-donut"),
    document.getElementById("summary-drafts-legend"),
    draftSev,
    draftCount,
    "drafts"
  );
  var topDrafts = data.drafts
    .slice()
    .sort(function (a, b) {
      return b.alertIds.length - a.alertIds.length;
    })
    .slice(0, 6)
    .map(function (d) {
      return { title: d.title, count: d.alertIds.length };
    });
  var draftsBarsSub = document.getElementById("summary-drafts-bars-sub");
  if (draftsBarsSub) {
    draftsBarsSub.textContent =
      draftAlertTotal +
      " alerts across " +
      draftCount +
      " ATDS draft cases";
  }
  paintBars(document.getElementById("summary-drafts-bars"), topDrafts);

  var draftsRoot = document.getElementById("draft-cases-root");
  if (draftsRoot && SocDemoData.bindCarbonPagination) {
    SocDemoData.bindCarbonPagination({
      pager: document.getElementById("drafts-pagination"),
      rangeEl: document.getElementById("drafts-page-range"),
      sizeEl: document.getElementById("drafts-page-size"),
      selectEl: document.getElementById("drafts-page-select"),
      ofEl: document.getElementById("drafts-page-of"),
      prevBtn: document.getElementById("drafts-page-prev"),
      nextBtn: document.getElementById("drafts-page-next"),
      pageSize: 10,
      getItems: function () {
        return data.drafts;
      },
      renderRows: function (pageItems) {
        draftsRoot.innerHTML = pageItems
          .map(function (d) {
            return SocDemoData.renderDraftRow
              ? SocDemoData.renderDraftRow(d)
              : SocDemoData.renderDraftGroup(d);
          })
          .join("");
        if (typeof window.socEnhanceSeverity === "function") {
          window.socEnhanceSeverity();
        }
      },
    }).render();
  } else if (draftsRoot) {
    draftsRoot.innerHTML = data.drafts
      .map(function (d) {
        return SocDemoData.renderDraftRow
          ? SocDemoData.renderDraftRow(d)
          : SocDemoData.renderDraftGroup(d);
      })
      .join("");
    if (typeof window.socEnhanceSeverity === "function") {
      window.socEnhanceSeverity();
    }
  }

  var allBody = document.getElementById("alerts-all-body");
  var sorted = data.alerts.slice().sort(function (a, b) {
    return a.lastSeen.localeCompare(b.lastSeen);
  });

  if (allBody && SocDemoData.bindCarbonPagination) {
    SocDemoData.bindCarbonPagination({
      pager: document.getElementById("alerts-pagination"),
      rangeEl: document.getElementById("alerts-page-range"),
      sizeEl: document.getElementById("alerts-page-size"),
      selectEl: document.getElementById("alerts-page-select"),
      ofEl: document.getElementById("alerts-page-of"),
      prevBtn: document.getElementById("alerts-page-prev"),
      nextBtn: document.getElementById("alerts-page-next"),
      pageSize: 10,
      getItems: function () {
        return sorted;
      },
      renderRows: function (pageItems) {
        allBody.innerHTML = pageItems
          .map(SocDemoData.renderAllAlertsRow)
          .join("");
      },
      onPage: function () {
        if (typeof window.socEnhanceIpEntityChips === "function") {
          window.socEnhanceIpEntityChips();
        }
        if (typeof window.socEnhanceSeverity === "function") {
          window.socEnhanceSeverity();
        }
      },
    }).render();
  }

  var switcher = document.querySelector(".soc-switcher");
  var grouped = document.getElementById("view-grouped");
  var ungrouped = document.getElementById("view-ungrouped");
  var summaryUngrouped = document.getElementById("summary-ungrouped");
  var summaryGrouped = document.getElementById("summary-grouped");
  var searchInput = document.getElementById("alerts-search");
  if (!switcher || !grouped || !ungrouped) return;

  function setView(view) {
    var isGrouped = view === "grouped";
    grouped.hidden = !isGrouped;
    ungrouped.hidden = isGrouped;
    if (summaryUngrouped) summaryUngrouped.hidden = isGrouped;
    if (summaryGrouped) summaryGrouped.hidden = !isGrouped;
    if (searchInput) {
      searchInput.placeholder = isGrouped
        ? "Search draft cases"
        : "Search alerts";
      var label = searchInput.closest("label");
      if (label) {
        label.setAttribute(
          "aria-label",
          isGrouped ? "Search draft cases" : "Search alerts"
        );
      }
    }
    switcher.querySelectorAll("[data-view]").forEach(function (tab) {
      var active = tab.getAttribute("data-view") === view;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
  }

  switcher.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-view]");
    if (!btn) return;
    setView(btn.getAttribute("data-view"));
  });

  // Dismissible inline tips — hide for this view only; reload shows again (demo)
  document.querySelectorAll("[data-dismiss-notif]").forEach(function (btn) {
    var id = btn.getAttribute("data-dismiss-notif");
    var el = id ? document.getElementById(id) : null;
    if (!el) return;
    btn.addEventListener("click", function () {
      el.hidden = true;
    });
  });
})();

/* Render Alerts page from SocDemoData (~156 alerts). */
(function () {
  if (!window.SocDemoData) return;
  var data = SocDemoData.corpus;
  var map = SocDemoData.alertsById();
  var counts = SocDemoData.severityCounts(data.alerts);
  var total = data.alerts.length;

  document.querySelectorAll(".soc-nav-badge").forEach(function (el) {
    if (el.closest('a[href*="alerts"]')) el.textContent = String(total);
  });

  var sub = document.querySelector(".soc-chart-panel .soc-chart-sub");
  if (sub && sub.closest(".soc-alert-summary")) {
    sub.textContent =
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

  var donut = document.querySelector(".soc-donut--lg");
  if (donut) {
    donut.setAttribute(
      "aria-label",
      total +
        " open alerts. Critical " +
        counts.critical +
        ", High " +
        counts.high +
        ", Medium " +
        counts.medium +
        ", Low " +
        counts.low
    );
    var segs = [
      { sel: ".soc-donut-seg--critical", n: counts.critical },
      { sel: ".soc-donut-seg--high", n: counts.high },
      { sel: ".soc-donut-seg--medium", n: counts.medium },
      { sel: ".soc-donut-seg--low", n: counts.low },
    ];
    var offset = 0;
    segs.forEach(function (s) {
      var el = donut.querySelector(s.sel);
      if (!el) return;
      var pct = total ? (s.n / total) * 100 : 0;
      el.setAttribute(
        "stroke-dasharray",
        pct.toFixed(2) + " " + (100 - pct).toFixed(2)
      );
      el.setAttribute("stroke-dashoffset", String(-offset));
      offset += pct;
    });
    var center = donut.querySelector(".soc-donut-center-value");
    if (center) center.textContent = String(total);
  }

  var legend = document.querySelectorAll(".soc-donut-legend strong");
  if (legend.length >= 4) {
    legend[0].textContent = String(counts.critical);
    legend[1].textContent = String(counts.high);
    legend[2].textContent = String(counts.medium);
    legend[3].textContent = String(counts.low);
  }

  var rulesPanel = document.querySelector(".soc-bars--rules");
  if (rulesPanel) {
    var rules = SocDemoData.topRules(data.alerts, 6);
    var max = rules[0] ? rules[0].count : 1;
    var colors = [
      "soc-bar-fill--phishing",
      "soc-bar-fill--unauth",
      "soc-bar-fill--malware",
      "",
      "soc-bar-fill--exfil",
      "",
    ];
    rulesPanel.innerHTML = rules
      .map(function (r, i) {
        var w = Math.round((r.count / max) * 100);
        var cls = colors[i] || "";
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

  var draftsRoot = document.getElementById("draft-cases-root");
  if (draftsRoot) {
    draftsRoot.innerHTML = data.drafts
      .map(function (d) {
        return SocDemoData.renderDraftGroup(d, map);
      })
      .join("");
  }

  var PAGE_SIZE = 50;
  var allBody = document.getElementById("alerts-all-body");
  var pager = document.getElementById("alerts-pagination");
  var rangeEl = document.getElementById("alerts-page-range");
  var selectEl = document.getElementById("alerts-page-select");
  var ofEl = document.getElementById("alerts-page-of");
  var prevBtn = document.getElementById("alerts-page-prev");
  var nextBtn = document.getElementById("alerts-page-next");
  var sorted = data.alerts.slice().sort(function (a, b) {
    return a.lastSeen.localeCompare(b.lastSeen);
  });
  var pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  var currentPage = 1;

  function enhancePage() {
    if (typeof window.socEnhanceIpEntityChips === "function") {
      window.socEnhanceIpEntityChips();
    }
  }

  function renderPage(page) {
    if (!allBody) return;
    currentPage = Math.min(Math.max(1, page), pageCount);
    var start = (currentPage - 1) * PAGE_SIZE;
    var end = Math.min(start + PAGE_SIZE, sorted.length);
    allBody.innerHTML = sorted
      .slice(start, end)
      .map(SocDemoData.renderAllAlertsRow)
      .join("");

    if (pager) {
      pager.hidden = sorted.length <= PAGE_SIZE;
      if (rangeEl) {
        rangeEl.textContent =
          sorted.length === 0
            ? "0 items"
            : start + 1 + "–" + end + " of " + sorted.length + " items";
      }
      if (ofEl) ofEl.textContent = "of " + pageCount;
      if (selectEl) {
        if (selectEl.options.length !== pageCount) {
          selectEl.innerHTML = Array.from({ length: pageCount }, function (_, i) {
            return '<option value="' + (i + 1) + '">' + (i + 1) + "</option>";
          }).join("");
        }
        selectEl.value = String(currentPage);
      }
      if (prevBtn) prevBtn.disabled = currentPage <= 1;
      if (nextBtn) nextBtn.disabled = currentPage >= pageCount;
    }

    enhancePage();
  }

  renderPage(1);

  if (selectEl) {
    selectEl.addEventListener("change", function () {
      renderPage(parseInt(selectEl.value, 10) || 1);
    });
  }
  if (prevBtn) {
    prevBtn.addEventListener("click", function () {
      renderPage(currentPage - 1);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      renderPage(currentPage + 1);
    });
  }

  var switcher = document.querySelector(".soc-switcher");
  var grouped = document.getElementById("view-grouped");
  var ungrouped = document.getElementById("view-ungrouped");
  if (!switcher || !grouped || !ungrouped) return;

  switcher.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-view]");
    if (!btn) return;
    switcher.querySelectorAll("[data-view]").forEach(function (tab) {
      var active = tab === btn;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    var view = btn.getAttribute("data-view");
    grouped.hidden = view !== "grouped";
    ungrouped.hidden = view !== "ungrouped";
  });
})();

/* Render Cases page from SocDemoData. */
(function () {
  if (!window.SocDemoData) return;
  var data = SocDemoData.corpus;
  var map = SocDemoData.alertsById();
  var total = data.alerts.length;

  document.querySelectorAll(".soc-nav a[href*='alerts'] .soc-nav-badge").forEach(function (el) {
    el.textContent = String(total);
  });

  var root = document.getElementById("cases-root");
  if (!root) return;

  root.innerHTML = data.openCases
    .map(function (c) {
      return SocDemoData.renderOpenCaseGroup(c, map);
    })
    .join("");

  if (typeof window.socEnhanceIpEntityChips === "function") {
    window.socEnhanceIpEntityChips();
  }

  var switcher = document.querySelector(".soc-switcher");
  var cases = document.querySelectorAll(".soc-incident-group[data-assignee]");
  if (!switcher) return;

  function applyFilter(filter) {
    cases = document.querySelectorAll(".soc-incident-group[data-assignee]");
    cases.forEach(function (card) {
      var assignee = card.getAttribute("data-assignee");
      var show = filter === "all" || assignee === "me";
      card.hidden = !show;
    });
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

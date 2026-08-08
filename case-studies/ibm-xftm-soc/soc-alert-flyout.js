/**
 * Alert detail Side Panel (Carbon for IBM Products pattern).
 * Right placement + overlay; full-bleed below md breakpoint (mobile-friendly).
 * @see https://carbondesignsystem.com/components/ (Side panel — ibm-products)
 */
import {
  STATUS_SHAPE_SVG,
  STATUS_SHAPE_LABEL,
  enhanceAllSeverity,
} from "./soc-status-shapes.js";

(function () {
  var ignoreBackdropUntil = 0;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function ensurePanel() {
    var existing = document.getElementById("soc-alert-flyout");
    if (existing) return existing;

    var backdrop = document.createElement("div");
    backdrop.className = "soc-flyout-backdrop";
    backdrop.hidden = true;
    backdrop.setAttribute("data-soc-alert-backdrop", "");

    var panel = document.createElement("aside");
    panel.id = "soc-alert-flyout";
    panel.className = "soc-flyout soc-flyout--side-panel soc-flyout--alert";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "soc-alert-flyout-title");
    panel.innerHTML =
      '<div class="soc-flyout__head">' +
      '<div class="soc-flyout__titles">' +
      '<p class="soc-flyout__label">Alert</p>' +
      '<h2 id="soc-alert-flyout-title" class="soc-flyout__title"></h2>' +
      '<p class="soc-flyout__subtitle" data-soc-alert-subtitle></p>' +
      "</div>" +
      '<button type="button" class="soc-flyout__close" aria-label="Close alert details">' +
      '<svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">' +
      '<path d="M17.414 16 24 9.414 22.586 8 16 14.586 9.414 8 8 9.414 14.586 16 8 22.586 9.414 24 16 17.414 22.586 24 24 22.586 17.414 16z"/>' +
      "</svg>" +
      "</button>" +
      "</div>" +
      '<div class="soc-flyout__body" data-soc-alert-body></div>' +
      '<div class="soc-flyout__actions" data-soc-alert-actions></div>';

    document.body.appendChild(backdrop);
    document.body.appendChild(panel);

    backdrop.addEventListener("click", function (event) {
      event.preventDefault();
      if (Date.now() < ignoreBackdropUntil) return;
      closeAlertFlyout();
    });

    panel.querySelector(".soc-flyout__close").addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      closeAlertFlyout();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      var open = document.getElementById("soc-alert-flyout");
      if (open && !open.hidden) closeAlertFlyout();
    });

    return panel;
  }

  function closeAlertFlyout() {
    var panel = document.getElementById("soc-alert-flyout");
    var backdrop = document.querySelector("[data-soc-alert-backdrop]");
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

  function showAlertFlyout() {
    var panel = ensurePanel();
    var backdrop = document.querySelector("[data-soc-alert-backdrop]");
    ignoreBackdropUntil = Date.now() + 400;
    if (backdrop) {
      backdrop.hidden = false;
      backdrop.classList.add("is-open");
    }
    panel.hidden = false;
    panel.classList.add("is-open");
    document.body.classList.add("soc-flyout-open");
    window.setTimeout(function () {
      try {
        var closeBtn = panel.querySelector(".soc-flyout__close");
        if (closeBtn) closeBtn.focus();
      } catch (err) {}
    }, 50);
  }

  function resolveAlert(id) {
    if (window.SocDemoData && typeof SocDemoData.getAlert === "function") {
      var demo = SocDemoData.getAlert(id);
      if (demo) return demo;
    }
    return null;
  }

  function summaryBullets(alert) {
    var ip = alert.ip || {};
    return [
      escapeHtml(alert.title) +
        " detected on " +
        escapeHtml(alert.source || "unknown host") +
        ".",
      "Source IP " +
        escapeHtml(ip.ip || "—") +
        (ip.country ? " (" + escapeHtml(ip.country) + ")" : "") +
        (ip.score != null ? ", reputation " + ip.score + "/10" : "") +
        ".",
      "ATDS disposition path: " + escapeHtml(alert.atds || "—") + ".",
      alert.caseId
        ? "Correlated to case " + escapeHtml(alert.caseId) + "."
        : "Not yet associated with an open case.",
    ];
  }

  function renderBody(alert) {
    var ip = alert.ip || {};
    var sev = alert.severity || "medium";
    var sevLabel = alert.severityLabel || sev;
    var caseHref = alert.caseId
      ? "./incident.html?case=" + encodeURIComponent(alert.caseId)
      : "./cases.html";
    var caseCell = alert.caseId
      ? '<a href="' + caseHref + '">' + escapeHtml(alert.caseId) + "</a>"
      : "—";

    var ipBtn =
      '<button type="button" class="soc-ip-link" data-ip="' +
      escapeHtml(ip.ip || "") +
      '" data-country="' +
      escapeHtml(ip.country || "") +
      '" data-flag="' +
      escapeHtml(ip.flag || "") +
      '" data-score="' +
      escapeHtml(ip.score != null ? String(ip.score) : "") +
      '" data-asn="' +
      escapeHtml(ip.asn || "") +
      '" data-org="' +
      escapeHtml(ip.org || "") +
      '" data-type="' +
      escapeHtml(ip.type || "") +
      '" data-categories="' +
      escapeHtml(ip.categories || "") +
      '" data-first-seen="' +
      escapeHtml(ip.firstSeen || "") +
      '" data-last-seen="' +
      escapeHtml(ip.lastSeen || "") +
      '">' +
      escapeHtml(ip.ip || "—") +
      "</button>";

    var bullets = summaryBullets(alert)
      .map(function (li) {
        return "<li>" + li + "</li>";
      })
      .join("");

    return (
      '<div class="soc-flyout__tags">' +
      '<span class="soc-tag soc-tag--severity soc-tag--' +
      escapeHtml(sev) +
      '">' +
      escapeHtml(sevLabel) +
      "</span>" +
      '<span class="soc-tag soc-tag--count">Open</span>' +
      "</div>" +
      '<dl class="soc-kv soc-flyout__kv">' +
      "<dt>Rule name</dt><dd>" +
      escapeHtml(alert.title || "—") +
      "</dd>" +
      "<dt>Status</dt><dd>Open · unassigned</dd>" +
      "<dt>Related case</dt><dd>" +
      caseCell +
      "</dd>" +
      "<dt>Source host</dt><dd>" +
      escapeHtml(alert.source || "—") +
      "</dd>" +
      "<dt>Source IP</dt><dd>" +
      ipBtn +
      "</dd>" +
      "<dt>Country / reputation</dt><dd>" +
      escapeHtml((ip.flag || "") + " " + (ip.country || "—")) +
      (ip.score != null ? " · " + ip.score + "/10" : "") +
      "</dd>" +
      "<dt>Last seen</dt><dd>May 28, 2025 · " +
      escapeHtml(alert.lastSeen || "—") +
      " UTC</dd>" +
      "<dt>ATDS</dt><dd>" +
      escapeHtml(alert.atds || "—") +
      "</dd>" +
      "</dl>" +
      '<div class="soc-flyout__section">' +
      "<h3>Event summary</h3>" +
      '<ul class="soc-takeaways">' +
      bullets +
      "</ul></div>"
    );
  }

  function openAlertFlyout(id) {
    var alert = resolveAlert(id);
    if (!alert) return;

    var panel = ensurePanel();
    var title = panel.querySelector("#soc-alert-flyout-title");
    var subtitle = panel.querySelector("[data-soc-alert-subtitle]");
    var body = panel.querySelector("[data-soc-alert-body]");
    var actions = panel.querySelector("[data-soc-alert-actions]");

    var sev = alert.severity || "medium";
    var shape = STATUS_SHAPE_SVG[sev] || STATUS_SHAPE_SVG.medium;
    var sevLabel = STATUS_SHAPE_LABEL[sev] || sev;
    title.innerHTML =
      '<span class="soc-sev soc-sev--' +
      escapeHtml(sev) +
      '" title="' +
      escapeHtml(sevLabel) +
      '" aria-hidden="true">' +
      shape +
      "</span>" +
      '<span class="soc-flyout__title-text">' +
      escapeHtml(alert.id) +
      "</span>";

    if (subtitle) subtitle.textContent = alert.title || "";

    body.innerHTML = renderBody(alert);
    actions.innerHTML =
      '<a class="soc-btn soc-btn--secondary" href="./alert.html?id=' +
      encodeURIComponent(alert.id) +
      '">Open full alert</a>' +
      '<button type="button" class="soc-btn soc-btn--primary" data-soc-alert-close>Done</button>';

    actions.querySelector("[data-soc-alert-close]").addEventListener("click", closeAlertFlyout);

    showAlertFlyout();

    if (typeof window.socEnhanceIpEntityChips === "function") {
      window.socEnhanceIpEntityChips();
    } else if (typeof enhanceAllSeverity === "function") {
      enhanceAllSeverity();
    }
  }

  function onActivate(event) {
    var trigger = event.target.closest("[data-alert-flyout]");
    if (!trigger) return;
    var id = trigger.getAttribute("data-alert-flyout");
    if (!id) return;
    event.preventDefault();
    event.stopPropagation();
    openAlertFlyout(id);
  }

  document.addEventListener("click", onActivate);
  document.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" && event.key !== " ") return;
    var trigger = event.target.closest("[data-alert-flyout]");
    if (!trigger) return;
    event.preventDefault();
    openAlertFlyout(trigger.getAttribute("data-alert-flyout"));
  });

  window.socOpenAlertFlyout = openAlertFlyout;
  window.socCloseAlertFlyout = closeAlertFlyout;
})();

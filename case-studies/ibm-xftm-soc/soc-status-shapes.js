/**
 * Carbon shape indicators for security severity.
 * @see https://carbondesignsystem.com/patterns/status-indicator-pattern/#shape-indicator
 *
 * Critical — right-angle wedge · $status-red · score 10
 * High — upward triangle · $status-red · score 7–9
 * Medium — diamond · $status-orange · score 4–6
 * Low — square · $status-yellow · score 0–3
 */
export const STATUS_SHAPE_SVG = {
  critical:
    '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M2 2h12v8.2L10.2 14H2V2z"/></svg>',
  high: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8 2.2 14.6 14H1.4L8 2.2z"/></svg>',
  medium:
    '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8 1.5 14.5 8 8 14.5 1.5 8 8 1.5z"/></svg>',
  low: '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><rect x="3" y="3" width="10" height="10" fill="currentColor"/></svg>',
  cautious:
    '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="none" stroke="currentColor" stroke-width="1.5" d="M8 3.2 13.8 13.5H2.2L8 3.2z"/></svg>',
  stable:
    '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="5" fill="currentColor"/></svg>',
  undefined:
    '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path fill="currentColor" d="M8 1.5 14.5 8 8 14.5 1.5 8 8 1.5z"/></svg>',
  failed:
    '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><circle cx="8" cy="8" r="6" fill="currentColor"/><path stroke="#161616" stroke-width="1.75" d="M4.2 4.2 11.8 11.8"/></svg>',
};

export const STATUS_SHAPE_LABEL = {
  critical: "Critical severity",
  high: "High severity",
  medium: "Medium severity",
  low: "Low severity",
  cautious: "Cautious",
  stable: "Stable",
  undefined: "Undefined",
  failed: "Failed",
};

var SEVERITY_TAG_LABELS = {
  Critical: "critical",
  High: "high",
  Medium: "medium",
  Low: "low",
};

function tierFromClassList(el) {
  var classes = el.className || "";
  var match = classes.match(
    /(?:soc-sev--|soc-status-shape--|soc-legend-swatch--|soc-dot--)(critical|high|medium|low|cautious|stable|undefined|failed)/
  );
  return match ? match[1] : null;
}

/** Fill empty `.soc-sev` / legacy swatch+dot markers with Carbon shapes. */
export function enhanceSeverityMarkers(root) {
  var scope = root || document;
  scope
    .querySelectorAll(
      ".soc-sev, .soc-legend-swatch--critical, .soc-legend-swatch--high, .soc-legend-swatch--medium, .soc-legend-swatch--low, .soc-dot--high, .soc-dot--medium, .soc-dot--critical, .soc-dot--low"
    )
    .forEach(function (el) {
      var tier = tierFromClassList(el);
      if (!tier || !STATUS_SHAPE_SVG[tier]) return;
      el.classList.add("soc-sev", "soc-sev--" + tier);
      el.classList.remove("soc-legend-swatch", "soc-dot");
      el.setAttribute("aria-hidden", "true");
      if (!el.querySelector("svg")) {
        el.innerHTML = STATUS_SHAPE_SVG[tier];
      }
    });
}

/** Prepend Carbon shape to severity tags (High / Medium / Low / Critical only). */
export function enhanceSeverityTags(root) {
  var scope = root || document;
  scope.querySelectorAll(".soc-tag").forEach(function (tag) {
    if (tag.querySelector(".soc-sev")) return;
    var label = (tag.textContent || "").trim();
    var tier = SEVERITY_TAG_LABELS[label];
    if (!tier) return;
    tag.classList.add("soc-tag--severity");
    var icon = document.createElement("span");
    icon.className = "soc-sev soc-sev--" + tier;
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML = STATUS_SHAPE_SVG[tier];
    tag.insertBefore(icon, tag.firstChild);
  });
}

export function enhanceAllSeverity(root) {
  enhanceSeverityMarkers(root);
  enhanceSeverityTags(root);
}

export function initStatusShapes() {
  enhanceAllSeverity();
}

window.socEnhanceSeverity = enhanceAllSeverity;

// Auto-init when loaded directly; when imported by soc-ip-flyout.js the flyout boot also calls enhance.
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initStatusShapes);
  } else {
    initStatusShapes();
  }
}

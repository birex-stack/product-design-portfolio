/** Mock Observability alerts inventory (~250) for the Alerts list page */

import { getDashboardById } from './dashboards_data';

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < String(str).length; i += 1) {
    h = (h * 31 + String(str).charCodeAt(i)) >>> 0;
  }
  return h;
}

function rand(seed, i) {
  const n = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

const SOURCES = [
  'APM',
  'Metrics',
  'Logs',
  'Uptime',
  'SLO',
  'Infrastructure',
  'Synthetics',
  'ML',
];

const RULES = [
  'APM latency threshold',
  'APM error rate',
  'Transaction duration anomaly',
  'Host CPU usage',
  'Memory usage threshold',
  'Disk space low',
  'Log rate spike',
  'Error log pattern',
  'Monitor status down',
  'TLS certificate expiry',
  'SLO burn rate',
  'Custom threshold rule',
  'Inventory threshold',
  'Synthetic journey failed',
  'Anomaly detection alert',
];

const SEVERITIES = ['critical', 'high', 'medium', 'low'];
const STATUSES = ['active', 'active', 'active', 'acknowledged', 'recovered'];

const REASONS = [
  'Threshold breached for the configured evaluation window',
  'Error rate exceeded 5% over the last 15 minutes',
  'p95 latency above objective for consecutive buckets',
  'Host metric crossed warning then critical threshold',
  'Multiple failed checks in the lookback period',
  'Burn rate exceeded multi-window SLO policy',
  'Anomalous spike detected versus baseline',
  'Dependency health degraded affecting traffic',
  'Monitor failed from 2 of 3 locations',
  'Log volume increased 8x vs prior period',
];

function buildSparkline(seed, points = 20) {
  const values = [];
  let v = 30 + (seed % 20);
  for (let i = 0; i < points; i += 1) {
    const r = rand(seed, i);
    const climb = i > points * 0.5 ? (i - points * 0.5) * 1.4 : 0;
    v = Math.max(8, Math.min(100, v + (r - 0.48) * 10 + climb * 0.2));
    values.push(Number(v.toFixed(2)));
  }
  return values;
}

function buildObservabilityAlerts(count = 250) {
  const alerts = [];
  for (let i = 0; i < count; i += 1) {
    const seed = hashSeed(`obs-alert-${i}`);
    const r0 = rand(seed, 1);
    const r1 = rand(seed, 2);
    const r2 = rand(seed, 3);
    const source = SOURCES[Math.floor(r0 * SOURCES.length)];
    // Bias rules toward matching sources a bit for credibility
    let rulePool = RULES;
    if (source === 'APM') rulePool = RULES.slice(0, 3);
    else if (source === 'Metrics' || source === 'Infrastructure')
      rulePool = RULES.slice(3, 6).concat(RULES.slice(12, 13));
    else if (source === 'Logs') rulePool = RULES.slice(6, 8);
    else if (source === 'Uptime') rulePool = RULES.slice(8, 10);
    else if (source === 'SLO') rulePool = RULES.slice(10, 12);
    else if (source === 'Synthetics') rulePool = [RULES[13]];
    else if (source === 'ML') rulePool = [RULES[14], RULES[2]];

    const rule = rulePool[Math.floor(r1 * rulePool.length)];
    const severity = SEVERITIES[Math.floor(r2 * SEVERITIES.length)];
    const status = STATUSES[Math.floor(rand(seed, 4) * STATUSES.length)];
    const day = 10 + (i % 18);
    const hour = String(Math.floor(rand(seed, 5) * 24)).padStart(2, '0');
    const minute = String(Math.floor(rand(seed, 6) * 60)).padStart(2, '0');
    const second = String(Math.floor(rand(seed, 7) * 60)).padStart(2, '0');
    const durationH = 1 + Math.floor(rand(seed, 8) * 48);

    alerts.push({
      id: `obs-alert-${i}`,
      name: `${rule} · ${source.toLowerCase()}-${(i % 40) + 1}`,
      rule,
      source,
      severity,
      status,
      reason: REASONS[Math.floor(rand(seed, 9) * REASONS.length)],
      triggeredAt: `${hour}:${minute}:${second} ${String(day).padStart(2, '0')}-08-23`,
      duration: `${durationH}h`,
      sparkline: buildSparkline(seed + i),
    });
  }
  return alerts;
}

export const OBSERVABILITY_ALERTS = buildObservabilityAlerts(250);

export const ALERT_SOURCES = SOURCES;
export const ALERT_RULES = RULES;
export const ALERT_SEVERITIES = SEVERITIES;
export const ALERT_STATUSES = ['active', 'acknowledged', 'recovered'];

export function aggregateAlertsBy(field, alerts) {
  const counts = new Map();
  for (const alert of alerts) {
    const key = alert[field] || 'Unknown';
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count);
}

export function getAlertById(id) {
  return OBSERVABILITY_ALERTS.find((alert) => alert.id === id) || null;
}

/** Synthetic context object for charts/flyouts that historically expected an SLO. */
export function getAlertContext(alert) {
  if (!alert) return null;
  return {
    id: alert.source || alert.id,
    name: alert.rule || alert.name,
  };
}

/** Other alerts sharing the same rule or source (excludes current). */
export function getRelatedAlerts(alert, limit = 12) {
  if (!alert) return [];
  return OBSERVABILITY_ALERTS.filter(
    (item) =>
      item.id !== alert.id &&
      (item.rule === alert.rule || item.source === alert.source)
  )
    .sort((a, b) => {
      const sameRuleA = a.rule === alert.rule ? 0 : 1;
      const sameRuleB = b.rule === alert.rule ? 0 : 1;
      return sameRuleA - sameRuleB || a.triggeredAt.localeCompare(b.triggeredAt);
    })
    .slice(0, limit);
}

function getInvestigationDashboardIds(alert) {
  const source = alert?.source;
  if (source === 'APM') return ['dashboard-2', 'dashboard-8'];
  if (source === 'Logs') return ['dashboard-3', 'dashboard-10'];
  if (source === 'Infrastructure' || source === 'Metrics')
    return ['dashboard-1', 'dashboard-10'];
  if (source === 'Uptime' || source === 'Synthetics')
    return ['dashboard-6', 'dashboard-7'];
  if (source === 'SLO') return ['dashboard-4', 'dashboard-10'];
  if (source === 'ML') return ['dashboard-9', 'dashboard-10'];
  return ['dashboard-10', 'dashboard-20'];
}

export function getInvestigationGuide(alert) {
  if (!alert) return null;

  const dashboards = getInvestigationDashboardIds(alert)
    .map((id) => getDashboardById(id))
    .filter(Boolean)
    .map((d) => ({ id: d.id, title: d.title }));

  const dashboardNames = dashboards.map((d) => d.title).join(' · ');

  return {
    title: `Investigation guide · ${alert.rule}`,
    summary: `Triage steps for ${alert.source} alerts triggered by “${alert.rule}”.`,
    steps: [
      {
        title: 'Confirm the alert is still active',
        body: `Check that status is still “${alert.status}” and review the activity chart for the evaluation window (${alert.duration}).`,
      },
      {
        title: 'Validate the triggering condition',
        body: alert.reason,
      },
      {
        title: 'Inspect related signals',
        body: `Review related alerts from ${alert.source} and the same rule, then correlate with recent logs around ${alert.triggeredAt}.`,
      },
      {
        title: 'Open investigation dashboards',
        body: `Use the linked dashboards${
          dashboardNames ? ` (${dashboardNames})` : ''
        } to compare this alert against the surrounding ${alert.source} context, including adjacent services and recent trend shifts.`,
        dashboards,
      },
      {
        title: 'Run investigation query',
        body: `Run the suggested ES|QL query scoped to this alert’s rule and time window to inspect matching documents and confirm the trigger around ${alert.triggeredAt}.`,
        query: [
          'FROM logs-*, metrics-*',
          `| WHERE kibana.alert.rule.name == "${alert.rule}"`,
          `| WHERE observer.type == "${alert.source}"`,
          `| WHERE @timestamp >= NOW() - 1 hour`,
          '| STATS count = COUNT(*), last_seen = MAX(@timestamp) BY host.name',
          '| SORT count DESC',
          '| LIMIT 20',
        ].join('\n'),
      },
      {
        title: 'Decide next action',
        body:
          alert.severity === 'critical' || alert.severity === 'high'
            ? 'Escalate or open a case if impact is confirmed. Acknowledge the alert while investigating.'
            : 'Acknowledge if expected noise, or continue monitoring if the trend is recovering.',
      },
    ],
  };
}

export function getLogsForAlert(alert, count = 24) {
  if (!alert) return [];
  const seed = hashSeed(alert.id);
  const service =
    alert.source === 'APM'
      ? 'checkout-api'
      : alert.source === 'Logs'
        ? 'logstash-ingest'
        : alert.source === 'Infrastructure' || alert.source === 'Metrics'
          ? 'host-metrics'
          : alert.source === 'Uptime' || alert.source === 'Synthetics'
            ? 'heartbeat'
            : alert.source === 'SLO'
              ? 'slo-burn-evaluator'
              : 'observability-agent';
  const levels = ['error', 'warn', 'info', 'info', 'debug'];
  const messages = [
    `Alert context: ${alert.rule}`,
    alert.reason,
    'Correlated span / metric sample above threshold',
    'Retrying failed request attempt=2',
    'Upstream dependency degraded',
    'Evaluation window sample recorded',
    'Health check probe failed on instance',
    'Dropped event: export queue full',
  ];

  const logs = [];
  for (let i = 0; i < count; i += 1) {
    const r = rand(seed, i + 20);
    const minute = String((i * 3 + (seed % 17)) % 60).padStart(2, '0');
    const hour = String(10 + ((i + seed) % 8)).padStart(2, '0');
    const second = String((i * 11) % 60).padStart(2, '0');
    const ms = String(Math.floor(r * 1000)).padStart(3, '0');
    const level = levels[(seed + i) % levels.length];
    logs.push({
      id: `${alert.id}-log-${i}`,
      timestamp: `${hour}:${minute}:${second}.${ms} 14-08-23`,
      level,
      service,
      message: messages[(seed + i * 3) % messages.length],
      host: `host-${((seed + i) % 6) + 1}.prod.internal`,
      durationMs:
        level === 'info' || level === 'debug'
          ? null
          : Math.round(400 + r * 3200),
    });
  }
  return logs;
}

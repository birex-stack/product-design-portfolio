/** Mock Kibana-style dashboards for the Dashboards listing page */

import { SLOS } from './data';

const CREATORS = [
  'elastic',
  'maciej',
  'sarah.chen',
  'alex.rivera',
  'jordan.lee',
  'Elastic',
];

const TAG_POOL = [
  'observability',
  'apm',
  'logs',
  'infrastructure',
  'slo',
  'production',
  'security',
  'uptime',
  'ml',
  'demo',
];

const TITLES = [
  ['[Metrics System] Host overview', 'Host CPU, memory, and disk overview for production fleets.'],
  ['[APM] Services inventory', 'Service health, latency, and error rate across APM services.'],
  ['[Logs] Error rate explorer', 'Log error patterns and volume spikes by service.'],
  ['SLO burn rate overview', 'Multi-window burn rates and error budget remaining.'],
  ['[Infrastructure] Kubernetes overview', 'Cluster, node, and pod resource utilization.'],
  ['Uptime monitors status', 'Monitor availability and TLS certificate expiry.'],
  ['[Synthetics] Journey health', 'Synthetic journey success rates by location.'],
  ['APM latency heat map', 'Transaction latency distribution for checkout flow.'],
  ['Logs anomaly detection', 'ML anomalies on log rate and rare message patterns.'],
  ['Observability overview', 'Cross-signal overview for SRE on-call triage.'],
  ['Service map dependencies', 'Dependency map with throughput and failure rates.'],
  ['Disk space forecasts', 'Host disk usage trends and forecasted exhaustion.'],
  ['Nginx access overview', 'Request rates, status codes, and top paths.'],
  ['Redis performance', 'Memory, hit ratio, and command latency.'],
  ['PostgreSQL health', 'Connections, locks, and slow queries.'],
  ['AWS EC2 inventory', 'Instance inventory with CPU credit and network metrics.'],
  ['Azure VM metrics', 'VM guest metrics and availability sets.'],
  ['GCP GKE overview', 'GKE node pools and workload resource pressure.'],
  ['RUM Core Web Vitals', 'LCP, INP, and CLS by page and browser.'],
  ['Alerting activity', 'Alert volume by rule type, severity, and source.'],
  ['Case management load', 'Open cases by severity and assignee workload.'],
  ['Mobile APM overview', 'Crash-free sessions and app start times.'],
  ['JVM memory pools', 'Heap, GC, and thread pool saturation.'],
  ['Kafka lag monitor', 'Consumer lag by topic and consumer group.'],
  ['Elasticsearch cluster health', 'Cluster status, shard allocation, and indexing rate.'],
  ['Fleet agent status', 'Agent enrollment, policy health, and check-ins.'],
  ['Security host alerts', 'Host-based detections correlated with observability signals.'],
  ['CI pipeline duration', 'Build duration and failure rate by pipeline.'],
  ['CDN edge performance', 'Edge latency and cache hit ratio by region.'],
  ['Billing cost explorer', 'Cloud spend by service and environment tag.'],
];

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

function formatDate(daysAgo, hourOffset = 10) {
  const d = new Date(Date.UTC(2026, 6, 28));
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(hourOffset, (daysAgo * 7) % 60, 0, 0);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function buildDashboards() {
  return TITLES.map(([title, description], i) => {
    const seed = hashSeed(`dashboard-${i}`);
    const r0 = rand(seed, 1);
    const r1 = rand(seed, 2);
    const r2 = rand(seed, 3);
    const creator = CREATORS[Math.floor(r0 * CREATORS.length)];
    const managed = creator === 'Elastic';
    const tagCount = 1 + Math.floor(r1 * 3);
    const tags = [];
    for (let t = 0; t < tagCount; t += 1) {
      const tag = TAG_POOL[(seed + t * 5) % TAG_POOL.length];
      if (!tags.includes(tag)) tags.push(tag);
    }
    const updatedDays = Math.floor(r2 * 40);
    const viewedDays = Math.floor(rand(seed, 4) * Math.min(updatedDays + 5, 20));

    return {
      id: `dashboard-${i + 1}`,
      title,
      description,
      tags,
      creator,
      managed,
      updatedAt: formatDate(updatedDays, 9 + (i % 8)),
      lastViewedAt: formatDate(viewedDays, 11 + (i % 6)),
      starred: i % 7 === 0 || i % 11 === 0,
      views90d: Math.round(20 + rand(seed, 5) * 480),
    };
  });
}

export const DASHBOARDS = buildDashboards();

export const DASHBOARD_TAGS = [...new Set(DASHBOARDS.flatMap((d) => d.tags))].sort();

export const DASHBOARD_CREATORS = [
  ...new Set(DASHBOARDS.map((d) => d.creator)),
].sort((a, b) => a.localeCompare(b));

export function getDashboardById(id) {
  if (id === AI_INVESTIGATION_DASHBOARD_ID) {
    return getAiInvestigationDashboard();
  }
  return DASHBOARDS.find((d) => d.id === id) || null;
}

/** Dashboard generated by AI from an Event timeline for incident troubleshooting. */
export const AI_INVESTIGATION_DASHBOARD_ID = 'dashboard-ai-dependency-investigation';

const INVESTIGATION_EVENTS_KEY = 'elastic-slo-proto-investigation-events';

export function stashInvestigationEvents(events) {
  try {
    sessionStorage.setItem(INVESTIGATION_EVENTS_KEY, JSON.stringify(events || []));
  } catch {
    /* ignore quota / private mode */
  }
}

export function loadInvestigationEvents() {
  try {
    const raw = sessionStorage.getItem(INVESTIGATION_EVENTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function getAiInvestigationDashboard() {
  return {
    id: AI_INVESTIGATION_DASHBOARD_ID,
    title: 'AI investigation · dependency timeline',
    description:
      'Generated from Event timeline — one chart per correlated signal to troubleshoot the observed problem and dependencies.',
    tags: ['ai', 'investigation', 'observability', 'apm'],
    creator: 'Elastic AI Agent',
    starred: true,
    status: 'success',
    lastUpdated: new Date().toISOString().slice(0, 16).replace('T', ' '),
    layout: 'investigationTimeline',
  };
}

function series(seed, points, base, volatility) {
  const values = [];
  let v = base;
  for (let i = 0; i < points; i += 1) {
    const r = rand(seed, i + 3);
    v = Math.max(0, v + (r - 0.48) * volatility);
    values.push({ x: i, y: Number(v.toFixed(2)) });
  }
  return values;
}

function metricTrend(seed, base, volatility, points = 24) {
  return series(seed, points, base, volatility);
}

/**
 * Kibana-style panel layout (48-col grid mapped to 12 CSS columns).
 * Starting-point layout from docs: metric row → half charts → full table,
 * plus a collapsible section for secondary panels.
 */
export function getDashboardPanels(dashboard) {
  if (!dashboard) return null;
  const seed = hashSeed(dashboard.id);
  const theme = dashboard.tags.includes('apm')
    ? 'apm'
    : dashboard.tags.includes('logs')
      ? 'logs'
      : dashboard.tags.includes('slo')
        ? 'slo'
        : dashboard.tags.includes('infrastructure') ||
            dashboard.tags.includes('observability')
          ? 'infra'
          : 'general';

  const labels =
    theme === 'apm'
      ? {
          m1: 'Avg latency (p95)',
          m2: 'Error rate',
          m3: 'Throughput',
          m4: 'Failed transactions',
          c1: 'Latency over time',
          c2: 'Error rate over time',
          c3: 'Transactions by service',
          table: 'Top services by latency',
          s1: 'HTTP status distribution',
          s2: 'Slowest transactions',
        }
      : theme === 'logs'
        ? {
            m1: 'Log rate',
            m2: 'Error logs',
            m3: 'Warn logs',
            m4: 'Unique hosts',
            c1: 'Log volume over time',
            c2: 'Error rate over time',
            c3: 'Top log categories',
            table: 'Noisiest services',
            s1: 'Log level breakdown',
            s2: 'Hosts with most errors',
          }
        : theme === 'slo'
          ? {
              m1: 'SLI',
              m2: 'Error budget left',
              m3: 'Burn rate (1h)',
              m4: 'Active alerts',
              c1: 'SLI over time',
              c2: 'Burn rate over time',
              c3: 'Good vs bad events',
              table: 'SLO status by service',
              s1: 'Budget remaining distribution',
              s2: 'Alerts by severity',
            }
          : {
              m1: 'CPU P95',
              m2: 'Memory P95',
              m3: 'Disk used',
              m4: 'Hosts online',
              c1: 'CPU usage over time P95',
              c2: 'Memory usage over time P95',
              c3: 'Hosts by status',
              table: 'Top hosts by CPU P95',
              s1: 'Disk usage distribution',
              s2: 'Network throughput',
            };

  const m1 = 40 + rand(seed, 10) * 50;
  const m2 = theme === 'apm' || theme === 'logs' ? rand(seed, 11) * 8 : 30 + rand(seed, 11) * 40;
  const m3 = theme === 'apm' ? 200 + rand(seed, 12) * 800 : 20 + rand(seed, 12) * 60;
  const m4 = theme === 'slo' ? Math.round(1 + rand(seed, 13) * 12) : Math.round(10 + rand(seed, 13) * 90);

  const formatMetric = (key, value) => {
    if (key === 'm1' && (theme === 'apm')) return `${value.toFixed(0)} ms`;
    if (key === 'm1' && theme === 'logs') return `${value.toFixed(0)}/s`;
    if (key === 'm1' && theme === 'slo') return `${value.toFixed(2)}%`;
    if (key === 'm2' && (theme === 'apm' || theme === 'logs')) return `${value.toFixed(2)}%`;
    if (key === 'm2' && theme === 'slo') return `${value.toFixed(1)}%`;
    if (key === 'm3' && theme === 'apm') return `${value.toFixed(0)} tpm`;
    if (key === 'm3' && theme === 'slo') return `${value.toFixed(2)}x`;
    if (key === 'm4' && theme !== 'slo' && theme !== 'general') return `${Math.round(value)}`;
    if (theme === 'general' || theme === 'infra') {
      if (key === 'm4') return `${Math.round(value)}`;
      return `${value.toFixed(1)}%`;
    }
    return `${Math.round(value)}`;
  };

  const metricValues = {
    m1: theme === 'slo' ? 95 + rand(seed, 10) * 4.5 : m1,
    m2: theme === 'slo' ? 10 + rand(seed, 11) * 60 : m2,
    m3: theme === 'slo' ? 0.5 + rand(seed, 12) * 8 : m3,
    m4,
  };

  const categories =
    theme === 'apm'
      ? ['checkout', 'payments', 'auth', 'catalog', 'search', 'cart']
      : theme === 'logs'
        ? ['nginx', 'app', 'kube', 'ingest', 'agent', 'proxy']
        : theme === 'slo'
          ? ['api', 'checkout', 'payments', 'search', 'mobile', 'bff']
          : ['host-1', 'host-2', 'host-3', 'host-4', 'host-5', 'host-6'];

  const barData = categories.map((label, i) => ({
    x: i,
    label,
    y: Math.round(20 + rand(seed, 20 + i) * (theme === 'apm' ? 400 : 100)),
  }));

  const pieData = (
    theme === 'apm'
      ? [
          { key: '2xx', count: 820 },
          { key: '4xx', count: 95 },
          { key: '5xx', count: 48 },
        ]
      : theme === 'logs'
        ? [
            { key: 'info', count: 640 },
            { key: 'warn', count: 210 },
            { key: 'error', count: 90 },
            { key: 'debug', count: 40 },
          ]
        : theme === 'slo'
          ? [
              { key: 'healthy', count: 12 },
              { key: 'degrading', count: 4 },
              { key: 'violated', count: 2 },
            ]
          : [
              { key: '<50%', count: 18 },
              { key: '50–80%', count: 22 },
              { key: '>80%', count: 9 },
            ]
  ).map((row, i) => ({
    ...row,
    count: Math.round(row.count * (0.7 + rand(seed, 40 + i) * 0.6)),
  }));

  const tableRows = categories.slice(0, 8).map((name, i) => ({
    id: `${dashboard.id}-row-${i}`,
    name,
    metric: formatMetric(
      'm1',
      (theme === 'slo' ? 94 : 30) + rand(seed, 50 + i) * (theme === 'slo' ? 5 : 70)
    ),
    secondary: Math.round(10 + rand(seed, 60 + i) * 90),
    status: rand(seed, 70 + i) > 0.75 ? 'degraded' : 'healthy',
  }));

  const availabilitySlo =
    SLOS.find((s) => s.id === 'payment-availability') ||
    SLOS.find((s) => (s.tags || []).includes('availability')) ||
    SLOS[0];
  const alertCount = Math.round(2 + rand(seed, 91) * 28);

  const heatmapServices = ['checkout', 'payments', 'auth', 'search'];
  const heatmapBuckets = ['p50', 'p75', 'p90', 'p95', 'p99'];
  const heatmapData = [];
  heatmapServices.forEach((service, yi) => {
    heatmapBuckets.forEach((bucket, xi) => {
      heatmapData.push({
        x: bucket,
        y: service,
        value: Math.round(40 + xi * 35 + rand(seed, 100 + yi * 10 + xi) * 80),
      });
    });
  });

  // Throughput (req/s) — neutral capacity metric, not health/severity
  const bulletValue = Math.round(1800 + rand(seed, 92) * 2200);
  const bulletPrevious = Math.round(2200 + rand(seed, 93) * 1200);

  return {
    timeRange: 'Last 24 hours',
    metrics: [
      {
        id: 'metric-1',
        title: labels.m1,
        subtitle: 'Last 15 minutes',
        value: metricValues.m1,
        valueFormatter: (d) => formatMetric('m1', d),
        trend: metricTrend(seed + 1, metricValues.m1 * 0.85, metricValues.m1 * 0.08),
        w: 3,
        h: 5,
      },
      {
        id: 'metric-2',
        title: labels.m2,
        subtitle: 'Last 15 minutes',
        value: metricValues.m2,
        valueFormatter: (d) => formatMetric('m2', d),
        trend: metricTrend(seed + 2, metricValues.m2 * 0.9, Math.max(0.5, metricValues.m2 * 0.12)),
        w: 3,
        h: 5,
      },
      {
        id: 'metric-3',
        title: labels.m3,
        subtitle: 'Last 15 minutes',
        value: metricValues.m3,
        valueFormatter: (d) => formatMetric('m3', d),
        trend: metricTrend(seed + 3, metricValues.m3 * 0.8, Math.max(1, metricValues.m3 * 0.1)),
        w: 3,
        h: 5,
      },
      {
        id: 'metric-4',
        title: labels.m4,
        subtitle: 'Current',
        value: metricValues.m4,
        valueFormatter: (d) => formatMetric('m4', d),
        domain: theme === 'slo' ? [0, 20] : [0, 100],
        w: 3,
        h: 5,
      },
    ],
    /** Extra panel types to showcase Metric (SLO + alerts), Heatmap, and Bullet. */
    showcase: {
      tiles: [
        {
          id: 'slo-tile',
          type: 'sloTile',
          sloId: availabilitySlo.id,
          title: 'Availability SLO',
          value: availabilitySlo.sli,
          target: availabilitySlo.target,
          status: availabilitySlo.status,
          alerts: availabilitySlo.alerts,
          sparkline: availabilitySlo.sparkline,
          w: 6,
          height: 140,
        },
        {
          id: 'alerts-metric',
          type: 'alertsMetric',
          title: 'Active alerts',
          subtitle: 'Last 24 hours',
          value: alertCount,
          valueFormatter: (d) => `${Math.round(d)}`,
          trend: metricTrend(seed + 8, alertCount * 0.7, Math.max(1, alertCount * 0.25)),
          w: 6,
        },
      ],
      charts: [
        {
          id: 'chart-bullet',
          type: 'bullet',
          title: 'Request throughput',
          subtitle: 'Last 15 minutes · vs previous period',
          value: bulletValue,
          target: bulletPrevious,
          targetLabel: 'Previously',
          domain: [0, 5000],
          valueUnit: 'req/s',
          w: 6,
        },
        {
          id: 'chart-heatmap',
          type: 'heatmap',
          title: 'Latency heatmap by service',
          metricName: 'Latency',
          xLabelName: 'Percentile',
          yLabelName: 'Service',
          w: 6,
          data: heatmapData,
        },
      ],
    },
    primaryCharts: [
      {
        id: 'chart-line',
        type: 'line',
        title: labels.c1,
        w: 6,
        h: 12,
        data: series(seed + 5, 36, metricValues.m1 * 0.9, Math.max(2, metricValues.m1 * 0.1)),
      },
      {
        id: 'chart-area',
        type: 'area',
        title: labels.c2,
        w: 6,
        h: 12,
        data: series(seed + 6, 36, metricValues.m2 * 0.9, Math.max(0.4, metricValues.m2 * 0.15)),
      },
    ],
    fullWidth: {
      id: 'chart-bar',
      type: 'bar',
      title: labels.c3,
      w: 12,
      h: 12,
      data: barData,
    },
    table: {
      id: 'table',
      title: labels.table,
      w: 12,
      h: 15,
      columns:
        theme === 'apm'
          ? [
              { field: 'name', name: 'Service' },
              { field: 'metric', name: 'p95 latency' },
              { field: 'secondary', name: 'Throughput' },
              { field: 'status', name: 'Status' },
            ]
          : theme === 'logs'
            ? [
                { field: 'name', name: 'Service' },
                { field: 'metric', name: 'Log rate' },
                { field: 'secondary', name: 'Errors' },
                { field: 'status', name: 'Status' },
              ]
            : theme === 'slo'
              ? [
                  { field: 'name', name: 'Service' },
                  { field: 'metric', name: 'SLI' },
                  { field: 'secondary', name: 'Budget %' },
                  { field: 'status', name: 'Status' },
                ]
              : [
                  { field: 'name', name: 'Host' },
                  { field: 'metric', name: 'CPU P95' },
                  { field: 'secondary', name: 'Memory P95 %' },
                  { field: 'status', name: 'Status' },
                ],
      rows: tableRows,
    },
    section: {
      id: 'section-details',
      title: 'Supporting details',
      collapsedByDefault: false,
      panels: [
        {
          id: 'chart-pie',
          type: 'pie',
          title: labels.s1,
          w: 6,
          h: 12,
          data: pieData,
        },
        {
          id: 'chart-bar-secondary',
          type: 'bar',
          title: labels.s2,
          w: 6,
          h: 12,
          data: barData
            .slice()
            .sort((a, b) => b.y - a.y)
            .slice(0, 5)
            .map((row, i) => ({ ...row, x: i })),
        },
      ],
    },
  };
}

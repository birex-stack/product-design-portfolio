/** Mock SLO / SLI data for the Elastic Observability prototype */

function sparkline(seed, base, volatility, points = 28) {
  const values = [];
  let v = base;
  for (let i = 0; i < points; i += 1) {
    const n = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
    const r = n - Math.floor(n);
    v = Math.min(100, Math.max(0, v + (r - 0.48) * volatility));
    values.push(Number(v.toFixed(2)));
  }
  return values;
}

/**
 * Metric trend Y-scale is [0, maxY]; the band is only the bottom 50% of the
 * card and maxY sits at the vertical middle. SLI-like values (~99) therefore
 * hug that middle line. This series keeps peaks at `peak` (same midline) and
 * pulls valleys down toward ~valleyFloor so the area reaches nearer the value %.
 */
function metricTrend(seed, base, volatility, points = 28) {
  const peak = 100;
  const valleyFloor = Math.max(28, 42 - volatility * 5);
  const values = [];

  for (let i = 0; i < points; i += 1) {
    const t = i / (points - 1);
    const n1 = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
    const n2 = Math.sin(seed * 4.17 + i * 19.13) * 23421.631;
    const r1 = n1 - Math.floor(n1);
    const r2 = n2 - Math.floor(n2);

    const waveA = 0.55 + 0.45 * Math.sin(t * Math.PI * (1.6 + (seed % 5) * 0.35) + seed);
    const waveB = 0.5 + 0.5 * Math.sin(t * Math.PI * (3.2 + (seed % 3)) + r1 * 2);
    const dip = Math.pow(Math.sin(t * Math.PI * (2 + (seed % 4)) + seed * 0.7), 2);
    const noise = (r1 - 0.5) * 0.28 + (r2 - 0.5) * 0.14;

    const healthBias = Math.min(1, Math.max(0, (base - 90) / 10));
    let shape = waveA * 0.45 + waveB * 0.35 + (1 - dip) * 0.2 + noise;
    shape = shape * (0.5 + healthBias * 0.35) + healthBias * 0.12;
    shape = Math.min(1, Math.max(0, shape));

    values.push(Number((valleyFloor + shape * (peak - valleyFloor)).toFixed(2)));
  }

  const maxIdx = values.reduce((best, y, i, arr) => (y > arr[best] ? i : best), 0);
  values[maxIdx] = peak;
  return values;
}

function barSeries(seed, points = 14) {
  const bars = [];
  for (let i = 0; i < points; i += 1) {
    const n = Math.sin(seed * 7.1 + i * 3.3) * 10000;
    const r = Math.abs(n - Math.floor(n));
    const good = Math.round(180000 + r * 220000);
    const bad = Math.round(2000 + r * (seed % 2 === 0 ? 18000 : 90000));
    bars.push({
      id: `bar-${seed}-${i}`,
      label: `Day ${i + 1}`,
      timestamp: `2023-08-${String(i + 1).padStart(2, '0')} 10:00`,
      good,
      bad,
    });
  }
  return bars;
}

function eventsForBar(bar, sloName, kind = 'bad') {
  const isGood = kind === 'good';
  const total = isGood ? bar.good : bar.bad;
  const count = Math.min(
    12,
    Math.max(4, Math.round(total / (isGood ? 80000 : 8000)))
  );
  const statuses = isGood
    ? ['ok', 'success', '2xx', 'ok']
    : ['error', 'timeout', '5xx', 'latency'];
  const messages = isGood
    ? [
        'Request completed successfully',
        'Response within latency objective',
        'Healthy upstream response',
      ]
    : [
        'Request failed with status 503',
        'p95 latency exceeded objective threshold',
        'Upstream timeout after 2.5s',
      ];
  // Match alert Triggered format: "hh:mm:ss dd-mm-yy"
  const datePart = String(bar.timestamp || '').split(/\s+/)[0] || '2023-08-01';
  const [, month = '08', day = '01'] = datePart.split('-');
  const displayDate = `${day}-${month}-23`;

  const events = [];
  for (let i = 0; i < count; i += 1) {
    const hour = String(10 + (i % 5)).padStart(2, '0');
    const minute = String((i * 7) % 60).padStart(2, '0');
    const second = String((i * 11) % 60).padStart(2, '0');
    events.push({
      id: `${bar.id}-${kind}-evt-${i}`,
      kind,
      timestamp: `${hour}:${minute}:${second} ${displayDate}`,
      service: sloName.includes('Checkout') ? 'checkout-api' : 'op-beans',
      type: statuses[i % statuses.length],
      message: messages[i % messages.length],
      durationMs: isGood ? 80 + i * 15 : 800 + i * 120,
    });
  }
  return events;
}

export const SLOS = [
  {
    id: 'web-app-latency',
    name: 'Web App — Page Load Latency',
    status: 'healthy',
    sli: 99.45,
    target: 99.0,
    tags: ['frontend', 'latency'],
    window: '30 days rolling',
    alerts: 1,
    description:
      'Tracks page load latency for the customer-facing web application against a 99% availability-style latency objective.',
    sparkline: metricTrend(1, 99.2, 0.35),
    burnSeries: sparkline(11, 2.2, 1.8).map((v) => Number((v / 10).toFixed(2))),
    budgetSeries: sparkline(21, 40, 4),
    goodBad: barSeries(1),
  },
  {
    id: 'checkout-latency',
    name: 'Checkout API request latency',
    status: 'violated',
    sli: 95.21,
    target: 99.95,
    tags: ['checkout', 'api'],
    window: '7 days rolling',
    alerts: 13,
    description:
      'Latency objective for checkout API requests. Currently burning error budget after sustained elevated p95.',
    sparkline: metricTrend(2, 96.5, 1.6),
    burnSeries: sparkline(12, 8, 3).map((v) => Number((v / 5).toFixed(2))),
    budgetSeries: sparkline(22, 8, 6),
    goodBad: barSeries(2),
  },
  {
    id: 'order-success',
    name: 'Order processing success rate',
    status: 'healthy',
    sli: 99.3,
    target: 99.0,
    tags: ['orders', 'availability'],
    window: '30 days rolling',
    alerts: 0,
    description:
      'Success rate of order processing workflows across payment confirmation and fulfillment enqueue.',
    sparkline: metricTrend(3, 99.1, 0.4),
    burnSeries: sparkline(13, 1.5, 1.2).map((v) => Number((v / 12).toFixed(2))),
    budgetSeries: sparkline(23, 55, 3),
    goodBad: barSeries(3),
  },
  {
    id: 'payment-availability',
    name: 'Payment gateway availability',
    status: 'violated',
    sli: 84.11,
    target: 99.95,
    tags: ['payments', 'availability'],
    window: '7 days rolling',
    alerts: 8,
    description:
      'Availability of the payment gateway dependency measured from successful authorization responses.',
    sparkline: metricTrend(4, 88, 3.5),
    burnSeries: sparkline(14, 14, 4).map((v) => Number((v / 4).toFixed(2))),
    budgetSeries: sparkline(24, -2, 5),
    goodBad: barSeries(4),
  },
  {
    id: 'host-availability',
    name: 'Host op-beans availability',
    status: 'violated',
    sli: 98.45,
    target: 99.25,
    tags: ['op-beans', 'availability'],
    window: '7 days rolling',
    alerts: 2,
    description:
      'Host-level availability for op-beans. Used as the default deep-dive example for burn rate and good vs bad events.',
    sparkline: metricTrend(5, 98.8, 1.1),
    burnSeries: sparkline(15, 6, 2.5).map((v) => Number((v / 6).toFixed(2))),
    budgetSeries: sparkline(25, 5, 4),
    goodBad: barSeries(5),
    instanceFilters: [
      { field: 'host.name', value: 'my-host.com' },
      { field: 'host.region', value: 'Europe' },
    ],
  },
  {
    id: 'search-latency',
    name: 'Search API latency',
    status: 'warning',
    sli: 99.05,
    target: 99.0,
    tags: ['search', 'latency'],
    window: '30 days rolling',
    alerts: 3,
    description: 'p95 latency objective for catalog search API endpoints.',
    sparkline: metricTrend(6, 99.0, 0.7),
    burnSeries: sparkline(16, 5, 2).map((v) => Number((v / 8).toFixed(2))),
    budgetSeries: sparkline(26, 22, 4),
    goodBad: barSeries(6),
  },
  {
    id: 'auth-success',
    name: 'Authentication success rate',
    status: 'warning',
    sli: 99.91,
    target: 99.9,
    tags: ['auth', 'availability'],
    window: '30 days rolling',
    alerts: 2,
    description: 'Successful login and token refresh ratio for identity services.',
    sparkline: metricTrend(7, 99.9, 0.35),
    burnSeries: sparkline(17, 4.5, 1.6).map((v) => Number((v / 9).toFixed(2))),
    budgetSeries: sparkline(27, 28, 3),
    goodBad: barSeries(7),
  },
  {
    id: 'notifications-delivery',
    name: 'Notifications delivery rate',
    status: 'violated',
    sli: 97.02,
    target: 99.5,
    tags: ['notifications'],
    window: '7 days rolling',
    alerts: 4,
    description: 'Successful push/email notification delivery against attempted sends.',
    sparkline: metricTrend(8, 97.5, 1.4),
    burnSeries: sparkline(18, 7, 2).map((v) => Number((v / 7).toFixed(2))),
    budgetSeries: sparkline(28, 12, 4),
    goodBad: barSeries(8),
  },
  {
    id: 'cart-availability',
    name: 'Shopping cart API availability',
    status: 'healthy',
    sli: 99.72,
    target: 99.5,
    tags: ['cart', 'api', 'availability'],
    window: '30 days rolling',
    alerts: 0,
    description:
      'Availability of cart read/write endpoints measured by non-5xx responses within the objective window.',
    sparkline: metricTrend(9, 99.6, 0.35),
    burnSeries: sparkline(19, 1.8, 1.1).map((v) => Number((v / 12).toFixed(2))),
    budgetSeries: sparkline(29, 48, 3),
    goodBad: barSeries(9),
  },
  {
    id: 'inventory-freshness',
    name: 'Inventory sync freshness',
    status: 'violated',
    sli: 96.4,
    target: 99.0,
    tags: ['inventory', 'data'],
    window: '7 days rolling',
    alerts: 6,
    description:
      'Percentage of SKU stock updates applied to the storefront within the freshness SLO threshold.',
    sparkline: metricTrend(10, 97.2, 1.5),
    burnSeries: sparkline(20, 9, 2.5).map((v) => Number((v / 6).toFixed(2))),
    budgetSeries: sparkline(30, 10, 5),
    goodBad: barSeries(10),
  },
  {
    id: 'cdn-cache-hit',
    name: 'CDN cache hit ratio',
    status: 'healthy',
    sli: 94.8,
    target: 90.0,
    tags: ['cdn', 'frontend'],
    window: '30 days rolling',
    alerts: 0,
    description:
      'Ratio of edge cache hits for static assets and product media served through the CDN.',
    sparkline: metricTrend(11, 94.2, 0.9),
    burnSeries: sparkline(21, 2.1, 1.0).map((v) => Number((v / 14).toFixed(2))),
    budgetSeries: sparkline(31, 58, 2),
    goodBad: barSeries(11),
  },
  {
    id: 'graphql-latency',
    name: 'GraphQL gateway p95 latency',
    status: 'warning',
    sli: 99.02,
    target: 99.0,
    tags: ['graphql', 'api', 'latency'],
    window: '30 days rolling',
    alerts: 2,
    description:
      'p95 latency objective for BFF GraphQL queries excluding introspection and health checks.',
    sparkline: metricTrend(12, 99.05, 0.6),
    burnSeries: sparkline(22, 5.2, 1.8).map((v) => Number((v / 8).toFixed(2))),
    budgetSeries: sparkline(32, 24, 4),
    goodBad: barSeries(12),
  },
  {
    id: 'kyc-completion',
    name: 'KYC verification completion rate',
    status: 'violated',
    sli: 91.33,
    target: 98.0,
    tags: ['kyc', 'compliance'],
    window: '7 days rolling',
    alerts: 9,
    description:
      'Share of identity verification workflows completed successfully within the allowed processing window.',
    sparkline: metricTrend(13, 93.5, 2.2),
    burnSeries: sparkline(23, 11, 3).map((v) => Number((v / 5).toFixed(2))),
    budgetSeries: sparkline(33, 4, 5),
    goodBad: barSeries(13),
  },
  {
    id: 'mobile-crash-free',
    name: 'Mobile app crash-free sessions',
    status: 'healthy',
    sli: 99.67,
    target: 99.5,
    tags: ['mobile', 'reliability'],
    window: '30 days rolling',
    alerts: 0,
    description:
      'Percentage of iOS and Android sessions that complete without a fatal crash or ANR.',
    sparkline: metricTrend(14, 99.55, 0.3),
    burnSeries: sparkline(24, 1.4, 0.9).map((v) => Number((v / 13).toFixed(2))),
    budgetSeries: sparkline(34, 52, 2),
    goodBad: barSeries(14),
  },
  {
    id: 'log-ingest-latency',
    name: 'Log ingest pipeline latency',
    status: 'warning',
    sli: 98.15,
    target: 98.0,
    tags: ['observability', 'ingest', 'latency'],
    window: '30 days rolling',
    alerts: 3,
    description:
      'Share of log documents indexed within the ingest latency budget from shipper to searchable.',
    sparkline: metricTrend(15, 98.3, 0.8),
    burnSeries: sparkline(25, 5.5, 1.8).map((v) => Number((v / 8).toFixed(2))),
    budgetSeries: sparkline(35, 20, 4),
    goodBad: barSeries(15),
  },
  {
    id: 'recommendation-availability',
    name: 'Recommendations service availability',
    status: 'violated',
    sli: 97.85,
    target: 99.9,
    tags: ['ml', 'recommendations', 'availability'],
    window: '7 days rolling',
    alerts: 5,
    description:
      'Availability of personalized recommendation responses excluding graceful empty fallbacks.',
    sparkline: metricTrend(16, 98.2, 1.3),
    burnSeries: sparkline(26, 8.5, 2.2).map((v) => Number((v / 6).toFixed(2))),
    budgetSeries: sparkline(36, 9, 4),
    goodBad: barSeries(16),
  },
];

export function getSloById(id) {
  return SLOS.find((slo) => slo.id === id) || SLOS[4];
}

export function getEventsForBar(slo, bar, kind = 'bad') {
  return eventsForBar(bar, slo.name, kind);
}

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

/** Metric series used by alert activity chart + table sparklines. */
export function buildAlertActivitySeries(seed = 1, points = 36) {
  const values = [];
  let v = 42;
  for (let i = 0; i < points; i += 1) {
    const n = Math.sin(seed * 9.1 + i * 4.7) * 10000;
    const r = n - Math.floor(n);
    const climb = i > points * 0.45 ? (i - points * 0.45) * 1.8 : 0;
    v = Math.max(10, Math.min(120, v + (r - 0.48) * 8 + climb * 0.15));
    values.push(Number(v.toFixed(2)));
  }
  return values;
}

export function getAlertsForSlo(slo) {
  const seed = hashSeed(slo.id);
  const count = Math.max(0, slo.alerts || 0);
  const severities = ['critical', 'high', 'medium', 'low'];
  const statuses = ['active', 'active', 'active', 'acknowledged'];
  const reasons = [
    'Burn rate exceeded 14x threshold over 1h window',
    'Error budget nearly exhausted for current period',
    'SLI dropped below objective for 3 consecutive windows',
    'High burn rate detected on long window (72h)',
    'Multiple bad events spiked above baseline',
    'Dependency latency contributing to SLO breach',
  ];

  const alerts = [];
  for (let i = 0; i < count; i += 1) {
    const minute = String((i * 5 + (seed % 13)) % 60).padStart(2, '0');
    const hour = String(8 + ((i + seed) % 10)).padStart(2, '0');
    const alertId = `${slo.id}-alert-${i}`;
    // Same seed as AlertActivityChart so list sparkline matches detail trend
    const seriesSeed = (slo.id?.length || 1) + alertId.length;
    const sloRules = [
      'SLO burn rate',
      'Custom threshold rule',
      'Error budget burn',
    ];
    alerts.push({
      id: alertId,
      name: `${slo.name} · alert ${i + 1}`,
      source: 'SLO',
      rule: sloRules[(seed + i) % sloRules.length],
      severity: severities[(seed + i) % severities.length],
      status: statuses[(seed + i) % statuses.length],
      reason: reasons[(seed + i * 2) % reasons.length],
      triggeredAt: `${hour}:${minute}:00 14-08-23`,
      duration: `${1 + ((seed + i) % 12)}h`,
      sparkline: buildAlertActivitySeries(seriesSeed, 24),
    });
  }
  return alerts;
}

export function getLogsForSlo(slo, count = 24) {
  const seed = hashSeed(slo.id);
  const service =
    slo.tags.includes('checkout') || slo.name.includes('Checkout')
      ? 'checkout-api'
      : slo.tags.includes('auth')
        ? 'identity-service'
        : slo.tags.includes('search')
          ? 'search-api'
          : slo.tags.includes('payments')
            ? 'payments-gateway'
            : 'op-beans';
  const levels = ['error', 'warn', 'info', 'info', 'debug'];
  const messages = [
    'Request completed with elevated latency',
    'Upstream dependency timeout after 2500ms',
    'http.response.status_code=503',
    'Retrying failed request attempt=2',
    'Circuit breaker half-open for downstream service',
    'SLO burn rate crossed 2x threshold',
    'Connection pool exhausted, queueing request',
    'Cache miss for product catalog fragment',
    'Authentication token refresh succeeded',
    'Dropped span: export queue full',
    'p95 latency sample above objective',
    'Health check probe failed on instance',
  ];

  const logs = [];
  for (let i = 0; i < count; i += 1) {
    const n = Math.sin(seed * 1.7 + i * 9.3) * 10000;
    const r = Math.abs(n - Math.floor(n));
    const minute = String((i * 3 + (seed % 17)) % 60).padStart(2, '0');
    const hour = String(10 + ((i + seed) % 8)).padStart(2, '0');
    const second = String((i * 11) % 60).padStart(2, '0');
    const ms = String((i * 37 + seed) % 1000).padStart(3, '0');
    const level = levels[(seed + i) % levels.length];
    logs.push({
      id: `${slo.id}-log-${i}`,
      timestamp: `${hour}:${minute}:${second}.${ms} 14-08-23`,
      level,
      service,
      message: messages[(seed + i * 3) % messages.length],
      host: `host-${((seed + i) % 6) + 1}.prod.internal`,
      durationMs: level === 'info' || level === 'debug' ? null : Math.round(400 + r * 3200),
    });
  }
  return logs;
}

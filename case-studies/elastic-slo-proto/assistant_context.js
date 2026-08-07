/**
 * Contextual Elastic AI Agent / AIOps conversation seeds for detail views.
 * Grounded in mock SLO, alert, and dashboard state (RAG-style prototype).
 */

function sloRootCause(slo) {
  const tags = (slo.tags || []).join(' ').toLowerCase();
  if (tags.includes('checkout') || tags.includes('api')) {
    return {
      cause:
        'Sustained p95 latency on the checkout API, most likely from a degraded payments dependency and elevated retry amplification.',
      signals: [
        'Burn rate elevated across the 1h and 6h windows',
        'Bad-event volume concentrated on checkout hosts in Europe',
        'Correlated APM spans show upstream timeouts to payments-gateway',
      ],
      advice: [
        'Open the investigation dashboard for checkout latency and confirm dependency health',
        'Run the suggested ES|QL query scoped to the SLO evaluation window',
        'Acknowledge the active burn-rate alerts while you validate impact',
        'If payments-gateway error rate remains high, escalate to the payments on-call and open a case',
      ],
    };
  }
  if (tags.includes('frontend') || tags.includes('latency')) {
    return {
      cause:
        'Client-side page load regressions, likely from a recent frontend bundle change or CDN cache miss spike.',
      signals: [
        'SLI dipping near the objective boundary on page-load samples',
        'Good/bad event mix shows longer TTFB on a subset of routes',
        'No matching infrastructure CPU saturation on origin hosts',
      ],
      advice: [
        'Compare RUM Core Web Vitals for the affected routes',
        'Check the latest deploy / CDN invalidation timeline',
        'Filter the SLO by host.region to isolate geographic impact',
        'Continue monitoring burn rate before escalating',
      ],
    };
  }
  if (tags.includes('availability') || tags.includes('orders')) {
    return {
      cause:
        'Intermittent order-processing failures during fulfillment enqueue, with a secondary contribution from payment confirmation retries.',
      signals: [
        'Success-rate SLI oscillating around the objective',
        'Log pattern analysis shows elevated 5xx on fulfillment-worker',
        'Related alerts clustering around the same evaluation window',
      ],
      advice: [
        'Inspect fulfillment-worker error logs and queue lag',
        'Correlate with the order success SLO burn chart',
        'Use AIOps log rate spike detection for the worker service',
        'Prepare a case if budget remaining drops below 20%',
      ],
    };
  }
  return {
    cause:
      'Error-budget burn driven by a mix of elevated latency and error samples across the service’s critical path.',
    signals: [
      `Current SLI ${slo.sli.toFixed(2)}% against a ${slo.target.toFixed(2)}% objective`,
      `${slo.alerts} related alert${slo.alerts === 1 ? '' : 's'} in the lookback window`,
      'Trend shows degradation concentrated in the most recent evaluation buckets',
    ],
    advice: [
      'Review SLI, burn rate, and budget remaining panels together',
      'Open related alerts and confirm they share the same rule/source',
      'Run an investigation query over the SLO time window',
      'Acknowledge noise only after validating there is no customer impact',
    ],
  };
}

function alertRootCause(alert) {
  const source = alert.source || 'Observability';
  if (source === 'SLO') {
    return {
      cause:
        'Multi-window SLO burn-rate policy breached — short and long windows both indicate sustained budget consumption.',
      signals: [
        alert.reason,
        `Severity ${alert.severity}, status ${alert.status}, duration ${alert.duration}`,
        'Related alerts share the same burn-rate rule family',
      ],
      advice: [
        'Open the linked SLO burn rate overview dashboard',
        'Validate whether the SLO is recovering in the latest buckets',
        'Run the investigation ES|QL query around the trigger time',
        'Escalate if severity stays critical and budget remaining is negative',
      ],
    };
  }
  if (source === 'APM') {
    return {
      cause:
        'Application performance regression: latency or error-rate threshold crossed on a critical transaction group.',
      signals: [
        alert.reason,
        `Rule “${alert.rule}” fired from APM`,
        'Correlated traces likely show dependency or code-path slowdown',
      ],
      advice: [
        'Open the APM service overview for the affected transaction',
        'Compare p95 latency and failed transaction rate before/after trigger',
        'Check recent deploys and dependency health',
        'Use the investigation guide steps and mark the alert acknowledged while triaging',
      ],
    };
  }
  if (source === 'Logs') {
    return {
      cause:
        'Log-rate or error-pattern anomaly detected by AIOps / ML against the recent baseline.',
      signals: [
        alert.reason,
        'Sudden increase in error/warn volume versus prior period',
        'Likely concentrated on a small set of hosts or services',
      ],
      advice: [
        'Open log categorization / pattern analysis for the spike window',
        'Filter to error level and group by service.name / host.name',
        'Correlate with infrastructure metrics for the same hosts',
        'Capture a sample query in the investigation guide for handoff',
      ],
    };
  }
  return {
    cause: `Threshold or anomaly condition from ${source} indicating degraded health in the monitored signal.`,
    signals: [
      alert.reason,
      `Triggered at ${alert.triggeredAt} · ${alert.duration}`,
      `Source ${source} · rule “${alert.rule}”`,
    ],
    advice: [
      'Confirm the alert is still active in the overview chart',
      'Inspect related alerts and correlated logs',
      'Open the investigation dashboard suggested in the guide',
      'Decide whether to acknowledge, escalate, or continue monitoring',
    ],
  };
}

function dashboardRootCause(dashboard) {
  const tags = (dashboard.tags || []).join(' ').toLowerCase();
  const title = dashboard.title.toLowerCase();
  if (tags.includes('slo') || title.includes('slo') || title.includes('burn')) {
    return {
      cause:
        'Dashboard KPIs show accelerating error-budget burn with SLI below objective on one or more services.',
      signals: [
        'Metric row indicates SLI / budget pressure in the last 15 minutes',
        'Burn rate time series trending upward versus the 24h baseline',
        'Table rows marked degraded concentrate on a subset of services',
      ],
      advice: [
        'Focus on degraded services in the detail table first',
        'Cross-check with the SLO detail view for those services',
        'Use the supporting donut to see budget distribution skew',
        'Ask me to draft an ES|QL query for the worst offender',
      ],
    };
  }
  if (tags.includes('apm') || title.includes('apm') || title.includes('latency')) {
    return {
      cause:
        'APM panels show elevated latency and a rising error share, pointing to a hot transaction or dependency.',
      signals: [
        'Avg latency and error-rate metrics above typical operating range',
        'Latency over time chart shows a step change in the recent window',
        'Top services by latency highlight a clear outlier',
      ],
      advice: [
        'Drill into the highest-latency service from the table',
        'Compare throughput versus error rate to rule out load-only effects',
        'Check HTTP status distribution in supporting details',
        'Correlate with infrastructure CPU/memory if the service is host-bound',
      ],
    };
  }
  if (tags.includes('logs') || title.includes('log')) {
    return {
      cause:
        'Log volume and error-level share are elevated versus baseline — consistent with an application or ingest incident.',
      signals: [
        'Log rate and error log metrics elevated in the last 15 minutes',
        'Error rate over time shows a spike aligned with noisier services',
        'Log level breakdown skewed toward warn/error',
      ],
      advice: [
        'Start with the noisiest services table',
        'Apply log pattern analysis around the spike',
        'Filter hosts with most errors in the supporting bar chart',
        'Link findings back to any active log-based alerts',
      ],
    };
  }
  return {
    cause:
      'Host / infrastructure KPIs indicate resource pressure (CPU, memory, or disk) on a subset of the fleet.',
    signals: [
      'Avg CPU / memory / disk metrics approaching warning thresholds',
      'Time series show sustained elevation rather than a single spike',
      'Top hosts by CPU include one or more degraded nodes',
    ],
    advice: [
      'Inspect degraded hosts from the detail table',
      'Check disk usage distribution for capacity risk',
      'Correlate with APM or SLO views if those hosts serve critical traffic',
      'Consider scaling or reclaiming resources on the hottest nodes',
    ],
  };
}

function buildAssistantText({ entityLabel, observed, analysis }) {
  const signalLines = analysis.signals.map((s) => `• ${s}`).join('\n');
  const adviceLines = analysis.advice
    .map((a, i) => `${i + 1}. ${a}`)
    .join('\n');

  return [
    `I’ve reviewed the current context for **${entityLabel}** using your observability data (metrics, logs/traces where available, and related alerts).`,
    '',
    '### What I observed',
    observed,
    '',
    '### Probable root cause',
    analysis.cause,
    '',
    '### Supporting signals',
    signalLines,
    '',
    '### Recommended next steps',
    adviceLines,
    '',
    'I can open an investigation dashboard, draft an ES|QL query, or walk through the investigation guide steps with you.',
  ].join('\n');
}

function conversationShell({ title, userPrompt, assistantText, tools, extraMessages = [] }) {
  return {
    title,
    agentName: 'Elastic AI Agent',
    agentSubtitle: 'Observability · Agent Builder',
    messages: [
      {
        id: 'u1',
        role: 'user',
        index: 1,
        text: userPrompt,
      },
      {
        id: 'e1',
        role: 'events',
        count: 2,
        items: [
          'Loaded page context and time range',
          'Retrieved related alerts and recent metric samples',
        ],
      },
      {
        id: 'a1',
        role: 'assistant',
        tools: tools || [
          { name: 'get_dataset_info', detail: 'Inspected available log and metric datasets' },
          { name: 'query_observability_data', detail: 'Queried SLI / alert signals for this context' },
        ],
        text: assistantText,
      },
      ...extraMessages,
    ],
  };
}

function buildDependencyTimeline(request = {}) {
  const seriesName = request.seriesName || 'metric';
  const anchor = request.timeLabel || 'selected point';
  const valueLabel =
    request.value != null && Number.isFinite(Number(request.value))
      ? ` (${Number(request.value).toFixed(2)}${request.valueUnit || ''})`
      : '';

  return [
    {
      id: 'dep-1',
      time: '13:58:04',
      date: '28-07-26',
      type: 'deploy',
      title: 'Deploy completed · payments-gateway v2.14.3',
      detail: 'Rolling restart finished across 6 pods in eu-west-1',
      service: 'payments-gateway',
      environment: 'production',
      region: 'eu-west-1',
      fields: [
        { title: 'Version', description: 'v2.14.3' },
        { title: 'Strategy', description: 'Rolling restart · 6 pods' },
        { title: 'Triggered by', description: 'ci-deploy / release-bot' },
        { title: 'Duration', description: '4m 12s' },
      ],
    },
    {
      id: 'dep-2',
      time: '14:01:22',
      date: '28-07-26',
      type: 'apm',
      title: 'APM latency spike · checkout → payments',
      detail: 'p95 span duration jumped from 180ms to 1.4s on /authorize',
      service: 'checkout-api',
      environment: 'production',
      region: 'eu-west-1',
      fields: [
        { title: 'Transaction', description: 'POST /authorize' },
        { title: 'p95 before', description: '180 ms' },
        { title: 'p95 after', description: '1.4 s' },
        { title: 'Downstream', description: 'payments-gateway' },
      ],
    },
    {
      id: 'dep-3',
      time: '14:02:11',
      date: '28-07-26',
      type: 'log',
      title: 'New log pattern · upstream timeout',
      detail:
        '“payments-gateway: context deadline exceeded” first seen on checkout-api',
      service: 'checkout-api',
      environment: 'production',
      region: 'eu-west-1',
      fields: [
        { title: 'Level', description: 'error' },
        { title: 'Pattern', description: 'context deadline exceeded' },
        { title: 'First seen', description: '14:02:11' },
        { title: 'Count (15m)', description: '248' },
      ],
      sample:
        'ERROR checkout-api payments-gateway: context deadline exceeded after 3000ms',
    },
    {
      id: 'dep-4',
      time: '14:03:48',
      date: '28-07-26',
      type: 'alert',
      title: 'Alert fired · SLO burn rate',
      detail: `Correlated with ${seriesName}${valueLabel} near ${anchor}`,
      service: seriesName,
      environment: 'production',
      region: 'eu-west-1',
      fields: [
        { title: 'Severity', description: 'critical' },
        { title: 'Status', description: 'active' },
        { title: 'Rule', description: 'SLO burn rate' },
        { title: 'Window', description: '1h / 6h multi-window' },
      ],
    },
    {
      id: 'dep-5',
      time: '14:04:15',
      date: '28-07-26',
      type: 'metric',
      title: 'Metric anomaly · retry amplification',
      detail: 'Client retry rate 4.2× baseline on checkout hosts',
      service: 'checkout-api',
      environment: 'production',
      region: 'eu-west-1',
      fields: [
        { title: 'Metric', description: 'client.retry.rate' },
        { title: 'Baseline', description: '0.8 / min' },
        { title: 'Observed', description: '3.4 / min (4.2×)' },
        { title: 'Hosts', description: '12 checkout hosts' },
      ],
    },
    {
      id: 'dep-6',
      time: '14:05:02',
      date: '28-07-26',
      type: 'dependency',
      title: 'Dependency health degraded · redis-session',
      detail: 'Command latency elevated; connected service map edge highlighted',
      service: 'redis-session',
      environment: 'production',
      region: 'eu-west-1',
      fields: [
        { title: 'Dependency', description: 'redis-session' },
        { title: 'Command p95', description: '42 ms → 310 ms' },
        { title: 'Connected from', description: 'checkout-api, payments-gateway' },
        { title: 'Health', description: 'degraded' },
      ],
    },
    {
      id: 'dep-7',
      time: '14:06:40',
      date: '28-07-26',
      type: 'log',
      title: 'Log volume surge · fulfillment-worker',
      detail: 'Warn/error rate +320% vs prior 15m window',
      service: 'fulfillment-worker',
      environment: 'production',
      region: 'eu-west-1',
      fields: [
        { title: 'Level mix', description: 'warn 68% · error 22% · info 10%' },
        { title: 'Delta vs baseline', description: '+320%' },
        { title: 'Top message', description: 'payment authorization delayed' },
        { title: 'Window', description: '15m' },
      ],
      sample:
        'WARN fulfillment-worker payment authorization delayed; enqueue retry',
    },
    {
      id: 'dep-8',
      time: '14:08:05',
      date: '28-07-26',
      type: 'alert',
      title: 'Related alert · APM error rate',
      detail: 'Same dependency cluster; acknowledged by on-call',
      service: 'payments-gateway',
      environment: 'production',
      region: 'eu-west-1',
      fields: [
        { title: 'Severity', description: 'high' },
        { title: 'Status', description: 'acknowledged' },
        { title: 'Rule', description: 'APM error rate' },
        { title: 'Acknowledged by', description: 'on-call / jordan' },
      ],
    },
  ];
}

/** Conversation seeded when user runs “Analyze dependencies” from a chart tooltip. */
export function getDependencyAnalysisConversation(request) {
  const seriesName = request?.seriesName || 'selected metric';
  const timeLabel = request?.timeLabel || 'the selected time range';
  const timeline = buildDependencyTimeline(request || {});

  const assistantText = [
    `I correlated **${seriesName}** around **${timeLabel}** with upstream/downstream services, alerts, and newly observed logs.`,
    '',
    'Here’s the ordered **event timeline** for this window — icons show the signal type (deploy, APM, logs, alerts, metrics, dependencies).',
  ].join('\n');

  const summaryAndRecommendation = [
    '### Summary',
    'The selected point aligns with a **payments-gateway v2.14.3 deploy**, followed within minutes by APM latency on `/authorize`, a new upstream-timeout log pattern on checkout-api, and elevated burn-rate / error-rate alerts. **redis-session** latency and checkout retry amplification look like secondary amplifiers, not the original trigger.',
    '',
    '### Recommendation',
    '1. **Treat the deploy as the primary suspect** — compare `/authorize` spans before vs after v2.14.3 and check for timeout / connection-pool changes.',
    '2. **Validate redis-session** next — if command latency stays high, it will keep driving retries even after payments recovers.',
    '3. **Acknowledge duplicate burn-rate siblings** once impact is confirmed, and keep the parent SLO / APM error-rate alerts open until p95 and timeout logs return to baseline.',
    '',
    'I can draft an ES|QL query for the timeout pattern, open the related investigation dashboards, or walk the first critical alert with you.',
  ].join('\n');

  return conversationShell({
    title: `Dependency analysis · ${seriesName}`,
    userPrompt: `Analyze dependencies around ${timeLabel} on ${seriesName}. What happened in this window?`,
    assistantText,
    tools: [
      {
        name: 'analyze_service_dependencies',
        detail: `Mapped dependency graph for ${seriesName}`,
      },
      {
        name: 'correlate_timeline_events',
        detail: `Merged ${timeline.length} deploy / APM / log / alert / metric events`,
      },
      {
        name: 'detect_new_log_patterns',
        detail: 'Found new timeout pattern on checkout-api',
      },
    ],
    extraMessages: [
      {
        id: 'tl1',
        role: 'timeline',
        title: 'Event timeline',
        items: timeline,
      },
      {
        id: 'a2',
        role: 'assistant',
        text: summaryAndRecommendation,
      },
    ],
  });
}

function alertsInventoryReport(alerts = []) {
  const active = alerts.filter((a) => a.status === 'active');
  const needsAction = active.filter(
    (a) => a.severity === 'critical' || a.severity === 'high'
  );
  const byRule = new Map();
  for (const a of needsAction) {
    byRule.set(a.rule, (byRule.get(a.rule) || 0) + 1);
  }
  const topRule =
    [...byRule.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ||
    'SLO burn rate';
  const topAlert =
    needsAction.find((a) => a.rule === topRule) || needsAction[0] || alerts[0];

  return {
    signals: 12430,
    incidents: 184,
    autoHandled: 153,
    needsActionNow: Math.max(8, Math.min(needsAction.length, 12)),
    inventoryCount: alerts.length,
    activeCount: active.length,
    topRule,
    topAlert,
  };
}

export function getAssistantConversation({ type, slo, alert, dashboard, alerts }) {
  if (type === 'alertsInventory') {
    const report = alertsInventoryReport(alerts);
    const firstAlertName = report.topAlert?.name || 'the highest-severity active alert';
    const assistantText = [
      'I’ve scanned the Alerts inventory for the current lookback window and correlated noisy signals into workable incidents.',
      '',
      '### Shift summary',
      `Detected **${report.signals.toLocaleString()}** signals, correlated them into **${report.incidents}** incidents, **${report.autoHandled}** handled automatically, **${report.needsActionNow}** require action now.`,
      '',
      `In this inventory view you’re looking at **${report.inventoryCount}** alert rows (**${report.activeCount}** still active). The largest open cluster is **${report.topRule}**.`,
      '',
      '### Do this first',
      `1. **Open \`${firstAlertName}\`** (filter Severity → critical/high, then sort by the ${report.topRule} rule) — confirm customer impact before acknowledging anything else.`,
      '2. If burn / latency is still climbing, acknowledge the duplicate siblings in that rule so the queue shrinks to the parent incident.',
      '3. Only then fan out to medium/low noise — most of it was already auto-correlated above.',
      '',
      'I can filter the table to that rule, draft an investigation ES|QL query, or walk the first critical alert with you.',
    ].join('\n');

    return conversationShell({
      title: 'Alerts inventory · triage briefing',
      userPrompt:
        'Give me a shift-style report on this alerts inventory: how much noise vs real work, and what I should do first.',
      assistantText,
      tools: [
        {
          name: 'summarize_alert_inventory',
          detail: `Correlated ${report.signals.toLocaleString()} signals → ${report.incidents} incidents`,
        },
        {
          name: 'rank_open_incidents',
          detail: `${report.needsActionNow} incidents need human action; top rule “${report.topRule}”`,
        },
        {
          name: 'suggest_first_action',
          detail: `Prioritized ${firstAlertName}`,
        },
      ],
    });
  }

  if (type === 'slo' && slo) {
    const analysis = sloRootCause(slo);
    const observed = [
      `SLO **${slo.name}** is currently **${slo.status}** with SLI **${slo.sli.toFixed(2)}%** vs objective **${slo.target.toFixed(2)}%** (${slo.window}).`,
      `There ${slo.alerts === 1 ? 'is' : 'are'} **${slo.alerts}** related alert${slo.alerts === 1 ? '' : 's'}. Tags: ${slo.tags.join(', ') || 'none'}.`,
      slo.description,
    ].join(' ');

    return conversationShell({
      title: `Investigating SLO health · ${slo.name}`,
      userPrompt: `Analyze this SLO and tell me what looks wrong, the likely root cause, and what I should do next.`,
      assistantText: buildAssistantText({
        entityLabel: slo.name,
        observed,
        analysis,
      }),
      tools: [
        { name: 'get_slo_summary', detail: `Loaded SLI, burn rate, and budget for ${slo.id}` },
        { name: 'get_related_alerts', detail: `Found ${slo.alerts} related alert(s)` },
        { name: 'analyze_burn_rate', detail: 'Compared short vs long burn windows' },
      ],
    });
  }

  if (type === 'alert' && alert) {
    const analysis = alertRootCause(alert);
    const observed = [
      `Alert **${alert.name}** (${alert.severity}/${alert.status}) from **${alert.source}** via rule “${alert.rule}”.`,
      `Triggered at ${alert.triggeredAt}, duration ${alert.duration}.`,
      alert.reason,
    ].join(' ');

    return conversationShell({
      title: `Investigating alert · ${alert.name}`,
      userPrompt: `Help me investigate this alert. What’s going on, what’s the probable root cause, and what should I do?`,
      assistantText: buildAssistantText({
        entityLabel: alert.name,
        observed,
        analysis,
      }),
      tools: [
        { name: 'get_alert_details', detail: `Loaded alert ${alert.id}` },
        { name: 'get_dataset_info', detail: `Mapped ${alert.source} datasets for correlation` },
        { name: 'get_related_alerts', detail: 'Retrieved same-rule / same-source alerts' },
      ],
    });
  }

  if (type === 'dashboard' && dashboard) {
    const analysis = dashboardRootCause(dashboard);
    const observed = [
      `Dashboard **${dashboard.title}** — ${dashboard.description}`,
      `Tags: ${dashboard.tags.join(', ') || 'none'}. Last updated ${dashboard.updatedAt}.`,
      'KPI metrics and charts in the current time range (Last 24 hours) show several signals worth investigating.',
    ].join(' ');

    return conversationShell({
      title: `Investigating dashboard · ${dashboard.title}`,
      userPrompt: `Look at this dashboard and summarize what you observe, the probable root cause of any issues, and what you recommend.`,
      assistantText: buildAssistantText({
        entityLabel: dashboard.title,
        observed,
        analysis,
      }),
      tools: [
        { name: 'get_dashboard_panels', detail: `Loaded metrics and charts for ${dashboard.id}` },
        { name: 'get_dataset_info', detail: 'Resolved backing data views for panel queries' },
        { name: 'detect_anomalies', detail: 'Ran AIOps-style spike / trend checks on KPI series' },
      ],
    });
  }

  return conversationShell({
    title: 'Elastic AI Agent',
    userPrompt: 'Help me investigate the current observability context.',
    assistantText:
      'I don’t have a specific SLO, alert, or dashboard context yet. Open a detail view and ask again.',
  });
}

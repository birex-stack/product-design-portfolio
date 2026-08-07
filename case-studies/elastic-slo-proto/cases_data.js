/** Mock Cases inventory for Observability Cases list + detail */

export const CASE_SEVERITIES = ['critical', 'high', 'medium', 'low'];
export const CASE_STATUSES = ['open', 'in progress', 'closed'];
export const CASE_CATEGORIES = [
  'Incident',
  'Inquiry',
  'Post-mortem',
  'Threat hunt',
  'False positive',
];

const REPORTERS = [
  'John Wood',
  'Elena Foster',
  'Sam Okonkwo',
  'Priya Shah',
  'Alex Rivera',
];

const ASSIGNEES = [
  { name: 'John Wood', initials: 'JW' },
  { name: 'Elena Foster', initials: 'EF' },
  { name: 'Sam Okonkwo', initials: 'SO' },
  { name: 'Priya Shah', initials: 'PS' },
];

function hashSeed(str) {
  return String(str || '')
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

function rand(seed, i) {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function pick(seed, i, list) {
  return list[Math.floor(rand(seed, i) * list.length) % list.length];
}

function formatCaseTime(offsetMinutes) {
  const d = new Date('2025-01-18T14:12:31');
  d.setMinutes(d.getMinutes() - offsetMinutes);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

function relativeUpdate(minutesAgo) {
  if (minutesAgo < 60) return `${minutesAgo} minutes ago`;
  if (minutesAgo < 1440) return `${Math.round(minutesAgo / 60)} hours ago`;
  return `${Math.round(minutesAgo / 1440)} days ago`;
}

const CASE_SEEDS = [
  {
    id: '125',
    title: 'Suspicious OAuth Token Usage — M365',
    severity: 'critical',
    status: 'in progress',
    category: 'Incident',
    tags: ['DDoS', 'EMEA', 'Production'],
    alertCount: 3,
    commentCount: 5,
    description:
      'Multiple OAuth consent grants and unusual Graph API activity for a service principal tied to M365. Indicators match Threat Intel Filebeat module hits; investigating lateral movement and token replay.',
  },
  {
    id: '237623',
    title: 'Threat Intel Filebeat Module Indicator Match',
    severity: 'critical',
    status: 'in progress',
    category: 'Incident',
    tags: ['DDoS', 'EMEA', 'Production'],
    alertCount: 3,
    commentCount: 4,
    description:
      'Threat Intel Filebeat module matched known-bad indicators against inbound DNS and HTTP telemetry. Correlate with host isolation and confirm whether the match is a true positive before escalating to IR.',
  },
  {
    id: '118',
    title: 'Elevated error rate on checkout-api',
    severity: 'high',
    status: 'open',
    category: 'Incident',
    tags: ['APM', 'checkout', 'Production'],
    alertCount: 2,
    commentCount: 1,
    description:
      'Checkout API 5xx rate crossed SLO burn threshold. Initial look points to redis-session latency; case opened from Observability alerts.',
  },
  {
    id: '112',
    title: 'Host disk forecast — op-beans-node',
    severity: 'medium',
    status: 'open',
    category: 'Inquiry',
    tags: ['infrastructure', 'disk'],
    alertCount: 1,
    commentCount: 0,
    description:
      'Disk usage forecast for op-beans-node exceeds 90% within 48h. Track remediation and capacity ticket.',
  },
  {
    id: '109',
    title: 'TLS certificate expiry — synthetics journey',
    severity: 'medium',
    status: 'in progress',
    category: 'Inquiry',
    tags: ['uptime', 'tls'],
    alertCount: 1,
    commentCount: 2,
    description:
      'Synthetic monitor detected TLS certificate expiring within 14 days for the checkout journey endpoint.',
  },
  {
    id: '104',
    title: 'Anomalous log rate spike — nginx ingress',
    severity: 'low',
    status: 'closed',
    category: 'False positive',
    tags: ['logs', 'nginx'],
    alertCount: 1,
    commentCount: 3,
    description:
      'Log rate anomaly during a planned load test. Closed as expected behavior after confirming change window.',
  },
  {
    id: '101',
    title: 'Payment gateway availability SLO burn',
    severity: 'critical',
    status: 'open',
    category: 'Incident',
    tags: ['SLO', 'payments'],
    alertCount: 4,
    commentCount: 6,
    description:
      'Payment gateway availability SLO violated. Case aggregates burn-rate alerts and dependency timeline from AI investigation.',
  },
  {
    id: '97',
    title: 'Ransomware canary file modified',
    severity: 'critical',
    status: 'closed',
    category: 'Threat hunt',
    tags: ['endpoint', 'malware'],
    alertCount: 2,
    commentCount: 8,
    description:
      'Endpoint canary file change triggered ransomware playbook. Contained and closed after forensic review.',
  },
  {
    id: '93',
    title: 'Privileged role assignment — Azure AD',
    severity: 'high',
    status: 'in progress',
    category: 'Incident',
    tags: ['identity', 'cloud'],
    alertCount: 1,
    commentCount: 2,
    description:
      'Unexpected Global Admin role assignment outside change control. Reviewing audit logs and MFA coverage.',
  },
  {
    id: '88',
    title: 'Post-incident review — Jan latency event',
    severity: 'low',
    status: 'closed',
    category: 'Post-mortem',
    tags: ['reliability', 'postmortem'],
    alertCount: 0,
    commentCount: 12,
    description:
      'Tracking action items from the January latency incident review across checkout and payments services.',
  },
];

function buildActivities(caseItem, seed) {
  const reporter = caseItem.reporter;
  const base = [
    {
      id: `${caseItem.id}-a0`,
      kind: 'system',
      author: reporter,
      text: `${reporter} created this case`,
      when: '11 min ago',
      collapsed: true,
    },
    {
      id: `${caseItem.id}-a1`,
      kind: 'system',
      author: 'System',
      text: 'Severity set to Critical',
      when: '10 min ago',
      collapsed: true,
    },
    {
      id: `${caseItem.id}-a2`,
      kind: 'comment',
      author: reporter,
      initials: caseItem.assignees[0]?.initials || 'U',
      when: '8 min ago',
      body: `Looking at the first alerts tied to this case. ${caseItem.description.slice(0, 160)}…\n\nNext: confirm indicator hits against live traffic and check whether the service principal is still active.`,
      collapsed: false,
    },
    {
      id: `${caseItem.id}-a3`,
      kind: 'system',
      author: pick(seed, 20, REPORTERS),
      text: 'Status updated to In progress',
      when: '6 min ago',
      collapsed: true,
    },
    {
      id: `${caseItem.id}-more`,
      kind: 'more',
      text: '26 more activities',
      collapsed: true,
    },
    {
      id: `${caseItem.id}-a4`,
      kind: 'comment',
      author: caseItem.assignees[1]?.name || 'Elena Foster',
      initials: caseItem.assignees[1]?.initials || 'EF',
      when: '3 min ago',
      body: 'Attached the dependency timeline from the Observability investigation. Suggest we keep this case as the source of truth for IR updates.',
      collapsed: false,
    },
  ];
  return base;
}

function buildAttachments(caseItem, seed) {
  const count = caseItem.alertCount + 2 + Math.floor(rand(seed, 5) * 4);
  return Array.from({ length: count }, (_, i) => ({
    id: `${caseItem.id}-att-${i}`,
    name:
      i < caseItem.alertCount
        ? `Alert · ${pick(seed, 30 + i, ['OAuth anomaly', 'Indicator match', 'Burn rate', 'Error rate'])}`
        : pick(seed, 40 + i, [
            'pcap-snippet.pcap',
            'timeline-export.ndjson',
            'screenshot-graph.png',
            'runbook-link.md',
          ]),
    type: i < caseItem.alertCount ? 'alert' : 'file',
    addedBy: pick(seed, 50 + i, REPORTERS),
    when: relativeUpdate(5 + i * 7),
  }));
}

function buildSimilar(caseItem, seed) {
  return CASE_SEEDS.filter((c) => c.id !== caseItem.id)
    .slice(0, 2 + Math.floor(rand(seed, 8) * 2))
    .map((c) => ({
      id: c.id,
      title: c.title,
      severity: c.severity,
      status: c.status,
      similarity: `${Math.round(60 + rand(seed, Number(c.id)) * 35)}%`,
    }));
}

export const CASES = CASE_SEEDS.map((seedCase, index) => {
  const seed = hashSeed(seedCase.id);
  const reporter = pick(seed, 1, REPORTERS);
  const assigneeCount = 1 + Math.floor(rand(seed, 2) * 2);
  const assignees = ASSIGNEES.slice(0, assigneeCount);
  const reportedOffset = 20 + Math.floor(rand(seed, 3) * 400);
  const updateOffset = 1 + Math.floor(rand(seed, 4) * 120);

  const caseItem = {
    ...seedCase,
    reporter,
    assignees,
    reportedAt: formatCaseTime(reportedOffset),
    lastUpdate: relativeUpdate(updateOffset),
    lastUpdateMinutes: updateOffset,
    classification: seedCase.status === 'closed' ? 'False positive' : '',
    environment: ['Production'],
    template: 'InfoSec',
  };

  return {
    ...caseItem,
    activities: buildActivities(caseItem, seed),
    attachments: buildAttachments(caseItem, seed),
    similarCases: buildSimilar(caseItem, seed + index),
  };
});

export function getCaseById(id) {
  return CASES.find((item) => item.id === String(id)) || null;
}

export function getCaseStats(cases = CASES) {
  const open = cases.filter((c) => c.status === 'open').length;
  const inProgress = cases.filter((c) => c.status === 'in progress').length;
  const closed = cases.filter((c) => c.status === 'closed').length;
  return {
    open,
    inProgress,
    closed: closed + 2050, // mock historical closed volume from makieta
    avgTimeToClose: '15 minutes',
  };
}

export function getCaseSeverityBadgeColor(severity) {
  if (severity === 'critical') return 'danger';
  if (severity === 'high') return 'risk';
  if (severity === 'medium') return 'warning';
  if (severity === 'low') return 'hollow';
  return 'default';
}

export function formatCaseStatus(status) {
  if (status === 'in progress') return 'In progress';
  if (status === 'open') return 'Open';
  if (status === 'closed') return 'Closed';
  return status;
}

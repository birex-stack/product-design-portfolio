import React, { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiBasicTable,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { getLogsForSlo } from '../data';

const LEVEL_COLOR = {
  error: 'danger',
  warn: 'warning',
  info: 'primary',
  debug: 'default',
};

function CellText({ children }) {
  return (
    <EuiText size="xs">
      <span>{children}</span>
    </EuiText>
  );
}

const columns = [
  {
    field: 'timestamp',
    name: '@timestamp',
    width: '110px',
    truncateText: false,
    render: (timestamp) => {
      const [time, date] = String(timestamp || '').split(/\s+/);
      return (
        <EuiText size="xs">
          <div
            style={{
              whiteSpace: 'nowrap',
              lineHeight: 1.35,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <div>{time}</div>
            {date && (
              <div style={{ whiteSpace: 'nowrap', opacity: 0.7 }}>{date}</div>
            )}
          </div>
        </EuiText>
      );
    },
  },
  {
    field: 'level',
    name: 'Log level',
    width: '100px',
    render: (level) => (
      <EuiBadge color={LEVEL_COLOR[level] || 'default'} fill={level === 'error'}>
        {level}
      </EuiBadge>
    ),
  },
  {
    field: 'service',
    name: 'Service',
    width: '140px',
    render: (service) => <CellText>{service}</CellText>,
  },
  {
    field: 'host',
    name: 'Host',
    width: '180px',
    render: (host) => <CellText>{host}</CellText>,
  },
  {
    field: 'message',
    name: 'Message',
    render: (message) => <CellText>{message}</CellText>,
  },
];

export function SloLogsTab({ slo }) {
  const [query, setQuery] = useState('');
  const logs = useMemo(() => getLogsForSlo(slo), [slo]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter(
      (log) =>
        log.message.toLowerCase().includes(q) ||
        log.service.toLowerCase().includes(q) ||
        log.host.toLowerCase().includes(q) ||
        log.level.toLowerCase().includes(q)
    );
  }, [logs, query]);

  return (
    <EuiPanel hasBorder paddingSize="m">
      <EuiFlexGroup alignItems="center" gutterSize="m">
        <EuiFlexItem>
          <EuiFieldSearch
            placeholder="Search logs (KQL-style filter)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            isClearable
            fullWidth
            aria-label="Search SLO logs"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText size="s" color="subdued">
            <p style={{ margin: 0 }}>
              {filtered.length} of {logs.length} documents
            </p>
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="s" />
      <EuiText size="xs" color="subdued">
        <p style={{ margin: 0 }}>
          Showing sample logs correlated with <strong>{slo.name}</strong> for the
          selected time range.
        </p>
      </EuiText>
      <EuiSpacer size="m" />

      <EuiBasicTable
        items={filtered}
        columns={columns}
        tableLayout="auto"
        noItemsMessage="No log documents match this filter."
      />
    </EuiPanel>
  );
}

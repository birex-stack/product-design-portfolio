import React, { useMemo, useState } from 'react';
import {
  EuiAccordion,
  EuiBadge,
  EuiButton,
  EuiButtonIcon,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiPageHeader,
  EuiPanel,
  EuiPopover,
  EuiSelect,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import {
  ALERT_RULES,
  ALERT_SEVERITIES,
  ALERT_SOURCES,
  ALERT_STATUSES,
  OBSERVABILITY_ALERTS,
  getAlertById,
} from '../alerts_data';
import { AiAssistantFlyout } from './AiAssistantFlyout';
import { AlertDetailFlyout } from './AlertDetailFlyout';
import { AlertsInventoryTable } from './AlertsInventoryTable';
import { AlertsSummaryCharts } from './AlertsSummaryCharts';

const PAGE_SIZE = 50;

function groupAlerts(alerts, groupBy) {
  if (groupBy === 'none') return null;
  const map = new Map();
  for (const alert of alerts) {
    const key = alert[groupBy] || 'Unknown';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(alert);
  }
  return [...map.entries()]
    .map(([key, items]) => ({ key, items }))
    .sort((a, b) => b.items.length - a.items.length);
}

export function AlertsListPage({
  onOpenAlert,
  assistantOpen,
  onAssistantOpenChange,
}) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [source, setSource] = useState('all');
  const [rule, setRule] = useState('all');
  const [groupBy, setGroupBy] = useState('none');
  const [pageIndex, setPageIndex] = useState(0);
  const [flyoutAlert, setFlyoutAlert] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [localAssistantOpen, setLocalAssistantOpen] = useState(false);
  const isAssistantOpen =
    assistantOpen != null ? assistantOpen : localAssistantOpen;
  const setAssistantOpen = (open) => {
    if (onAssistantOpenChange) onAssistantOpenChange(open);
    else setLocalAssistantOpen(open);
  };

  const activeFilterCount = [status, severity, source, rule].filter(
    (value) => value !== 'all'
  ).length;

  const filterControls = (
    <>
      <EuiFormRow label="Status" fullWidth display="rowCompressed">
        <EuiSelect
          fullWidth
          compressed
          options={[
            { value: 'all', text: 'All' },
            ...ALERT_STATUSES.map((s) => ({ value: s, text: s })),
          ]}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPageIndex(0);
          }}
          aria-label="Status filter"
        />
      </EuiFormRow>
      <EuiFormRow label="Severity" fullWidth display="rowCompressed">
        <EuiSelect
          fullWidth
          compressed
          options={[
            { value: 'all', text: 'All' },
            ...ALERT_SEVERITIES.map((s) => ({ value: s, text: s })),
          ]}
          value={severity}
          onChange={(e) => {
            setSeverity(e.target.value);
            setPageIndex(0);
          }}
          aria-label="Severity filter"
        />
      </EuiFormRow>
      <EuiFormRow label="Source" fullWidth display="rowCompressed">
        <EuiSelect
          fullWidth
          compressed
          options={[
            { value: 'all', text: 'All' },
            ...ALERT_SOURCES.map((s) => ({ value: s, text: s })),
          ]}
          value={source}
          onChange={(e) => {
            setSource(e.target.value);
            setPageIndex(0);
          }}
          aria-label="Source filter"
        />
      </EuiFormRow>
      <EuiFormRow label="Rule" fullWidth display="rowCompressed">
        <EuiSelect
          fullWidth
          compressed
          options={[
            { value: 'all', text: 'All' },
            ...ALERT_RULES.map((r) => ({ value: r, text: r })),
          ]}
          value={rule}
          onChange={(e) => {
            setRule(e.target.value);
            setPageIndex(0);
          }}
          aria-label="Rule filter"
        />
      </EuiFormRow>
    </>
  );

  const filtered = useMemo(() => {
    let items = [...OBSERVABILITY_ALERTS];
    if (status !== 'all') {
      items = items.filter((a) => a.status === status);
    }
    if (severity !== 'all') {
      items = items.filter((a) => a.severity === severity);
    }
    if (source !== 'all') {
      items = items.filter((a) => a.source === source);
    }
    if (rule !== 'all') {
      items = items.filter((a) => a.rule === rule);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.reason.toLowerCase().includes(q) ||
          a.rule.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q)
      );
    }
    items.sort((a, b) => a.triggeredAt.localeCompare(b.triggeredAt));
    return items;
  }, [query, status, severity, source, rule]);

  /** Charts omit their own facet filters so every category stays clickable. */
  const chartAlerts = useMemo(() => {
    let items = [...OBSERVABILITY_ALERTS];
    if (status !== 'all') {
      items = items.filter((a) => a.status === status);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.reason.toLowerCase().includes(q) ||
          a.rule.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q)
      );
    }
    return items;
  }, [query, status]);

  const pageItems = useMemo(() => {
    const start = pageIndex * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, pageIndex]);

  const groups = useMemo(
    () => groupAlerts(filtered, groupBy),
    [filtered, groupBy]
  );

  const isCompact = Boolean(isAssistantOpen);

  const pagination = {
    pageIndex,
    pageSize: PAGE_SIZE,
    totalItemCount: filtered.length,
    pageSizeOptions: [PAGE_SIZE],
    showPerPageOptions: false,
  };

  const renderAlertsTable = (items, { withPagination = false } = {}) => (
    <AlertsInventoryTable
      items={items}
      compact={isCompact}
      onOpenAlert={onOpenAlert}
      onExpandAlert={setFlyoutAlert}
      showExpand
      pagination={withPagination ? pagination : undefined}
      onChange={
        withPagination
          ? ({ page }) => {
              if (page) setPageIndex(page.index);
            }
          : undefined
      }
    />
  );

  const from = filtered.length === 0 ? 0 : pageIndex * PAGE_SIZE + 1;
  const to = Math.min(filtered.length, (pageIndex + 1) * PAGE_SIZE);

  return (
    <>
      <EuiPageHeader
        pageTitle="Alerts"
        description="Investigate and manage Observability alerts across APM, logs, metrics, SLO, and more."
        rightSideItems={[
          <EuiButton key="manage-rules" iconType="gear" onClick={() => {}}>
            Manage rules
          </EuiButton>,
        ]}
      />

      <EuiSpacer size="m" />

      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
        <EuiFlexItem grow>
          <EuiFieldSearch
            fullWidth
            placeholder="Search alerts by reason, rule, or source"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPageIndex(0);
            }}
            isClearable
            aria-label="Search alerts"
          />
        </EuiFlexItem>
        {isCompact ? (
          <EuiFlexItem grow={false}>
            <EuiPopover
              button={
                <EuiButtonIcon
                  display="base"
                  size="m"
                  iconType="filter"
                  color={activeFilterCount > 0 ? 'primary' : 'text'}
                  aria-label={
                    activeFilterCount > 0
                      ? `Filters, ${activeFilterCount} active`
                      : 'Filters'
                  }
                  onClick={() => setFiltersOpen((open) => !open)}
                />
              }
              isOpen={filtersOpen}
              closePopover={() => setFiltersOpen(false)}
              panelPaddingSize="m"
              anchorPosition="downRight"
            >
              <div style={{ width: 260 }}>{filterControls}</div>
            </EuiPopover>
          </EuiFlexItem>
        ) : (
          <>
            <EuiFlexItem grow={false} style={{ minWidth: 140 }}>
              <EuiSelect
                fullWidth
                options={[
                  { value: 'all', text: 'Status: All' },
                  ...ALERT_STATUSES.map((s) => ({
                    value: s,
                    text: `Status: ${s}`,
                  })),
                ]}
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPageIndex(0);
                }}
                aria-label="Status filter"
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ minWidth: 150 }}>
              <EuiSelect
                fullWidth
                options={[
                  { value: 'all', text: 'Severity: All' },
                  ...ALERT_SEVERITIES.map((s) => ({
                    value: s,
                    text: `Severity: ${s}`,
                  })),
                ]}
                value={severity}
                onChange={(e) => {
                  setSeverity(e.target.value);
                  setPageIndex(0);
                }}
                aria-label="Severity filter"
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ minWidth: 150 }}>
              <EuiSelect
                fullWidth
                options={[
                  { value: 'all', text: 'Source: All' },
                  ...ALERT_SOURCES.map((s) => ({
                    value: s,
                    text: `Source: ${s}`,
                  })),
                ]}
                value={source}
                onChange={(e) => {
                  setSource(e.target.value);
                  setPageIndex(0);
                }}
                aria-label="Source filter"
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false} style={{ minWidth: 180 }}>
              <EuiSelect
                fullWidth
                options={[
                  { value: 'all', text: 'Rule: All' },
                  ...ALERT_RULES.map((r) => ({
                    value: r,
                    text: `Rule: ${r}`,
                  })),
                ]}
                value={rule}
                onChange={(e) => {
                  setRule(e.target.value);
                  setPageIndex(0);
                }}
                aria-label="Rule filter"
              />
            </EuiFlexItem>
          </>
        )}
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            iconType="refresh"
            display="base"
            size="m"
            aria-label="Refresh"
            onClick={() => {}}
          />
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      <AlertsSummaryCharts
        alerts={chartAlerts}
        severity={severity}
        source={source}
        rule={rule}
        compact={isCompact}
        onSeverityChange={(value) => {
          setSeverity(value);
          setPageIndex(0);
        }}
        onSourceChange={(value) => {
          setSource(value);
          setPageIndex(0);
        }}
        onRuleChange={(value) => {
          setRule(value);
          setPageIndex(0);
        }}
      />

      <EuiSpacer size="m" />

      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" wrap>
        <EuiFlexItem grow={false}>
          <EuiText size="s" color="subdued">
            <p style={{ margin: 0 }}>
              Showing {from}–{to} of {filtered.length} alerts
            </p>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false} style={{ minWidth: 180 }}>
          <EuiSelect
            compressed
            options={[
              { value: 'none', text: 'Group by None' },
              { value: 'source', text: 'Group by Source' },
              { value: 'rule', text: 'Group by Rule' },
            ]}
            value={groupBy}
            onChange={(e) => {
              setGroupBy(e.target.value);
              setPageIndex(0);
            }}
            aria-label="Group alerts"
          />
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      {groupBy === 'none' ? (
        renderAlertsTable(pageItems, { withPagination: true })
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groups.map((group) => (
            <EuiPanel key={group.key} hasBorder paddingSize="s">
              <EuiAccordion
                id={`alert-group-${groupBy}-${group.key}`}
                initialIsOpen={false}
                buttonContent={
                  <EuiFlexGroup
                    gutterSize="s"
                    alignItems="center"
                    responsive={false}
                  >
                    <EuiFlexItem grow={false}>
                      <EuiTitle size="xxs">
                        <h3>{group.key}</h3>
                      </EuiTitle>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiBadge>{group.items.length}</EuiBadge>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                }
                paddingSize="s"
              >
                {renderAlertsTable(group.items)}
              </EuiAccordion>
            </EuiPanel>
          ))}
          {groups.length === 0 && (
            <EuiText size="s" color="subdued">
              <p>No alerts match your filters.</p>
            </EuiText>
          )}
        </div>
      )}

      <AlertDetailFlyout
        alert={flyoutAlert}
        onClose={() => setFlyoutAlert(null)}
        onOpenAlert={(id) => {
          const next = getAlertById(id);
          if (next) setFlyoutAlert(next);
        }}
        session="never"
        items={filtered}
        onSelectItem={setFlyoutAlert}
      />

      <AiAssistantFlyout
        isOpen={isAssistantOpen}
        onClose={() => setAssistantOpen(false)}
        contextType="alertsInventory"
        alerts={OBSERVABILITY_ALERTS}
      />
    </>
  );
}

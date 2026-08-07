import React, { useMemo, useState } from 'react';
import {
  EuiButtonGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
  useEuiTheme,
} from '@elastic/eui';
import {
  Axis,
  BarSeries,
  Chart,
  Partition,
  PartitionLayout,
  Position,
  ScaleType,
  Settings,
  Tooltip,
} from '@elastic/charts';
import { ALERT_SEVERITIES, aggregateAlertsBy } from '../alerts_data';
import { getVisSeriesColor, useChartColorTokens } from '../chart_colors';
import { getAlertSeverityChartColor } from '../severity';
import { useChartBaseTheme } from '../use_chart_base_theme';

const SEVERITY_ORDER = new Map(
  ALERT_SEVERITIES.map((level, index) => [level, index])
);

function sortBySeverityLevel(rows) {
  return [...rows].sort(
    (a, b) =>
      (SEVERITY_ORDER.get(a.key) ?? 99) - (SEVERITY_ORDER.get(b.key) ?? 99)
  );
}

function toggleValue(current, next) {
  return current === next ? 'all' : next;
}

function truncateLabel(value, max = 22) {
  const s = String(value ?? '');
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** Compact / responsive: category label above a full-width bar (EUI-style ranking). */
function CompactBarRows({
  data,
  activeKey,
  onSelect,
  getBarColor,
  capitalizeLabels = false,
}) {
  const { euiTheme } = useEuiTheme();
  const rows = useMemo(() => data.slice(0, 8), [data]);
  const max = Math.max(...rows.map((row) => row.count), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map((row) => {
        const isActive = activeKey === row.key;
        const muted =
          activeKey && activeKey !== 'all' && !isActive ? 0.35 : 1;
        const color = getBarColor(row.key);
        return (
          <button
            key={row.key}
            type="button"
            onClick={() => onSelect?.(toggleValue(activeKey, row.key))}
            style={{
              display: 'block',
              width: '100%',
              padding: 0,
              margin: 0,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              opacity: muted,
            }}
          >
            <EuiFlexGroup
              gutterSize="s"
              alignItems="baseline"
              justifyContent="spaceBetween"
              responsive={false}
            >
              <EuiFlexItem grow style={{ minWidth: 0 }}>
                <EuiText size="xs">
                  <div
                    style={{
                      fontWeight: isActive ? 600 : 500,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textTransform: capitalizeLabels ? 'capitalize' : undefined,
                    }}
                    title={row.key}
                  >
                    {row.key}
                  </div>
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText size="xs" color="subdued">
                  <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {row.count}
                  </span>
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
            <div
              style={{
                marginTop: 4,
                height: 8,
                borderRadius: 2,
                background: euiTheme.colors.lightShade,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${Math.max(2, (row.count / max) * 100)}%`,
                  height: '100%',
                  borderRadius: 2,
                  background: color,
                }}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}

const COMPACT_CHART_OPTIONS = [
  { id: 'severity', label: 'Severity' },
  { id: 'rule', label: 'Rule' },
  { id: 'source', label: 'Source' },
];

function CompactSummaryPanel({
  bySeverity,
  byRule,
  bySource,
  severity,
  rule,
  source,
  onSeverityChange,
  onRuleChange,
  onSourceChange,
}) {
  const { euiTheme } = useEuiTheme();
  const tokens = useChartColorTokens();
  const [selected, setSelected] = useState('severity');

  const view = {
    severity: {
      data: bySeverity,
      activeKey: severity,
      onSelect: onSeverityChange,
      getBarColor: (key) => getAlertSeverityChartColor(key, euiTheme),
      capitalizeLabels: true,
      footer: (data, activeKey) => {
        const total = data.reduce((sum, row) => sum + row.count, 0);
        return `${total.toLocaleString()} alerts total${
          activeKey && activeKey !== 'all' ? ` · filter: ${activeKey}` : ''
        }`;
      },
    },
    rule: {
      data: byRule,
      activeKey: rule,
      onSelect: onRuleChange,
      getBarColor: () => getVisSeriesColor(tokens, 1),
      footer: (data, activeKey) =>
        `${data.length} categor${data.length === 1 ? 'y' : 'ies'} · top ${Math.min(
          8,
          data.length
        )} shown${activeKey && activeKey !== 'all' ? ` · filter: ${activeKey}` : ''}`,
    },
    source: {
      data: bySource,
      activeKey: source,
      onSelect: onSourceChange,
      getBarColor: () => getVisSeriesColor(tokens, 2),
      footer: (data, activeKey) =>
        `${data.length} categor${data.length === 1 ? 'y' : 'ies'} · top ${Math.min(
          8,
          data.length
        )} shown${activeKey && activeKey !== 'all' ? ` · filter: ${activeKey}` : ''}`,
    },
  }[selected];

  return (
    <EuiPanel hasBorder paddingSize="m">
      <EuiFlexGroup
        alignItems="center"
        justifyContent="spaceBetween"
        gutterSize="s"
        wrap
        responsive={false}
      >
        <EuiFlexItem grow={false}>
          <EuiTitle size="xxs">
            <h3>Alerts by</h3>
          </EuiTitle>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonGroup
            legend="Alert summary chart"
            options={COMPACT_CHART_OPTIONS}
            idSelected={selected}
            onChange={(id) => setSelected(id)}
            buttonSize="compressed"
            color="text"
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size="m" />
      <CompactBarRows
        data={view.data}
        activeKey={view.activeKey}
        onSelect={view.onSelect}
        getBarColor={view.getBarColor}
        capitalizeLabels={view.capitalizeLabels}
      />
      <EuiSpacer size="s" />
      <EuiText size="xs" color="subdued">
        <p style={{ margin: 0 }}>{view.footer(view.data, view.activeKey)}</p>
      </EuiText>
    </EuiPanel>
  );
}

function HorizontalBarChart({ title, data, color, activeKey, onSelect }) {
  const chartBaseTheme = useChartBaseTheme();
  const chartData = useMemo(
    () =>
      data
        .slice(0, 8)
        .map((row, i) => ({
          x: i,
          y: row.count,
          label: row.key,
        }))
        .reverse(),
    [data]
  );

  return (
    <EuiPanel hasBorder paddingSize="m" style={{ height: '100%' }}>
      <EuiTitle size="xxs">
        <h3>{title}</h3>
      </EuiTitle>
      <EuiSpacer size="s" />
      <div style={{ width: '100%', height: 200, cursor: 'pointer' }}>
        <Chart size={{ width: '100%', height: 200 }}>
          <Settings
            baseTheme={chartBaseTheme}
            showLegend={false}
            rotation={90}
            theme={{
              chartMargins: { left: 8, right: 8, top: 4, bottom: 4 },
            }}
            onElementClick={(elements) => {
              const hit = elements?.[0];
              if (!Array.isArray(hit)) return;
              const [geometry] = hit;
              const label = geometry?.datum?.label;
              if (!label || !onSelect) return;
              onSelect(toggleValue(activeKey, String(label)));
            }}
          />
          <Tooltip
            customTooltip={({ values }) => {
              const item = values?.[0];
              if (!item) return null;
              const label = item.datum?.label ?? '';
              const value = item.formattedValue ?? item.value;
              return (
                <div
                  style={{
                    background: 'rgba(255,255,255,0.96)',
                    border: '1px solid #d3dae6',
                    borderRadius: 4,
                    padding: '8px 10px',
                    fontSize: 12,
                    lineHeight: 1.4,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                    minWidth: 140,
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>{title}</div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 16,
                    }}
                  >
                    <span>
                      <span
                        style={{
                          display: 'inline-block',
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: color,
                          marginRight: 6,
                        }}
                      />
                      {label}
                    </span>
                    <strong>{value}</strong>
                  </div>
                </div>
              );
            }}
          />
          <Axis
            id="categories"
            position={Position.Left}
            tickFormat={(d) => truncateLabel(chartData[d]?.label || '', 18)}
            style={{
              tickLine: { visible: false },
              tickLabel: { fontSize: 11 },
            }}
          />
          <Axis
            id="values"
            position={Position.Bottom}
            tickFormat={(d) => `${Math.round(d)}`}
            ticks={4}
          />
          <BarSeries
            id="count"
            name="Count"
            xScaleType={ScaleType.Linear}
            yScaleType={ScaleType.Linear}
            xAccessor="x"
            yAccessors={['y']}
            data={chartData}
            color={color}
            tickFormat={(d) => `${Math.round(Number(d))}`}
          />
        </Chart>
      </div>
      <EuiText size="xs" color="subdued">
        <p style={{ margin: 0 }}>
          {data.length} categor{data.length === 1 ? 'y' : 'ies'} · top{' '}
          {Math.min(8, data.length)} shown
          {activeKey && activeKey !== 'all' ? ` · filter: ${activeKey}` : ''}
        </p>
      </EuiText>
    </EuiPanel>
  );
}

function SeverityCircleChart({ data, activeKey, onSelect }) {
  const { euiTheme } = useEuiTheme();
  const chartBaseTheme = useChartBaseTheme();
  const total = useMemo(
    () => data.reduce((sum, row) => sum + row.count, 0),
    [data]
  );

  return (
    <EuiPanel hasBorder paddingSize="m" style={{ height: '100%' }}>
      <EuiTitle size="xxs">
        <h3>Alerts by severity</h3>
      </EuiTitle>
      <EuiSpacer size="s" />
      <div style={{ width: '100%', height: 200, cursor: 'pointer' }}>
        <Chart size={{ width: '100%', height: 200 }}>
          <Settings
            baseTheme={chartBaseTheme}
            showLegend
            legendPosition={Position.Right}
            theme={{
              partition: {
                emptySizeRatio: 0.45,
                linkLabel: { maxCount: 0 },
                fillLabel: {
                  textColor: 'rgba(0,0,0,0)',
                },
              },
            }}
            onElementClick={(elements) => {
              const hit = elements?.[0];
              if (!Array.isArray(hit)) return;
              const [layers] = hit;
              if (!Array.isArray(layers) || layers.length === 0) return;
              const key = layers[layers.length - 1]?.groupByRollup;
              if (key == null || !onSelect) return;
              onSelect(toggleValue(activeKey, String(key)));
            }}
            onLegendItemClick={(series) => {
              const key = series?.[0]?.key;
              if (key == null || !onSelect) return;
              const label = String(key).includes('|')
                ? String(key).split('|').pop()
                : String(key);
              onSelect(toggleValue(activeKey, label));
            }}
          />
          <Tooltip />
          <Partition
            id="severity"
            data={data}
            valueAccessor={(d) => d.count}
            valueFormatter={(d) => `${d} alerts`}
            percentFormatter={(d) => `${Math.round(d)}%`}
            layers={[
              {
                groupByRollup: (d) => d.key,
                nodeLabel: (d) => String(d),
                fillLabel: {
                  textColor: 'rgba(0,0,0,0)',
                },
                shape: {
                  fillColor: (key) =>
                    getAlertSeverityChartColor(key, euiTheme),
                },
              },
            ]}
            layout={PartitionLayout.sunburst}
          />
        </Chart>
      </div>
      <EuiText size="xs" color="subdued">
        <p style={{ margin: 0 }}>
          {total.toLocaleString()} alerts total
          {activeKey && activeKey !== 'all' ? ` · filter: ${activeKey}` : ''}
        </p>
      </EuiText>
    </EuiPanel>
  );
}

export function AlertsSummaryCharts({
  alerts,
  severity = 'all',
  source = 'all',
  rule = 'all',
  onSeverityChange,
  onSourceChange,
  onRuleChange,
  compact = false,
}) {
  const tokens = useChartColorTokens();

  const byRule = useMemo(() => aggregateAlertsBy('rule', alerts), [alerts]);
  const bySource = useMemo(() => aggregateAlertsBy('source', alerts), [alerts]);
  const bySeverity = useMemo(
    () => sortBySeverityLevel(aggregateAlertsBy('severity', alerts)),
    [alerts]
  );

  if (compact) {
    return (
      <CompactSummaryPanel
        bySeverity={bySeverity}
        byRule={byRule}
        bySource={bySource}
        severity={severity}
        rule={rule}
        source={source}
        onSeverityChange={onSeverityChange}
        onRuleChange={onRuleChange}
        onSourceChange={onSourceChange}
      />
    );
  }

  return (
    <EuiFlexGroup gutterSize="m" alignItems="stretch">
      <EuiFlexItem>
        <SeverityCircleChart
          data={bySeverity}
          activeKey={severity}
          onSelect={onSeverityChange}
        />
      </EuiFlexItem>
      <EuiFlexItem>
        <HorizontalBarChart
          title="Alerts by rule"
          data={byRule}
          color={getVisSeriesColor(tokens, 1)}
          activeKey={rule}
          onSelect={onRuleChange}
        />
      </EuiFlexItem>
      <EuiFlexItem>
        <HorizontalBarChart
          title="Alerts by source"
          data={bySource}
          color={getVisSeriesColor(tokens, 2)}
          activeKey={source}
          onSelect={onSourceChange}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}

import React, { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiBasicTable,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import {
  AnnotationDomainType,
  AreaSeries,
  Axis,
  BarSeries,
  Bullet,
  BulletSubtype,
  Chart,
  Heatmap,
  LayoutDirection,
  LineAnnotation,
  LineSeries,
  Metric,
  MetricTrendShape,
  Partition,
  PartitionLayout,
  Position,
  ScaleType,
  Settings,
  Tooltip,
  TooltipContainer,
  TooltipHeader,
  TooltipTable,
  TooltipTableBody,
  TooltipTableCell,
  TooltipTableRow,
} from '@elastic/charts';
import {
  ALERT_THRESHOLD_LINE_STYLE,
  ALERT_THRESHOLD_MARKER_POSITION,
  AlertThresholdAnnotationMarker,
  getYDomainIncludingThreshold,
  useChartTooltipActions,
} from '../chart_tooltip_actions';
import { useChartColorTokens } from '../chart_colors';
import { getDashboardPanels, loadInvestigationEvents } from '../dashboards_data';
import { buildDependencyTimeline } from '../assistant_context';
import { SLOS } from '../data';
import { useChartBaseTheme } from '../use_chart_base_theme';
import { useShortChartLoading } from '../use_short_chart_loading';
import { AiAssistantFlyout } from './AiAssistantFlyout';
import { AlertsFlyout } from './AlertsFlyout';
import { ChartLoadingState } from './ChartLoadingState';
import { DashboardActionsMenu } from './DashboardActionsMenu';
import {
  PanelActionsMenu,
  PanelHoverActionsOverlay,
} from './PanelActionsMenu';
import { SloCard } from './SloCard';
import { TimelineEventChart } from './TimelineEventChart';

/** Staggered chart load — lighter delay than SLO detail. */
const DASH_LOAD_STEP_MS = 250;
const DASH_LOAD_FIRST_MS = 250;

const GRID = {
  display: 'grid',
  gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
  gap: 12,
  width: '100%',
};

function panelSpan(w) {
  return { gridColumn: `span ${w}` };
}

function DashboardPanelShell({
  title,
  children,
  height,
  paddingSize = 's',
  loading = false,
  chartHeight = 180,
}) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const showActions = hovered || menuOpen;

  return (
    <EuiPanel
      hasBorder
      paddingSize={paddingSize}
      style={{
        height: '100%',
        minHeight: height,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {title && (
        <>
          <EuiFlexGroup
            gutterSize="s"
            alignItems="center"
            justifyContent="spaceBetween"
            responsive={false}
          >
            <EuiFlexItem grow style={{ minWidth: 0 }}>
              <EuiTitle size="xxs">
                <h3 style={{ margin: 0 }}>{title}</h3>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem
              grow={false}
              style={{
                opacity: showActions ? 1 : 0,
                pointerEvents: showActions ? 'auto' : 'none',
                transition: 'opacity 120ms ease',
              }}
            >
              <PanelActionsMenu
                title={title}
                isOpen={menuOpen}
                onOpenChange={setMenuOpen}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="s" />
        </>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        {loading ? (
          <ChartLoadingState height={chartHeight} size="xl" />
        ) : (
          children
        )}
      </div>
    </EuiPanel>
  );
}

function MetricPanelChrome({ title, height, loading, children }) {
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const showActions = hovered || menuOpen;

  return (
    <EuiPanel
      hasBorder
      paddingSize="none"
      style={{ height, overflow: 'hidden', position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <PanelHoverActionsOverlay
        title={title}
        visible={showActions}
        menuOpen={menuOpen}
        onMenuOpenChange={setMenuOpen}
      />
      {loading ? (
        <ChartLoadingState height={height} size="l" />
      ) : (
        children
      )}
    </EuiPanel>
  );
}

function MetricPanel({ metric, color, loadIndex = 0, resetKey }) {
  const chartBaseTheme = useChartBaseTheme();
  const loading = useShortChartLoading(
    loadIndex,
    resetKey,
    DASH_LOAD_STEP_MS,
    DASH_LOAD_FIRST_MS
  );
  const height = 120;

  const datum = useMemo(() => {
    const base = {
      color,
      title: metric.title,
      subtitle: metric.subtitle,
      value: metric.value,
      valueFormatter: metric.valueFormatter,
    };
    if (metric.trend) {
      return {
        ...base,
        trend: metric.trend,
        trendShape: MetricTrendShape.Area,
        trendA11yTitle: `${metric.title} trend`,
        trendA11yDescription: `Trend for ${metric.title} over the selected time range.`,
      };
    }
    if (metric.domain) {
      return {
        ...base,
        domainMin: metric.domain[0],
        domainMax: metric.domain[1],
        progressBarDirection: LayoutDirection.Horizontal,
      };
    }
    return base;
  }, [metric, color]);

  return (
    <div style={panelSpan(metric.w || 3)}>
      <MetricPanelChrome
        title={metric.title}
        height={height}
        loading={loading}
      >
        <Chart size={['100%', height]}>
          <Settings baseTheme={chartBaseTheme} />
          <Metric id={metric.id} data={[[datum]]} />
        </Chart>
      </MetricPanelChrome>
    </div>
  );
}

function SloTilePanel({
  panel,
  loading = false,
  onOpenSlo,
  onAlertsClick,
}) {
  const height = panel.height || 140;
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const showActions = hovered || menuOpen;
  const slo = useMemo(() => {
    const fromList = SLOS.find((item) => item.id === panel.sloId);
    if (fromList) {
      return {
        ...fromList,
        // Keep dashboard label; navigate/alerts still use the real SLO id.
        name: panel.title || fromList.name,
      };
    }
    return {
      id: panel.sloId || panel.id,
      name: panel.title,
      status: panel.status === 'degrading' ? 'warning' : panel.status,
      alerts: panel.alerts ?? 0,
      target: panel.target,
      sli: panel.value,
      sparkline: panel.sparkline || [],
    };
  }, [panel]);

  return (
    <div
      style={{ ...panelSpan(panel.w || 6), position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <PanelHoverActionsOverlay
        title={panel.title || slo.name}
        visible={showActions}
        menuOpen={menuOpen}
        onMenuOpenChange={setMenuOpen}
        top={10}
        right={10}
      />
      {loading ? (
        <EuiPanel
          hasBorder
          paddingSize="none"
          style={{ height, borderRadius: 6, overflow: 'hidden' }}
        >
          <ChartLoadingState height={height} size="l" />
        </EuiPanel>
      ) : (
        <SloCard
          slo={slo}
          height={height}
          onOpen={onOpenSlo}
          onAlertsClick={() => onAlertsClick?.(slo)}
        />
      )}
    </div>
  );
}

function AlertsMetricPanel({ panel, loading = false }) {
  const chartBaseTheme = useChartBaseTheme();
  const tokens = useChartColorTokens();
  const height = 140;
  const color = tokens.healthSoft.danger;

  const datum = useMemo(
    () => ({
      color,
      title: panel.title,
      subtitle: panel.subtitle,
      value: panel.value,
      valueFormatter: panel.valueFormatter,
      trend: panel.trend,
      trendShape: MetricTrendShape.Area,
      trendA11yTitle: `${panel.title} trend`,
      trendA11yDescription: `Alert volume trend over the selected time range.`,
    }),
    [panel, color]
  );

  return (
    <div style={panelSpan(panel.w || 3)}>
      <MetricPanelChrome
        title={panel.title}
        height={height}
        loading={loading}
      >
        <Chart size={['100%', height]}>
          <Settings baseTheme={chartBaseTheme} />
          <Metric id={panel.id} data={[[datum]]} />
        </Chart>
      </MetricPanelChrome>
    </div>
  );
}

function HeatmapPanel({ panel, loading = false }) {
  const chartBaseTheme = useChartBaseTheme();
  const tokens = useChartColorTokens();
  const height = 280;
  const [healthy, warning, risk, danger] = tokens.statusBands;
  const metricName = panel.metricName || 'Latency';
  const xLabelName = panel.xLabelName || 'Percentile';
  const yLabelName = panel.yLabelName || 'Service';
  const formatLatency = (d) => `${Math.round(d)} ms`;

  return (
    <div style={panelSpan(panel.w || 6)}>
      <DashboardPanelShell
        title={panel.title}
        height={height + 48}
        loading={loading}
        chartHeight={height}
      >
        <div style={{ width: '100%', height }}>
          <Chart size={{ width: '100%', height }}>
            <Settings
              baseTheme={chartBaseTheme}
              showLegend
              legendPosition={Position.Right}
              theme={{
                heatmap: {
                  cell: {
                    maxWidth: 'fill',
                    maxHeight: 'fill',
                    label: { visible: false },
                    border: { strokeWidth: 1, stroke: 'transparent' },
                  },
                  yAxisLabel: { width: 72 },
                },
              }}
            />
            <Tooltip
              customTooltip={({ values }) => {
                const item = values?.find((v) => v?.datum) || values?.[0];
                const datum = item?.datum;
                if (!datum) return null;
                const rows = [
                  { name: yLabelName, value: String(datum.y ?? '—') },
                  { name: xLabelName, value: String(datum.x ?? '—') },
                  {
                    name: metricName,
                    value: formatLatency(datum.value),
                  },
                ];
                return (
                  <TooltipContainer>
                    <TooltipHeader>{metricName}</TooltipHeader>
                    <TooltipTable gridTemplateColumns="auto auto">
                      <TooltipTableBody>
                        {rows.map((row) => (
                          <TooltipTableRow key={row.name}>
                            <TooltipTableCell>{row.name}</TooltipTableCell>
                            <TooltipTableCell>{row.value}</TooltipTableCell>
                          </TooltipTableRow>
                        ))}
                      </TooltipTableBody>
                    </TooltipTable>
                  </TooltipContainer>
                );
              }}
            />
            <Heatmap
              id={panel.id}
              data={panel.data}
              name={metricName}
              xAccessor="x"
              yAccessor="y"
              valueAccessor="value"
              valueFormatter={formatLatency}
              xScale={{ type: ScaleType.Ordinal }}
              xAxisTitle={xLabelName}
              yAxisTitle={yLabelName}
              xAxisLabelName={xLabelName}
              yAxisLabelName={yLabelName}
              colorScale={{
                type: 'bands',
                bands: [
                  { start: -Infinity, end: 80, color: healthy, label: '< 80ms' },
                  { start: 80, end: 160, color: warning, label: '80–160ms' },
                  { start: 160, end: 240, color: risk, label: '160–240ms' },
                  { start: 240, end: Infinity, color: danger, label: '> 240ms' },
                ],
              }}
            />
          </Chart>
        </div>
      </DashboardPanelShell>
    </div>
  );
}

function BulletPanel({ panel, loading = false }) {
  const chartBaseTheme = useChartBaseTheme();
  const height = 280;
  const unit = panel.valueUnit || '';
  const formatValue = (d) =>
    unit ? `${Math.round(d).toLocaleString()} ${unit}` : `${Math.round(d)}`;

  return (
    <div style={panelSpan(panel.w || 6)}>
      <DashboardPanelShell
        title={panel.title}
        height={height + 48}
        loading={loading}
        chartHeight={height}
      >
        <div style={{ width: '100%', height }}>
          <Chart size={{ width: '100%', height }}>
            <Settings baseTheme={chartBaseTheme} />
            <Bullet
              id={panel.id}
              subtype={BulletSubtype.horizontal}
              valueLabels={{
                target: panel.targetLabel || 'Previously',
              }}
              data={[
                [
                  {
                    // Panel shell already shows the title — avoid duplicating it.
                    title: '',
                    subtitle: panel.subtitle,
                    value: panel.value,
                    target: panel.target,
                    domain: panel.domain || [0, 100],
                    valueFormatter: formatValue,
                    targetFormatter: formatValue,
                    tickFormatter: (d) => Math.round(d).toLocaleString(),
                  },
                ],
              ]}
            />
          </Chart>
        </div>
      </DashboardPanelShell>
    </div>
  );
}

function LinePanel({ panel, color, loading = false }) {
  const chartBaseTheme = useChartBaseTheme();
  const height = 260;
  const {
    tooltipActions,
    alertThreshold,
    alertThresholdDetails,
    alertThresholdLabel,
  } = useChartTooltipActions({ seriesName: panel.title, valueUnit: '' });
  const yDomain = useMemo(
    () =>
      getYDomainIncludingThreshold({
        values: panel.data?.map((d) => d.y) || [],
        alertThreshold,
      }),
    [panel.data, alertThreshold]
  );

  return (
    <div style={panelSpan(panel.w || 6)}>
      <DashboardPanelShell
        title={panel.title}
        height={height + 48}
        loading={loading}
        chartHeight={height}
      >
        <div style={{ width: '100%', height }}>
          <Chart size={{ width: '100%', height }}>
            <Settings baseTheme={chartBaseTheme} showLegend={false} />
            <Tooltip actions={tooltipActions} />
            <Axis
              id="bottom"
              position={Position.Bottom}
              tickFormat={(d) => `${Number(d) + 1}`}
              ticks={6}
            />
            <Axis
              id="left"
              position={Position.Left}
              tickFormat={(d) => Number(d).toFixed(0)}
              ticks={4}
              domain={yDomain}
            />
            {alertThreshold != null && (
              <LineAnnotation
                id="alert-rule-threshold"
                domainType={AnnotationDomainType.YDomain}
                dataValues={[
                  {
                    dataValue: alertThreshold,
                    details: alertThresholdDetails,
                  },
                ]}
                style={ALERT_THRESHOLD_LINE_STYLE}
                marker={
                  <AlertThresholdAnnotationMarker label={alertThresholdLabel} />
                }
                markerPosition={ALERT_THRESHOLD_MARKER_POSITION}
              />
            )}
            <LineSeries
              id={panel.id}
              name={panel.title}
              xScaleType={ScaleType.Linear}
              yScaleType={ScaleType.Linear}
              xAccessor="x"
              yAccessors={['y']}
              data={panel.data}
              color={color}
              lineSeriesStyle={{
                point: { visible: false },
              }}
            />
          </Chart>
        </div>
      </DashboardPanelShell>
    </div>
  );
}

function AreaPanel({ panel, color, loading = false }) {
  const chartBaseTheme = useChartBaseTheme();
  const height = 260;
  const {
    tooltipActions,
    alertThreshold,
    alertThresholdDetails,
    alertThresholdLabel,
  } = useChartTooltipActions({ seriesName: panel.title, valueUnit: '' });
  const yDomain = useMemo(
    () =>
      getYDomainIncludingThreshold({
        values: panel.data?.map((d) => d.y) || [],
        alertThreshold,
      }),
    [panel.data, alertThreshold]
  );

  return (
    <div style={panelSpan(panel.w || 6)}>
      <DashboardPanelShell
        title={panel.title}
        height={height + 48}
        loading={loading}
        chartHeight={height}
      >
        <div style={{ width: '100%', height }}>
          <Chart size={{ width: '100%', height }}>
            <Settings baseTheme={chartBaseTheme} showLegend={false} />
            <Tooltip actions={tooltipActions} />
            <Axis
              id="bottom"
              position={Position.Bottom}
              tickFormat={(d) => `${Number(d) + 1}`}
              ticks={6}
            />
            <Axis
              id="left"
              position={Position.Left}
              tickFormat={(d) => Number(d).toFixed(1)}
              ticks={4}
              domain={yDomain}
            />
            {alertThreshold != null && (
              <LineAnnotation
                id="alert-rule-threshold"
                domainType={AnnotationDomainType.YDomain}
                dataValues={[
                  {
                    dataValue: alertThreshold,
                    details: alertThresholdDetails,
                  },
                ]}
                style={ALERT_THRESHOLD_LINE_STYLE}
                marker={
                  <AlertThresholdAnnotationMarker label={alertThresholdLabel} />
                }
                markerPosition={ALERT_THRESHOLD_MARKER_POSITION}
              />
            )}
            <AreaSeries
              id={panel.id}
              name={panel.title}
              xScaleType={ScaleType.Linear}
              yScaleType={ScaleType.Linear}
              xAccessor="x"
              yAccessors={['y']}
              data={panel.data}
              color={color}
              areaSeriesStyle={{
                point: { visible: false },
              }}
            />
          </Chart>
        </div>
      </DashboardPanelShell>
    </div>
  );
}

function BarPanel({ panel, color, loading = false }) {
  const chartBaseTheme = useChartBaseTheme();
  const height = 260;
  const {
    tooltipActions,
    alertThreshold,
    alertThresholdDetails,
    alertThresholdLabel,
  } = useChartTooltipActions({ seriesName: panel.title, valueUnit: '' });
  const labels = useMemo(() => {
    const map = new Map();
    panel.data.forEach((row) => map.set(row.x, row.label));
    return map;
  }, [panel.data]);
  const yDomain = useMemo(
    () =>
      getYDomainIncludingThreshold({
        values: panel.data?.map((d) => d.y) || [],
        alertThreshold,
      }),
    [panel.data, alertThreshold]
  );

  return (
    <div style={panelSpan(panel.w || 12)}>
      <DashboardPanelShell
        title={panel.title}
        height={height + 48}
        loading={loading}
        chartHeight={height}
      >
        <div style={{ width: '100%', height }}>
          <Chart size={{ width: '100%', height }}>
            <Settings baseTheme={chartBaseTheme} showLegend={false} />
            <Tooltip
              headerFormatter={() => panel.title}
              actions={tooltipActions}
            />
            <Axis
              id="bottom"
              position={Position.Bottom}
              tickFormat={(d) => labels.get(d) || String(d)}
            />
            <Axis
              id="left"
              position={Position.Left}
              tickFormat={(d) => Number(d).toLocaleString()}
              ticks={4}
              domain={yDomain}
            />
            {alertThreshold != null && (
              <LineAnnotation
                id="alert-rule-threshold"
                domainType={AnnotationDomainType.YDomain}
                dataValues={[
                  {
                    dataValue: alertThreshold,
                    details: alertThresholdDetails,
                  },
                ]}
                style={ALERT_THRESHOLD_LINE_STYLE}
                marker={
                  <AlertThresholdAnnotationMarker label={alertThresholdLabel} />
                }
                markerPosition={ALERT_THRESHOLD_MARKER_POSITION}
              />
            )}
            <BarSeries
              id={panel.id}
              name="Count"
              xScaleType={ScaleType.Ordinal}
              yScaleType={ScaleType.Linear}
              xAccessor="label"
              yAccessors={['y']}
              data={panel.data}
              color={color}
              tickFormat={(d) => Number(d).toLocaleString()}
            />
          </Chart>
        </div>
      </DashboardPanelShell>
    </div>
  );
}

function PiePanel({ panel, colors, loading = false }) {
  const chartBaseTheme = useChartBaseTheme();
  const height = 260;

  return (
    <div style={panelSpan(panel.w || 6)}>
      <DashboardPanelShell
        title={panel.title}
        height={height + 48}
        loading={loading}
        chartHeight={height}
      >
        <div style={{ width: '100%', height }}>
          <Chart size={{ width: '100%', height }}>
            <Settings
              baseTheme={chartBaseTheme}
              showLegend
              legendPosition={Position.Right}
              theme={{
                partition: {
                  emptySizeRatio: 0.45,
                  linkLabel: { maxCount: 0 },
                  fillLabel: { textColor: 'rgba(0,0,0,0)' },
                },
              }}
            />
            <Tooltip />
            <Partition
              id={panel.id}
              data={panel.data}
              valueAccessor={(d) => d.count}
              valueFormatter={(d) => `${d}`}
              percentFormatter={(d) => `${Math.round(d)}%`}
              layers={[
                {
                  groupByRollup: (d) => d.key,
                  nodeLabel: (d) => String(d),
                  shape: {
                    fillColor: (key) => {
                      const keys = panel.data.map((d) => d.key);
                      const idx = keys.indexOf(key);
                      return colors[idx % colors.length];
                    },
                  },
                },
              ]}
              layout={PartitionLayout.sunburst}
            />
          </Chart>
        </div>
      </DashboardPanelShell>
    </div>
  );
}

function TablePanel({ panel, loadIndex = 0, resetKey }) {
  const loading = useShortChartLoading(
    loadIndex,
    resetKey,
    DASH_LOAD_STEP_MS,
    DASH_LOAD_FIRST_MS
  );
  const columns = useMemo(
    () =>
      panel.columns.map((col) => ({
        ...col,
        render:
          col.field === 'status'
            ? (status) => (
                <EuiBadge color={status === 'healthy' ? 'success' : 'warning'}>
                  {status}
                </EuiBadge>
              )
            : undefined,
      })),
    [panel.columns]
  );

  return (
    <div style={panelSpan(panel.w || 12)}>
      <DashboardPanelShell
        title={panel.title}
        height={320}
        loading={loading}
        chartHeight={220}
      >
        <EuiBasicTable
          items={panel.rows}
          columns={columns}
          tableLayout="auto"
          compressed
        />
      </DashboardPanelShell>
    </div>
  );
}

function ChartPanel({
  panel,
  colors,
  loadIndex = 0,
  resetKey,
  onOpenSlo,
  onAlertsClick,
}) {
  const loading = useShortChartLoading(
    loadIndex,
    resetKey,
    DASH_LOAD_STEP_MS,
    DASH_LOAD_FIRST_MS
  );
  if (panel.type === 'line') {
    return <LinePanel panel={panel} color={colors[0]} loading={loading} />;
  }
  if (panel.type === 'area') {
    return <AreaPanel panel={panel} color={colors[1]} loading={loading} />;
  }
  if (panel.type === 'bar') {
    return <BarPanel panel={panel} color={colors[2]} loading={loading} />;
  }
  if (panel.type === 'pie') {
    return <PiePanel panel={panel} colors={colors} loading={loading} />;
  }
  if (panel.type === 'heatmap') {
    return <HeatmapPanel panel={panel} loading={loading} />;
  }
  if (panel.type === 'bullet') {
    return <BulletPanel panel={panel} loading={loading} />;
  }
  if (panel.type === 'sloTile') {
    return (
      <SloTilePanel
        panel={panel}
        loading={loading}
        onOpenSlo={onOpenSlo}
        onAlertsClick={onAlertsClick}
      />
    );
  }
  if (panel.type === 'alertsMetric') {
    return <AlertsMetricPanel panel={panel} loading={loading} />;
  }
  return null;
}

const TIMELINE_TYPE_META = {
  alert: { icon: 'warning', label: 'Alert', color: 'danger' },
  log: { icon: 'document', label: 'Log', color: 'hollow' },
  apm: { icon: 'visLine', label: 'APM', color: 'primary' },
  metric: { icon: 'stats', label: 'Metric', color: 'accent' },
  dependency: { icon: 'branch', label: 'Dependency', color: 'warning' },
  deploy: { icon: 'package', label: 'Deploy', color: 'success' },
};

function InvestigationEventPanel({ event, loadIndex, resetKey }) {
  const loading = useShortChartLoading(
    loadIndex,
    resetKey,
    DASH_LOAD_STEP_MS,
    DASH_LOAD_FIRST_MS
  );
  const meta = TIMELINE_TYPE_META[event.type] || TIMELINE_TYPE_META.log;
  const [hovered, setHovered] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const showActions = hovered || menuOpen;

  return (
    <EuiPanel
      hasBorder
      paddingSize="m"
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <PanelHoverActionsOverlay
        title={event.title}
        visible={showActions}
        menuOpen={menuOpen}
        onMenuOpenChange={setMenuOpen}
      />
      <EuiFlexGroup
        gutterSize="s"
        alignItems="center"
        responsive={false}
        wrap
      >
        <EuiFlexItem grow={false}>
          <EuiBadge color={meta.color}>{meta.label}</EuiBadge>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText size="xs" color="subdued">
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {event.time}
              {event.date ? ` · ${event.date}` : ''}
            </span>
          </EuiText>
        </EuiFlexItem>
        {event.service && (
          <EuiFlexItem grow={false}>
            <EuiBadge color="hollow">{event.service}</EuiBadge>
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
      <EuiSpacer size="xs" />
      <EuiTitle size="xs">
        <h2>{event.title}</h2>
      </EuiTitle>
      {event.detail && (
        <>
          <EuiSpacer size="xs" />
          <EuiText size="s" color="subdued">
            <p style={{ margin: 0 }}>{event.detail}</p>
          </EuiText>
        </>
      )}
      <EuiSpacer size="m" />
      {loading ? (
        <ChartLoadingState height={168} size="xl" />
      ) : (
        <TimelineEventChart event={event} />
      )}
    </EuiPanel>
  );
}

function InvestigationTimelineDashboard({ events, resetKey }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <EuiText size="s" color="subdued">
        <p style={{ margin: 0 }}>
          AI-generated investigation dashboard — each panel visualizes one
          correlated event from the dependency timeline.
        </p>
      </EuiText>
      {events.map((event, i) => (
        <InvestigationEventPanel
          key={event.id}
          event={event}
          loadIndex={i}
          resetKey={resetKey}
        />
      ))}
    </div>
  );
}

function DashboardPanelsGrid({
  panels,
  resetKey,
  mode,
  metricColor,
  chartColors,
  onOpenSlo,
  onAlertsClick,
}) {
  const nMetrics = panels.metrics.length;
  const nTiles = panels.showcase?.tiles.length ?? 0;
  const nShowCharts = panels.showcase?.charts.length ?? 0;
  const nPrimary = panels.primaryCharts.length;
  const fullWidthIndex = nMetrics + nTiles + nShowCharts + nPrimary;
  const tableIndex = fullWidthIndex + 1;
  const sectionBase = tableIndex + 1;

  return (
    <>
      {mode === 'edit' && (
        <>
          <EuiText size="xs" color="subdued">
            <p style={{ margin: 0 }}>
              Edit mode · panels snap to a 48-column grid (shown here as 12 CSS
              columns). Metrics use quarter width; charts use half or full width.
            </p>
          </EuiText>
          <EuiSpacer size="s" />
        </>
      )}

      <div style={GRID}>
        {panels.metrics.map((metric, i) => (
          <MetricPanel
            key={metric.id}
            metric={metric}
            color={metricColor}
            loadIndex={i}
            resetKey={resetKey}
          />
        ))}
      </div>

      {panels.showcase && (
        <>
          <EuiSpacer size="m" />
          <div style={GRID}>
            {panels.showcase.tiles.map((panel, i) => (
              <ChartPanel
                key={panel.id}
                panel={panel}
                colors={chartColors}
                loadIndex={nMetrics + i}
                resetKey={resetKey}
                onOpenSlo={onOpenSlo}
                onAlertsClick={onAlertsClick}
              />
            ))}
          </div>
          <EuiSpacer size="m" />
          <div style={GRID}>
            {panels.showcase.charts.map((panel, i) => (
              <ChartPanel
                key={panel.id}
                panel={panel}
                colors={chartColors}
                loadIndex={nMetrics + nTiles + i}
                resetKey={resetKey}
                onOpenSlo={onOpenSlo}
                onAlertsClick={onAlertsClick}
              />
            ))}
          </div>
        </>
      )}

      <EuiSpacer size="m" />

      <div style={GRID}>
        {panels.primaryCharts.map((panel, i) => (
          <ChartPanel
            key={panel.id}
            panel={panel}
            colors={chartColors}
            loadIndex={nMetrics + nTiles + nShowCharts + i}
            resetKey={resetKey}
            onOpenSlo={onOpenSlo}
            onAlertsClick={onAlertsClick}
          />
        ))}
      </div>

      <EuiSpacer size="m" />

      <div style={GRID}>
        <ChartPanel
          panel={panels.fullWidth}
          colors={chartColors}
          loadIndex={fullWidthIndex}
          resetKey={resetKey}
          onOpenSlo={onOpenSlo}
          onAlertsClick={onAlertsClick}
        />
      </div>

      <EuiSpacer size="m" />

      <div style={GRID}>
        <TablePanel
          panel={panels.table}
          loadIndex={tableIndex}
          resetKey={resetKey}
        />
      </div>

      <EuiSpacer size="m" />

      <EuiTitle size="xs">
        <h2>{panels.section.title}</h2>
      </EuiTitle>
      <EuiSpacer size="m" />
      <div style={GRID}>
        {panels.section.panels.map((panel, i) => (
          <ChartPanel
            key={panel.id}
            panel={panel}
            colors={chartColors}
            loadIndex={sectionBase + i}
            resetKey={resetKey}
            onOpenSlo={onOpenSlo}
            onAlertsClick={onAlertsClick}
          />
        ))}
      </div>
    </>
  );
}

export function DashboardDetailPage({
  dashboard,
  onBack,
  onOpenSlo,
  assistantOpen,
  onAssistantOpenChange,
}) {
  const tokens = useChartColorTokens();
  const [mode, setMode] = useState('view');
  const [starred, setStarred] = useState(Boolean(dashboard?.starred));
  const [alertsSlo, setAlertsSlo] = useState(null);
  const [localAssistantOpen, setLocalAssistantOpen] = useState(false);
  const isAssistantOpen =
    assistantOpen != null ? assistantOpen : localAssistantOpen;
  const setAssistantOpen = (open) => {
    if (onAssistantOpenChange) onAssistantOpenChange(open);
    else setLocalAssistantOpen(open);
  };
  const isInvestigation = dashboard?.layout === 'investigationTimeline';
  const investigationEvents = useMemo(() => {
    if (!isInvestigation) return [];
    return loadInvestigationEvents() || buildDependencyTimeline();
  }, [isInvestigation, dashboard?.id]);
  const panels = useMemo(
    () => (isInvestigation ? null : getDashboardPanels(dashboard)),
    [dashboard, isInvestigation]
  );

  if (!dashboard) return null;
  if (!isInvestigation && !panels) return null;

  // Same soft grey as Memory P95 for all infra metric tiles.
  const metricColor = tokens.graySoft[1];
  // Neutral categorical series for non-status charts.
  const chartColors = tokens.vis;

  return (
    <>
      <EuiButtonEmpty
        iconType="arrowLeft"
        flush="left"
        color="text"
        onClick={onBack}
        style={{ marginBottom: 4 }}
      >
        Dashboards
      </EuiButtonEmpty>

      <EuiFlexGroup
        justifyContent="spaceBetween"
        alignItems="flexStart"
        gutterSize="m"
        wrap
      >
        <EuiFlexItem>
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                iconType={starred ? 'starFilled' : 'starEmpty'}
                color={starred ? 'warning' : 'text'}
                aria-label={starred ? 'Unstar dashboard' : 'Star dashboard'}
                onClick={() => setStarred((v) => !v)}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiTitle size="l">
                <h1>{dashboard.title}</h1>
              </EuiTitle>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiSpacer size="xs" />
          <EuiText size="s" color="subdued">
            <p style={{ margin: 0 }}>{dashboard.description}</p>
          </EuiText>
          {dashboard.tags?.length > 0 && (
            <>
              <EuiSpacer size="s" />
              <EuiFlexGroup gutterSize="xs" wrap responsive={false}>
                {dashboard.tags.map((tag) => (
                  <EuiFlexItem grow={false} key={tag}>
                    <EuiBadge color="hollow">{tag}</EuiBadge>
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>
            </>
          )}
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="s" responsive={false} wrap>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty iconType="calendar" size="s">
                {isInvestigation ? 'Incident window' : panels.timeRange}
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                iconType={mode === 'edit' ? 'cross' : 'pencil'}
                size="s"
                display="base"
                color="primary"
                aria-label={mode === 'edit' ? 'Cancel edit' : 'Edit'}
                onClick={() =>
                  setMode((current) => (current === 'edit' ? 'view' : 'edit'))
                }
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <DashboardActionsMenu dashboard={dashboard} size="s" />
            </EuiFlexItem>
            {mode === 'edit' && (
              <EuiFlexItem grow={false}>
                <EuiButton fill size="s" iconType="save">
                  Save
                </EuiButton>
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      {isInvestigation ? (
        <InvestigationTimelineDashboard
          events={investigationEvents}
          resetKey={dashboard.id}
        />
      ) : (
        <DashboardPanelsGrid
          panels={panels}
          resetKey={dashboard.id}
          mode={mode}
          metricColor={metricColor}
          chartColors={chartColors}
          onOpenSlo={onOpenSlo}
          onAlertsClick={setAlertsSlo}
        />
      )}

      {alertsSlo && (
        <AlertsFlyout slo={alertsSlo} onClose={() => setAlertsSlo(null)} />
      )}

      <AiAssistantFlyout
        isOpen={isAssistantOpen}
        onClose={() => setAssistantOpen(false)}
        contextType="dashboard"
        dashboard={dashboard}
      />
    </>
  );
}

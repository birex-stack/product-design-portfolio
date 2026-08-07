import React, { useMemo, useState } from 'react';
import {
  EuiAccordion,
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
  useEuiTheme,
} from '@elastic/eui';
import {
  AnnotationDomainType,
  AreaSeries,
  Axis,
  BarSeries,
  Chart,
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
} from '@elastic/charts';
import {
  ALERT_THRESHOLD_LINE_STYLE,
  useChartTooltipActions,
} from '../chart_tooltip_actions';
import { getDashboardPanels } from '../dashboards_data';
import { useChartBaseTheme } from '../use_chart_base_theme';
import { AiAssistantFlyout } from './AiAssistantFlyout';

const GRID = {
  display: 'grid',
  gridTemplateColumns: 'repeat(12, minmax(0, 1fr))',
  gap: 12,
  width: '100%',
};

function panelSpan(w) {
  return { gridColumn: `span ${w}` };
}

function DashboardPanelShell({ title, children, height, paddingSize = 's' }) {
  return (
    <EuiPanel
      hasBorder
      paddingSize={paddingSize}
      style={{ height: '100%', minHeight: height, display: 'flex', flexDirection: 'column' }}
    >
      {title && (
        <>
          <EuiTitle size="xxs">
            <h3>{title}</h3>
          </EuiTitle>
          <EuiSpacer size="s" />
        </>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </EuiPanel>
  );
}

function MetricPanel({ metric, color }) {
  const chartBaseTheme = useChartBaseTheme();
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
      <EuiPanel hasBorder paddingSize="none" style={{ height, overflow: 'hidden' }}>
        <Chart size={['100%', height]}>
          <Settings baseTheme={chartBaseTheme} />
          <Metric id={metric.id} data={[[datum]]} />
        </Chart>
      </EuiPanel>
    </div>
  );
}

function LinePanel({ panel, color }) {
  const chartBaseTheme = useChartBaseTheme();
  const height = 260;
  const { tooltipActions, alertThreshold, alertThresholdDetails } =
    useChartTooltipActions({ seriesName: panel.title, valueUnit: '' });

  return (
    <div style={panelSpan(panel.w || 6)}>
      <DashboardPanelShell title={panel.title} height={height + 48}>
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

function AreaPanel({ panel, color }) {
  const chartBaseTheme = useChartBaseTheme();
  const height = 260;
  const { tooltipActions, alertThreshold, alertThresholdDetails } =
    useChartTooltipActions({ seriesName: panel.title, valueUnit: '' });

  return (
    <div style={panelSpan(panel.w || 6)}>
      <DashboardPanelShell title={panel.title} height={height + 48}>
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

function BarPanel({ panel, color }) {
  const chartBaseTheme = useChartBaseTheme();
  const height = 260;
  const { tooltipActions, alertThreshold, alertThresholdDetails } =
    useChartTooltipActions({ seriesName: panel.title, valueUnit: '' });
  const labels = useMemo(() => {
    const map = new Map();
    panel.data.forEach((row) => map.set(row.x, row.label));
    return map;
  }, [panel.data]);

  return (
    <div style={panelSpan(panel.w || 12)}>
      <DashboardPanelShell title={panel.title} height={height + 48}>
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

function PiePanel({ panel, colors }) {
  const chartBaseTheme = useChartBaseTheme();
  const height = 260;

  return (
    <div style={panelSpan(panel.w || 6)}>
      <DashboardPanelShell title={panel.title} height={height + 48}>
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

function TablePanel({ panel }) {
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
      <DashboardPanelShell title={panel.title} height={320}>
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

function ChartPanel({ panel, colors }) {
  if (panel.type === 'line') return <LinePanel panel={panel} color={colors[0]} />;
  if (panel.type === 'area') return <AreaPanel panel={panel} color={colors[1]} />;
  if (panel.type === 'bar') return <BarPanel panel={panel} color={colors[2]} />;
  if (panel.type === 'pie') return <PiePanel panel={panel} colors={colors} />;
  return null;
}

export function DashboardDetailPage({
  dashboard,
  onBack,
  assistantOpen,
  onAssistantOpenChange,
}) {
  const { euiTheme } = useEuiTheme();
  const [mode, setMode] = useState('view');
  const [starred, setStarred] = useState(Boolean(dashboard?.starred));
  const [localAssistantOpen, setLocalAssistantOpen] = useState(false);
  const isAssistantOpen =
    assistantOpen != null ? assistantOpen : localAssistantOpen;
  const setAssistantOpen = (open) => {
    if (onAssistantOpenChange) onAssistantOpenChange(open);
    else setLocalAssistantOpen(open);
  };
  const panels = useMemo(
    () => getDashboardPanels(dashboard),
    [dashboard]
  );

  if (!dashboard || !panels) return null;

  // Soft tile fills typical of Kibana Metric panels
  const metricColors = ['#D4E7F7', '#D9F0E3', '#F8E8C9', '#E8DAF5'];

  const chartColors = [
    euiTheme.colors.primary,
    euiTheme.colors.accent,
    euiTheme.colors.danger,
    euiTheme.colors.success,
    euiTheme.colors.warning,
  ];

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
                {panels.timeRange}
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
              <EuiButtonIcon
                iconType="boxesVertical"
                size="s"
                display="base"
                aria-label="Actions"
              />
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
            color={metricColors[i % metricColors.length]}
          />
        ))}
      </div>

      <EuiSpacer size="m" />

      <div style={GRID}>
        {panels.primaryCharts.map((panel) => (
          <ChartPanel key={panel.id} panel={panel} colors={chartColors} />
        ))}
      </div>

      <EuiSpacer size="m" />

      <div style={GRID}>
        <ChartPanel panel={panels.fullWidth} colors={chartColors} />
      </div>

      <EuiSpacer size="m" />

      <div style={GRID}>
        <TablePanel panel={panels.table} />
      </div>

      <EuiSpacer size="m" />

      <EuiAccordion
        id={`${dashboard.id}-supporting`}
        buttonContent={
          <EuiTitle size="xs">
            <h2>{panels.section.title}</h2>
          </EuiTitle>
        }
        initialIsOpen={!panels.section.collapsedByDefault}
        paddingSize="m"
      >
        <div style={GRID}>
          {panels.section.panels.map((panel) => (
            <ChartPanel key={panel.id} panel={panel} colors={chartColors} />
          ))}
        </div>
      </EuiAccordion>

      <AiAssistantFlyout
        isOpen={isAssistantOpen}
        onClose={() => setAssistantOpen(false)}
        contextType="dashboard"
        dashboard={dashboard}
      />
    </>
  );
}

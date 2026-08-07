import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  EuiButton,
  EuiButtonGroup,
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
  Chart,
  LineAnnotation,
  LineSeries,
  Position,
  ScaleType,
  Settings,
  Tooltip,
} from '@elastic/charts';
import {
  ALERT_THRESHOLD_LINE_STYLE,
  useChartTooltipActions,
} from '../chart_tooltip_actions';
import { getVisSeriesColor, useChartColorTokens } from '../chart_colors';
import { useChartBaseTheme } from '../use_chart_base_theme';
import { ChartLoadingState } from './ChartLoadingState';

function seriesFromValues(values, labels) {
  return values.map((y, x) => ({
    x,
    y,
    label: labels?.[x] || `Day ${x + 1}`,
  }));
}

function sampleLinear(values, x) {
  const n = values.length;
  if (n === 0) return 0;
  if (x <= 0) return values[0];
  if (x >= n - 1) return values[n - 1];
  const i0 = Math.floor(x);
  const i1 = Math.min(n - 1, i0 + 1);
  const t = x - i0;
  return values[i0] * (1 - t) + values[i1] * t;
}

function targetPointCount(fullLength, span) {
  const fullSpan = Math.max(fullLength - 1, 1);
  const zoomFactor = fullSpan / Math.max(span, 0.25);
  return Math.min(96, Math.max(36, Math.round(28 * Math.pow(zoomFactor, 0.65))));
}

/** Build a denser series for a zoomed window in original index space. */
function densifyValues(values, minX, maxX, seed = 1) {
  const span = Math.max(maxX - minX, 1e-6);
  const count = targetPointCount(values.length, span);
  const zoomFactor = Math.max(values.length - 1, 1) / span;
  const detail = Math.min(0.1, 0.018 * Math.log2(1 + zoomFactor));
  const points = [];
  const labels = [];

  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0 : i / (count - 1);
    const x = minX + t * span;
    let y = sampleLinear(values, x);
    const n = Math.sin(seed * 12.9898 + x * 78.233 + i * 3.1) * 43758.5453;
    const r = n - Math.floor(n);
    y += (r - 0.5) * Math.abs(y) * detail * 2;
    points.push(Number(y.toFixed(3)));
    labels.push(`Day ${(x + 1).toFixed(1)}`);
  }

  return { values: points, labels };
}

function normalizeBrushIndices(x, length) {
  if (!x || length < 2) return null;
  const [a, b] = x;
  const rawMin = Math.min(a, b);
  const rawMax = Math.max(a, b);
  if (rawMax - rawMin < 0.35) return null;
  const min = Math.max(0, rawMin);
  const max = Math.min(length - 1, rawMax);
  if (max - min < 0.35) return null;
  return { min, max };
}

/**
 * Zoom replaces the visible series with a higher-resolution slice of the
 * original data (instead of only narrowing xDomain on the same points).
 * Range is stored in original index space so nested zooms keep working.
 */
function useZoomedSeries(values, seed = 1) {
  const [range, setRange] = useState(null);
  const length = values?.length || 0;

  useEffect(() => {
    setRange(null);
  }, [length, seed]);

  const display = useMemo(() => {
    if (!values?.length) {
      return { values: [], labels: undefined };
    }
    if (!range) {
      return {
        values,
        labels: values.map((_, i) => `Day ${i + 1}`),
      };
    }
    return densifyValues(values, range.min, range.max, seed);
  }, [values, range, seed]);

  const onBrushEnd = useCallback(
    (event) => {
      if (!length) return;
      const brushed = normalizeBrushIndices(event?.x, display.values.length);
      if (!brushed) return;

      const currentMin = range?.min ?? 0;
      const currentMax = range?.max ?? length - 1;
      const span = currentMax - currentMin;
      const displaySpan = Math.max(display.values.length - 1, 1);

      const next = {
        min: currentMin + (brushed.min / displaySpan) * span,
        max: currentMin + (brushed.max / displaySpan) * span,
      };
      if (next.max - next.min < 0.2) return;
      setRange(next);
    },
    [length, display.values.length, range]
  );

  const reset = useCallback(() => setRange(null), []);

  return {
    values: display.values,
    labels: display.labels,
    range,
    onBrushEnd,
    reset,
    isZoomed: range != null,
  };
}

function densifyBars(bars, minX, maxX) {
  const start = Math.max(0, Math.floor(minX));
  const end = Math.min(bars.length - 1, Math.ceil(maxX));
  const slice = bars.slice(start, end + 1);
  if (!slice.length) return [];

  const spanDays = Math.max(end - start + 1, 1);
  const bucketsPerDay = Math.max(
    2,
    Math.min(12, Math.round(48 / spanDays))
  );
  const dense = [];

  slice.forEach((bar, dayOffset) => {
    const dayIndex = start + dayOffset;
    for (let h = 0; h < bucketsPerDay; h += 1) {
      const n =
        Math.sin(dayIndex * 7.1 + h * 3.3 + bucketsPerDay) * 10000;
      const r = Math.abs(n - Math.floor(n));
      const share = (0.7 + r * 0.6) / bucketsPerDay;
      const hour = Math.round((h * 24) / bucketsPerDay);
      dense.push({
        ...bar,
        id: `${bar.id}-h${h}`,
        label: `D${dayIndex + 1} ${String(hour).padStart(2, '0')}:00`,
        good: Math.max(1, Math.round(bar.good * share)),
        bad: Math.max(0, Math.round(bar.bad * share)),
      });
    }
  });

  return dense;
}

function useZoomedBars(bars) {
  const [range, setRange] = useState(null);
  const length = bars?.length || 0;

  useEffect(() => {
    setRange(null);
  }, [length]);

  const displayBars = useMemo(() => {
    if (!bars?.length) return [];
    if (!range) return bars;
    return densifyBars(bars, range.min, range.max);
  }, [bars, range]);

  const onBrushEnd = useCallback(
    (event) => {
      if (!length) return;
      const brushed = normalizeBrushIndices(event?.x, displayBars.length);
      if (!brushed) return;

      const currentMin = range?.min ?? 0;
      const currentMax = range?.max ?? length - 1;
      const span = currentMax - currentMin;
      const displaySpan = Math.max(displayBars.length - 1, 1);

      const next = {
        min: currentMin + (brushed.min / displaySpan) * span,
        max: currentMin + (brushed.max / displaySpan) * span,
      };
      if (next.max - next.min < 0.15) return;
      setRange(next);
    },
    [length, displayBars.length, range]
  );

  const reset = useCallback(() => setRange(null), []);

  return {
    bars: displayBars,
    range,
    onBrushEnd,
    reset,
    isZoomed: range != null,
  };
}

function PanelHeader({ title, isZoomed, onReset, rightSide }) {
  return (
    <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" gutterSize="s">
      <EuiFlexItem grow>
        <EuiTitle size="xs">
          <h3>{title}</h3>
        </EuiTitle>
      </EuiFlexItem>
      {(isZoomed || rightSide) && (
        <EuiFlexItem grow={false}>
          <EuiFlexGroup
            gutterSize="s"
            alignItems="center"
            responsive={false}
            justifyContent="flexEnd"
          >
            {isZoomed && (
              <EuiFlexItem grow={false}>
                <EuiButton
                  size="s"
                  color="primary"
                  iconType="refresh"
                  onClick={onReset}
                >
                  Reset
                </EuiButton>
              </EuiFlexItem>
            )}
            {rightSide}
          </EuiFlexGroup>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
}

function ChartFrame({ height = 180, loading = false, children }) {
  if (loading) {
    return <ChartLoadingState height={height} size="xl" />;
  }

  return (
    <div style={{ width: '100%', height }}>
      <Chart size={{ width: '100%', height }}>{children}</Chart>
    </div>
  );
}

function LineChart({
  values,
  labels,
  target,
  color,
  yMin,
  yMax,
  seriesName,
  valueUnit = '%',
  loading = false,
  onBrushEnd,
}) {
  const chartBaseTheme = useChartBaseTheme();
  const tokens = useChartColorTokens();
  const data = useMemo(() => seriesFromValues(values, labels), [values, labels]);
  const { tooltipActions, alertThreshold, alertThresholdDetails } =
    useChartTooltipActions({ seriesName, valueUnit });

  return (
    <ChartFrame height={180} loading={loading}>
      <Settings
        baseTheme={chartBaseTheme}
        onBrushEnd={onBrushEnd}
        brushAxis="x"
        minBrushDelta={4}
      />
      <Tooltip
        headerFormatter={({ value }) =>
          data[value]?.label || `Day ${Number(value) + 1}`
        }
        actions={tooltipActions}
      />
      <Axis
        id="bottom"
        position={Position.Bottom}
        tickFormat={(d) => {
          const i = Math.round(Number(d));
          return data[i]?.label?.replace(/^Day\s/, '') || `${i + 1}`;
        }}
        showOverlappingTicks
      />
      <Axis
        id="left"
        position={Position.Left}
        tickFormat={(d) => `${Number(d).toFixed(1)}${valueUnit}`}
        domain={
          yMin != null && yMax != null
            ? { min: yMin, max: yMax }
            : undefined
        }
      />
      {target != null && (
        <LineAnnotation
          id="target"
          domainType={AnnotationDomainType.YDomain}
          dataValues={[
            { dataValue: target, details: `Target ${target}${valueUnit}` },
          ]}
          style={{
            line: {
              stroke: tokens.health.danger,
              strokeWidth: 1.5,
              opacity: 1,
              dash: [4, 3],
            },
          }}
        />
      )}
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
        id={seriesName}
        name={seriesName}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={data}
        color={color}
        tickFormat={(d) => `${Number(d).toFixed(2)}${valueUnit}`}
        lineSeriesStyle={{
          point: {
            visible: values.length <= 40,
            radius: 3,
            strokeWidth: 1,
          },
        }}
      />
    </ChartFrame>
  );
}

function AreaChart({
  values,
  labels,
  color,
  seriesName,
  loading = false,
  onBrushEnd,
}) {
  const chartBaseTheme = useChartBaseTheme();
  const data = useMemo(() => seriesFromValues(values, labels), [values, labels]);
  const { tooltipActions, alertThreshold, alertThresholdDetails } =
    useChartTooltipActions({ seriesName, valueUnit: '' });

  return (
    <ChartFrame height={160} loading={loading}>
      <Settings
        baseTheme={chartBaseTheme}
        onBrushEnd={onBrushEnd}
        brushAxis="x"
        minBrushDelta={4}
      />
      <Tooltip
        headerFormatter={({ value }) =>
          data[value]?.label || `Day ${Number(value) + 1}`
        }
        actions={tooltipActions}
      />
      <Axis
        id="bottom"
        position={Position.Bottom}
        tickFormat={(d) => {
          const i = Math.round(Number(d));
          return data[i]?.label?.replace(/^Day\s/, '') || `${i + 1}`;
        }}
      />
      <Axis
        id="left"
        position={Position.Left}
        tickFormat={(d) => Number(d).toFixed(2)}
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
        id={seriesName}
        name={seriesName}
        xScaleType={ScaleType.Linear}
        yScaleType={ScaleType.Linear}
        xAccessor="x"
        yAccessors={['y']}
        data={data}
        color={color}
        tickFormat={(d) => Number(d).toFixed(2)}
        areaSeriesStyle={{
          point: {
            visible: values.length <= 40,
            radius: 3,
            strokeWidth: 1,
          },
        }}
      />
    </ChartFrame>
  );
}

export function SliPanel({ slo, loading = false }) {
  const tokens = useChartColorTokens();
  const zoom = useZoomedSeries(slo.sparkline, 1);
  const rangeLabel = zoom.range
    ? `days ${(zoom.range.min + 1).toFixed(1)}–${(zoom.range.max + 1).toFixed(1)} · ${zoom.values.length} points`
    : 'last 30 days';

  return (
    <EuiPanel hasBorder paddingSize="m">
      <PanelHeader
        title="SLI observed values"
        isZoomed={zoom.isZoomed}
        onReset={zoom.reset}
      />
      <EuiSpacer size="s" />
      <LineChart
        values={zoom.values}
        labels={zoom.labels}
        target={slo.target}
        color={getVisSeriesColor(tokens, 0)}
        seriesName="SLI"
        valueUnit="%"
        loading={loading}
        onBrushEnd={zoom.onBrushEnd}
      />
      <EuiText size="xs" color="subdued">
        <p>
          Objective {slo.target.toFixed(2)}% · {rangeLabel}
        </p>
      </EuiText>
    </EuiPanel>
  );
}

export function BurnRatePanel({
  slo,
  burnWindow,
  onBurnWindowChange,
  loading = false,
}) {
  const tokens = useChartColorTokens();
  const zoom = useZoomedSeries(slo.burnSeries, 2);

  return (
    <EuiPanel hasBorder paddingSize="m">
      <PanelHeader
        title="Budget burn rate"
        isZoomed={zoom.isZoomed}
        onReset={zoom.reset}
        rightSide={
          <EuiFlexItem grow={false}>
            <EuiButtonGroup
              legend="Burn rate window"
              options={[
                { id: '1h', label: '1h' },
                { id: '6h', label: '6h' },
                { id: '24h', label: '24h' },
                { id: '72h', label: '72h' },
              ]}
              idSelected={burnWindow}
              onChange={onBurnWindowChange}
              buttonSize="compressed"
            />
          </EuiFlexItem>
        }
      />
      <EuiSpacer size="s" />
      <AreaChart
        values={zoom.values}
        labels={zoom.labels}
        color={tokens.health.danger}
        seriesName="Burn rate"
        loading={loading}
        onBrushEnd={zoom.onBrushEnd}
      />
    </EuiPanel>
  );
}

const FORECAST_BURN_RATE = 20.4;

function parseWindowDays(windowLabel) {
  const match = String(windowLabel || '').match(/(\d+)\s*days?/i);
  return match ? Number(match[1]) : 30;
}

/** At burn rate B, full budget lasts window/B. Scale by remaining %. */
function getBudgetExhaustionAt(remainingPct, windowLabel, burnRate = FORECAST_BURN_RATE) {
  if (!(remainingPct > 0) || !(burnRate > 0)) return null;
  const windowMs = parseWindowDays(windowLabel) * 24 * 60 * 60 * 1000;
  const msLeft = ((remainingPct / 100) * windowMs) / burnRate;
  return new Date(Date.now() + msLeft);
}

function formatExhaustionWhen(date) {
  const time = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const day = date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return `${time}, ${day}`;
}

export function BudgetRemainingPanel({ slo, loading = false }) {
  const tokens = useChartColorTokens();
  const zoom = useZoomedSeries(slo.budgetSeries, 3);
  const remaining = slo.budgetSeries[slo.budgetSeries.length - 1];
  const violated = remaining < 0;
  const exhaustionAt = useMemo(
    () => getBudgetExhaustionAt(remaining, slo.window, FORECAST_BURN_RATE),
    [remaining, slo.window]
  );
  const forecastLabel = exhaustionAt
    ? `Forecast @${FORECAST_BURN_RATE}x burn rate · budget depletes ${formatExhaustionWhen(exhaustionAt)}`
    : `Forecast @${FORECAST_BURN_RATE}x burn rate · budget already exhausted`;

  return (
    <EuiPanel hasBorder paddingSize="m">
      <PanelHeader
        title={
          <>
            Budget remaining:{' '}
            <span
              style={{
                color: violated
                  ? tokens.health.danger
                  : tokens.health.success,
              }}
            >
              {remaining.toFixed(2)}%
            </span>
          </>
        }
        isZoomed={zoom.isZoomed}
        onReset={zoom.reset}
      />
      <EuiSpacer size="s" />
      <LineChart
        values={zoom.values}
        labels={zoom.labels}
        target={0}
        color={
          violated ? tokens.health.danger : getVisSeriesColor(tokens, 2)
        }
        yMin={-20}
        yMax={80}
        seriesName="Budget remaining"
        valueUnit="%"
        loading={loading}
        onBrushEnd={zoom.onBrushEnd}
      />
      <EuiText size="xs" color="subdued">
        <p>{forecastLabel}</p>
      </EuiText>
    </EuiPanel>
  );
}

export function GoodBadPanel({ bars, onBarClick, loading = false }) {
  const tokens = useChartColorTokens();
  const chartBaseTheme = useChartBaseTheme();
  const zoom = useZoomedBars(bars);
  const { tooltipActions, alertThreshold, alertThresholdDetails } =
    useChartTooltipActions({ seriesName: 'Good vs Bad events', valueUnit: '' });
  // Default: Bad only. Both series stay available via the filter control.
  const [seriesFilter, setSeriesFilter] = useState('bad');

  const data = useMemo(
    () =>
      zoom.bars.map((bar, x) => ({
        x,
        label: bar.label,
        good: bar.good,
        bad: bar.bad,
        bar,
      })),
    [zoom.bars]
  );

  const showGood = seriesFilter === 'both' || seriesFilter === 'good';
  const showBad = seriesFilter === 'both' || seriesFilter === 'bad';

  return (
    <EuiPanel hasBorder paddingSize="m">
      <PanelHeader
        title="Good vs Bad events"
        isZoomed={zoom.isZoomed}
        onReset={zoom.reset}
        rightSide={
          <EuiFlexItem grow={false}>
            <EuiButtonGroup
              legend="Event type filter"
              options={[
                { id: 'bad', label: 'Bad' },
                { id: 'good', label: 'Good' },
                { id: 'both', label: 'Both' },
              ]}
              idSelected={seriesFilter}
              onChange={(id) => setSeriesFilter(id)}
              buttonSize="compressed"
            />
          </EuiFlexItem>
        }
      />
      <EuiText size="xs" color="subdued">
        <p>Click a good or bad bar segment to inspect events of that type.</p>
      </EuiText>
      <EuiSpacer size="s" />
      <ChartFrame key={`good-bad-${seriesFilter}`} height={210} loading={loading}>
        <Settings
          baseTheme={chartBaseTheme}
          showLegend
          legendPosition={Position.Bottom}
          onBrushEnd={zoom.onBrushEnd}
          brushAxis="x"
          minBrushDelta={4}
          onElementClick={(elements) => {
            const hit = elements?.[0];
            if (!Array.isArray(hit)) return;
            const [geometry, series] = hit;
            const datum = geometry?.datum;
            if (!datum?.bar) return;
            const kind =
              series?.yAccessor === 'good' || series?.specId === 'good'
                ? 'good'
                : 'bad';
            onBarClick({ bar: datum.bar, kind });
          }}
        />
        <Tooltip
          headerFormatter={({ value }) =>
            data[value]?.label || `Day ${Number(value) + 1}`
          }
          actions={tooltipActions}
        />
        <Axis
          id="bottom"
          position={Position.Bottom}
          tickFormat={(d) => data[d]?.label || `${Number(d) + 1}`}
        />
        <Axis
          id="left"
          position={Position.Left}
          tickFormat={(d) => Number(d).toLocaleString()}
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
        {showGood && (
          <BarSeries
            id="good"
            name="Good events"
            xScaleType={ScaleType.Linear}
            yScaleType={ScaleType.Linear}
            xAccessor="x"
            yAccessors={['good']}
            stackAccessors={['x']}
            data={data}
            color={tokens.health.success}
            tickFormat={(d) => Number(d).toLocaleString()}
          />
        )}
        {showBad && (
          <BarSeries
            id="bad"
            name="Bad events"
            xScaleType={ScaleType.Linear}
            yScaleType={ScaleType.Linear}
            xAccessor="x"
            yAccessors={['bad']}
            stackAccessors={['x']}
            data={data}
            color={tokens.health.danger}
            tickFormat={(d) => Number(d).toLocaleString()}
          />
        )}
      </ChartFrame>
    </EuiPanel>
  );
}

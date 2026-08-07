import React, { useMemo } from 'react';
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
} from '@elastic/charts';
import { EuiSpacer, EuiText, EuiTitle, useEuiTheme } from '@elastic/eui';
import { useChartBaseTheme } from '../use_chart_base_theme';

const POINTS = 18;
const EVENT_X = 12;

function seedFromId(id) {
  return String(id || 'event')
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

function rand(seed, i) {
  const x = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function seriesAround(seed, { baseline, spike, spikeAt = EVENT_X, noise = 0.08 }) {
  return Array.from({ length: POINTS }, (_, x) => {
    const dist = Math.abs(x - spikeAt);
    const bump =
      dist === 0
        ? 1
        : dist === 1
          ? 0.72
          : dist === 2
            ? 0.38
            : dist === 3
              ? 0.18
              : 0;
    const y =
      baseline +
      (spike - baseline) * bump +
      (rand(seed, x) - 0.5) * baseline * noise;
    return { x, y: Math.max(0, Number(y.toFixed(2))) };
  });
}

function deployReadySeries(seed) {
  return Array.from({ length: POINTS }, (_, x) => {
    // Rolling: pods come online through the deploy window, finish near EVENT_X
    const progress = Math.min(6, Math.max(0, ((x - 4) / (EVENT_X - 4)) * 6));
    const y = x < 4 ? 0 : x >= EVENT_X ? 6 : Math.floor(progress + rand(seed, x) * 0.3);
    return { x, y };
  });
}

function logLevelStacks(seed) {
  return Array.from({ length: POINTS }, (_, x) => {
    const surge = x >= EVENT_X - 1 ? 1 + (x - (EVENT_X - 2)) * 0.55 : 0.35;
    const total = 40 * surge * (0.85 + rand(seed, x) * 0.3);
    const warn = total * 0.68;
    const error = total * 0.22;
    const info = total * 0.1;
    return {
      x,
      warn: Number(warn.toFixed(1)),
      error: Number(error.toFixed(1)),
      info: Number(info.toFixed(1)),
    };
  });
}

function chartSpecForEvent(event, colors) {
  const seed = seedFromId(event.id);
  const type = event.type || 'log';
  const titleLower = String(event.title || '').toLowerCase();

  if (type === 'deploy') {
    return {
      title: 'Rolling deploy progress',
      subtitle: 'Pods ready during the rolling restart — deploy completes when all 6 are up.',
      kind: 'bar',
      data: deployReadySeries(seed),
      yAccessors: ['y'],
      seriesName: 'Pods ready',
      unit: '',
      tickFormat: (d) => `${Math.round(d)}`,
      color: colors.success,
      eventX: EVENT_X,
      eventLabel: 'Deploy done',
    };
  }

  if (type === 'apm') {
    return {
      title: 'Transaction latency (p95)',
      subtitle: 'Span duration on POST /authorize — spike after the payments-gateway deploy.',
      kind: 'area',
      data: seriesAround(seed, { baseline: 180, spike: 1400, noise: 0.12 }),
      yAccessors: ['y'],
      seriesName: 'p95',
      unit: 'ms',
      tickFormat: (d) => (d >= 1000 ? `${(d / 1000).toFixed(1)}s` : `${Math.round(d)}`),
      color: colors.primary,
      eventX: EVENT_X,
      eventLabel: 'Spike',
    };
  }

  if (type === 'log' && titleLower.includes('volume')) {
    return {
      title: 'Log volume by level',
      subtitle: 'Warn/error mix surges vs the prior baseline window.',
      kind: 'stacked',
      data: logLevelStacks(seed),
      eventX: EVENT_X,
      eventLabel: 'Surge',
    };
  }

  if (type === 'log') {
    return {
      title: 'Matching log rate',
      subtitle: 'Count of “context deadline exceeded” after the pattern first appears.',
      kind: 'bar',
      data: seriesAround(seed, { baseline: 4, spike: 42, noise: 0.2 }).map((p) => ({
        ...p,
        y: p.x < EVENT_X - 1 ? p.y * 0.15 : p.y,
      })),
      yAccessors: ['y'],
      seriesName: 'Matches / min',
      unit: '',
      tickFormat: (d) => `${Math.round(d)}`,
      color: colors.danger,
      eventX: EVENT_X - 1,
      eventLabel: 'First seen',
    };
  }

  if (type === 'alert' && titleLower.includes('error rate')) {
    return {
      title: 'APM error rate',
      subtitle: 'Error rate vs alert threshold — window when the related alert fired.',
      kind: 'line',
      data: seriesAround(seed, { baseline: 1.2, spike: 8.5, noise: 0.15 }),
      yAccessors: ['y'],
      seriesName: 'Error rate',
      unit: '%',
      tickFormat: (d) => `${Number(d).toFixed(1)}%`,
      color: colors.danger,
      threshold: 3,
      eventX: EVENT_X,
      eventLabel: 'Alert',
    };
  }

  if (type === 'alert') {
    return {
      title: 'SLO burn rate',
      subtitle: 'Multi-window burn rate crossing the critical threshold near this event.',
      kind: 'area',
      data: seriesAround(seed, { baseline: 2.4, spike: 20.4, noise: 0.1 }),
      yAccessors: ['y'],
      seriesName: 'Burn rate',
      unit: 'x',
      tickFormat: (d) => `${Number(d).toFixed(1)}x`,
      color: colors.danger,
      threshold: 14.4,
      eventX: EVENT_X,
      eventLabel: 'Fired',
    };
  }

  if (type === 'metric') {
    return {
      title: 'Client retry rate',
      subtitle: 'Observed retries vs baseline — amplification after upstream timeouts.',
      kind: 'line',
      data: seriesAround(seed, { baseline: 0.8, spike: 3.4, noise: 0.12 }),
      yAccessors: ['y'],
      seriesName: 'Retries / min',
      unit: '',
      tickFormat: (d) => `${Number(d).toFixed(1)}`,
      color: colors.accent,
      threshold: 0.8,
      thresholdLabel: 'Baseline',
      eventX: EVENT_X,
      eventLabel: 'Anomaly',
    };
  }

  if (type === 'dependency') {
    return {
      title: 'Dependency command latency (p95)',
      subtitle: 'redis-session latency jump felt by checkout-api and payments-gateway.',
      kind: 'area',
      data: seriesAround(seed, { baseline: 42, spike: 310, noise: 0.14 }),
      yAccessors: ['y'],
      seriesName: 'Command p95',
      unit: 'ms',
      tickFormat: (d) => `${Math.round(d)}`,
      color: colors.warning,
      eventX: EVENT_X,
      eventLabel: 'Degraded',
    };
  }

  return {
    title: 'Related signal',
    subtitle: 'Trend around the selected event.',
    kind: 'line',
    data: seriesAround(seed, { baseline: 20, spike: 55, noise: 0.15 }),
    yAccessors: ['y'],
    seriesName: 'Signal',
    unit: '',
    tickFormat: (d) => `${Math.round(d)}`,
    color: colors.primary,
    eventX: EVENT_X,
    eventLabel: 'Event',
  };
}

function EventMarker({ label }) {
  return (
    <div
      style={{
        fontSize: 10,
        lineHeight: 1.2,
        padding: '2px 6px',
        borderRadius: 4,
        background: 'rgba(0,0,0,0.72)',
        color: '#fff',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </div>
  );
}

export function TimelineEventChart({ event }) {
  const chartBaseTheme = useChartBaseTheme();
  const { euiTheme } = useEuiTheme();
  const colors = {
    primary: euiTheme.colors.primary,
    danger: euiTheme.colors.danger,
    success: euiTheme.colors.success,
    warning: euiTheme.colors.warning,
    accent: euiTheme.colors.accent,
  };

  const spec = useMemo(
    () => (event ? chartSpecForEvent(event, colors) : null),
    // colors from theme are stable enough for prototype; include event only
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [event]
  );

  if (!event || !spec) return null;

  const height = 168;
  const thresholdColor = euiTheme.colors.danger;

  return (
    <div>
      <EuiTitle size="xxs">
        <h3>{spec.title}</h3>
      </EuiTitle>
      <EuiText size="xs" color="subdued">
        <p style={{ margin: 0 }}>{spec.subtitle}</p>
      </EuiText>
      <EuiSpacer size="s" />
      <div style={{ width: '100%', height }}>
        <Chart size={{ width: '100%', height }}>
          <Settings
            baseTheme={chartBaseTheme}
            showLegend={spec.kind === 'stacked'}
            legendPosition={Position.Bottom}
            theme={{
              chartMargins: { top: 18, bottom: 0, left: 0, right: 0 },
            }}
          />
          <Axis
            id="bottom"
            position={Position.Bottom}
            tickFormat={(d) => `${Number(d) + 1}`}
            ticks={6}
          />
          <Axis
            id="left"
            position={Position.Left}
            tickFormat={spec.tickFormat || ((d) => `${Math.round(d)}`)}
            ticks={4}
          />

          {spec.threshold != null && (
            <LineAnnotation
              id="threshold"
              domainType={AnnotationDomainType.YDomain}
              dataValues={[{ dataValue: spec.threshold }]}
              style={{
                line: {
                  stroke: thresholdColor,
                  strokeWidth: 1,
                  opacity: 0.85,
                  dash: [4, 4],
                },
              }}
              marker={
                <span style={{ fontSize: 9, color: thresholdColor }}>
                  {spec.thresholdLabel || 'Threshold'}
                </span>
              }
              markerPosition={Position.Right}
            />
          )}

          <LineAnnotation
            id="event-marker"
            domainType={AnnotationDomainType.XDomain}
            dataValues={[{ dataValue: spec.eventX }]}
            style={{
              line: {
                stroke: euiTheme.colors.darkShade,
                strokeWidth: 1,
                opacity: 0.7,
                dash: [2, 3],
              },
            }}
            marker={<EventMarker label={spec.eventLabel || 'Event'} />}
            markerPosition={Position.Top}
          />

          {spec.kind === 'stacked' ? (
            <>
              <BarSeries
                id="info"
                name="info"
                xAccessor="x"
                yAccessors={['info']}
                stackAccessors={['x']}
                data={spec.data}
                xScaleType={ScaleType.Linear}
                yScaleType={ScaleType.Linear}
                color={euiTheme.colors.lightShade}
              />
              <BarSeries
                id="warn"
                name="warn"
                xAccessor="x"
                yAccessors={['warn']}
                stackAccessors={['x']}
                data={spec.data}
                xScaleType={ScaleType.Linear}
                yScaleType={ScaleType.Linear}
                color={euiTheme.colors.warning}
              />
              <BarSeries
                id="error"
                name="error"
                xAccessor="x"
                yAccessors={['error']}
                stackAccessors={['x']}
                data={spec.data}
                xScaleType={ScaleType.Linear}
                yScaleType={ScaleType.Linear}
                color={euiTheme.colors.danger}
              />
            </>
          ) : null}

          {spec.kind === 'bar' ? (
            <BarSeries
              id="series"
              name={spec.seriesName}
              xAccessor="x"
              yAccessors={spec.yAccessors}
              data={spec.data}
              xScaleType={ScaleType.Linear}
              yScaleType={ScaleType.Linear}
              color={spec.color}
            />
          ) : null}

          {spec.kind === 'area' ? (
            <AreaSeries
              id="series"
              name={spec.seriesName}
              xAccessor="x"
              yAccessors={spec.yAccessors}
              data={spec.data}
              xScaleType={ScaleType.Linear}
              yScaleType={ScaleType.Linear}
              color={spec.color}
            />
          ) : null}

          {spec.kind === 'line' ? (
            <LineSeries
              id="series"
              name={spec.seriesName}
              xAccessor="x"
              yAccessors={spec.yAccessors}
              data={spec.data}
              xScaleType={ScaleType.Linear}
              yScaleType={ScaleType.Linear}
              color={spec.color}
            />
          ) : null}
        </Chart>
      </div>
    </div>
  );
}

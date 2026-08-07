import React, { useMemo } from 'react';
import {
  AnnotationDomainType,
  AreaSeries,
  Axis,
  Chart,
  LineAnnotation,
  Position,
  RectAnnotation,
  ScaleType,
  Settings,
  Tooltip,
} from '@elastic/charts';
import { EuiSpacer, EuiText, EuiTitle } from '@elastic/eui';
import {
  ALERT_THRESHOLD_LINE_STYLE,
  ALERT_THRESHOLD_MARKER_POSITION,
  AlertThresholdAnnotationMarker,
  formatAlertThresholdLabel,
  getYDomainIncludingThreshold,
  useChartTooltipActions,
} from '../chart_tooltip_actions';
import { useChartColorTokens } from '../chart_colors';
import {
  buildAlertActivitySeries,
  findAlertTriggerIndex,
} from '../data';
import { useChartBaseTheme } from '../use_chart_base_theme';

/** Space for top LineAnnotation marker — charts don't auto-size for custom markers. */
const MARKER_TOP_MARGIN = 22;

function parseDurationHours(duration) {
  const match = String(duration || '').match(/(\d+)/);
  return match ? Number(match[1]) : 2;
}

/** Plain SVG — avoid EUI hooks inside annotation markers (can clip/mis-measure). */
function AlertMarker({ color }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill={color}
        d="M8.87 1.5a1 1 0 0 0-1.74 0L1.2 12.25A1 1 0 0 0 2.07 13.75h11.86a1 1 0 0 0 .87-1.5L8.87 1.5zM8 5.25a.75.75 0 0 1 .75.75v3a.75.75 0 0 1-1.5 0v-3A.75.75 0 0 1 8 5.25zm0 6.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"
      />
    </svg>
  );
}

function hexToRgba(hex, alpha) {
  const raw = String(hex || '').replace('#', '');
  if (raw.length !== 6) return `rgba(238, 76, 72, ${alpha})`;
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function AlertActivityChart({ alert, slo }) {
  const chartBaseTheme = useChartBaseTheme();
  const tokens = useChartColorTokens();
  const danger = tokens.health.danger;
  const {
    tooltipActions,
    alertThreshold,
    alertThresholdLabel,
    alertComparator,
  } = useChartTooltipActions({
    seriesName: alert?.name || 'Alert activity',
    valueUnit: '',
  });
  const threshold = alertThreshold ?? 70;
  const comparator = alertComparator || 'above';
  const thresholdLabel =
    alertThresholdLabel ||
    formatAlertThresholdLabel(threshold, comparator, '');

  const { data, triggerX, activeEndX } = useMemo(() => {
    const seed = (slo?.id?.length || 1) + (alert?.id?.length || 1);
    const values = buildAlertActivitySeries(seed, 36, { threshold });
    const series = values.map((y, x) => ({ x, y }));
    const points = series.length;
    const trigger = findAlertTriggerIndex(values, threshold, comparator);
    const hours = parseDurationHours(alert?.duration);
    const span = Math.max(
      2,
      Math.min(points - trigger - 1, Math.round(hours * 1.5))
    );
    const end =
      alert?.status === 'active'
        ? points - 1
        : Math.min(points - 1, trigger + span);
    return { data: series, triggerX: trigger, activeEndX: end };
  }, [alert, slo, threshold, comparator]);

  const yDomain = useMemo(
    () =>
      getYDomainIncludingThreshold({
        values: data.map((d) => d.y),
        alertThreshold: threshold,
      }),
    [data, threshold]
  );

  return (
    <div>
      <EuiTitle size="xs">
        <h3>Alert activity</h3>
      </EuiTitle>
      <EuiText size="xs" color="subdued">
        <p>
          Metric vs threshold. Red band marks the active alert window; warning
          marker shows when the alert was triggered.
        </p>
      </EuiText>
      <EuiSpacer size="s" />
      <div style={{ width: '100%', height: 220 }}>
        <Chart size={{ width: '100%', height: 220 }}>
          <Settings
            baseTheme={chartBaseTheme}
            showLegend={false}
            theme={{
              chartMargins: {
                top: MARKER_TOP_MARGIN,
                bottom: 0,
                left: 0,
                right: 0,
              },
            }}
          />
          <Tooltip actions={tooltipActions} />
          <Axis
            id="bottom"
            position={Position.Bottom}
            tickFormat={(d) => `${Number(d)}`}
          />
          <Axis
            id="left"
            position={Position.Left}
            tickFormat={(d) => Number(d).toFixed(0)}
            domain={yDomain}
          />

          <RectAnnotation
            id="alert-active-window"
            zIndex={0}
            dataValues={[
              {
                coordinates: {
                  x0: triggerX,
                  x1: activeEndX,
                  y0: undefined,
                  y1: undefined,
                },
                details: `Alert active · ${alert?.duration || ''}`,
              },
            ]}
            style={{
              fill: hexToRgba(danger, 0.18),
              stroke: hexToRgba(danger, 0.45),
              strokeWidth: 1,
              opacity: 1,
            }}
          />

          <LineAnnotation
            id="threshold"
            domainType={AnnotationDomainType.YDomain}
            dataValues={[
              {
                dataValue: threshold,
                details: thresholdLabel,
              },
            ]}
            style={ALERT_THRESHOLD_LINE_STYLE}
            marker={<AlertThresholdAnnotationMarker label={thresholdLabel} />}
            markerPosition={ALERT_THRESHOLD_MARKER_POSITION}
          />

          <LineAnnotation
            id="alert-triggered"
            domainType={AnnotationDomainType.XDomain}
            dataValues={[
              {
                dataValue: triggerX,
                details: `Alert triggered · ${alert?.triggeredAt || ''}`,
              },
            ]}
            marker={<AlertMarker color={danger} />}
            markerPosition={Position.Top}
            style={{
              line: {
                stroke: danger,
                strokeWidth: 1.5,
                opacity: 0.9,
              },
            }}
          />

          <AreaSeries
            id="metric"
            name="Observed value"
            xScaleType={ScaleType.Linear}
            yScaleType={ScaleType.Linear}
            xAccessor="x"
            yAccessors={['y']}
            data={data}
            color={tokens.vis[2]}
            areaSeriesStyle={{
              area: { opacity: 0.15 },
              line: { strokeWidth: 2 },
              point: { visible: false },
            }}
          />
        </Chart>
      </div>
    </div>
  );
}

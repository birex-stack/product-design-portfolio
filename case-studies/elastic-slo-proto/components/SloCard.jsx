import React, { useMemo } from 'react';
import { EuiBadge, EuiBadgeGroup, EuiIcon, EuiPanel } from '@elastic/eui';
import { Chart, Metric, MetricTrendShape, Settings } from '@elastic/charts';
import { css } from '@emotion/react';
import { useChartBaseTheme } from '../use_chart_base_theme';

const STATUS_META = {
  healthy: {
    label: 'Healthy',
    badgeColor: 'success',
    cardColor: '#6ECCB1',
  },
  warning: {
    label: 'Warning',
    badgeColor: 'warning',
    cardColor: '#F1D86F',
  },
  violated: {
    label: 'Violated',
    badgeColor: 'danger',
    cardColor: '#F66D64',
  },
};

function formatPct(value) {
  return `${Number(value).toFixed(2).replace('.', ',')}%`;
}

function GaugeMetricIcon({ width, height }) {
  return (
    <EuiIcon
      type="visGauge"
      color="#343741"
      style={{ width, height, marginTop: 2 }}
    />
  );
}

function SloBadges({ status, alerts, onAlertsClick }) {
  const meta = STATUS_META[status] || STATUS_META.healthy;

  return (
    <EuiBadgeGroup gutterSize="xs" style={{ marginTop: 8 }}>
      <EuiBadge color={meta.badgeColor} fill>
        {meta.label}
      </EuiBadge>
      {alerts > 0 && (
        <EuiBadge
          color="danger"
          fill
          iconType="warning"
          style={{
            pointerEvents: onAlertsClick ? 'auto' : 'none',
            cursor: onAlertsClick ? 'pointer' : 'default',
          }}
          onClick={
            onAlertsClick
              ? (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAlertsClick?.(e);
                }
              : undefined
          }
          onClickAriaLabel={
            onAlertsClick ? `View ${alerts} alerts` : undefined
          }
        >
          {alerts}
        </EuiBadge>
      )}
    </EuiBadgeGroup>
  );
}

/**
 * Shared SLO metric tile (list + dashboards).
 * `height` defaults to list size; dashboards pass a shorter height.
 */
export function SloCard({
  slo,
  onOpen,
  onAlertsClick,
  height = 180,
  interactive = Boolean(onOpen),
}) {
  const chartBaseTheme = useChartBaseTheme();
  const meta = STATUS_META[slo.status] || STATUS_META.healthy;

  const trend = useMemo(
    () =>
      (slo.sparkline || []).map((y, x) => ({
        x,
        y,
      })),
    [slo.sparkline]
  );

  return (
    <EuiPanel
      paddingSize="none"
      hasBorder
      onClick={interactive ? () => onOpen?.(slo.id) : undefined}
      onKeyDown={
        interactive
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onOpen?.(slo.id);
              }
            }
          : undefined
      }
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={interactive ? `Open ${slo.name}` : undefined}
      css={css`
        display: block;
        width: 100%;
        min-width: 0;
        height: ${height}px;
        overflow: hidden;
        padding: 0;
        text-align: left;
        cursor: ${interactive ? 'pointer' : 'default'};
        border-radius: 6px !important;
        transition: box-shadow 120ms ease, transform 120ms ease;

        ${interactive
          ? `
        &:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
          transform: translateY(-1px);
        }

        &:focus-visible {
          outline: 2px solid #07c;
          outline-offset: 2px;
        }
        `
          : ''}

        .echChart,
        .echMetricContainer,
        .echMetric {
          border-radius: 6px;
          pointer-events: none;
        }
      `}
    >
      <div style={{ width: '100%', height, pointerEvents: 'none' }}>
        <Chart size={{ width: '100%', height }}>
          <Settings baseTheme={chartBaseTheme} />
          <Metric
            id={slo.id}
            data={[
              [
                {
                  color: meta.cardColor,
                  title: slo.name,
                  body: (
                    <SloBadges
                      status={slo.status}
                      alerts={slo.alerts}
                      onAlertsClick={onAlertsClick}
                    />
                  ),
                  icon: GaugeMetricIcon,
                  extra: (
                    <span>
                      Target <strong>{formatPct(slo.target)}</strong>
                    </span>
                  ),
                  value: slo.sli,
                  valueFormatter: formatPct,
                  trend,
                  trendShape: MetricTrendShape.Area,
                  trendA11yTitle: `${slo.name} SLI trend`,
                  trendA11yDescription: `Recent SLI values for ${slo.name}. Current value ${formatPct(
                    slo.sli
                  )} against a ${formatPct(slo.target)} target. Status ${meta.label}.`,
                },
              ],
            ]}
          />
        </Chart>
      </div>
    </EuiPanel>
  );
}

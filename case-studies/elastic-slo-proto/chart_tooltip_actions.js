import { createElement, useCallback, useMemo, useState } from 'react';
import { Position } from '@elastic/charts';
import { useAssistantBridge } from './assistant_bridge';
import { useToasts } from './toast_context';

/** Reserved severity.danger (EUI health/severity palette). */
const THRESHOLD_STROKE = '#EE4C48';

/**
 * Elastic Charts renders tooltip actions with its own React tree.
 * Prefer plain strings for labels. ReactNode is OK via a label() factory
 * when using plain SVG (EuiIcon / Emotion assets can crash the tooltip portal).
 */
const LABEL_CREATE_ALERT = '+  Create alert rule';
const LABEL_CREATE_SLO = '+  Create SLO';

/** Inline EUI `productAgent` paths — no Emotion/EuiIcon (unsafe inside charts portal). */
function ProductAgentSvg() {
  return createElement(
    'svg',
    {
      xmlns: 'http://www.w3.org/2000/svg',
      width: 12,
      height: 12,
      viewBox: '0 0 16 16',
      fill: 'currentColor',
      'aria-hidden': true,
      focusable: 'false',
      style: { flexShrink: 0 },
    },
    createElement('path', {
      d: 'M10.447 11.523C9.826 12.767 8.59 13 8 13c-.59 0-1.826-.233-2.447-1.477l.894-.447C6.826 11.833 7.59 12 8 12c.41 0 1.174-.167 1.553-.924l.894.447Z',
    }),
    createElement('path', {
      fillRule: 'evenodd',
      clipRule: 'evenodd',
      d: 'M5.5 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm0 1a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1Zm5-1a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm0 1a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1Z',
    }),
    createElement('path', {
      fillRule: 'evenodd',
      clipRule: 'evenodd',
      d: 'M8 0a1.5 1.5 0 0 1 .5 2.912V4H11a3 3 0 0 1 3 3h1l.102.005A1 1 0 0 1 16 8v3a1 1 0 0 1-1 1h-1v2a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-2H1a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1a3 3 0 0 1 3-3h2.5V2.912A1.498 1.498 0 0 1 8 0ZM5 5a2 2 0 0 0-2 2v7h10V7a2 2 0 0 0-2-2H5Zm-4 6h1V8H1v3Zm13 0h1V8h-1v3ZM8 1a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1Z',
    })
  );
}

function AnalyzeDependenciesLabel() {
  return createElement(
    'span',
    {
      style: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
      },
    },
    createElement(ProductAgentSvg),
    'Analyze dependencies'
  );
}

function getSelectedTimeLabel(selected) {
  const item = selected?.[0];
  if (!item) return 'selected time';
  const datumLabel = item.datum?.label;
  if (datumLabel) return String(datumLabel);
  if (item.label && item.label !== item.formattedValue) return String(item.label);
  const x = item.datum?.x;
  if (x != null) return `point ${Number(x) + 1}`;
  return 'selected time';
}

/** Read the hovered/selected series value from Elastic Charts tooltip selection. */
export function getSelectedNumericValue(selected) {
  const item = selected?.[0];
  if (!item) return null;

  if (typeof item.value === 'number' && Number.isFinite(item.value)) {
    return item.value;
  }

  const datumY =
    item.datum?.y ??
    item.datum?.good ??
    item.datum?.bad ??
    item.datum?.count ??
    item.datum?.error ??
    item.datum?.warn ??
    item.datum?.info;
  if (typeof datumY === 'number' && Number.isFinite(datumY)) {
    return datumY;
  }

  const parsed = Number(
    String(item.formattedValue ?? item.value ?? '').replace(/[^\d.-]/g, '')
  );
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatThresholdValue(value, valueUnit = '') {
  if (value == null || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return `${Number(value).toFixed(digits)}${valueUnit}`;
}

export const ALERT_THRESHOLD_LINE_STYLE = {
  line: {
    stroke: THRESHOLD_STROKE,
    strokeWidth: 2,
    opacity: 1,
  },
};

/** Left edge of the plot, under the threshold stroke. */
export const ALERT_THRESHOLD_MARKER_POSITION = Position.Left;

const COMPARATOR_SYMBOL = {
  above: '>',
  above_or_eq: '≥',
  below: '<',
  below_or_eq: '≤',
};

/** Visible chart label, e.g. `Alert when > 90%`. */
export function formatAlertThresholdLabel(
  threshold,
  comparator = 'above',
  valueUnit = ''
) {
  if (threshold == null || !Number.isFinite(Number(threshold))) return null;
  const symbol = COMPARATOR_SYMBOL[comparator] || '>';
  return `Alert when ${symbol} ${formatThresholdValue(threshold, valueUnit)}`;
}

/**
 * Marker under the threshold line, inside the plot on the left.
 * Elastic Charts Left markers hang outside the Y-axis; shift by the label's
 * own width so the text starts just inside the plot under the stroke.
 */
export function AlertThresholdAnnotationMarker({ label }) {
  if (!label) return null;
  return createElement(
    'div',
    {
      style: {
        display: 'inline-block',
        fontSize: 10,
        lineHeight: 1.15,
        color: THRESHOLD_STROKE,
        whiteSpace: 'nowrap',
        fontWeight: 600,
        pointerEvents: 'none',
        // Own-width shift: brings a left-hanging marker fully into the plot.
        transform: 'translate(calc(100% + 8px), 6px)',
      },
    },
    label
  );
}

/**
 * Expand the Y-axis domain so an alert threshold (and optional markers)
 * stay visible when they sit above/below the series extrema.
 */
export function getYDomainIncludingThreshold({
  values = [],
  alertThreshold,
  yMin,
  yMax,
  extraValues = [],
} = {}) {
  const finite = (n) => Number.isFinite(Number(n));
  const series = values.map(Number).filter(finite);
  // Don't coerce null → 0 (Number(null) === 0).
  const markers = [alertThreshold, ...extraValues]
    .filter((v) => v != null && finite(v))
    .map(Number);
  const hasFixedMin = yMin != null && finite(yMin);
  const hasFixedMax = yMax != null && finite(yMax);

  let min = hasFixedMin ? Number(yMin) : undefined;
  let max = hasFixedMax ? Number(yMax) : undefined;

  // No threshold/markers → keep author domain, or leave auto-scaling alone.
  if (!markers.length) {
    return hasFixedMin && hasFixedMax ? { min, max } : undefined;
  }

  if (series.length) {
    min = min ?? Math.min(...series);
    max = max ?? Math.max(...series);
  }

  if (min == null) min = Math.min(...markers, 0);
  if (max == null) max = Math.max(...markers);

  for (const v of markers) {
    min = Math.min(min, v);
    max = Math.max(max, v);
  }

  // Keep the threshold slightly inside the plot so it isn't clipped.
  const span = Math.max(max - min, 1);
  const pad = span * 0.06;
  if (markers.some((v) => v >= max - 1e-9)) max += pad;
  if (markers.some((v) => v <= min + 1e-9)) {
    min -= pad;
    if (
      series.length &&
      series.every((v) => v >= 0) &&
      markers.every((v) => v >= 0)
    ) {
      min = Math.max(0, min);
    }
  }

  if (min === max) max = min + 1;

  return { min, max };
}

/**
 * Elastic Charts Tooltip `actions` — pin tooltip (right-click / prompt), then pick an action.
 * @see https://github.com/elastic/elastic-charts/pull/1782
 */
export function useChartTooltipActions({
  seriesName = 'metric',
  valueUnit = '',
} = {}) {
  const { addToast, openRuleEditor } = useToasts();
  const { analyzeDependencies } = useAssistantBridge();
  const [alertThreshold, setAlertThreshold] = useState(null);
  const [alertComparator, setAlertComparator] = useState('above');

  const onCreateAlertRule = useCallback(
    (selected) => {
      const value = getSelectedNumericValue(selected);
      if (value == null) {
        addToast({
          title: 'Could not create alert rule',
          color: 'danger',
          iconType: 'error',
          text: 'No metric value was selected on the chart.',
        });
        return;
      }
      openRuleEditor({
        mode: 'create',
        seriesName,
        valueUnit,
        threshold: value,
        comparator: 'above',
        onSave: ({ threshold: nextThreshold, comparator: nextComparator }) => {
          setAlertThreshold(nextThreshold);
          setAlertComparator(nextComparator || 'above');
        },
      });
    },
    [addToast, openRuleEditor, seriesName, valueUnit]
  );

  const onCreateSlo = useCallback(() => {
    addToast({
      title: 'SLO created',
      color: 'success',
      iconType: 'check',
      text: `SLO draft created from ${seriesName}.`,
    });
  }, [addToast, seriesName]);

  const onAnalyzeDependencies = useCallback(
    (selected) => {
      analyzeDependencies({
        seriesName,
        valueUnit,
        value: getSelectedNumericValue(selected),
        timeLabel: getSelectedTimeLabel(selected),
      });
    },
    [analyzeDependencies, seriesName, valueUnit]
  );

  const tooltipActions = useMemo(
    () => [
      {
        label: LABEL_CREATE_ALERT,
        onSelect: onCreateAlertRule,
      },
      {
        label: LABEL_CREATE_SLO,
        onSelect: onCreateSlo,
      },
      {
        label: () => createElement(AnalyzeDependenciesLabel),
        onSelect: onAnalyzeDependencies,
      },
    ],
    [onCreateAlertRule, onCreateSlo, onAnalyzeDependencies]
  );

  const comparatorLabel = {
    above: 'above',
    above_or_eq: '≥',
    below: 'below',
    below_or_eq: '≤',
  }[alertComparator] || 'above';

  const alertThresholdLabel = formatAlertThresholdLabel(
    alertThreshold,
    alertComparator,
    valueUnit
  );

  return {
    tooltipActions,
    alertThreshold,
    alertComparator,
    alertThresholdLabel,
    alertThresholdDetails:
      alertThreshold == null
        ? null
        : `Alert rule ${comparatorLabel} ${formatThresholdValue(
            alertThreshold,
            valueUnit
          )}`,
  };
}

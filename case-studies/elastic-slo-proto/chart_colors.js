import { useMemo } from 'react';
import { useEuiTheme } from '@elastic/eui';

/**
 * Chart color tokens:
 * - `health` / severity → reserved for status, SLO health, alert severity, thresholds
 * - `vis` → neutral categorical series (CPU, latency trends, throughput, etc.)
 *
 * @see https://eui.elastic.co/docs/patterns/severity/
 * @see https://eui.elastic.co/docs/getting-started/theming/tokens/colors/
 */

const SEVERITY_FALLBACK = {
  unknown: '#E3E8F2',
  success: '#24C292',
  neutral: '#B5E5F2',
  warning: '#FCD883',
  risk: '#FF995E',
  danger: '#EE4C48',
};

const VIS_FALLBACK = [
  '#16C5C0',
  '#A6EDEA',
  '#61A2FF',
  '#BFDBFF',
  '#EE72A6',
  '#FFC7DB',
  '#F6726A',
  '#FFC9C2',
  '#EAAE01',
  '#FCD883',
];

/** Soft tile fills aligned with severity (Metric panels / status cards). */
const HEALTH_SOFT_FALLBACK = {
  success: '#D9F0E3',
  warning: '#F8E8C9',
  risk: '#FCE0D1',
  danger: '#F8D7DA',
  unknown: '#E8EEF7',
  neutral: '#D9F0F5',
};

/** Soft greyscale fills for generic infra metric tiles (CPU, memory, disk…). */
const GRAY_SOFT_FALLBACK = ['#D3DAE6', '#E0E5EE', '#C5CDD8', '#EDF0F5'];

function pickSeverity(euiTheme, key) {
  return euiTheme?.colors?.severity?.[key] || SEVERITY_FALLBACK[key];
}

function pickVis(euiTheme, index) {
  const vis = euiTheme?.colors?.vis;
  const token = vis?.[`euiColorVis${index}`];
  return token || VIS_FALLBACK[index % VIS_FALLBACK.length];
}

function pickSoftBackground(euiTheme, key) {
  const map = {
    success: euiTheme?.colors?.backgroundBaseSuccess,
    warning: euiTheme?.colors?.backgroundBaseWarning,
    risk: euiTheme?.colors?.backgroundBaseRisk,
    danger: euiTheme?.colors?.backgroundBaseDanger,
    unknown: euiTheme?.colors?.backgroundBaseSubdued,
    neutral: euiTheme?.colors?.backgroundBasePrimary,
  };
  return map[key] || HEALTH_SOFT_FALLBACK[key] || HEALTH_SOFT_FALLBACK.unknown;
}

export function getChartColorTokens(euiTheme) {
  const health = {
    success: pickSeverity(euiTheme, 'success'),
    warning: pickSeverity(euiTheme, 'warning'),
    risk: pickSeverity(euiTheme, 'risk'),
    danger: pickSeverity(euiTheme, 'danger'),
    unknown: pickSeverity(euiTheme, 'unknown'),
    neutral: pickSeverity(euiTheme, 'neutral'),
  };

  const vis = Array.from({ length: 10 }, (_, i) => pickVis(euiTheme, i));
  // Prefer odd (lighter) pairs for soft metric tile fills — still from vis palette.
  const visSoft = [1, 3, 5, 7, 9, 0, 2, 4, 6, 8].map((i) => vis[i]);

  const lightShade = euiTheme?.colors?.lightShade || GRAY_SOFT_FALLBACK[0];
  const lightestShade = euiTheme?.colors?.lightestShade || GRAY_SOFT_FALLBACK[3];
  const subdued =
    euiTheme?.colors?.backgroundBaseSubdued || GRAY_SOFT_FALLBACK[1];
  // Soft greys only — keep fills light enough for Metric’s dark text.
  const graySoft = [
    lightShade,
    subdued,
    GRAY_SOFT_FALLBACK[2],
    lightestShade,
  ];

  return {
    health,
    healthSoft: {
      success: pickSoftBackground(euiTheme, 'success'),
      warning: pickSoftBackground(euiTheme, 'warning'),
      risk: pickSoftBackground(euiTheme, 'risk'),
      danger: pickSoftBackground(euiTheme, 'danger'),
      unknown: pickSoftBackground(euiTheme, 'unknown'),
      neutral: pickSoftBackground(euiTheme, 'neutral'),
    },
    vis,
    visSoft,
    /** Greyscale soft fills for non-status metric tiles */
    graySoft,
    /** Status / latency band scale: healthy → warning → risk → danger */
    statusBands: [health.success, health.warning, health.risk, health.danger],
  };
}

export function useChartColorTokens() {
  const { euiTheme } = useEuiTheme();
  return useMemo(() => getChartColorTokens(euiTheme), [euiTheme]);
}

/** SLO / health status → reserved severity color */
export function getSloStatusHealthColor(status, tokens) {
  if (status === 'healthy') return tokens.health.success;
  if (status === 'warning' || status === 'degrading') return tokens.health.warning;
  if (status === 'violated') return tokens.health.danger;
  return tokens.health.unknown;
}

export function getSloStatusHealthSoft(status, tokens) {
  if (status === 'healthy') return tokens.healthSoft.success;
  if (status === 'warning' || status === 'degrading') return tokens.healthSoft.warning;
  if (status === 'violated') return tokens.healthSoft.danger;
  return tokens.healthSoft.unknown;
}

/** Neutral series color by index (never severity tokens). */
export function getVisSeriesColor(tokens, index = 0) {
  const list = tokens.vis;
  return list[index % list.length];
}

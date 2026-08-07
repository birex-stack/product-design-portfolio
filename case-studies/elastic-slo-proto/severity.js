/**
 * EUI Health & Severity mapping for Alerting / Priority
 * @see https://eui.elastic.co/docs/patterns/severity/
 *
 * critical → danger
 * high     → risk
 * medium   → warning
 * low      → neutral
 */

export const ALERT_SEVERITY_TO_EUI = {
  critical: 'danger',
  high: 'risk',
  medium: 'warning',
  low: 'neutral',
};

/** Light-mode fallbacks from EUI docs when theme.severity is unavailable */
const SEVERITY_HEX_FALLBACK = {
  unknown: '#E3E8F2',
  success: '#24C292',
  neutral: '#B5E5F2',
  warning: '#FCD883',
  risk: '#FF995E',
  danger: '#EE4C48',
};

/** Named color for EuiBadge `color` prop */
export function getAlertSeverityBadgeColor(severity) {
  return ALERT_SEVERITY_TO_EUI[severity] || 'default';
}

/** Hex from euiTheme.colors.severity for charts */
export function getAlertSeverityChartColor(severity, euiTheme) {
  const token = ALERT_SEVERITY_TO_EUI[severity] || 'unknown';
  const fromTheme = euiTheme?.colors?.severity?.[token];
  if (fromTheme) return fromTheme;
  return SEVERITY_HEX_FALLBACK[token] || SEVERITY_HEX_FALLBACK.unknown;
}

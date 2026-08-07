import React from 'react';
import { EuiLink, EuiTextColor } from '@elastic/eui';

/** Field titles that support drill-in (APM service, rule, env, etc.). */
const DRILL_IN_TITLES = new Set([
  'service',
  'environment',
  'region',
  'version',
  'transaction',
  'downstream',
  'dependency',
  'connected from',
  'rule',
  'metric',
  'hosts',
  'triggered by',
  'acknowledged by',
  'source',
  'pattern',
  'top message',
]);

const ALARMING_RE =
  /\b(error|errors|critical|high|severe|degraded|violated|violation|warning|warn|failed|failure|timeout|timed?\s*out|active|breach|breached)\b/i;

export function isDrillInField(title) {
  return DRILL_IN_TITLES.has(String(title || '').trim().toLowerCase());
}

export function isAlarmingValue(value) {
  return ALARMING_RE.test(String(value ?? ''));
}

/**
 * Description-list value: link style when drill-in makes sense,
 * danger color for error / concerning values.
 */
export function FieldValue({ title, value, onDrillIn }) {
  const text = String(value ?? '');
  if (!text) return null;

  const alarming = isAlarmingValue(text);
  const drillable = isDrillInField(title);

  if (drillable && text.includes(',')) {
    const parts = text.split(',').map((p) => p.trim()).filter(Boolean);
    return (
      <>
        {parts.map((part, i) => (
          <React.Fragment key={`${part}-${i}`}>
            {i > 0 ? ', ' : null}
            <FieldValue title={title} value={part} onDrillIn={onDrillIn} />
          </React.Fragment>
        ))}
      </>
    );
  }

  if (drillable) {
    return (
      <EuiLink
        color={alarming ? 'danger' : 'primary'}
        onClick={(e) => {
          e.preventDefault();
          onDrillIn?.({ title, value: text });
        }}
      >
        {text}
      </EuiLink>
    );
  }

  if (alarming) {
    return <EuiTextColor color="danger">{text}</EuiTextColor>;
  }

  return text;
}

export function toFieldListItems(items, { onDrillIn } = {}) {
  return (items || [])
    .filter(Boolean)
    .map((item) => ({
      title: item.title,
      description: (
        <FieldValue
          title={item.title}
          value={item.description}
          onDrillIn={onDrillIn}
        />
      ),
    }));
}

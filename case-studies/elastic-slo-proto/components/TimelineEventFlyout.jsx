import React from 'react';
import {
  EuiBadge,
  EuiCodeBlock,
  EuiDescriptionList,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiIcon,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';

const TYPE_META = {
  alert: { icon: 'warning', label: 'Alert', color: 'danger' },
  log: { icon: 'document', label: 'Log', color: 'hollow' },
  apm: { icon: 'visLine', label: 'APM', color: 'primary' },
  metric: { icon: 'stats', label: 'Metric', color: 'accent' },
  dependency: { icon: 'branch', label: 'Dependency', color: 'warning' },
  deploy: { icon: 'package', label: 'Deploy', color: 'success' },
};

/**
 * Child expandable flyout for a dependency-timeline event.
 * Must be a direct child of a flyout with session="start".
 */
export function TimelineEventFlyout({
  event,
  onClose,
  session = 'inherit',
  hasChildBackground = true,
  size = 's',
}) {
  if (!event) return null;

  const meta = TYPE_META[event.type] || TYPE_META.log;
  const listItems = [
    {
      title: 'Time',
      description: event.date ? `${event.time} · ${event.date}` : event.time,
    },
    event.service
      ? { title: 'Service', description: event.service }
      : null,
    event.environment
      ? { title: 'Environment', description: event.environment }
      : null,
    event.region ? { title: 'Region', description: event.region } : null,
    ...(event.fields || []),
  ].filter(Boolean);

  return (
    <EuiFlyout
      ownFocus
      onClose={onClose}
      size={size}
      session={session}
      hasChildBackground={hasChildBackground}
      flyoutMenuProps={{ title: event.title }}
      aria-label={event.title}
    >
      <EuiFlyoutHeader hasBorder>
        <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiIcon type={meta.icon} />
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiTitle size="s">
              <h2>{event.title}</h2>
            </EuiTitle>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="s" />
        <EuiFlexGroup gutterSize="s" responsive={false} wrap>
          <EuiFlexItem grow={false}>
            <EuiBadge color={meta.color}>{meta.label}</EuiBadge>
          </EuiFlexItem>
          {event.service && (
            <EuiFlexItem grow={false}>
              <EuiBadge color="hollow">{event.service}</EuiBadge>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
        {event.detail && (
          <>
            <EuiSpacer size="s" />
            <EuiText size="s" color="subdued">
              <p style={{ margin: 0 }}>{event.detail}</p>
            </EuiText>
          </>
        )}
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiTitle size="xxs">
          <h3>Event details</h3>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiDescriptionList
          type="column"
          compressed
          listItems={listItems}
        />
        {event.sample && (
          <>
            <EuiSpacer size="m" />
            <EuiTitle size="xxs">
              <h3>Sample</h3>
            </EuiTitle>
            <EuiSpacer size="s" />
            <EuiCodeBlock
              language="text"
              fontSize="s"
              paddingSize="m"
              isCopyable
            >
              {event.sample}
            </EuiCodeBlock>
          </>
        )}
      </EuiFlyoutBody>
    </EuiFlyout>
  );
}

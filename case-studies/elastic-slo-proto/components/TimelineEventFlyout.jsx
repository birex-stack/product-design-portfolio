import React, { useMemo } from 'react';
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
import { toFieldListItems } from './FieldValue';
import { FlyoutHeaderActions } from './FlyoutHeaderActions';
import { FlyoutListNavFooter } from './FlyoutListNavFooter';
import { TimelineEventChart } from './TimelineEventChart';

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
  /** Ordered list for footer prev/next when opened from a timeline. */
  items,
  onSelectItem,
}) {
  const listItems = useMemo(() => {
    if (!event) return [];
    return toFieldListItems(
      [
        {
          title: 'Time',
          description: event.date
            ? `${event.time} · ${event.date}`
            : event.time,
        },
        event.service
          ? { title: 'Service', description: event.service }
          : null,
        event.environment
          ? { title: 'Environment', description: event.environment }
          : null,
        event.region ? { title: 'Region', description: event.region } : null,
        ...(event.fields || []),
      ],
      {
        onDrillIn: () => {
          /* Prototype: drill-in affordance only */
        },
      }
    );
  }, [event]);

  if (!event) return null;

  const meta = TYPE_META[event.type] || TYPE_META.log;

  return (
    <EuiFlyout
      ownFocus
      onClose={onClose}
      size={size}
      session={session}
      hasChildBackground={hasChildBackground}
      hideCloseButton
      flyoutMenuProps={{ title: event.title }}
      aria-label={event.title}
    >
      <EuiFlyoutHeader hasBorder>
        <EuiFlexGroup
          justifyContent="spaceBetween"
          alignItems="flexStart"
          gutterSize="s"
          responsive={false}
        >
          <EuiFlexItem>
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
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <FlyoutHeaderActions onClose={onClose} />
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
        <TimelineEventChart event={event} />
        <EuiSpacer size="m" />
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
      {items?.length > 1 && onSelectItem && (
        <FlyoutListNavFooter
          items={items}
          currentId={event.id}
          onSelect={onSelectItem}
        />
      )}
    </EuiFlyout>
  );
}

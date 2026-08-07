import React from 'react';
import {
  EuiBadge,
  EuiBasicTable,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { FlyoutHeaderActions } from './FlyoutHeaderActions';

function CellText({ children }) {
  return (
    <EuiText size="xs">
      <span>{children}</span>
    </EuiText>
  );
}

const columns = [
  {
    field: 'timestamp',
    name: 'Timestamp',
    width: '100px',
    truncateText: false,
    render: (timestamp) => {
      const [time, date] = String(timestamp || '').split(/\s+/);
      return (
        <EuiText size="xs">
          <div
            style={{
              whiteSpace: 'nowrap',
              lineHeight: 1.35,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <div>{time}</div>
            {date && (
              <div style={{ whiteSpace: 'nowrap', opacity: 0.7 }}>{date}</div>
            )}
          </div>
        </EuiText>
      );
    },
  },
  {
    field: 'type',
    name: 'Type',
    width: '100px',
    render: (type) => (
      <EuiBadge
        color={
          type === 'error' || type === '5xx'
            ? 'danger'
            : type === 'ok' || type === 'success' || type === '2xx'
              ? 'success'
              : 'warning'
        }
      >
        {type}
      </EuiBadge>
    ),
  },
  {
    field: 'service',
    name: 'Service',
    width: '120px',
    render: (service) => <CellText>{service}</CellText>,
  },
  {
    field: 'message',
    name: 'Event',
    render: (message) => <CellText>{message}</CellText>,
  },
  {
    field: 'durationMs',
    name: 'Duration',
    width: '90px',
    render: (ms) => <CellText>{`${ms} ms`}</CellText>,
  },
];

export function EventsFlyout({ sloName, bar, kind = 'bad', events, onClose }) {
  if (!bar) return null;

  const isGood = kind === 'good';
  const count = isGood ? bar.good : bar.bad;
  const title = isGood ? 'Good events' : 'Bad events';

  return (
    <EuiFlyout
      ownFocus
      onClose={onClose}
      size="m"
      hideCloseButton
      aria-labelledby="events-flyout-title"
    >
      <EuiFlyoutHeader hasBorder>
        <EuiFlexGroup
          justifyContent="spaceBetween"
          alignItems="flexStart"
          gutterSize="s"
          responsive={false}
        >
          <EuiFlexItem>
            <EuiTitle size="m">
              <h2 id="events-flyout-title">{title}</h2>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <FlyoutHeaderActions onClose={onClose} />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="s" />
        <EuiText size="s" color="subdued">
          <p>
            {sloName} · {bar.label} · {bar.timestamp}
          </p>
        </EuiText>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <EuiText size="s">
          <p>
            <strong>{count.toLocaleString()}</strong> {isGood ? 'good' : 'bad'}{' '}
            events in this bucket. Showing a filtered sample for the selected bar
            segment.
          </p>
        </EuiText>
        <EuiSpacer size="m" />
        <EuiBasicTable
          items={events}
          columns={columns}
          tableLayout="fixed"
          noItemsMessage="No events in this bucket."
        />
      </EuiFlyoutBody>
    </EuiFlyout>
  );
}

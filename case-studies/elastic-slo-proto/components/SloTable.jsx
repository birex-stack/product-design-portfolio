import React, { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiBadgeGroup,
  EuiBasicTable,
  EuiButtonIcon,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiLink,
  EuiPopover,
  EuiText,
} from '@elastic/eui';
import { AlertActivitySparkline } from './AlertActivitySparkline';

const STATUS_META = {
  healthy: { label: 'Healthy', color: 'success' },
  warning: { label: 'Warning', color: 'warning' },
  violated: { label: 'Violated', color: 'danger' },
};

const TREND_STROKE = {
  healthy: '#24C292',
  warning: '#F1D86F',
  violated: '#BD271E',
};

const TREND_FILL = {
  healthy: 'rgba(36, 194, 146, 0.18)',
  warning: 'rgba(241, 216, 111, 0.28)',
  violated: 'rgba(189, 39, 30, 0.18)',
};

function formatPct(value) {
  return `${Number(value).toFixed(2)}%`;
}

function budgetRemaining(slo) {
  if (!slo) return null;
  const series = slo.budgetSeries || [];
  if (!series.length) return null;
  return series[series.length - 1];
}

function SloActionsMenu({ slo, onOpen }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <EuiPopover
      button={
        <EuiButtonIcon
          iconType="boxesVertical"
          aria-label={`Actions for ${slo?.name || 'SLO'}`}
          onClick={() => setIsOpen((open) => !open)}
        />
      }
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      panelPaddingSize="none"
      anchorPosition="downRight"
    >
      <EuiContextMenuPanel
        size="s"
        items={[
          <EuiContextMenuItem
            key="open"
            icon="popout"
            onClick={() => {
              setIsOpen(false);
              onOpen?.(slo.id);
            }}
          >
            Open details
          </EuiContextMenuItem>,
          <EuiContextMenuItem
            key="edit"
            icon="pencil"
            onClick={() => setIsOpen(false)}
          >
            Edit
          </EuiContextMenuItem>,
          <EuiContextMenuItem
            key="clone"
            icon="copy"
            onClick={() => setIsOpen(false)}
          >
            Clone
          </EuiContextMenuItem>,
          <EuiContextMenuItem
            key="delete"
            icon="trash"
            onClick={() => setIsOpen(false)}
          >
            Delete
          </EuiContextMenuItem>,
        ]}
      />
    </EuiPopover>
  );
}

export function SloTable({ items, onOpen, onAlertsClick }) {
  const columns = useMemo(
    () => [
      {
        field: 'status',
        name: 'Status',
        width: '110px',
        render: (status) => {
          const meta = STATUS_META[status] || STATUS_META.healthy;
          return (
            <EuiBadge color={meta.color} fill>
              {meta.label}
            </EuiBadge>
          );
        },
      },
      {
        field: 'name',
        name: 'SLO name',
        render: (name, slo) => (
          <EuiLink
            onClick={(e) => {
              e.preventDefault();
              onOpen(slo.id);
            }}
          >
            {name}
          </EuiLink>
        ),
      },
      {
        field: 'sparkline',
        name: 'Historical SLI',
        width: '120px',
        render: (values, slo) => (
          <AlertActivitySparkline
            values={values}
            width={100}
            height={28}
            stroke={TREND_STROKE[slo.status] || TREND_STROKE.healthy}
            fill={TREND_FILL[slo.status] || TREND_FILL.healthy}
          />
        ),
      },
      {
        field: 'sli',
        name: 'SLI',
        width: '90px',
        align: 'right',
        render: (sli) => (
          <EuiText size="s">
            <strong>{formatPct(sli)}</strong>
          </EuiText>
        ),
      },
      {
        field: 'target',
        name: 'Target',
        width: '90px',
        align: 'right',
        render: (target) => (
          <EuiText size="s">
            <span>{formatPct(target)}</span>
          </EuiText>
        ),
      },
      {
        // Use a real field so EuiBasicTable always passes the record correctly
        field: 'budgetSeries',
        name: 'Budget remaining',
        width: '130px',
        align: 'right',
        render: (_series, slo) => {
          const budget = budgetRemaining(slo);
          if (budget == null) return '—';
          const color =
            budget < 0 ? 'danger' : budget < 10 ? 'warning' : 'default';
          return (
            <EuiText size="s" color={color === 'default' ? undefined : color}>
              <span>{formatPct(budget)}</span>
            </EuiText>
          );
        },
      },
      {
        field: 'alerts',
        name: 'Alerts',
        width: '80px',
        align: 'right',
        render: (alerts, slo) =>
          alerts > 0 ? (
            <EuiBadge
              color="danger"
              fill
              iconType="warning"
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAlertsClick(slo);
              }}
            >
              {alerts}
            </EuiBadge>
          ) : (
            <EuiText size="s" color="subdued">
              <span>0</span>
            </EuiText>
          ),
      },
      {
        field: 'tags',
        name: 'Tags',
        width: '160px',
        render: (tags) => (
          <EuiBadgeGroup gutterSize="xs">
            {(tags || []).map((tag) => (
              <EuiBadge key={tag}>{tag}</EuiBadge>
            ))}
          </EuiBadgeGroup>
        ),
      },
      {
        field: 'window',
        name: 'Time window',
        width: '130px',
        render: (window) => (
          <EuiText size="xs" color="subdued">
            <span>{window}</span>
          </EuiText>
        ),
      },
      {
        field: 'id',
        name: '',
        width: '40px',
        align: 'right',
        render: (_id, slo) => <SloActionsMenu slo={slo} onOpen={onOpen} />,
      },
    ],
    [onOpen, onAlertsClick]
  );

  return (
    <EuiBasicTable
      items={items}
      columns={columns}
      tableLayout="auto"
      noItemsMessage="No SLOs match your filters."
    />
  );
}

import React, { useMemo } from 'react';
import {
  EuiBadge,
  EuiBasicTable,
  EuiButtonIcon,
  EuiLink,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { INVESTIGATION_GUIDE_STEP_TOTAL } from '../alerts_data';
import { getAlertSeverityBadgeColor } from '../severity';
import { InvestigationProgressBadge } from './InvestigationProgressBadge';

export const ALERT_STATUS_COLOR = {
  active: 'danger',
  acknowledged: 'warning',
  recovered: 'success',
};

function CellText({ children }) {
  return (
    <EuiText size="xs">
      <span>{children}</span>
    </EuiText>
  );
}

/**
 * Shared alerts inventory table — full columns, or compact when space is tight
 * (e.g. AI Assistant push flyout open).
 */
export function AlertsInventoryTable({
  items,
  compact = false,
  onOpenAlert,
  onExpandAlert,
  showExpand = false,
  pagination,
  onChange,
  noItemsMessage = 'No alerts match your filters.',
}) {
  const columns = useMemo(() => {
    const expandCol = showExpand
      ? {
          field: 'id',
          name: '',
          width: '40px',
          align: 'center',
          render: (_id, alert) => (
            <EuiButtonIcon
              iconType="expand"
              size="s"
              aria-label={`Open flyout for ${alert?.name || 'alert'}`}
              title="Open in flyout"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (alert) onExpandAlert?.(alert);
              }}
            />
          ),
        }
      : null;

    const triggeredCol = {
      field: 'triggeredAt',
      name: 'Triggered',
      width: compact ? '88px' : '100px',
      truncateText: false,
      render: (triggeredAt) => {
        const [time, date] = String(triggeredAt || '').split(/\s+/);
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
    };

    const severityCol = {
      field: 'severity',
      name: 'Severity',
      width: compact ? '84px' : '90px',
      render: (value) => (
        <EuiBadge
          color={getAlertSeverityBadgeColor(value)}
          fill={value === 'critical' || value === 'high'}
        >
          {value}
        </EuiBadge>
      ),
    };

    const statusCol = {
      field: 'status',
      name: 'Status',
      width: compact ? '96px' : '110px',
      render: (value) => (
        <EuiBadge color={ALERT_STATUS_COLOR[value] || 'default'}>
          {value}
        </EuiBadge>
      ),
    };

    const alertCol = {
      field: 'reason',
      name: compact ? 'Alert' : 'Reason',
      truncateText: true,
      render: (reason, alert) => (
        <div style={{ minWidth: 0, maxWidth: '100%' }}>
          <EuiText size="xs" style={{ margin: 0 }}>
            <EuiLink
              onClick={(e) => {
                e.preventDefault();
                if (alert?.id) onOpenAlert?.(alert.id);
              }}
              style={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={reason}
            >
              {reason}
            </EuiLink>
          </EuiText>
          {compact && (
            <EuiText size="xs" color="subdued">
              <div
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={`${alert?.source || ''} · ${alert?.rule || ''}`}
              >
                {alert?.source}
                {alert?.rule ? ` · ${alert.rule}` : ''}
              </div>
            </EuiText>
          )}
          {alert?.guideStepsCompleted > 0 && (
            <>
              <EuiSpacer size="xs" />
              <InvestigationProgressBadge
                completed={alert.guideStepsCompleted}
                total={INVESTIGATION_GUIDE_STEP_TOTAL}
              />
            </>
          )}
        </div>
      ),
    };

    if (compact) {
      return [expandCol, triggeredCol, severityCol, statusCol, alertCol].filter(
        Boolean
      );
    }

    return [
      expandCol,
      triggeredCol,
      severityCol,
      statusCol,
      {
        field: 'source',
        name: 'Source',
        width: '110px',
        truncateText: true,
        render: (value) => <CellText>{value}</CellText>,
      },
      {
        field: 'rule',
        name: 'Rule',
        width: '160px',
        truncateText: true,
        render: (value) => <CellText>{value}</CellText>,
      },
      alertCol,
      {
        field: 'duration',
        name: 'Duration',
        width: '70px',
        render: (duration) => <CellText>{duration}</CellText>,
      },
    ].filter(Boolean);
  }, [compact, onOpenAlert, onExpandAlert, showExpand]);

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <div style={{ minWidth: compact ? 440 : 860 }}>
        <EuiBasicTable
          items={items}
          columns={columns}
          tableLayout="fixed"
          pagination={pagination}
          onChange={onChange}
          noItemsMessage={noItemsMessage}
        />
      </div>
    </div>
  );
}

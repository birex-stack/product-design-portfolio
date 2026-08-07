import React from 'react';
import {
  EuiBadge,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { getAlertContext } from '../alerts_data';
import { getAlertSeverityBadgeColor } from '../severity';
import { AlertDetailView } from './AlertDetailPage';

const STATUS_COLOR = {
  active: 'danger',
  acknowledged: 'warning',
  recovered: 'success',
};

export function AlertDetailFlyout({
  slo,
  alert,
  onClose,
  onOpenAlert,
  session = 'never',
  hasChildBackground = false,
  /** Child flyouts in a session cannot share size "m" with the parent. */
  size = session === 'inherit' ? 's' : 'm',
}) {
  if (!alert) return null;

  const context = slo || getAlertContext(alert);

  const handleOpenAlert = (id) => {
    if (onOpenAlert) {
      onOpenAlert(id);
      return;
    }
    window.location.hash = `#/alerts/${id}`;
  };

  return (
    <EuiFlyout
      ownFocus
      onClose={onClose}
      size={size}
      session={session}
      hasChildBackground={hasChildBackground}
      flyoutMenuProps={{ title: alert.name || alert.reason }}
      aria-label={alert.name || alert.reason}
    >
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="s">
          <h2>{alert.name || 'Alert details'}</h2>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiFlexGroup gutterSize="s" responsive={false} wrap>
          <EuiFlexItem grow={false}>
            <EuiBadge
              color={getAlertSeverityBadgeColor(alert.severity)}
              fill={alert.severity === 'critical' || alert.severity === 'high'}
            >
              {alert.severity}
            </EuiBadge>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiBadge color={STATUS_COLOR[alert.status] || 'default'}>
              {alert.status}
            </EuiBadge>
          </EuiFlexItem>
          {alert.source && (
            <EuiFlexItem grow={false}>
              <EuiBadge>{alert.source}</EuiBadge>
            </EuiFlexItem>
          )}
        </EuiFlexGroup>
        <EuiSpacer size="s" />
        <EuiText size="s" color="subdued">
          <p>{alert.reason || context?.name}</p>
        </EuiText>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <AlertDetailView
          alert={alert}
          onOpenAlert={handleOpenAlert}
          compact
          showTitle={false}
        />
      </EuiFlyoutBody>
    </EuiFlyout>
  );
}

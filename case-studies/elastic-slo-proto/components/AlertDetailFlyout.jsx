import React, { useEffect, useState } from 'react';
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
import {
  getAlertContext,
  INVESTIGATION_GUIDE_STEP_TOTAL,
} from '../alerts_data';
import { getAlertSeverityBadgeColor } from '../severity';
import { AlertDetailView } from './AlertDetailPage';
import { FlyoutHeaderActions } from './FlyoutHeaderActions';
import { FlyoutListNavFooter } from './FlyoutListNavFooter';
import { InvestigationProgressBadge } from './InvestigationProgressBadge';

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
  /** Ordered list for footer prev/next when opened from inventory. */
  items,
  onSelectItem,
}) {
  const [guideCompleted, setGuideCompleted] = useState(
    () => alert?.guideStepsCompleted || 0
  );

  useEffect(() => {
    setGuideCompleted(alert?.guideStepsCompleted || 0);
  }, [alert?.id, alert?.guideStepsCompleted]);

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
      hideCloseButton
      flyoutMenuProps={{ title: alert.name || alert.reason }}
      aria-label={alert.name || alert.reason}
    >
      <EuiFlyoutHeader hasBorder>
        <EuiFlexGroup
          justifyContent="spaceBetween"
          alignItems="flexStart"
          gutterSize="s"
          responsive={false}
        >
          <EuiFlexItem>
            <EuiTitle size="s">
              <h2>{alert.name || 'Alert details'}</h2>
            </EuiTitle>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <FlyoutHeaderActions onClose={onClose} />
          </EuiFlexItem>
        </EuiFlexGroup>
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
          {guideCompleted > 0 && (
            <EuiFlexItem grow={false}>
              <InvestigationProgressBadge
                completed={guideCompleted}
                total={INVESTIGATION_GUIDE_STEP_TOTAL}
              />
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
          showActions={false}
          onGuideProgressChange={setGuideCompleted}
        />
      </EuiFlyoutBody>
      {items?.length > 1 && onSelectItem && (
        <FlyoutListNavFooter
          items={items}
          currentId={alert.id}
          onSelect={onSelectItem}
        />
      )}
    </EuiFlyout>
  );
}

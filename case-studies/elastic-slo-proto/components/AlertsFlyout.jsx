import React, { useState } from 'react';
import {
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { getAlertById } from '../alerts_data';
import { AlertDetailFlyout } from './AlertDetailFlyout';
import { SloAlertsPanel } from './SloAlertsPanel';

export function AlertsFlyout({ slo, onClose }) {
  const [selectedAlert, setSelectedAlert] = useState(null);

  if (!slo) return null;

  return (
    <EuiFlyout
      ownFocus
      onClose={onClose}
      size="m"
      session="start"
      flyoutMenuProps={{ title: 'Alerts' }}
      aria-labelledby="alerts-flyout-title"
    >
      <EuiFlyoutHeader hasBorder>
        <EuiTitle size="m">
          <h2 id="alerts-flyout-title">Alerts</h2>
        </EuiTitle>
        <EuiSpacer size="s" />
        <EuiText size="s" color="subdued">
          <p>{slo.name}</p>
        </EuiText>
      </EuiFlyoutHeader>
      <EuiFlyoutBody>
        <SloAlertsPanel
          slo={slo}
          panelled={false}
          compact
          onSelectAlert={setSelectedAlert}
        />
      </EuiFlyoutBody>

      {/* Direct child of session flyout — required by EUI expandable flyout */}
      {selectedAlert && (
        <AlertDetailFlyout
          slo={slo}
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onOpenAlert={(id) => {
            const next = getAlertById(id);
            if (next) setSelectedAlert(next);
          }}
          session="inherit"
          size="s"
          hasChildBackground
        />
      )}
    </EuiFlyout>
  );
}

import React, { useMemo, useState } from 'react';
import { EuiLink, EuiPanel, EuiSpacer, EuiText } from '@elastic/eui';
import { getAlertById } from '../alerts_data';
import { getAlertsForSlo } from '../data';
import { AlertDetailFlyout } from './AlertDetailFlyout';
import { AlertsInventoryTable } from './AlertsInventoryTable';

export function SloAlertsPanel({
  slo,
  showViewInAlertsLink = true,
  panelled = true,
  compact = false,
  /** When true, parent owns the detail flyout (for EUI session nesting). */
  onSelectAlert,
}) {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const alerts = useMemo(() => (slo ? getAlertsForSlo(slo) : []), [slo]);

  const openAlert = (alertOrId) => {
    const alert =
      typeof alertOrId === 'string'
        ? alerts.find((a) => a.id === alertOrId) || getAlertById(alertOrId)
        : alertOrId;
    if (!alert) return;
    if (onSelectAlert) onSelectAlert(alert);
    else setSelectedAlert(alert);
  };

  if (!slo) return null;

  const list = (
    <>
      <EuiText size="s">
        <p>
          <strong>{alerts.length}</strong> active alert
          {alerts.length === 1 ? '' : 's'} associated with this SLO.
          {showViewInAlertsLink && (
            <>
              {' '}
              <EuiLink href="#" onClick={(e) => e.preventDefault()}>
                View in Alerts
              </EuiLink>
            </>
          )}
        </p>
      </EuiText>
      <EuiSpacer size="m" />
      <AlertsInventoryTable
        items={alerts}
        compact={compact}
        onOpenAlert={(id) => openAlert(id)}
        noItemsMessage="No alerts for this SLO."
      />
    </>
  );

  return (
    <>
      {panelled ? (
        <EuiPanel hasBorder paddingSize="m">
          {list}
        </EuiPanel>
      ) : (
        list
      )}
      {!onSelectAlert && (
        <AlertDetailFlyout
          slo={slo}
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onOpenAlert={(id) => {
            const next = getAlertById(id);
            if (next) setSelectedAlert(next);
          }}
          session="never"
          items={alerts}
          onSelectItem={setSelectedAlert}
        />
      )}
    </>
  );
}

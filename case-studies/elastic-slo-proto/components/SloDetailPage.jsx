import React, { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiNotificationBadge,
  EuiPageHeader,
  EuiSpacer,
  EuiTab,
  EuiTabs,
} from '@elastic/eui';
import { getEventsForBar } from '../data';
import { useShortChartLoading } from '../use_short_chart_loading';
import {
  BudgetRemainingPanel,
  BurnRatePanel,
  GoodBadPanel,
  SliPanel,
} from './DetailCharts';
import { AiAssistantFlyout } from './AiAssistantFlyout';
import { DetailActionsButton } from './DetailActionsButton';
import { EventsFlyout } from './EventsFlyout';
import { SloAlertsPanel } from './SloAlertsPanel';
import { SloDefinitionTab } from './SloDefinitionTab';
import { SloLogsTab } from './SloLogsTab';

export function SloDetailPage({ slo, onBack, assistantOpen, onAssistantOpenChange }) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [burnWindow, setBurnWindow] = useState('24h');
  const [selectedEvents, setSelectedEvents] = useState(null);
  const [localAssistantOpen, setLocalAssistantOpen] = useState(false);
  const isAssistantOpen =
    assistantOpen != null ? assistantOpen : localAssistantOpen;
  const setAssistantOpen = (open) => {
    if (onAssistantOpenChange) onAssistantOpenChange(open);
    else setLocalAssistantOpen(open);
  };
  const sliLoading = useShortChartLoading(0, slo.id, 1000, 1000);
  const burnLoading = useShortChartLoading(1, slo.id, 1000, 1000);
  const budgetLoading = useShortChartLoading(2, slo.id, 1000, 1000);
  const goodBadLoading = useShortChartLoading(3, slo.id, 1000, 1000);

  const events = useMemo(
    () =>
      selectedEvents
        ? getEventsForBar(slo, selectedEvents.bar, selectedEvents.kind)
        : [],
    [slo, selectedEvents]
  );

  const statusMeta = {
    healthy: { label: 'Healthy', color: 'success' },
    warning: { label: 'Warning', color: 'warning' },
    violated: { label: 'Violated', color: 'danger' },
  }[slo.status] || { label: 'Healthy', color: 'success' };

  return (
    <>
      <EuiButtonEmpty
        iconType="arrowLeft"
        flush="left"
        color="text"
        onClick={onBack}
        style={{ marginBottom: 4 }}
      >
        SLOs
      </EuiButtonEmpty>

      <EuiPageHeader
        pageTitle={slo.name}
        description={slo.description}
        rightSideItems={[
          <DetailActionsButton key="actions" iconOnly={isAssistantOpen} />,
        ]}
      />

      <EuiSpacer size="s" />

      <EuiFlexGroup gutterSize="s" wrap responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiBadge color={statusMeta.color} fill>
            {slo.sli.toFixed(2)}% / {slo.target.toFixed(2)}% {statusMeta.label}
          </EuiBadge>
        </EuiFlexItem>
        {slo.tags.map((tag) => (
          <EuiFlexItem grow={false} key={tag}>
            <EuiBadge>{tag}</EuiBadge>
          </EuiFlexItem>
        ))}
        <EuiFlexItem grow={false}>
          <EuiBadge>{slo.window}</EuiBadge>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      <EuiTabs>
        <EuiTab
          isSelected={selectedTab === 'overview'}
          onClick={() => setSelectedTab('overview')}
        >
          Overview
        </EuiTab>
        <EuiTab
          isSelected={selectedTab === 'alerts'}
          onClick={() => setSelectedTab('alerts')}
          append={
            slo.alerts > 0 ? (
              <EuiNotificationBadge>{slo.alerts}</EuiNotificationBadge>
            ) : undefined
          }
        >
          Alerts
        </EuiTab>
        <EuiTab
          isSelected={selectedTab === 'logs'}
          onClick={() => setSelectedTab('logs')}
        >
          Logs
        </EuiTab>
        <EuiTab
          isSelected={selectedTab === 'definition'}
          onClick={() => setSelectedTab('definition')}
        >
          Definition / API call
        </EuiTab>
      </EuiTabs>

      <EuiSpacer size="m" />

      {selectedTab === 'overview' && (
        <>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              width: '100%',
            }}
          >
            <SliPanel slo={slo} loading={sliLoading} />
            <BurnRatePanel
              slo={slo}
              burnWindow={burnWindow}
              onBurnWindowChange={setBurnWindow}
              loading={burnLoading}
            />
            <BudgetRemainingPanel slo={slo} loading={budgetLoading} />
            <GoodBadPanel
              bars={slo.goodBad}
              onBarClick={setSelectedEvents}
              loading={goodBadLoading}
            />
          </div>

          <EuiSpacer size="m" />
          <EuiButton iconType="plusInCircle" fullWidth onClick={() => {}}>
            Add a panel
          </EuiButton>
        </>
      )}

      {selectedTab === 'alerts' && (
        <SloAlertsPanel slo={slo} compact={isAssistantOpen} />
      )}

      {selectedTab === 'logs' && <SloLogsTab slo={slo} />}

      {selectedTab === 'definition' && <SloDefinitionTab slo={slo} />}

      {selectedEvents && (
        <EventsFlyout
          sloName={slo.name}
          bar={selectedEvents.bar}
          kind={selectedEvents.kind}
          events={events}
          onClose={() => setSelectedEvents(null)}
        />
      )}

      <AiAssistantFlyout
        isOpen={isAssistantOpen}
        onClose={() => setAssistantOpen(false)}
        contextType="slo"
        slo={slo}
      />
    </>
  );
}

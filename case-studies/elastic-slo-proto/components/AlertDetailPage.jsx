import React, { useEffect, useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiBasicTable,
  EuiButton,
  EuiButtonEmpty,
  EuiCodeBlock,
  EuiDescriptionList,
  EuiFlexGroup,
  EuiFlexItem,
  EuiNotificationBadge,
  EuiPanel,
  EuiSpacer,
  EuiSteps,
  EuiTab,
  EuiTabs,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import {
  getAlertContext,
  getInvestigationGuide,
  getLogsForAlert,
  getRelatedAlerts,
} from '../alerts_data';
import { getAlertSeverityBadgeColor } from '../severity';
import { useToasts } from '../toast_context';
import { AiAssistantFlyout } from './AiAssistantFlyout';
import { AlertActivityChart } from './AlertActivityChart';
import {
  ALERT_STATUS_COLOR,
  AlertsInventoryTable,
} from './AlertsInventoryTable';
import { DetailActionsButton } from './DetailActionsButton';

const STATUS_COLOR = ALERT_STATUS_COLOR;

const LOG_LEVEL_COLOR = {
  error: 'danger',
  warn: 'warning',
  info: 'primary',
  debug: 'default',
};

function CellText({ children }) {
  return (
    <EuiText size="xs">
      <span>{children}</span>
    </EuiText>
  );
}

function AlertBadges({ alert }) {
  return (
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
  );
}

export function AlertDetailBody({ alert, context, compact = false }) {
  if (!alert) return null;

  // Flyout header already shows severity/status badges — skip duplicates there.
  const listItems = [
    !compact
      ? {
          title: 'Severity',
          description: (
            <EuiBadge
              color={getAlertSeverityBadgeColor(alert.severity)}
              fill={alert.severity === 'critical' || alert.severity === 'high'}
            >
              {alert.severity}
            </EuiBadge>
          ),
        }
      : null,
    !compact
      ? {
          title: 'Status',
          description: (
            <EuiBadge color={STATUS_COLOR[alert.status] || 'default'}>
              {alert.status}
            </EuiBadge>
          ),
        }
      : null,
    alert.source
      ? { title: 'Source', description: alert.source }
      : null,
    alert.rule ? { title: 'Rule', description: alert.rule } : null,
    {
      title: 'Triggered',
      description: alert.triggeredAt,
    },
    {
      title: 'Duration',
      description: alert.duration,
    },
    {
      title: 'Reason',
      description: alert.reason,
    },
  ].filter(Boolean);

  return (
    <>
      <AlertActivityChart alert={alert} slo={context} />
      <EuiSpacer size={compact ? 'm' : 'l'} />
      <EuiDescriptionList
        type={compact ? 'responsiveColumn' : 'column'}
        compressed
        listItems={listItems}
      />
    </>
  );
}

function RelatedAlertsTab({
  alert,
  onOpenAlert,
  compact = false,
  narrowLayout = false,
}) {
  const related = useMemo(() => getRelatedAlerts(alert), [alert]);
  const tableCompact = Boolean(compact || narrowLayout);

  return (
    <EuiPanel hasBorder paddingSize={compact ? 's' : 'm'}>
      {!compact && (
        <>
          <EuiText size="s" color="subdued">
            <p style={{ margin: 0 }}>
              Alerts sharing the same rule or source as this alert.
            </p>
          </EuiText>
          <EuiSpacer size="m" />
        </>
      )}
      <AlertsInventoryTable
        items={related}
        compact={tableCompact}
        onOpenAlert={onOpenAlert}
        noItemsMessage="No related alerts found."
      />
    </EuiPanel>
  );
}

function AlertLogsTab({ alert, compact = false }) {
  const logs = useMemo(() => getLogsForAlert(alert), [alert]);

  const columns = useMemo(() => {
    const all = [
      {
        field: 'timestamp',
        name: '@timestamp',
        width: compact ? '100px' : '110px',
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
        field: 'level',
        name: 'Log level',
        width: compact ? '72px' : '100px',
        render: (level) => (
          <EuiBadge
            color={LOG_LEVEL_COLOR[level] || 'default'}
            fill={level === 'error'}
          >
            {level}
          </EuiBadge>
        ),
      },
      {
        field: 'service',
        name: 'Service',
        width: '140px',
        render: (service) => <CellText>{service}</CellText>,
      },
      {
        field: 'host',
        name: 'Host',
        width: '180px',
        render: (host) => <CellText>{host}</CellText>,
      },
      {
        field: 'message',
        name: 'Message',
        render: (message) => <CellText>{message}</CellText>,
      },
    ];

    if (!compact) return all;
    return all.filter((col) =>
      ['timestamp', 'level', 'message'].includes(col.field)
    );
  }, [compact]);

  return (
    <EuiPanel hasBorder paddingSize={compact ? 's' : 'm'}>
      {!compact && (
        <>
          <EuiText size="xs" color="subdued">
            <p style={{ margin: 0 }}>
              Sample logs correlated with <strong>{alert.rule}</strong> around the
              alert trigger time.
            </p>
          </EuiText>
          <EuiSpacer size="m" />
        </>
      )}
      <EuiBasicTable
        items={logs}
        columns={columns}
        tableLayout="auto"
        noItemsMessage="No log documents for this alert."
      />
    </EuiPanel>
  );
}

function InvestigationGuideSection({ alert, compact = false }) {
  const { addToast } = useToasts();
  const guide = useMemo(() => getInvestigationGuide(alert), [alert]);
  if (!guide) return null;

  const openDashboard = (id) => {
    window.location.hash = `#/dashboards/${id}`;
  };

  const runQuery = () => {
    addToast({
      title: 'Query ran successfully',
      color: 'success',
      iconType: 'check',
      text: 'Investigation ES|QL query returned sample documents for this alert window.',
    });
  };

  return (
    <EuiPanel hasBorder paddingSize={compact ? 's' : 'm'}>
      <EuiTitle size="xs">
        <h3>{guide.title}</h3>
      </EuiTitle>
      <EuiSpacer size="s" />
      <EuiText size="s" color="subdued">
        <p>{guide.summary}</p>
      </EuiText>
      <EuiSpacer size="m" />
      <EuiSteps
        headingElement="h4"
        titleSize={compact ? 'xs' : 's'}
        steps={guide.steps.map((step) => ({
          title: step.title,
          children: (
            <>
              <EuiText size="s">
                <p>{step.body}</p>
              </EuiText>
              {step.dashboards?.length > 0 && (
                <>
                  <EuiSpacer size="s" />
                  <EuiFlexGroup
                    direction="column"
                    gutterSize="none"
                    alignItems="flexStart"
                  >
                    {step.dashboards.map((dashboard) => (
                      <EuiFlexItem grow={false} key={dashboard.id}>
                        <EuiButtonEmpty
                          iconType="dashboardApp"
                          iconSide="left"
                          flush="left"
                          size="s"
                          onClick={() => openDashboard(dashboard.id)}
                        >
                          {dashboard.title}
                        </EuiButtonEmpty>
                      </EuiFlexItem>
                    ))}
                  </EuiFlexGroup>
                </>
              )}
              {step.query && (
                <>
                  <EuiSpacer size="s" />
                  <EuiCodeBlock
                    language="sql"
                    fontSize="s"
                    paddingSize="m"
                    isCopyable
                    overflowHeight={compact ? 160 : 220}
                  >
                    {step.query}
                  </EuiCodeBlock>
                  <EuiSpacer size="s" />
                  <EuiButton
                    iconType="play"
                    size="s"
                    fill
                    onClick={runQuery}
                  >
                    Run query
                  </EuiButton>
                </>
              )}
            </>
          ),
          status: 'incomplete',
        }))}
      />
    </EuiPanel>
  );
}

/** Shared tabbed alert details — used by full page and flyout. */
export function AlertDetailView({
  alert,
  onOpenAlert,
  compact = false,
  narrowLayout = false,
  showTitle = true,
  titleSize = 'l',
  showActions = false,
  actionsIconOnly = false,
}) {
  const [selectedTab, setSelectedTab] = useState('overview');
  const context = getAlertContext(alert);
  const relatedCount = useMemo(
    () => (alert ? getRelatedAlerts(alert).length : 0),
    [alert]
  );

  useEffect(() => {
    setSelectedTab('overview');
  }, [alert?.id]);

  if (!alert) return null;

  return (
    <>
      {showTitle && (
        <>
          <EuiFlexGroup
            justifyContent="spaceBetween"
            alignItems="flexStart"
            gutterSize="m"
            responsive={false}
          >
            <EuiFlexItem>
              <EuiTitle size={titleSize}>
                {compact ? <h2>{alert.name}</h2> : <h1>{alert.name}</h1>}
              </EuiTitle>
            </EuiFlexItem>
            {showActions && (
              <EuiFlexItem grow={false}>
                <DetailActionsButton iconOnly={actionsIconOnly} />
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
          <EuiSpacer size="s" />
          <AlertBadges alert={alert} />
          <EuiSpacer size="s" />
          <EuiText size="s" color="subdued">
            <p>{alert.reason}</p>
          </EuiText>
          <EuiSpacer size="m" />
        </>
      )}

      <EuiTabs size={compact ? 's' : 'm'}>
        <EuiTab
          isSelected={selectedTab === 'overview'}
          onClick={() => setSelectedTab('overview')}
        >
          Overview
        </EuiTab>
        <EuiTab
          isSelected={selectedTab === 'related'}
          onClick={() => setSelectedTab('related')}
          append={
            relatedCount > 0 ? (
              <EuiNotificationBadge size="s">{relatedCount}</EuiNotificationBadge>
            ) : undefined
          }
        >
          Related alerts
        </EuiTab>
        <EuiTab
          isSelected={selectedTab === 'logs'}
          onClick={() => setSelectedTab('logs')}
        >
          Logs
        </EuiTab>
      </EuiTabs>

      <EuiSpacer size="m" />

      {selectedTab === 'overview' && (
        <>
          <EuiPanel hasBorder paddingSize={compact ? 's' : 'm'}>
            {!compact && (
              <>
                <EuiTitle size="xs">
                  <h3>Alert details</h3>
                </EuiTitle>
                <EuiSpacer size="m" />
              </>
            )}
            <AlertDetailBody alert={alert} context={context} compact={compact} />
          </EuiPanel>
          <EuiSpacer size="m" />
          <InvestigationGuideSection alert={alert} compact={compact} />
        </>
      )}

      {selectedTab === 'related' && (
        <RelatedAlertsTab
          alert={alert}
          onOpenAlert={onOpenAlert}
          compact={compact}
          narrowLayout={narrowLayout}
        />
      )}

      {selectedTab === 'logs' && (
        <AlertLogsTab alert={alert} compact={compact} />
      )}
    </>
  );
}

export function AlertDetailPage({
  alert,
  onBack,
  onOpenAlert,
  assistantOpen,
  onAssistantOpenChange,
}) {
  const [localAssistantOpen, setLocalAssistantOpen] = useState(false);
  const isAssistantOpen =
    assistantOpen != null ? assistantOpen : localAssistantOpen;
  const setAssistantOpen = (open) => {
    if (onAssistantOpenChange) onAssistantOpenChange(open);
    else setLocalAssistantOpen(open);
  };

  if (!alert) return null;

  return (
    <>
      <EuiButtonEmpty
        iconType="arrowLeft"
        flush="left"
        color="text"
        onClick={onBack}
        style={{ marginBottom: 4 }}
      >
        Alerts
      </EuiButtonEmpty>

      <AlertDetailView
        alert={alert}
        onOpenAlert={onOpenAlert}
        compact={false}
        narrowLayout={isAssistantOpen}
        showTitle
        titleSize="l"
        showActions
        actionsIconOnly={isAssistantOpen}
      />

      <AiAssistantFlyout
        isOpen={isAssistantOpen}
        onClose={() => setAssistantOpen(false)}
        contextType="alert"
        alert={alert}
      />
    </>
  );
}

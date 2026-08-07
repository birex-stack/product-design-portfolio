import React, { useMemo, useRef, useState } from 'react';
import {
  EuiAvatar,
  EuiButtonIcon,
  EuiCollapsibleNav,
  EuiCollapsibleNavGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHeader,
  EuiHeaderLink,
  EuiHeaderLinks,
  EuiHeaderLogo,
  EuiHeaderSectionItemButton,
  EuiIcon,
  EuiListGroup,
  EuiPageTemplate,
  EuiTitle,
  EuiToolTip,
  useEuiTheme,
  useGeneratedHtmlId,
} from '@elastic/eui';

function navItem(label, { active = false, onClick } = {}) {
  return {
    label,
    isActive: active,
    onClick: (e) => {
      e.preventDefault();
      onClick?.(e);
    },
  };
}

export function ObservabilityChrome({
  breadcrumbs,
  children,
  activeNav = 'slos',
  onNavigateHome,
  onNavigateAlerts,
  onNavigateDashboards,
  onOpenAssistant,
  assistantOpen = false,
}) {
  const { euiTheme } = useEuiTheme();
  const [navIsOpen, setNavIsOpen] = useState(true);
  const [navIsDocked, setNavIsDocked] = useState(true);
  const collapsibleNavId = useGeneratedHtmlId({ prefix: 'obsCollapsibleNav' });
  const menuButtonRef = useRef(null);
  // Stack fixed headers below the prototype banner (see PrototypeBanner.jsx).
  // Page offset must match the bottom of the second header exactly.
  const bannerTop = 'var(--prototype-banner-height, 0px)';
  const headerHeight = euiTheme.size.xxxl;
  const pageOffset = `calc(${bannerTop} + ${headerHeight} + ${headerHeight})`;
  const secondaryHeaderTop = `calc(${bannerTop} + ${headerHeight})`;

  const sideNav = useMemo(
    () => [
      {
        name: 'Observability',
        id: 'obs',
        iconType: 'logoObservability',
        items: [
          navItem('Overview'),
          navItem('SLOs', {
            active: activeNav === 'slos',
            onClick: onNavigateHome,
          }),
          navItem('Alerts', {
            active: activeNav === 'alerts',
            onClick: onNavigateAlerts,
          }),
          navItem('Cases'),
          navItem('Dashboards', {
            active: activeNav === 'dashboards',
            onClick: onNavigateDashboards,
          }),
        ],
      },
      {
        name: 'Logs',
        id: 'logs',
        items: [navItem('Stream'), navItem('Anomalies'), navItem('Categories')],
      },
      {
        name: 'Metrics',
        id: 'metrics',
        items: [navItem('Inventory'), navItem('Metrics Explorer')],
      },
      {
        name: 'APM',
        id: 'apm',
        items: [
          navItem('Services'),
          navItem('Traces'),
          navItem('Dependencies'),
          navItem('Service Map'),
        ],
      },
      {
        name: 'Uptime',
        id: 'uptime',
        items: [navItem('Monitors'), navItem('TLS Certificates')],
      },
      {
        name: 'User Experience',
        id: 'ux',
        items: [navItem('Dashboard')],
      },
    ],
    [activeNav, onNavigateHome, onNavigateAlerts, onNavigateDashboards]
  );

  const navIsVisible = navIsOpen || navIsDocked;

  const toggleNav = () => {
    // Docked nav stays visible unless we undock + close (collapse)
    if (navIsDocked) {
      setNavIsDocked(false);
      setNavIsOpen(false);
      return;
    }
    setNavIsOpen((open) => !open);
  };

  return (
    <>
      {/* Force header tops — EUI fixed headers also set inline `top`, and the
          emotion rule uses logical inset; !important keeps them under the banner. */}
      <style>{`
        /* Include prototype banner in the global headers offset so flyouts,
           overlay masks, and page padding all share the same top edge. */
        html {
          --euiFixedHeadersOffset: ${pageOffset} !important;
        }
        .obsChrome__header--primary[data-fixed-header] {
          top: ${bannerTop} !important;
          inset-block-start: ${bannerTop} !important;
        }
        .obsChrome__header--secondary[data-fixed-header] {
          top: ${secondaryHeaderTop} !important;
          inset-block-start: ${secondaryHeaderTop} !important;
        }
        /* Align Overview–Dashboards with CollapsibleNavGroup titles (Logs, …). */
        .obsChrome__navPrimary .euiListGroupItem__button {
          padding-inline-start: ${euiTheme.size.m};
          padding-inline-end: ${euiTheme.size.m};
        }
      `}</style>
      <EuiHeader
        theme="dark"
        position="fixed"
        className="obsChrome__header--primary"
        sections={[
          {
            items: [
              <EuiHeaderSectionItemButton
                key="toggle-nav"
                ref={menuButtonRef}
                aria-label={navIsVisible ? 'Close navigation' : 'Open navigation'}
                aria-controls={collapsibleNavId}
                aria-expanded={navIsVisible}
                onClick={toggleNav}
                // Prevent outside-click close from canceling the toggle (EUI pattern)
                onMouseUpCapture={(e) => e.nativeEvent.stopImmediatePropagation()}
                onTouchEnd={(e) => e.nativeEvent.stopImmediatePropagation()}
              >
                <EuiIcon type="menu" size="m" aria-hidden="true" />
              </EuiHeaderSectionItemButton>,
              <EuiHeaderLogo
                key="logo"
                iconType="logoElastic"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateHome?.();
                }}
              >
                Elastic
              </EuiHeaderLogo>,
            ],
          },
          {
            items: [
              <EuiHeaderSectionItemButton key="search" aria-label="Search Elastic">
                <EuiIcon type="search" />
              </EuiHeaderSectionItemButton>,
              <EuiHeaderSectionItemButton key="help" aria-label="Help">
                <EuiIcon type="help" />
              </EuiHeaderSectionItemButton>,
              <EuiHeaderSectionItemButton
                key="notifications"
                aria-label="Notifications"
                notification={3}
              >
                <EuiIcon type="bell" />
              </EuiHeaderSectionItemButton>,
              <EuiHeaderSectionItemButton key="account" aria-label="Account menu">
                <EuiAvatar size="s" name="Elastic User" />
              </EuiHeaderSectionItemButton>,
            ],
          },
        ]}
      />

      <EuiHeader
        position="fixed"
        className="obsChrome__header--secondary"
        sections={[
          {
            breadcrumbs,
            breadcrumbProps: {
              'aria-label': 'Breadcrumbs',
              truncate: false,
            },
          },
          {
            items: [
              <EuiHeaderLinks key="app-links">
                <EuiHeaderLink
                  iconType="productAgent"
                  isActive={assistantOpen}
                  onClick={(e) => {
                    e.preventDefault();
                    onOpenAssistant?.();
                  }}
                >
                  AI Assistant
                </EuiHeaderLink>
              </EuiHeaderLinks>,
            ],
          },
        ]}
      />

      <EuiCollapsibleNav
        id={collapsibleNavId}
        aria-label="Observability"
        isOpen={navIsOpen}
        isDocked={navIsDocked}
        size={240}
        onClose={() => setNavIsOpen(false)}
        focusTrapProps={{ shards: [menuButtonRef] }}
      >
        {sideNav.map((group) => {
          const listItems = group.items.map((item) => ({
            label: item.label,
            isActive: item.isActive,
            onClick: item.onClick,
          }));

          if (group.id === 'obs') {
            const navInset = euiTheme.size.m;
            return (
              <div key={group.id} className="obsChrome__navPrimary">
                <EuiFlexGroup
                  gutterSize="s"
                  alignItems="center"
                  responsive={false}
                  style={{
                    padding: `${euiTheme.size.m} ${navInset} ${euiTheme.size.xs}`,
                  }}
                >
                  <EuiFlexItem grow={false}>
                    <EuiIcon type={group.iconType} size="m" />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiTitle size="xxs">
                      <h2 style={{ margin: 0 }}>{group.name}</h2>
                    </EuiTitle>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiToolTip
                      content={
                        navIsDocked ? 'Undock navigation' : 'Dock navigation'
                      }
                    >
                      <EuiButtonIcon
                        iconType={navIsDocked ? 'pinFill' : 'pin'}
                        aria-label={
                          navIsDocked ? 'Undock navigation' : 'Dock navigation'
                        }
                        aria-pressed={navIsDocked}
                        color={navIsDocked ? 'primary' : 'text'}
                        onClick={() => {
                          setNavIsDocked((docked) => !docked);
                          setNavIsOpen(true);
                        }}
                      />
                    </EuiToolTip>
                  </EuiFlexItem>
                </EuiFlexGroup>
                <EuiListGroup
                  maxWidth="none"
                  color="text"
                  gutterSize="none"
                  size="s"
                  listItems={listItems}
                />
              </div>
            );
          }

          return (
            <EuiCollapsibleNavGroup
              key={group.id}
              title={group.name}
              isCollapsible
              initialIsOpen={false}
              paddingSize="none"
            >
              <EuiListGroup
                maxWidth="none"
                color="text"
                gutterSize="none"
                size="s"
                listItems={listItems}
              />
            </EuiCollapsibleNavGroup>
          );
        })}

      </EuiCollapsibleNav>

      <EuiPageTemplate
        panelled={false}
        grow
        paddingSize="m"
        restrictWidth={false}
        offset={pageOffset}
      >
        <EuiPageTemplate.Section paddingSize="m" grow>
          {children}
        </EuiPageTemplate.Section>
      </EuiPageTemplate>
    </>
  );
}

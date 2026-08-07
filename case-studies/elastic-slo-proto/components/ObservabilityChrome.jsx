import React, { useMemo, useRef, useState } from 'react';
import {
  EuiAvatar,
  EuiCollapsibleNav,
  EuiCollapsibleNavGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHeader,
  EuiHeaderLink,
  EuiHeaderLinks,
  EuiHeaderLogo,
  EuiHeaderSectionItemButton,
  EuiHorizontalRule,
  EuiIcon,
  EuiListGroup,
  EuiPageTemplate,
  EuiShowFor,
  EuiSwitch,
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
            return (
              <EuiCollapsibleNavGroup
                key={group.id}
                title={group.name}
                iconType={group.iconType}
                isCollapsible={false}
                background="none"
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

        <EuiHorizontalRule margin="s" />

        <EuiShowFor sizes={['l', 'xl']}>
          <EuiFlexGroup
            gutterSize="s"
            alignItems="center"
            justifyContent="spaceAround"
            style={{ padding: '0 12px 12px' }}
          >
            <EuiFlexItem grow={false}>
              <EuiSwitch
                label="Dock navigation"
                checked={navIsDocked}
                onChange={(e) => {
                  setNavIsDocked(e.target.checked);
                  setNavIsOpen(true);
                }}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiShowFor>
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

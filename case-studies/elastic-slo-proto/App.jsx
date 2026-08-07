import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getAlertById } from './alerts_data';
import { AssistantBridgeProvider } from './assistant_bridge';
import { getDashboardById } from './dashboards_data';
import { AlertDetailPage } from './components/AlertDetailPage';
import { AlertsListPage } from './components/AlertsListPage';
import { DashboardDetailPage } from './components/DashboardDetailPage';
import { DashboardsListPage } from './components/DashboardsListPage';
import { ObservabilityChrome } from './components/ObservabilityChrome';
import { PrototypeBanner } from './components/PrototypeBanner';
import { SloDetailPage } from './components/SloDetailPage';
import { SloListPage } from './components/SloListPage';
import { getSloById } from './data';

function parseRoute() {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash.startsWith('slo/')) {
    return { name: 'sloDetail', id: hash.slice(4) };
  }
  if (hash.startsWith('alerts/')) {
    return { name: 'alertDetail', id: hash.slice('alerts/'.length) };
  }
  if (hash.startsWith('dashboards/')) {
    return { name: 'dashboardDetail', id: hash.slice('dashboards/'.length) };
  }
  if (hash === 'alerts') {
    return { name: 'alerts' };
  }
  if (hash === 'dashboards') {
    return { name: 'dashboards' };
  }
  return { name: 'list' };
}

function shouldOpenAssistant(routeName) {
  return (
    routeName === 'alerts' ||
    routeName === 'sloDetail' ||
    routeName === 'alertDetail' ||
    routeName === 'dashboardDetail'
  );
}

export default function App() {
  const [route, setRoute] = useState(parseRoute);
  const [assistantOpen, setAssistantOpen] = useState(() =>
    shouldOpenAssistant(parseRoute().name)
  );

  useEffect(() => {
    const onHashChange = () => {
      const next = parseRoute();
      setRoute(next);
      setAssistantOpen(shouldOpenAssistant(next.name));
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigateHome = useCallback(() => {
    window.location.hash = '#/';
  }, []);

  const navigateAlerts = useCallback(() => {
    window.location.hash = '#/alerts';
  }, []);

  const navigateDashboards = useCallback(() => {
    window.location.hash = '#/dashboards';
  }, []);

  const openSlo = useCallback((id) => {
    window.location.hash = `#/slo/${id}`;
  }, []);

  const openAlert = useCallback((id) => {
    window.location.hash = `#/alerts/${id}`;
  }, []);

  const openDashboard = useCallback((id) => {
    window.location.hash = `#/dashboards/${id}`;
  }, []);

  const slo = route.name === 'sloDetail' ? getSloById(route.id) : null;
  const alert =
    route.name === 'alertDetail' ? getAlertById(route.id) : null;
  const dashboard =
    route.name === 'dashboardDetail' ? getDashboardById(route.id) : null;

  const activeNav =
    route.name === 'alerts' || route.name === 'alertDetail'
      ? 'alerts'
      : route.name === 'dashboards' || route.name === 'dashboardDetail'
        ? 'dashboards'
        : 'slos';

  const breadcrumbs = useMemo(() => {
    if (route.name === 'dashboardDetail' && dashboard) {
      return [
        { text: 'Observability', onClick: (e) => e.preventDefault() },
        {
          text: 'Dashboards',
          onClick: (e) => {
            e.preventDefault();
            navigateDashboards();
          },
        },
        { text: dashboard.title },
      ];
    }
    if (route.name === 'dashboards') {
      return [
        { text: 'Observability', onClick: (e) => e.preventDefault() },
        { text: 'Dashboards' },
      ];
    }
    if (route.name === 'alertDetail' && alert) {
      return [
        { text: 'Observability', onClick: (e) => e.preventDefault() },
        {
          text: 'Alerts',
          onClick: (e) => {
            e.preventDefault();
            navigateAlerts();
          },
        },
        { text: 'Alert details' },
      ];
    }
    if (route.name === 'alerts') {
      return [
        { text: 'Observability', onClick: (e) => e.preventDefault() },
        { text: 'Alerts' },
      ];
    }
    if (route.name === 'sloDetail' && slo) {
      return [
        { text: 'Observability', onClick: (e) => e.preventDefault() },
        {
          text: 'SLOs',
          onClick: (e) => {
            e.preventDefault();
            navigateHome();
          },
        },
        { text: 'SLO details' },
      ];
    }
    return [
      { text: 'Observability', onClick: (e) => e.preventDefault() },
      { text: 'SLOs' },
    ];
  }, [
    route.name,
    slo,
    alert,
    dashboard,
    navigateHome,
    navigateAlerts,
    navigateDashboards,
  ]);

  const canOpenAssistant =
    route.name === 'alerts' ||
    (route.name === 'sloDetail' && slo) ||
    (route.name === 'alertDetail' && alert) ||
    (route.name === 'dashboardDetail' && dashboard);

  let page = <SloListPage onOpenSlo={openSlo} />;
  if (route.name === 'dashboardDetail' && dashboard) {
    page = (
      <DashboardDetailPage
        dashboard={dashboard}
        onBack={navigateDashboards}
        assistantOpen={assistantOpen}
        onAssistantOpenChange={setAssistantOpen}
      />
    );
  } else if (route.name === 'dashboardDetail' && !dashboard) {
    page = <DashboardsListPage onOpenDashboard={openDashboard} />;
  } else if (route.name === 'dashboards') {
    page = <DashboardsListPage onOpenDashboard={openDashboard} />;
  } else if (route.name === 'alerts') {
    page = (
      <AlertsListPage
        onOpenAlert={openAlert}
        assistantOpen={assistantOpen}
        onAssistantOpenChange={setAssistantOpen}
      />
    );
  } else if (route.name === 'alertDetail' && alert) {
    page = (
      <AlertDetailPage
        alert={alert}
        onBack={navigateAlerts}
        onOpenAlert={openAlert}
        assistantOpen={assistantOpen}
        onAssistantOpenChange={setAssistantOpen}
      />
    );
  } else if (route.name === 'sloDetail' && slo) {
    page = (
      <SloDetailPage
        slo={slo}
        onBack={navigateHome}
        assistantOpen={assistantOpen}
        onAssistantOpenChange={setAssistantOpen}
      />
    );
  } else if (route.name === 'alertDetail' && !alert) {
    page = (
      <AlertsListPage
        onOpenAlert={openAlert}
        assistantOpen={assistantOpen}
        onAssistantOpenChange={setAssistantOpen}
      />
    );
  }

  return (
    <AssistantBridgeProvider onRequestOpen={() => setAssistantOpen(true)}>
      <PrototypeBanner />
      <ObservabilityChrome
        breadcrumbs={breadcrumbs}
        activeNav={activeNav}
        onNavigateHome={navigateHome}
        onNavigateAlerts={navigateAlerts}
        onNavigateDashboards={navigateDashboards}
        assistantOpen={assistantOpen}
        onOpenAssistant={
          canOpenAssistant
            ? () => setAssistantOpen((open) => !open)
            : undefined
        }
      >
        {page}
      </ObservabilityChrome>
    </AssistantBridgeProvider>
  );
}

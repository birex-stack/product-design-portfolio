import React, { useMemo, useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiButtonGroup,
  EuiButtonIcon,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiFieldSearch,
  EuiFlexGrid,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPageHeader,
  EuiPanel,
  EuiPopover,
  EuiSelect,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
import { SLOS } from '../data';
import { useShortChartLoading } from '../use_short_chart_loading';
import { AlertsFlyout } from './AlertsFlyout';
import { ChartLoadingState } from './ChartLoadingState';
import { SloCard } from './SloCard';
import { SloTable } from './SloTable';

const VIEW_OPTIONS = [
  { id: 'grid', label: 'Grid', iconType: 'grid' },
  // List mode temporarily hidden
  { id: 'table', label: 'Table', iconType: 'table' },
];

const SORT_OPTIONS = [
  { value: 'name', text: 'Name' },
  { value: 'status', text: 'Status' },
  { value: 'sli', text: 'SLI' },
];

function SloCardSlot({ slo, index, onOpen, onAlertsClick }) {
  const loading = useShortChartLoading(index, 'slo-list', 50);

  if (loading) {
    return (
      <EuiPanel hasBorder paddingSize="none" style={{ height: 180, borderRadius: 6 }}>
        <ChartLoadingState height={180} size="l" />
      </EuiPanel>
    );
  }

  return (
    <SloCard slo={slo} onOpen={onOpen} onAlertsClick={() => onAlertsClick(slo)} />
  );
}

export function SloListPage({ onOpenSlo }) {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [view, setView] = useState('grid');
  const [sort, setSort] = useState('name');
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [alertsSlo, setAlertsSlo] = useState(null);

  const sortLabel =
    SORT_OPTIONS.find((option) => option.value === sort)?.text || 'Name';

  const filtered = useMemo(() => {
    let items = [...SLOS];
    if (status !== 'all') {
      items = items.filter((slo) => slo.status === status);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(
        (slo) =>
          slo.name.toLowerCase().includes(q) ||
          slo.tags.some((tag) => tag.includes(q))
      );
    }
    if (sort === 'status') {
      items.sort((a, b) => a.status.localeCompare(b.status) || b.sli - a.sli);
    } else if (sort === 'sli') {
      items.sort((a, b) => a.sli - b.sli);
    } else {
      items.sort((a, b) => a.name.localeCompare(b.name));
    }
    return items;
  }, [query, status, sort]);

  return (
    <>
      <EuiPageHeader
        pageTitle="SLOs"
        description="Monitor service reliability commitments and error budgets across Observability."
        rightSideItems={[
          <EuiButton key="create" fill iconType="plusInCircle" onClick={() => {}}>
            Create SLO
          </EuiButton>,
          <EuiButtonEmpty
            key="docs"
            iconType="documentation"
            onClick={() => {}}
          >
            SLO documentation
          </EuiButtonEmpty>,
        ]}
      />

      <EuiSpacer size="m" />

      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
        <EuiFlexItem grow>
          <EuiFieldSearch
            fullWidth
            placeholder="Filter your SLOs using KQL syntax"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            isClearable
            aria-label="Filter SLOs"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false} style={{ minWidth: 140 }}>
          <EuiSelect
            fullWidth
            options={[
              { value: 'all', text: 'Status: All' },
              { value: 'healthy', text: 'Status: Healthy' },
              { value: 'warning', text: 'Status: Warning' },
              { value: 'violated', text: 'Status: Violated' },
            ]}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Status filter"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false} style={{ minWidth: 140 }}>
          <EuiSelect
            fullWidth
            options={[{ value: 'all', text: 'Tags: All' }]}
            value="all"
            onChange={() => {}}
            aria-label="Tags filter"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            iconType="refresh"
            display="base"
            size="m"
            aria-label="Refresh"
            onClick={() => {}}
          />
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      <EuiFlexGroup justifyContent="spaceBetween" alignItems="center" wrap>
        <EuiFlexItem grow={false}>
          <EuiText size="s" color="subdued">
            <p style={{ margin: 0 }}>
              Showing 1–{filtered.length} of {filtered.length} SLOs
            </p>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiFlexGroup
                gutterSize="xs"
                alignItems="center"
                responsive={false}
              >
                <EuiFlexItem grow={false}>
                  <EuiText size="s" color="subdued">
                    <span>Sort by</span>
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiPopover
                    button={
                      <EuiButtonEmpty
                        size="s"
                        iconType="arrowDown"
                        iconSide="right"
                        flush="both"
                        onClick={() => setIsSortOpen((open) => !open)}
                      >
                        {sortLabel}
                      </EuiButtonEmpty>
                    }
                    isOpen={isSortOpen}
                    closePopover={() => setIsSortOpen(false)}
                    panelPaddingSize="none"
                    anchorPosition="downRight"
                  >
                    <EuiContextMenuPanel
                      items={SORT_OPTIONS.map((option) => (
                        <EuiContextMenuItem
                          key={option.value}
                          icon={option.value === sort ? 'check' : 'empty'}
                          onClick={() => {
                            setSort(option.value);
                            setIsSortOpen(false);
                          }}
                        >
                          {option.text}
                        </EuiContextMenuItem>
                      ))}
                    />
                  </EuiPopover>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonGroup
                legend="SLO view mode"
                options={VIEW_OPTIONS}
                idSelected={view}
                onChange={(id) => setView(id)}
                buttonSize="compressed"
                isIconOnly
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      {view === 'table' ? (
        <SloTable
          items={filtered}
          onOpen={onOpenSlo}
          onAlertsClick={setAlertsSlo}
        />
      ) : (
        <EuiFlexGrid
          columns={4}
          gutterSize="l"
          responsive={false}
          style={{ width: '100%' }}
        >
          {filtered.map((slo, index) => (
            <EuiFlexItem key={slo.id} style={{ minWidth: 0 }}>
              <SloCardSlot
                slo={slo}
                index={index}
                onOpen={onOpenSlo}
                onAlertsClick={setAlertsSlo}
              />
            </EuiFlexItem>
          ))}
        </EuiFlexGrid>
      )}

      {alertsSlo && (
        <AlertsFlyout slo={alertsSlo} onClose={() => setAlertsSlo(null)} />
      )}
    </>
  );
}

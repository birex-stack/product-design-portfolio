import React, { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonGroup,
  EuiButtonIcon,
  EuiCheckbox,
  EuiFieldSearch,
  EuiFilterButton,
  EuiFilterGroup,
  EuiFilterSelectItem,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiPageHeader,
  EuiPanel,
  EuiPopover,
  EuiSelect,
  EuiSpacer,
  EuiStat,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import {
  CASES,
  CASE_CATEGORIES,
  CASE_SEVERITIES,
  CASE_STATUSES,
  formatCaseStatus,
  getCaseSeverityBadgeColor,
  getCaseStats,
} from '../cases_data';
import { useToasts } from '../toast_context';

function FilterPopover({ label, options, selected, onChange, numFilters }) {
  const [isOpen, setIsOpen] = useState(false);
  const activeCount =
    selected === 'all' ? 0 : 1;

  return (
    <EuiPopover
      button={
        <EuiFilterButton
          iconType="arrowDown"
          onClick={() => setIsOpen((v) => !v)}
          isSelected={isOpen}
          hasActiveFilters={activeCount > 0}
          numActiveFilters={activeCount || undefined}
          numFilters={numFilters}
        >
          {label}
        </EuiFilterButton>
      }
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      panelPaddingSize="none"
    >
      <div style={{ minWidth: 180, maxHeight: 240, overflow: 'auto' }}>
        <EuiFilterSelectItem
          checked={selected === 'all' ? 'on' : undefined}
          onClick={() => {
            onChange('all');
            setIsOpen(false);
          }}
        >
          All
        </EuiFilterSelectItem>
        {options.map((option) => {
          const label =
            CASE_STATUSES.includes(option)
              ? formatCaseStatus(option)
              : CASE_SEVERITIES.includes(option)
                ? option.charAt(0).toUpperCase() + option.slice(1)
                : option;
          return (
            <EuiFilterSelectItem
              key={option}
              checked={selected === option ? 'on' : undefined}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
            >
              {label}
            </EuiFilterSelectItem>
          );
        })}
      </div>
    </EuiPopover>
  );
}

function FieldsPopover({ fields, onToggle }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <EuiPopover
      button={
        <EuiButtonEmpty
          size="s"
          iconType="list"
          iconSide="right"
          onClick={() => setIsOpen((v) => !v)}
        >
          Fields
        </EuiButtonEmpty>
      }
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      panelPaddingSize="s"
      anchorPosition="downRight"
    >
      <EuiText size="xs">
        <strong>Display fields</strong>
      </EuiText>
      <EuiSpacer size="s" />
      <div style={{ minWidth: 200 }}>
        {fields.map((field) => (
          <EuiCheckbox
            key={field.id}
            id={`case-field-${field.id}`}
            label={field.label}
            checked={field.visible}
            onChange={() => onToggle(field.id)}
            compressed
          />
        ))}
      </div>
    </EuiPopover>
  );
}

function CaseRow({ item, showCategory, onOpen, onAction }) {
  return (
    <EuiPanel
      hasBorder
      paddingSize="m"
      style={{ cursor: 'pointer' }}
      onClick={() => onOpen(item.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen(item.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Open case ${item.id}`}
    >
      <EuiFlexGroup
        gutterSize="m"
        alignItems="flexStart"
        justifyContent="spaceBetween"
        responsive={false}
      >
        <EuiFlexItem>
          <EuiTitle size="xs">
            <h3 style={{ margin: 0 }}>
              <span style={{ color: '#69707D', fontWeight: 500 }}>#{item.id}</span>{' '}
              {item.title}
            </h3>
          </EuiTitle>
          <EuiSpacer size="xs" />
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} wrap>
            <EuiFlexItem grow={false}>
              <EuiBadge color={getCaseSeverityBadgeColor(item.severity)} fill>
                {item.severity.charAt(0).toUpperCase() + item.severity.slice(1)}
              </EuiBadge>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiBadge color="hollow">{formatCaseStatus(item.status)}</EuiBadge>
            </EuiFlexItem>
            {item.alertCount > 0 && (
              <EuiFlexItem grow={false}>
                <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                  <EuiFlexItem grow={false}>
                    <EuiIcon type="warning" color="warning" size="s" />
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiText size="xs">
                      <span>{item.alertCount}</span>
                    </EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
          <EuiSpacer size="xs" />
          <EuiText size="xs" color="subdued">
            <p style={{ margin: 0 }}>
              Reported by: {item.reporter} · On: {item.reportedAt} · Last update:{' '}
              {item.lastUpdate}
            </p>
          </EuiText>
          {showCategory && (
            <>
              <EuiSpacer size="xs" />
              <EuiText size="xs" color="subdued">
                <p style={{ margin: 0 }}>Category: {item.category}</p>
              </EuiText>
            </>
          )}
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                <EuiFlexItem grow={false}>
                  <EuiIcon type="editorComment" size="s" color="subdued" />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiText size="xs" color="subdued">
                    <span>{item.commentCount}</span>
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                iconType="boxesVertical"
                aria-label={`Actions for case ${item.id}`}
                onClick={(e) => {
                  e.stopPropagation();
                  onAction(item);
                }}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
}

export function CasesListPage({ onOpenCase }) {
  const { addToast } = useToasts();
  const [query, setQuery] = useState('');
  const [severity, setSeverity] = useState('all');
  const [status, setStatus] = useState('all');
  const [assignee, setAssignee] = useState('all');
  const [tag, setTag] = useState('all');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [view, setView] = useState('list');
  const [fields, setFields] = useState([
    { id: 'attachments', label: 'Number of attachments', visible: false },
    { id: 'category', label: 'Category', visible: true },
    { id: 'resolution', label: 'Resolution', visible: false },
    { id: 'reason', label: 'Reason', visible: false },
    { id: 'timeInProgress', label: 'Time in progress', visible: false },
  ]);

  const assignees = useMemo(() => {
    const names = new Set();
    CASES.forEach((c) => c.assignees.forEach((a) => names.add(a.name)));
    return [...names];
  }, []);

  const tags = useMemo(() => {
    const set = new Set();
    CASES.forEach((c) => c.tags.forEach((t) => set.add(t)));
    return [...set].sort();
  }, []);

  const filtered = useMemo(() => {
    let items = [...CASES];
    if (severity !== 'all') {
      items = items.filter((c) => c.severity === severity);
    }
    if (status !== 'all') {
      items = items.filter((c) => c.status === status);
    }
    if (assignee !== 'all') {
      items = items.filter((c) =>
        c.assignees.some((a) => a.name === assignee)
      );
    }
    if (tag !== 'all') {
      items = items.filter((c) => c.tags.includes(tag));
    }
    if (category !== 'all') {
      items = items.filter((c) => c.category === category);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.id.includes(q) ||
          c.reporter.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (sort === 'oldest') {
      items.sort((a, b) => b.lastUpdateMinutes - a.lastUpdateMinutes);
    } else if (sort === 'severity') {
      const order = { critical: 0, high: 1, medium: 2, low: 3 };
      items.sort(
        (a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9)
      );
    } else {
      items.sort((a, b) => a.lastUpdateMinutes - b.lastUpdateMinutes);
    }
    return items;
  }, [query, severity, status, assignee, tag, category, sort]);

  const stats = useMemo(() => getCaseStats(CASES), []);
  const showCategory = fields.find((f) => f.id === 'category')?.visible;

  return (
    <>
      <EuiPageHeader
        pageTitle="Cases"
        rightSideItems={[
          <EuiButtonEmpty key="settings" iconType="gear" size="s">
            Settings
          </EuiButtonEmpty>,
          <EuiButton key="create" fill iconType="plusInCircle" size="s">
            Create case
          </EuiButton>,
        ]}
      />

      <EuiSpacer size="m" />

      <EuiFlexGroup gutterSize="s" alignItems="center" wrap responsive={false}>
        <EuiFlexItem grow>
          <EuiFieldSearch
            fullWidth
            placeholder="Search cases"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            isClearable
            aria-label="Search cases"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFilterGroup>
            <FilterPopover
              label="Severity"
              options={CASE_SEVERITIES}
              selected={severity}
              onChange={setSeverity}
              numFilters={CASE_SEVERITIES.length}
            />
            <FilterPopover
              label="Status"
              options={CASE_STATUSES}
              selected={status}
              onChange={setStatus}
              numFilters={CASE_STATUSES.length}
            />
            <FilterPopover
              label="Assignees"
              options={assignees}
              selected={assignee}
              onChange={setAssignee}
              numFilters={assignees.length}
            />
            <FilterPopover
              label="Tags"
              options={tags}
              selected={tag}
              onChange={setTag}
              numFilters={tags.length}
            />
            <FilterPopover
              label="Categories"
              options={CASE_CATEGORIES}
              selected={category}
              onChange={setCategory}
              numFilters={CASE_CATEGORIES.length}
            />
          </EuiFilterGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false} style={{ minWidth: 140 }}>
          <EuiSelect
            compressed
            options={[
              { value: 'newest', text: 'Newest first' },
              { value: 'oldest', text: 'Oldest first' },
              { value: 'severity', text: 'Severity' },
            ]}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort cases"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <FieldsPopover
            fields={fields}
            onToggle={(id) =>
              setFields((prev) =>
                prev.map((f) =>
                  f.id === id ? { ...f, visible: !f.visible } : f
                )
              )
            }
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonGroup
            legend="Cases view"
            options={[
              { id: 'list', label: 'List', iconType: 'list' },
              { id: 'grid', label: 'Grid', iconType: 'grid' },
            ]}
            idSelected={view}
            onChange={(id) => setView(id)}
            buttonSize="compressed"
            isIconOnly
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty size="s" iconType="calendar">
            Last 30 days
          </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon iconType="refresh" aria-label="Refresh cases" />
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="l" />

      <EuiFlexGroup gutterSize="xl" wrap>
        <EuiFlexItem grow={false}>
          <EuiStat title={stats.open} description="Open cases" titleSize="m" />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiStat
            title={stats.inProgress}
            description="In progress cases"
            titleSize="m"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiStat
            title={stats.closed.toLocaleString()}
            description="Closed cases"
            titleSize="m"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiStat
            title={stats.avgTimeToClose}
            description="Avg. time to close"
            titleSize="m"
          />
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="l" />

      <EuiText size="s" color="subdued">
        <p style={{ margin: 0 }}>
          Showing {filtered.length} of {CASES.length} cases
        </p>
      </EuiText>
      <EuiSpacer size="s" />

      <div
        style={{
          display: 'flex',
          flexDirection: view === 'grid' ? 'row' : 'column',
          flexWrap: view === 'grid' ? 'wrap' : 'nowrap',
          gap: 12,
        }}
      >
        {filtered.map((item) => (
          <div
            key={item.id}
            style={view === 'grid' ? { width: 'calc(50% - 6px)' } : undefined}
          >
            <CaseRow
              item={item}
              showCategory={showCategory}
              onOpen={onOpenCase}
              onAction={(caseItem) =>
                addToast({
                  title: 'Case actions',
                  color: 'primary',
                  iconType: 'boxesVertical',
                  text: `Actions for #${caseItem.id} (prototype).`,
                })
              }
            />
          </div>
        ))}
      </div>
    </>
  );
}

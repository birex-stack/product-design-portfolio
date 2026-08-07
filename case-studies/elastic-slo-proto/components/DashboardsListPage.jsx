import React, { useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiBasicTable,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFieldSearch,
  EuiFilterButton,
  EuiFilterGroup,
  EuiFilterSelectItem,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiPageHeader,
  EuiPopover,
  EuiSelect,
  EuiSpacer,
  EuiTab,
  EuiTabs,
  EuiText,
} from '@elastic/eui';
import {
  DASHBOARD_CREATORS,
  DASHBOARD_TAGS,
  DASHBOARDS,
} from '../dashboards_data';
import { DashboardActionsMenu } from './DashboardActionsMenu';

const SORT_OPTIONS = [
  { value: 'recent', text: 'Recently viewed' },
  { value: 'updated', text: 'Last updated' },
  { value: 'name', text: 'Name' },
];

function highlightMatch(text, query) {
  if (!query.trim()) return text;
  const q = query.trim();
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark style={{ background: 'rgba(255, 192, 0, 0.35)', padding: 0 }}>
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

function TagFilter({ selected, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <EuiPopover
      button={
        <EuiFilterButton
          iconType="arrowDown"
          onClick={() => setIsOpen((v) => !v)}
          isSelected={isOpen}
          hasActiveFilters={selected.length > 0}
          numActiveFilters={selected.length}
        >
          Tags
        </EuiFilterButton>
      }
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      panelPaddingSize="none"
    >
      <div style={{ maxHeight: 260, overflowY: 'auto', minWidth: 180 }}>
        {DASHBOARD_TAGS.map((tag) => (
          <EuiFilterSelectItem
            key={tag}
            checked={selected.includes(tag) ? 'on' : undefined}
            onClick={() => {
              onChange(
                selected.includes(tag)
                  ? selected.filter((t) => t !== tag)
                  : [...selected, tag]
              );
            }}
          >
            {tag}
          </EuiFilterSelectItem>
        ))}
      </div>
    </EuiPopover>
  );
}

function CreatorFilter({ selected, onChange }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <EuiPopover
      button={
        <EuiFilterButton
          iconType="arrowDown"
          onClick={() => setIsOpen((v) => !v)}
          isSelected={isOpen}
          hasActiveFilters={selected.length > 0}
          numActiveFilters={selected.length}
        >
          Created by
        </EuiFilterButton>
      }
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      panelPaddingSize="none"
    >
      <div style={{ maxHeight: 260, overflowY: 'auto', minWidth: 180 }}>
        {DASHBOARD_CREATORS.map((creator) => (
          <EuiFilterSelectItem
            key={creator}
            checked={selected.includes(creator) ? 'on' : undefined}
            onClick={() => {
              onChange(
                selected.includes(creator)
                  ? selected.filter((c) => c !== creator)
                  : [...selected, creator]
              );
            }}
          >
            {creator}
          </EuiFilterSelectItem>
        ))}
      </div>
    </EuiPopover>
  );
}

export function DashboardsListPage({ onOpenDashboard }) {
  const [tab, setTab] = useState('recent');
  const [query, setQuery] = useState('');
  const [tags, setTags] = useState([]);
  const [creators, setCreators] = useState([]);
  const [sort, setSort] = useState('recent');
  const [starredIds, setStarredIds] = useState(() =>
    new Set(DASHBOARDS.filter((d) => d.starred).map((d) => d.id))
  );
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const filtered = useMemo(() => {
    let items = DASHBOARDS.map((d) => ({
      ...d,
      starred: starredIds.has(d.id),
    }));

    if (tab === 'starred') {
      items = items.filter((d) => d.starred);
    }

    if (tags.length) {
      items = items.filter((d) => tags.every((tag) => d.tags.includes(tag)));
    }

    if (creators.length) {
      items = items.filter((d) => creators.includes(d.creator));
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.description.toLowerCase().includes(q) ||
          d.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    if (sort === 'name') {
      items.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'updated') {
      items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    } else {
      items.sort((a, b) => b.lastViewedAt.localeCompare(a.lastViewedAt));
    }

    return items;
  }, [tab, query, tags, creators, sort, starredIds]);

  const pageItems = useMemo(() => {
    const start = pageIndex * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageIndex, pageSize]);

  const toggleStar = (id) => {
    setStarredIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const columns = useMemo(
    () => [
      {
        field: 'starred',
        name: '',
        width: '40px',
        align: 'center',
        render: (starred, row) => (
          <EuiButtonIcon
            iconType={starred ? 'starFilled' : 'starEmpty'}
            color={starred ? 'warning' : 'text'}
            aria-label={
              starred
                ? `Unstar ${row.title}`
                : `Star ${row.title}`
            }
            title={starred ? 'Remove from starred' : 'Add to starred'}
            onClick={() => toggleStar(row.id)}
          />
        ),
      },
      {
        field: 'title',
        name: 'Name',
        render: (title, row) => (
          <div>
            <EuiLink
              onClick={(e) => {
                e.preventDefault();
                onOpenDashboard?.(row.id);
              }}
            >
              {highlightMatch(title, query)}
            </EuiLink>
            {row.description && (
              <EuiText size="xs" color="subdued">
                <p style={{ margin: '2px 0 0' }}>
                  {highlightMatch(row.description, query)}
                </p>
              </EuiText>
            )}
            {row.tags?.length > 0 && (
              <EuiFlexGroup
                gutterSize="xs"
                wrap
                responsive={false}
                style={{ marginTop: 4 }}
              >
                {row.tags.map((tag) => (
                  <EuiFlexItem grow={false} key={tag}>
                    <EuiBadge color="hollow">
                      {highlightMatch(tag, query)}
                    </EuiBadge>
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>
            )}
          </div>
        ),
      },
      {
        field: 'creator',
        name: 'Created by',
        width: '140px',
        render: (creator, row) => (
          <EuiText size="s">
            <span>
              {creator}
              {row.managed ? ' · managed' : ''}
            </span>
          </EuiText>
        ),
      },
      {
        field: 'updatedAt',
        name: 'Last updated',
        width: '160px',
        render: (updatedAt) => (
          <EuiText size="s">
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {updatedAt}
            </span>
          </EuiText>
        ),
      },
      {
        field: 'id',
        name: 'Actions',
        width: '88px',
        align: 'right',
        render: (_id, row) => (
          <DashboardActionsMenu
            dashboard={row}
            size="s"
            display="empty"
            color="text"
            onOpen={(dashboard) => onOpenDashboard?.(dashboard.id)}
          />
        ),
      },
    ],
    [query, onOpenDashboard]
  );

  const starredCount = starredIds.size;

  return (
    <>
      <EuiPageHeader
        pageTitle="Dashboards"
        description="Browse, search, and organize dashboards. Filter by tag or creator, star favorites, and sort by recent activity."
        rightSideItems={[
          <EuiButton key="create" fill iconType="plusInCircle" onClick={() => {}}>
            Create dashboard
          </EuiButton>,
          <EuiButtonEmpty key="import" iconType="importAction" onClick={() => {}}>
            Import
          </EuiButtonEmpty>,
        ]}
      />

      <EuiSpacer size="m" />

      <EuiTabs>
        <EuiTab
          isSelected={tab === 'recent'}
          onClick={() => {
            setTab('recent');
            setPageIndex(0);
          }}
        >
          Recently viewed
        </EuiTab>
        <EuiTab
          isSelected={tab === 'starred'}
          onClick={() => {
            setTab('starred');
            setPageIndex(0);
          }}
        >
          {`Starred${starredCount ? ` (${starredCount})` : ''}`}
        </EuiTab>
      </EuiTabs>

      <EuiSpacer size="m" />

      <EuiFlexGroup gutterSize="m" alignItems="center" wrap>
        <EuiFlexItem>
          <EuiFieldSearch
            placeholder="Search by name, description, or tag"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPageIndex(0);
            }}
            isClearable
            fullWidth
            aria-label="Search dashboards"
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFilterGroup>
            <TagFilter
              selected={tags}
              onChange={(next) => {
                setTags(next);
                setPageIndex(0);
              }}
            />
            <CreatorFilter
              selected={creators}
              onChange={(next) => {
                setCreators(next);
                setPageIndex(0);
              }}
            />
          </EuiFilterGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false} style={{ minWidth: 180 }}>
          <EuiSelect
            options={SORT_OPTIONS}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort dashboards"
            prepend="Sort by"
          />
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      <EuiText size="s" color="subdued">
        <p style={{ margin: 0 }}>
          {filtered.length} dashboard{filtered.length === 1 ? '' : 's'}
        </p>
      </EuiText>

      <EuiSpacer size="s" />

      <EuiBasicTable
        items={pageItems}
        columns={columns}
        tableLayout="auto"
        noItemsMessage={
          tab === 'starred'
            ? 'You haven’t starred any dashboards. Click the star icon next to a dashboard to add it here.'
            : 'No dashboards matched your search or filters.'
        }
        pagination={{
          pageIndex,
          pageSize,
          totalItemCount: filtered.length,
          pageSizeOptions: [10, 20, 50],
        }}
        onChange={({ page }) => {
          if (!page) return;
          setPageIndex(page.index);
          setPageSize(page.size);
        }}
      />
    </>
  );
}

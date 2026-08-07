import React, { useMemo, useState } from 'react';
import {
  EuiAccordion,
  EuiAvatar,
  EuiBadge,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiCheckboxGroup,
  EuiComboBox,
  EuiComment,
  EuiCommentList,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiIcon,
  EuiPanel,
  EuiSelect,
  EuiSpacer,
  EuiTab,
  EuiTabs,
  EuiText,
  EuiTextArea,
  EuiTitle,
} from '@elastic/eui';
import {
  formatCaseStatus,
  getCaseSeverityBadgeColor,
} from '../cases_data';
import { useToasts } from '../toast_context';

function ActivityRow({ activity }) {
  if (activity.kind === 'more') {
    return (
      <EuiPanel hasBorder paddingSize="s" color="subdued">
        <EuiFlexGroup
          gutterSize="s"
          alignItems="center"
          justifyContent="spaceBetween"
          responsive={false}
        >
          <EuiFlexItem>
            <EuiText size="s" color="subdued">
              <p style={{ margin: 0 }}>{activity.text}</p>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonIcon
              iconType="boxesVertical"
              aria-label="Activity actions"
              size="xs"
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    );
  }

  if (activity.kind === 'system' || activity.collapsed) {
    return (
      <EuiPanel hasBorder paddingSize="s">
        <EuiFlexGroup
          gutterSize="s"
          alignItems="center"
          justifyContent="spaceBetween"
          responsive={false}
        >
          <EuiFlexItem>
            <EuiText size="s">
              <p style={{ margin: 0 }}>
                <strong>{activity.author}</strong> {activity.text}{' '}
                <span style={{ color: '#69707D' }}>{activity.when}</span>
              </p>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonIcon
              iconType="boxesVertical"
              aria-label="Activity actions"
              size="xs"
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    );
  }

  return (
    <EuiCommentList>
      <EuiComment
        username={activity.author}
        timelineAvatar={
          <EuiAvatar
            size="m"
            name={activity.author}
            initials={activity.initials}
          />
        }
        event={<EuiBadge color="hollow">commented</EuiBadge>}
        timestamp={activity.when}
        actions={
          <EuiButtonIcon
            iconType="boxesVertical"
            aria-label="Comment actions"
            size="xs"
          />
        }
      >
        <EuiText size="s">
          {String(activity.body || '')
            .split('\n')
            .map((line, i) => (
              <p key={`${activity.id}-${i}`}>{line}</p>
            ))}
        </EuiText>
      </EuiComment>
    </EuiCommentList>
  );
}

function AttributesSidebar({ caseItem, draft, setDraft }) {
  const envMap = useMemo(() => {
    const ids = {
      production: 'Production',
      dev: 'Dev',
      testing: 'Testing',
    };
    const selected = {};
    Object.entries(ids).forEach(([id, label]) => {
      selected[id] = (draft.environment || []).includes(label);
    });
    return { ids, selected };
  }, [draft.environment]);

  return (
    <div>
      <EuiTitle size="xs">
        <h3>Attributes</h3>
      </EuiTitle>
      <EuiSpacer size="m" />

      <EuiFormRow label="Assigned" fullWidth>
        <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false} wrap>
          {caseItem.assignees.map((person) => (
            <EuiFlexItem grow={false} key={person.name}>
              <EuiAvatar size="s" name={person.name} initials={person.initials} />
            </EuiFlexItem>
          ))}
          <EuiFlexItem grow={false}>
            <EuiButtonIcon
              iconType="plusInCircle"
              aria-label="Add assignee"
              display="base"
              size="s"
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiFormRow>

      <EuiFormRow label="Status" fullWidth>
        <EuiSelect
          fullWidth
          options={[
            { value: 'open', text: 'Open' },
            { value: 'in progress', text: 'In progress' },
            { value: 'closed', text: 'Closed' },
          ]}
          value={draft.status}
          onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}
        />
      </EuiFormRow>

      <EuiFormRow label="Severity" fullWidth>
        <EuiSelect
          fullWidth
          options={[
            { value: 'critical', text: 'Critical' },
            { value: 'high', text: 'High' },
            { value: 'medium', text: 'Medium' },
            { value: 'low', text: 'Low' },
          ]}
          value={draft.severity}
          onChange={(e) =>
            setDraft((d) => ({ ...d, severity: e.target.value }))
          }
        />
      </EuiFormRow>

      <EuiFormRow label="Tags" fullWidth>
        <EuiComboBox
          fullWidth
          selectedOptions={(draft.tags || []).map((t) => ({
            label: t,
          }))}
          onChange={(options) =>
            setDraft((d) => ({
              ...d,
              tags: options.map((o) => o.label),
            }))
          }
          onCreateOption={(searchValue) =>
            setDraft((d) => ({
              ...d,
              tags: [...(d.tags || []), searchValue],
            }))
          }
          delimiter=","
        />
      </EuiFormRow>

      <EuiSpacer size="m" />

      <EuiAccordion
        id="case-template-fields"
        buttonContent={`${caseItem.template || 'InfoSec'} template fields`}
        initialIsOpen
        paddingSize="s"
      >
        <EuiFormRow label="Category" fullWidth>
          <EuiSelect
            fullWidth
            options={[
              { value: '', text: 'Select' },
              { value: 'Incident', text: 'Incident' },
              { value: 'Inquiry', text: 'Inquiry' },
              { value: 'Post-mortem', text: 'Post-mortem' },
              { value: 'Threat hunt', text: 'Threat hunt' },
              { value: 'False positive', text: 'False positive' },
            ]}
            value={draft.category}
            onChange={(e) =>
              setDraft((d) => ({ ...d, category: e.target.value }))
            }
          />
        </EuiFormRow>
        <EuiFormRow
          label="Classification"
          helpText="Required on closure"
          fullWidth
        >
          <EuiSelect
            fullWidth
            options={[
              { value: '', text: 'Select' },
              { value: 'True positive', text: 'True positive' },
              { value: 'False positive', text: 'False positive' },
              { value: 'Benign', text: 'Benign' },
            ]}
            value={draft.classification}
            onChange={(e) =>
              setDraft((d) => ({ ...d, classification: e.target.value }))
            }
          />
        </EuiFormRow>
        <EuiFormRow label="Environment" fullWidth>
          <EuiCheckboxGroup
            options={[
              { id: 'production', label: 'Production' },
              { id: 'dev', label: 'Dev' },
              { id: 'testing', label: 'Testing' },
            ]}
            idToSelectedMap={envMap.selected}
            onChange={(id) => {
              const label = envMap.ids[id];
              setDraft((d) => {
                const has = (d.environment || []).includes(label);
                return {
                  ...d,
                  environment: has
                    ? d.environment.filter((x) => x !== label)
                    : [...(d.environment || []), label],
                };
              });
            }}
          />
        </EuiFormRow>
      </EuiAccordion>
    </div>
  );
}

export function CaseDetailPage({ caseItem, onBack, onOpenCase }) {
  const { addToast } = useToasts();
  const [tab, setTab] = useState('activities');
  const [activityQuery, setActivityQuery] = useState('');
  const [comment, setComment] = useState('');
  const [draft, setDraft] = useState({
    status: caseItem.status,
    severity: caseItem.severity,
    tags: caseItem.tags,
    category: caseItem.category,
    classification: caseItem.classification || '',
    environment: caseItem.environment || ['Production'],
  });

  const activities = useMemo(() => {
    if (!activityQuery.trim()) return caseItem.activities;
    const q = activityQuery.toLowerCase();
    return caseItem.activities.filter(
      (a) =>
        (a.text || '').toLowerCase().includes(q) ||
        (a.body || '').toLowerCase().includes(q) ||
        (a.author || '').toLowerCase().includes(q)
    );
  }, [caseItem.activities, activityQuery]);

  return (
    <>
      <EuiButtonEmpty
        iconType="arrowLeft"
        flush="left"
        color="text"
        onClick={onBack}
        style={{ marginBottom: 4 }}
      >
        Cases
      </EuiButtonEmpty>

      <EuiFlexGroup
        justifyContent="spaceBetween"
        alignItems="flexStart"
        gutterSize="m"
        wrap
      >
        <EuiFlexItem>
          <EuiFlexGroup gutterSize="s" alignItems="center" wrap responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiTitle size="l">
                <h1 style={{ margin: 0 }}>{caseItem.title}</h1>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiBadge
                color={getCaseSeverityBadgeColor(draft.severity)}
                fill
              >
                {draft.severity.charAt(0).toUpperCase() + draft.severity.slice(1)}
              </EuiBadge>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiBadge color="hollow">
                {formatCaseStatus(draft.status)}
              </EuiBadge>
            </EuiFlexItem>
            {caseItem.alertCount > 0 && (
              <EuiFlexItem grow={false}>
                <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                  <EuiFlexItem grow={false}>
                    <EuiIcon type="warning" color="warning" />
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiText size="s">
                      <strong>{caseItem.alertCount}</strong>
                    </EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
          <EuiSpacer size="xs" />
          <EuiText size="s" color="subdued">
            <p style={{ margin: 0 }}>
              ID: {caseItem.id} · Reported by: {caseItem.reporter} · On:{' '}
              {caseItem.reportedAt}
            </p>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="s" responsive={false} wrap>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty iconType="refresh" size="s">
                Refresh
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty iconType="gear" size="s">
                Settings
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton
                fill
                size="s"
                iconType="productAgent"
                iconSide="left"
                onClick={() =>
                  addToast({
                    title: 'Add to chat',
                    color: 'primary',
                    iconType: 'productAgent',
                    text: `Case #${caseItem.id} would be added to AI chat (prototype).`,
                  })
                }
              >
                Add to chat
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>

      <EuiSpacer size="m" />

      <EuiTabs>
        <EuiTab
          isSelected={tab === 'activities'}
          onClick={() => setTab('activities')}
        >
          Activities
        </EuiTab>
        <EuiTab
          isSelected={tab === 'attachments'}
          onClick={() => setTab('attachments')}
        >
          Attachments{' '}
          <EuiBadge color="hollow">{caseItem.attachments.length}</EuiBadge>
        </EuiTab>
        <EuiTab
          isSelected={tab === 'similar'}
          onClick={() => setTab('similar')}
        >
          Similar cases{' '}
          <EuiBadge color="hollow">{caseItem.similarCases.length}</EuiBadge>
        </EuiTab>
      </EuiTabs>

      <EuiSpacer size="m" />

      <EuiFlexGroup gutterSize="l" alignItems="flexStart">
        <EuiFlexItem grow={7}>
          {tab === 'activities' && (
            <>
              <EuiFlexGroup gutterSize="s" alignItems="center" wrap>
                <EuiFlexItem grow>
                  <EuiFieldSearch
                    fullWidth
                    placeholder="Search activities..."
                    value={activityQuery}
                    onChange={(e) => setActivityQuery(e.target.value)}
                    isClearable
                  />
                </EuiFlexItem>
                <EuiFlexItem grow={false} style={{ minWidth: 120 }}>
                  <EuiSelect
                    compressed
                    options={[
                      { value: 'all', text: 'Type' },
                      { value: 'comment', text: 'Comments' },
                      { value: 'system', text: 'System' },
                    ]}
                    value="all"
                    onChange={() => {}}
                    aria-label="Activity type"
                  />
                </EuiFlexItem>
                <EuiFlexItem grow={false} style={{ minWidth: 120 }}>
                  <EuiSelect
                    compressed
                    options={[
                      { value: 'all', text: 'Author' },
                      ...[
                        ...new Set(
                          caseItem.activities
                            .map((a) => a.author)
                            .filter(Boolean)
                        ),
                      ].map((name) => ({ value: name, text: name })),
                    ]}
                    value="all"
                    onChange={() => {}}
                    aria-label="Activity author"
                  />
                </EuiFlexItem>
                <EuiFlexItem grow={false} style={{ minWidth: 140 }}>
                  <EuiSelect
                    compressed
                    options={[{ value: 'newest', text: 'Newest first' }]}
                    value="newest"
                    onChange={() => {}}
                    aria-label="Activity sort"
                  />
                </EuiFlexItem>
              </EuiFlexGroup>

              <EuiSpacer size="m" />

              <EuiPanel hasBorder paddingSize="m">
                <EuiText size="s">
                  <p style={{ margin: 0 }}>
                    <strong>Description:</strong> {caseItem.description}
                  </p>
                </EuiText>
              </EuiPanel>

              <EuiSpacer size="m" />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {activities.map((activity) => (
                  <ActivityRow key={activity.id} activity={activity} />
                ))}
              </div>

              <EuiSpacer size="l" />

              <EuiPanel hasBorder paddingSize="m">
                <EuiFlexGroup gutterSize="xs" responsive={false}>
                  {[
                    'editorBold',
                    'editorItalic',
                    'editorUnorderedList',
                    'editorOrderedList',
                    'editorLink',
                    'editorCodeBlock',
                  ].map((icon) => (
                    <EuiFlexItem grow={false} key={icon}>
                      <EuiButtonIcon
                        iconType={icon}
                        aria-label={icon}
                        size="s"
                      />
                    </EuiFlexItem>
                  ))}
                </EuiFlexGroup>
                <EuiSpacer size="s" />
                <EuiTextArea
                  fullWidth
                  rows={5}
                  placeholder="Add a comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  aria-label="Case comment"
                />
                <EuiSpacer size="s" />
                <EuiFlexGroup
                  justifyContent="flexEnd"
                  gutterSize="s"
                  responsive={false}
                >
                  <EuiFlexItem grow={false}>
                    <EuiButtonEmpty size="s" iconType="paperClip">
                      Attach
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButton
                      fill
                      size="s"
                      disabled={!comment.trim()}
                      onClick={() => {
                        addToast({
                          title: 'Comment added',
                          color: 'success',
                          iconType: 'check',
                          text: 'Your comment was added to the case (prototype).',
                        });
                        setComment('');
                      }}
                    >
                      Add comment
                    </EuiButton>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiPanel>
            </>
          )}

          {tab === 'attachments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {caseItem.attachments.map((att) => (
                <EuiPanel key={att.id} hasBorder paddingSize="s">
                  <EuiFlexGroup
                    gutterSize="s"
                    alignItems="center"
                    justifyContent="spaceBetween"
                    responsive={false}
                  >
                    <EuiFlexItem>
                      <EuiFlexGroup
                        gutterSize="s"
                        alignItems="center"
                        responsive={false}
                      >
                        <EuiFlexItem grow={false}>
                          <EuiIcon
                            type={att.type === 'alert' ? 'warning' : 'document'}
                          />
                        </EuiFlexItem>
                        <EuiFlexItem>
                          <EuiText size="s">
                            <p style={{ margin: 0 }}>
                              <strong>{att.name}</strong>
                            </p>
                          </EuiText>
                          <EuiText size="xs" color="subdued">
                            <p style={{ margin: 0 }}>
                              Added by {att.addedBy} · {att.when}
                            </p>
                          </EuiText>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiButtonIcon
                        iconType="boxesVertical"
                        aria-label="Attachment actions"
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiPanel>
              ))}
            </div>
          )}

          {tab === 'similar' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {caseItem.similarCases.map((similar) => (
                <EuiPanel
                  key={similar.id}
                  hasBorder
                  paddingSize="m"
                  style={{ cursor: 'pointer' }}
                  onClick={() => onOpenCase?.(similar.id)}
                >
                  <EuiFlexGroup
                    gutterSize="s"
                    alignItems="center"
                    justifyContent="spaceBetween"
                    wrap
                  >
                    <EuiFlexItem>
                      <EuiText size="s">
                        <p style={{ margin: 0 }}>
                          <strong>#{similar.id}</strong> {similar.title}
                        </p>
                      </EuiText>
                      <EuiSpacer size="xs" />
                      <EuiFlexGroup gutterSize="s" responsive={false}>
                        <EuiFlexItem grow={false}>
                          <EuiBadge
                            color={getCaseSeverityBadgeColor(similar.severity)}
                          >
                            {similar.severity}
                          </EuiBadge>
                        </EuiFlexItem>
                        <EuiFlexItem grow={false}>
                          <EuiBadge color="hollow">
                            {formatCaseStatus(similar.status)}
                          </EuiBadge>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiText size="xs" color="subdued">
                        <span>{similar.similarity} similar</span>
                      </EuiText>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiPanel>
              ))}
            </div>
          )}
        </EuiFlexItem>

        <EuiFlexItem grow={3} style={{ minWidth: 260 }}>
          <EuiPanel hasBorder paddingSize="m">
            <AttributesSidebar
              caseItem={caseItem}
              draft={draft}
              setDraft={setDraft}
            />
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
}

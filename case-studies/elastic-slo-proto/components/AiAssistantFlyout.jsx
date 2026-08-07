import React, { useEffect, useMemo, useState } from 'react';
import {
  EuiBadge,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiIcon,
  EuiLink,
  EuiLoadingSpinner,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
  EuiToolTip,
  useEuiTheme,
} from '@elastic/eui';
import { useAssistantBridge } from '../assistant_bridge';
import {
  getAssistantConversation,
  getDependencyAnalysisConversation,
} from '../assistant_context';
import { TimelineEventFlyout } from './TimelineEventFlyout';

const TIMELINE_TYPE_META = {
  alert: { icon: 'warning', label: 'Alert' },
  log: { icon: 'document', label: 'Log' },
  apm: { icon: 'visLine', label: 'APM' },
  metric: { icon: 'stats', label: 'Metric' },
  dependency: { icon: 'branch', label: 'Dependency' },
  deploy: { icon: 'package', label: 'Deploy' },
};

function formatInline(text) {
  const parts = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  let match;
  let key = 0;
  while ((match = re.exec(text)) != null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith('**')) {
      parts.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else {
      parts.push(<code key={key}>{token.slice(1, -1)}</code>);
    }
    key += 1;
    last = match.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

function renderMarkdownLite(text) {
  const lines = String(text || '').split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('### ')) {
      return (
        <EuiText key={i} size="s">
          <h4 style={{ margin: '12px 0 6px' }}>{line.slice(4)}</h4>
        </EuiText>
      );
    }
    if (!line.trim()) {
      return <div key={i} style={{ height: 8 }} />;
    }
    return (
      <EuiText key={i} size="s">
        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{formatInline(line)}</p>
      </EuiText>
    );
  });
}

function TimelineRail({ children }) {
  const { euiTheme } = useEuiTheme();
  return (
    <div style={{ position: 'relative', paddingLeft: 36 }}>
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 13,
          top: 8,
          bottom: 8,
          width: 2,
          background: euiTheme.colors.lightShade,
          borderRadius: 1,
        }}
      />
      {children}
    </div>
  );
}

function TimelineItem({ icon, children }) {
  return (
    <div style={{ position: 'relative', marginBottom: 16 }}>
      <div
        style={{
          position: 'absolute',
          left: -36,
          top: 0,
          width: 28,
          height: 28,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1,
        }}
      >
        {icon}
      </div>
      {children}
    </div>
  );
}

function UserBubble({ message }) {
  const { euiTheme } = useEuiTheme();
  return (
    <TimelineItem
      icon={
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: euiTheme.colors.primary,
            color: euiTheme.colors.emptyShade,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {message.index}
        </div>
      }
    >
      <EuiPanel
        paddingSize="m"
        hasBorder={false}
        color="subdued"
        style={{ position: 'relative' }}
      >
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <EuiFlexGroup gutterSize="xs" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon iconType="pencil" size="xs" aria-label="Edit" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon iconType="copy" size="xs" aria-label="Copy" />
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>
        <EuiText size="s">
          <p style={{ margin: 0, paddingRight: 48 }}>{message.text}</p>
        </EuiText>
      </EuiPanel>
    </TimelineItem>
  );
}

function DependencyTimeline({ message, selectedEventId, onEventClick }) {
  const { euiTheme } = useEuiTheme();

  return (
    <TimelineItem
      icon={
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: euiTheme.colors.emptyShade,
            border: `1px solid ${euiTheme.colors.lightShade}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <EuiIcon type="list" size="s" />
        </div>
      }
    >
      <EuiText size="xs">
        <strong>{message.title || 'Event timeline'}</strong>
      </EuiText>
      <EuiText size="xs" color="subdued">
        <p style={{ margin: '4px 0 0' }}>Click an event to open details.</p>
      </EuiText>
      <EuiSpacer size="s" />
      <div style={{ position: 'relative', paddingLeft: 28 }}>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            left: 11,
            top: 6,
            bottom: 6,
            width: 2,
            background: euiTheme.colors.lightShade,
            borderRadius: 1,
          }}
        />
        {(message.items || []).map((item) => {
          const meta = TIMELINE_TYPE_META[item.type] || TIMELINE_TYPE_META.log;
          const isSelected = selectedEventId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() =>
                onEventClick?.(isSelected ? null : item)
              }
              aria-pressed={isSelected}
              style={{
                position: 'relative',
                display: 'block',
                width: '100%',
                textAlign: 'left',
                marginBottom: 10,
                padding: '8px 10px 8px 4px',
                border: `1px solid ${
                  isSelected
                    ? euiTheme.colors.primary
                    : euiTheme.colors.lightShade
                }`,
                borderRadius: 6,
                background: isSelected
                  ? euiTheme.colors.lightestShade
                  : euiTheme.colors.emptyShade,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: -28,
                  top: 10,
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: euiTheme.colors.emptyShade,
                  border: `1px solid ${euiTheme.colors.lightShade}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                }}
                title={meta.label}
              >
                <EuiIcon type={meta.icon} size="s" />
              </div>
              <EuiText size="xs" color="subdued">
                <div style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {item.time}
                  {' · '}
                  {meta.label}
                </div>
              </EuiText>
              <EuiText size="s">
                <p style={{ margin: '2px 0 0' }}>
                  <strong>{item.title}</strong>
                </p>
              </EuiText>
              {item.detail && (
                <EuiText size="xs" color="subdued">
                  <p style={{ margin: '2px 0 0' }}>{item.detail}</p>
                </EuiText>
              )}
            </button>
          );
        })}
      </div>
    </TimelineItem>
  );
}

function EventsToggle({ message }) {
  const [open, setOpen] = useState(false);
  return (
    <TimelineItem
      icon={
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
          }}
        >
          <EuiIcon type="layers" size="s" color="subdued" />
        </div>
      }
    >
      <EuiButtonEmpty
        size="xs"
        iconType={open ? 'arrowUp' : 'arrowDown'}
        iconSide="right"
        flush="left"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'Hide' : 'Show'} {message.count} events
      </EuiButtonEmpty>
      {open && (
        <>
          <EuiSpacer size="xs" />
          <EuiText size="xs" color="subdued">
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {message.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </EuiText>
        </>
      )}
    </TimelineItem>
  );
}

function AssistantAvatar() {
  const { euiTheme } = useEuiTheme();
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: euiTheme.colors.emptyShade,
        border: `1px solid ${euiTheme.colors.lightShade}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <EuiIcon type="logoElastic" size="m" />
    </div>
  );
}

/** EUI AI Assistant chat “loading state” — spinner while the agent processes. */
function AssistantThinkingBubble({ label = 'Analyzing…' }) {
  return (
    <TimelineItem icon={<AssistantAvatar />}>
      <EuiFlexGroup
        gutterSize="s"
        alignItems="center"
        responsive={false}
        style={{ minHeight: 28 }}
      >
        <EuiFlexItem grow={false}>
          <EuiLoadingSpinner size="m" aria-label={label} />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiText size="xs" color="subdued">
            <span>{label}</span>
          </EuiText>
        </EuiFlexItem>
      </EuiFlexGroup>
    </TimelineItem>
  );
}

function thinkingLabelForMessage(message) {
  if (!message) return 'Thinking…';
  if (message.role === 'timeline') return 'Building event timeline…';
  if (message.role === 'assistant' && message.tools?.length) {
    return 'Calling tools…';
  }
  return 'Thinking…';
}

function AssistantBubble({ message, agentName }) {
  return (
    <TimelineItem icon={<AssistantAvatar />}>
      {message.tools?.map((tool) => (
        <EuiText key={tool.name} size="xs" color="subdued">
          <p style={{ margin: '0 0 6px' }}>
            <strong>{agentName}</strong> requested the function{' '}
            <code>{tool.name}</code>
            {tool.detail ? ` — ${tool.detail}` : ''}
          </p>
        </EuiText>
      ))}

      <EuiPanel
        paddingSize="m"
        hasBorder={false}
        color="subdued"
        style={{ position: 'relative' }}
      >
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <EuiFlexGroup gutterSize="xs" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon iconType="pencil" size="xs" aria-label="Edit" />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon iconType="copy" size="xs" aria-label="Copy" />
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>
        <div style={{ paddingRight: 40 }}>{renderMarkdownLite(message.text)}</div>

        <EuiSpacer size="m" />

        <EuiFlexGroup
          justifyContent="spaceBetween"
          alignItems="center"
          gutterSize="s"
          wrap
        >
          <EuiFlexItem grow={false}>
            <EuiText size="xs" color="subdued">
              <span>
                Was this helpful?{' '}
                <EuiLink onClick={(e) => e.preventDefault()}>Yes</EuiLink>
                {' · '}
                <EuiLink onClick={(e) => e.preventDefault()}>No</EuiLink>
              </span>
            </EuiText>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty size="xs" iconType="sparkles" flush="both">
              Regenerate
            </EuiButtonEmpty>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiPanel>
    </TimelineItem>
  );
}

export function AiAssistantFlyout({
  isOpen,
  onClose,
  contextType,
  slo,
  alert,
  dashboard,
  alerts,
}) {
  const { request, clearRequest } = useAssistantBridge();
  const conversation = useMemo(() => {
    if (request?.type === 'dependencies') {
      return getDependencyAnalysisConversation(request);
    }
    return getAssistantConversation({
      type: contextType,
      slo,
      alert,
      dashboard,
      alerts,
    });
  }, [request, contextType, slo, alert, dashboard, alerts]);
  const [draft, setDraft] = useState('');
  const [extraUserMessages, setExtraUserMessages] = useState([]);
  const [visibleCount, setVisibleCount] = useState(0);
  const [thinking, setThinking] = useState(false);
  const [thinkingLabel, setThinkingLabel] = useState('Thinking…');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const conversationKey = [
    request?.id,
    conversation.title,
    contextType,
    slo?.id,
    alert?.id,
    dashboard?.id,
  ].join('|');

  useEffect(() => {
    setExtraUserMessages([]);
    setDraft('');
    setSelectedEvent(null);
  }, [conversationKey]);

  // Progressive reveal so replies feel like a real AI chat (not instant dump).
  useEffect(() => {
    if (!isOpen) {
      setVisibleCount(0);
      setThinking(false);
      return undefined;
    }

    const msgs = conversation.messages;
    let cancelled = false;
    const timers = [];
    const wait = (ms) =>
      new Promise((resolve) => {
        timers.push(setTimeout(resolve, ms));
      });

    let start = 0;
    while (
      start < msgs.length &&
      (msgs[start].role === 'user' || msgs[start].role === 'events')
    ) {
      start += 1;
    }

    setVisibleCount(start);
    setThinking(start < msgs.length);
    setThinkingLabel(thinkingLabelForMessage(msgs[start]));

    const run = async () => {
      for (let i = start; i < msgs.length; i += 1) {
        const msg = msgs[i];
        const delay =
          msg.role === 'timeline' ? 1300 : msg.role === 'assistant' ? 950 : 650;
        setThinking(true);
        setThinkingLabel(thinkingLabelForMessage(msg));
        await wait(delay);
        if (cancelled) return;
        setThinking(false);
        setVisibleCount(i + 1);
        if (i + 1 < msgs.length) {
          await wait(220);
          if (cancelled) return;
        }
      }
      setThinking(false);
    };

    if (start < msgs.length) {
      void run();
    } else {
      setThinking(false);
    }

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [isOpen, conversationKey, conversation.messages]);

  const handleClose = () => {
    setSelectedEvent(null);
    clearRequest();
    onClose?.();
  };

  if (!isOpen) return null;

  const onSend = () => {
    const text = draft.trim();
    if (!text) return;
    setExtraUserMessages((prev) => [
      ...prev,
      {
        id: `u-extra-${prev.length + 2}`,
        role: 'user',
        index: prev.length + 2,
        text,
      },
    ]);
    setDraft('');
  };

  return (
    <>
      <EuiFlyout
        type="push"
        pushMinBreakpoint="m"
        ownFocus={false}
        outsideClickCloses={false}
        size="m"
        onClose={handleClose}
        hideCloseButton
        paddingSize="m"
        aria-label={conversation.title}
        flyoutMenuProps={{ title: 'AI Assistant' }}
      >
        <EuiFlyoutHeader hasBorder>
          <EuiFlexGroup
            justifyContent="spaceBetween"
            alignItems="flexStart"
            gutterSize="s"
            responsive={false}
          >
            <EuiFlexItem>
              <EuiTitle size="xs">
                <h2>{conversation.title}</h2>
              </EuiTitle>
              <EuiSpacer size="xs" />
              <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
                <EuiFlexItem grow={false}>
                  <EuiBadge iconType="lock" color="hollow">
                    Private
                  </EuiBadge>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiText size="xs" color="subdued">
                    <span>
                      {conversation.agentName} · {conversation.agentSubtitle}
                    </span>
                  </EuiText>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
                <EuiFlexItem grow={false}>
                  <EuiToolTip content="Conversation">
                    <EuiButtonIcon iconType="editorComment" aria-label="Conversation" />
                  </EuiToolTip>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiToolTip content="Share">
                    <EuiButtonIcon iconType="share" aria-label="Share" />
                  </EuiToolTip>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiToolTip content="Close">
                    <EuiButtonIcon
                      iconType="cross"
                      aria-label="Close AI Assistant"
                      onClick={handleClose}
                    />
                  </EuiToolTip>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutHeader>

        <EuiFlyoutBody>
          <TimelineRail>
            {conversation.messages.slice(0, visibleCount).map((message) => {
              if (message.role === 'user') {
                return <UserBubble key={message.id} message={message} />;
              }
              if (message.role === 'events') {
                return <EventsToggle key={message.id} message={message} />;
              }
              if (message.role === 'assistant') {
                return (
                  <AssistantBubble
                    key={message.id}
                    message={message}
                    agentName={conversation.agentName}
                  />
                );
              }
              if (message.role === 'timeline') {
                return (
                  <DependencyTimeline
                    key={message.id}
                    message={message}
                    selectedEventId={selectedEvent?.id}
                    onEventClick={setSelectedEvent}
                  />
                );
              }
              return null;
            })}
            {thinking && (
              <AssistantThinkingBubble key="thinking" label={thinkingLabel} />
            )}
            {extraUserMessages.map((message) => (
              <UserBubble key={message.id} message={message} />
            ))}
          </TimelineRail>
        </EuiFlyoutBody>

        <EuiFlyoutFooter>
          <EuiFlexGroup gutterSize="s" responsive={false}>
            <EuiFlexItem>
              <EuiFieldText
                placeholder="Ask a follow-up…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSend();
                }}
                fullWidth
                compressed
                aria-label="Ask the AI assistant"
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                iconType="sortUp"
                display="fill"
                size="m"
                aria-label="Send"
                onClick={onSend}
                isDisabled={!draft.trim()}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutFooter>
      </EuiFlyout>

      {selectedEvent && (
        <TimelineEventFlyout
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          session="never"
          size="s"
          hasChildBackground={false}
        />
      )}
    </>
  );
}

/** Shared header control to open the assistant from detail pages. */
export function AiAssistantButton({ onClick, fill = false }) {
  return (
    <EuiButtonEmpty
      iconType="productAgent"
      onClick={onClick}
      flush={fill ? undefined : 'both'}
    >
      AI Assistant
    </EuiButtonEmpty>
  );
}

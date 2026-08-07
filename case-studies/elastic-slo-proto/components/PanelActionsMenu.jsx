import React, { useState } from 'react';
import {
  EuiButtonIcon,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiPopover,
} from '@elastic/eui';
import { useAssistantBridge } from '../assistant_bridge';
import { useToasts } from '../toast_context';

/**
 * Panel/chart kebab: Add to case, Add to dashboard, Ask agent.
 * Parent typically shows this on hover; keep mounted while the menu is open.
 */
export function PanelActionsMenu({
  title = 'panel',
  size = 'xs',
  isOpen: isOpenControlled,
  onOpenChange,
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = typeof onOpenChange === 'function';
  const isOpen = isControlled ? Boolean(isOpenControlled) : uncontrolledOpen;
  const setOpen = (next) => {
    if (isControlled) onOpenChange(next);
    else setUncontrolledOpen(next);
  };

  const { addToast } = useToasts();
  const { askAgent } = useAssistantBridge();
  const label = title || 'panel';

  const run = (toast) => {
    setOpen(false);
    addToast(toast);
  };

  return (
    <EuiPopover
      button={
        <EuiButtonIcon
          iconType="boxesVertical"
          size={size}
          color="text"
          aria-label={`Actions for ${label}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(!isOpen);
          }}
        />
      }
      isOpen={isOpen}
      closePopover={() => setOpen(false)}
      panelPaddingSize="none"
      anchorPosition="downRight"
      ownFocus
    >
      <EuiContextMenuPanel
        size="s"
        items={[
          <EuiContextMenuItem
            key="add-to-case"
            icon="casesApp"
            onClick={() =>
              run({
                title: 'Added to case',
                color: 'success',
                iconType: 'check',
                text: `“${label}” was attached to the active case.`,
              })
            }
          >
            Add to case
          </EuiContextMenuItem>,
          <EuiContextMenuItem
            key="add-to-dashboard"
            icon="dashboardApp"
            onClick={() =>
              run({
                title: 'Added to dashboard',
                color: 'success',
                iconType: 'check',
                text: `“${label}” was added to your dashboard.`,
              })
            }
          >
            Add to dashboard
          </EuiContextMenuItem>,
          <EuiContextMenuItem
            key="ask-agent"
            icon="productAgent"
            onClick={() => {
              setOpen(false);
              askAgent?.({ panelTitle: label });
              addToast({
                title: 'Asking agent',
                color: 'primary',
                iconType: 'productAgent',
                text: `Opening assistant about “${label}”.`,
              });
            }}
          >
            Ask agent
          </EuiContextMenuItem>,
        ]}
      />
    </EuiPopover>
  );
}

/** Corner kebab overlay — parent sets `visible` (hover || menu open). */
export function PanelHoverActionsOverlay({
  title,
  visible,
  menuOpen,
  onMenuOpenChange,
  top = 8,
  right = 8,
}) {
  return (
    <div
      style={{
        position: 'absolute',
        top,
        right,
        zIndex: 3,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 120ms ease',
      }}
    >
      <PanelActionsMenu
        title={title}
        isOpen={menuOpen}
        onOpenChange={onMenuOpenChange}
      />
    </div>
  );
}

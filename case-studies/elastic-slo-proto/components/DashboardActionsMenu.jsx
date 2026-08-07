import React, { useState } from 'react';
import {
  EuiButtonIcon,
  EuiContextMenuItem,
  EuiContextMenuPanel,
  EuiPopover,
} from '@elastic/eui';
import { useToasts } from '../toast_context';

/**
 * Kebab actions for dashboards (list row + detail header).
 */
export function DashboardActionsMenu({
  dashboard,
  size = 's',
  display = 'base',
  color = 'primary',
  onOpen,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const { addToast } = useToasts();
  const title = dashboard?.title || 'dashboard';

  const run = (toast) => {
    setIsOpen(false);
    addToast(toast);
  };

  return (
    <EuiPopover
      button={
        <EuiButtonIcon
          display={display}
          color={color}
          iconType="boxesVertical"
          size={size}
          aria-label={`Actions for ${title}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen((open) => !open);
          }}
        />
      }
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      panelPaddingSize="none"
      anchorPosition="downRight"
    >
      <EuiContextMenuPanel
        size="s"
        items={[
          ...(onOpen
            ? [
                <EuiContextMenuItem
                  key="open"
                  icon="popout"
                  onClick={() => {
                    setIsOpen(false);
                    onOpen(dashboard);
                  }}
                >
                  Open dashboard
                </EuiContextMenuItem>,
              ]
            : []),
          <EuiContextMenuItem
            key="add-to-case"
            icon="casesApp"
            onClick={() =>
              run({
                title: 'Added to case',
                color: 'success',
                iconType: 'check',
                text: `“${title}” was attached to the active case.`,
              })
            }
          >
            Add to case
          </EuiContextMenuItem>,
          <EuiContextMenuItem
            key="share"
            icon="share"
            onClick={() =>
              run({
                title: 'Share link copied',
                color: 'success',
                iconType: 'check',
                text: `A shareable link for “${title}” was copied to the clipboard.`,
              })
            }
          >
            Share
          </EuiContextMenuItem>,
          <EuiContextMenuItem
            key="clone"
            icon="copy"
            onClick={() =>
              run({
                title: 'Dashboard cloned',
                color: 'success',
                iconType: 'copy',
                text: `Created a draft copy of “${title}”.`,
              })
            }
          >
            Clone
          </EuiContextMenuItem>,
          <EuiContextMenuItem
            key="export"
            icon="exportAction"
            onClick={() =>
              run({
                title: 'Export started',
                color: 'primary',
                iconType: 'exportAction',
                text: `Exporting “${title}” as NDJSON…`,
              })
            }
          >
            Export
          </EuiContextMenuItem>,
          <EuiContextMenuItem
            key="add-to-library"
            icon="folderOpen"
            onClick={() =>
              run({
                title: 'Added to library',
                color: 'success',
                iconType: 'check',
                text: `“${title}” was saved to your dashboard library.`,
              })
            }
          >
            Add to library
          </EuiContextMenuItem>,
          <EuiContextMenuItem
            key="inspect"
            icon="inspect"
            onClick={() =>
              run({
                title: 'Inspect panels',
                color: 'primary',
                iconType: 'inspect',
                text: `Opened inspect for panels on “${title}”.`,
              })
            }
          >
            Inspect
          </EuiContextMenuItem>,
          <EuiContextMenuItem
            key="delete"
            icon="trash"
            onClick={() =>
              run({
                title: 'Delete dashboard',
                color: 'warning',
                iconType: 'trash',
                text: `“${title}” would be moved to trash (prototype only).`,
              })
            }
          >
            Delete
          </EuiContextMenuItem>,
        ]}
      />
    </EuiPopover>
  );
}

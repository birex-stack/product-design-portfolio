import React from 'react';
import { EuiButton, EuiButtonIcon } from '@elastic/eui';

/** Page-header Actions control — collapses to icon-only when the AI assistant is open. */
export function DetailActionsButton({ iconOnly = false }) {
  if (iconOnly) {
    return (
      <EuiButtonIcon
        display="base"
        color="primary"
        iconType="boxesHorizontal"
        aria-label="Actions"
        size="m"
      />
    );
  }

  return (
    <EuiButton color="primary" iconType="arrowDown" iconSide="right">
      Actions
    </EuiButton>
  );
}

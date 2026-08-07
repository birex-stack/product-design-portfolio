import React from 'react';
import { EuiButtonIcon } from '@elastic/eui';

/**
 * Always-visible actions kebab on detail views.
 * Flyout headers should use size="xs" (see FlyoutHeaderActions).
 */
export function DetailActionsButton({
  'aria-label': ariaLabel = 'Actions',
  size = 'm',
  display = 'base',
  color = 'primary',
}) {
  return (
    <EuiButtonIcon
      display={display}
      color={color}
      iconType="boxesVertical"
      aria-label={ariaLabel}
      size={size}
    />
  );
}

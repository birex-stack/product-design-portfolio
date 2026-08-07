import React from 'react';
import { EuiButtonIcon, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { DetailActionsButton } from './DetailActionsButton';

/** Standard flyout-header controls: actions kebab + close, both extra-small. */
export function FlyoutHeaderActions({
  onClose,
  'aria-label': closeAriaLabel = 'Close',
}) {
  return (
    <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
      <EuiFlexItem grow={false}>
        <DetailActionsButton size="xs" />
      </EuiFlexItem>
      <EuiFlexItem grow={false}>
        <EuiButtonIcon
          display="empty"
          color="text"
          iconType="cross"
          size="xs"
          aria-label={closeAriaLabel}
          onClick={onClose}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
}

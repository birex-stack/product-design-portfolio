import React, { useMemo } from 'react';
import {
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyoutFooter,
  EuiText,
} from '@elastic/eui';

/**
 * Bottom action bar for flyouts opened from an ordered list
 * (timeline events, alerts inventory, etc.).
 */
export function FlyoutListNavFooter({
  items,
  currentId,
  onSelect,
  getItemId = (item) => item?.id,
}) {
  const { index, total } = useMemo(() => {
    const list = items || [];
    const i = list.findIndex((item) => getItemId(item) === currentId);
    return { index: i, total: list.length };
  }, [items, currentId, getItemId]);

  if (!items?.length || index < 0 || total < 2) return null;

  const canPrev = index > 0;
  const canNext = index < total - 1;

  return (
    <EuiFlyoutFooter>
      <EuiFlexGroup
        justifyContent="spaceBetween"
        alignItems="center"
        gutterSize="s"
        responsive={false}
      >
        <EuiFlexItem grow={false}>
          <EuiText size="xs" color="subdued">
            <span>
              {index + 1} of {total}
            </span>
          </EuiText>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiFlexGroup gutterSize="xs" alignItems="center" responsive={false}>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                iconType="arrowLeft"
                size="xs"
                display="base"
                color="text"
                aria-label="Previous"
                title="Previous"
                isDisabled={!canPrev}
                onClick={() => canPrev && onSelect?.(items[index - 1])}
              />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonIcon
                iconType="arrowRight"
                size="xs"
                display="base"
                color="primary"
                aria-label="Next"
                title="Next"
                isDisabled={!canNext}
                onClick={() => canNext && onSelect?.(items[index + 1])}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiFlyoutFooter>
  );
}

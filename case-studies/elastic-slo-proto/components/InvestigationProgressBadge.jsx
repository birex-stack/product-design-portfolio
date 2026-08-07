import React from 'react';
import { EuiBadge } from '@elastic/eui';

/** Shown when at least one investigation-guide step is marked done. */
export function InvestigationProgressBadge({ completed, total }) {
  if (!(completed > 0) || !(total > 0)) return null;
  return (
    <EuiBadge color="success" iconType="check">
      {completed} of {total} done
    </EuiBadge>
  );
}

export function initialCompletedSteps(count) {
  const n = Math.max(0, Math.min(Number(count) || 0, 64));
  return new Set(Array.from({ length: n }, (_, i) => i));
}

import React from 'react';
import { EuiLoadingChart } from '@elastic/eui';

export function ChartLoadingState({ height = 180, size = 'l' }) {
  return (
    <div
      style={{
        width: '100%',
        height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      role="status"
      aria-label="Loading chart"
    >
      <EuiLoadingChart size={size} />
    </div>
  );
}

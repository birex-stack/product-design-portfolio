import { useMemo } from 'react';
import { DARK_THEME, LIGHT_THEME } from '@elastic/charts';
import { useEuiTheme } from '@elastic/eui';

/** Mirrors EUI docs helper for Elastic Charts base themes */
export function useChartBaseTheme() {
  const { colorMode } = useEuiTheme();
  return useMemo(
    () => (colorMode === 'DARK' ? DARK_THEME : LIGHT_THEME),
    [colorMode]
  );
}

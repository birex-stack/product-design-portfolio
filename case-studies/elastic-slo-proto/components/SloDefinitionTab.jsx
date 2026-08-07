import React, { useMemo, useState } from 'react';
import {
  EuiButton,
  EuiButtonIcon,
  EuiCodeBlock,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
  useEuiTheme,
} from '@elastic/eui';

function buildApiDefinition(slo) {
  const target = Number((slo.target / 100).toFixed(4));
  const windowMatch = String(slo.window || '').match(/(\d+)\s*days?/i);
  const days = windowMatch ? windowMatch[1] : '30';

  return {
    id: slo.id,
    name: slo.name,
    description: slo.description,
    tags: slo.tags || [],
    indicator: {
      type: 'sli.kql.custom',
      params: {
        index: 'metrics-*,traces-apm*',
        filter: '',
        good: 'http.response.status_code < 500',
        total: 'http.request.method: *',
        timestampField: '@timestamp',
      },
    },
    budgetingMethod: 'occurrences',
    objective: {
      target,
    },
    timeWindow: {
      duration: `${days}d`,
      type: 'rolling',
    },
  };
}

export function SloDefinitionTab({ slo }) {
  const { euiTheme } = useEuiTheme();
  const [copied, setCopied] = useState(false);

  const apiDefinition = useMemo(() => buildApiDefinition(slo), [slo]);
  const apiJson = useMemo(
    () => JSON.stringify(apiDefinition, null, 2),
    [apiDefinition]
  );

  const copyDefinition = async () => {
    try {
      await navigator.clipboard.writeText(apiJson);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Prototype: clipboard may be unavailable
    }
  };

  return (
    <EuiPanel hasBorder paddingSize="m">
      <EuiTitle size="xs">
        <h3>Definition</h3>
      </EuiTitle>
      <EuiSpacer size="s" />
      <EuiText size="s">
        <p>
          Indicator type: <strong>Custom KQL</strong>
        </p>
        <p>
          Good query:{' '}
          <code style={{ color: euiTheme.colors.primary }}>
            http.response.status_code &lt; 500
          </code>
        </p>
        <p>
          Total query:{' '}
          <code style={{ color: euiTheme.colors.primary }}>
            http.request.method: *
          </code>
        </p>
        <p>
          Budgeting method: <strong>Occurrences</strong> · Time window:{' '}
          <strong>{slo.window}</strong>
        </p>
      </EuiText>

      <EuiSpacer size="l" />

      <EuiTitle size="xs">
        <h3>API call</h3>
      </EuiTitle>
      <EuiSpacer size="s" />
      <EuiText size="xs" color="subdued">
        <p>Create or update this SLO via the Observability SLO API.</p>
      </EuiText>
      <EuiSpacer size="s" />
      <EuiCodeBlock
        language="json"
        fontSize="s"
        paddingSize="m"
        isCopyable={false}
        overflowHeight={360}
      >
        {apiJson}
      </EuiCodeBlock>

      <EuiSpacer size="m" />

      <EuiFlexGroup gutterSize="s" alignItems="center" responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiButtonIcon
            iconType={copied ? 'check' : 'copyClipboard'}
            display="base"
            size="m"
            aria-label={copied ? 'API definition copied' : 'Copy API definition'}
            title={copied ? 'Copied' : 'Copy API definition'}
            color={copied ? 'success' : 'text'}
            onClick={copyDefinition}
          />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButton onClick={() => {}}>Edit definition</EuiButton>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );
}

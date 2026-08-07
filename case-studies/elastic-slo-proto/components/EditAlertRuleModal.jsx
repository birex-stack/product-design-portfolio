import React, { useEffect, useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiFieldNumber,
  EuiForm,
  EuiFormRow,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiSelect,
  EuiSpacer,
  EuiText,
} from '@elastic/eui';
function formatThresholdValue(value, valueUnit = '') {
  if (value == null || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  const digits = abs >= 100 ? 0 : abs >= 10 ? 1 : 2;
  return `${Number(value).toFixed(digits)}${valueUnit}`;
}

const COMPARATOR_OPTIONS = [
  { value: 'above', text: 'Is above' },
  { value: 'above_or_eq', text: 'Is above or equal' },
  { value: 'below', text: 'Is below' },
  { value: 'below_or_eq', text: 'Is below or equal' },
];

export function EditAlertRuleModal({
  mode = 'create',
  seriesName,
  threshold,
  valueUnit = '',
  comparator = 'above',
  onClose,
  onSave,
}) {
  const [draftThreshold, setDraftThreshold] = useState(String(threshold ?? ''));
  const [draftComparator, setDraftComparator] = useState(comparator);
  const isCreate = mode !== 'edit';

  useEffect(() => {
    setDraftThreshold(String(threshold ?? ''));
    setDraftComparator(comparator);
  }, [threshold, comparator]);

  const numeric = Number(draftThreshold);
  const isValid = draftThreshold !== '' && Number.isFinite(numeric);

  return (
    <EuiModal onClose={onClose} style={{ width: 440 }} aria-labelledby="edit-alert-rule-title">
      <EuiModalHeader>
        <EuiModalHeaderTitle id="edit-alert-rule-title">
          {isCreate ? 'Create alert rule' : 'Edit alert rule'}
        </EuiModalHeaderTitle>
      </EuiModalHeader>
      <EuiModalBody>
        <EuiText size="s" color="subdued">
          <p>
            {isCreate ? 'Set' : 'Adjust'} the threshold criteria for{' '}
            <strong>{seriesName || 'this metric'}</strong>.
          </p>
        </EuiText>
        <EuiSpacer size="m" />
        <EuiForm component="form" onSubmit={(e) => e.preventDefault()}>
          <EuiFormRow label="When metric" fullWidth>
            <EuiSelect
              options={COMPARATOR_OPTIONS}
              value={draftComparator}
              onChange={(e) => setDraftComparator(e.target.value)}
              aria-label="Threshold comparator"
            />
          </EuiFormRow>
          <EuiFormRow
            label={`Threshold${valueUnit ? ` (${valueUnit})` : ''}`}
            fullWidth
            isInvalid={!isValid}
            error={!isValid ? 'Enter a valid number' : undefined}
          >
            <EuiFieldNumber
              value={draftThreshold}
              onChange={(e) => setDraftThreshold(e.target.value)}
              step="any"
              fullWidth
              isInvalid={!isValid}
              aria-label="Alert rule threshold"
            />
          </EuiFormRow>
        </EuiForm>
        {isValid && (
          <>
            <EuiSpacer size="s" />
            <EuiText size="xs" color="subdued">
              <p>
                Rule will fire when the metric{' '}
                {COMPARATOR_OPTIONS.find((o) => o.value === draftComparator)?.text.toLowerCase()}{' '}
                {formatThresholdValue(numeric, valueUnit)}.
              </p>
            </EuiText>
          </>
        )}
      </EuiModalBody>
      <EuiModalFooter>
        <EuiButtonEmpty onClick={onClose}>Cancel</EuiButtonEmpty>
        <EuiButton
          fill
          disabled={!isValid}
          onClick={() =>
            onSave({
              threshold: numeric,
              comparator: draftComparator,
            })
          }
        >
          {isCreate ? 'Create rule' : 'Save rule'}
        </EuiButton>
      </EuiModalFooter>
    </EuiModal>
  );
}

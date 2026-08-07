import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';
import { EuiGlobalToastList } from '@elastic/eui';
import { EditAlertRuleModal } from './components/EditAlertRuleModal';

const ToastContext = createContext({
  addToast: () => {},
  openRuleEditor: () => {},
});

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [ruleEditor, setRuleEditor] = useState(null);

  const dismissToast = useCallback((removed) => {
    setToasts((prev) => prev.filter((t) => t.id !== removed.id));
  }, []);

  const addToast = useCallback((toast) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const next = { id, ...toast };
    setToasts((prev) => [...prev, next]);
    return id;
  }, []);

  const openRuleEditor = useCallback((config) => {
    setRuleEditor(config);
  }, []);

  const closeRuleEditor = useCallback(() => {
    setRuleEditor(null);
  }, []);

  const saveRuleEditor = useCallback(
    (next) => {
      if (!ruleEditor) return;
      const isCreate = ruleEditor.mode !== 'edit';
      ruleEditor.onSave?.(next);
      setRuleEditor(null);
      const formatted =
        next.threshold != null && Number.isFinite(next.threshold)
          ? Number(next.threshold)
          : null;
      const name = ruleEditor.seriesName || 'this metric';
      const unit = ruleEditor.valueUnit || '';
      addToast({
        title: isCreate ? 'Alert rule created' : 'Alert rule updated',
        color: 'success',
        iconType: 'check',
        text:
          formatted == null
            ? `Custom threshold rule saved for ${name}.`
            : `Custom threshold rule for ${name} at ${formatted}${unit}.`,
      });
    },
    [addToast, ruleEditor]
  );

  const value = useMemo(
    () => ({ addToast, openRuleEditor }),
    [addToast, openRuleEditor]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <EuiGlobalToastList
        toasts={toasts}
        dismissToast={dismissToast}
        toastLifeTimeMs={8000}
      />
      {ruleEditor && (
        <EditAlertRuleModal
          mode={ruleEditor.mode === 'edit' ? 'edit' : 'create'}
          seriesName={ruleEditor.seriesName}
          threshold={ruleEditor.threshold}
          valueUnit={ruleEditor.valueUnit}
          comparator={ruleEditor.comparator}
          onClose={closeRuleEditor}
          onSave={saveRuleEditor}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToasts() {
  return useContext(ToastContext);
}

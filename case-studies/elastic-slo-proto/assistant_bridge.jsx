import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

const AssistantBridgeContext = createContext({
  request: null,
  analyzeDependencies: () => {},
  clearRequest: () => {},
});

export function AssistantBridgeProvider({ children, onRequestOpen }) {
  const [request, setRequest] = useState(null);

  const analyzeDependencies = useCallback(
    (payload) => {
      setRequest({
        id: `${Date.now()}`,
        type: 'dependencies',
        ...payload,
      });
      onRequestOpen?.();
    },
    [onRequestOpen]
  );

  const clearRequest = useCallback(() => {
    setRequest(null);
  }, []);

  const value = useMemo(
    () => ({ request, analyzeDependencies, clearRequest }),
    [request, analyzeDependencies, clearRequest]
  );

  return (
    <AssistantBridgeContext.Provider value={value}>
      {children}
    </AssistantBridgeContext.Provider>
  );
}

export function useAssistantBridge() {
  return useContext(AssistantBridgeContext);
}

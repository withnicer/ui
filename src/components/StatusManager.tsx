import { type ReactNode, useCallback, useEffect, useState } from "react";

import StatusContext, { type StatusProps } from "../contexts/StatusContext";
import Toast from "./Toast";

interface Props {
  children: ReactNode;
}

/** Provides `StatusContext` and renders the toast its `setStatus` raises. */
export default function StatusManager({ children }: Props) {
  // Each status raised is a toast of its own: a new one starts its time
  // and its ring afresh.
  const [raised, setRaised] = useState<{ id: number; status: StatusProps }>();
  const [toastShown, setToastShown] = useState<boolean>(false);
  const setStatus = useCallback(
    (status: StatusProps) =>
      setRaised((current) => ({ id: (current?.id ?? 0) + 1, status })),
    []
  );

  useEffect(() => {
    setToastShown(Boolean(raised));
  }, [raised]);

  // Render
  return (
    <StatusContext.Provider value={setStatus}>
      {children}

      {raised && toastShown ? (
        <Toast
          action={raised.status.action}
          autoClose={raised.status.autoClose}
          description={raised.status.description}
          key={raised.id}
          setVisible={setToastShown}
          type={raised.status.type}
          visible={toastShown}
        />
      ) : null}
    </StatusContext.Provider>
  );
}

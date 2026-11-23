import { createContext } from "react";

import type { ToastProps } from "../components/Toast";

export interface StatusProps {
  /**
   * One thing to do about what the toast says, as Undo: a click does it
   * and closes the toast.
   */
  action?: ToastProps["action"];
  autoClose?: boolean;
  description: string;
  type: ToastProps["type"];
}

export type SetStatus = (status: StatusProps) => void;

/** `setStatus` — raises a toast from anywhere under `StatusManager`. */
export const StatusContext = createContext<SetStatus>(() => null);

export default StatusContext;

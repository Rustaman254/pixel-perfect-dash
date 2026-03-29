import * as React from "react";

type ToastProps = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: "default" | "destructive";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

let count = 0;
function genId() { count = (count + 1) % Number.MAX_SAFE_INTEGER; return count.toString(); }

const listeners: Array<(state: { toasts: ToastProps[] }) => void> = [];
let memoryState: { toasts: ToastProps[] } = { toasts: [] };

function dispatch(action: { type: string; toast?: Partial<ToastProps>; toastId?: string }) {
  switch (action.type) {
    case "ADD_TOAST":
      memoryState = { toasts: [{ ...action.toast, id: action.toast!.id, open: true } as ToastProps, ...memoryState.toasts].slice(0, 1) };
      break;
    case "DISMISS_TOAST":
      memoryState = { toasts: memoryState.toasts.filter(t => t.id !== action.toastId) };
      break;
    case "REMOVE_TOAST":
      memoryState = { toasts: memoryState.toasts.filter(t => t.id !== action.toastId) };
      break;
  }
  listeners.forEach(l => l(memoryState));
}

function toast(props: Omit<ToastProps, "id">) {
  const id = genId();
  dispatch({ type: "ADD_TOAST", toast: { ...props, id } });
  setTimeout(() => dispatch({ type: "REMOVE_TOAST", toastId: id }), 5000);
  return { id, dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }) };
}

export function useToast() {
  const [state, setState] = React.useState(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => { const i = listeners.indexOf(setState); if (i > -1) listeners.splice(i, 1); };
  }, [state]);
  return { ...state, toast, dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }) };
}

export { toast };

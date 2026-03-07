// Tiny event bus so the Zustand store (non-React) can trigger toasts
// The ToastProvider subscribes to these events on mount.

type ToastType = 'success' | 'error' | 'info';
type Listener = (message: string, type: ToastType) => void;

const listeners = new Set<Listener>();

export function onToast(fn: Listener) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

export function emitToast(message: string, type: ToastType = 'info') {
  listeners.forEach(fn => fn(message, type));
}

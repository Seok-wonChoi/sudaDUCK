const listeners = new Set();

export function subscribeExitConfirm(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function openExitConfirm(payload) {
  listeners.forEach((fn) => fn(payload));
}

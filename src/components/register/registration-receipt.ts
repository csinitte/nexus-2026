'use client';

import { useSyncExternalStore } from 'react';

const key = 'nexus26-registration-receipt';
const changeEvent = 'nexus:registration-receipt';

function readReceipt() {
  try {
    const code = window.localStorage.getItem(key);
    return code && /^NEXUS26-\d{4}$/.test(code) ? code : null;
  } catch {
    return null;
  }
}

function subscribe(notify: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === key || event.key === null) notify();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(changeEvent, notify);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(changeEvent, notify);
  };
}

export function rememberRegistration(code: string) {
  if (!/^NEXUS26-\d{4}$/.test(code)) return;
  try {
    window.localStorage.setItem(key, code);
    window.dispatchEvent(new Event(changeEvent));
  } catch {
    // Private browsing can block storage. The signed summary link still works.
  }
}

export function useRegistrationReceipt() {
  return useSyncExternalStore(subscribe, readReceipt, () => null);
}

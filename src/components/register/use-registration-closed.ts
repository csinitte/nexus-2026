'use client';

import { useSyncExternalStore } from 'react';
import { isRegistrationClosed, REGISTRATION_CLOSE_TIME } from '@/lib/nexus/registration-window';

function subscribe(notify: () => void) {
  let timer: ReturnType<typeof setTimeout>;

  function check() {
    clearTimeout(timer);
    notify();
    const remaining = REGISTRATION_CLOSE_TIME - Date.now();
    if (remaining > 0) timer = setTimeout(check, Math.min(remaining, 2_147_483_647));
  }

  check();
  window.addEventListener('pageshow', check);
  document.addEventListener('visibilitychange', check);
  return () => {
    clearTimeout(timer);
    window.removeEventListener('pageshow', check);
    document.removeEventListener('visibilitychange', check);
  };
}

export function useRegistrationClosed() {
  return useSyncExternalStore(subscribe, isRegistrationClosed, () => false);
}

// @ts-nocheck
import { registerCapabilities } from '@reticlehq/core';
if (import.meta.env.DEV) {
  registerCapabilities({
    testids: [
      'login-btn',
      'logout-btn',
      'signup-btn',
      'submit-form',
      'nav-sidebar',
      'nav-dashboard',
      'nav-mentor',
      'nav-admin',
      'search-input',
      'notification-btn',
    ],
    signals: [
      'auth:login',
      'auth:logout',
      'auth:signup',
      'auth:error',
      'nav:route-change',
      'data:loaded',
      'data:error',
    ],
    stores: [],
  });
}

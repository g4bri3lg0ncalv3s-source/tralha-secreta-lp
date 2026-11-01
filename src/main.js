/**
 * Tralha Secreta — Application Entrypoint
 * Phase 2: Connects conversion CTAs to centralized channel configuration.
 */

import { initChannelLinks } from './modules/channel-links.js';

function initApp() {
  initChannelLinks(document);
  document.documentElement.dataset.jsReady = 'true';
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp, { once: true });
} else {
  initApp();
}

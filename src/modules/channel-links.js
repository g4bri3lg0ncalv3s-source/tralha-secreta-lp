/**
 * Channel Links Binder — Connects DOM CTAs to centralized CHANNELS_CONFIG.
 * Ensures zero duplicated URLs in HTML and prevents broken/empty buttons for disabled channels.
 */

import { CHANNELS_CONFIG, getEnabledChannel } from '../config/channels.js';

const WHATSAPP_ICON_SVG = `
  <svg class="btn-cta__icon" viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
    <path d="M12 2.25A9.72 9.72 0 0 0 2.25 11.97c0 1.72.45 3.39 1.3 4.86L2.18 21.82l5.12-1.34a9.74 9.74 0 0 0 4.7 1.2h.01c5.37 0 9.74-4.36 9.74-9.72A9.72 9.72 0 0 0 12 2.25Z" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>
    <path d="M9.35 8.4c-.2-.45-.42-.46-.62-.47h-.53c-.19 0-.5.07-.76.36-.26.29-1 0.98-1 2.38s1.02 2.76 1.16 2.95c.14.19 1.98 3.16 4.89 4.3 2.42.95 2.91.76 3.44.71.53-.05 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.33-.29-.14-1.7-.84-1.96-.93-.26-.1-.45-.14-.64.14-.19.29-.74.93-.91 1.12-.17.19-.33.22-.62.07-.29-.14-1.21-.45-2.31-1.43-.85-.76-1.43-1.7-1.6-1.99-.17-.29-.02-.44.13-.58.13-.13.29-.33.43-.5.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.63-1.55-.87-2.1Z" fill="currentColor"/>
  </svg>
`;

/**
 * Hydrates a single anchor element from a verified channel configuration.
 * @param {HTMLAnchorElement} linkEl
 * @param {ReturnType<typeof getEnabledChannel>} channel
 */
function applyChannelAttributes(linkEl, channel) {
  linkEl.href = channel.url;
  linkEl.dataset.channelResolved = channel.id;
  linkEl.dataset.channelType = channel.type;

  if (channel.external) {
    linkEl.target = '_blank';
    linkEl.rel = 'noopener noreferrer';
  }
}

/**
 * Binds all [data-channel-link] elements and optionally renders secondary enabled channels
 * inside [data-channel-actions] containers.
 * @param {ParentNode} [root=document]
 * @param {typeof CHANNELS_CONFIG} [customConfig=CHANNELS_CONFIG]
 */
export function initChannelLinks(root = document, customConfig = CHANNELS_CONFIG) {
  const resolveChannel = (id) => {
    const ch = customConfig[id];
    if (!ch || !ch.enabled || !ch.url) return null;
    try {
      const parsed = new URL(ch.url);
      return parsed.protocol === 'https:' ? ch : null;
    } catch {
      return null;
    }
  };

  const links = root.querySelectorAll('[data-channel-link]');
  links.forEach((el) => {
    const channelId = el.getAttribute('data-channel-link');
    const channel = channelId ? resolveChannel(channelId) : null;

    if (!channel) {
      // Remove disabled or invalid channel elements completely so no broken button appears
      el.remove();
      return;
    }

    if (el instanceof HTMLAnchorElement) {
      applyChannelAttributes(el, channel);
    }
  });

  // Future-ready: if WhatsApp is enabled in config and a [data-channel-actions="hero"] container exists
  // without an explicit WhatsApp link, automatically append the secondary CTA button.
  const whatsappChannel = resolveChannel('whatsapp');
  if (whatsappChannel) {
    const actionGroups = root.querySelectorAll('[data-channel-actions="hero"]');
    actionGroups.forEach((group) => {
      if (group.querySelector('[data-channel-link="whatsapp"]')) return;

      const waLink = document.createElement('a');
      waLink.className = 'btn-cta btn-cta--secondary';
      waLink.setAttribute('data-channel-link', 'whatsapp');
      waLink.setAttribute('data-cta-location', 'hero');
      applyChannelAttributes(waLink, whatsappChannel);
      waLink.innerHTML = `${WHATSAPP_ICON_SVG}<span>${whatsappChannel.labels.hero}</span>`;
      group.appendChild(waLink);
    });
  }
}

export { getEnabledChannel };


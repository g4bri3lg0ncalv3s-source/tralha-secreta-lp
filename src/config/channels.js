/**
 * Centralized Channel Configuration — Tralha Secreta
 * Single source of truth for conversion destinations.
 * Future WhatsApp integration can be enabled here without rewriting page markup.
 */

const rawWhatsAppUrl =
  typeof import.meta !== 'undefined' &&
  import.meta.env &&
  typeof import.meta.env.VITE_WHATSAPP_URL === 'string'
    ? import.meta.env.VITE_WHATSAPP_URL.trim()
    : '';

export const CHANNELS_CONFIG = Object.freeze({
  telegram: Object.freeze({
    id: 'telegram',
    name: 'Telegram',
    type: 'channel',
    enabled: true,
    url: 'https://t.me/tralhasecreta',
    external: true,
    labels: Object.freeze({
      hero: 'ENTRAR NO CANAL DO TELEGRAM',
      header: 'Entrar no canal',
      headerCompact: 'Canal',
    }),
  }),
  whatsapp: Object.freeze({
    id: 'whatsapp',
    name: 'WhatsApp',
    type: 'group',
    enabled: false,
    url: rawWhatsAppUrl,
    external: true,
    labels: Object.freeze({
      hero: 'ENTRAR NO GRUPO DO WHATSAPP',
      header: 'WhatsApp',
      headerCompact: 'WhatsApp',
    }),
  }),
});

/**
 * Returns the channel object only if it is explicitly enabled and has a valid https URL.
 * @param {'telegram' | 'whatsapp'} channelId
 */
export function getEnabledChannel(channelId) {
  const channel = CHANNELS_CONFIG[channelId];
  if (!channel || !channel.enabled || !channel.url) {
    return null;
  }
  try {
    const parsed = new URL(channel.url);
    if (parsed.protocol !== 'https:') return null;
  } catch {
    return null;
  }
  return channel;
}


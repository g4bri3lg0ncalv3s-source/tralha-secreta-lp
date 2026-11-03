/**
 * Tralha Secreta — Script Único de Conversão, Privacidade (LGPD) e UI Mobile
 * Arquitetura Zero-Build (Vanilla JS, sem dependências externas).
 *
 * IMPORTANTE: Os links para a Comunidade do WhatsApp e para o Canal do Telegram estão
 * declarados diretamente no HTML e funcionam mesmo sem JavaScript. Este script atua
 * exclusivamente como camada progressiva para consentimento LGPD, Meta Pixel, UTMs e Sticky CTA.
 */
(function () {
  'use strict';

  const CONFIG = {
    // Preencha com o ID numérico do Meta Pixel ao iniciar campanhas (ex: '123456789012345').
    // Enquanto vazio (''), nenhum script externo é requisitado.
    metaPixelId: '',
    consentKey: 'ts_lgpd_consent_v1',
    utmKey: 'ts_campaign_utms_v1',
  };

  const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  let pixelBootstrapped = false;
  let heroInView = true;
  let finalCtaInView = false;

  /* ------------------------------------------------------------------------
     1. ARMAZENAMENTO SEGURO (À PROVA DE MODO ANÔNIMO / WEBVIEW RESTRITA)
     ------------------------------------------------------------------------ */
  function safeGet(storage, key) {
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  }

  function safeSet(storage, key, value) {
    try {
      storage.setItem(key, value);
    } catch {
      // Falha silenciosa em ambientes com storage bloqueado
    }
  }

  /* ------------------------------------------------------------------------
     2. CAPTURA LEVE DE UTMS NA SESSÃO (PARA ATRIBUIÇÃO NO META PIXEL)
     ------------------------------------------------------------------------ */
  function captureCampaignUtms() {
    try {
      const search = new URLSearchParams(window.location.search);
      const found = {};
      let hasAny = false;

      for (const key of UTM_PARAMS) {
        const val = search.get(key);
        if (val) {
          found[key] = val.slice(0, 120);
          hasAny = true;
        }
      }

      if (hasAny) {
        safeSet(window.sessionStorage, CONFIG.utmKey, JSON.stringify(found));
        return found;
      }

      const cached = safeGet(window.sessionStorage, CONFIG.utmKey);
      return cached ? JSON.parse(cached) : {};
    } catch {
      return {};
    }
  }

  /* ------------------------------------------------------------------------
     3. META PIXEL CONDICIONAL & REVOGAÇÃO EFETIVA (LGPD)
     ------------------------------------------------------------------------ */
  function getConsent() {
    const val = safeGet(window.localStorage, CONFIG.consentKey);
    return val === 'granted' || val === 'denied' ? val : null;
  }

  function clearFirstPartyMetaCookies() {
    try {
      const names = ['_fbp', '_fbc'];
      const host = window.location.hostname;
      for (const name of names) {
        document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
        if (host && host.includes('.')) {
          document.cookie = `${name}=; Max-Age=0; path=/; domain=.${host}; SameSite=Lax`;
        }
      }
    } catch {
      // Ignora restrições de cookie em file:// ou sandbox
    }
  }

  function loadMetaPixelIfConfigured() {
    const pixelId = (CONFIG.metaPixelId || '').trim();
    if (!/^\d{8,20}$/.test(pixelId) || getConsent() !== 'granted') {
      return;
    }

    if (!window.fbq) {
      /* eslint-disable */
      !(function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = true;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */
    }

    window.fbq('consent', 'grant');
    if (!pixelBootstrapped) {
      window.fbq('init', pixelId);
      pixelBootstrapped = true;
    }
    window.fbq('track', 'PageView');
  }

  function applyConsentChoice(choice) {
    safeSet(window.localStorage, CONFIG.consentKey, choice);

    if (choice === 'granted') {
      loadMetaPixelIfConfigured();
    } else {
      if (typeof window.fbq === 'function') {
        try {
          window.fbq('consent', 'revoke');
        } catch {
          // Sem bloqueio
        }
      }
      clearFirstPartyMetaCookies();
    }

    updateConsentStatusLabel();
    closeCookieBanner();
  }

  /* ------------------------------------------------------------------------
     4. BANNER DE PRIVACIDADE & SMART STICKY CTA (SEM COLISÃO DE BARRAS NO MOBILE)
     ------------------------------------------------------------------------ */
  function isBannerVisible() {
    const banner = document.getElementById('cookie-banner');
    return Boolean(banner && !banner.hidden);
  }

  function syncStickyCta() {
    const sticky = document.getElementById('sticky-cta');
    if (!sticky) return;

    const shouldShow = !heroInView && !finalCtaInView && !isBannerVisible();
    sticky.hidden = !shouldShow;
    document.body.classList.toggle('has-sticky-cta', shouldShow);
  }

  function openCookieBanner() {
    const banner = document.getElementById('cookie-banner');
    if (!banner) return;
    banner.hidden = false;
    syncStickyCta();
  }

  function closeCookieBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) {
      banner.hidden = true;
    }
    syncStickyCta();
  }

  function updateConsentStatusLabel() {
    const statusEl = document.querySelector('[data-consent-status]');
    if (!statusEl) return;

    const current = getConsent();
    if (current === 'granted') {
      statusEl.textContent = 'Ativo (medição de campanhas autorizada)';
    } else if (current === 'denied') {
      statusEl.textContent = 'Apenas essenciais (medição publicitária desativada)';
    } else {
      statusEl.textContent = 'Pendente de escolha (medição publicitária inativa)';
    }
  }

  function initStickyObserver() {
    const heroEl = document.getElementById('hero');
    const finalEl = document.getElementById('conversao-final');
    if (!heroEl || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target === heroEl) {
            heroInView = entry.isIntersecting;
          } else if (entry.target === finalEl) {
            finalCtaInView = entry.isIntersecting;
          }
        }
        syncStickyCta();
      },
      { threshold: 0.08 }
    );

    observer.observe(heroEl);
    if (finalEl) observer.observe(finalEl);
  }

  /* ------------------------------------------------------------------------
     5. DISPARO SÍNCRONO NÃO-BLOQUEANTE DE CLIQUES (WHATSAPP & TELEGRAM)
     ------------------------------------------------------------------------ */
  function trackChannelClick(eventName, destination, ctaLocation) {
    if (getConsent() !== 'granted' || typeof window.fbq !== 'function') {
      return;
    }

    try {
      const utms = captureCampaignUtms();
      window.fbq(
        'trackCustom',
        eventName,
        Object.assign(
          {
            cta_location: ctaLocation || 'unknown',
            destination: destination,
          },
          utms
        )
      );
    } catch {
      // Jamais interrompe a abertura nativa do aplicativo (WhatsApp / Telegram)
    }
  }

  /* ------------------------------------------------------------------------
     6. INICIALIZAÇÃO E DELEGAÇÃO DE EVENTOS
     ------------------------------------------------------------------------ */
  function init() {
    captureCampaignUtms();
    updateConsentStatusLabel();
    initStickyObserver();

    const currentConsent = getConsent();
    if (currentConsent === 'granted') {
      loadMetaPixelIfConfigured();
    } else if (currentConsent === null) {
      openCookieBanner();
    }

    document.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const waLink = target.closest('[data-whatsapp-cta]');
      if (waLink) {
        // Sem preventDefault(): preserva deep link nativo chat.whatsapp.com em iOS/Android
        trackChannelClick('WhatsAppJoinClick', 'whatsapp_community', waLink.getAttribute('data-whatsapp-cta'));
        return;
      }

      const tgLink = target.closest('[data-telegram-cta]');
      if (tgLink) {
        // Sem preventDefault(): preserva deep link nativo t.me em WebViews iOS/Android
        trackChannelClick('TelegramJoinClick', 'telegram_channel', tgLink.getAttribute('data-telegram-cta'));
        return;
      }

      const consentBtn = target.closest('[data-consent-action]');
      if (consentBtn) {
        const action = consentBtn.getAttribute('data-consent-action');
        if (action === 'accept') applyConsentChoice('granted');
        if (action === 'reject') applyConsentChoice('denied');
        return;
      }

      const openPrefsBtn = target.closest('[data-open-consent]');
      if (openPrefsBtn) {
        event.preventDefault();
        openCookieBanner();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();


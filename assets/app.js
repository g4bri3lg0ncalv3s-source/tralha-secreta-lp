/**
 * Tralha Secreta — Script de Alta Conversão, Urgência Dinâmica e Meta Pixel
 * Arquitetura Zero-Build (Vanilla JS).
 */
(function () {
  'use strict';

  const CONFIG = {
    metaPixelId: '2412554752613262',
    consentKey: 'ts_lgpd_consent_v1',
    utmKey: 'ts_campaign_utms_v1',
  };

  const UTM_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  let pixelBootstrapped = false;
  let pageViewTracked = false;

  const URGENCY_MESSAGES = [
    '🔥 Mais de 1.000 pessoas já economizaram com a gente!',
    '⚠️ Vagas limitadas: o grupo atual está 95% preenchido!',
    '⚡ Marcos S. acabou de entrar no grupo pelo WhatsApp!',
    '🎣 Carretilha com 58% OFF publicada há poucos minutos no grupo!',
    '⏳ Restam poucas vagas gratuitas antes do link fechar!',
    '💰 Mais de 1.000 pescadores já garantiram tralha mais barata!',
  ];

  /* ------------------------------------------------------------------------
     1. ARMAZENAMENTO SEGURO
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
      // Falha silenciosa em ambientes restritos
    }
  }

  /* ------------------------------------------------------------------------
     2. CAPTURA DE UTMS
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
     3. META PIXEL & CONSENTIMENTO LGPD
     ------------------------------------------------------------------------ */
  function getConsent() {
    const val = safeGet(window.localStorage, CONFIG.consentKey);
    return val === 'granted' || val === 'denied' ? val : null;
  }

  function isTrackingAllowed() {
    return getConsent() !== 'denied';
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
      // Ignora restrições locais
    }
  }

  function loadMetaPixelIfConfigured() {
    const pixelId = (CONFIG.metaPixelId || '').trim();
    if (!/^\d{8,20}$/.test(pixelId) || !isTrackingAllowed()) {
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
    if (!pageViewTracked) {
      window.fbq('track', 'PageView');
      pageViewTracked = true;
    }
  }

  function applyConsentChoice(choice) {
    safeSet(window.localStorage, CONFIG.consentKey, choice);

    if (choice === 'granted') {
      loadMetaPixelIfConfigured();
    } else {
      pageViewTracked = false;
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

  function openCookieBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) banner.hidden = false;
  }

  function closeCookieBanner() {
    const banner = document.getElementById('cookie-banner');
    if (banner) banner.hidden = true;
  }

  function updateConsentStatusLabel() {
    const statusEl = document.querySelector('[data-consent-status]');
    if (!statusEl) return;

    const current = getConsent();
    if (current === 'denied') {
      statusEl.textContent = 'Apenas essenciais (medição publicitária desativada)';
    } else if (current === 'granted') {
      statusEl.textContent = 'Ativo (medição de campanhas confirmada)';
    } else {
      statusEl.textContent = 'Ativo no carregamento (você pode restringir para apenas essenciais ao lado)';
    }
  }

  /* ------------------------------------------------------------------------
     4. GATILHOS DINÂMICOS DE URGÊNCIA E ESCASSEZ
     ------------------------------------------------------------------------ */
  function initUrgencyTicker() {
    const activityText = document.getElementById('live-activity-text');
    const spotsLeftEl = document.getElementById('spots-left');
    const percentEl = document.getElementById('vacancy-percent');
    const barEl = document.getElementById('vacancy-bar');

    if (activityText) {
      let idx = 0;
      setInterval(() => {
        idx = (idx + 1) % URGENCY_MESSAGES.length;
        activityText.textContent = URGENCY_MESSAGES[idx];
      }, 3500);
    }

    // Simula preenchimento gradual das últimas vagas para reforçar escassez imediata
    if (spotsLeftEl && percentEl && barEl) {
      let spots = 14;
      let percent = 94;

      setTimeout(() => {
        spots = 11;
        percent = 96;
        spotsLeftEl.textContent = `${spots} vagas`;
        percentEl.textContent = `${percent}% PREENCHIDO`;
        barEl.style.width = `${percent}%`;
      }, 6000);

      setTimeout(() => {
        spots = 9;
        percent = 97;
        spotsLeftEl.textContent = `${spots} vagas`;
        percentEl.textContent = `${percent}% PREENCHIDO`;
        barEl.style.width = `${percent}%`;
      }, 15000);
    }
  }

  /* ------------------------------------------------------------------------
     5. RASTREAMENTO DE CLIQUE NO WHATSAPP (CUSTOM + LEAD PADRÃO)
     ------------------------------------------------------------------------ */
  function trackWhatsAppClick(ctaLocation) {
    if (!isTrackingAllowed() || typeof window.fbq !== 'function') {
      return;
    }

    try {
      const utms = captureCampaignUtms();
      const payload = Object.assign(
        {
          cta_location: ctaLocation || 'hero-main',
          destination: 'whatsapp_community',
        },
        utms
      );
      window.fbq('trackCustom', 'WhatsAppJoinClick', payload);
      window.fbq('track', 'Lead', payload);
    } catch {
      // Nunca bloqueia o redirecionamento para o WhatsApp
    }
  }

  /* ------------------------------------------------------------------------
     6. INICIALIZAÇÃO
     ------------------------------------------------------------------------ */
  function init() {
    captureCampaignUtms();
    updateConsentStatusLabel();
    initUrgencyTicker();

    if (isTrackingAllowed()) {
      loadMetaPixelIfConfigured();
    }

    document.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const waLink = target.closest('[data-whatsapp-cta]');
      if (waLink) {
        trackWhatsAppClick(waLink.getAttribute('data-whatsapp-cta'));
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

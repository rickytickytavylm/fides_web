/**
 * Центральный конфиг портала ЯКатолик.
 * Основной API — Timeweb. Railway — запас, если twc1.net недоступен (VPN).
 */
(function (global) {
  'use strict';

  var TIMEWEB = 'https://rickytickytavylm-fides-at-ratio-server-d4c9.twc1.net';
  var RAILWAY = 'https://fides-at-ratioserver-production.up.railway.app';

  var params = {};
  try {
    params = Object.fromEntries(new URLSearchParams(location.search));
  } catch (e) {}

  var override = global.VeraConfigOverride || {};

  global.VeraConfig = {
    BRAND: 'ЯКатолик',
    ARCHIVE_API_BASE: override.ARCHIVE_API_BASE || params.archive || TIMEWEB,
    ARCHIVE_API_FALLBACKS: override.ARCHIVE_API_FALLBACKS || [TIMEWEB, RAILWAY],
    TEMPLES_API_BASE: override.TEMPLES_API_BASE || params.api || TIMEWEB,
    TEMPLES_MODE: override.TEMPLES_MODE || params.mode || 'auto',
    TEMPLES_SEARCH_PATH: '/api/temples/search',
    TEMPLES_STATS_PATH: '/api/temples/stats',
  };
})(window);

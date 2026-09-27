/**
 * Центральный конфиг портала ЯКатолик.
 * Прод API — Timeweb App Platform (епархия). Railway больше не основной.
 *
 * Переопределение без правки кода:
 *   window.VeraConfigOverride = { ARCHIVE_API_BASE: 'https://…' };
 *   или ?archive=https://…
 */
(function (global) {
  'use strict';

  var TIMEWEB = 'https://rickytickytavylm-fides-at-ratio-server-d4c9.twc1.net';
  var DEFAULT_ARCHIVE = TIMEWEB;
  var DEFAULT_TEMPLES = TIMEWEB;

  var params = {};
  try {
    params = Object.fromEntries(new URLSearchParams(location.search));
  } catch (e) {}

  var override = global.VeraConfigOverride || {};

  var config = {
    BRAND: 'ЯКатолик',
    ARCHIVE_API_BASE: override.ARCHIVE_API_BASE || params.archive || DEFAULT_ARCHIVE,
    /** Без Railway/sslip — чтобы трафик не уезжал «тихо» на старый бэкенд */
    ARCHIVE_API_FALLBACKS: override.ARCHIVE_API_FALLBACKS || [TIMEWEB],
    TEMPLES_API_BASE: override.TEMPLES_API_BASE || params.api || DEFAULT_TEMPLES,
    TEMPLES_MODE: override.TEMPLES_MODE || params.mode || 'auto',
    TEMPLES_SEARCH_PATH: '/api/temples/search',
    TEMPLES_STATS_PATH: '/api/temples/stats',
  };

  global.VeraConfig = config;
})(window);

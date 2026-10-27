/**
 * Центральный конфиг портала Рускатолик.
 * Прод API — только Timeweb (епархия). Без Railway.
 */
(function (global) {
  'use strict';

  var TIMEWEB = 'https://rickytickytavylm-fides-at-ratio-server-d4c9.twc1.net';
  /* Тот же Timeweb, если прямой адрес не ответил. */
  var PROXY = 'https://portal.72-56-99-181.sslip.io';

  var params = {};
  try {
    params = Object.fromEntries(new URLSearchParams(location.search));
  } catch (e) {}

  var override = global.VeraConfigOverride || {};

  global.VeraConfig = {
    BRAND: 'Рускатолик',
    ARCHIVE_API_BASE: override.ARCHIVE_API_BASE || params.archive || TIMEWEB,
    ARCHIVE_API_FALLBACKS: override.ARCHIVE_API_FALLBACKS || [PROXY],
    TEMPLES_API_BASE: override.TEMPLES_API_BASE || params.api || TIMEWEB,
    TEMPLES_MODE: override.TEMPLES_MODE || params.mode || 'auto',
    TEMPLES_SEARCH_PATH: '/api/temples/search',
    TEMPLES_STATS_PATH: '/api/temples/stats',
  };
})(window);

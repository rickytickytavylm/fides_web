/**
 * Центральный конфиг портала ЯКатолик.
 * При передаче заказчику: достаточно поменять TEMPLES_API_BASE
 * (и при необходимости ARCHIVE_API_BASE) на его Python-сервер.
 *
 * Переопределение без правки кода:
 *   window.VeraConfigOverride = { TEMPLES_API_BASE: 'https://his.api' };
 *   или ?api=https://his.api
 */
(function (global) {
  'use strict';

  var DEFAULT_ARCHIVE =
    'https://fides.186-246-11-81.sslip.io'; /* текущий прокси архива / чата */
  var DEFAULT_TEMPLES = DEFAULT_ARCHIVE; /* тот же хост, пока нет его Python */

  var params = {};
  try {
    params = Object.fromEntries(new URLSearchParams(location.search));
  } catch (e) {}

  var override = global.VeraConfigOverride || {};

  var config = {
    BRAND: 'ЯКатолик',
    ARCHIVE_API_BASE: override.ARCHIVE_API_BASE || params.archive || DEFAULT_ARCHIVE,
    /** База для карты храмов — сюда он подключает свой Python */
    TEMPLES_API_BASE: override.TEMPLES_API_BASE || params.api || DEFAULT_TEMPLES,
    /**
     * Режим карты:
     *  - 'live'  — только API
     *  - 'demo'  — только демо-точки (без сети)
     *  - 'auto'  — API, при ошибке/пусто → демо
     */
    TEMPLES_MODE: override.TEMPLES_MODE || params.mode || 'auto',
    TEMPLES_SEARCH_PATH: '/api/temples/search',
    TEMPLES_STATS_PATH: '/api/temples/stats',
  };

  global.VeraConfig = config;
})(window);

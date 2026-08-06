/**
 * Адаптер карты храмов.
 * Контракт ответа — тот же, что уже использует приложение ЯКатолик / Вера и Разум:
 *
 *   GET {TEMPLES_API_BASE}/api/temples/search?bbox=lonMin,latMin,lonMax,latMax
 *   → { features: GeoJSON-like[], source?: string }
 *
 * Feature:
 *   geometry.coordinates: [lon, lat]
 *   properties.CompanyMetaData: { id, name, address, City, Diocese, Kind, Phones, Hours, url, email, Photos, Tags, description }
 *
 * Его Python-серверу достаточно отдавать этот JSON — фронт подхватит без правок UI.
 */
(function (global) {
  'use strict';

  var C = global.VeraConfig || {};

  /** Демо-точки (Москва + крупные города) — визуал без бэкенда */
  var DEMO_FEATURES = [
    demo('cathmos-st-louis', 'Храм св. Людовика', 'ул. Малая Лубянка, 12', 'Москва', 'Архиепархия Божией Матери', 37.6289, 55.7609, 'parish'),
    demo('cathmos-immaculate', 'Собор Непорочного Зачатия', 'ул. Малая Грузинская, 27/13', 'Москва', 'Архиепархия Божией Матери', 37.5715, 55.7672, 'cathedral'),
    demo('cathmos-peterpaul', 'Храм свв. Петра и Павла', 'ул. Милутинский пер., 18', 'Москва', 'Архиепархия Божией Матери', 37.6335, 55.7658, 'parish'),
    demo('spb-assumption', 'Храм Успения Пресвятой Девы Марии', '1-я Красноармейская ул., 11', 'Санкт-Петербург', 'Архиепархия Божией Матери', 30.3122, 59.9158, 'parish'),
    demo('saratov-cathedral', 'Кафедральный собор свв. Петра и Павла', 'ул. Университетская, 70/76', 'Саратов', 'Епархия св. Климента', 46.0345, 51.5312, 'cathedral'),
    demo('nsk-cathedral', 'Кафедральный собор Преображения Господня', 'ул. Максима Горького, 106', 'Новосибирск', 'Преображенская епархия', 82.9211, 55.0302, 'cathedral'),
    demo('irk-cathedral', 'Кафедральный собор Непорочного Сердца БМ', 'ул. Грибоедова, 110', 'Иркутск', 'Епархия св. Иосифа', 104.2806, 52.2869, 'cathedral'),
    demo('kaliningrad-family', 'Храм Святого Семейства', 'ул. Богдана Хмельницкого, 63а', 'Калининград', 'Архиепархия Божией Матери', 20.5103, 54.7104, 'parish'),
  ];

  function demo(id, name, address, city, diocese, lon, lat, kind) {
    return {
      geometry: { coordinates: [lon, lat] },
      properties: {
        CompanyMetaData: {
          id: id,
          name: name,
          address: address,
          City: city,
          Diocese: diocese,
          Kind: kind,
          Tags: [kind === 'cathedral' ? 'кафедральный' : 'приход'],
          description: 'Демо-точка портала. Подключите свой API — и здесь появятся ваши данные.',
          Phones: [],
          Photos: [],
          Source: 'demo',
        },
      },
    };
  }

  function featureToTemple(feature) {
    var meta = feature && feature.properties && feature.properties.CompanyMetaData;
    var coords = feature && feature.geometry && feature.geometry.coordinates;
    if (!meta || !coords || coords.length < 2) return null;
    var phone = meta.Phones && meta.Phones[0] && meta.Phones[0].formatted;
    var hours = meta.Hours && meta.Hours.text;
    return {
      id: String(meta.id || coords[0] + ',' + coords[1]),
      name: meta.name || 'Католический храм',
      address: meta.address || '',
      city: meta.City || '',
      diocese: meta.Diocese || '',
      kind: meta.Kind || 'parish',
      latitude: Number(coords[1]),
      longitude: Number(coords[0]),
      phone: phone || '',
      website: meta.url || '',
      email: meta.email || '',
      hours: hours || '',
      description: meta.description || '',
      imageUrls: Array.isArray(meta.Photos) ? meta.Photos.filter(Boolean) : [],
      tags: Array.isArray(meta.Tags) ? meta.Tags.filter(Boolean) : [],
      source: meta.Source || 'api',
    };
  }

  function normalizePack(data) {
    var features = (data && data.features) || [];
    var byId = {};
    var list = [];
    for (var i = 0; i < features.length; i++) {
      var t = featureToTemple(features[i]);
      if (!t || byId[t.id]) continue;
      byId[t.id] = true;
      list.push(t);
    }
    return { temples: list, source: (data && data.source) || 'api', demo: false };
  }

  function demoPack() {
    return normalizePack({ features: DEMO_FEATURES, source: 'demo' });
  }

  function searchTemples(bbox, options) {
    options = options || {};
    var mode = C.TEMPLES_MODE || 'auto';

    if (mode === 'demo') {
      return Promise.resolve(filterByBbox(demoPack(), bbox));
    }

    var base = (C.TEMPLES_API_BASE || '').replace(/\/$/, '');
    var path = C.TEMPLES_SEARCH_PATH || '/api/temples/search';
    var url = base + path + '?bbox=' + encodeURIComponent(bbox.join(','));

    return fetch(url, { signal: options.signal })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function (data) {
        var pack = normalizePack(data);
        if (!pack.temples.length && mode === 'auto') {
          var d = filterByBbox(demoPack(), bbox);
          d.fallback = true;
          return d;
        }
        return pack;
      })
      .catch(function (err) {
        if (mode === 'live') throw err;
        var d = filterByBbox(demoPack(), bbox);
        d.fallback = true;
        d.error = String(err && err.message ? err.message : err);
        return d;
      });
  }

  function filterByBbox(pack, bbox) {
    if (!bbox || bbox.length !== 4) return pack;
    var lonMin = bbox[0], latMin = bbox[1], lonMax = bbox[2], latMax = bbox[3];
    var filtered = pack.temples.filter(function (t) {
      return t.longitude >= lonMin && t.longitude <= lonMax &&
             t.latitude >= latMin && t.latitude <= latMax;
    });
    // если в видимой области пусто — всё равно покажем демо (для первого кадра)
    if (!filtered.length && pack.source === 'demo') {
      return { temples: pack.temples, source: 'demo', demo: true };
    }
    return { temples: filtered, source: pack.source, demo: pack.source === 'demo' };
  }

  function getStats() {
    var base = (C.TEMPLES_API_BASE || '').replace(/\/$/, '');
    var path = C.TEMPLES_STATS_PATH || '/api/temples/stats';
    return fetch(base + path)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .catch(function () {
        return { count: DEMO_FEATURES.length, source: 'demo' };
      });
  }

  global.VeraTemples = {
    search: searchTemples,
    stats: getStats,
    featureToTemple: featureToTemple,
    DEMO_FEATURES: DEMO_FEATURES,
  };
})(window);

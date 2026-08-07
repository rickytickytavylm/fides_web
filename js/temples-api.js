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
    mkFeature({
      id: 'cathmos-immaculate', kind: 'cathedral',
      name: 'Кафедральный собор Непорочного Зачатия Пресвятой Девы Марии',
      address: 'ул. Малая Грузинская, 27/13', city: 'Москва',
      diocese: 'Архиепархия Божией Матери', lon: 37.5715, lat: 55.7672,
      hours: 'Пн–Пт 8:00–20:00 · Сб–Вс 8:00–21:00', url: 'https://www.cathedral.ru',
      photo: 'moscow-cathedral.jpg',
      description: 'Крупнейший католический храм России — неоготическая базилика 1911 года и кафедра Архиепархии Божией Матери.',
    }),
    mkFeature({
      id: 'cathmos-st-louis', kind: 'parish',
      name: 'Храм святого Людовика Французского',
      address: 'ул. Малая Лубянка, 12', city: 'Москва',
      diocese: 'Архиепархия Божией Матери', lon: 37.6289, lat: 55.7609,
      hours: 'Ежедневно 8:00–20:00',
      photo: 'moscow-louis.jpg',
      description: 'Один из старейших действующих католических храмов Москвы в стиле классицизма (1830-е годы).',
    }),
    mkFeature({
      id: 'cathmos-peterpaul', kind: 'parish',
      name: 'Храм святых апостолов Петра и Павла',
      address: 'Милютинский пер., 18с4', city: 'Москва',
      diocese: 'Архиепархия Божией Матери', lon: 37.6335, lat: 55.7658,
      photo: 'moscow-peterpaul.jpg',
      description: 'Исторический католический храм в Милютинском переулке — памятник архитектуры XIX века.',
    }),
    mkFeature({
      id: 'spb-catherine', kind: 'cathedral',
      name: 'Базилика святой Екатерины Александрийской',
      address: 'Невский пр., 32–34', city: 'Санкт-Петербург',
      diocese: 'Архиепархия Божией Матери', lon: 30.3324, lat: 59.9350,
      hours: 'Ежедневно 8:00–20:00',
      photo: 'people-prayer.webp',
      description: 'Единственная в России малая базилика — храм XVIII века на Невском проспекте.',
    }),
    mkFeature({
      id: 'spb-assumption', kind: 'parish',
      name: 'Храм Успения Пресвятой Девы Марии',
      address: '1-я Красноармейская ул., 11', city: 'Санкт-Петербург',
      diocese: 'Архиепархия Божией Матери', lon: 30.3122, lat: 59.9158,
      photo: 'scale_art.webp',
      description: 'Католический храм Успения Пресвятой Девы Марии в Санкт-Петербурге.',
    }),
    demo('saratov-cathedral', 'Кафедральный собор свв. Петра и Павла', 'ул. Университетская, 70/76', 'Саратов', 'Епархия св. Климента', 46.0345, 51.5312, 'cathedral'),
    demo('nsk-cathedral', 'Кафедральный собор Преображения Господня', 'ул. Максима Горького, 106', 'Новосибирск', 'Преображенская епархия', 82.9211, 55.0302, 'cathedral'),
    demo('irk-cathedral', 'Кафедральный собор Непорочного Сердца БМ', 'ул. Грибоедова, 110', 'Иркутск', 'Епархия св. Иосифа', 104.2806, 52.2869, 'cathedral'),
    demo('kaliningrad-family', 'Храм Святого Семейства', 'ул. Богдана Хмельницкого, 63а', 'Калининград', 'Архиепархия Божией Матери', 20.5103, 54.7104, 'parish'),
  ];

  function mkFeature(o) {
    return {
      geometry: { coordinates: [o.lon, o.lat] },
      properties: {
        CompanyMetaData: {
          id: o.id,
          name: o.name,
          address: o.address,
          City: o.city,
          Diocese: o.diocese,
          Kind: o.kind,
          Tags: o.tags || [o.kind === 'cathedral' ? 'кафедральный' : 'приход'],
          description: o.description || '',
          Phones: o.phone ? [{ formatted: o.phone }] : [],
          Hours: o.hours ? { text: o.hours } : undefined,
          url: o.url || '',
          Photos: o.photo ? [o.photo] : [],
          Source: 'demo',
        },
      },
    };
  }

  function demo(id, name, address, city, diocese, lon, lat, kind) {
    return mkFeature({
      id: id, name: name, address: address, city: city,
      diocese: diocese, lon: lon, lat: lat, kind: kind,
      description: 'Католический приход. Точные данные появятся после подключения актуальной базы приходов.',
    });
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

  /**
   * Локальные фото — директивная подстановка по id/имени/адресу.
   * Не зависит от API: если храм узнан, всегда ставим наш jpg.
   */
  var LOCAL_PHOTOS = [
    {
      file: 'moscow-cathedral.jpg',
      ids: ['cathmos-immaculate'],
      test: function (t) {
        var n = String(t.name || '').toLowerCase();
        var a = String(t.address || '').toLowerCase();
        var c = String(t.city || '').toLowerCase();
        if (c && c.indexOf('моск') === -1) return false;
        return (
          n.indexOf('непорочн') !== -1 ||
          n.indexOf('immaculate') !== -1 ||
          a.indexOf('грузинск') !== -1 ||
          (n.indexOf('кафедральн') !== -1 && (a.indexOf('грузин') !== -1 || n.indexOf('зачат') !== -1))
        );
      }
    },
    {
      file: 'moscow-louis.jpg',
      ids: ['cathmos-st-louis'],
      test: function (t) {
        var n = String(t.name || '').toLowerCase();
        return n.indexOf('людовик') !== -1 || n.indexOf('louis') !== -1;
      }
    },
    {
      file: 'moscow-peterpaul.jpg',
      ids: ['cathmos-peterpaul'],
      test: function (t) {
        var n = String(t.name || '').toLowerCase();
        var c = String(t.city || '').toLowerCase();
        var a = String(t.address || '').toLowerCase();
        if (c && c.indexOf('моск') === -1 && a.indexOf('милютин') === -1) return false;
        return (
          (n.indexOf('петра') !== -1 && n.indexOf('павл') !== -1) ||
          a.indexOf('милютин') !== -1
        );
      }
    }
  ];

  function localPhotoFor(t) {
    if (!t) return '';
    var id = String(t.id || '');
    for (var i = 0; i < LOCAL_PHOTOS.length; i++) {
      var rule = LOCAL_PHOTOS[i];
      if (rule.ids.indexOf(id) !== -1) return rule.file;
      if (rule.test(t)) return rule.file;
    }
    return '';
  }

  function attachLocalPhoto(t) {
    var file = localPhotoFor(t);
    if (file) t.imageUrls = [file];
    return t;
  }

  function normalizePack(data) {
    var features = (data && data.features) || [];
    var byId = {};
    var list = [];
    for (var i = 0; i < features.length; i++) {
      var t = featureToTemple(features[i]);
      if (!t || byId[t.id]) continue;
      attachLocalPhoto(t);
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

/**
 * Данные фотостока: seed (тестовая папка) + localStorage админки.
 */
(function (global) {
  'use strict';

  var MEDIA_KEY = 'yak_admin_media';
  var PHOTOGRAPHERS_KEY = 'yak_admin_photographers';
  var cache = null;

  function readLs(key) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function normalizePhoto(p) {
    if (!p) return null;
    var tags = Array.isArray(p.tags)
      ? p.tags
      : String(p.tags || '')
          .split(',')
          .map(function (t) { return t.trim(); })
          .filter(Boolean);
    return {
      id: String(p.id || ''),
      url: p.url || p.thumb || '',
      thumb: p.thumb || p.url || '',
      tags: tags,
      photographerId: p.photographerId || '',
      photographerSlug: p.photographerSlug || '',
      photographerName: p.photographerName || p.ownerName || '',
      ownerEmail: p.ownerEmail || '',
      status: p.status || 'approved',
      createdAt: p.createdAt || p.updatedAt || '',
      license: p.license || 'CC BY 4.0',
      title: p.title || '',
    };
  }

  function normalizePhotographer(p) {
    if (!p) return null;
    return {
      id: String(p.id || ''),
      name: p.name || '',
      slug: p.slug || '',
      email: p.email || '',
      photo: p.photo || '',
      bio: p.bio || '',
      social: Object.assign({ vk: '', tg: '', max: '', pinterest: '', site: '' }, p.social || {}),
      tagSlug: p.tagSlug || (p.slug ? p.slug + '-photos' : ''),
      createdAt: p.createdAt || '',
      updatedAt: p.updatedAt || '',
    };
  }

  function mergeData(seed) {
    var photographers = {};
    (seed.photographers || []).forEach(function (p) {
      var n = normalizePhotographer(p);
      if (n && n.id) photographers[n.id] = n;
    });
    var lsPh = readLs(PHOTOGRAPHERS_KEY) || [];
    lsPh.forEach(function (p) {
      var n = normalizePhotographer(p);
      if (n && n.id) photographers[n.id] = n;
    });

    var photosMap = {};
    (seed.photos || []).forEach(function (p) {
      var n = normalizePhoto(p);
      if (n && n.id && n.url) photosMap[n.id] = n;
    });
    var lsMedia = readLs(MEDIA_KEY) || [];
    lsMedia.forEach(function (m) {
      if (m.kind && m.kind !== 'image') return;
      var n = normalizePhoto(m);
      if (!n || !n.id || !n.url) return;
      // только approved на публичной витрине
      if (n.status && n.status !== 'approved') return;
      photosMap[n.id] = n;
    });

    var photos = Object.keys(photosMap).map(function (k) { return photosMap[k]; });
    photos.sort(function (a, b) {
      return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
    });

    return {
      photographers: Object.keys(photographers).map(function (k) { return photographers[k]; }),
      photos: photos,
    };
  }

  function load() {
    if (cache) return Promise.resolve(cache);
    return fetch('assets/photostock/seed.json?v=' + (global.YAK_BUILD || '1'))
      .then(function (r) { return r.ok ? r.json() : { photographers: [], photos: [] }; })
      .catch(function () { return { photographers: [], photos: [] }; })
      .then(function (seed) {
        cache = mergeData(seed || { photographers: [], photos: [] });
        return cache;
      });
  }

  function invalidate() { cache = null; }

  function popularTags(photos, limit) {
    var counts = {};
    (photos || []).forEach(function (p) {
      (p.tags || []).forEach(function (t) {
        var key = String(t || '').trim().toLowerCase();
        if (!key) return;
        if (!counts[key]) counts[key] = { tag: String(t).trim(), count: 0 };
        counts[key].count += 1;
      });
    });
    return Object.keys(counts)
      .map(function (k) { return counts[k]; })
      .sort(function (a, b) { return b.count - a.count || a.tag.localeCompare(b.tag, 'ru'); })
      .slice(0, limit || 10);
  }

  function searchPhotos(photos, q) {
    q = String(q || '').trim().toLowerCase();
    if (!q) return photos.slice();
    return photos.filter(function (p) {
      var hay = ((p.tags || []).join(' ') + ' ' + (p.photographerName || '') + ' ' + (p.title || '')).toLowerCase();
      return hay.indexOf(q) !== -1;
    });
  }

  function byTag(photos, tag) {
    tag = String(tag || '').trim().toLowerCase();
    return photos.filter(function (p) {
      return (p.tags || []).some(function (t) { return String(t).toLowerCase() === tag; });
    });
  }

  function photographerBySlug(list, slug) {
    slug = String(slug || '').toLowerCase();
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].slug || '').toLowerCase() === slug) return list[i];
    }
    return null;
  }

  function photoById(list, id) {
    id = String(id || '');
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].id) === id) return list[i];
    }
    return null;
  }

  function recentPhotographers(data, limit) {
    var counts = {};
    var latest = {};
    (data.photos || []).forEach(function (p) {
      var key = p.photographerId || p.photographerSlug || p.photographerName;
      if (!key) return;
      counts[key] = (counts[key] || 0) + 1;
      if (!latest[key] || String(p.createdAt) > String(latest[key].createdAt)) {
        latest[key] = p;
      }
    });
    var phMap = {};
    (data.photographers || []).forEach(function (p) { phMap[p.id] = p; phMap[p.slug] = p; });

    return Object.keys(latest)
      .map(function (key) {
        var sample = latest[key];
        var ph =
          phMap[sample.photographerId] ||
          phMap[sample.photographerSlug] ||
          null;
        return {
          id: (ph && ph.id) || sample.photographerId || key,
          name: (ph && ph.name) || sample.photographerName || 'Фотограф',
          slug: (ph && ph.slug) || sample.photographerSlug || '',
          photo: (ph && ph.photo) || '',
          count: counts[key] || 0,
          latestAt: sample.createdAt || '',
        };
      })
      .filter(function (p) { return p.slug; })
      .sort(function (a, b) { return String(b.latestAt).localeCompare(String(a.latestAt)); })
      .slice(0, limit || 6);
  }

  function initials(name) {
    return String(name || '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(function (w) { return w.charAt(0); })
      .join('')
      .toUpperCase();
  }

  global.YakPhotostock = {
    load: load,
    invalidate: invalidate,
    popularTags: popularTags,
    searchPhotos: searchPhotos,
    byTag: byTag,
    photographerBySlug: photographerBySlug,
    photoById: photoById,
    recentPhotographers: recentPhotographers,
    initials: initials,
  };
})(window);

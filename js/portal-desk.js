/**
 * Публикации из админки (localStorage yak_desk) подмешиваются в блоки сайта.
 * Работает, когда портал и админка открыты с одного origin (localhost / один хост).
 */
(function (global) {
  'use strict';

  var KEY = 'yak_desk';

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : { articles: [], events: [], audio: [], video: [], churchDays: [], authors: [], authorLinks: [], photographers: [], videoChannels: [] };
    } catch (e) {
      return { articles: [], events: [], audio: [], video: [], churchDays: [], authors: [], authorLinks: [], photographers: [], videoChannels: [] };
    }
  }

  function published(list) {
    return (list || []).filter(function (x) { return !x.status || x.status === 'published'; });
  }

  function asArchiveItem(a) {
    var cat = a.category || (a.kind === 'news' ? 'news' : 'columns');
    return {
      id: a.id,
      title: a.title,
      excerpt: a.excerpt || '',
      contentHtml: a.contentHtml || (a.body ? '<p>' + String(a.body).replace(/\n+/g, '</p><p>') + '</p>' : ''),
      contentText: a.body || a.excerpt || '',
      image: a.image || a.cover || '',
      date: a.date || (a.createdAt || '').slice(0, 10),
      author: a.author || '',
      categories: [cat],
      categorySlugs: [cat],
      kind: 'desk',
    };
  }

  function articles(opts) {
    opts = opts || {};
    var cat = opts.category || '';
    return published(read().articles).filter(function (a) {
      if (opts.q) {
        var hay = ((a.title || '') + ' ' + (a.excerpt || '') + ' ' + (a.body || '')).toLowerCase();
        if (hay.indexOf(String(opts.q).toLowerCase()) === -1) return false;
      }
      if (!cat) return true;
      if (a.category === cat) return true;
      if (cat === 'news' && a.kind === 'news') return true;
      if (cat === 'columns' && a.kind === 'article') return true;
      return false;
    }).map(asArchiveItem);
  }

  function article(id) {
    id = String(id || '');
    var list = published(read().articles);
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].id) === id) return asArchiveItem(list[i]);
    }
    return null;
  }

  function applyVera() {
    var V = global.Vera;
    if (!V || V._deskApplied) return;
    V._deskApplied = true;
    var origGet = V.getArticles;
    var origOne = V.getArticle;
    var origContent = V.getContent;
    var hidden = {};
    (read().articles || []).forEach(function (a) {
      if (a.status && a.status !== 'published') hidden[String(a.id)] = true;
    });
    if (origGet) {
      V.getArticles = function (opts) {
        var extra = articles(opts);
        return origGet(opts).then(function (pack) {
          pack = pack || { items: [], total: 0 };
          var seen = {};
          extra.forEach(function (ex) { seen[String(ex.id)] = true; });
          var rest = (pack.items || []).filter(function (it) {
            var id = String(it.id || '');
            return !seen[id] && !hidden[id];
          });
          return { items: extra.concat(rest), total: extra.length + rest.length };
        }).catch(function () {
          return { items: extra, total: extra.length };
        });
      };
    }
    if (origOne) {
      V.getArticle = function (id) {
        if (hidden[String(id)]) return Promise.reject(new Error('hidden'));
        var local = article(id);
        if (local) return Promise.resolve(local);
        return origOne(id);
      };
    }
    if (origContent) {
      V.getContent = function (id) {
        if (hidden[String(id)]) return Promise.reject(new Error('hidden'));
        var local = article(id);
        if (local) return Promise.resolve(local);
        return origContent(id);
      };
    }
  }

  function patchList(list, edits, toItem) {
    (edits || []).forEach(function (e) {
      var i = -1;
      for (var n = 0; n < list.length; n++) {
        if (String(list[n].id) === String(e.id) || String(list[n].date) === String(e.date || e.id)) {
          i = n;
          break;
        }
      }
      if (e.status && e.status !== 'published') {
        if (i !== -1) list.splice(i, 1);
        return;
      }
      var next = toItem ? toItem(e) : e;
      if (i === -1) list.unshift(next);
      else list[i] = Object.assign({}, list[i], next);
    });
  }

  function applyEvents() {
    var A = global.YakAfisha;
    if (!A || !A.EVENTS || A._deskApplied) return;
    A._deskApplied = true;
    patchList(A.EVENTS, read().events);
  }

  function applyVideos() {
    var V = global.YakVideos;
    if (!V || !V.items || V._deskApplied) return;
    V._deskApplied = true;
    patchList(V.items, read().video, function (v) {
      return {
        id: v.id,
        title: v.title,
        description: v.description || '',
        speaker: v.speaker || '',
        duration: v.duration || 0,
        type: v.type === 'short' ? 'short' : 'long',
        videoUrl: v.videoUrl,
        thumb: v.thumb || '',
        channelId: v.channelId || '',
        cycle: v.cycle || '',
      };
    });
  }

  function applyAudio() {
    var A = global.YakAudio;
    if (!A || !A.tracks || A._deskApplied) return;
    A._deskApplied = true;
    patchList(A.tracks, read().audio, function (t) {
      return {
        id: t.id,
        title: t.title,
        artist: t.artist || '',
        audio_key: t.audio_key || '',
        url: t.audioUrl || t.url,
        duration: t.duration || '',
        date: t.date || '',
        cover: t.cover || A.cover,
      };
    });
  }

  function findAuthor(list, slug) {
    slug = String(slug || '').toLowerCase();
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].slug || '').toLowerCase() === slug || String(list[i].id || '').toLowerCase() === slug) {
        return i;
      }
    }
    return -1;
  }

  function pushRecent(author, pub) {
    if (!author || !pub || !pub.slug) return;
    author.recent = author.recent || [];
    var exists = author.recent.some(function (p) { return p.slug === pub.slug; });
    if (!exists) author.recent.unshift({
      slug: pub.slug,
      title: pub.title || pub.slug,
      date: pub.date || '',
      excerpt: pub.excerpt || '',
    });
    author.count = author.recent.length;
    if (pub.date && (!author.latestDate || String(pub.date) > String(author.latestDate))) {
      author.latestDate = pub.date;
    }
  }

  function applyAuthors() {
    var A = global.YakAuthors;
    if (!A || A._deskApplied) return;
    if (!A.length && !(read().authors || []).length) return;
    A._deskApplied = true;
    var data = read();
    (data.authors || []).forEach(function (ov) {
      if (ov.status && ov.status !== 'published') return;
      var i = findAuthor(A, ov.slug || ov.id);
      if (i !== -1) {
        var recent = (A[i].recent || []).slice();
        A[i] = Object.assign({}, A[i], ov);
        if (ov.recent && ov.recent.length) {
          ov.recent.forEach(function (p) { pushRecent({ recent: recent }, p); });
          A[i].recent = recent;
          A[i].count = recent.length;
        } else {
          A[i].recent = recent;
        }
      } else if (ov.slug || ov.name) {
        A.push(Object.assign({
          slug: ov.slug || ov.id,
          name: ov.name || '',
          role: ov.role || '',
          bio: ov.bio || '',
          photo: ov.photo || '',
          socials: ov.socials || [],
          recent: ov.recent || [],
          count: (ov.recent || []).length,
        }, ov));
      }
    });
    (data.authorLinks || []).forEach(function (link) {
      if (!link || !link.authorSlug || !link.slug) return;
      var i = findAuthor(A, link.authorSlug);
      if (i === -1) return;
      pushRecent(A[i], link);
    });
    try {
      var mats = JSON.parse(localStorage.getItem('yak_admin_materials') || '[]');
      mats.forEach(function (m) {
        if (!m || (m.status && m.status !== 'published')) return;
        var tag = String(m.authorTag || m.authorName || '').trim();
        if (!tag) return;
        var i = findAuthor(A, tag);
        if (i === -1) {
          for (var j = 0; j < A.length; j++) {
            if (String(A[j].name || '').toLowerCase() === tag.toLowerCase()) { i = j; break; }
          }
        }
        if (i === -1) return;
        pushRecent(A[i], {
          slug: m.slug || m.id,
          title: m.title,
          date: (m.date || m.updatedAt || '').slice(0, 10),
          excerpt: m.excerpt || '',
        });
      });
    } catch (e) {}
  }

  function applyVideoChannels() {
    var V = global.YakVideos;
    if (!V) return;
    V.channels = V.channels || [];
    (read().videoChannels || []).forEach(function (ch) {
      if (ch.status && ch.status !== 'published') return;
      var found = false;
      for (var i = 0; i < V.channels.length; i++) {
        if (V.channels[i].id === ch.id) {
          V.channels[i] = Object.assign({}, V.channels[i], ch);
          found = true;
          break;
        }
      }
      if (!found) V.channels.push(ch);
    });
  }

  function applyCalendar() {
    var C = global.YakCalendar;
    if (!C || !C.DAYS || C._deskApplied) return;
    C._deskApplied = true;
    published(read().churchDays).forEach(function (day) {
      var found = false;
      for (var i = 0; i < C.DAYS.length; i++) {
        if (C.DAYS[i].date === day.date) {
          C.DAYS[i] = Object.assign({}, C.DAYS[i], day);
          found = true;
          break;
        }
      }
      if (!found) C.DAYS.push(day);
    });
    C.DAYS.sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
  }

  function apply() {
    applyVera();
    applyEvents();
    applyVideos();
    applyAudio();
    applyCalendar();
    applyAuthors();
    applyVideoChannels();
  }

  global.YakDesk = {
    read: read,
    articles: articles,
    article: article,
    apply: apply,
  };

  apply();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    setTimeout(apply, 0);
  }
})(window);

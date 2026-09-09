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
      return raw ? JSON.parse(raw) : { articles: [], events: [], audio: [], video: [], churchDays: [], authors: [], authorLinks: [], photographers: [], videoChannels: [], cycles: [] };
    } catch (e) {
      return { articles: [], events: [], audio: [], video: [], churchDays: [], authors: [], authorLinks: [], photographers: [], videoChannels: [] };
    }
  }

  function published(list) {
    return (list || []).filter(function (x) { return !x.status || x.status === 'published'; });
  }

  function dayOf(x) {
    return String((x && (x.date || x.createdAt)) || '').slice(0, 10);
  }

  /* Лента — по дате публикации, а не по дате последней правки в редакции. */
  function byDateDesc(list) {
    return list.map(function (x, i) { return { x: x, i: i }; }).sort(function (a, b) {
      var d = dayOf(b.x).localeCompare(dayOf(a.x));
      return d !== 0 ? d : a.i - b.i;
    }).map(function (w) { return w.x; });
  }

  function asArchiveItem(a) {
    var rubrics = (a.rubrics && a.rubrics.length) ? a.rubrics.slice() : [a.category || (a.kind === 'news' ? 'news' : 'columns')];
    var titles = {
      news: 'Новости', 'church-rus': 'Россия', sng: 'КЦ в мире', 'santa-sede': 'Святой Престол', world: 'Мир',
      columns: 'Статьи', spirituality: 'Духовность', 'obraz-zhizni': 'Образ жизни', kultura: 'Культура',
      history: 'История', biografii: 'Биографии', saints: 'Святые', bible: 'Библеистика', liturgy: 'Литургика',
      interview: 'Интервью', svidetelstva: 'Свидетельства', propovedi: 'Проповеди',
      music: 'Музыка', puteshestviya: 'Путешествия',
    };
    return {
      id: a.id,
      slug: a.slug || a.id,
      title: a.title,
      excerpt: (function () {
        var raw = a.excerptHtml || a.excerpt || '';
        if (!raw) return '';
        if (typeof document === 'undefined') return String(raw).replace(/<[^>]+>/g, ' ');
        var n = document.createElement('div');
        n.innerHTML = raw;
        return (n.textContent || '').replace(/\s+/g, ' ').trim();
      })(),
      excerptHtml: a.excerptHtml || (/<[a-z][\s\S]*>/i.test(a.excerpt || '') ? a.excerpt : ''),
      contentHtml: a.contentHtml || (a.body ? '<p>' + String(a.body).replace(/\n+/g, '</p><p>') + '</p>' : ''),
      contentText: a.body || a.excerpt || '',
      image: a.image || a.cover || '',
      date: a.date || (a.createdAt || '').slice(0, 10),
      author: a.author || '',
      authorSlug: a.authorSlug || '',
      authorSlugs: a.authorSlugs || (a.authorSlug ? [a.authorSlug] : []),
      categories: rubrics.map(function (id) { return titles[id] || id; }),
      categorySlugs: rubrics,
      kind: 'desk',
      cycleSlug: a.cycleSlug || a.cycleId || '',
      cycleOrder: a.cycleOrder || 0,
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
      var rubs = a.rubrics || a.categorySlugs || (a.category ? [a.category] : []);
      if (rubs.indexOf(cat) !== -1) return true;
      if (a.category === cat) return true;
      if (cat === 'news' && a.kind === 'news') return true;
      if (cat === 'columns' && a.kind !== 'news') return true;
      return false;
    }).map(asArchiveItem);
  }

  function mergeByDate(extra, items) {
    var seen = {};
    (extra || []).forEach(function (x) {
      seen[String(x.id)] = true;
      if (x.slug) seen[String(x.slug)] = true;
    });
    var rest = (items || []).filter(function (it) {
      return !seen[String(it.id)] && !seen[String(it.slug || '')];
    });
    return byDateDesc((extra || []).concat(rest));
  }

  function article(id) {
    id = String(id || '');
    var list = published(read().articles);
    for (var i = 0; i < list.length; i++) {
      if (String(list[i].id) === id || String(list[i].slug || '') === id) return asArchiveItem(list[i]);
    }
    return null;
  }

  function applyVera() {
    var V = global.Vera;
    if (!V) return;
    if (V.getArticles && V.getArticles._yakDesk) return;
    var origGet = V.getArticles;
    var origOne = V.getArticle;
    var origContent = V.getContent;
    var hidden = {};
    (read().articles || []).forEach(function (a) {
      if (a.status && a.status !== 'published') {
        hidden[String(a.id)] = true;
        if (a.slug) hidden[String(a.slug)] = true;
      }
    });
    if (origGet) {
      V.getArticles = function (opts) {
        var extra = articles(opts);
        return origGet(opts).then(function (pack) {
          pack = pack || { items: [], total: 0 };
          var seen = {};
          extra.forEach(function (ex) {
            seen[String(ex.id)] = true;
            if (ex.slug) seen[String(ex.slug)] = true;
            (pack.items || []).forEach(function (it) {
              if (String(it.id) === String(ex.id) || (ex.slug && String(it.slug) === String(ex.slug))) {
                if (!ex.image && it.image) ex.image = it.image;
              }
            });
          });
          var rest = (pack.items || []).filter(function (it) {
            var id = String(it.id || '');
            var slug = String(it.slug || '');
            return !seen[id] && !seen[slug] && !hidden[id] && !hidden[slug];
          });
          return { items: byDateDesc(extra.concat(rest)), total: extra.length + rest.length };
        }).catch(function () {
          return { items: extra, total: extra.length };
        });
      };
      V.getArticles._yakDesk = true;
    }
    if (origOne) {
      V.getArticle = function (id) {
        if (hidden[String(id)]) return Promise.reject(new Error('hidden'));
        var local = article(id);
        if (local) {
          if (local.image) return Promise.resolve(local);
          return origOne(id).then(function (remote) {
            if (remote && remote.image) local.image = remote.image;
            return local;
          }).catch(function () { return local; });
        }
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
        embedUrl: v.embedUrl || '',
        externalUrl: v.externalUrl || '',
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

  function patchAuthor(A, ov) {
    if (!ov || (ov.status && ov.status !== 'published')) return;
    var i = findAuthor(A, ov.slug || ov.id);
    var patch = Object.assign({}, ov);
    if (!patch.photo) delete patch.photo;
    if (i !== -1) {
      var recent = (A[i].recent || []).slice();
      A[i] = Object.assign({}, A[i], patch);
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
      }, patch));
    }
  }

  function applyAuthors() {
    var A = global.YakAuthors;
    if (!A) return;
    if (!A.length && !(read().authors || []).length) return;
    var data = read();
    if (!A._deskApplied) {
      A._deskApplied = true;
      (data.authors || []).forEach(function (ov) { patchAuthor(A, ov); });
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

    var V = global.Vera;
    if (!V || !V.getArticle || applyAuthors._remote) return;
    applyAuthors._remote = true;
    V.getArticle('yak-authors-data')
      .then(function (a) {
        var list = [];
        try { list = JSON.parse((a && (a.contentText || a.content || '')) || ''); } catch (e) { list = []; }
        if (Array.isArray(list)) list.forEach(function (ov) { patchAuthor(A, ov); });
        (read().authors || []).forEach(function (ov) { patchAuthor(A, ov); });
      })
      .catch(function () {});
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

  function applyGuides() {
    var G = global.YakGuides;
    if (!G || G._deskApplied) return;
    G._deskApplied = true;
    (read().guides || []).forEach(function (ov) {
      if (!ov || (ov.status && ov.status !== 'published')) return;
      var section = ov.section;
      if (!section && ov.id) {
        if (String(ov.id).indexOf('church') === 0) section = 'church';
        else if (String(ov.id).indexOf('spirit') === 0) section = 'spirit';
      }
      var tree = G[section];
      if (!tree) return;
      var nodeId = ov.nodeId;
      if (!nodeId && ov.id) {
        var parts = String(ov.id).split(/[:/]/);
        nodeId = parts[parts.length - 1];
      }
      if (!nodeId) return;

      if (nodeId === 'hub' || ov.kind === 'hub') {
        if (ov.title) tree.title = ov.title;
        if (ov.desc != null) tree.desc = ov.desc;
        if (ov.intro != null) tree.intro = ov.intro;
        return;
      }

      var nodes = tree.nodes || (tree.nodes = {});
      var node = nodes[nodeId];
      if (!node) {
        if (ov.kind !== 'page' && !ov.added) return;
        node = {
          type: 'page',
          title: ov.title || '',
          lead: ov.lead || '',
          contentHtml: ov.contentHtml || '',
          siblingsOf: ov.siblingsOf || '',
        };
        nodes[nodeId] = node;
        var parent = ov.siblingsOf && nodes[ov.siblingsOf];
        if (parent && parent.cards && !parent.cards.some(function (c) { return c.id === nodeId; })) {
          parent.cards.push({
            id: nodeId,
            title: ov.title || '',
            sub: ov.sub || '',
            image: ov.image || '',
          });
        }
      } else {
        if (ov.title) node.title = ov.title;
        if (ov.desc != null) node.desc = ov.desc;
        if (ov.lead != null) node.lead = ov.lead;
        if (ov.contentHtml) node.contentHtml = ov.contentHtml;
        if (ov.prayers && ov.prayers.length) node.prayers = ov.prayers;
      }

      function patchCards(list) {
        (list || []).forEach(function (c) {
          if (!c || c.id !== nodeId) return;
          if (ov.title) c.title = ov.title;
          if (ov.sub != null) c.sub = ov.sub;
          if (ov.image) c.image = ov.image;
        });
      }
      patchCards(tree.cards);
      Object.keys(nodes).forEach(function (k) { patchCards(nodes[k].cards); });
    });
  }

  var CYCLES_PAGE_SLUG = 'yak-cycles-data';

  function applyCycles() {
    var C = global.YakCycles;
    if (!C) return;
    var desk = published(read().cycles || []);
    if (C.merge && desk.length) C.merge(desk);

    var V = global.Vera;
    if (!V || !V.getArticle) {
      if (C._resolveReady) C._resolveReady();
      return;
    }
    if (applyCycles._once) return;
    applyCycles._once = true;
    var timer = setTimeout(function () { if (C._resolveReady) C._resolveReady(); }, 6000);
    V.getArticle(CYCLES_PAGE_SLUG)
      .then(function (a) {
        var raw = (a && (a.contentText || a.content || '')) || '';
        var list = [];
        try { list = JSON.parse(raw); } catch (e) { list = []; }
        if (Array.isArray(list) && C.merge) C.merge(list);
      })
      .catch(function () {})
      .then(function () {
        clearTimeout(timer);
        if (desk.length && C.merge) C.merge(desk);
        if (C._resolveReady) C._resolveReady();
      });
  }

  function apply() {
    applyVera();
    applyEvents();
    applyVideos();
    applyAudio();
    applyCalendar();
    applyAuthors();
    applyVideoChannels();
    applyGuides();
    applyCycles();
  }

  global.YakDesk = {
    read: read,
    articles: articles,
    article: article,
    mergeByDate: mergeByDate,
    byDateDesc: byDateDesc,
    apply: apply,
  };

  apply();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    setTimeout(apply, 0);
  }
})(window);

/**
 * API — 1:1 как в приложении (прокси VPS → Railway).
 * Классический скрипт: работает из file:// как админка.
 */
(function (global) {
  'use strict';

  // Как в Вера и Разум/src/config/api.js
  // Базу можно переопределить в js/config.js → ARCHIVE_API_BASE
  var RAILWAY_DIRECT = 'https://fides-at-ratioserver-production.up.railway.app';
  var PROXY_URL = 'https://fides.186-246-11-81.sslip.io';
  var USE_PROXY = true;

  var API_BASE =
    (global.VeraConfig && global.VeraConfig.ARCHIVE_API_BASE) ||
    (USE_PROXY ? PROXY_URL : RAILWAY_DIRECT);
  var INLINE_CDN = 'https://storage.yandexcloud.net/fidesetratio/ruscatholic/inline/';

  var ARCHIVE_CHIPS = [
    { slug: '', label: 'Все' },
    { slug: 'columns', label: 'Статьи' },
    { slug: 'news', label: 'Новости' },
    { slug: 'church-rus', label: 'Россия' },
    { slug: 'santa-sede', label: 'Святой Престол' },
    { slug: 'spirituality', label: 'Духовность' },
    { slug: 'saints', label: 'Святые' },
    { slug: 'voices', label: 'Голоса' },
    { slug: 'interview', label: 'Интервью' },
    { slug: 'svidetelstva', label: 'Свидетельства' },
    { slug: 'propovedi', label: 'Проповеди' },
    { slug: 'ask-priest', label: 'Вопрос священнику' },
    { slug: 'history', label: 'История' },
    { slug: 'polka', label: 'Книжная полка' },
  ];

  function apiGet(path) {
    return fetch(API_BASE + path).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  function articleKey(it) {
    return String((it && (it.id || it.linkOriginal || it.link || it.title)) || '');
  }

  function mergeArticlePacks(packs) {
    var seen = {};
    var items = [];
    var total = 0;
    (packs || []).forEach(function (pack) {
      total += Number(pack && pack.total) || 0;
      ((pack && pack.items) || []).forEach(function (it) {
        var key = articleKey(it);
        if (!key || seen[key]) return;
        seen[key] = true;
        items.push(it);
      });
    });
    items.sort(function (a, b) {
      return String(b.date || '').localeCompare(String(a.date || ''));
    });
    return { items: items, total: total };
  }

  function fetchArticlesRaw(opts) {
    opts = opts || {};
    var params = new URLSearchParams({
      page: String(opts.page || 1),
      limit: String(opts.limit || 20),
    });
    if (opts.category) params.set('category', opts.category);
    if (opts.q) params.set('q', opts.q);
    return apiGet('/api/archive/ruscatholic/articles?' + params);
  }

  /**
   * Таксономия на сервере (ruscatholicTaxonomy):
   * news→digest, santa-sede↔pope, propovedi по ANY(slugs), скрытие черновиков.
   */
  function getArticles(opts) {
    opts = opts || {};
    if (opts.category === 'pope') {
      opts = Object.assign({}, opts, { category: 'santa-sede' });
    }
    return fetchArticlesRaw(opts);
  }

  function getArticle(idOrSlug) {
    return apiGet('/api/archive/ruscatholic/articles/' + encodeURIComponent(idOrSlug)).then(function (pack) {
      return pack.article || pack;
    });
  }

  function getPages(opts) {
    opts = opts || {};
    var params = new URLSearchParams({
      page: String(opts.page || 1),
      limit: String(opts.limit || 50),
    });
    if (opts.q) params.set('q', opts.q);
    return apiGet('/api/archive/ruscatholic/pages?' + params);
  }

  function getPage(idOrSlug) {
    return apiGet('/api/archive/ruscatholic/pages/' + encodeURIComponent(idOrSlug)).then(function (pack) {
      return pack.page || pack.article || pack;
    });
  }

  /** Статья или статическая page — для внутренних ссылок с Рускатолик. */
  function getContent(idOrSlug) {
    return getArticle(idOrSlug).catch(function () {
      return getPage(idOrSlug);
    });
  }

  function getStats() {
    return apiGet('/api/archive/ruscatholic/stats');
  }

  function getVideos() {
    return apiGet('/api/content/videos');
  }

  function getDeviceId() {
    try {
      var key = 'vera_device_id';
      var id = localStorage.getItem(key);
      if (!id) {
        id = 'web_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem(key, id);
      }
      return id;
    } catch (e) {
      return 'web_anon';
    }
  }

  function parseSseBuffer(buffer, onEvent) {
    var parts = buffer.split('\n\n');
    var rest = parts.pop() || '';
    for (var i = 0; i < parts.length; i++) {
      var lines = parts[i].split('\n');
      for (var j = 0; j < lines.length; j++) {
        var line = lines[j];
        if (line.indexOf('data:') !== 0) continue;
        var payload = line.slice(5).trim();
        if (!payload) continue;
        try {
          onEvent(JSON.parse(payload));
        } catch (e) {}
      }
    }
    return rest;
  }

  /** Чат с ИИ — стриминг SSE (stream:true), тот же /api/chat */
  function sendChat(message, conversationHistory, onReplace) {
    return fetch(API_BASE + '/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      body: JSON.stringify({
        message: message,
        conversationHistory: conversationHistory || [],
        userId: getDeviceId(),
        stream: true,
      }),
    }).then(function (res) {
      if (!res.ok) {
        return res.json().then(function (data) {
          var err = new Error((data && data.error) || 'HTTP ' + res.status);
          err.status = res.status;
          err.data = data;
          throw err;
        }).catch(function (e) {
          if (e.status) throw e;
          var err = new Error('HTTP ' + res.status);
          err.status = res.status;
          throw err;
        });
      }

      var ctype = (res.headers.get('content-type') || '').toLowerCase();
      if (ctype.indexOf('application/json') !== -1) {
        return res.json().then(function (data) {
          if (typeof onReplace === 'function') onReplace(data.reply || '');
          return data;
        });
      }

      if (!res.body || !res.body.getReader) {
        // Fallback без стрима
        return fetch(API_BASE + '/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: message,
            conversationHistory: conversationHistory || [],
            userId: getDeviceId(),
          }),
        }).then(function (r2) {
          return r2.json().then(function (data) {
            if (!r2.ok) {
              var err = new Error((data && data.error) || 'HTTP ' + r2.status);
              err.status = r2.status;
              throw err;
            }
            if (typeof onReplace === 'function') onReplace(data.reply || '');
            return data;
          });
        });
      }

      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var buffer = '';
      var reply = '';
      var sources = [];
      var remaining;
      var limit;

      function readLoop() {
        return reader.read().then(function (result) {
          if (result.done) {
            return { reply: reply, sources: sources, remaining: remaining, limit: limit };
          }
          buffer += decoder.decode(result.value, { stream: true });
          buffer = parseSseBuffer(buffer, function (evt) {
            if (!evt || !evt.type) return;
            if (evt.type === 'replace' && typeof evt.text === 'string') {
              reply = evt.text;
              if (typeof onReplace === 'function') onReplace(reply);
            } else if (evt.type === 'done') {
              reply = evt.reply || reply;
              sources = Array.isArray(evt.sources) ? evt.sources : [];
              remaining = evt.remaining;
              limit = evt.limit;
              if (typeof onReplace === 'function') onReplace(reply);
            } else if (evt.type === 'error') {
              throw new Error(evt.error || 'Ошибка стрима');
            }
          });
          return readLoop();
        });
      }

      return readLoop();
    });
  }

  function getSchedule() {
    return apiGet('/api/schedule');
  }

  function formatDate(iso) {
    if (!iso) return '';
    var parts = String(iso).slice(0, 10).split('-');
    var y = parts[0];
    var m = parts[1];
    var d = parts[2];
    if (!y || !m || !d) return iso;
    var months = [
      'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
      'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
    ];
    return Number(d) + ' ' + months[Number(m) - 1] + ' ' + y;
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function encodeUrlPath(url) {
    try {
      // Кодируем кириллицу/пробелы в path — иначе <img> на iOS часто ломается.
      var m = String(url).match(/^(https?:\/\/[^\/]+)(\/[^?#]*)?(\?[^#]*)?(#.*)?$/i);
      if (!m) return url;
      var origin = m[1];
      var path = m[2] || '';
      var query = m[3] || '';
      var hash = m[4] || '';
      var encPath = path
        .split('/')
        .map(function (seg) {
          if (!seg) return '';
          try {
            return encodeURIComponent(decodeURIComponent(seg));
          } catch (e) {
            return encodeURIComponent(seg);
          }
        })
        .join('/');
      return origin + encPath + query + hash;
    } catch (e) {
      return url;
    }
  }

  function resolveInlineSrc(src) {
    if (!src) return null;
    var s = decodeEntities(String(src).trim());
    if (!s) return null;
    // protocol-relative
    if (s.indexOf('//') === 0) s = 'https:' + s;
    // старый домен Рускатолик (punycode) отдаёт HTML вместо картинок
    s = s.replace(
      /^https?:\/\/(xn--80aqecdrlilg\.xn--p1ai|www\.xn--80aqecdrlilg\.xn--p1ai)/i,
      'https://ruscatholic.org'
    );
    // относительные wp-uploads
    if (/^\/wp-content\//i.test(s)) s = 'https://ruscatholic.org' + s;
    var local = s.match(/(?:^|\/)images\/(p\d+-\d+\.webp)$/i);
    if (local) return INLINE_CDN + local[1];
    var already = s.match(/\/ruscatholic\/inline\/(p\d+-\d+\.webp)$/i);
    if (already) return INLINE_CDN + already[1];
    if (/^https?:\/\//i.test(s)) {
      if (/^http:\/\//i.test(s) && /ruscatholic\.org/i.test(s)) {
        s = 'https://' + s.slice(7);
      }
      return encodeUrlPath(s);
    }
    return null;
  }

  function decodeEntities(text) {
    return String(text || '')
      .replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(Number(n)); })
      .replace(/&#x([0-9a-f]+);/gi, function (_, h) { return String.fromCharCode(parseInt(h, 16)); })
      .replace(/&nbsp;/gi, ' ')
      .replace(/&quot;/gi, '"')
      .replace(/&laquo;/gi, '«')
      .replace(/&raquo;/gi, '»')
      .replace(/&mdash;/gi, '—')
      .replace(/&ndash;/gi, '–')
      .replace(/&hellip;/gi, '…')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>');
  }

  function stripTags(html) {
    return decodeEntities(
      String(html || '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/h[1-6]>/gi, '\n\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    );
  }

  var INTERNAL_HOSTS = {
    'ruscatholic.org': 1,
    'www.ruscatholic.org': 1,
    'xn--80aqecdrlilg.xn--p1ai': 1,
    'www.xn--80aqecdrlilg.xn--p1ai': 1,
    'fides-et-ratio.ru': 1,
    'www.fides-et-ratio.ru': 1,
  };

  var SKIP_INTERNAL_SLUGS = {
    category: 1,
    tag: 1,
    author: 1,
    feed: 1,
    page: 1,
    wpadmin: 1,
    'wp-admin': 1,
    'wp-content': 1,
    'wp-json': 1,
    'wp-login.php': 1,
  };

  function pageHref(item) {
    var id = item && (item.id != null ? item.id : item.slug);
    if (id == null || id === '') return 'pages.html';
    return 'static.html?id=' + encodeURIComponent(id);
  }

  /**
   * Безопасный href для инлайна:
   * — внутренние слаги Рускатолик → article.html?id=… (статья или page через fallback)
   * — http(s)/mailto/tel/# — оставляем
   * — javascript:/data: — режем
   */
  function resolveContentHref(href) {
    var raw = String(href || '').trim();
    if (!raw) return null;
    if (/^(javascript|data|vbscript):/i.test(raw)) return null;
    if (raw.charAt(0) === '#') return { href: raw, external: false };
    if (/^(mailto|tel):/i.test(raw)) return { href: raw, external: false };

    if (raw.indexOf('//') === 0) raw = 'https:' + raw;

    var path = '';
    var host = '';
    if (/^https?:\/\//i.test(raw)) {
      try {
        var u = new URL(raw);
        host = String(u.hostname || '').toLowerCase();
        path = u.pathname || '/';
        if (!INTERNAL_HOSTS[host]) {
          return { href: u.href, external: true };
        }
      } catch (e) {
        return null;
      }
    } else if (raw.charAt(0) === '/') {
      path = raw.split(/[?#]/)[0];
    } else if (/^[a-z0-9\-_%]+\/?$/i.test(raw)) {
      path = '/' + raw;
    } else {
      return null;
    }

    var parts = path.replace(/\/+$/, '').split('/').filter(Boolean);
    if (!parts.length) return { href: 'index.html', external: false };
    var slug = parts[parts.length - 1];
    try {
      slug = decodeURIComponent(slug);
    } catch (e2) {}
    slug = String(slug || '').toLowerCase();
    if (!slug || SKIP_INTERNAL_SLUGS[slug] || /\.(php|html?|xml|json|jpg|jpeg|png|webp|gif|pdf)$/i.test(slug)) {
      if (/^https?:\/\//i.test(raw)) return { href: raw, external: true };
      return null;
    }
    // Наши собственные URL уже вида article.html / static.html
    if (parts.length === 1 && /\.html$/i.test(parts[0])) {
      return { href: raw.replace(/^\//, ''), external: false };
    }
    return {
      href: 'article.html?id=' + encodeURIComponent(slug),
      external: false,
      internal: true,
    };
  }

  function sanitizeMarksOnly(fragment) {
    var s = String(fragment || '');
    s = s
      .replace(/<\s*b\b[^>]*>/gi, '[[B]]')
      .replace(/<\s*\/\s*b\s*>/gi, '[[/B]]')
      .replace(/<\s*strong\b[^>]*>/gi, '[[B]]')
      .replace(/<\s*\/\s*strong\s*>/gi, '[[/B]]')
      .replace(/<\s*i\b[^>]*>/gi, '[[I]]')
      .replace(/<\s*\/\s*i\s*>/gi, '[[/I]]')
      .replace(/<\s*em\b[^>]*>/gi, '[[I]]')
      .replace(/<\s*\/\s*em\s*>/gi, '[[/I]]')
      .replace(/<br\s*\/?>/gi, '[[BR]]');
    s = s.replace(/<[^>]+>/g, '');
    s = escapeHtml(decodeEntities(s));
    return s
      .replace(/\[\[B\]\]/g, '<strong>')
      .replace(/\[\[\/B\]\]/g, '</strong>')
      .replace(/\[\[I\]\]/g, '<em>')
      .replace(/\[\[\/I\]\]/g, '</em>')
      .replace(/\[\[BR\]\]/g, '<br />');
  }

  /** Оставляет безопасный инлайн: strong/em/b/i/br + безопасные <a> */
  function sanitizeInlineHtml(fragment) {
    var s = String(fragment || '');
    var links = [];
    // Сначала вынимаем <a>, чтобы не скормить их strip-у тегов; inner чистится вместе с остальным текстом.
    s = s.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi, function (_full, attrs, inner) {
      var hm = /href\s*=\s*(["'])(.*?)\1/i.exec(attrs || '');
      if (!hm) hm = /href\s*=\s*([^\s>]+)/i.exec(attrs || '');
      var resolved = hm ? resolveContentHref(decodeEntities(hm[2] || hm[1] || '')) : null;
      if (!resolved) return inner || '';
      var idx = links.length;
      links.push(resolved);
      return '[[A' + idx + ']]' + (inner || '') + '[[/A]]';
    });
    s = sanitizeMarksOnly(s);
    return s.replace(/\[\[A(\d+)\]\]([\s\S]*?)\[\[\/A\]\]/g, function (_m, i, text) {
      var L = links[Number(i)];
      if (!L || !String(text || '').trim()) return text || '';
      return (
        '<a href="' +
        escapeHtml(L.href) +
        '"' +
        (L.external ? ' target="_blank" rel="noopener noreferrer"' : '') +
        '>' +
        text +
        '</a>'
      );
    });
  }

  function captionAfterImage(src, endIndex) {
    var window = src.slice(endIndex, endIndex + 500);
    // подпись сразу после img (как на Рускатолик: <figcaption>…</figcaption>)
    var cap = window.match(/^\s*(?:<\/[^>]+>\s*)*<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i);
    if (!cap) {
      cap = window.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i);
      // только если figcaption близко и до следующего абзаца/картинки
      if (cap) {
        var before = window.slice(0, cap.index);
        if (/<(p|h[1-6]|img|blockquote)\b/i.test(before)) return '';
      }
    }
    return cap ? stripTags(cap[1]).trim() : '';
  }

  /** WP-embed / «карточка статьи» = blockquote с одной ссылкой внутри */
  function embedLinkFromInner(inner) {
    var s = String(inner || '');
    var quoted = /<a\b[^>]*href\s*=\s*(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/i.exec(s);
    var hrefRaw = '';
    var label = '';
    if (quoted) {
      hrefRaw = decodeEntities(quoted[2] || '');
      label = stripTags(quoted[3] || '').trim();
    } else {
      var bare = /<a\b[^>]*href\s*=\s*([^\s>]+)[^>]*>([\s\S]*?)<\/a>/i.exec(s);
      if (!bare) return null;
      hrefRaw = decodeEntities(bare[1] || '');
      label = stripTags(bare[2] || '').trim();
    }
    var resolved = resolveContentHref(hrefRaw);
    if (!resolved || !label) return null;
    // Только если почти весь текст — это ссылка (не обычная цитата с упоминанием)
    var allText = stripTags(inner).trim();
    if (allText && label.length < allText.length * 0.6) return null;
    return {
      type: 'embed-link',
      text: label,
      href: resolved.href,
      external: !!resolved.external,
      html: sanitizeInlineHtml(inner),
    };
  }

  function htmlToBlocks(html) {
    var src = String(html || '');
    if (!src.trim()) return [];
    var re =
      /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>|<(p|h[1-6]|blockquote)\b[^>]*>([\s\S]*?)<\/\2>/gi;
    var blocks = [];
    var m;
    while ((m = re.exec(src))) {
      var full = m[0];
      if (/^<img/i.test(full)) {
        var uri = resolveInlineSrc(m[1]);
        if (uri) {
          var caption = captionAfterImage(src, m.index + full.length);
          blocks.push({ type: 'image', uri: uri, caption: caption || '' });
        }
        continue;
      }
      var tag = String(m[2] || '').toLowerCase();
      var inner = m[3] || '';
      var text = stripTags(inner).trim();
      if (!text) continue;
      if (tag === 'blockquote') {
        var embed = embedLinkFromInner(inner);
        if (embed) {
          blocks.push(embed);
          continue;
        }
      }
      var inline = sanitizeInlineHtml(inner);
      if (tag.indexOf('h') === 0) blocks.push({ type: 'heading', text: text, html: inline });
      else if (tag === 'blockquote') blocks.push({ type: 'quote', text: text, html: inline });
      else blocks.push({ type: 'body', text: text, html: inline });
    }
    return blocks;
  }

  function articleHref(item) {
    var id = item && item.id;
    if (id == null || id === '') return 'archive.html';
    // относительный путь — работает и из file://, и с Pages
    return 'article.html?id=' + encodeURIComponent(id);
  }

  function coverStyle(url) {
    if (!url) return '';
    var resolved = resolveInlineSrc(url) || String(url).trim();
    if (!resolved) return '';
    return 'style="--img:url(\'' + resolved.replace(/'/g, '%27') + '\')"';
  }

  global.Vera = {
    API_BASE: API_BASE,
    INLINE_CDN: INLINE_CDN,
    ARCHIVE_CHIPS: ARCHIVE_CHIPS,
    apiGet: apiGet,
    getArticles: getArticles,
    getArticle: getArticle,
    getPages: getPages,
    getPage: getPage,
    getContent: getContent,
    getStats: getStats,
    getVideos: getVideos,
    sendChat: sendChat,
    getDeviceId: getDeviceId,
    getSchedule: getSchedule,
    formatDate: formatDate,
    escapeHtml: escapeHtml,
    stripTags: stripTags,
    sanitizeInlineHtml: sanitizeInlineHtml,
    resolveContentHref: resolveContentHref,
    htmlToBlocks: htmlToBlocks,
    articleHref: articleHref,
    pageHref: pageHref,
    coverStyle: coverStyle,
  };
})(window);

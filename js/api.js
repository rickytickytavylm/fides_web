/**
 * API — 1:1 как в приложении (прокси VPS → Railway).
 * Классический скрипт: работает из file:// как админка.
 */
(function (global) {
  'use strict';

  // Как в Вера и Разум/src/config/api.js
  var RAILWAY_DIRECT = 'https://fides-at-ratioserver-production.up.railway.app';
  var PROXY_URL = 'https://fides.186-246-11-81.sslip.io';
  var USE_PROXY = true;

  var API_BASE = USE_PROXY ? PROXY_URL : RAILWAY_DIRECT;
  var INLINE_CDN = 'https://storage.yandexcloud.net/fidesetratio/ruscatholic/inline/';

  var ARCHIVE_CHIPS = [
    { slug: '', label: 'Все' },
    { slug: 'columns', label: 'Статьи' },
    { slug: 'spirituality', label: 'Духовность' },
    { slug: 'saints', label: 'Святые' },
    { slug: 'news', label: 'Новости' },
    { slug: 'church-rus', label: 'КЦ в России' },
    { slug: 'ask-priest', label: 'Вопрос священнику' },
    { slug: 'pray', label: 'Молитвы' },
    { slug: 'history', label: 'История' },
    { slug: 'interview', label: 'Интервью' },
    { slug: 'propovedi', label: 'Проповеди' },
    { slug: 'svidetelstva', label: 'Свидетельства' },
    { slug: 'polka', label: 'Книжная полка' },
  ];

  function apiGet(path) {
    return fetch(API_BASE + path).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  function getArticles(opts) {
    opts = opts || {};
    var params = new URLSearchParams({
      page: String(opts.page || 1),
      limit: String(opts.limit || 20),
    });
    if (opts.category) params.set('category', opts.category);
    if (opts.q) params.set('q', opts.q);
    return apiGet('/api/archive/ruscatholic/articles?' + params);
  }

  function getArticle(idOrSlug) {
    return apiGet('/api/archive/ruscatholic/articles/' + encodeURIComponent(idOrSlug)).then(function (pack) {
      return pack.article || pack;
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

  function resolveInlineSrc(src) {
    if (!src) return null;
    var s = String(src).trim();
    var local = s.match(/(?:^|\/)images\/(p\d+-\d+\.webp)$/i);
    if (local) return INLINE_CDN + local[1];
    var already = s.match(/\/ruscatholic\/inline\/(p\d+-\d+\.webp)$/i);
    if (already) return INLINE_CDN + already[1];
    if (/^https?:\/\//i.test(s)) return s;
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

  /** Оставляет только безопасный инлайн: strong/em/b/i/br */
  function sanitizeInlineHtml(fragment) {
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
    return 'style="--img:url(\'' + String(url).replace(/'/g, '%27') + '\')"';
  }

  global.Vera = {
    API_BASE: API_BASE,
    INLINE_CDN: INLINE_CDN,
    ARCHIVE_CHIPS: ARCHIVE_CHIPS,
    apiGet: apiGet,
    getArticles: getArticles,
    getArticle: getArticle,
    getStats: getStats,
    getVideos: getVideos,
    sendChat: sendChat,
    getDeviceId: getDeviceId,
    getSchedule: getSchedule,
    formatDate: formatDate,
    escapeHtml: escapeHtml,
    stripTags: stripTags,
    sanitizeInlineHtml: sanitizeInlineHtml,
    htmlToBlocks: htmlToBlocks,
    articleHref: articleHref,
    coverStyle: coverStyle,
  };
})(window);

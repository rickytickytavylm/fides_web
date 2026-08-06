(function () {
  'use strict';
  var V = window.Vera;
  if (!V) return;

  function qs(name) {
    var fromSearch = new URLSearchParams(location.search).get(name);
    if (fromSearch) return fromSearch;
    var hash = String(location.hash || '').replace(/^#/, '');
    var fromHash = new URLSearchParams(hash).get(name);
    return fromHash || null;
  }

  function linkifyHtml(html) {
    var URL_RE = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;
    return String(html || '').replace(URL_RE, function (raw) {
      var href = raw;
      if (href.indexOf('www.') === 0) href = 'https://' + href;
      href = href.replace(/[),.]+$/, '');
      var label = href.replace(/^https?:\/\//, '');
      return '<a href="' + href + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
    });
  }

  function renderBlocks(blocks) {
    return blocks
      .map(function (b) {
        if (b.type === 'image') {
          return (
            '<figure class="inline-figure archive-figure"><img src="' +
            V.escapeHtml(b.uri) +
            '" alt="' +
            V.escapeHtml(b.caption || '') +
            '" loading="lazy" />' +
            (b.caption
              ? '<figcaption>' + V.escapeHtml(b.caption) + '</figcaption>'
              : '') +
            '</figure>'
          );
        }
        var inner = b.html || V.escapeHtml(b.text || '');
        if (b.type === 'heading') return '<h2>' + inner + '</h2>';
        if (b.type === 'quote') return '<blockquote class="real-quote">' + inner + '</blockquote>';
        return '<p>' + linkifyHtml(inner) + '</p>';
      })
      .join('');
  }

  function fallbackBody(article) {
    var text = article.contentText || article.content || V.stripTags(article.contentHtml || '');
    var parts = String(text)
      .split(/\n{2,}/)
      .map(function (p) { return p.trim(); })
      .filter(Boolean);
    if (!parts.length) return '<p class="archive-empty">Текст статьи недоступен.</p>';
    return parts
      .map(function (p) {
        return '<p>' + linkifyHtml(V.escapeHtml(p)) + '</p>';
      })
      .join('');
  }

  function extractSources(html, linkOriginal) {
    var out = [];
    var seen = {};
    var re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    var m;
    while ((m = re.exec(String(html || '')))) {
      var href = m[1].trim();
      if (!href || href.indexOf('#') === 0 || href.indexOf('mailto:') === 0) continue;
      if (href.indexOf('//') === 0) href = 'https:' + href;
      if (seen[href]) continue;
      seen[href] = true;
      var label = V.stripTags(m[2]).slice(0, 120) || href;
      out.push({ href: href, label: label });
    }
    if (linkOriginal && !seen[linkOriginal]) {
      out.unshift({ href: linkOriginal, label: 'Источник' });
    }
    return out.slice(0, 12);
  }

  function pickCover(article, blocks) {
    var cover = article.image || article.cover || article.thumbnail || '';
    if (cover) return cover;
    for (var i = 0; i < (blocks || []).length; i++) {
      if (blocks[i].type === 'image' && blocks[i].uri) return blocks[i].uri;
    }
    return '';
  }

  function renderArticle(article) {
    var cat = (article.categories && article.categories[0]) || 'Материал';
    var blocks = V.htmlToBlocks(article.contentHtml || '');
    var cover = pickCover(article, blocks);
    var bodyHtml = blocks.length ? renderBlocks(blocks) : '';
    if (!bodyHtml.trim()) bodyHtml = fallbackBody(article);
    var sources = extractSources(article.contentHtml, article.linkOriginal);
    var listHref = 'archive.html' + (article.categorySlugs && article.categorySlugs[0]
      ? '?category=' + encodeURIComponent(article.categorySlugs[0])
      : '');
    var sectionLabel =
      article.categorySlugs && article.categorySlugs[0] === 'columns' ? 'Статьи' : 'Новости';

    var sourcesHtml = '';
    if (sources.length) {
      sourcesHtml =
        '<aside class="article-sources"><h3>Источники и ссылки</h3><ul>' +
        sources
          .map(function (s) {
            return (
              '<li><a href="' +
              V.escapeHtml(s.href) +
              '" target="_blank" rel="noopener noreferrer">' +
              V.escapeHtml(s.label) +
              '</a></li>'
            );
          })
          .join('') +
        '</ul></aside>';
    }

    return (
      '<nav class="breadcrumbs" aria-label="Хлебные крошки">' +
      '<a href="index.html">Главная</a><span>/</span>' +
      '<a href="' + listHref + '">' + sectionLabel + '</a><span>/</span>' +
      '<span>' +
      V.escapeHtml(cat) +
      '</span></nav>' +
      '<header class="article-head">' +
      '<p class="eyebrow">' +
      V.escapeHtml(cat) +
      '</p>' +
      '<h1>' +
      V.escapeHtml(article.title || 'Без названия') +
      '</h1>' +
      '<div class="byline"><div class="byline-main"><div>' +
      '<p class="byline-name">' +
      V.escapeHtml(article.author || 'Редакция') +
      '</p>' +
      '<p class="byline-meta"><time datetime="' +
      V.escapeHtml(article.date || '') +
      '">' +
      V.escapeHtml(V.formatDate(article.date)) +
      '</time></p></div></div></div></header>' +
      (cover
        ? '<figure class="article-hero"><div class="hero-photo" ' +
          V.coverStyle(cover) +
          '></div></figure>'
        : '') +
      '<div class="article-body">' +
      bodyHtml +
      '</div>' +
      sourcesHtml +
      '<footer class="article-foot">' +
      '<a class="text-link" href="' + listHref + '">Все материалы <span>→</span></a></footer>'
    );
  }

  function loadRelated(article) {
    var relatedEl = document.getElementById('related');
    var relatedSection = document.querySelector('.related-section');
    if (!relatedEl) return;
    relatedEl.innerHTML = '<div class="loading-row"><span class="spinner" role="status" aria-label="Загрузка"></span></div>';
    var slug = (article.categorySlugs && article.categorySlugs[0]) || '';
    V.getArticles({ category: slug, limit: 8 })
      .then(function (pack) {
        var selfId = String(article.id);
        var items = (pack.items || [])
          .filter(function (x) { return String(x.id) !== selfId; })
          .slice(0, 3);
        if (!items.length) {
          if (relatedSection) relatedSection.hidden = true;
          relatedEl.innerHTML = '';
          return;
        }
        relatedEl.innerHTML = items
          .map(function (item) {
            var cat = (item.categories && item.categories[0]) || 'Материал';
            var thumb = item.image
              ? '<a class="story-thumb" href="' +
                V.articleHref(item) +
                '" ' +
                V.coverStyle(item.image) +
                ' aria-label="Открыть"></a>'
              : '<span class="story-thumb story-thumb-empty" aria-hidden="true"></span>';
            return (
              '<article class="compact-story"><div>' +
              '<p class="story-meta"><span>' +
              V.escapeHtml(cat) +
              '</span><time>' +
              V.escapeHtml(V.formatDate(item.date)) +
              '</time></p>' +
              '<h3><a href="' +
              V.articleHref(item) +
              '">' +
              V.escapeHtml(item.title) +
              '</a></h3>' +
              (item.excerpt
                ? '<p>' + V.escapeHtml(String(item.excerpt).slice(0, 140)) + '</p>'
                : '') +
              '</div>' +
              thumb +
              '</article>'
            );
          })
          .join('');
      })
      .catch(function (e) {
        console.error('related', e);
        if (relatedSection) relatedSection.hidden = true;
        relatedEl.innerHTML = '';
      });
  }

  var id = qs('id');
  var root = document.getElementById('article-root');
  if (!id || !root) {
    if (root) root.innerHTML = '<p class="archive-empty">Статья не указана.</p>';
    return;
  }

  root.innerHTML = '<div class="loading-row"><span class="spinner" role="status" aria-label="Загрузка"></span></div>';

  V.getArticle(id)
    .then(function (article) {
      if (!article || !article.title) throw new Error('Article empty');
      document.title = article.title + ' — ЯКатолик';
      root.innerHTML = renderArticle(article);
      loadRelated(article);
    })
    .catch(function (e) {
      console.error(e);
      root.innerHTML =
        '<p class="archive-empty">Не удалось загрузить статью. <a href="archive.html">К материалам</a></p>';
      var relatedSection = document.querySelector('.related-section');
      if (relatedSection) relatedSection.hidden = true;
    });
})();

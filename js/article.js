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
    // Не трогаем уже собранные <a> / теги — только «голые» URL в тексте.
    var parts = [];
    var masked = String(html || '').replace(/<[^>]+>/g, function (tag) {
      parts.push(tag);
      return '\u0000' + (parts.length - 1) + '\u0000';
    });
    var URL_RE = /(https?:\/\/[^\s<>"']+|www\.[^\s<>"']+)/gi;
    masked = masked.replace(URL_RE, function (raw) {
      var href = raw;
      if (href.indexOf('www.') === 0) href = 'https://' + href;
      href = href.replace(/[),.]+$/, '');
      var resolved = V.resolveContentHref ? V.resolveContentHref(href) : null;
      if (resolved) {
        return (
          '<a href="' +
          V.escapeHtml(resolved.href) +
          '"' +
          (resolved.external ? ' target="_blank" rel="noopener noreferrer"' : '') +
          '>' +
          V.escapeHtml(href.replace(/^https?:\/\//, '')) +
          '</a>'
        );
      }
      return V.escapeHtml(raw);
    });
    return masked.replace(/\u0000(\d+)\u0000/g, function (_m, i) {
      return parts[Number(i)] || '';
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
            '" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="this.style.display=\'none\'" />' +
            (b.caption
              ? '<figcaption>' + V.escapeHtml(b.caption) + '</figcaption>'
              : '') +
            '</figure>'
          );
        }
        if (b.type === 'embed-link') {
          return (
            '<p class="embed-link"><a href="' +
            V.escapeHtml(b.href) +
            '"' +
            (b.external ? ' target="_blank" rel="noopener noreferrer"' : '') +
            '>' +
            V.escapeHtml(b.text || 'Читать материал') +
            ' <span aria-hidden="true">→</span></a></p>'
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
      var resolved = V.resolveContentHref ? V.resolveContentHref(href) : null;
      var finalHref = resolved ? resolved.href : href;
      var external = !resolved || resolved.external;
      if (seen[finalHref]) continue;
      seen[finalHref] = true;
      var label = V.stripTags(m[2]).slice(0, 120) || finalHref;
      out.push({ href: finalHref, label: label, external: external });
    }
    if (linkOriginal && !seen[linkOriginal]) {
      out.unshift({ href: linkOriginal, label: 'Источник', external: true });
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
    var isPage = article.kind === 'page' || article.type === 'page';
    var cat =
      (article.categories && article.categories[0]) ||
      (isPage ? 'Страница' : 'Материал');
    var blocks = V.htmlToBlocks(article.contentHtml || '');
    var cover = pickCover(article, blocks);
    var relatedEmbeds = [];
    var contentBlocks = [];
    (blocks || []).forEach(function (b) {
      if (b && b.type === 'embed-link') relatedEmbeds.push(b);
      else contentBlocks.push(b);
    });
    var bodyHtml = contentBlocks.length ? renderBlocks(contentBlocks) : '';
    if (!bodyHtml.trim()) bodyHtml = fallbackBody(article);

    var relatedHtml = '';
    if (relatedEmbeds.length) {
      relatedHtml =
        '<section class="article-related-links">' +
        '<h3>Материалы по теме</h3><ul>' +
        relatedEmbeds
          .map(function (b) {
            return (
              '<li><a href="' +
              V.escapeHtml(b.href) +
              '"' +
              (b.external ? ' target="_blank" rel="noopener noreferrer"' : '') +
              '>' +
              V.escapeHtml(b.text || 'Читать материал') +
              '</a></li>'
            );
          })
          .join('') +
        '</ul></section>';
    }

    var relatedHrefs = {};
    relatedEmbeds.forEach(function (b) {
      if (b.href) relatedHrefs[b.href] = 1;
    });
    var sources = extractSources(article.contentHtml, article.linkOriginal).filter(function (s) {
      // не дублируем то, что уже в «Материалы по теме»
      if (relatedHrefs[s.href]) return false;
      if (!s.external && String(s.href || '').indexOf('article.html') === 0) return false;
      return true;
    });
    var listHref = isPage
      ? 'articles.html'
      : 'archive.html' +
        (article.categorySlugs && article.categorySlugs[0]
          ? '?category=' + encodeURIComponent(article.categorySlugs[0])
          : '');
    var sectionLabel = isPage
      ? 'Статьи'
      : article.categorySlugs && article.categorySlugs[0] === 'columns'
        ? 'Статьи'
        : 'Новости';

    var sourcesHtml = '';
    if (sources.length) {
      sourcesHtml =
        '<aside class="article-sources"><h3>Источники и ссылки</h3><ul>' +
        sources
          .map(function (s) {
            return (
              '<li><a href="' +
              V.escapeHtml(s.href) +
              '"' +
              (s.external ? ' target="_blank" rel="noopener noreferrer"' : '') +
              '>' +
              V.escapeHtml(s.label) +
              '</a></li>'
            );
          })
          .join('') +
        '</ul></aside>';
    }

    var cycle =
      !isPage && window.YakCycles && window.YakCycles.byArticleSlug
        ? window.YakCycles.byArticleSlug(String(article.id || article.slug || ''))
        : null;
    var cycleHtml = cycle
      ? '<p class="article-cycle"><a href="cycle.html?id=' +
        encodeURIComponent(cycle.id) +
        '">Из цикла: ' +
        V.escapeHtml(cycle.title) +
        '</a></p>'
      : '';

    var byline = isPage
      ? (article.date
          ? '<p class="byline-meta"><time datetime="' +
            V.escapeHtml(article.date || '') +
            '">' +
            V.escapeHtml(V.formatDate(article.date)) +
            '</time></p>'
          : '')
      : '<div class="byline"><div class="byline-main"><div>' +
        '<p class="byline-name">' +
        V.escapeHtml(article.author || 'Редакция') +
        '</p>' +
        '<p class="byline-meta"><time datetime="' +
        V.escapeHtml(article.date || '') +
        '">' +
        V.escapeHtml(V.formatDate(article.date)) +
        '</time></p></div></div></div>';

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
      cycleHtml +
      '<h1>' +
      V.escapeHtml(article.title || 'Без названия') +
      '</h1>' +
      byline +
      '</header>' +
      (cover
        ? '<figure class="article-hero"><div class="hero-photo" ' +
          V.coverStyle(cover) +
          '></div></figure>'
        : '') +
      '<div class="article-reading">' +
      '<div class="article-body">' +
      bodyHtml +
      '</div>' +
      relatedHtml +
      sourcesHtml +
      '<footer class="article-foot">' +
      '<a class="text-link" href="' +
      listHref +
      '">Все материалы <span>→</span></a></footer>' +
      '</div>'
    );
  }

  function loadRelated(article) {
    var relatedEl = document.getElementById('related');
    var relatedSection = document.querySelector('.related-section');
    if (!relatedEl) return;
    if (article.kind === 'page') {
      if (relatedSection) relatedSection.hidden = true;
      relatedEl.innerHTML = '';
      return;
    }
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

  function articleSkeleton() {
    return (
      '<div class="article-skel" aria-busy="true" aria-label="Загрузка статьи">' +
      '<div class="sk sk-line sk-eyebrow"></div>' +
      '<div class="sk sk-line sk-title" style="margin-top:14px"></div>' +
      '<div class="sk sk-line sk-title" style="width:64%;margin-top:10px;height:28px"></div>' +
      '<div class="sk sk-line sk-meta"></div>' +
      '</div>' +
      '<div class="article-skel-hero"><div class="sk"></div></div>' +
      '<div class="article-skel-lines">' +
      '<div class="sk sk-line"></div><div class="sk sk-line"></div><div class="sk sk-line"></div>' +
      '<div class="sk sk-line"></div><div class="sk sk-line"></div><div class="sk sk-line"></div>' +
      '<div class="sk sk-line"></div><div class="sk sk-line"></div>' +
      '</div>'
    );
  }

  var id = qs('id');
  var root = document.getElementById('article-root');
  var relatedSection = document.querySelector('.related-section');
  if (relatedSection) relatedSection.hidden = true;

  if (!id || !root) {
    if (root) root.innerHTML = '<p class="archive-empty">Статья не указана.</p>';
    return;
  }

  root.innerHTML = articleSkeleton();

  // Статья (post) или WP page — внутренние ссылки Рускатолика часто ведут на pages.
  var load = V.getContent || V.getArticle;
  load(id)
    .then(function (article) {
      if (!article || !article.title) throw new Error('Article empty');
      document.title = article.title + ' — ЯКатолик';
      root.innerHTML = renderArticle(article);
      if (relatedSection) relatedSection.hidden = article.kind === 'page';
      loadRelated(article);
    })
    .catch(function (e) {
      console.error(e);
      root.innerHTML =
        '<div class="article-missing">' +
        '<p class="eyebrow">Материал</p>' +
        '<h1>Не удалось открыть</h1>' +
        '<p>Ссылка могла вести на материал, которого нет в архиве, или временный сбой загрузки.</p>' +
        '<p><a class="wlink" href="archive.html">К материалам →</a> · ' +
        '<a class="wlink" href="articles.html">К статьям →</a></p></div>';
      if (relatedSection) relatedSection.hidden = true;
    });
})();

/**
 * Карта портала для чата.
 * Не отвечает сама — только даёт нейросети знание структуры.
 * Быстрые ссылки показываем лишь если модель сама упомянула разделы.
 */
(function (global) {
  'use strict';

  var SECTIONS = [
    { id: 'home', title: 'Главная', href: 'index.html', blurb: 'Лента новостей, статей, авторов, афиша и библиотека.' },
    { id: 'news', title: 'Новости', href: 'archive.html?category=news', blurb: 'Новостная лента.' },
    { id: 'articles', title: 'Статьи', href: 'archive.html?category=columns', blurb: 'Колонки и материалы архива.' },
    { id: 'church', title: 'О Церкви', href: 'church.html', blurb: 'Маршруты для новичков, катехуменов, возвращения в Церковь.' },
    { id: 'spirit', title: 'Духовная жизнь', href: 'spiritual-life.html', blurb: 'Молитва, литургия, таинства, паломничества, реколлекции.' },
    { id: 'library', title: 'Библиотека', href: 'library.html', blurb: 'Документы Церкви и книги.' },
    { id: 'authors', title: 'Авторы', href: 'authors.html', blurb: 'Каталог авторов и их публикации.' },
    { id: 'map', title: 'Карта храмов', href: 'map.html', blurb: 'Карта католических храмов.' },
    { id: 'calendar', title: 'День Церкви', href: 'calendar.html', blurb: 'Литургический день: святой, чтение, молитва.' },
    { id: 'events', title: 'Афиша', href: 'events.html', blurb: 'Календарь событий и мероприятий.' },
    { id: 'ask', title: 'Спросить', href: 'chat.html', blurb: 'Этот диалог о вере.' },
    { id: 'mass-guide', title: 'Путеводитель по Мессе', href: 'spiritual-life.html?path=mass-guide', blurb: 'Как устроена Святая Месса.' },
    { id: 'first-time', title: 'Я здесь впервые', href: 'church.html?path=first-time', blurb: 'Маршрут для знакомства с Церковью.' },
    { id: 'become', title: 'Хочу стать католиком', href: 'church.html?path=become', blurb: 'Шаги присоединения к Церкви.' }
  ];

  var SITE_OVERVIEW =
    'Портал ЯКатолик: Главная; Новости; Статьи/архив; О Церкви; Духовная жизнь; ' +
    'Библиотека; Авторы (карточки и все публикации); Карта храмов; ' +
    'День Церкви (литургический календарь, иконка в шапке); Афиша событий; Спросить (чат).';

  /** Компактный контекст — всегда к вопросу, решает модель. */
  function withSiteContext(userText) {
    var map = SECTIONS.map(function (s) {
      return s.title + ' → ' + s.href;
    }).join('; ');

    return (
      '[Контекст портала ЯКатолик — служебный, не цитируй дословно и не пересказывай списком без нужды]\n' +
      'Ты помощник портала. Вопросы о вере, авторах, «что почитать» — отвечай по сути, рекомендуй материалы/статьи. ' +
      'Структуру сайта упоминай только если человек явно спрашивает, где что найти на портале, ' +
      'или когда без перехода в раздел ответ будет неполным. Не подменяй ответ картой сайта.\n' +
      'Обзор: ' + SITE_OVERVIEW + '\n' +
      'Разделы: ' + map + '\n' +
      'Страница автора: author.html?slug=… (например Анастасия Бозио — искать в Авторы).\n' +
      '[Конец контекста]\n\n' +
      userText
    );
  }

  /** Ссылки только по тому, что модель сама назвала в ответе. */
  function linksMentionedIn(reply) {
    var text = String(reply || '').toLowerCase();
    if (!text) return [];
    var out = [];
    var seen = {};
    SECTIONS.forEach(function (s) {
      if (seen[s.id]) return;
      var title = String(s.title || '').toLowerCase();
      var href = String(s.href || '').toLowerCase();
      var hit =
        (title && text.indexOf(title) !== -1) ||
        (href && text.indexOf(href) !== -1);
      if (hit) {
        seen[s.id] = true;
        out.push(s);
      }
    });
    return out.slice(0, 5);
  }

  global.YakSiteGuide = {
    SECTIONS: SECTIONS,
    SITE_OVERVIEW: SITE_OVERVIEW,
    withSiteContext: withSiteContext,
    linksMentionedIn: linksMentionedIn
  };
})(typeof window !== 'undefined' ? window : globalThis);

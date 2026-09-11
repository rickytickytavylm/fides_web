/**
 * Карта портала для чата.
 * Не отвечает сама — только даёт нейросети знание структуры.
 * Быстрые ссылки показываем лишь если модель сама упомянула разделы.
 */
(function (global) {
  'use strict';

  var SECTIONS = [
    { id: 'home', title: 'Главная', href: 'index.html', blurb: 'Лента: новости, статьи, голоса, авторы, афиша.' },
    { id: 'news', title: 'Новости', href: 'archive.html?category=news', blurb: 'Новостная лента: Россия, Святой Престол, мир.' },
    { id: 'articles', title: 'Статьи', href: 'articles.html', blurb: 'Колонки и рубрики для спокойного чтения.' },
    { id: 'voices', title: 'Голоса', href: 'archive.html?category=interview', blurb: 'Интервью, свидетельства и проповеди.' },
    { id: 'interview', title: 'Интервью', href: 'archive.html?category=interview', blurb: 'Интервью.' },
    { id: 'svidetelstva', title: 'Свидетельства', href: 'archive.html?category=svidetelstva', blurb: 'Свидетельства веры.' },
    { id: 'propovedi', title: 'Проповеди', href: 'archive.html?category=propovedi', blurb: 'Проповеди.' },
    { id: 'church', title: 'О Церкви', href: 'church.html', blurb: 'Маршруты для новичков, катехуменов, возвращения в Церковь.' },
    { id: 'spirit', title: 'Духовная жизнь', href: 'spiritual-life.html', blurb: 'Молитва, литургия, таинства, паломничества, реколлекции.' },
    { id: 'library', title: 'Библиотека', href: 'library.html', blurb: 'Документы Церкви и книги.' },
    { id: 'authors', title: 'Авторы', href: 'authors.html', blurb: 'Каталог авторов, циклы и публикации.' },
    { id: 'audio', title: 'Аудио', href: 'audio.html', blurb: 'Проповеди и аудиозаписи.' },
    { id: 'video', title: 'Видео', href: 'video.html', blurb: 'Видеоматериалы.' },
    { id: 'photo', title: 'Фотосток', href: 'photostock.html', blurb: 'Фототека редакции.' },
    { id: 'calendar', title: 'День Церкви', href: 'calendar.html', blurb: 'Литургический день: святой, чтение, молитва.' },
    { id: 'events', title: 'Афиша', href: 'events.html', blurb: 'Календарь событий и мероприятий.' },
    { id: 'ask', title: 'Спросить', href: 'chat.html', blurb: 'Этот диалог о вере.' },
    { id: 'app', title: 'Приложение', href: 'page.html#app', blurb: 'Мобильное приложение ЯКатолик.' },
    { id: 'mass-guide', title: 'Путеводитель по Мессе', href: 'spiritual-life.html?path=mass-guide', blurb: 'Как устроена Святая Месса.' },
    { id: 'first-time', title: 'Я здесь впервые', href: 'church.html?path=first-time', blurb: 'Маршрут для знакомства с Церковью.' },
    { id: 'become', title: 'Хочу стать католиком', href: 'church.html?path=become', blurb: 'Шаги присоединения к Церкви.' }
  ];

  var SITE_OVERVIEW =
    'Портал ЯКатолик (автономный ресурс, не Рускатолик): ' +
    'Главная; Новости; Статьи; Голоса (интервью, свидетельства, проповеди); ' +
    'О Церкви; Духовная жизнь; Библиотека; Авторы и циклы; Аудио; Видео; Фотосток; ' +
    'День Церкви (календарь в шапке); Афиша; Спросить (этот чат); Приложение.';

  function withSiteContext(userText) {
    var map = SECTIONS.map(function (s) {
      return s.title + ' → ' + s.href;
    }).join('; ');

    return (
      '[Контекст портала ЯКатолик — служебный, не цитируй дословно]\n' +
      'Ты помощник именно ЯКатолика. Контент — из нашей базы, не с внешних сайтов. ' +
      'Не выдумывай статьи, авторов, даты и цитаты. Если не уверен — скажи, что в архиве этого нет. ' +
      'Вопросы о вере — по Катехизису. «Что почитать» — только из материалов, которые тебе передали. ' +
      'Структуру сайта называй, когда спрашивают «где найти».\n' +
      'Обзор: ' + SITE_OVERVIEW + '\n' +
      'Разделы: ' + map + '\n' +
      'Страница автора: author.html?slug=… Цикл: cycle.html?id=… Материал: article.html?id=slug.\n' +
      '[Конец контекста]\n\n' +
      userText
    );
  }

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
    return out.slice(0, 6);
  }

  global.YakSiteGuide = {
    SECTIONS: SECTIONS,
    SITE_OVERVIEW: SITE_OVERVIEW,
    withSiteContext: withSiteContext,
    linksMentionedIn: linksMentionedIn
  };
})(typeof window !== 'undefined' ? window : globalThis);

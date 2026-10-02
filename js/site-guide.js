/**
 * Карта портала для чата.
 * Не отвечает сама — только даёт нейросети знание структуры.
 * Быстрые ссылки показываем лишь если модель сама упомянула разделы.
 */
(function (global) {
  'use strict';

  var SECTIONS = [
    { id: 'home', title: 'Главная', match: /главн(ая|ой|ую) страниц|на главной/, href: 'index.html', blurb: 'Лента: новости, День Церкви, статьи, голоса, афиша, библиотека, фото.' },
    { id: 'news', title: 'Новости', match: /новост/, href: 'archive.html?category=news', blurb: 'Новостная лента: Россия, Святой Престол, мир.' },
    { id: 'articles', title: 'Статьи', href: 'articles.html', blurb: 'Темы, колонки и рубрики для спокойного чтения.' },
    { id: 'ask-priest-form', title: 'Задать вопрос священнику', match: /зада[а-я]* вопрос[а-я]* священнику/, href: 'church.html?path=nav-ask-priest', blurb: 'Как написать священнику.' },
    { id: 'ask-psych-form', title: 'Задать вопрос психологу', match: /зада[а-я]* вопрос[а-я]* психологу/, href: 'church.html?path=nav-ask-psych', blurb: 'Как написать психологу.' },
    { id: 'ask-priest', title: 'Вопросы священнику', match: /вопрос(ы|ах|ов) священнику/, href: 'archive.html?category=ask-priest', blurb: 'Ответы священника на письма читателей.' },
    { id: 'ask-psych', title: 'Вопросы психологу', match: /вопрос(ы|ах|ов) психологу/, href: 'archive.html?category=psiholog', blurb: 'Ответы психолога на письма читателей.' },
    { id: 'voices', title: 'Голоса', href: 'archive.html?category=interview', blurb: 'Интервью, свидетельства и проповеди.' },
    { id: 'interview', title: 'Интервью', href: 'archive.html?category=interview', blurb: 'Интервью.' },
    { id: 'svidetelstva', title: 'Свидетельства', href: 'archive.html?category=svidetelstva', blurb: 'Свидетельства веры.' },
    { id: 'propovedi', title: 'Проповеди', href: 'archive.html?category=propovedi', blurb: 'Проповеди.' },
    { id: 'church', title: 'О Церкви', href: 'church.html', blurb: 'Маршруты: впервые, стать католиком, вернуться, углубить веру; Таинства; как устроена Церковь.' },
    { id: 'first-time', title: 'Я здесь впервые', href: 'church.html?path=first-time', blurb: 'Маршрут для знакомства с Церковью.' },
    { id: 'become', title: 'Хочу стать католиком', href: 'church.html?path=become', blurb: 'Шаги присоединения к Церкви.' },
    { id: 'spirit', title: 'Духовная жизнь', match: /духовн(ая|ой|ую) жизн/, href: 'spiritual-life.html', blurb: 'Молитва, литургия, таинства, паломничества, реколлекции.' },
    { id: 'mass-guide', title: 'Путеводитель по Мессе', match: /путеводител[а-я]* по (святой )?мессе/, href: 'spiritual-life.html?path=mass-guide', blurb: 'Как устроена Святая Месса.' },
    { id: 'library', title: 'Библиотека', match: /библиотек/, href: 'library.html', blurb: 'Документы Церкви, энциклики и книги. Автор на карточке ведёт ко всем его изданиям.' },
    { id: 'authors', title: 'Авторы', href: 'authors.html', blurb: 'Каталог авторов, их циклы и публикации.' },
    { id: 'audio', title: 'Аудио', href: 'audio.html', blurb: 'Подкасты и аудиозаписи.' },
    { id: 'podcasts', title: 'Подкасты', match: /подкаст/, href: 'audio.html', blurb: 'Подкасты портала.' },
    { id: 'video', title: 'Видео', href: 'video.html', blurb: 'Ролики и каналы партнёров.' },
    { id: 'photo', title: 'Фотосток', match: /фотосток/, href: 'photostock.html', blurb: 'Фотографии католической жизни с указанием фотографов.' },
    { id: 'calendar', title: 'День Церкви', match: /д(ень|ня|не|нем) церкви/, href: 'calendar.html', blurb: 'Литургический день: святой, чтение, молитва.' },
    { id: 'events', title: 'Афиша', match: /афиш/, href: 'events.html', blurb: 'События, встречи и мероприятия с организаторами.' },
    { id: 'about', title: 'О проекте', href: 'page.html', blurb: 'Кто делает портал.' },
    { id: 'app', title: 'Приложение', match: /приложени[еяию]/, href: 'page.html#app', blurb: 'Мобильное приложение ЯКатолик.' },
    { id: 'ask', title: 'Спросить', href: 'chat.html', blurb: 'Этот диалог о вере.' }
  ];

  var SITE_OVERVIEW =
    'Портал ЯКатолик (автономный ресурс, не Рускатолик): ' +
    'Главная; Новости; Статьи (в т. ч. «Вопросы священнику» и «Вопросы психологу»); Голоса (интервью, свидетельства, проповеди); ' +
    'О Церкви (маршруты, Таинства, можно задать вопрос священнику или психологу); Духовная жизнь (молитва, путеводитель по Мессе); ' +
    'Библиотека (документы и книги); Авторы и циклы; Аудио (подкасты); Видео (каналы партнёров); Фотосток; ' +
    'День Церкви (календарь в шапке); Афиша (события и организаторы); О проекте; Приложение; Спросить (этот чат).';

  function withSiteContext(userText) {
    var map = SECTIONS.map(function (s) {
      return s.title + ' — ' + s.blurb;
    }).join('; ');

    return (
      '[Контекст портала ЯКатолик — служебный, не цитируй дословно]\n' +
      'Ты помощник именно ЯКатолика. Контент — из нашей базы, не с внешних сайтов. ' +
      'Не выдумывай статьи, авторов, даты и цитаты. Если не уверен — скажи, что на портале этого нет. ' +
      'Вопросы о вере — по Катехизису. «Что почитать» — только из материалов, которые тебе передали. ' +
      'Разделы называй словами, как ниже, без адресов страниц — кнопки перехода появятся сами.\n' +
      'Обзор: ' + SITE_OVERVIEW + '\n' +
      'Разделы: ' + map + '\n' +
      '[Конец контекста]\n\n' +
      userText
    );
  }

  function linksMentionedIn(reply) {
    var text = String(reply || '').toLowerCase().replace(/ё/g, 'е');
    if (!text) return [];
    var out = [];
    var seen = {};
    SECTIONS.forEach(function (s) {
      if (s.id === 'ask' || seen[s.href]) return;
      var title = String(s.title || '').toLowerCase().replace(/ё/g, 'е');
      var href = String(s.href || '').toLowerCase();
      var hit =
        (s.match ? s.match.test(text) : title && text.indexOf(title) !== -1) ||
        (href && text.indexOf(href) !== -1);
      if (hit) {
        seen[s.href] = true;
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

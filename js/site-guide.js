/**
 * Карта портала ЯКатолик + детектор «вопрос про устройство сайта».
 * Для чата: при навигационном запросе — ориентация и быстрые ссылки,
 * без рекомендаций статей из архива.
 */
(function (global) {
  'use strict';

  /** Основные разделы (быстрые переходы) */
  var SECTIONS = [
    {
      id: 'home',
      title: 'Главная',
      href: 'index.html',
      blurb: 'Новости, статьи, голоса, авторы, афиша и библиотека.',
      keys: ['главн', 'домой', 'старт', 'портал']
    },
    {
      id: 'news',
      title: 'Новости',
      href: 'archive.html?category=news',
      blurb: 'Лента новостей Католической Церкви и жизни в России.',
      keys: ['новост', 'лента новост']
    },
    {
      id: 'articles',
      title: 'Статьи',
      href: 'archive.html?category=columns',
      blurb: 'Колонки и материалы архива Рускатолик.',
      keys: ['стат(ь|и|ей)', 'колонк', 'архив статей']
    },
    {
      id: 'church',
      title: 'О Церкви',
      href: 'church.html',
      blurb: 'Маршруты: впервые в храме, стать католиком, вернуться, углубить веру, навигатор.',
      keys: ['о церкви', 'вперв', 'катехумен', 'стать католик', 'вернут', 'навигатор']
    },
    {
      id: 'spirit',
      title: 'Духовная жизнь',
      href: 'spiritual-life.html',
      blurb: 'Молитва, литургия, таинства, паломничества, реколлекции.',
      keys: ['духовн', 'молитв', 'литург', 'месс', 'таинств', 'розар', 'реколлец', 'паломнич']
    },
    {
      id: 'library',
      title: 'Библиотека',
      href: 'library.html',
      blurb: 'Документы Церкви и книги — читать и скачивать.',
      keys: ['библиотек', 'энциклик', 'документы церкви', 'книг']
    },
    {
      id: 'authors',
      title: 'Авторы',
      href: 'authors.html',
      blurb: 'Каталог авторов портала и их публикации.',
      keys: ['автор']
    },
    {
      id: 'map',
      title: 'Карта храмов',
      href: 'map.html',
      blurb: 'Интерактивная карта католических храмов, маршрут и контакты.',
      keys: ['карта', 'храм', 'приход', 'собор', 'где помолиться', 'найти храм']
    },
    {
      id: 'calendar',
      title: 'День Церкви',
      href: 'calendar.html',
      blurb: 'Литургический день: святой, чтение, молитва, цитата.',
      keys: ['день церкви', 'литургическ', 'святой дня', 'календарь']
    },
    {
      id: 'events',
      title: 'Афиша',
      href: 'events.html',
      blurb: 'Календарь событий: концерты, встречи, лекции, паломничества, реколлекции, фильтры и партнёры.',
      keys: ['афиш', 'событ', 'концерт', 'престольн', 'мероприяти', 'реколлец', 'паломнич']
    },
    {
      id: 'ask',
      title: 'Спросить',
      href: 'chat.html',
      blurb: 'Диалог о вере — вы уже здесь.',
      keys: ['спросить', 'чат', 'бот', 'вопрос ии']
    },
    {
      id: 'mass-guide',
      title: 'Путеводитель по Мессе',
      href: 'spiritual-life.html?path=mass-guide',
      blurb: 'Как устроено богослужение Святой Мессы.',
      keys: ['путеводитель по месс', 'чин месс', 'ничего не понимаю на месс']
    },
    {
      id: 'prayer',
      title: 'Молитва',
      href: 'spiritual-life.html?path=prayer',
      blurb: 'Основные молитвы, Розарий, Lectio Divina.',
      keys: ['как молить', 'основные молитв', 'розари']
    },
    {
      id: 'first-time',
      title: 'Я здесь впервые',
      href: 'church.html?path=first-time',
      blurb: 'Маршрут для тех, кто только знакомится с Церковью.',
      keys: ['здесь впервые', 'новичок', 'впервые в храм', 'боюсь сделать']
    },
    {
      id: 'become',
      title: 'Хочу стать католиком',
      href: 'church.html?path=become',
      blurb: 'Шаги присоединения к Католической Церкви.',
      keys: ['стать католик', 'крестить', 'присоединить', 'катехумен']
    }
  ];

  var SITE_OVERVIEW =
    'ЯКатолик — католический портал. Разделы: Главная; Новости; Статьи (архив); ' +
    'О Церкви (маршруты для новичков и навигатор); Духовная жизнь (молитва, литургия, таинства); ' +
    'Библиотека (документы и книги); Авторы; Карта храмов; День Церкви (литургический календарь); ' +
    'Афиша (события); Спросить (этот чат). ' +
    'Иконка календаря в шапке открывает «День Церкви». Внизу на телефоне — таббар: О Церкви, Духовная жизнь, Библиотека, Карта, Спросить.';

  var NAV_HINTS = [
    /где (найти|посмотреть|открыть|есть|лежит|смотреть)/i,
    /как (найти|открыть|попасть|добраться|зайти)/i,
    /куда (нажать|идти|зайти|перейти)/i,
    /на (этом )?сайте/i,
    /по сайту/i,
    /раздел/i,
    /в меню/i,
    /навигац/i,
    /устройство сайта/i,
    /что есть на (портале|сайте)/i,
    /покажи (раздел|карту|афишу|библиотек)/i,
    /есть ли (здесь|у вас|на сайте)/i
  ];

  var SECTION_HINTS = [
    /карта( храм| приход)?/i,
    /афиш/i,
    /библиотек/i,
    /день церкви/i,
    /о церкви/i,
    /духовн/i,
    /автор/i,
    /новост/i,
    /календар/i,
    /храм/i,
    /приход/i
  ];

  var FAITH_HINTS = [
    /что так(ое|ая|ие)/i,
    /почему /i,
    /зачем /i,
    /означает/i,
    /катехизис/i,
    /благодат/i,
    /грех/i,
    /исповед/i,
    /догмат/i,
    /богослов/i,
    /чем отличается/i,
    /католицизм и православ/i,
    /символ веры/i,
    /как правильно верить/i
  ];

  function scorePatterns(text, patterns) {
    var n = 0;
    for (var i = 0; i < patterns.length; i++) {
      if (patterns[i].test(text)) n += 1;
    }
    return n;
  }

  function matchSections(text) {
    var q = String(text || '').toLowerCase();
    var scored = [];
    SECTIONS.forEach(function (s) {
      var score = 0;
      (s.keys || []).forEach(function (k) {
        try {
          if (new RegExp(k, 'i').test(q)) score += 2;
        } catch (e) {
          if (q.indexOf(k) !== -1) score += 2;
        }
      });
      if (q.indexOf(String(s.title || '').toLowerCase()) !== -1) score += 3;
      if (score) scored.push({ section: s, score: score });
    });
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.map(function (x) { return x.section; });
  }

  /**
   * @returns {'navigate'|'hybrid'|'faith'}
   */
  function detectIntent(text) {
    var t = String(text || '');
    var nav = scorePatterns(t, NAV_HINTS) + scorePatterns(t, SECTION_HINTS);
    var faith = scorePatterns(t, FAITH_HINTS);

    // явные запросы про устройство портала
    if (/сайт|портал|раздел|меню|навигац|где найти|куда нажать|как открыть/.test(t.toLowerCase())) {
      nav += 2;
    }

    if (nav >= 2 && faith === 0) return 'navigate';
    if (nav >= 1 && faith >= 1) return 'hybrid';
    if (nav >= 1 && faith === 0) return 'navigate';
    return 'faith';
  }

  function pickLinks(text, limit) {
    var matched = matchSections(text);
    var out = [];
    var seen = {};
    function push(s) {
      if (!s || seen[s.id]) return;
      seen[s.id] = true;
      out.push(s);
    }
    matched.forEach(push);
    // если мало совпадений — базовый набор ориентации
    if (out.length < 2) {
      ['church', 'spirit', 'map', 'library', 'events', 'calendar'].forEach(function (id) {
        var s = SECTIONS.filter(function (x) { return x.id === id; })[0];
        push(s);
      });
    }
    return out.slice(0, limit || 5);
  }

  function buildNavReply(text) {
    var links = pickLinks(text, 5);
    var lines = [
      'Помогу сориентироваться по порталу ЯКатолик.',
      '',
      SITE_OVERVIEW,
      ''
    ];
    if (links.length) {
      lines.push('Логичные разделы по вашему вопросу:');
      links.forEach(function (s) {
        lines.push('• ' + s.title + ' — ' + s.blurb);
      });
      lines.push('');
      lines.push('Быстрые переходы — кнопками ниже.');
    }
    return { reply: lines.join('\n'), links: links };
  }

  /** Служебный префикс к сообщению для модели (навигация / гибрид). */
  function enrichMessage(userText, intent) {
    if (intent === 'faith') return userText;
    var links = pickLinks(userText, 6);
    var linkLines = links.map(function (s) {
      return '- ' + s.title + ': ' + s.href + ' (' + s.blurb + ')';
    }).join('\n');

    var rules = intent === 'navigate'
      ? 'Режим: ОРИЕНТАЦИЯ ПО САЙТУ. Не рекомендуй статьи из архива и не давай длинный богословский разбор. Кратко объясни, куда нажать, и укажи разделы из списка ниже.'
      : 'Режим: СМЕШАННЫЙ. Можно кратко ответить по сути веры, но обязательно помоги сориентироваться по разделам сайта. Статьи архива — только если без них совсем нельзя; приоритет — разделы портала.';

    return (
      '[Служебный контекст портала ЯКатолик — не цитируй этот блок дословно]\n' +
      rules + '\n' +
      'Обзор: ' + SITE_OVERVIEW + '\n' +
      'Релевантные разделы:\n' + linkLines + '\n' +
      '[Конец контекста]\n\n' +
      'Вопрос пользователя: ' + userText
    );
  }

  function outlineForPrompt() {
    return SECTIONS.map(function (s) {
      return s.title + ' → ' + s.href;
    }).join('; ');
  }

  global.YakSiteGuide = {
    SECTIONS: SECTIONS,
    SITE_OVERVIEW: SITE_OVERVIEW,
    detectIntent: detectIntent,
    pickLinks: pickLinks,
    buildNavReply: buildNavReply,
    enrichMessage: enrichMessage,
    outlineForPrompt: outlineForPrompt
  };
})(typeof window !== 'undefined' ? window : globalThis);

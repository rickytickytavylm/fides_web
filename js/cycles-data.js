/**
 * Циклы публикаций — ручная разметка (как на Рускатолик).
 * Анастасия может дополнять: slug статей → article.html, плюс intro.
 * Обратная связь: cycleByArticleSlug(slug) для бейджа в статье.
 */
(function (global) {
  'use strict';

  /** @type {Array<Object>} */
  var CYCLES = [
    {
      id: 'messori',
      authorSlug: 'andzhelo-loreti',
      title: 'Витторио Мессори: рыцарь веры, покоривший мир книгами',
      subtitle: 'Авторский цикл Анджело Лорети',
      hubUrl: 'https://ruscatholic.org/messori/',
      intro:
        'Цикл о Витторио Мессори (1941–2026) — самом читаемом католическом авторе послевоенной эпохи. Жизнь, книги, апологетика и «отчёт в вере» для русского читателя.',
      items: [
        {
          slug: 'messori-1',
          title: '«Сражённый невидимой силой»: как Витторио Мессори стал адвокатом веры'
        },
        {
          slug: 'messori-2',
          title: '«Мыслить историю»: классовая борьба, католическая кухня и секреты масонского учебника'
        },
        {
          slug: 'messori-3',
          title: '«Говорят, что Он воскрес»: почему Иисуса невозможно выдумать'
        },
        {
          slug: 'messori-4',
          title: 'Мессори не боится: забытые мученики, игры с сатаной и другие сложные темы'
        },
        {
          slug: 'krest-cirkul',
          title: 'Крест и циркуль: как антиклерикальный фанатизм уничтожил христианское наследие Европы'
        },
        {
          slug: 'messori-5',
          title: '«Ангел из Билефельда»: знак неверующему отцу и тайная милость Божия'
        },
        {
          slug: 'zavoevanie-ameriki',
          title: 'Легенда о «чёрной легенде»: роль Католической Церкви в завоевании Америки'
        },
        {
          slug: 'delo-galileja',
          title: '«Дело Галилея»: исторический факт против мифологии просветителей'
        }
      ]
    },
    {
      id: 'iannaccone',
      authorSlug: 'andzhelo-loreti',
      title: 'Марио Артуро Яннакконе',
      subtitle: 'Авторский цикл Анджело Лорети',
      hubUrl: '',
      intro:
        'Знакомство с итальянским историком и католическим автором Марио Артуро Яннакконе — книги, биографии и спорные страницы XX века.',
      items: [
        { slug: 'serial-killer', title: '«Лучше царствовать в аду»: почему серийные убийцы стали героями нашего времени' },
        { slug: 'kristiada', title: '«Кристиада»: забытая эпическая война за Христа Царя' },
        { slug: 'ispanskie-mucheniki', title: '«Преследование»: замученные за веру в Испании XX века' },
        { slug: 'tri-mira', title: 'Марио Артуро Яннакконе как биограф трёх миров: святой, пророк и романист' },
        { slug: 'illuminatus', title: '«Тайная история»: как баварский профессор создал прообраз мирового заговора' },
        { slug: 'rennes-le-chateau', title: 'Ренн-ле-Шато: как литературная мистификация стала оружием против христианства' }
      ]
    }
  ];

  function byId(id) {
    for (var i = 0; i < CYCLES.length; i++) if (CYCLES[i].id === id) return CYCLES[i];
    return null;
  }

  function forAuthor(authorSlug) {
    return CYCLES.filter(function (c) {
      return c.authorSlug === authorSlug;
    });
  }

  function byArticleSlug(slug) {
    if (!slug) return null;
    for (var i = 0; i < CYCLES.length; i++) {
      var c = CYCLES[i];
      var items = c.items || [];
      for (var j = 0; j < items.length; j++) {
        if (items[j].slug === slug) return c;
      }
    }
    return null;
  }

  global.YakCycles = {
    ALL: CYCLES,
    byId: byId,
    forAuthor: forAuthor,
    byArticleSlug: byArticleSlug
  };
})(typeof window !== 'undefined' ? window : globalThis);

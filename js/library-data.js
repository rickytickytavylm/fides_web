/**
 * Библиотека ЯКатолик — пилотные данные по ТЗ.
 * section: church | books
 * Читалка / избранное / просмотры — зарезервированы в схеме.
 */
(function (global) {
  'use strict';

  var SECTIONS = {
    church: {
      id: 'church',
      title: 'Документы Церкви',
      desc: 'Энциклики, послания и другие документы · Оригинальное название — в приоритете',
      categories: [
        { id: 'encyclicals', label: 'Энциклики' },
        { id: 'exhortations', label: 'Апостольские увещевания' },
        { id: 'letters', label: 'Послания' },
        { id: 'messages', label: 'Обращения и послания' }
      ]
    },
    books: {
      id: 'books',
      title: 'Книги',
      desc: 'Авторские произведения, переводы и издания, размещению которых не препятствует авторское право.',
      categories: [
        { id: 'hagiography', label: 'Житийная литература' },
        { id: 'children', label: 'Для детей' },
        { id: 'spirituality', label: 'Духовность' },
        { id: 'theology', label: 'Богословие' },
        { id: 'history', label: 'История' }
      ]
    }
  };

  var DOC_TYPES = [
    { id: 'encyclical', label: 'Энциклика' },
    { id: 'exhortation', label: 'Апостольское увещевание' },
    { id: 'letter', label: 'Послание' },
    { id: 'message', label: 'Обращение' },
    { id: 'constitution', label: 'Апостольская конституция' }
  ];

  var POPES = [
    { id: 'francis', label: 'Папа Франциск' },
    { id: 'benedict-xvi', label: 'Папа Бенедикт XVI' },
    { id: 'john-paul-ii', label: 'Папа Иоанн Павел II' },
    { id: 'dicastery-doctrine', label: 'Дикастерия вероучения' }
  ];

  var THEMES = [
    { id: 'ecology', label: 'Экология' },
    { id: 'family', label: 'Семья' },
    { id: 'social', label: 'Социальное учение' },
    { id: 'faith', label: 'Вера' },
    { id: 'mercy', label: 'Милосердие' },
    { id: 'ai', label: 'ИИ и технологии' },
    { id: 'youth', label: 'Молодёжь' },
    { id: 'saints', label: 'Святые' },
    { id: 'prayer', label: 'Молитва' }
  ];

  /** @type {Array<Object>} */
  var ITEMS = [
    {
      id: 'laudato-si',
      section: 'church',
      category: 'encyclicals',
      docType: 'encyclical',
      pope: 'francis',
      titleOriginal: "Laudato si'",
      titleRu: 'Хвала Тебе',
      author: 'Папа Франциск',
      firstPublished: '2015-05-24',
      editionDate: '2015-06-18',
      publisher: 'Libreria Editrice Vaticana / рус. изд.',
      originalLanguage: 'la',
      translator: 'Синодальная комиссия',
      genre: 'Документ Церкви',
      annotation:
        'Энциклика об экологии и заботе об общем доме. Призыв к экологическому обращению, справедливости и ответственности за творение.',
      ageRating: '0+',
      flags: { lgbt18: false, substances: false, foreignAgent: false },
      themes: ['ecology', 'social', 'faith'],
      coverTone: '#3d6b4f',
      addedAt: '2026-01-12',
      views: 1840,
      downloadsCount: 620,
      downloads: [
        { format: 'PDF', url: '#', size: '1.2 МБ' },
        { format: 'EPUB', url: '#', size: '480 КБ' }
      ],
      buyUrl: '',
      quotes: [
        'Земля, наш дом, всё больше превращается в огромную свалку.',
        'Подлинная экологическая ориентация становится обращением.'
      ]
    },
    {
      id: 'fratelli-tutti',
      section: 'church',
      category: 'encyclicals',
      docType: 'encyclical',
      pope: 'francis',
      titleOriginal: 'Fratelli tutti',
      titleRu: 'Все братья',
      author: 'Папа Франциск',
      firstPublished: '2020-10-03',
      editionDate: '2020-10-04',
      publisher: 'Libreria Editrice Vaticana',
      originalLanguage: 'it',
      translator: 'Официальный перевод',
      genre: 'Документ Церкви',
      annotation:
        'Энциклика о братстве и социальной дружбе. О миграции, политике, диалоге и культуре встречи.',
      ageRating: '0+',
      flags: { lgbt18: false, substances: false, foreignAgent: false },
      themes: ['social', 'mercy', 'faith'],
      coverTone: '#8a5a2b',
      addedAt: '2026-02-03',
      views: 1320,
      downloadsCount: 410,
      downloads: [
        { format: 'PDF', url: '#', size: '1.4 МБ' },
        { format: 'FB2', url: '#', size: '620 КБ' }
      ],
      quotes: ['Никто не спасается в одиночку.']
    },
    {
      id: 'lumen-fidei',
      section: 'church',
      category: 'encyclicals',
      docType: 'encyclical',
      pope: 'francis',
      titleOriginal: 'Lumen fidei',
      titleRu: 'Свет веры',
      author: 'Папа Франциск',
      firstPublished: '2013-06-29',
      editionDate: '2013-07-05',
      publisher: 'Libreria Editrice Vaticana',
      originalLanguage: 'la',
      translator: 'Официальный перевод',
      genre: 'Документ Церкви',
      annotation: 'Энциклика о вере, завершающая триптих Бенедикта XVI о богословских добродетелях.',
      ageRating: '0+',
      flags: { lgbt18: false, substances: false, foreignAgent: false },
      themes: ['faith'],
      coverTone: '#c4a35a',
      addedAt: '2025-11-20',
      views: 890,
      downloadsCount: 270,
      downloads: [{ format: 'PDF', url: '#', size: '900 КБ' }]
    },
    {
      id: 'deus-caritas-est',
      section: 'church',
      category: 'encyclicals',
      docType: 'encyclical',
      pope: 'benedict-xvi',
      titleOriginal: 'Deus caritas est',
      titleRu: 'Бог есть любовь',
      author: 'Папа Бенедикт XVI',
      firstPublished: '2005-12-25',
      editionDate: '2006-01-25',
      publisher: 'Libreria Editrice Vaticana',
      originalLanguage: 'la',
      translator: 'Официальный перевод',
      genre: 'Документ Церкви',
      annotation: 'Первая энциклика Бенедикта XVI о любви Божией, эросе и агапе, о служении милосердия.',
      ageRating: '0+',
      flags: { lgbt18: false, substances: false, foreignAgent: false },
      themes: ['mercy', 'faith'],
      coverTone: '#6b2d3c',
      addedAt: '2025-10-08',
      views: 1560,
      downloadsCount: 540,
      downloads: [
        { format: 'PDF', url: '#', size: '780 КБ' },
        { format: 'EPUB', url: '#', size: '340 КБ' }
      ]
    },
    {
      id: 'amoris-laetitia',
      section: 'church',
      category: 'exhortations',
      docType: 'exhortation',
      pope: 'francis',
      titleOriginal: 'Amoris laetitia',
      titleRu: 'Радость любви',
      author: 'Папа Франциск',
      firstPublished: '2016-03-19',
      editionDate: '2016-04-08',
      publisher: 'Libreria Editrice Vaticana',
      originalLanguage: 'it',
      translator: 'Официальный перевод',
      genre: 'Документ Церкви',
      annotation: 'Апостольское увещевание о любви в семье. Сопровождение, различение, интеграция.',
      ageRating: '18+',
      flags: { lgbt18: true, substances: false, foreignAgent: false },
      themes: ['family', 'mercy'],
      coverTone: '#b85c38',
      addedAt: '2026-03-01',
      views: 2100,
      downloadsCount: 780,
      downloads: [
        { format: 'PDF', url: '#', size: '1.6 МБ' },
        { format: 'EPUB', url: '#', size: '700 КБ' }
      ],
      quotes: ['Семья — не проблема, а возможность.']
    },
    {
      id: 'Christus-vivit',
      section: 'church',
      category: 'exhortations',
      docType: 'exhortation',
      pope: 'francis',
      titleOriginal: 'Christus vivit',
      titleRu: 'Христос жив',
      author: 'Папа Франциск',
      firstPublished: '2019-03-25',
      editionDate: '2019-04-02',
      publisher: 'Libreria Editrice Vaticana',
      originalLanguage: 'es',
      translator: 'Официальный перевод',
      genre: 'Документ Церкви',
      annotation: 'Апостольское увещевание к молодёжи и всему народу Божию.',
      ageRating: '0+',
      flags: { lgbt18: false, substances: false, foreignAgent: false },
      themes: ['youth', 'faith'],
      coverTone: '#2f5d8c',
      addedAt: '2026-01-28',
      views: 970,
      downloadsCount: 310,
      downloads: [{ format: 'PDF', url: '#', size: '1.1 МБ' }]
    },
    {
      id: 'dignitas-infinita',
      section: 'church',
      category: 'letters',
      docType: 'letter',
      pope: 'dicastery-doctrine',
      titleOriginal: 'Dignitas infinita',
      titleRu: 'Бесконечное достоинство',
      author: 'Дикастерия вероучения',
      firstPublished: '2024-04-02',
      editionDate: '2024-04-08',
      publisher: 'Libreria Editrice Vaticana',
      originalLanguage: 'it',
      translator: 'Официальный перевод',
      genre: 'Документ Церкви',
      annotation: 'Декларация о человеческом достоинстве. Включает темы биоэтики, насилия и современных вызовов.',
      ageRating: '18+',
      flags: { lgbt18: true, substances: true, foreignAgent: false },
      themes: ['social', 'family', 'ai'],
      coverTone: '#4a3f6b',
      addedAt: '2026-04-10',
      views: 2400,
      downloadsCount: 910,
      downloads: [
        { format: 'PDF', url: '#', size: '980 КБ' },
        { format: 'EPUB', url: '#', size: '420 КБ' }
      ]
    },
    {
      id: 'antiquum-ministerium',
      section: 'church',
      category: 'letters',
      docType: 'letter',
      pope: 'francis',
      titleOriginal: 'Antiquum ministerium',
      titleRu: 'Древнее служение',
      author: 'Папа Франциск',
      firstPublished: '2021-05-10',
      editionDate: '2021-05-11',
      publisher: 'Libreria Editrice Vaticana',
      originalLanguage: 'la',
      translator: 'Официальный перевод',
      genre: 'Документ Церкви',
      annotation: 'Апостольское послание motu proprio об учреждении служения катехиста.',
      ageRating: '0+',
      flags: { lgbt18: false, substances: false, foreignAgent: false },
      themes: ['faith', 'youth'],
      coverTone: '#5c6b3d',
      addedAt: '2025-09-14',
      views: 420,
      downloadsCount: 140,
      downloads: [{ format: 'PDF', url: '#', size: '220 КБ' }]
    },
    {
      id: 'story-of-a-soul',
      section: 'books',
      category: 'hagiography',
      docType: '',
      pope: '',
      titleOriginal: 'Histoire d’une âme',
      titleRu: 'История одной души',
      author: 'Св. Тереза из Лизиё',
      firstPublished: '1898-01-01',
      editionDate: '2018-03-12',
      publisher: 'Издательство Францисканцев',
      originalLanguage: 'fr',
      translator: 'классический перевод',
      genre: 'Житийная литература',
      annotation:
        'Автобиографические записки святой Терезы Младенца Иисуса — путь «малой дорогой» доверия и любви.',
      ageRating: '12+',
      flags: { lgbt18: false, substances: false, foreignAgent: false },
      themes: ['saints', 'prayer', 'faith'],
      coverTone: '#9a6b4a',
      addedAt: '2026-02-18',
      views: 1680,
      downloadsCount: 720,
      downloads: [
        { format: 'PDF', url: '#', size: '2.1 МБ' },
        { format: 'EPUB', url: '#', size: '890 КБ' },
        { format: 'FB2', url: '#', size: '760 КБ' }
      ],
      buyUrl: '',
      quotes: ['Я хочу проводить небо, делая добро на земле.']
    },
    {
      id: 'confessions-augustine',
      section: 'books',
      category: 'spirituality',
      titleOriginal: 'Confessiones',
      titleRu: 'Исповедь',
      author: 'Св. Августин',
      firstPublished: '0400-01-01',
      editionDate: '2019-09-01',
      publisher: 'АСТ / классика',
      originalLanguage: 'la',
      translator: 'М. Е. Сергеенко',
      genre: 'Духовность',
      annotation: 'Классический текст христианской духовности: обращение, память, время и Бог.',
      ageRating: '16+',
      flags: { lgbt18: false, substances: false, foreignAgent: false },
      themes: ['prayer', 'faith'],
      coverTone: '#2c3e50',
      addedAt: '2026-03-22',
      views: 2210,
      downloadsCount: 990,
      downloads: [
        { format: 'PDF', url: '#', size: '3.4 МБ' },
        { format: 'EPUB', url: '#', size: '1.2 МБ' }
      ],
      quotes: ['Ты создал нас для Себя, и неспокойно сердце наше, пока не упокоится в Тебе.']
    },
    {
      id: 'little-flowers',
      section: 'books',
      category: 'hagiography',
      titleOriginal: 'Fioretti di San Francesco',
      titleRu: 'Цветочки святого Франциска',
      author: 'народная традиция',
      firstPublished: '1390-01-01',
      editionDate: '2017-05-20',
      publisher: 'Францисканское издательство',
      originalLanguage: 'it',
      translator: 'классический перевод',
      genre: 'Житийная литература',
      annotation: 'Сборник преданий о святом Франциске Ассизском и его спутниках.',
      ageRating: '0+',
      flags: { lgbt18: false, substances: false, foreignAgent: false },
      themes: ['saints', 'ecology'],
      coverTone: '#6d8b3e',
      addedAt: '2025-12-02',
      views: 1100,
      downloadsCount: 450,
      downloads: [
        { format: 'PDF', url: '#', size: '1.8 МБ' },
        { format: 'FB2', url: '#', size: '640 КБ' }
      ]
    },
    {
      id: 'catholic-tales-children',
      section: 'books',
      category: 'children',
      titleOriginal: 'Catholic Tales for Children',
      titleRu: 'Католические истории для детей',
      author: 'сборник',
      firstPublished: '2020-01-01',
      editionDate: '2022-11-10',
      publisher: 'Духовная библиотека',
      originalLanguage: 'ru',
      translator: '',
      genre: 'Для детей',
      annotation: 'Короткие истории о святых, праздниках и добродетелях для семейного чтения.',
      ageRating: '0+',
      flags: { lgbt18: false, substances: false, foreignAgent: false },
      themes: ['saints', 'youth', 'faith'],
      coverTone: '#e8a54b',
      addedAt: '2026-05-01',
      views: 640,
      downloadsCount: 280,
      downloads: [{ format: 'PDF', url: '#', size: '4.2 МБ' }],
      buyUrl: ''
    },
    {
      id: 'introduction-devout',
      section: 'books',
      category: 'spirituality',
      titleOriginal: 'Introduction à la vie dévote',
      titleRu: 'Введение в благочестивую жизнь',
      author: 'Св. Франциск Сальский',
      firstPublished: '1609-01-01',
      editionDate: '2016-08-15',
      publisher: 'Издательство Францисканцев',
      originalLanguage: 'fr',
      translator: 'классический перевод',
      genre: 'Духовность',
      annotation: 'Практическое руководство к святости в обычной жизни мирянина.',
      ageRating: '12+',
      flags: { lgbt18: false, substances: false, foreignAgent: false },
      themes: ['prayer', 'faith'],
      coverTone: '#7a4e6e',
      addedAt: '2026-04-02',
      views: 980,
      downloadsCount: 360,
      downloads: [
        { format: 'PDF', url: '#', size: '2.0 МБ' },
        { format: 'EPUB', url: '#', size: '820 КБ' }
      ]
    },
    {
      id: 'church-history-short',
      section: 'books',
      category: 'history',
      titleOriginal: 'A Short History of the Catholic Church',
      titleRu: 'Краткая история Католической Церкви',
      author: 'учебный сборник',
      firstPublished: '2014-01-01',
      editionDate: '2021-02-01',
      publisher: 'Катехизаторская серия',
      originalLanguage: 'ru',
      translator: '',
      genre: 'История',
      annotation: 'Обзор ключевых эпох: от апостолов до современности. Для катехизации и самообразования.',
      ageRating: '12+',
      flags: { lgbt18: false, substances: false, foreignAgent: false },
      themes: ['faith', 'social'],
      coverTone: '#3d4f5c',
      addedAt: '2025-08-30',
      views: 760,
      downloadsCount: 290,
      downloads: [{ format: 'PDF', url: '#', size: '5.5 МБ' }]
    }
  ];

  function byId(id) {
    for (var i = 0; i < ITEMS.length; i++) if (ITEMS[i].id === id) return ITEMS[i];
    return null;
  }

  function labelOf(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i].label;
    return id || '';
  }

  function displayTitle(item) {
    if (!item) return '';
    if (item.section === 'church') {
      return item.titleOriginal || item.titleRu || '';
    }
    return item.titleRu || item.titleOriginal || '';
  }

  function subtitleTitle(item) {
    if (!item) return '';
    if (item.section === 'church') {
      return item.titleRu && item.titleRu !== item.titleOriginal ? item.titleRu : '';
    }
    return item.titleOriginal && item.titleOriginal !== item.titleRu ? item.titleOriginal : '';
  }

  function yearOf(iso) {
    if (!iso) return '';
    var y = String(iso).slice(0, 4);
    return y === '0400' ? 'ок. 400' : y;
  }

  function formatDate(iso) {
    if (!iso) return '—';
    var p = String(iso).split('-');
    if (p[0] === '0400') return 'ок. 400';
    if (p.length < 3) return p[0];
    return p[2] + '.' + p[1] + '.' + p[0];
  }

  function categoryLabel(item) {
    if (!item) return '';
    var sec = SECTIONS[item.section];
    if (!sec) return item.genre || '';
    return labelOf(sec.categories, item.category) || item.genre || '';
  }

  function popularityScore(item) {
    return (item.views || 0) + (item.downloadsCount || 0) * 2;
  }

  var COVERS = {
    church: 'assets/cards/library-church.webp',
    books: 'assets/cards/library-books.webp'
  };

  global.YAK_LIBRARY = {
    SECTIONS: SECTIONS,
    covers: COVERS,
    DOC_TYPES: DOC_TYPES,
    POPES: POPES,
    THEMES: THEMES,
    ITEMS: ITEMS,
    byId: byId,
    labelOf: labelOf,
    displayTitle: displayTitle,
    subtitleTitle: subtitleTitle,
    yearOf: yearOf,
    formatDate: formatDate,
    categoryLabel: categoryLabel,
    popularityScore: popularityScore
  };
})(typeof window !== 'undefined' ? window : globalThis);

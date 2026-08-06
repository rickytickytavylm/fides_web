/**
 * Деревья разделов «О Церкви» и «Духовная жизнь» (ТЗ Анастасии).
 * type: hub | cards | page | category | external
 */
(function (global) {
  'use strict';

  function page(title, lead) {
    return {
      type: 'page',
      title: title,
      lead: lead || 'Материал готовится. Здесь будет текст страницы по ТЗ — пока каркас навигации.',
    };
  }

  function category(title, slug, lead) {
    return {
      type: 'category',
      title: title,
      slug: slug,
      lead: lead || '',
    };
  }

  function external(title, href, lead) {
    return {
      type: 'external',
      title: title,
      href: href,
      lead: lead || '',
    };
  }

  var NAVIGATOR_MORE = {
    id: 'want-more',
    title: 'Хочу узнать больше',
    tone: 'accent',
    href: 'church.html?path=navigator',
  };

  function withSiblings(routeId, cards) {
    return cards.map(function (c) {
      c.routeId = routeId;
      return c;
    });
  }

  var CHURCH = {
    id: 'church',
    title: 'О Церкви',
    desc: 'Пять стартовых маршрутов — от первого визита в храм до навигатора католической жизни.',
    type: 'hub',
    cards: [
      { id: 'first-time', title: 'Я здесь впервые', tone: 'a' },
      { id: 'become', title: 'Хочу стать католиком', tone: 'b' },
      { id: 'return', title: 'Хочу вернуться в Церковь', tone: 'c' },
      { id: 'deepen', title: 'Я католик, хочу углубить веру', tone: 'd' },
      { id: 'navigator', title: 'Навигатор по католической жизни', tone: 'wide' },
    ],
    nodes: {
      'first-time': {
        type: 'cards',
        title: 'Я здесь впервые',
        desc: 'Пять шагов для тех, кто только знакомится с Католической Церковью.',
        cards: withSiblings('first-time', [
          { id: 'first-visit', title: 'Я впервые в католическом храме' },
          { id: 'afraid', title: 'Боюсь сделать что-то неправильно' },
          { id: 'mass-confused', title: 'Я ничего не понимаю на Мессе' },
          { id: 'can-ask', title: 'Можно ли задавать вопросы?' },
          { id: 'newcomer-stories', title: 'Истории других новичков', wide: true },
        ]),
      },
      'first-visit': Object.assign(page(
        'Я впервые в католическом храме',
        'Фото-путеводитель по храму на примере московского Кафедрального собора — в следующей итерации контента.'
      ), { siblingsOf: 'first-time' }),
      'afraid': Object.assign(page(
        'Боюсь сделать что-то неправильно',
        'Правила поведения в храме: спокойно, просто и по делу.'
      ), { siblingsOf: 'first-time' }),
      'mass-confused': Object.assign(page(
        'Я ничего не понимаю на Мессе',
        'Краткий путеводитель по Мессе. Для углубления — материалы в разделе «Духовная жизнь».'
      ), { siblingsOf: 'first-time', also: [{ title: 'Путеводитель по Мессе', href: 'spiritual-life.html?path=mass-guide' }] }),
      'can-ask': Object.assign(page(
        'Можно ли задавать вопросы?',
        'Да. Ниже — куда обратиться: ЧаВо, вопрос священнику, чат-бот и сообщество.'
      ), {
        siblingsOf: 'first-time',
        also: [
          { title: 'Вопросы священнику', href: 'archive.html?category=ask-priest' },
          { title: 'Спросить в чате', href: 'chat.html' },
        ],
      }),
      'newcomer-stories': Object.assign(
        category('Истории других новичков', 'svidetelstva', 'Подборка свидетельств о первых шагах в Церкви.'),
        { siblingsOf: 'first-time' }
      ),

      'become': {
        type: 'cards',
        title: 'Хочу стать католиком',
        desc: 'Путь от интереса к присоединению к Католической Церкви.',
        cards: withSiblings('become', [
          { id: 'become-start', title: 'С чего начать' },
          { id: 'become-baptism', title: 'Что значит «креститься» / «присоединиться»' },
          { id: 'become-catechumenate', title: 'Катехуменат: что это и как попасть' },
          { id: 'become-know', title: 'Что я должен знать о вере' },
          { id: 'become-parish', title: 'Как найти приход и поговорить со священником', wide: true },
        ]),
      },
      'become-start': Object.assign(page('С чего начать'), { siblingsOf: 'become' }),
      'become-baptism': Object.assign(page('Что значит «креститься» / «присоединиться»'), { siblingsOf: 'become' }),
      'become-catechumenate': Object.assign(page('Катехуменат: что это и как попасть'), { siblingsOf: 'become' }),
      'become-know': Object.assign(page('Что я должен знать о вере'), { siblingsOf: 'become' }),
      'become-parish': Object.assign(page(
        'Как найти приход и поговорить со священником',
        'Найдите ближайший приход на карте и напишите или придите на Мессу.'
      ), {
        siblingsOf: 'become',
        also: [{ title: 'Карта храмов', href: 'map.html' }],
      }),

      'return': {
        type: 'cards',
        title: 'Хочу вернуться в Церковь',
        desc: 'Если вы давно не были в Церкви — здесь мягкий вход обратно.',
        cards: withSiblings('return', [
          { id: 'return-steps', title: 'Первые шаги после долгого перерыва' },
          { id: 'return-confession', title: 'Исповедь: как подготовиться и не бояться' },
          { id: 'return-liturgy', title: 'Участие в богослужениях' },
          { id: 'return-community', title: 'Как снова войти в общину' },
          { id: 'return-stories', title: 'Истории тех, кто вернулся', wide: true },
        ]),
      },
      'return-steps': Object.assign(page('Первые шаги после долгого перерыва'), { siblingsOf: 'return' }),
      'return-confession': Object.assign(page('Исповедь: как подготовиться и не бояться'), { siblingsOf: 'return' }),
      'return-liturgy': Object.assign(page('Участие в богослужениях'), { siblingsOf: 'return' }),
      'return-community': Object.assign(page('Как снова войти в общину'), { siblingsOf: 'return' }),
      'return-stories': Object.assign(
        category('Истории тех, кто вернулся', 'svidetelstva'),
        { siblingsOf: 'return' }
      ),

      'deepen': {
        type: 'cards',
        title: 'Я католик, хочу углубить веру',
        desc: 'Таинства, молитва, Писание, повседневность и служение.',
        cards: withSiblings('deepen', [
          { id: 'deepen-sacraments', title: 'Что такое таинства и как к ним приступить' },
          { id: 'deepen-pray', title: 'Как молиться' },
          { id: 'deepen-bible', title: 'Как читать Библию' },
          { id: 'deepen-daily', title: 'Освящение повседневной жизни' },
          { id: 'deepen-serve', title: 'Найти общину или служение', wide: true },
        ]),
      },
      'deepen-sacraments': Object.assign(page('Что такое таинства и как к ним приступить'), {
        siblingsOf: 'deepen',
        also: [{ title: 'Раздел «Таинства»', href: 'spiritual-life.html?path=sacraments' }],
      }),
      'deepen-pray': Object.assign(page('Как молиться'), {
        siblingsOf: 'deepen',
        also: [{ title: 'Раздел «Молитва»', href: 'spiritual-life.html?path=prayer' }],
      }),
      'deepen-bible': Object.assign(page('Как читать Библию'), { siblingsOf: 'deepen' }),
      'deepen-daily': Object.assign(page('Освящение повседневной жизни'), { siblingsOf: 'deepen' }),
      'deepen-serve': Object.assign(page('Найти общину или служение'), {
        siblingsOf: 'deepen',
        also: [{ title: 'Карта храмов', href: 'map.html' }],
      }),

      'navigator': {
        type: 'navigator',
        title: 'Навигатор по католической жизни',
        desc: 'Каталог тем: вера, таинства, жизнь, молитва, община и помощь.',
        groups: [
          {
            title: 'Во что мы верим',
            items: [
              'Кто такой Бог: Отец, Сын и Святой Дух',
              'Кто такой Иисус Христос и почему Он умер и воскрес',
              'Что такое Церковь и зачем она нужна',
              'Кто такая Дева Мария',
              'Святые — наши друзья и заступники',
              'Жизнь вечная: воскресение, рай, ад, чистилище',
              'Экуменизм и отношение к другим христианам',
            ],
          },
          {
            title: 'Таинства и литургия',
            items: [
              'Что происходит на Мессе',
              'Евхаристия — сердце жизни Церкви',
              'Что такое таинства и как к ним приступить',
              'Исповедь: как подготовиться и не бояться',
              'Цвета литургического года и католический календарь',
            ],
          },
          {
            title: 'Как жить по вере',
            items: [
              'Десять заповедей сегодня',
              'Заповеди блаженств',
              'Добродетели и грех',
              'Воспитание совести',
              'Социальное учение Церкви',
              'Биоэтика и защита жизни',
              'Прощение и примирение',
            ],
          },
          {
            title: 'Молитва и духовная жизнь',
            items: [
              'Как начать молиться',
              'Молитва своими словами и молитва Церкви',
              'Любимые молитвы католиков',
              'Lectio Divina',
              'Розарий и другие традиции',
              'Когда кажется, что Бог молчит',
              'Духовное сопровождение',
            ],
          },
          {
            title: 'Община и призвание',
            items: [
              'Что такое приход и как найти свой',
              'Монахи, монахини, настоятель',
              'Церковные движения',
              'Молодёжка',
              'Семейная жизнь как призвание',
              'Как найти друзей в Церкви',
              'Супружеские встречи',
              'Различение призвания',
            ],
          },
          {
            title: 'Помощь и поддержка',
            items: [
              { title: 'Задать вопрос священнику', href: 'archive.html?category=ask-priest' },
              { title: 'Спросить в чате', href: 'chat.html' },
              { title: 'Свидетельства', href: 'archive.html?category=svidetelstva' },
              'Попросить о молитве',
              'Найти духовного собеседника',
              'Когда тяжело: страдание, утрата, кризис веры',
              'Горячие вопросы: наука и вера, страдание, церковь и политика',
            ],
          },
        ],
      },
    },
    moreCard: NAVIGATOR_MORE,
  };

  var SPIRIT = {
    id: 'spirit',
    title: 'Духовная жизнь',
    desc: 'Молитва, литургия, таинства, паломничества, реколлекции и статьи о духовности.',
    type: 'hub',
    cards: [
      { id: 'prayer', title: 'Молитва', tone: 'a' },
      { id: 'liturgy', title: 'Литургия', tone: 'b' },
      { id: 'sacraments', title: 'Таинства', tone: 'c' },
      { id: 'pilgrimage', title: 'Паломничества', tone: 'd' },
      { id: 'retreats', title: 'Реколлекции / Духовные упражнения', tone: 'e' },
      { id: 'spirit-articles', title: 'Статьи о духовной жизни', tone: 'wide', href: 'archive.html?category=spirituality' },
    ],
    nodes: {
      'prayer': {
        type: 'cards',
        title: 'Молитва',
        desc: 'От первых шагов до Розария, Литургии Часов и молитвенных групп.',
        cards: [
          { id: 'what-is-prayer', title: 'Что такое молитва' },
          { id: 'basic-prayers', title: 'Основные молитвы' },
          { id: 'rosary', title: 'Молитва Розария' },
          { id: 'liturgy-hours', title: 'Литургия Часов' },
          { id: 'contemplative', title: 'Созерцательная молитва' },
          { id: 'lectio', title: 'Lectio Divina' },
          { id: 'prayer-group', title: 'Найти молитвенную группу' },
          { id: 'prayer-articles', title: 'Статьи о молитве', href: 'archive.html?category=pray', wide: true },
        ],
      },
      'what-is-prayer': Object.assign(page('Что такое молитва'), { siblingsOf: 'prayer', feedCategory: 'pray', feedLabel: 'Статьи о молитве' }),
      'basic-prayers': {
        type: 'prayers',
        title: 'Основные молитвы',
        siblingsOf: 'prayer',
        feedCategory: 'pray',
        feedLabel: 'Статьи о молитве',
        prayers: [
          { title: 'Отче наш', text: 'Отче наш, сущий на небесах! Да святится имя Твоё…' },
          { title: 'Радуйся, Мария', text: 'Радуйся, Мария, благодати полная, Господь с Тобою…' },
          { title: 'Слава Отцу', text: 'Слава Отцу и Сыну и Святому Духу…' },
          { title: 'Символ веры', text: 'Верую в Бога, Отца Всемогущего…' },
        ],
      },
      'rosary': Object.assign(page('Молитва Розария'), { siblingsOf: 'prayer', feedCategory: 'pray', feedLabel: 'Статьи о молитве' }),
      'liturgy-hours': Object.assign(page('Литургия Часов'), { siblingsOf: 'prayer', feedCategory: 'pray', feedLabel: 'Статьи о молитве' }),
      'contemplative': Object.assign(page('Созерцательная молитва'), { siblingsOf: 'prayer', feedCategory: 'pray', feedLabel: 'Статьи о молитве' }),
      'lectio': Object.assign(page('Lectio Divina'), { siblingsOf: 'prayer', feedCategory: 'pray', feedLabel: 'Статьи о молитве' }),
      'prayer-group': Object.assign(page('Найти молитвенную группу'), { siblingsOf: 'prayer', feedCategory: 'pray', feedLabel: 'Статьи о молитве' }),

      'liturgy': {
        type: 'cards',
        title: 'Литургия',
        desc: 'Месса, облачения, цвета года и школа министрантов.',
        cards: [
          { id: 'mass-guide', title: 'Путеводитель по Святой Мессе' },
          { id: 'mass-ru', title: 'Чин Мессы на русском языке' },
          { id: 'mass-la', title: 'Чин Мессы на латыни' },
          { id: 'eucharist-faq', title: 'FAQ: Таинство Евхаристии' },
          { id: 'lit-colors', title: 'Литургические цвета' },
          { id: 'lit-vestments', title: 'Литургические облачения' },
          { id: 'altar-servers', title: 'Школа министрантов' },
          { id: 'liturgy-articles', title: 'Статьи по литургике', href: 'archive.html?category=liturgy', wide: true },
        ],
      },
      'mass-guide': Object.assign(page('Путеводитель по Святой Мессе'), { siblingsOf: 'liturgy', feedCategory: 'liturgy', feedLabel: 'Статьи по литургике' }),
      'mass-ru': Object.assign(page('Чин Мессы на русском языке'), { siblingsOf: 'liturgy', feedCategory: 'liturgy', feedLabel: 'Статьи по литургике' }),
      'mass-la': Object.assign(page('Чин Мессы на латыни'), { siblingsOf: 'liturgy', feedCategory: 'liturgy', feedLabel: 'Статьи по литургике' }),
      'eucharist-faq': Object.assign(page('FAQ: Таинство Евхаристии'), { siblingsOf: 'liturgy', feedCategory: 'liturgy', feedLabel: 'Статьи по литургике' }),
      'lit-colors': Object.assign(page('Литургические цвета'), { siblingsOf: 'liturgy', feedCategory: 'liturgy', feedLabel: 'Статьи по литургике' }),
      'lit-vestments': Object.assign(page('Литургические облачения'), { siblingsOf: 'liturgy', feedCategory: 'liturgy', feedLabel: 'Статьи по литургике' }),
      'altar-servers': Object.assign(page('Школа министрантов'), { siblingsOf: 'liturgy', feedCategory: 'liturgy', feedLabel: 'Статьи по литургике' }),

      'sacraments': {
        type: 'cards',
        title: 'Таинства',
        desc: 'Четыре входа в тему таинств Церкви.',
        cards: [
          { id: 'sacraments-what', title: 'Что такое таинства' },
          { id: 'sacraments-init', title: 'Таинства христианского посвящения' },
          { id: 'sacraments-heal', title: 'Таинства исцеления' },
          { id: 'sacraments-service', title: 'Таинства служения общине', wide: true },
        ],
      },
      'sacraments-what': Object.assign(page('Что такое таинства'), { siblingsOf: 'sacraments' }),
      'sacraments-init': Object.assign(page('Таинства христианского посвящения'), { siblingsOf: 'sacraments' }),
      'sacraments-heal': Object.assign(page('Таинства исцеления'), { siblingsOf: 'sacraments' }),
      'sacraments-service': Object.assign(page('Таинства служения общине'), { siblingsOf: 'sacraments' }),

      'pilgrimage': {
        type: 'cards',
        title: 'Паломничества',
        desc: 'Анонсы, направления, свидетельства и практические советы.',
        cards: [
          { id: 'pil-announce', title: 'Анонсы', href: 'archive.html?category=announcement' },
          { id: 'pil-places', title: 'Святилища / Направления', href: 'archive.html?category=puteshestviya' },
          { id: 'pil-witness', title: 'Свидетельства', href: 'archive.html?category=svidetelstva' },
          { id: 'pil-need', title: 'Что нужно паломнику', wide: true },
        ],
      },
      'pil-need': Object.assign(page('Что нужно паломнику'), { siblingsOf: 'pilgrimage' }),

      'retreats': {
        type: 'cards',
        title: 'Реколлекции / Духовные упражнения',
        desc: 'Что это такое, игнатианская традиция, анонсы и онлайн-циклы.',
        cards: [
          { id: 'retreat-what', title: 'Что такое духовные упражнения' },
          { id: 'retreat-ignatian', title: 'Игнатианские упражнения' },
          { id: 'retreat-announce', title: 'Анонсы', href: 'archive.html?category=announcement' },
          { id: 'retreat-online', title: 'Реколлекции онлайн', wide: true },
        ],
      },
      'retreat-what': Object.assign(page('Что такое духовные упражнения'), { siblingsOf: 'retreats' }),
      'retreat-ignatian': Object.assign(page('Игнатианские упражнения'), { siblingsOf: 'retreats' }),
      'retreat-online': Object.assign(page(
        'Реколлекции онлайн',
        'Подборка циклов реколлекций на Великий пост и Адвент — будет наполнена редакцией.'
      ), { siblingsOf: 'retreats' }),
    },
  };

  global.YakGuides = { church: CHURCH, spirit: SPIRIT };
})(typeof window !== 'undefined' ? window : this);

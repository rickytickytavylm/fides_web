/**
 * Календарь ЯКатолик — литургия + события (РФ / мир).
 * Даты: Ordinary Time, август 2026. Можно дополнять вручную.
 */
(function (global) {
  'use strict';

  var DAYS = [
    {
      date: '2026-08-07',
      weekday: 'Пятница',
      liturgical: {
        title: 'Пятница XVIII обычной недели',
        rank: 'будний',
        color: 'зелёный',
        note: 'Память (по желанию): свв. Сикста II, папы, и сподвижников, мучеников; св. Каетана, священника.'
      },
      events: [
        {
          id: 'today-pray',
          kind: 'liturgy',
          scope: 'world',
          time: '',
          title: 'Обычное время — продолжение пути после Преображения',
          place: 'Всемирный литургический календарь',
          desc: 'Вчера Церковь праздновала Преображение Господне. Сегодня — будний день Ordinary Time.',
          href: 'spiritual-life.html'
        }
      ]
    },
    {
      date: '2026-08-08',
      weekday: 'Суббота',
      liturgical: {
        title: 'Св. Доминик, священник',
        rank: 'память',
        color: 'белый',
        note: 'Основатель Ордена проповедников (доминиканцев).'
      },
      events: [
        {
          id: 'dominic',
          kind: 'feast',
          scope: 'world',
          time: '',
          title: 'Память св. Доминика',
          place: 'Вселенская Церковь',
          desc: 'Основатель доминиканцев — ордена проповеди и изучения истины.',
          href: 'archive.html?q=Доминик'
        },
        {
          id: 'organ-msk',
          kind: 'event',
          scope: 'ru',
          time: '20:00',
          title: 'Летний вечер в соборе: орган и скрипка',
          place: 'Кафедральный собор, Москва · Малая Грузинская, 27/13',
          desc: 'Концерт в Римско-католическом кафедральном соборе Непорочного Зачатия.',
          href: 'map.html'
        },
        {
          id: 'dubinin-nw',
          kind: 'event',
          scope: 'ru',
          time: '',
          title: 'Паломничество по Северо-Западу',
          place: 'Архиепархия Божией Матери',
          desc: '3–9 августа: участие епископа Николая Дубинина в паломничестве по Северо-Западу.',
          href: 'https://cathmos.ru/curia_message/raspisanie-episkopa-nikolaya-dubinina-na-avgust-4/'
        }
      ]
    },
    {
      date: '2026-08-09',
      weekday: 'Воскресенье',
      liturgical: {
        title: 'XIX воскресенье обычного времени',
        rank: 'воскресенье',
        color: 'зелёный',
        note: 'Также: св. Тереза Бенедикта Креста (Эдита Штайн), дева и мученица, покровительница Европы — память, если не вытеснена воскресеньем.'
      },
      events: [
        {
          id: 'sunday-mass',
          kind: 'liturgy',
          scope: 'ru',
          time: 'утро / вечер',
          title: 'Воскресная Святая Месса',
          place: 'Приходы России',
          desc: 'Главный день недели. Найдите ближайший храм на карте.',
          href: 'map.html'
        },
        {
          id: 'edith-stein',
          kind: 'feast',
          scope: 'world',
          time: '',
          title: 'Св. Тереза Бенедикта Креста (Эдита Штайн)',
          place: 'Европа · покровительница',
          desc: 'Философ, кармелитка, мученица Освенцима — сопокровительница Европы.',
          href: 'archive.html?q=Эдита+Штайн'
        }
      ]
    },
    {
      date: '2026-08-10',
      weekday: 'Понедельник',
      liturgical: {
        title: 'Св. Лаврентий, диакон и мученик',
        rank: 'праздник',
        color: 'красный',
        note: 'Один из самых чтимых римских мучеников.'
      },
      events: [
        {
          id: 'lawrence',
          kind: 'feast',
          scope: 'world',
          time: '',
          title: 'Праздник св. Лаврентия',
          place: 'Рим / Вселенская Церковь',
          desc: 'Диакон Римской Церкви, мученик III века.',
          href: 'spiritual-life.html'
        }
      ]
    },
    {
      date: '2026-08-11',
      weekday: 'Вторник',
      liturgical: {
        title: 'Св. Клара, дева',
        rank: 'память',
        color: 'белый',
        note: 'Основательница Ордена кларисс; покровительница телевидения.'
      },
      events: [
        {
          id: 'clare',
          kind: 'feast',
          scope: 'world',
          time: '',
          title: 'Память св. Клары Ассизской',
          place: 'Вселенская Церковь',
          desc: 'Сподвижница св. Франциска, основательница кларисс.',
          href: 'archive.html?q=Клара'
        }
      ]
    },
    {
      date: '2026-08-12',
      weekday: 'Среда',
      liturgical: {
        title: 'Среда XIX обычной недели',
        rank: 'будний',
        color: 'зелёный',
        note: 'Память (по желанию): св. Иоанны Франциски де Шанталь.'
      },
      events: []
    },
    {
      date: '2026-08-13',
      weekday: 'Четверг',
      liturgical: {
        title: 'Четверг XIX обычной недели',
        rank: 'будний',
        color: 'зелёный',
        note: 'Память (по желанию): свв. Понтиана, папы, и Ипполита, священника, мучеников.'
      },
      events: []
    },
    {
      date: '2026-08-14',
      weekday: 'Пятница',
      liturgical: {
        title: 'Св. Максимилиан Мария Кольбе, священник и мученик',
        rank: 'память',
        color: 'красный',
        note: 'Покровитель журналистов, узников, зависимых. Навечерие Успения.'
      },
      events: [
        {
          id: 'kolbe',
          kind: 'feast',
          scope: 'world',
          time: '',
          title: 'Память св. Максимилиана Кольбе',
          place: 'Вселенская Церковь',
          desc: 'Францисканец, отдал жизнь за другого узника в Освенциме.',
          href: 'archive.html?q=Кольбе'
        }
      ]
    },
    {
      date: '2026-08-15',
      weekday: 'Суббота',
      liturgical: {
        title: 'Успение Пресвятой Богородицы',
        rank: 'торжество',
        color: 'белый',
        note: 'Одно из главных богородичных торжеств года. В Ватикане — выходной день.'
      },
      events: [
        {
          id: 'assumption',
          kind: 'feast',
          scope: 'world',
          time: '',
          title: 'Торжество Успения Пресвятой Богородицы',
          place: 'Вселенская Церковь',
          desc: 'Взятие Девы Марии с телом и душой на небо.',
          href: 'spiritual-life.html'
        },
        {
          id: 'assumption-spb',
          kind: 'event',
          scope: 'ru',
          time: '19:00',
          title: 'Торжественная Месса — престольный праздник',
          place: 'Приход Успения ПДМ, Санкт-Петербург',
          desc: 'По расписанию епископа Николая Дубинина — Святая Месса в престольный праздник прихода.',
          href: 'https://cathmos.ru/curia_message/raspisanie-episkopa-nikolaya-dubinina-na-avgust-4/'
        },
        {
          id: 'assumption-vyborg',
          kind: 'event',
          scope: 'ru',
          time: '12:00',
          title: 'Престольный праздник св. Гиацинта (16 авг.)',
          place: 'Выборг',
          desc: 'На следующий день — торжественная Месса в приходе св. Гиацинта в Выборге.',
          href: 'https://cathmos.ru/curia_message/raspisanie-episkopa-nikolaya-dubinina-na-avgust-4/'
        }
      ]
    }
  ];

  function todayIso() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function byDate(iso) {
    for (var i = 0; i < DAYS.length; i++) if (DAYS[i].date === iso) return DAYS[i];
    return null;
  }

  function weekFrom(iso) {
    var start = iso || todayIso();
    var idx = DAYS.findIndex(function (d) { return d.date === start; });
    if (idx < 0) idx = 0;
    return DAYS.slice(idx, idx + 7);
  }

  global.YakCalendar = {
    DAYS: DAYS,
    todayIso: todayIso,
    byDate: byDate,
    weekFrom: weekFrom
  };
})(typeof window !== 'undefined' ? window : globalThis);

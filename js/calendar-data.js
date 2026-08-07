/**
 * Две сущности:
 * 1) День Церкви — литургический день (YakCalendar.DAYS)
 * 2) Афиша — события/мероприятия (YakCalendar.EVENTS)
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
      }
    },
    {
      date: '2026-08-08',
      weekday: 'Суббота',
      liturgical: {
        title: 'Св. Доминик, священник',
        rank: 'память',
        color: 'белый',
        note: 'Основатель Ордена проповедников (доминиканцев).'
      }
    },
    {
      date: '2026-08-09',
      weekday: 'Воскресенье',
      liturgical: {
        title: 'XIX воскресенье обычного времени',
        rank: 'воскресенье',
        color: 'зелёный',
        note: 'Также в календаре: св. Тереза Бенедикта Креста (Эдита Штайн), дева и мученица, покровительница Европы.'
      }
    },
    {
      date: '2026-08-10',
      weekday: 'Понедельник',
      liturgical: {
        title: 'Св. Лаврентий, диакон и мученик',
        rank: 'праздник',
        color: 'красный',
        note: 'Один из самых чтимых римских мучеников.'
      }
    },
    {
      date: '2026-08-11',
      weekday: 'Вторник',
      liturgical: {
        title: 'Св. Клара, дева',
        rank: 'память',
        color: 'белый',
        note: 'Основательница Ордена кларисс; покровительница телевидения.'
      }
    },
    {
      date: '2026-08-12',
      weekday: 'Среда',
      liturgical: {
        title: 'Среда XIX обычной недели',
        rank: 'будний',
        color: 'зелёный',
        note: 'Память (по желанию): св. Иоанны Франциски де Шанталь.'
      }
    },
    {
      date: '2026-08-13',
      weekday: 'Четверг',
      liturgical: {
        title: 'Четверг XIX обычной недели',
        rank: 'будний',
        color: 'зелёный',
        note: 'Память (по желанию): свв. Понтиана, папы, и Ипполита, священника, мучеников.'
      }
    },
    {
      date: '2026-08-14',
      weekday: 'Пятница',
      liturgical: {
        title: 'Св. Максимилиан Мария Кольбе, священник и мученик',
        rank: 'память',
        color: 'красный',
        note: 'Покровитель журналистов и узников. Навечерие Успения Пресвятой Богородицы.'
      }
    },
    {
      date: '2026-08-15',
      weekday: 'Суббота',
      liturgical: {
        title: 'Успение Пресвятой Богородицы',
        rank: 'торжество',
        color: 'белый',
        note: 'Одно из главных богородичных торжеств года.'
      }
    },
    {
      date: '2026-08-16',
      weekday: 'Воскресенье',
      liturgical: {
        title: 'XX воскресенье обычного времени',
        rank: 'воскресенье',
        color: 'зелёный',
        note: 'Также: св. Стефан Венгерский — память, если не вытеснена воскресеньем.'
      }
    }
  ];

  /** Афиша: концерты, престольные праздники, визиты, встречи */
  var EVENTS = [
    {
      id: 'organ-msk',
      date: '2026-08-08',
      time: '20:00',
      title: 'Летний вечер в соборе: орган и скрипка',
      place: 'Кафедральный собор, Москва · Малая Грузинская, 27/13',
      city: 'Москва',
      scope: 'ru',
      kind: 'concert',
      desc: 'Концерт в Римско-католическом кафедральном соборе Непорочного Зачатия.',
      href: 'map.html'
    },
    {
      id: 'dubinin-nw',
      date: '2026-08-08',
      time: '',
      title: 'Паломничество по Северо-Западу',
      place: 'Архиепархия Божией Матери',
      city: 'Санкт-Петербург и регион',
      scope: 'ru',
      kind: 'pilgrimage',
      desc: '3–9 августа: участие епископа Николая Дубинина в паломничестве по Северо-Западу.',
      href: 'https://cathmos.ru/curia_message/raspisanie-episkopa-nikolaya-dubinina-na-avgust-4/'
    },
    {
      id: 'assumption-spb',
      date: '2026-08-15',
      time: '19:00',
      title: 'Торжественная Месса — престольный праздник Успения',
      place: 'Приход Успения ПДМ, Санкт-Петербург',
      city: 'Санкт-Петербург',
      scope: 'ru',
      kind: 'mass',
      desc: 'По расписанию епископа Николая Дубинина.',
      href: 'https://cathmos.ru/curia_message/raspisanie-episkopa-nikolaya-dubinina-na-avgust-4/'
    },
    {
      id: 'hyacinth-vyborg',
      date: '2026-08-16',
      time: '12:00',
      title: 'Престольный праздник св. Гиацинта',
      place: 'Приход св. Гиацинта, Выборг',
      city: 'Выборг',
      scope: 'ru',
      kind: 'mass',
      desc: 'Торжественная Святая Месса в престольный праздник прихода.',
      href: 'https://cathmos.ru/curia_message/raspisanie-episkopa-nikolaya-dubinina-na-avgust-4/'
    },
    {
      id: 'assumption-world',
      date: '2026-08-15',
      time: '',
      title: 'Успение Пресвятой Богородицы — торжество Церкви',
      place: 'Вселенская Церковь',
      city: '',
      scope: 'world',
      kind: 'feast-note',
      desc: 'Главный богородичный день недели — см. также «День Церкви».',
      href: 'calendar.html'
    }
  ];

  function todayIso() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function byDate(iso) {
    for (var i = 0; i < DAYS.length; i++) if (DAYS[i].date === iso) return DAYS[i];
    return null;
  }

  function weekFrom(iso) {
    var start = iso || todayIso();
    var idx = DAYS.findIndex(function (d) { return d.date === start; });
    if (idx < 0) idx = 0;
    return DAYS.slice(idx, Math.min(idx + 7, DAYS.length));
  }

  function upcomingEvents(fromIso) {
    var from = fromIso || todayIso();
    return EVENTS.slice()
      .filter(function (e) { return e.date >= from; })
      .sort(function (a, b) {
        if (a.date !== b.date) return a.date < b.date ? -1 : 1;
        return String(a.time || '').localeCompare(String(b.time || ''));
      });
  }

  function eventsOn(iso) {
    return EVENTS.filter(function (e) { return e.date === iso; });
  }

  global.YakCalendar = {
    DAYS: DAYS,
    EVENTS: EVENTS,
    todayIso: todayIso,
    byDate: byDate,
    weekFrom: weekFrom,
    upcomingEvents: upcomingEvents,
    eventsOn: eventsOn
  };
})(typeof window !== 'undefined' ? window : globalThis);

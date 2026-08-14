/** Каталог подкастов. Плеер проповедей сюда не подключаем. */
(function (global) {
  'use strict';

  var SHOWS = [
    {
      id: 'slovo-na-voskresenie',
      title: 'Слово на воскресенье',
      host: 'о. Андрей Дударев',
      blurb: 'Евангелие недели — коротко, по делу, чтобы взять с собой на Мессу и в будни.',
      cover: 'assets/cards/articles-biblical-studies.webp',
      episodes: 48,
      updated: '2026-08-10',
      latest: { title: 'Не бойтесь малого стада', date: '10 августа' }
    },
    {
      id: 'den-cerkvi',
      title: 'День Церкви',
      host: 'Редакция ЯКатолик',
      blurb: 'Святой дня, цвет облачений и одна мысль, которую можно пронести через сутки.',
      cover: 'assets/cards/articles-saints.webp',
      episodes: 120,
      updated: '2026-08-13',
      latest: { title: 'Св. Максимилиан Кольбе', date: '13 августа' }
    },
    {
      id: 'voprosy-very',
      title: 'Вопросы веры',
      host: 'о. Кирилл Горбунов',
      blurb: 'Короткие ответы на то, что обычно спрашивают после Мессы и в исповедальне.',
      cover: 'assets/cards/articles-ask-priest.webp',
      episodes: 36,
      updated: '2026-08-08',
      latest: { title: 'Можно ли молиться своими словами?', date: '8 августа' }
    },
    {
      id: 'zhitiya',
      title: 'Жития',
      host: 'Мария Леонова',
      blurb: 'Святые без открытки: характер, выбор, слабость и то, что осталось после них.',
      cover: 'assets/cards/articles-biographies.webp',
      episodes: 22,
      updated: '2026-07-28',
      latest: { title: 'Эдит Штайн: мысль, которая стала жертвой', date: '28 июля' }
    },
    {
      id: 'na-poroge',
      title: 'На пороге',
      host: 'Анастасия Бозио',
      blurb: 'Для тех, кто заходит в храм впервые и не знает, куда поставить свечу и куда сесть.',
      cover: 'assets/cards/church-first-time.webp',
      episodes: 14,
      updated: '2026-08-02',
      latest: { title: 'Что делать, если все крестятся, а вы нет', date: '2 августа' }
    },
    {
      id: 'semejnyj-krug',
      title: 'Семейный круг',
      host: 'Елена и Павел Воронины',
      blurb: 'Дом, дети, воскресенье и то, как вера не превращается в расписание.',
      cover: 'assets/cards/articles-lifestyle.webp',
      episodes: 18,
      updated: '2026-07-20',
      latest: { title: 'Когда ребёнок не хочет в храм', date: '20 июля' }
    },
    {
      id: 'palomnik',
      title: 'Паломник',
      host: 'Игорь Зуев',
      blurb: 'Дороги, святыни и люди, которых встречаешь по пути — от Ченстоховы до Соловков.',
      cover: 'assets/cards/spirit-pilgrimage.webp',
      episodes: 11,
      updated: '2026-07-12',
      latest: { title: 'Лурд без открытки', date: '12 июля' }
    },
    {
      id: 'lectio-vsluh',
      title: 'Lectio вслух',
      host: 'с. Тереза Крылова',
      blurb: 'Молитвенное чтение Писания: один отрывок, четыре шага, тишина в конце.',
      cover: 'assets/cards/prayer-lectio.webp',
      episodes: 27,
      updated: '2026-08-11',
      latest: { title: 'Псалом 22', date: '11 августа' }
    }
  ];

  function byId(id) {
    id = String(id || '');
    for (var i = 0; i < SHOWS.length; i++) {
      if (SHOWS[i].id === id) return SHOWS[i];
    }
    return null;
  }

  function latestShows(limit) {
    return SHOWS.slice().sort(function (a, b) {
      return String(b.updated || '').localeCompare(String(a.updated || ''));
    }).slice(0, limit || 4);
  }

  function epLabel(n) {
    n = Number(n) || 0;
    var mod10 = n % 10;
    var mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return n + ' эпизод';
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return n + ' эпизода';
    return n + ' эпизодов';
  }

  global.YakPodcasts = {
    shows: SHOWS,
    byId: byId,
    latestShows: latestShows,
    epLabel: epLabel
  };
})(typeof window !== 'undefined' ? window : this);

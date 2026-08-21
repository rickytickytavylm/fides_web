/**
 * Каталог видео с бакета Fides (fidesetratio).
 * Страница не зависит от API: если сервер молчит, ролики всё равно открываются.
 */
(function (global) {
  'use strict';

  var BUCKET = 'https://storage.yandexcloud.net/fidesetratio/';

  var SHORTS = [
    {
      id: 1,
      title: 'Стоит ли стучаться в закрытые двери?',
      description:
        'Всегда ли мы готовы к тому, о чём просим у Бога? о. Юрий Дорогин — о цели желаний, которые может открыть только Он.',
      speaker: 'о. Юрий Дорогин',
    },
    {
      id: 2,
      title: 'Легко ли тебе прощать 70×7 раз?',
      description:
        'Мы каждый день читаем «Отче наш» — но каждый ли день готовы простить? с. Даша о словах, которые освобождают.',
      speaker: 'с. Даша',
    },
    {
      id: 3,
      title: 'Сколько нужно молиться настоящему христианину?',
      description:
        'о. Юрий OP — о том, на чём на самом деле стоит молитва и желание говорить с Богом чаще.',
      speaker: 'о. Юрий OP',
    },
    {
      id: 4,
      title: 'Почему не во всех орденах есть третий орден?',
      description:
        'о. Юрий из Ордена проповедников — об общинах мирян, которые живут духовностью монашеских орденов.',
      speaker: 'о. Юрий OP',
    },
    {
      id: 5,
      title: 'Что такое ходатайственная молитва?',
      description: 'Короткое наставление с. Даши: просить нужно даже за тех, кто тебе не рад.',
      speaker: 'с. Даша',
    },
    {
      id: 6,
      title: 'Большой взрыв = креационизм?',
      description:
        'с. Анастасия — как теория Большого взрыва указывает на Бога и ведёт к космологическому аргументу.',
      speaker: 'с. Анастасия',
    },
    {
      id: 7,
      title: 'Что если я сомневаюсь в Иисусе?',
      description:
        'с. Иоанна Павла из Дочерей милосердия — короткое слово, если в вере появилось сомнение.',
      speaker: 'с. Иоанна Павла',
    },
    {
      id: 8,
      title: 'Библия написана не обо мне, но для меня?',
      description:
        'Блаженны слышащие слово Божие и соблюдающие его. Через Евангелие Христос обращается и к тебе.',
      speaker: '',
    },
    {
      id: 9,
      title: 'Песня в храме — молитва?',
      description:
        'Если сомневаешься, петь ли на Мессе и важно ли это в общении с Богом — это видео для тебя.',
      speaker: '',
    },
  ].map(function (v) {
    return {
      id: v.id,
      title: v.title,
      description: v.description,
      speaker: v.speaker,
      type: 'short',
      size: 'small',
      videoUrl: BUCKET + 'video' + v.id + '.mp4',
      thumb: null,
    };
  });

  var LONGS = [
    {
      id: 10,
      slug: '01-svyatost',
      title: 'Святость',
      description: 'Фильм из цикла «Океан милосердия» — о святости как пути, а не как пьедестале.',
    },
    {
      id: 11,
      slug: '02-bog-molchit',
      title: 'Бог молчит',
      description: 'Когда кажется, что небо пусто: тишина Бога и ответ веры.',
    },
    {
      id: 12,
      slug: '03-tsarskoe-ditya',
      title: 'Царское дитя',
      description: 'О достоинстве человека, которое нельзя заслужить и нельзя отменить.',
    },
    {
      id: 13,
      slug: '04-v-diapazone',
      title: 'В диапазоне',
      description: 'Вера не в одной ноте: как слышать Бога в разной жизни.',
    },
    {
      id: 14,
      slug: '05-vsem-serdcem',
      title: 'Всем сердцем',
      description: 'Любовь к Богу, которая не делит сердце на «церковное» и остальное.',
    },
  ].map(function (v, i) {
    return {
      id: v.id,
      title: v.title,
      description: v.description,
      speaker: 'Океан милосердия',
      type: 'long',
      size: 'large',
      featured: i === 0,
      videoUrl: BUCKET + 'ocean-mercy/' + v.slug + '.mp4',
      thumb: BUCKET + 'ocean-mercy/' + v.slug + '.jpg',
    };
  });

  global.YakVideos = {
    bucket: BUCKET,
    items: LONGS.concat(SHORTS),
  };
})(window);

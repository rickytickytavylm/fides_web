/* Католик Live: ролики из бакета, папки по приходам. Пакет редакции эту запись не стирает. */
(function () {
  'use strict';
  var V = window.YakVideos;
  if (!V || !V.items || !V.channels) return;

  var LOGO = 'https://storage.yandexcloud.net/fidesetratio/desk/video/catholic-live/brand/logo-light.jpg';
  var ROOT = 'https://storage.yandexcloud.net/fidesetratio/desk/video/catholic-live/';

  var parishes = [
    { id: 'berezniki', cityId: 'berezniki', city: 'Березники', name: 'Приход Мария Царица Мира', cover: 'assets/video/catholic-live/berezniki.jpg' },
    { id: 'moskva', cityId: 'moskva', city: 'Москва', name: 'Храм святого Людовика, приход Петра и Павла', cover: 'assets/video/catholic-live/moskva.jpg' },
    { id: 'moskva-sobor', cityId: 'moskva', city: 'Москва', name: 'Кафедральный собор Непорочного Зачатия Пресвятой Девы Марии', cover: 'assets/video/catholic-live/moskva-sobor.jpg' },
    { id: 'rostov', cityId: 'rostov', city: 'Ростов-на-Дону', name: 'Приход Тайной Вечери', cover: 'assets/video/catholic-live/rostov.jpg' },
    { id: 'spb', cityId: 'spb', city: 'Санкт-Петербург', name: 'Храм Посещения Пресвятой Девой Марией Елизаветы', cover: 'assets/video/catholic-live/spb.jpg' },
    { id: 'spb-heart', cityId: 'spb', city: 'Санкт-Петербург', name: 'Храм Святейшего Сердца Иисуса', cover: 'assets/video/catholic-live/spb-heart.jpg' },
    { id: 'spb-uspenie', cityId: 'spb', city: 'Санкт-Петербург', name: 'Собор Успения Пресвятой Девы Марии', cover: 'assets/video/catholic-live/spb-uspenie.jpg' },
    { id: 'smolensk', cityId: 'smolensk', city: 'Смоленск', name: 'Приход Непорочного Зачатия Пресвятой Девы Марии', cover: 'assets/video/catholic-live/smolensk.jpg' },
    { id: 'chita', cityId: 'chita', city: 'Чита', name: 'Приход святых апостолов Петра и Павла', cover: 'assets/video/catholic-live/chita.jpg' },
    { id: 'antoniy-paduanskiy', cityId: 'gorodovikovsk', city: 'Городовиковск', name: 'Приход св. Антония Падуанского', cover: 'assets/video/catholic-live/antoniy.jpg' }
  ];

  var rows = [
    [9101, 'berezniki', 'berezniki/01-krestnyj-hod-po-sluchayu-torzhestva-svyatyh-tela.mp4', 'Крестный ход на торжество Тела и Крови Христовых, 2026'],
    [9102, 'moskva', 'moskva/01-tollite-hostias-i-gaudete-ispolnyaet-hor-prihoda.mov', 'Tollite Hostias и Gaudete. Хор прихода, 2025'],
    [9103, 'moskva-sobor', 'moskva/02-lyubov-tebya-derzhit-ispolnyaet-l-2025-goda-v-ch.mp4', '«Любовь тебя держит». К 1700-летию Никейского Собора, 2025'],
    [9104, 'rostov', 'rostov/01-agnus-dei-rozhdestvenskie-bogosluzheniya-v-priho.mov', 'Agnus Dei. Рождественские богослужения, 2025'],
    [9105, 'rostov', 'rostov/02-allilujya-rozhdestvenskie-bogosluzheniya-v-priho.mp4', 'Аллилуйя. Рождественские богослужения, 2025'],
    [9106, 'rostov', 'rostov/03-prestolnyj-prazdnik-v-cerkvi-tajnoj-vecheri-v-ro.mp4', 'Престольный праздник'],
    [9107, 'rostov', 'rostov/04-psalom-96-95-rozhdestvenskie-bogosluzheniya-v-pr.mp4', 'Псалом 96 (95). Рождественские богослужения, 2025'],
    [9108, 'spb-heart', 'spb/01-12-iyunya-2026-goda-pri-bogosluzhenie-vozglavil-.mp4', 'Престольный праздник, 12 июня 2026'],
    [9109, 'spb', 'spb/02-verbnoe-voskresene-2026-v-hrame-posescheniya-pre.mov', 'Вербное воскресенье, 2026'],
    [9110, 'spb', 'spb/03-eleopomazanie-na-svyatoj-messe-v-hrame-poseschen.mov', 'Елеопомазание на Святой Мессе, 22 марта 2026'],
    [9111, 'spb', 'spb/04-krestnyj-put-1-v-hrame-posescheniya-presvyatoj-d.mov', 'Крестный путь, часть 1, 8 марта 2026'],
    [9112, 'spb', 'spb/05-krestnyj-put-2-v-hrame-posescheniya-presvyatoj-d.mov', 'Крестный путь, часть 2, 8 марта 2026'],
    [9113, 'spb-uspenie', 'spb/06-svyataya-messa-posvyaschen-nkt-peterburg-27-01-2.mp4', 'Святая Месса к 82-й годовщине блокады Ленинграда, 27 января 2026'],
    [9114, 'spb', 'spb/07-scenka-rozhdestvenskij-arii-elizavety-v-sankt-pe.mp4', 'Сценка «Рождественский подарок», 4 января 2026'],
    [9115, 'smolensk', 'smolensk/01-16-maya-2026-goda-smolensk-ptolomeush-kuchmik-by.mp4', 'Рукоположение Птоломеуша Кучмика, 16 мая 2026'],
    [9116, 'smolensk', 'smolensk/02-v-prihode-neporochnogo-zachatiya-presvyatoj-devy.mp4', 'Сооружают вертеп'],
    [9117, 'smolensk', 'smolensk/03-v-kanun-rozhdestva-zavershaets-chnogo-zachatiya-.mp4', 'В канун Рождества'],
    [9118, 'smolensk', 'smolensk/04-video-o-prazdnike-tela-i-krovi-hristovyh-v-priho.mp4', 'Праздник Тела и Крови Христовых'],
    [9119, 'smolensk', 'smolensk/05-vtornik-2-nedeli-pashi-cvety-i-horugvi-ukrashayu.mp4', 'Вторник 2-й недели Пасхи. Цветы и хоругви'],
    [9120, 'smolensk', 'smolensk/06-na-protyazhenie-vsego-2025-yubi-go-zachatiya-pre.mp4', 'Юбилейный 2025 год'],
    [9121, 'smolensk', 'smolensk/07-nachalo-pastyrskogo-i-uchebnogo-goda-v-prihode-n.mp4', 'Начало пастырского и учебного года'],
    [9122, 'smolensk', 'smolensk/08-o-svoem-lyubimom-svyatom-karlo-akutise-rasskazyv.mp4', 'Отец Канизий Конкол о святом Карло Акутисе'],
    [9123, 'smolensk', 'smolensk/09-okormlyayuschie-prihod-bratya-fr-oj-devy-marii-v.mp4', 'Братья-францисканцы, 3 мая 2026'],
    [9124, 'smolensk', 'smolensk/10-osennij-kostel-budnij-vecher-v-prihode-neporochn.mp4', 'Осенний костёл. Будний вечер'],
    [9125, 'smolensk', 'smolensk/11-prihod-neporochnogo-zachatiya-p-et-torzhestvo-pr.mp4', 'Торжество Пресвятой Богородицы, 1 января 2026'],
    [9126, 'smolensk', 'smolensk/12-prihod-neporochnogo-zachatiya-presvyatoj-devy-ma.mp4', 'Святая Суббота, 2026'],
    [9127, 'smolensk', 'smolensk/13-rozhdestvo-v-prihode-neporochnogo-zachatiya-pres.mp4', 'Рождество'],
    [9128, 'chita', 'chita/01-allilujya-rozhdestvenskie-bogosluzheniya-v-priho.mp4', 'Аллилуйя. Рождественские богослужения, 2025'],
    [9129, 'chita', 'chita/02-rozhdestvenskie-bogosluzheniya-v-prihode-svyatyh.mp4', 'Рождественские богослужения, 2025'],
    [9130, 'chita', 'chita/03-svet-nevechernij-rozhdestvenskie-bogosluzheniya-.mp4', 'Свет невечерний. Рождественские богослужения, 2025']
  ];

  var cityOf = {};
  parishes.forEach(function (p) { cityOf[p.id] = p.city; });

  var videos = rows.map(function (row) {
    return {
      id: row[0],
      title: row[3],
      description: '',
      speaker: cityOf[row[1]] || '',
      type: 'parish',
      channelId: 'catholic-live',
      parish: row[1],
      thumb: 'assets/video/catholic-live/frames/' + row[0] + '.jpg',
      videoUrl: ROOT + row[2]
    };
  });

  var channel = {
    id: 'catholic-live',
    name: 'Католик Live',
    logo: LOGO,
    cover: LOGO,
    layout: 'parishes',
    keep: true,
    authorSlug: 'igor-fofanov',
    parishes: parishes,
    cities: [
      { id: 'moskva', name: 'Москва', cover: 'assets/video/catholic-live/city-moskva.jpg' },
      { id: 'rostov', name: 'Ростов-на-Дону', cover: 'assets/video/catholic-live/city-rostov.jpg' },
      { id: 'spb', name: 'Санкт-Петербург', cover: 'assets/video/catholic-live/city-spb.jpg' },
      { id: 'smolensk', name: 'Смоленск', cover: 'assets/video/catholic-live/city-smolensk.jpg' },
      { id: 'chita', name: 'Чита', cover: 'assets/video/catholic-live/city-chita.jpg' },
      { id: 'berezniki', name: 'Березники', cover: 'assets/video/catholic-live/city-berezniki.jpg' },
      { id: 'gorodovikovsk', name: 'Городовиковск', cover: 'assets/video/catholic-live/city-gorodovikovsk.jpg' }
    ],
    bio: '«Католик.LIVE. Живая история католической России» — интернет-портал, созданный для того, чтобы прихожане, священники и монашествующие присылали истории из жизни своих приходов, свидетельства христианской жизни. Материалы разделены по епархиям и приходам и представлены в виде коротких видео.',
    links: [],
    cycles: []
  };

  /* Присланные и одобренные редакцией ролики: приходят с сервера, а не из этого файла. */
  var sent = [];
  var parishById = {};
  parishes.forEach(function (p) { parishById[p.id] = p; });

  function parishOf(row) {
    var known = parishById[row.parishId];
    if (known) return known;
    if (row.parishId !== 'other') return null;
    var name = String(row.parishName || '').toLowerCase().replace(/ё/g, 'е');
    if (name.indexOf('антони') !== -1 && name.indexOf('паду') !== -1) return parishById['antoniy-paduanskiy'];
    return null;
  }

  function fromServer(row) {
    var p = parishOf(row);
    if (!p || !row.videoUrl || !row.id) return null;
    return {
      id: 'live-' + row.id,
      title: row.title,
      description: row.description || '',
      speaker: p.city,
      type: 'parish',
      channelId: 'catholic-live',
      parish: p.id,
      thumb: p.cover,
      videoUrl: row.videoUrl
    };
  }

  function ensure() {
    var list = videos.concat(sent);
    list.forEach(function (v) {
      var i;
      for (i = 0; i < V.items.length; i++) {
        if (String(V.items[i].id) === String(v.id)) {
          V.items[i] = v;
          return;
        }
      }
      V.items.push(v);
    });
    for (var n = V.channels.length - 1; n >= 0; n--) {
      if (V.channels[n].id === channel.id) V.channels.splice(n, 1);
    }
    V.channels.push(channel);
  }

  var orig = V.mergePack;
  V.mergePack = function (pack) {
    var result = orig ? orig(pack) : V.items;
    ensure();
    return result;
  };

  ensure();

  function loadSent() {
    if (!window.Vera || !Vera.ensureApi || typeof fetch !== 'function') return;
    Vera.ensureApi().then(function (base) {
      return fetch(String(base || '').replace(/\/$/, '') + '/api/content/live-videos', { headers: { Accept: 'application/json' }, cache: 'no-store' });
    }).then(function (res) {
      if (!res.ok) throw new Error('bad');
      return res.json();
    }).then(function (data) {
      var next = ((data && data.items) || []).map(fromServer).filter(Boolean);
      var same = next.length === sent.length && next.every(function (v, i) { return v.id === sent[i].id; });
      if (same) return;
      sent = next;
      ensure();
      if (V.notifyPack) V.notifyPack();
    }).catch(function () {});
  }

  loadSent();
})();

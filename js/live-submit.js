/* Форма «Прислать ролик» (Католик.LIVE): файл идёт сразу в хранилище, на сервер — только заявка. */
(function () {
  'use strict';

  var MAX = 1024 * 1024 * 1024;
  var KEY_STORE = 'yak_live_key';
  var V = window.YakVideos;
  var form = document.getElementById('live-form');
  if (!form) return;

  var $ = function (id) { return document.getElementById(id); };
  var keyEl = $('lf-key');
  var titleEl = $('lf-title');
  var parishEl = $('lf-parish');
  var nameEl = $('lf-name');
  var contactEl = $('lf-contact');
  var textEl = $('lf-text');
  var fileEl = $('lf-file');
  var goEl = $('lf-go');
  var errEl = $('lf-error');
  var progEl = $('lf-progress');
  var barEl = $('lf-bar');
  var progText = $('lf-progress-text');
  var doneEl = $('live-done');
  var busy = false;

  function readKey() {
    try { return localStorage.getItem(KEY_STORE) || ''; } catch (e) { return ''; }
  }
  function saveKey(k) {
    try { localStorage.setItem(KEY_STORE, k); } catch (e) {}
  }

  function fillParishes() {
    var channel = ((V && V.channels) || []).filter(function (c) { return c.id === 'catholic-live'; })[0];
    var parishes = (channel && channel.parishes) || [];
    var byCity = {};
    var order = [];
    parishes.forEach(function (p) {
      if (!byCity[p.city]) { byCity[p.city] = []; order.push(p.city); }
      byCity[p.city].push(p);
    });
    order.forEach(function (city) {
      var group = document.createElement('optgroup');
      group.label = city;
      byCity[city].forEach(function (p) {
        var o = document.createElement('option');
        o.value = p.id;
        o.textContent = p.name;
        o.setAttribute('data-name', p.city + ', ' + p.name);
        group.appendChild(o);
      });
      parishEl.appendChild(group);
    });
    var want = new URLSearchParams(location.search).get('parish') || '';
    if (want) parishEl.value = want;
  }

  function showError(msg) {
    errEl.textContent = msg || '';
    errEl.hidden = !msg;
    if (msg) {
      try { errEl.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
    }
  }

  function setBusy(on) {
    busy = on;
    goEl.disabled = on;
    goEl.textContent = on ? 'Отправляю…' : 'Отправить на проверку';
    Array.prototype.forEach.call(form.querySelectorAll('input,select,textarea'), function (el) { el.disabled = on; });
  }

  function progress(pct, text) {
    progEl.hidden = false;
    barEl.style.width = Math.max(0, Math.min(100, pct)) + '%';
    progText.textContent = text;
  }

  function fmtMb(bytes) {
    return (bytes / 1024 / 1024).toFixed(bytes > 100 * 1024 * 1024 ? 0 : 1) + ' МБ';
  }

  function typeOf(file) {
    var t = String(file.type || '').toLowerCase();
    if (t.indexOf('video/') === 0) return t;
    var ext = (String(file.name || '').match(/\.([a-z0-9]+)$/i) || [])[1];
    ext = String(ext || '').toLowerCase();
    if (ext === 'mov') return 'video/quicktime';
    if (ext === 'webm') return 'video/webm';
    if (ext === 'mp4' || ext === 'm4v') return 'video/mp4';
    return '';
  }

  function api(base, path, key, body) {
    return fetch(base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-token': key },
      body: JSON.stringify(body),
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (res.ok) return data;
        var msg = data.error || 'Не получилось отправить';
        if (res.status === 401) msg = data.code === 'wrong_key' ? 'Ключ не подошёл. Проверьте, что вставили его целиком.' : 'Введите ключ для отправки.';
        if (res.status === 403) msg = 'Этим ключом ролики присылать нельзя. Нужен ключ для видео — спросите в редакции.';
        if (res.status === 429) msg = data.error || 'Слишком много попыток. Подождите немного.';
        var err = new Error(msg);
        err.status = res.status;
        throw err;
      });
    });
  }

  function upload(url, headers, file) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      xhr.open('PUT', url, true);
      Object.keys(headers || {}).forEach(function (h) { xhr.setRequestHeader(h, headers[h]); });
      xhr.upload.onprogress = function (e) {
        if (!e.lengthComputable) return;
        progress((e.loaded / e.total) * 100, 'Загружаю ролик: ' + fmtMb(e.loaded) + ' из ' + fmtMb(e.total));
      };
      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error('Хранилище не приняло файл (' + xhr.status + '). Попробуйте ещё раз.'));
      };
      xhr.onerror = function () { reject(new Error('Загрузка оборвалась. Проверьте интернет и попробуйте ещё раз.')); };
      xhr.ontimeout = xhr.onerror;
      xhr.send(file);
    });
  }

  function validate() {
    var file = fileEl.files && fileEl.files[0];
    if (!keyEl.value.trim()) return 'Введите ключ для отправки.';
    if (titleEl.value.trim().length < 3) return 'Напишите название ролика.';
    if (!parishEl.value) return 'Выберите приход.';
    if (nameEl.value.trim().length < 2) return 'Напишите, как вас зовут.';
    if (contactEl.value.trim().length < 3) return 'Оставьте телефон, почту или Telegram, чтобы с вами можно было связаться.';
    if (textEl.value.trim().length < 10) return 'Расскажите о ролике хотя бы в одном-двух предложениях.';
    if (!file) return 'Выберите видеофайл.';
    if (!typeOf(file)) return 'Нужен видеофайл: mp4, mov или webm.';
    if (!file.size) return 'Файл пустой.';
    if (file.size > MAX) return 'Ролик больше 1 ГБ. Сожмите его или пришлите короче.';
    return '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;
    showError('');
    var bad = validate();
    if (bad) { showError(bad); return; }
    var file = fileEl.files[0];
    var key = keyEl.value.trim();
    var opt = parishEl.options[parishEl.selectedIndex];
    setBusy(true);
    progress(0, 'Проверяю ключ…');

    window.Vera.ensureApi().then(function (base) {
      base = String(base || '').replace(/\/$/, '');
      return api(base, '/api/live/submissions/sign', key, {
        filename: file.name,
        contentType: typeOf(file),
        size: file.size,
      }).then(function (ticket) {
        saveKey(key);
        progress(0, 'Загружаю ролик…');
        return upload(ticket.uploadUrl, ticket.headers || { 'Content-Type': typeOf(file) }, file).then(function () {
          progress(100, 'Файл загружен. Отправляю заявку…');
          return api(base, '/api/live/submissions', key, {
            title: titleEl.value,
            parishId: parishEl.value,
            parishName: (opt && opt.getAttribute('data-name')) || '',
            senderName: nameEl.value,
            contact: contactEl.value,
            description: textEl.value,
            videoKey: ticket.key,
          });
        });
      });
    }).then(function () {
      form.hidden = true;
      progEl.hidden = true;
      doneEl.hidden = false;
      try { doneEl.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (err) {}
    }).catch(function (err) {
      progEl.hidden = true;
      showError(err && err.message ? err.message : 'Не получилось отправить. Попробуйте ещё раз.');
    }).then(function () {
      setBusy(false);
    });
  });

  $('lf-again').addEventListener('click', function () {
    titleEl.value = '';
    textEl.value = '';
    fileEl.value = '';
    barEl.style.width = '0';
    doneEl.hidden = true;
    form.hidden = false;
  });

  keyEl.value = readKey();
  fillParishes();
})();

/* Форма «Прислать ролик» (Католик.LIVE): открыта всем. Файл идёт сразу в хранилище, на сервер — только заявка. */
(function () {
  'use strict';

  var MAX = 1024 * 1024 * 1024;
  var V = window.YakVideos;
  var form = document.getElementById('live-form');
  if (!form) return;

  var $ = function (id) { return document.getElementById(id); };
  var trapEl = $('lf-website');
  var titleEl = $('lf-title');
  var OTHER = 'other';
  var parishEl = $('lf-parish');
  var otherWrap = $('lf-other-wrap');
  var otherEl = $('lf-other');
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
      group.label = city || 'Приход';
      byCity[city].forEach(function (p) {
        var o = document.createElement('option');
        o.value = p.id;
        o.textContent = p.name;
        o.setAttribute('data-name', p.city + ', ' + p.name);
        group.appendChild(o);
      });
      parishEl.appendChild(group);
    });
    var other = document.createElement('option');
    other.value = OTHER;
    other.textContent = 'Моего прихода нет в списке';
    parishEl.appendChild(other);
    var want = new URLSearchParams(location.search).get('parish') || '';
    if (want) parishEl.value = want;
    syncOther();
  }

  function syncOther() {
    var on = parishEl.value === OTHER;
    otherWrap.hidden = !on;
    if (on) { try { otherEl.focus(); } catch (e) {} }
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

  function api(base, path, body) {
    return fetch(base + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (res.ok) return data;
        var err = new Error(data.error || 'Не получилось отправить. Попробуйте ещё раз.');
        err.status = res.status;
        throw err;
      });
    });
  }

  /* Пока идёт загрузка, экран телефона не гасим: уснувший браузер обрывает отправку. */
  var wake = null;
  function keepAwake(on) {
    try {
      if (on && navigator.wakeLock && navigator.wakeLock.request) {
        navigator.wakeLock.request('screen').then(function (l) { wake = l; }, function () {});
      } else if (!on && wake) {
        wake.release();
        wake = null;
      }
    } catch (e) {}
  }

  /* Телефон иногда не отдаёт файл из галереи сразу (готовит видео, тянет из iCloud). Проверяем до отправки. */
  function canRead(file) {
    return new Promise(function (resolve) {
      try {
        var r = new FileReader();
        r.onload = function () { resolve(true); };
        r.onerror = function () { resolve(false); };
        r.readAsArrayBuffer(file.slice(0, 4096));
      } catch (e) { resolve(false); }
    });
  }

  function envNote() {
    var ua = String(navigator.userAgent || '');
    var ios = (ua.match(/OS (\d+)[_\d]*/) || [])[1];
    return (ios ? 'ios' + ios : /Android/i.test(ua) ? 'android' : 'pc') + (navigator.standalone ? ' app' : '');
  }

  function upload(url, headers, file) {
    return canRead(file).then(function (ok) {
      if (!ok) {
        var err = new Error('Телефон не может прочитать этот файл. Возможно, видео ещё готовится или лежит в iCloud. Подождите минуту и выберите файл заново либо выберите другое видео.');
        err.detail = 'unreadable ' + envNote();
        throw err;
      }
      return upload2(url, headers, file);
    });
  }

  function upload2(url, headers, file) {
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      var sent = 0;
      var hidden = false;
      function onVis() { if (document.hidden) hidden = true; }
      document.addEventListener('visibilitychange', onVis);
      function done() { document.removeEventListener('visibilitychange', onVis); keepAwake(false); }
      function broke(kind) {
        var pct = file.size ? Math.round((sent / file.size) * 100) : 0;
        var why = !navigator.onLine ? ' Нет сети.' : hidden ? ' Страница уходила в фон — оставайтесь на ней, пока идёт загрузка.' : '';
        var err = new Error('Загрузка оборвалась на ' + pct + '%.' + why + ' Попробуйте ещё раз.');
        err.detail = kind + ' ' + (xhr.status || 0) + ' ' + pct + '% ' + envNote() + ' ' + (file.type || '?') + ' ' + Math.round(file.size / 1048576) + 'MB';
        reject(err);
      }
      keepAwake(true);
      xhr.open('PUT', url, true);
      Object.keys(headers || {}).forEach(function (h) { xhr.setRequestHeader(h, headers[h]); });
      xhr.upload.onprogress = function (e) {
        sent = e.loaded;
        if (!e.lengthComputable) return;
        progress((e.loaded / e.total) * 100, 'Загружаю ролик: ' + fmtMb(e.loaded) + ' из ' + fmtMb(e.total));
      };
      xhr.onload = function () {
        done();
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error('Хранилище не приняло файл (' + xhr.status + '). Попробуйте ещё раз.'));
      };
      xhr.onerror = function () { done(); broke('error'); };
      xhr.onabort = function () { done(); broke('abort'); };
      xhr.ontimeout = function () { done(); broke('timeout'); };
      xhr.send(file);
    });
  }

  function validate() {
    var file = fileEl.files && fileEl.files[0];
    if (titleEl.value.trim().length < 3) return 'Напишите название ролика.';
    if (!parishEl.value) return 'Выберите приход.';
    if (parishEl.value === OTHER && otherEl.value.trim().length < 3) return 'Напишите название вашего прихода и город.';
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
    var opt = parishEl.options[parishEl.selectedIndex];
    setBusy(true);
    progress(0, 'Готовлю загрузку…');

    window.Vera.ensureApi().then(function (base) {
      base = String(base || '').replace(/\/$/, '');
      return api(base, '/api/live/submissions/sign', {
        filename: file.name,
        contentType: typeOf(file),
        size: file.size,
      }).then(function (ticket) {
        progress(0, 'Загружаю ролик…');
        return upload(ticket.uploadUrl, ticket.headers || { 'Content-Type': typeOf(file) }, file).then(function () {
          progress(100, 'Файл загружен. Отправляю заявку…');
          return api(base, '/api/live/submissions', {
            title: titleEl.value,
            parishId: parishEl.value,
            parishName: parishEl.value === OTHER ? otherEl.value : ((opt && opt.getAttribute('data-name')) || ''),
            senderName: nameEl.value,
            contact: contactEl.value,
            description: textEl.value,
            videoKey: ticket.key,
            website: trapEl ? trapEl.value : '',
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
      var text = err && err.message ? err.message : 'Не получилось отправить. Попробуйте ещё раз.';
      if (err && err.detail) text += ' [' + err.detail + ']';
      showError(text);
    }).then(function () {
      setBusy(false);
    });
  });

  $('lf-again').addEventListener('click', function () {
    titleEl.value = '';
    textEl.value = '';
    fileEl.value = '';
    otherEl.value = '';
    barEl.style.width = '0';
    doneEl.hidden = true;
    form.hidden = false;
  });

  parishEl.addEventListener('change', syncOther);
  fillParishes();
})();

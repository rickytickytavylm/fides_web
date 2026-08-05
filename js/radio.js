(function () {
  'use strict';
  var V = window.Vera;
  var el = document.getElementById('radio-schedule');
  if (!el || !V) return;

  function todayKey() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  V.getSchedule()
    .then(function (obj) {
      var key = todayKey();
      var text = (obj && (obj[key] || obj[Object.keys(obj)[0]])) || '';
      if (!text) {
        el.textContent = 'Расписание на сегодня появится позже.';
        return;
      }
      el.textContent = text;
    })
    .catch(function () {
      el.textContent = 'Расписание временно недоступно.';
    });
})();

(function () {
  'use strict';
  var audio = document.getElementById('radio-el');
  var btn = document.getElementById('radio-play');
  var desk = document.getElementById('radio-desk');
  var live = document.getElementById('radio-live');
  var vol = document.getElementById('radio-vol');
  if (!audio || !btn || !desk) return;

  function sync() {
    var on = !audio.paused;
    desk.classList.toggle('is-on', on);
    btn.setAttribute('aria-label', on ? 'Пауза' : 'Слушать эфир');
    var label = btn.querySelector('span');
    if (label) label.textContent = on ? 'Пауза' : 'Слушать эфир';
    if (live) {
      var text = live.querySelector('span');
      if (text) text.textContent = on ? 'В эфире' : 'Пауза';
    }
  }

  btn.addEventListener('click', function () {
    if (audio.paused) audio.play().catch(function () {});
    else audio.pause();
  });
  audio.addEventListener('play', sync);
  audio.addEventListener('pause', sync);

  if (vol) {
    vol.addEventListener('input', function () {
      audio.volume = Number(vol.value);
    });
  }
})();

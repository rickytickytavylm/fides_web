/**
 * Оформление портала:
 * - beige: «Бежевый» (#ede9e2)
 * - light: «Свет»
 * - twilight: «Сумерки»
 */
(function () {
  'use strict';

  var KEY = 'yak_theme';
  var ORDER = ['beige', 'light', 'twilight'];
  var LABELS = {
    beige: 'Бежевый',
    light: 'Свет',
    twilight: 'Сумерки'
  };
  var COLORS = {
    beige: '#ede9e2',
    light: '#F7F8FA',
    twilight: '#201E24'
  };
  var root = document.documentElement;

  function normalize(theme) {
    return ORDER.indexOf(theme) >= 0 ? theme : 'beige';
  }

  function current() {
    return normalize(root.getAttribute('data-theme'));
  }

  function apply(theme, persist) {
    var value = normalize(theme);
    root.setAttribute('data-theme', value);
    root.style.colorScheme = value === 'twilight' ? 'dark' : 'light';

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', COLORS[value]);

    document.querySelectorAll('.theme-switch').forEach(function (switchEl) {
      switchEl.setAttribute('data-active', value);
      switchEl.querySelectorAll('.theme-opt').forEach(function (btn) {
        var on = btn.getAttribute('data-theme') === value;
        btn.setAttribute('aria-checked', on ? 'true' : 'false');
        btn.tabIndex = on ? 0 : -1;
      });
      var name = switchEl.querySelector('.theme-switch-name');
      if (name) name.textContent = LABELS[value];
    });

    if (persist) {
      try { localStorage.setItem(KEY, value); } catch (e) {}
    }
  }

  function switchHtml() {
    return (
      '<div class="theme-switch" data-active="beige" role="radiogroup" aria-label="Оформление">' +
      '<div class="theme-switch-track">' +
      '<button type="button" class="theme-opt" role="radio" data-theme="beige" aria-checked="true" aria-label="Бежевый" title="Бежевый">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="7" fill="currentColor" opacity=".55"/><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>' +
      '</button>' +
      '<button type="button" class="theme-opt" role="radio" data-theme="light" aria-checked="false" aria-label="Свет" title="Свет">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>' +
      '</button>' +
      '<button type="button" class="theme-opt" role="radio" data-theme="twilight" aria-checked="false" aria-label="Сумерки" title="Сумерки">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.2 15.3A7.7 7.7 0 0 1 8.7 4.8 7.8 7.8 0 1 0 19.2 15.3Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>' +
      '</button>' +
      '</div>' +
      '<span class="theme-switch-name">Бежевый</span>' +
      '</div>'
    );
  }

  function mount() {
    document.querySelectorAll('.masthead .wrap').forEach(function (header) {
      if (header.querySelector('.theme-switch')) return;
      var calendar = header.querySelector('.cal-btn');
      if (!calendar) return;

      var tools = document.createElement('div');
      tools.className = 'header-tools';
      calendar.parentNode.insertBefore(tools, calendar);
      tools.insertAdjacentHTML('beforeend', switchHtml());
      tools.appendChild(calendar);
    });

    document.querySelectorAll('.theme-switch').forEach(function (switchEl) {
      switchEl.querySelectorAll('.theme-opt').forEach(function (btn) {
        btn.addEventListener('click', function () {
          apply(btn.getAttribute('data-theme'), true);
        });
      });
      switchEl.addEventListener('keydown', function (event) {
        var idx = ORDER.indexOf(current());
        if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          event.preventDefault();
          apply(ORDER[(idx + 1) % ORDER.length], true);
          switchEl.querySelector('.theme-opt[aria-checked="true"]').focus();
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
          event.preventDefault();
          apply(ORDER[(idx + ORDER.length - 1) % ORDER.length], true);
          switchEl.querySelector('.theme-opt[aria-checked="true"]').focus();
        }
      });
    });

    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (e) {}
    apply(saved, false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();

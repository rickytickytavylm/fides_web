/**
 * Оформление портала:
 * - light: «Свет» (основная тема)
 * - twilight: «Сумерки» (сохранённая тёмная тема)
 */
(function () {
  'use strict';

  var KEY = 'yak_theme';
  var root = document.documentElement;

  function current() {
    return root.getAttribute('data-theme') === 'twilight' ? 'twilight' : 'light';
  }

  function apply(theme, persist) {
    var value = theme === 'twilight' ? 'twilight' : 'light';
    root.setAttribute('data-theme', value);
    root.style.colorScheme = value === 'twilight' ? 'dark' : 'light';

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', value === 'twilight' ? '#201E24' : '#F7F8FA');

    document.querySelectorAll('.theme-toggle').forEach(function (button) {
      var twilight = value === 'twilight';
      button.classList.toggle('is-twilight', twilight);
      button.setAttribute('aria-pressed', twilight ? 'true' : 'false');
      button.setAttribute(
        'aria-label',
        twilight ? 'Включить оформление «Свет»' : 'Включить оформление «Сумерки»'
      );
      var name = button.querySelector('.theme-toggle-name');
      if (name) name.textContent = twilight ? 'Сумерки' : 'Свет';
    });

    if (persist) {
      try { localStorage.setItem(KEY, value); } catch (e) {}
    }
  }

  function toggleHtml() {
    return (
      '<button type="button" class="theme-toggle" aria-pressed="false">' +
      '<span class="theme-toggle-track" aria-hidden="true">' +
      '<svg class="theme-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>' +
      '<svg class="theme-moon" viewBox="0 0 24 24"><path d="M19.2 15.3A7.7 7.7 0 0 1 8.7 4.8 7.8 7.8 0 1 0 19.2 15.3Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>' +
      '<i></i></span>' +
      '<span class="theme-toggle-name">Свет</span>' +
      '</button>'
    );
  }

  function mount() {
    document.querySelectorAll('.masthead .wrap').forEach(function (header) {
      if (header.querySelector('.theme-toggle')) return;
      var calendar = header.querySelector('.cal-btn');
      if (!calendar) return;

      var tools = document.createElement('div');
      tools.className = 'header-tools';
      calendar.parentNode.insertBefore(tools, calendar);
      tools.insertAdjacentHTML('beforeend', toggleHtml());
      tools.appendChild(calendar);
    });

    document.querySelectorAll('.theme-toggle').forEach(function (button) {
      button.addEventListener('click', function () {
        apply(current() === 'twilight' ? 'light' : 'twilight', true);
      });
    });
    apply(current(), false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();

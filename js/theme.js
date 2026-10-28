/**
 * Оформление портала:
 * - light: «Свет»
 * - twilight: «Сумерки»
 * Пока человек сам не переключил, повторяем оформление системы.
 */
(function () {
  'use strict';

  var KEY = 'yak_theme_pick';
  var root = document.documentElement;

  function normalize(theme) {
    return theme === 'twilight' ? 'twilight' : 'light';
  }

  function systemTheme() {
    try {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'twilight' : 'light';
    } catch (e) {
      return 'light';
    }
  }

  function savedTheme() {
    try {
      var value = localStorage.getItem(KEY);
      if (value === 'light' || value === 'twilight') return value;
    } catch (e) {}
    return null;
  }

  function current() {
    return normalize(root.getAttribute('data-theme'));
  }

  function apply(theme, persist) {
    var value = normalize(theme);
    root.setAttribute('data-theme', value);
    root.style.colorScheme = value === 'twilight' ? 'dark' : 'light';

    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', value === 'twilight' ? '#131E1A' : '#F3F1EA');

    document.querySelectorAll('.theme-toggle').forEach(function (button) {
      var twilight = value === 'twilight';
      button.classList.toggle('is-twilight', twilight);
      button.setAttribute('aria-pressed', twilight ? 'true' : 'false');
      button.setAttribute(
        'aria-label',
        twilight ? 'Включить оформление «Свет»' : 'Включить оформление «Сумерки»'
      );
    });

    if (persist) {
      try { localStorage.setItem(KEY, value); } catch (e) {}
    }
  }

  function toggleHtml() {
    return (
      '<span class="footer-theme-label">Оформление</span>' +
      '<button type="button" class="theme-toggle" aria-pressed="false">' +
      '<span class="theme-toggle-track" aria-hidden="true">' +
      '<svg class="theme-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>' +
      '<svg class="theme-moon" viewBox="0 0 24 24"><path d="M19.2 15.3A7.7 7.7 0 0 1 8.7 4.8 7.8 7.8 0 1 0 19.2 15.3Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>' +
      '<i></i></span></button>'
    );
  }

  function host() {
    if (document.body && document.body.classList.contains('chat-page')) {
      return document.querySelector('.chat-app .masthead .wrap');
    }
    return document.querySelector('.portal-footer .wrap') || document.querySelector('.site-footer');
  }

  function mount() {
    document.querySelectorAll('.masthead .theme-toggle').forEach(function (button) {
      if (!document.body.classList.contains('chat-page')) button.remove();
    });

    var box = host();
    if (box && !box.querySelector('.theme-toggle')) {
      var row = document.createElement('div');
      row.className = 'footer-theme';
      row.innerHTML = toggleHtml();
      box.appendChild(row);
    }

    document.querySelectorAll('.theme-toggle').forEach(function (button) {
      if (button.dataset.bound) return;
      button.dataset.bound = '1';
      button.addEventListener('click', function () {
        apply(current() === 'twilight' ? 'light' : 'twilight', true);
      });
    });

    apply(savedTheme() || systemTheme(), false);

    try {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      var onChange = function () {
        if (savedTheme()) return;
        apply(systemTheme(), false);
      };
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else if (mq.addListener) mq.addListener(onChange);
    } catch (e) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();

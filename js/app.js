/** Общая шапка, меню, поиск — без модулей, file:// ок */
(function () {
  'use strict';

  var header = document.querySelector('.site-header');
  var menuToggle = document.querySelector('.menu-toggle');
  var navigation = document.querySelector('.main-nav');

  function updateHeader() {
    if (header) header.classList.toggle('scrolled', window.scrollY > 32);
  }
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  if (menuToggle && navigation) {
    menuToggle.addEventListener('click', function () {
      var isOpen = navigation.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });
    navigation.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navigation.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var searchOverlay = document.querySelector('.search-overlay');
  if (searchOverlay) {
    var searchInput = searchOverlay.querySelector('input');
    function setSearch(open) {
      searchOverlay.hidden = !open;
      document.body.style.overflow = open ? 'hidden' : '';
      if (open && searchInput) searchInput.focus();
    }
    var searchBtn = document.querySelector('.search-button');
    if (searchBtn) searchBtn.addEventListener('click', function () { setSearch(true); });
    var closeBtn = searchOverlay.querySelector('.search-close');
    if (closeBtn) closeBtn.addEventListener('click', function () { setSearch(false); });
    searchOverlay.addEventListener('click', function (event) {
      if (event.target === searchOverlay) setSearch(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && !searchOverlay.hidden) setSearch(false);
    });
    var form = searchOverlay.querySelector('.search-form');
    if (form) {
      form.addEventListener('submit', function (event) {
        event.preventDefault();
        var q = (searchInput && searchInput.value || '').trim();
        if (!q) return;
        location.href = 'archive.html?q=' + encodeURIComponent(q);
      });
    }
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll('.reveal').forEach(function (el) {
      observer.observe(el);
    });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) {
      el.classList.add('visible');
    });
  }

  var progress = document.querySelector('.read-progress i');
  if (progress) {
    function updateProgress() {
      var scrollable = document.body.scrollHeight - window.innerHeight;
      progress.style.width =
        Math.min((window.scrollY / Math.max(scrollable, 1)) * 100, 100) + '%';
    }
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
  }
})();

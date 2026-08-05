/** Общая шапка — liquid glass, без бургера и лупы */
(function () {
  'use strict';

  var header = document.querySelector('.site-header');

  function updateHeader() {
    if (!header || header.classList.contains('solid')) return;
    header.classList.toggle('scrolled', window.scrollY > 32);
  }
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  // Подсветка текущего раздела
  try {
    var file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (!file || file === '') file = 'index.html';
    document.querySelectorAll('.main-nav a').forEach(function (link) {
      var href = (link.getAttribute('href') || '').toLowerCase();
      if (href === file || (file === 'article.html' && href === 'archive.html')) {
        link.setAttribute('aria-current', 'page');
      }
    });
  } catch (e) {}

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

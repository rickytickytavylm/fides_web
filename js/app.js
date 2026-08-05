/** Навигация как в iOS-приложении: нижний liquid glass tab bar */
(function () {
  'use strict';

  try {
    var file = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (!file) file = 'index.html';

    var map = {
      'index.html': 'home',
      'archive.html': 'archive',
      'article.html': 'archive',
      'sections.html': 'archive',
      'audio.html': 'audio',
      'radio.html': 'audio',
      'video.html': 'video',
      'chat.html': 'chat',
    };
    var current = map[file] || '';

    document.querySelectorAll('.app-tabbar .tab-item').forEach(function (link) {
      if (link.getAttribute('data-tab') === current) {
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

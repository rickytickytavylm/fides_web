(function () {
  'use strict';
  var path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var map = {
    'index.html': 'home', '': 'home',
    'archive.html': 'archive', 'article.html': 'archive', 'category.html': 'archive',
    'photostock.html': 'photo',
    'audio.html': 'audio',
    'video.html': 'video',
    'chat.html': 'chat',
  };
  var active = map[path];
  if (!active) return;
  document.querySelectorAll('.app-tabbar .tab-item').forEach(function (a) {
    if (a.getAttribute('data-tab') === active) a.classList.add('active');
    else a.classList.remove('active');
  });
})();

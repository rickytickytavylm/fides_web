(function () {
  'use strict';
  var V = window.Vera;
  if (!V) return;

  var messagesEl = document.getElementById('chat-messages');
  var form = document.getElementById('chat-form');
  var input = document.getElementById('chat-input');
  var sendBtn = document.getElementById('chat-send');
  var hint = document.getElementById('chat-hint');
  var history = [];
  var busy = false;

  var SUGGESTIONS = [
    'Что такое Символ веры?',
    'Как начать молиться каждый день?',
    'Чем отличается католицизм от православия?',
    'Что значит «благодать»?',
  ];

  function scrollBottom() {
    if (!messagesEl) return;
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addSources(bubble, sources) {
    if (!sources || !sources.length) return;
    var block = document.createElement('div');
    block.className = 'chat-sources';
    var label = document.createElement('p');
    label.className = 'chat-sources-label';
    label.textContent = 'По теме';
    block.appendChild(label);
    sources.slice(0, 3).forEach(function (s) {
      if (!s || !s.id) return;
      var a = document.createElement('a');
      a.className = 'chat-source';
      a.href = 'article.html?id=' + encodeURIComponent(s.id);
      var title = document.createElement('span');
      title.className = 'chat-source-title';
      title.textContent = s.title || ('Статья #' + s.id);
      a.appendChild(title);
      if (s.excerpt) {
        var ex = document.createElement('span');
        ex.className = 'chat-source-excerpt';
        ex.textContent = s.excerpt;
        a.appendChild(ex);
      }
      block.appendChild(a);
    });
    bubble.appendChild(block);
  }

  function addBubble(role, text, isError, sources) {
    var row = document.createElement('div');
    row.className = 'chat-row chat-row-' + role + (isError ? ' chat-row-error' : '');
    var bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    var body = document.createElement('div');
    body.className = 'chat-bubble-text';
    body.textContent = text;
    bubble.appendChild(body);
    if (role === 'assistant') addSources(bubble, sources);
    row.appendChild(bubble);
    messagesEl.appendChild(row);
    scrollBottom();
    return { row: row, bubble: bubble, body: body };
  }

  function showWelcome() {
    messagesEl.innerHTML = '';
    var wrap = document.createElement('div');
    wrap.className = 'chat-welcome';
    wrap.innerHTML =
      '<p class="chat-welcome-title">С чего начать</p>' +
      '<div class="chat-suggestions" id="chat-suggestions"></div>';
    messagesEl.appendChild(wrap);
    var box = wrap.querySelector('#chat-suggestions');
    SUGGESTIONS.forEach(function (q) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chat-suggestion';
      b.textContent = q;
      b.addEventListener('click', function () {
        input.value = q;
        form.requestSubmit();
      });
      box.appendChild(b);
    });
  }

  function setBusy(on) {
    busy = on;
    if (sendBtn) sendBtn.disabled = on;
    if (input) input.disabled = on;
  }

  function autoGrow() {
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 140) + 'px';
  }

  if (input) {
    input.addEventListener('input', autoGrow);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        form.requestSubmit();
      }
    });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (busy) return;
    var text = (input.value || '').trim();
    if (!text) return;

    if (messagesEl.querySelector('.chat-welcome')) {
      messagesEl.innerHTML = '';
    }

    addBubble('user', text);
    input.value = '';
    autoGrow();
    setBusy(true);

    var assistant = addBubble('assistant', '…');
    assistant.row.classList.add('chat-typing');

    V.sendChat(text, history, function (partial) {
      if (assistant.row.classList.contains('chat-typing')) {
        assistant.row.classList.remove('chat-typing');
      }
      assistant.body.textContent = partial || '';
      scrollBottom();
    })
      .then(function (data) {
        var reply = (data && data.reply) || assistant.body.textContent || 'Не удалось получить ответ.';
        var sources = data && Array.isArray(data.sources) ? data.sources : [];
        assistant.body.textContent = reply;
        addSources(assistant.bubble, sources);
        history.push({ role: 'user', content: text });
        history.push({ role: 'assistant', content: reply });
        if (history.length > 20) history = history.slice(-20);
        if (hint && data && data.remaining != null) {
          hint.textContent = 'Осталось сообщений сегодня: ' + data.remaining;
        }
        scrollBottom();
      })
      .catch(function (err) {
        assistant.row.classList.remove('chat-typing');
        assistant.row.classList.add('chat-row-error');
        var msg = 'Не удалось отправить. Попробуйте ещё раз.';
        if (err.status === 429) msg = 'Достигнут дневной лимит сообщений. Загляните завтра.';
        if (err.status === 403) msg = 'Доступ к диалогу временно ограничен.';
        assistant.body.textContent = msg;
        console.error(err);
      })
      .then(function () {
        setBusy(false);
        input.focus();
      });
  });

  showWelcome();
})();

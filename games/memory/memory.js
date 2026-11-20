/**
 * 塔罗记忆翻牌 —— 独立 H5 小游戏
 * 规则（v1 定稿）：
 *   - 普通模式：16 张 / 8 对 / 60 秒，无正逆位，同牌即配对
 *   - 保底抽取：优先从未解锁的牌里取 8 张，不足再用已解锁的补齐
 *   - 通关后本局出现的 8 张牌点亮（按 牌组id × 牌id 分别记）
 *   - 集齐某牌组 78 张 → 该牌组解锁，抽牌页可选
 *   - 链式解锁：前一套集齐才开放下一套；韦特原版默认开放
 *   - 超时不通关、不解锁；牌义在结算页展示；倒计时不变红
 * 共享存储：localStorage['tarot_deck_unlock_v1'] = { <deckId>: [cardId, ...] }
 * 同源 iframe，与父页面读写同一份。
 */
(function () {
  'use strict';

  var UNLOCK_KEY = 'tarot_deck_unlock_v1';
  var DURATION = 60;
  var PAIRS = 8;
  var FALLBACK_DIRS = ['waite720', 'waite', 'solabusca'];

  // 牌组清单（与 app.js 的 DECKS 顺序一致）
  var DECKS = [
    { id: 'waite', name: '韦特原版', dir: '../../cards/decks/waite' },
    { id: 'waite720', name: '韦特高清', dir: '../../cards/decks/waite720' },
    { id: 'marseille', name: '马赛古董牌', dir: '../../cards/decks/marseille' },
    { id: 'solabusca', name: 'Sola Busca', dir: '../../cards/decks/solabusca' },
    { id: 'visconti', name: 'Visconti-Sforza', dir: '../../cards/decks/visconti' },
    { id: 'vieville', name: 'Viéville', dir: '../../cards/decks/vieville' },
    { id: 'soimoi', name: 'Soimoi 现代', dir: '../../cards/decks/soimoi' },
    { id: 'tarot-nouveau', name: '新艺术塔罗', dir: '../../cards/decks/tarot-nouveau' },
    { id: 'rider-waite', name: '韦特标准插图', dir: '../../cards/decks/rider-waite' }
  ];

  var DATA = (typeof TAROT_DATA !== 'undefined') ? TAROT_DATA : [];

  var $ = function (id) { return document.getElementById(id); };
  var setup = $('memSetup'), play = $('memPlay'), result = $('memResult');
  var grid = $('memGrid'), decksBox = $('memDecks');

  // ---------- 解锁存档 ----------
  function loadUnlock() {
    try {
      var raw = localStorage.getItem(UNLOCK_KEY);
      var obj = raw ? JSON.parse(raw) : {};
      return (obj && typeof obj === 'object') ? obj : {};
    } catch (e) { return {}; }
  }
  function saveUnlock(obj) {
    try { localStorage.setItem(UNLOCK_KEY, JSON.stringify(obj)); } catch (e) {}
  }
  function unlockedOf(save, deckId) {
    var a = save[deckId];
    return Array.isArray(a) ? a : [];
  }
  /** 前一套集齐 78 张 → 本套开放；第一套永远开放 */
  function isDeckOpen(save, idx) {
    if (idx <= 0) return true;
    return unlockedOf(save, DECKS[idx - 1].id).length >= 78;
  }
  function markUnlocked(save, deckId, ids) {
    var set = {};
    unlockedOf(save, deckId).forEach(function (x) { set[x] = true; });
    ids.forEach(function (x) { set[x] = true; });
    save[deckId] = Object.keys(set).map(Number).sort(function (a, b) { return a - b; });
    return save[deckId].length;
  }

  // ---------- 牌面路径（含缺牌回退） ----------
  function cardFile(card) {
    return String(card.img || '').replace(/^cards\//, '').replace(/\.png$/, '.jpg');
  }
  var fbGlobal = function (img) {
    var fb = img.getAttribute('data-fb');
    if (!fb) { img.style.opacity = '.25'; return; }
    var arr = fb.split('|');
    var next = arr.shift();
    img.setAttribute('data-fb', arr.join('|'));
    if (!arr.length) img.setAttribute('data-fb', '');
    img.src = next;
  };
  window.__memFb = fbGlobal;

  function imgUrl(deck, card) {
    var f = cardFile(card);
    var chain = [deck.dir + '/' + f];
    FALLBACK_DIRS.forEach(function (d) {
      if (d !== deck.id) chain.push('../../cards/decks/' + d + '/' + f);
    });
    return { first: chain[0], fb: chain.slice(1).join('|') };
  }

  // ---------- 状态 ----------
  var save = loadUnlock();
  var chosenIdx = 0;
  var chosenDeck = DECKS[0];
  var cards = [];        // 本局抽中的牌（DATA 对象）
  var board = [];        // 牌面顺序
  var opened = [];       // 当前翻开待比较的 {idx, cardId}
  var matchedIds = {};
  var matchedCount = 0;
  var moves = 0, combo = 0, maxCombo = 0;
  var timeLeft = DURATION, timer = null, locked = false;
  var destroyed = false;

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /** 保底抽取：优先未解锁牌，不足用已解锁补齐 */
  function pickCards() {
    var done = {};
    unlockedOf(save, chosenDeck.id).forEach(function (x) { done[x] = true; });
    var rest = [], got = [];
    for (var i = 0; i < DATA.length; i++) {
      if (done[DATA[i].id]) got.push(DATA[i]); else rest.push(DATA[i]);
    }
    shuffle(rest); shuffle(got);
    var picked = rest.slice(0, PAIRS);
    if (picked.length < PAIRS) {
      picked = picked.concat(got.slice(0, PAIRS - picked.length));
    }
    return picked;
  }

  // ---------- 开局页 ----------
  function renderDeckList() {
    save = loadUnlock();
    decksBox.innerHTML = '';
    DECKS.forEach(function (d, idx) {
      var open = isDeckOpen(save, idx);
      var n = unlockedOf(save, d.id).length;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mem-deck' + (idx === chosenIdx ? ' active' : '') + (open ? '' : ' locked');
      btn.setAttribute('data-idx', idx);
      // 缩略图用愚者（DATA[0]）
      var info = imgUrl(d, DATA[0] || { img: 'cards/fool.png' });
      var flag = open ? (n >= 78 ? '已集齐' : n + '/78') : '未解锁';
      btn.innerHTML =
        '<img class="mem-deck-thumb" src="' + info.first + '" data-fb="' + info.fb + '"' +
        ' onerror="window.__memFb(this)" alt="">' +
        '<span class="mem-deck-info"><span class="mem-deck-name">' + d.name + '</span>' +
        '<span class="mem-deck-prog">' + (open ? '已点亮 ' + n + '/78' : '集齐上一套开放') + '</span></span>' +
        '<span class="mem-deck-flag">' + flag + '</span>';
      if (open) {
        btn.addEventListener('click', function () {
          chosenIdx = idx;
          chosenDeck = DECKS[idx];
          renderDeckList();
        });
      }
      decksBox.appendChild(btn);
    });
  }

  function showSetup() {
    show(setup);
    renderDeckList();
  }

  function show(el) {
    [setup, play, result].forEach(function (s) { if (s !== el) s.hidden = true; });
    el.hidden = false;
  }

  // ---------- 游戏流程 ----------
  function startGame() {
    save = loadUnlock();
    if (!isDeckOpen(save, chosenIdx)) { chosenIdx = 0; chosenDeck = DECKS[0]; }
    cards = pickCards();
    if (cards.length < PAIRS) { // 兜底：数据异常时补前 8 张
      cards = DATA.slice(0, PAIRS);
    }
    board = [];
    var pair = [];
    cards.forEach(function (c) { pair.push(c, c); });
    shuffle(pair);
    board = pair;

    opened = []; matchedIds = {}; matchedCount = 0;
    moves = 0; combo = 0; maxCombo = 0;
    timeLeft = DURATION; locked = false; destroyed = false;
    $('memTime').textContent = timeLeft;
    $('memMoves').textContent = '0';
    $('memCombo').textContent = '×0';
    $('memHudDeck').textContent = chosenDeck.name;
    $('memProgressBar').style.width = '0%';
    renderBoard();
    show(play);

    clearInterval(timer);
    timer = setInterval(function () {
      if (destroyed || locked) return;
      timeLeft--;
      $('memTime').textContent = timeLeft > 0 ? timeLeft : '0';
      if (timeLeft <= 0) { clearInterval(timer); finish(false); }
    }, 1000);
  }

  function renderBoard() {
    grid.innerHTML = '';
    board.forEach(function (c, idx) {
      var el = document.createElement('div');
      el.className = 'mem-card';
      el.setAttribute('data-idx', idx);
      var info = imgUrl(chosenDeck, c);
      el.innerHTML =
        '<div class="mem-card-inner">' +
          '<div class="mem-face"><img src="' + info.first + '" data-fb="' + info.fb + '"' +
          ' onerror="window.__memFb(this)" alt="" draggable="false">' +
          '<span class="mem-face-name">' + (c.name || '') + '</span></div>' +
          '<div class="mem-back">' +
            '<div class="gb-stars"><i></i><i></i><i></i><i></i><i></i><i></i></div>' +
            '<div class="gb-ring"></div>' +
            '<img class="gb-img" src="../../cards/gengar.png" alt="" draggable="false">' +
            '<div class="gb-text">桀桀塔罗</div>' +
          '</div>' +
        '</div>';
      el.addEventListener('click', function () { flip(idx, el); });
      grid.appendChild(el);
    });
  }

  function flip(idx, el) {
    if (locked || destroyed || el.classList.contains('flipped') || el.classList.contains('matched')) return;
    if (opened.length >= 2) return;
    el.classList.add('flipped');
    opened.push({ idx: idx, cardId: board[idx].id, el: el });

    if (opened.length === 2) {
      moves++;
      $('memMoves').textContent = moves;
      var a = opened[0], b = opened[1];
      locked = true;
      if (a.cardId === b.cardId) {
        a.el.classList.add('matched');
        b.el.classList.add('matched');
        matchedIds[a.cardId] = true;
        matchedCount++;
        combo++;
        maxCombo = Math.max(maxCombo, combo);
        $('memCombo').textContent = '×' + combo;
        $('memProgressBar').style.width = Math.round(matchedCount / PAIRS * 100) + '%';
        opened = [];
        locked = false;
        if (matchedCount >= PAIRS) { clearInterval(timer); finish(true); }
      } else {
        combo = 0;
        $('memCombo').textContent = '×0';
        a.el.classList.add('wrong'); b.el.classList.add('wrong');
        setTimeout(function () {
          if (destroyed) return;
          a.el.classList.remove('flipped', 'wrong');
          b.el.classList.remove('flipped', 'wrong');
          opened = [];
          locked = false;
        }, 720);
      }
    }
  }

  // ---------- 结算 ----------
  function finish(win) {
    locked = true;
    var used = cards.slice(); // 本局出现的 8 张
    var newDeckName = '';

    if (win) {
      save = loadUnlock();
      var before = unlockedOf(save, chosenDeck.id).length;
      var after = markUnlocked(save, chosenDeck.id, used.map(function (c) { return c.id; }));
      saveUnlock(save);
      if (before < 78 && after >= 78) {
        var next = DECKS[chosenIdx + 1];
        if (next) newDeckName = next.name;
      }
      notifyParent('unlock', chosenDeck.id);
    }

    $('memResultIcon').textContent = win ? '✦' : '◌';
    $('memResultIcon').className = 'mem-result-icon' + (win ? '' : ' fail');
    $('memResultTitle').textContent = win ? '通关！' : '时间到';
    $('memResultDesc').textContent = win
      ? '全部配对完成，本局的牌已点亮'
      : '还差 ' + (PAIRS - matchedCount) + ' 对没有配对，本次不解锁';

    $('memStats').innerHTML =
      stat('用时', win ? (DURATION - timeLeft) + 's' : DURATION + 's') +
      stat('步数', moves) +
      stat('最高连击', '×' + maxCombo);

    var u = '';
    if (win) {
      $('memUnlocks').hidden = false;
      u += '<div class="mem-unlock-title">本局解锁的牌与牌义</div>';
      used.forEach(function (c) {
        u += '<div class="mem-unlock"><span class="mem-unlock-name">' + (c.name || '?').replace(/·.*/, '') + '</span>' +
             '<span class="mem-unlock-text">' + (c.up || '') + '</span></div>';
      });
      $('memUnlocks').innerHTML = u;
    } else {
      $('memUnlocks').innerHTML = '';
      $('memUnlocks').hidden = true;
    }

    // 新牌组开放提示
    var extra = '';
    if (newDeckName) {
      extra = '<div class="mem-newdeck">✦ 「' + newDeckName + '」已解锁，现在可以在抽牌和本游戏中使用。</div>';
      $('memUnlocks').insertAdjacentHTML('afterbegin', extra);
    }

    show(result);
  }

  function stat(label, value) {
    return '<div class="mem-stat"><div class="mem-stat-label">' + label + '</div>' +
           '<div class="mem-stat-value">' + value + '</div></div>';
  }

  function notifyParent(type, payload) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'memory:' + type, deck: payload }, '*');
      }
    } catch (e) {}
  }

  // ---------- 事件 ----------
  $('memStart').addEventListener('click', startGame);
  $('memAgain').addEventListener('click', startGame);
  $('memBack').addEventListener('click', showSetup);

  // 供父页面在关闭 iframe 时调用，释放定时器
  window.__memory = {
    destroy: function () {
      destroyed = true;
      clearInterval(timer);
      notifyParent('destroyed');
    }
  };

  showSetup();
})();

/**
 * 塔罗记忆翻牌 —— 独立 H5 小游戏
 * 规则（v3 定稿）：
 *   - 闯关递增难度：轻松6对/75秒、标准8对/60秒、挑战10对/70秒、大师12对/80秒
 *     初始「标准」；通关升一级（大师封顶），失败降一级（轻松保底），存档 localStorage
 *   - 无正逆位，同牌即配对；保底抽取：优先未解锁牌
 *   - 错配扣秒：挑战 -3s、大师 -5s（轻松/标准不扣）；倒计时不变红
 *   - 点亮加成：通关点亮数 = 牌数 × 1.5 向上取整，不足部分从未解锁牌补
 *   - 集齐某牌组 78 张 → 该牌组解锁；前一套集齐才开放下一套；韦特原版默认开放
 *   - 超时不解锁；牌义在结算页展示
 *   - 背景音乐：复用 heibao 的 bgm.mp3，点开始播放、静音开关、结算/关闭即停
 * 共享存储：localStorage['tarot_deck_unlock_v1'] = { <deckId>: [cardId, ...] }
 */
(function () {
  'use strict';

  var UNLOCK_KEY = 'tarot_deck_unlock_v1';
  var LEVEL_KEY = 'tarot_memory_level_v1';
  var MUTE_KEY = 'tarot_memory_mute_v1';
  var FALLBACK_DIRS = ['waite720', 'waite', 'solabusca'];

  // 闯关递增难度：初始「标准」，通关 +1、失败 -1
  var LEVELS = [
    { name: '轻松', pairs: 6,  time: 75, penalty: 0 },
    { name: '标准', pairs: 8,  time: 60, penalty: 0 },
    { name: '挑战', pairs: 10, time: 70, penalty: 3 },
    { name: '大师', pairs: 12, time: 80, penalty: 5 }
  ];

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

  // ---------- 难度存档 ----------
  function loadLevel() {
    try {
      var v = parseInt(localStorage.getItem(LEVEL_KEY), 10);
      if (isNaN(v) || v < 0 || v >= LEVELS.length) return 1;  // 默认「标准」
      return v;
    } catch (e) { return 1; }
  }
  function saveLevel(i) {
    try { localStorage.setItem(LEVEL_KEY, String(i)); } catch (e) {}
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

  // ---------- 背景音乐 + 合成音效 ----------
  var BGM_SRC = '../heibao/assets/bgm/bgm.mp3';
  var BGM_VOLUME = 0.28;
  var bgm = null, bgmPlaying = false, bgmFailed = false, actx = null;
  var muted = loadMute();

  function loadMute() {
    try { return localStorage.getItem(MUTE_KEY) === '1'; } catch (e) { return false; }
  }
  function saveMute(v) {
    try { localStorage.setItem(MUTE_KEY, v ? '1' : '0'); } catch (e) {}
  }
  function startBgm() {
    if (muted || bgmPlaying || bgmFailed) return;
    try {
      if (!bgm) {
        bgm = new Audio(BGM_SRC);
        bgm.loop = true;
        bgm.volume = BGM_VOLUME;
        bgm.preload = 'auto';
        bgm.addEventListener('error', function () { bgmFailed = true; });
      }
      var p = bgm.play();
      if (p && typeof p.then === 'function') {
        p.then(function () { bgmPlaying = true; }).catch(function () {});
      } else { bgmPlaying = true; }
    } catch (e) { bgmFailed = true; }
  }
  function stopBgm() {
    if (bgm && bgmPlaying) {
      try { bgm.pause(); } catch (e) {}
      bgmPlaying = false;
    }
  }
  function blip(freq, dur, type, vol) {
    if (muted) return;
    try {
      if (!actx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        actx = new AC();
      }
      if (actx.resume) actx.resume().catch(function () {});
      var o = actx.createOscillator(), g = actx.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      o.connect(g); g.connect(actx.destination);
      var t = actx.currentTime;
      g.gain.setValueAtTime(vol || 0.18, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.start(t); o.stop(t + dur + 0.02);
    } catch (e) {}
  }
  function sfxFlip() { blip(520, 0.09, 'sine', 0.13); }
  function sfxMatch() {
    blip(660, 0.14, 'triangle', 0.2);
    setTimeout(function () { blip(880, 0.16, 'triangle', 0.18); }, 90);
  }
  function sfxWrong() { blip(180, 0.22, 'sawtooth', 0.14); }
  function sfxWin() {
    [523, 659, 784, 1047].forEach(function (f, i) {
      setTimeout(function () { blip(f, 0.2, 'triangle', 0.2); }, i * 110);
    });
  }
  function sfxLose() {
    [392, 330, 262].forEach(function (f, i) {
      setTimeout(function () { blip(f, 0.25, 'sine', 0.16); }, i * 140);
    });
  }
  function updateSoundBtn() {
    var b = $('memSound');
    if (b) {
      b.textContent = muted ? '🔇' : '🔊';
      b.setAttribute('aria-label', muted ? '开启声音' : '关闭声音');
    }
  }
  function toggleSound() {
    muted = !muted;
    saveMute(muted);
    updateSoundBtn();
    if (muted) stopBgm();
    else if (!play.hidden) startBgm();   // 游戏进行中才恢复
  }

  // ---------- 状态 ----------
  var save = loadUnlock();
  var levelIdx = loadLevel();
  var duration = LEVELS[levelIdx].time;
  var pairs = LEVELS[levelIdx].pairs;
  var chosenIdx = 0;
  var chosenDeck = DECKS[0];
  var cards = [];        // 本局抽中的牌（DATA 对象）
  var board = [];        // 牌面顺序
  var opened = [];       // 当前翻开待比较的 {idx, cardId}
  var matchedIds = {};
  var matchedCount = 0;
  var moves = 0, combo = 0, maxCombo = 0;
  var timeLeft = duration, timer = null, locked = false;
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
    var picked = rest.slice(0, pairs);
    if (picked.length < pairs) {
      picked = picked.concat(got.slice(0, pairs - picked.length));
    }
    return picked;
  }

  // ---------- 开局页 ----------
  function renderLevel() {
    levelIdx = loadLevel();
    $('memLevelName').textContent = LEVELS[levelIdx].name;
    var track = $('memLevelTrack');
    track.innerHTML = '';
    LEVELS.forEach(function (lv, i) {
      var s = document.createElement('span');
      s.className = 'mem-level-dot' + (i === levelIdx ? ' now' : '') + (i < levelIdx ? ' passed' : '');
      s.textContent = lv.name;
      track.appendChild(s);
    });
  }

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
    stopBgm();
    renderLevel();
    renderDeckList();
  }

  function show(el) {
    [setup, play, result].forEach(function (s) { if (s !== el) s.hidden = true; });
    el.hidden = false;
  }

  function showTimeSlip(txt) {
    var hud = $('memTime').parentNode;
    if (!hud) return;
    var el = document.createElement('span');
    el.className = 'mem-timeslip';
    el.textContent = txt;
    hud.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 900);
  }

  // ---------- 游戏流程 ----------
  function startGame() {
    save = loadUnlock();
    levelIdx = loadLevel();
    duration = LEVELS[levelIdx].time;
    pairs = LEVELS[levelIdx].pairs;
    if (!isDeckOpen(save, chosenIdx)) { chosenIdx = 0; chosenDeck = DECKS[0]; }

    cards = pickCards();
    if (cards.length < pairs) cards = DATA.slice(0, pairs);

    board = [];
    var pair = [];
    cards.forEach(function (c) { pair.push(c, c); });
    shuffle(pair);
    board = pair;

    opened = []; matchedIds = {}; matchedCount = 0;
    moves = 0; combo = 0; maxCombo = 0;
    timeLeft = duration; locked = false; destroyed = false;
    $('memTime').textContent = timeLeft;
    $('memMoves').textContent = '0';
    $('memCombo').textContent = '×0';
    $('memHudDeck').textContent = LEVELS[levelIdx].name + ' · ' + chosenDeck.name;
    $('memProgressBar').style.width = '0%';
    renderBoard();
    show(play);
    startBgm();

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
    sfxFlip();
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
        $('memProgressBar').style.width = Math.round(matchedCount / pairs * 100) + '%';
        sfxMatch();
        opened = [];
        locked = false;
        if (matchedCount >= pairs) { clearInterval(timer); finish(true); }
      } else {
        combo = 0;
        $('memCombo').textContent = '×0';
        sfxWrong();
        var pen = LEVELS[levelIdx].penalty;
        if (pen > 0 && !destroyed) {
          timeLeft = Math.max(0, timeLeft - pen);
          $('memTime').textContent = timeLeft;
          showTimeSlip('-' + pen + 's');
        }
        a.el.classList.add('wrong'); b.el.classList.add('wrong');
        setTimeout(function () {
          if (destroyed) return;
          a.el.classList.remove('flipped', 'wrong');
          b.el.classList.remove('flipped', 'wrong');
          opened = [];
          locked = false;
        }, 720);
        if (timeLeft <= 0) {
          clearInterval(timer);
          setTimeout(function () { if (!destroyed) finish(false); }, 740);
        }
      }
    }
  }

  // ---------- 结算 ----------
  function finish(win) {
    locked = true;
    stopBgm();
    if (win) sfxWin(); else sfxLose();

    var used = cards.slice();             // 本局出现的牌
    var bonusCards = [];                  // 难度加成额外点亮的牌
    var newDeckName = '';
    var levelBefore = levelIdx;

    if (win) {
      save = loadUnlock();
      var before = unlockedOf(save, chosenDeck.id).length;
      // 高难度额外加成：点亮数 = 牌数 × 1.5 向上取整
      var target = Math.ceil(pairs * 1.5);
      var done = {};
      used.forEach(function (c) { done[c.id] = true; });
      for (var i = 0; i < DATA.length && used.length + bonusCards.length < target; i++) {
        if (!done[DATA[i].id] && unlockedOf(save, chosenDeck.id).indexOf(DATA[i].id) < 0) {
          bonusCards.push(DATA[i]);
          done[DATA[i].id] = true;
        }
      }
      var litIds = used.concat(bonusCards).map(function (c) { return c.id; });
      var after = markUnlocked(save, chosenDeck.id, litIds);
      saveUnlock(save);
      if (before < 78 && after >= 78) {
        var next = DECKS[chosenIdx + 1];
        if (next) newDeckName = next.name;
      }
      notifyParent('unlock', chosenDeck.id);
      levelIdx = Math.min(levelBefore + 1, LEVELS.length - 1);
    } else {
      levelIdx = Math.max(levelBefore - 1, 0);
    }
    saveLevel(levelIdx);

    $('memResultIcon').textContent = win ? '✦' : '◌';
    $('memResultIcon').className = 'mem-result-icon' + (win ? '' : ' fail');
    $('memResultTitle').textContent = win ? '通关！' : '时间到';
    $('memResultDesc').textContent = win
      ? '全部配对完成，本局的牌已点亮'
      : '还差 ' + (pairs - matchedCount) + ' 对没有配对，本次不解锁';

    $('memStats').innerHTML =
      stat('用时', win ? (duration - timeLeft) + 's' : duration + 's') +
      stat('步数', moves) +
      stat('最高连击', '×' + maxCombo);

    // 难度升降提示
    var lvTxt = '';
    if (win && levelIdx > levelBefore) {
      lvTxt = '难度提升：' + LEVELS[levelBefore].name + ' → ' + LEVELS[levelIdx].name;
    } else if (!win && levelIdx < levelBefore) {
      lvTxt = '难度降低：' + LEVELS[levelBefore].name + ' → ' + LEVELS[levelIdx].name;
    } else if (win && levelIdx === LEVELS.length - 1) {
      lvTxt = '已是最高难度「大师」';
    } else if (!win && levelIdx === 0) {
      lvTxt = '已是最低难度「轻松」';
    }
    var lvEl = $('memLevelChange');
    lvEl.textContent = lvTxt;
    lvEl.hidden = !lvTxt;

    var u = '';
    if (win) {
      $('memUnlocks').hidden = false;
      u += '<div class="mem-unlock-title">本次点亮 ' + (used.length + bonusCards.length) + ' 张 · 牌义</div>';
      used.concat(bonusCards).forEach(function (c) {
        u += '<div class="mem-unlock"><span class="mem-unlock-name">' + (c.name || '?').replace(/·.*/, '') + '</span>' +
             '<span class="mem-unlock-text">' + (c.up || '') + '</span></div>';
      });
      $('memUnlocks').innerHTML = u;
    } else {
      $('memUnlocks').innerHTML = '';
      $('memUnlocks').hidden = true;
    }

    if (newDeckName) {
      $('memUnlocks').insertAdjacentHTML('afterbegin',
        '<div class="mem-newdeck">✦ 「' + newDeckName + '」已解锁，现在可以在抽牌和本游戏中使用。</div>');
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
  $('memSound').addEventListener('click', toggleSound);

  window.__memory = {
    destroy: function () {
      destroyed = true;
      clearInterval(timer);
      stopBgm();
      notifyParent('destroyed');
    }
  };

  updateSoundBtn();
  showSetup();
})();

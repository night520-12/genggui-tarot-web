/**
 * explore.js —— 探索页「小游戏」入口 + 全屏游戏遮罩控制。
 * 职责：
 *   1) 点击游戏卡片懒加载 iframe（首开才设置 src，关闭后卸载以释放资源）；
 *   2) 打开遮罩时锁定父页面滚动，关闭时恢复；
 *   3) 关闭时主动调用游戏实例的 destroy() 释放 rAF / 定时器资源；
 *   4) 监听游戏单向 postMessage（heibao:* / memory:*），仅做兜底处理。
 *
 * 设计约束（与游戏侧对齐）：
 *   - 父 → 游戏 只通过「移除/重载 iframe」通信，不发命令；
 *   - 游戏 → 父 通过 window.parent.postMessage 通知 ready/score/gameover/win/destroyed/unlock；
 *   - 同源 iframe，关闭时可安全访问 iframe.contentWindow 上的实例。
 */
(function () {
  'use strict';

  var GAMES = [
    {
      name: '合成黑洞',
      url: 'games/heibao/index.html',
      cardId: 'exploreGameCard',
      overlayId: 'heibaoOverlay',
      frameId: 'heibaoFrame',
      closeId: 'hbOverlayClose',
      instance: '__heibao',
      msgPrefix: 'heibao:'
    },
    {
      name: '塔罗记忆',
      url: 'games/memory/index.html',
      cardId: 'exploreMemoryCard',
      overlayId: 'memoryOverlay',
      frameId: 'memoryFrame',
      closeId: 'memoryOverlayClose',
      instance: '__memory',
      msgPrefix: 'memory:'
    }
  ];

  var anyOpen = false;

  function refreshLock() {
    document.body.classList.toggle('hb-lock', anyOpen);
    // 游戏遮罩打开时隐藏「添加到主屏幕」提示，避免遮挡游戏；关闭后恢复
    var tip = document.querySelector('.pwa-tip');
    if (tip) tip.style.display = anyOpen ? 'none' : '';
  }

  GAMES.forEach(function (g) {
    var overlay = document.getElementById(g.overlayId);
    var frame = document.getElementById(g.frameId);
    var card = document.getElementById(g.cardId);
    var closeBtn = document.getElementById(g.closeId);
    if (!overlay || !frame || !card) return;

    var loaded = false;

    function openGame() {
      if (!loaded) {
        frame.src = g.url; // 懒加载
        loaded = true;
      }
      overlay.hidden = false;
      anyOpen = true;
      refreshLock();
      try { frame.focus(); } catch (e) {}
    }

    function closeGame() {
      if (overlay.hidden) return;
      try {
        var w = frame.contentWindow;
        if (w && w[g.instance]) w[g.instance].destroy();
      } catch (e) { /* 跨域或已卸载，忽略 */ }

      overlay.hidden = true;
      anyOpen = GAMES.some(function (o) {
        var el = document.getElementById(o.overlayId);
        return el && !el.hidden;
      });
      refreshLock();

      loaded = false;
      try { frame.src = 'about:blank'; } catch (e) {}
    }

    card.addEventListener('click', function (e) {
      e.preventDefault();
      openGame();
    });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        openGame();
      }
    });
    if (closeBtn) closeBtn.addEventListener('click', closeGame);

    // 游戏自行销毁时收起对应遮罩
    window.addEventListener('message', function (e) {
      var d = e.data;
      if (d && d.type === g.msgPrefix + 'destroyed' && !overlay.hidden) closeGame();
    });
  });

  // Esc 关闭当前打开的遮罩
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    GAMES.forEach(function (g) {
      var overlay = document.getElementById(g.overlayId);
      if (overlay && !overlay.hidden) {
        var frame = document.getElementById(g.frameId);
        try {
          var w = frame.contentWindow;
          if (w && w[g.instance]) w[g.instance].destroy();
        } catch (err) {}
        overlay.hidden = true;
        try { frame.src = 'about:blank'; } catch (err) {}
      }
    });
    anyOpen = false;
    refreshLock();
  });
})();

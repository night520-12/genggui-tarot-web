/**
 * explore.js —— 探索页「小游戏」入口 + 全屏游戏遮罩控制。
 * 职责：
 *   1) 点击「小游戏」卡片懒加载 iframe（首开才设置 src，关闭后卸载以释放资源）；
 *   2) 打开遮罩时锁定父页面滚动，关闭时恢复；
 *   3) 关闭时主动调用游戏实例的 destroy() 释放 Matter/Canvas/rAF 资源；
 *   4) 监听游戏单向 postMessage（heibao:*），仅做兜底处理，不反向控制游戏。
 *
 * 设计约束（与游戏侧对齐）：
 *   - 父 → 游戏 只通过「移除/重载 iframe」通信，不发命令；
 *   - 游戏 → 父 通过 window.parent.postMessage 通知 ready/score/gameover/win/destroyed；
 *   - 因为游戏与本站同源（均挂在 tarot 域名下），关闭时可安全访问 iframe.contentWindow.__heibao。
 */
(function () {
  'use strict';

  var GAME_URL = 'games/heibao/index.html';

  var overlay = document.getElementById('heibaoOverlay');
  var frame = document.getElementById('heibaoFrame');
  var card = document.getElementById('exploreGameCard');
  var closeBtn = document.getElementById('hbOverlayClose');

  if (!overlay || !frame || !card) return; // 结构缺失则静默退出

  var loaded = false;

  function openGame() {
    if (!loaded) {
      frame.src = GAME_URL; // 懒加载：仅在首次打开时载入
      loaded = true;
    }
    overlay.hidden = false;
    document.body.classList.add('hb-lock');
    try { frame.focus(); } catch (e) {}
  }

  function closeGame() {
    if (overlay.hidden) return;
    // 先通知游戏释放资源（同源可访问实例）
    try {
      if (frame.contentWindow && frame.contentWindow.__heibao) {
        frame.contentWindow.__heibao.destroy();
      }
    } catch (e) { /* 跨域或已卸载，忽略 */ }

    overlay.hidden = true;
    document.body.classList.remove('hb-lock');

    // 卸载 iframe，彻底停止其内部 rAF / 物理循环并回收内存
    loaded = false;
    try { frame.src = 'about:blank'; } catch (e) {}
  }

  // 卡片（含内部「开始游戏」按钮）点击 → 打开
  card.addEventListener('click', function (e) {
    e.preventDefault();
    openGame();
  });
  // 键盘可达性：聚焦卡片后回车/空格打开
  card.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      openGame();
    }
  });

  if (closeBtn) closeBtn.addEventListener('click', closeGame);

  // Esc 关闭
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !overlay.hidden) closeGame();
  });

  // 游戏单向通知（兜底）：游戏自行销毁时确保遮罩收起
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (d && d.type === 'heibao:destroyed' && !overlay.hidden) {
      overlay.hidden = true;
      document.body.classList.remove('hb-lock');
      loaded = false;
      try { frame.src = 'about:blank'; } catch (err) {}
    }
  });
})();

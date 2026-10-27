/* 耿鬼的桀桀塔罗店 · 网页版（PWA）增强
   1. 注册离线缓存
   2. iPhone / 安卓 首次打开时给一次「添加到主屏幕」的小提示
   不做任何功能改动，Flutter 壳里运行时自动静默。 */
(function () {
  "use strict";

  var standalone =
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    window.navigator.standalone === true;

  var ua = navigator.userAgent || "";
  var isIOS = /iPhone|iPad|iPod/i.test(ua);
  var inWeChat = /MicroMessenger|QQ\//i.test(ua);

  window.TaroPWA = { standalone: standalone, isIOS: isIOS, inWeChat: inWeChat };

  /* ---------- 1. 离线缓存（只在 https 下注册，Flutter 壳内不会触发） ---------- */
  if ("serviceWorker" in navigator && location.protocol === "https:") {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js").catch(function () { /* 静默失败即可 */ });
    });
  }

  /* ---------- 2. 添加到主屏幕提示 ---------- */
  if (standalone) return;

  var FLAG = "tarot_pwa_tip_v1";
  try { if (localStorage.getItem(FLAG)) return; } catch (e) { return; }

  function css() {
    if (document.getElementById("pwaTipStyle")) return;
    var s = document.createElement("style");
    s.id = "pwaTipStyle";
    s.textContent =
      ".pwa-tip{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));" +
      "z-index:99999;display:flex;align-items:flex-start;gap:10px;padding:12px 14px;border-radius:14px;" +
      "background:rgba(26,14,48,.94);color:#f3ecff;font:13px/1.55 -apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif;" +
      "box-shadow:0 8px 28px rgba(0,0,0,.28);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);" +
      "animation:pwaIn .32s ease both}" +
      "@keyframes pwaIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}" +
      ".pwa-tip b{color:#e3c6ff;font-weight:600}" +
      ".pwa-tip .pwa-x{margin-left:auto;flex:none;padding:0 2px;border:0;background:none;color:#b9a8d6;" +
      "font-size:18px;line-height:1;cursor:pointer}";
    document.head.appendChild(s);
  }

  function showTip() {
    css();
    var tip = document.createElement("div");
    tip.className = "pwa-tip";
    tip.setAttribute("role", "status");

    var text;
    if (inWeChat) {
      text = '想要全屏使用？点右上角 <b>···</b> → <b>在浏览器打开</b>，再点 <b>分享</b> → <b>添加到主屏幕</b>';
    } else if (isIOS) {
      text = '点底部 <b>分享</b> 按钮 → <b>添加到主屏幕</b>，以后像 App 一样全屏打开';
    } else {
      text = '点右上角菜单 → <b>添加到主屏幕</b>，以后像 App 一样全屏打开';
    }

    tip.innerHTML = "<span>" + text + "</span>" +
      '<button class="pwa-x" aria-label="关闭提示">×</button>';
    document.body.appendChild(tip);

    function close() {
      try { localStorage.setItem(FLAG, "1"); } catch (e) {}
      tip.remove();
    }
    tip.querySelector(".pwa-x").addEventListener("click", close);
  }

  setTimeout(showTip, 2600);
})();

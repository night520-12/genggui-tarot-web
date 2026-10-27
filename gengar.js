/* ============================================================
   卡背 —— 用户图片抠图版耿鬼
   背景：深紫星空渐变（CSS 绘制），中央为原图耿鬼抠图 PNG
   ============================================================ */
(function (global) {
  "use strict";

  const GENGAR_BACK =
    '<div class="gengar-back">' +
      '<div class="gb-stars">' +
        "<i></i><i></i><i></i><i></i><i></i><i></i>" +
        "<i></i><i></i><i></i><i></i><i></i><i></i>" +
      "</div>" +
      '<div class="gb-ring"></div>' +
      '<img class="gb-img" src="cards/gengar.png?v=29" alt="耿鬼" draggable="false">' +
      '<div class="gb-text">桀桀塔罗</div>' +
    "</div>";

  global.GengarBack = GENGAR_BACK;
})(window);

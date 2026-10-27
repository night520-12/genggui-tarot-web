/* 耿鬼的桀桀塔罗店 · PWA Service Worker
   策略：页面走「网络优先+离线兜底」，脚本样式走「先给缓存再后台更新」，
   牌面图片走「缓存优先，用到才存」，音频等 Range 请求直接放行。 */
const VERSION = "v1";
const CACHE = "jiejie-tarot-" + VERSION;

/* 只预缓存入口，不碰 93MB 的牌面图（用到哪张存哪张） */
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/apple-touch-icon-180.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k.startsWith("jiejie-tarot-") && k !== CACHE)
            .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

const isImage = (url) => /\.(png|jpe?g|webp|gif|svg|ico)$/i.test(url.pathname);
const isAsset = (url) => /\.(css|js|json|webmanifest|woff2?|ttf|otf)$/i.test(url.pathname);

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;      // 第三方（AI 接口等）一律不碰
  if (url.pathname.indexOf("/api/") >= 0) return;        // 旧后端接口，直连即可

  // 音频/视频常有 Range 请求，缓存会破坏拖动与循环播放
  if (req.destination === "audio" || req.destination === "video") return;

  // 页面导航：先联网拿最新，断网了回落到缓存里的首页
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html", { ignoreSearch: true })
          .then((hit) => hit || caches.match("./")))
    );
    return;
  }

  // 牌面图片：缓存优先（换牌阵不会重复下载同一张图）
  if (isImage(url) || req.destination === "image") {
    event.respondWith(
      caches.match(req, { ignoreSearch: true }).then((hit) => {
        if (hit) return hit;
        return fetch(req).then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        });
      })
    );
    return;
  }

  // 脚本 / 样式 / 数据：网络优先，失败才用缓存
  // （不用「先给缓存」是因为 ?v= 版本号递增时会把旧脚本先喂给新页面）
  if (isAsset(url) || req.destination === "script" || req.destination === "style") {
    event.respondWith(
      fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true }))
    );
  }
});

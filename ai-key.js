/* ============================================================
   BYOK · 自带密钥的 AI 解读支持（浏览器直连 OpenAI 兼容接口）
   ------------------------------------------------------------
   · 密钥只存本机 localStorage，不上传任何服务器
   · 支持 DeepSeek / OpenAI / Kimi / 硅基流动 / 智谱 / 本地 Ollama 等
   · 对外暴露 window.TaroAI
   ============================================================ */
(function () {
  "use strict";

  var CFG_KEY = "tarot_ai_cfg_v1";
  var PRESETS = [
    { id: "deepseek", label: "DeepSeek", base: "https://api.deepseek.com/v1", model: "deepseek-chat" },
    { id: "openai", label: "OpenAI", base: "https://api.openai.com/v1", model: "gpt-4o-mini" },
    { id: "moonshot", label: "Kimi", base: "https://api.moonshot.cn/v1", model: "moonshot-v1-8k" },
    { id: "silicon", label: "硅基流动", base: "https://api.siliconflow.cn/v1", model: "deepseek-ai/DeepSeek-V3" },
    { id: "glm", label: "智谱 GLM", base: "https://open.bigmodel.cn/api/paas/v4", model: "glm-4-flash" },
    { id: "ollama", label: "本地 Ollama", base: "http://127.0.0.1:11434/v1", model: "qwen2.5:7b" },
    { id: "custom", label: "自定义", base: "", model: "" },
  ];

  function clip(s, n) {
    s = String(s == null ? "" : s).trim();
    return s.length > n ? s.slice(0, n) + "…" : s;
  }

  function err(code, msg) {
    var e = new Error(msg);
    e.code = code;
    return e;
  }

  /* ---------------- 配置读写 ---------------- */
  function getCfg() {
    var raw = null;
    try { raw = localStorage.getItem(CFG_KEY); } catch (e) {}
    var o = {};
    if (raw) { try { o = JSON.parse(raw) || {}; } catch (e) { o = {}; } }
    return {
      preset: o.preset || (o.key ? "custom" : "deepseek"),
      baseUrl: o.baseUrl || "",
      model: o.model || "",
      key: o.key || "",
      stream: o.stream !== false,
      vision: o.vision || "auto",
    };
  }

  function saveCfg(cfg) {
    var cur = getCfg();
    var o = {
      preset: cfg.preset || cur.preset,
      baseUrl: String(cfg.baseUrl || "").trim(),
      model: String(cfg.model || "").trim(),
      key: String(cfg.key || "").trim(),
      stream: cfg.stream !== false,
      vision: (cfg.vision === "on" || cfg.vision === "off") ? cfg.vision : "auto",
    };
    try { localStorage.setItem(CFG_KEY, JSON.stringify(o)); } catch (e) {}
    return o;
  }

  function clearCfg() {
    try { localStorage.removeItem(CFG_KEY); } catch (e) {}
  }

  function hasKey() {
    var c = getCfg();
    return !!(c.key && c.baseUrl && c.model);
  }

  /* ---------------- 接口地址 ---------------- */
  function endpoint(baseUrl) {
    var b = String(baseUrl || "").trim().replace(/\s+/g, "");
    if (!b) throw err("no-base", "还没有填写接口地址");
    if (!/^https?:\/\//i.test(b)) b = "https://" + b;
    var u;
    try { u = new URL(b); } catch (e) { throw err("bad-base", "接口地址格式不对"); }
    var p = u.pathname.replace(/\/+$/, "");
    if (/\/chat\/completions$/i.test(p)) {
      u.pathname = p;
    } else if (!p) {
      u.pathname = "/v1/chat/completions";
    } else {
      u.pathname = p + "/chat/completions";
    }
    u.search = "";
    u.hash = "";
    return u.toString();
  }

  /* ---------------- 调用 ---------------- */
  function readStream(res, onDelta) {
    var reader = res.body.getReader();
    var dec = new TextDecoder("utf-8");
    var buf = "";
    var text = "";
    function pump() {
      return reader.read().then(function (r) {
        if (r.done) {
          // 收尾：处理缓冲区里最后一行
          if (buf.trim()) consume(buf);
          return text;
        }
        buf += dec.decode(r.value, { stream: true });
        var lines = buf.split("\n");
        buf = lines.pop();
        lines.forEach(consume);
        return pump();
      });
    }
    function consume(line) {
      var s = String(line || "").trim();
      if (!s || s.charAt(0) === ":" || s.indexOf("data:") !== 0) return;
      var payload = s.slice(5).trim();
      if (!payload || payload === "[DONE]") return;
      try {
        var j = JSON.parse(payload);
        var ch = j.choices && j.choices[0];
        if (!ch) return;
        var d = ch.delta || ch.message || {};
        var piece = d.content;
        if (typeof piece === "string" && piece) {
          text += piece;
          if (onDelta) onDelta(text);
        }
      } catch (e) {}
    }
    return pump();
  }

  function chatWith(cfg, messages, opts) {
    opts = opts || {};
    var url = endpoint(cfg.baseUrl);
    if (!cfg.key) return Promise.reject(err("no-key", "还没有填写 API 密钥"));
    var model = cfg.model || "deepseek-chat";
    var wantStream = !!(opts.onDelta && cfg.stream !== false);
    var body = {
      model: model,
      messages: messages,
      temperature: opts.temperature == null ? 0.85 : opts.temperature,
      stream: wantStream,
    };
    if (opts.maxTokens) body.max_tokens = opts.maxTokens;

    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + cfg.key,
      },
      body: JSON.stringify(body),
    }).catch(function () {
      throw err(
        "net",
        "连不上 AI 服务。可能是网络不通，或该接口不允许浏览器直连（CORS 限制）。"
      );
    }).then(function (res) {
      if (!res.ok) {
        return res.text().then(function (t) {
          var m = "";
          try {
            var j = JSON.parse(t);
            m = (j.error && (j.error.message || j.error.code)) || j.message || "";
          } catch (e) { m = clip(t, 180); }
          var map = {
            400: "请求被拒绝（400）",
            401: "密钥无效或已过期（401）",
            402: "账户余额不足（402）",
            403: "没有访问权限（403）",
            404: "接口地址不对（404），检查 Base URL 是否需要带 /v1",
            429: "请求太频繁或额度用尽（429）",
            500: "服务端出错（500）",
            503: "服务暂时不可用（503）",
          };
          throw err(
            "http-" + res.status,
            (map[res.status] || "服务返回 " + res.status) + (m ? "：" + clip(m, 160) : "")
          );
        });
      }
      var ct = (res.headers.get("content-type") || "").toLowerCase();
      if (wantStream && res.body && ct.indexOf("text/event-stream") >= 0) {
        return readStream(res, opts.onDelta).then(function (text) {
          if (!text) throw err("empty", "AI 没有返回内容，换个模型试试");
          return text;
        });
      }
      return res.json().catch(function () {
        throw err("bad-json", "AI 返回的内容无法解析，检查接口地址是否正确");
      }).then(function (data) {
        var text =
          (data && data.choices && data.choices[0] &&
            ((data.choices[0].message && data.choices[0].message.content) ||
              data.choices[0].text)) || "";
        text = String(text).trim();
        if (!text) throw err("empty", "AI 没有返回内容，换个模型试试");
        if (opts.onDelta) opts.onDelta(text);
        return text;
      });
    });
  }

  function chat(messages, opts) {
    return chatWith(getCfg(), messages, opts);
  }

  /* ---------------- 设置弹窗 ---------------- */
  var mask = null;
  var onSavedCb = null;
  var dlgState = { preset: "deepseek", vision: "auto" };

  function el(tag, cls, html) {
    var d = document.createElement(tag);
    if (cls) d.className = cls;
    if (html != null) d.innerHTML = html;
    return d;
  }

  function build() {
    if (mask) return mask;
    mask = el("div", "ak-mask");
    mask.id = "akMask";
    mask.hidden = true;
    mask.innerHTML =
      '<div class="ak-dialog" role="dialog" aria-modal="true" aria-label="AI 密钥设置">' +
        '<div class="ak-head">' +
          '<div class="ak-head-txt">' +
            '<b>✦ AI 深度解读</b>' +
            '<i>填你自己的密钥，解锁原本要付费的 AI 解读</i>' +
          "</div>" +
          '<button class="ak-close" id="akClose" aria-label="关闭">✕</button>' +
        "</div>" +
        '<div class="ak-body">' +
          '<div class="ak-note">🔒 密钥只保存在这台设备的浏览器里，不会上传到任何服务器。解读请求由浏览器直接发给你填的 AI 服务商，本应用不经手、也不收费。</div>' +
          '<div class="ak-field">' +
            "<label>服务商</label>" +
            '<div class="ak-presets" id="akPresets"></div>' +
          "</div>" +
          '<div class="ak-field">' +
            "<label>接口地址 Base URL</label>" +
            '<input id="akBase" type="url" inputmode="url" autocomplete="off" spellcheck="false" placeholder="https://api.deepseek.com/v1">' +
          "</div>" +
          '<div class="ak-field">' +
            "<label>模型名</label>" +
            '<input id="akModel" type="text" autocomplete="off" spellcheck="false" placeholder="deepseek-chat">' +
          "</div>" +
          '<div class="ak-field">' +
            "<label>卡面图案</label>" +
            '<div class="ak-presets" id="akVision">' +
              '<button class="ak-chip" data-v="auto" type="button">自动</button>' +
              '<button class="ak-chip" data-v="on" type="button">总是发送</button>' +
              '<button class="ak-chip" data-v="off" type="button">不发送</button>' +
            "</div>" +
            '<div class="ak-sub">自动：先把牌面图片发过去，模型读不了图就自动退回文字图案解读。<br>想让 AI 真的看图，模型要选支持视觉的，例如 <b>gpt-4o-mini</b>、<b>glm-4v</b>、<b>qwen-vl-max</b>。</div>' +
          "</div>" +
          '<div class="ak-field">' +
            "<label>API 密钥</label>" +
            '<div class="ak-keyrow">' +
              '<input id="akKey" type="password" autocomplete="off" spellcheck="false" placeholder="sk-...">' +
              '<button class="ak-eye" id="akEye" type="button">显示</button>' +
            "</div>" +
          "</div>" +
          '<div class="ak-hint">以 DeepSeek 为例：到 <b>platform.deepseek.com</b> 注册并创建一个 API Key，粘贴进来即可。也支持 Kimi、硅基流动、OpenAI、智谱。<br>想完全本地、不花钱：先跑 <b>ollama pull qwen2.5:7b</b> 并让 Ollama 保持运行，服务商选「本地 Ollama」，模型名照 <b>ollama list</b> 里的填。<br>解读时会把牌阵结构、每张牌的位置和牌面图案一起发给模型；模型支持看图的话，还会附上真实卡面图片。</div>' +
          '<div class="ak-status" id="akStatus" hidden></div>' +
        "</div>" +
        '<div class="ak-acts">' +
          '<button class="ak-btn danger" id="akClear" type="button">清除</button>' +
          '<button class="ak-btn" id="akTest" type="button">测试连接</button>' +
          '<button class="ak-btn primary" id="akSave" type="button">保存</button>' +
        "</div>" +
      "</div>";

    var presets = mask.querySelector("#akPresets");
    PRESETS.forEach(function (p) {
      var b = el("button", "ak-chip", p.label);
      b.type = "button";
      b.dataset.preset = p.id;
      b.addEventListener("click", function () {
        pickPreset(p.id, true);
      });
      presets.appendChild(b);
    });

    mask.querySelectorAll("#akVision .ak-chip").forEach(function (b) {
      b.addEventListener("click", function () {
        dlgState.vision = b.dataset.v;
        paintVision();
      });
    });

    mask.querySelector("#akClose").addEventListener("click", closeSettings);
    mask.addEventListener("click", function (e) {
      if (e.target === mask) closeSettings();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mask && !mask.hidden) closeSettings();
    });

    var keyInput = mask.querySelector("#akKey");
    mask.querySelector("#akEye").addEventListener("click", function () {
      var show = keyInput.type === "password";
      keyInput.type = show ? "text" : "password";
      this.textContent = show ? "隐藏" : "显示";
    });

    mask.querySelector("#akSave").addEventListener("click", function () {
      var c = readForm();
      if (!c.baseUrl) return setStatus("err", "请填写接口地址");
      if (!c.model) return setStatus("err", "请填写模型名");
      if (!c.key) return setStatus("err", "请填写 API 密钥");
      saveCfg(c);
      setStatus("ok", "已保存，可以开始 AI 解读了");
      paintState();
      if (onSavedCb) { try { onSavedCb(); } catch (e) {} }
      setTimeout(closeSettings, 520);
    });

    mask.querySelector("#akClear").addEventListener("click", function () {
      clearCfg();
      paintState();
      setStatus("ok", "已清除本机保存的密钥");
      if (onSavedCb) { try { onSavedCb(); } catch (e) {} }
    });

    mask.querySelector("#akTest").addEventListener("click", function () {
      var btn = this;
      var c = readForm();
      if (!c.key) return setStatus("err", "请先填写 API 密钥");
      if (!c.baseUrl) return setStatus("err", "请填写接口地址");
      if (!c.model) return setStatus("err", "请填写模型名");
      btn.disabled = true;
      setStatus("busy", "正在连接 " + c.model + "…");
      var t0 = Date.now();
      chatWith(c, [
        { role: "user", content: "请只回复两个字：可以" },
      ], { temperature: 0, maxTokens: 32 }).then(function (text) {
        setStatus("ok", "连接成功 · " + ((Date.now() - t0) / 1000).toFixed(1) + "s · 模型回复：" + clip(text, 24));
      }).catch(function (e) {
        setStatus("err", (e && e.message) || "连接失败");
      }).then(function () {
        btn.disabled = false;
      });
    });

    document.body.appendChild(mask);
    return mask;
  }

  function readForm() {
    var m = build();
    return {
      preset: dlgState.preset,
      baseUrl: (m.querySelector("#akBase").value || "").trim(),
      model: (m.querySelector("#akModel").value || "").trim(),
      key: (m.querySelector("#akKey").value || "").trim(),
      vision: dlgState.vision || "auto",
    };
  }

  function pickPreset(id, fill) {
    var p = null;
    PRESETS.forEach(function (x) { if (x.id === id) p = x; });
    if (!p) return;
    dlgState.preset = id;
    var m = build();
    m.querySelectorAll(".ak-chip").forEach(function (b) {
      b.classList.toggle("on", b.dataset.preset === id);
    });
    if (fill) {
      if (p.base) m.querySelector("#akBase").value = p.base;
      if (p.model) m.querySelector("#akModel").value = p.model;
      if (id !== "custom" && !m.querySelector("#akBase").value) {
        m.querySelector("#akBase").value = p.base;
      }
    }
  }

  function paintVision() {
    var m = build();
    var v = dlgState.vision || "auto";
    m.querySelectorAll("#akVision .ak-chip").forEach(function (b) {
      b.classList.toggle("on", b.dataset.v === v);
    });
  }

  function setStatus(kind, msg) {
    var m = build();
    var s = m.querySelector("#akStatus");
    s.hidden = false;
    s.className = "ak-status " + kind;
    s.textContent = msg;
  }

  function paintState() {
    var m = build();
    var c = getCfg();
    var p = "custom";
    PRESETS.forEach(function (x) {
      if (x.base && c.baseUrl && c.baseUrl.replace(/\/+$/, "") === x.base) p = x.id;
    });
    dlgState.preset = p;
    dlgState.vision = c.vision || "auto";
    pickPreset(p, false);
    paintVision();
    m.querySelector("#akBase").value = c.baseUrl || "";
    m.querySelector("#akModel").value = c.model || "";
    m.querySelector("#akKey").value = c.key || "";
    m.querySelector("#akKey").type = "password";
    m.querySelector("#akEye").textContent = "显示";
    var s = m.querySelector("#akStatus");
    if (c.key) {
      s.hidden = false;
      s.className = "ak-status ok";
      s.textContent = "当前已配置：" + (c.model || "—");
    } else {
      s.hidden = true;
      s.textContent = "";
    }
  }

  function openSettings(cb) {
    onSavedCb = cb || null;
    build();
    paintState();
    mask.hidden = false;
    var body = mask.querySelector(".ak-body");
    if (body) body.scrollTop = 0;
    var first = mask.querySelector("#akKey");
    if (first && !getCfg().key) setTimeout(function () { try { first.focus(); } catch (e) {} }, 120);
  }

  function closeSettings() {
    if (!mask) return;
    mask.hidden = true;
  }

  window.TaroAI = {
    getCfg: getCfg,
    saveCfg: saveCfg,
    clearCfg: clearCfg,
    hasKey: hasKey,
    chat: chat,
    chatWith: chatWith,
    endpoint: endpoint,
    openSettings: openSettings,
    closeSettings: closeSettings,
    presets: PRESETS,
  };
})();

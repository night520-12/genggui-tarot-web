/**
 * 心理测评 —— 计分与界面
 * ------------------------------------------------------------
 * 流程：选测试 → 选版本（精简/完整，都免费）→ 答题 → 出详细结果
 *       → 可选「耿鬼的 AI 分析」（消耗点数）
 *
 * 计分严格按各量表原始规则：
 *   ECR-R ：7 点量表，反向题用 8 - 原始分；焦虑/回避各取均分，以 4.0 为高低分界
 *   MBTI  ：按官方计分键累加字母（每题的 A/B 分别计入哪个字母已写在题库里）
 *   IPIP  ：5 点量表，反向题用 6 - 原始分；每维度 10 题，原分区间 10-50
 */
(function () {
  "use strict";

  const D = window.QuizData;

  /* 作答选项 */
  const ECR_SCALE = [
    { v: 1, t: "非常不同意" }, { v: 2, t: "不同意" }, { v: 3, t: "有点不同意" },
    { v: 4, t: "中立" }, { v: 5, t: "有点同意" }, { v: 6, t: "同意" }, { v: 7, t: "非常同意" },
  ];
  const IPIP_SCALE = [
    { v: 1, t: "非常不贴切" }, { v: 2, t: "有些不贴切" },
    { v: 3, t: "普通" }, { v: 4, t: "有些贴切" }, { v: 5, t: "非常贴切" },
  ];

  /* ============================================================
     测试定义
     ============================================================ */
  const TESTS = [
    {
      id: "attach",
      name: "四种依恋类型",
      icon: "💞",
      tag: "亲密关系",
      desc: "基于 ECR-R 量表，看你在关系里是安全、焦虑、回避还是恐惧型。",
      about:
        "本测试采用 ECR-R（亲密关系经历量表修订版，Fraley、Waller 与 Brennan 于 2000 年编制），" +
        "是国际上研究成人依恋最常用的量表之一。它不直接给你贴类型标签，而是分别测量" +
        "「依恋焦虑」与「依恋回避」两个维度，再由两个维度的组合得出类型。" +
        "请按你在亲密关系中「通常」的感受作答，而不是只针对当前这一段关系；如果目前单身，" +
        "可以想想你最接近的一段关系，或有恋爱经验时你一般的样子。",
      scaleType: "ecr",
      all: D.ECR,
      shortPer: 9,
      shortTotal: 18,
      fullTotal: 36,
      dims: ["anx", "avo"],
      cost: 3,
      mins: { short: 3, full: 6 },
    },
    {
      id: "mbti",
      name: "MBTI 人格",
      icon: "🧭",
      tag: "16 型人格",
      desc: "93 题标准版，四维度迫选，判定你属于 16 型人格中的哪一种。",
      about:
        "本测试为流传最广的 MBTI 93 题标准版。四个维度各由若干题目累加计分：" +
        "E/I 共 21 题、S/N 共 26 题、T/F 共 24 题、J/P 共 22 题。" +
        "请依照你「自然状态下通常会怎么做」作答，而不是「希望自己怎么做」；" +
        "两边的选项都像时，选出现频率更高的那个。MBTI 测量的是偏好，不是能力高低，" +
        "不要用它给自己或他人贴死标签。",
      scaleType: "choice",
      all: D.MBTI,
      shortPer: 8,
      shortTotal: 32,
      fullTotal: 93,
      dims: ["EI", "SN", "TF", "JP"],
      cost: 3,
      mins: { short: 4, full: 12 },
    },
    {
      id: "big5",
      name: "大五人格",
      icon: "📊",
      tag: "特质测评",
      desc: "国际人格题库 IPIP 版本，五个维度量化你的性格轮廓。",
      about:
        "本测试采用 IPIP 50 题（International Personality Item Pool，Goldberg, 1992）。" +
        "IPIP 属公共领域题库，被学术研究广泛使用。它不把人归类，而是给出你在" +
        "开放性、尽责性、外向性、宜人性、情绪敏感性五个连续维度上的位置——" +
        "这比把人分成 16 种类型更贴近真实的自己。作答时请对照你认识的、与你同龄同性别的其他人，" +
        "如实描述「你实际是什么样」，而不是「你希望成为什么样」。",
      scaleType: "ipip",
      all: D.IPIP,
      shortPer: 4,
      shortTotal: 20,
      fullTotal: 50,
      dims: ["O", "C", "E", "A", "N"],
      cost: 3,
      mins: { short: 3, full: 7 },
    },
  ];

  /* 取题目：full 全量；short 每维度抽取，并交错排列 */
  function pickQuestions(test, mode) {
    if (mode === "full") return test.all.slice();
    const byDim = {};
    test.all.forEach((q) => { (byDim[q.d] = byDim[q.d] || []).push(q); });
    const out = [];
    for (let i = 0; i < test.shortPer; i++) {
      test.dims.forEach((d) => {
        const list = byDim[d] || [];
        if (list[i]) out.push(list[i]);
      });
    }
    return out;
  }

  /* ============================================================
     计分
     ============================================================ */

  /* 依恋：ECR-R，7 点量表 */
  function scoreAttach(answers, qs) {
    const acc = { anx: [], avo: [] };
    qs.forEach((q, i) => {
      let v = Number(answers[i]);
      if (!v) return;
      if (q.r) v = 8 - v;
      acc[q.d].push(v);
    });
    const mean = (a) => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 4);
    const anx = mean(acc.anx);
    const avo = mean(acc.avo);
    const CUT = 4.0;
    const hiA = anx >= CUT, hiV = avo >= CUT;
    const key = !hiA && !hiV ? "secure" : hiA && !hiV ? "anxious" : !hiA && hiV ? "avoidant" : "fearful";
    return {
      key: key,
      type: D.ATTACH_TYPES[key],
      anx: anx,
      avo: avo,
      dims: [
        { name: "依恋焦虑", v: anx, pct: Math.round(((anx - 1) / 6) * 100),
          note: "害怕被抛弃、需要反复确认的程度" },
        { name: "依恋回避", v: avo, pct: Math.round(((avo - 1) / 6) * 100),
          note: "对亲密感到不适、偏好情感距离的程度" },
      ],
    };
  }

  /* MBTI：按计分键累加，换算倾向强度 */
  function scoreMBTI(answers, qs) {
    const LETTERS = ["E", "I", "S", "N", "T", "F", "J", "P"];
    const cnt = {};
    LETTERS.forEach((l) => (cnt[l] = 0));
    qs.forEach((q, i) => {
      const a = answers[i];
      if (a !== 0 && a !== 1) return;
      cnt[a === 0 ? q.ka : q.kb]++;
    });

    // 官方各维度题目总数（用于强度分级参照）
    const TOT = { EI: 21, SN: 26, TF: 24, JP: 22 };
    const PAIR = { EI: ["E", "I"], SN: ["S", "N"], TF: ["T", "F"], JP: ["J", "P"] };
    // 本次实际作答的题量占满量比例，精简版按比例折算后再分级
    const ratio = qs.length / (TOT.EI + TOT.SN + TOT.TF + TOT.JP);
    const code = [];
    const dims = [];

    ["EI", "SN", "TF", "JP"].forEach((d) => {
      const L = PAIR[d][0], R = PAIR[d][1];
      const lc = cnt[L], rc = cnt[R];
      const total = lc + rc || 1;
      const pick = lc >= rc ? L : R;
      code.push(pick);
      const pct = Math.round((Math.max(lc, rc) / total) * 100);
      const scaled = Math.round(Math.max(lc, rc) / ratio);
      const maxAll = TOT[d];
      const grade = [
        [Math.round(maxAll * 0.55), "轻微倾向"],
        [Math.round(maxAll * 0.70), "中等倾向"],
        [Math.round(maxAll * 0.90), "明确倾向"],
        [maxAll + 99, "非常明确"],
      ];
      let level = "轻微倾向";
      for (const [th, lab] of grade) { if (scaled <= th) { level = lab; break; } }
      dims.push({
        dim: d, left: L, right: R, lc: lc, rc: rc,
        pick: pick, pct: pct, level: level,
        pickName: D.MBTI_DIM[pick].short,
        desc: D.MBTI_DIM[pick].desc,
        leftPct: Math.round((lc / total) * 100),
        rightPct: Math.round((rc / total) * 100),
      });
    });

    const type = code.join("");
    return { key: type, type: type, meta: D.MBTI_TYPES[type] || { name: "综合型", one: "" }, dims: dims };
  }

  /* 大五：IPIP 50，5 点量表 */
  function scoreBig5(answers, qs) {
    const acc = { O: [], C: [], E: [], A: [], N: [] };
    qs.forEach((q, i) => {
      let v = Number(answers[i]);
      if (!v) return;
      if (q.r) v = 6 - v;
      acc[q.d].push(v);
    });
    const keys = ["O", "C", "E", "A", "N"];
    const bars = keys.map((k) => {
      const arr = acc[k];
      const mean = arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 3;
      const meta = D.BIG5_DIM[k];
      return {
        key: k,
        name: meta.name,
        en: meta.en,
        icon: meta.icon,
        brief: meta.brief,
        about: meta.about,
        v: mean,
        pct: Math.round(((mean - 1) / 4) * 100),
        detail: mean >= 3.5 ? meta.high : mean <= 2.5 ? meta.low : null,
        facets: meta.facets,
      };
    });
    const sorted = bars.slice().sort((a, b) => b.v - a.v);
    return { key: "big5", bars: bars, top: sorted.slice(0, 2), bottom: sorted.slice(-2).reverse() };
  }

  function score(test, answers, qs) {
    if (test.id === "attach") return scoreAttach(answers, qs);
    if (test.id === "mbti") return scoreMBTI(answers, qs);
    return scoreBig5(answers, qs);
  }

  /* ============================================================
     状态与工具
     ============================================================ */
  let root = null;
  let state = { view: "list", test: null, mode: null, qs: [], ans: [], idx: 0, result: null };
  let apiFn = null, getDeviceFn = null, getTokenFn = null, onCredits = null, creditsNow = 0, saveResultFn = null;
  /* 答题进度存档：去付款会跳转刷新页面，靠这个把界面和进度还原回来 */
  const QKEY = "tarot_quiz_v1";
  let mountedOnce = false;

  /* 保存当前状态（题目不存，恢复时按 testId+mode 重新取，避免数据膨胀） */
  function saveState() {
    try {
      if (!state.test || state.view === "list") {
        localStorage.removeItem(QKEY);
        return;
      }
      localStorage.setItem(QKEY, JSON.stringify({
        testId: state.test.id,
        mode: state.mode,
        ans: state.ans,
        idx: state.idx,
        view: state.view,
        ts: Date.now(),
      }));
    } catch (e) {}
  }
  function clearState() {
    try { localStorage.removeItem(QKEY); } catch (e) {}
  }

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }
  function setHooks(opt) {
    apiFn = opt.api;
    getDeviceFn = opt.getDeviceId;
    getTokenFn = opt.getToken;
    onCredits = opt.onCreditsChange;
    creditsNow = opt.credits || 0;
    saveResultFn = opt.saveResult || null;
  }
  function syncCredits(n) {
    creditsNow = n;
    if (onCredits) onCredits(n);
    paintCreditTips(n);
  }

  /** 只刷新界面上与「密钥 / 点数」相关的文案（不回调 app，避免循环） */
  function paintCreditTips() {
    const keyed = !!(window.TaroAI && window.TaroAI.hasKey());
    const cfg = keyed ? window.TaroAI.getCfg() : null;
    const tip = document.querySelector("#qrAi .qra-tip");
    if (tip) {
      tip.textContent = keyed
        ? "由你自己的 " + ((cfg && cfg.model) || "AI") + " 生成 · 不扣点数"
        : "需要你自己的 API 密钥 · 本应用不收费";
    }
    const btn = document.getElementById("qrAiBtn");
    if (btn && !btn.disabled && state.test) {
      btn.textContent = keyed
        ? "生成耿鬼的 AI 分析（用我的密钥）"
        : "生成耿鬼的 AI 分析（先填密钥）";
    }
  }
  function scrollTop() {
    const box = document.getElementById("page-quiz");
    if (box) window.scrollTo({ top: Math.max(0, box.offsetTop - 58), behavior: "smooth" });
  }

  /* ============================================================
     视图 1：测试列表
     ============================================================ */
  function viewList() {
    state.view = "list";
    clearState();
    root.innerHTML =
      '<h2 class="page-title">心 理 测 试</h2>' +
      '<p class="page-lead">三套正经量表，题目对应公开版本。测试本身免费，测完给你完整详实的分析。</p>' +
      '<div class="quiz-list">' +
        TESTS.map((t) =>
          '<button class="quiz-card" data-test="' + t.id + '">' +
            '<span class="qc-ico">' + t.icon + "</span>" +
            '<span class="qc-main">' +
              '<span class="qc-name">' + esc(t.name) +
                '<span class="qc-tag">' + esc(t.tag) + "</span></span>" +
              '<span class="qc-desc">' + esc(t.desc) + "</span>" +
              '<span class="qc-meta">精简版 ' + t.shortTotal + " 题 / 完整版 " + t.fullTotal +
                " 题 · 均免费</span>" +
            "</span>" +
            '<span class="qc-go">›</span>' +
          "</button>"
        ).join("") +
      "</div>" +
      '<p class="quiz-foot">量表来源：ECR-R（Fraley 等, 2000）· MBTI 93 题标准版 · IPIP 50 题（Goldberg, 1992）<br>' +
      "测试结果用于自我了解，不构成医学或临床诊断。</p>";
  }

  /* ============================================================
     视图 2：选版本（两种都免费）
     ============================================================ */
  function viewMode() {
    const t = state.test;
    state.view = "mode";
    root.innerHTML =
      '<button class="quiz-back" id="qzBack">‹ 返回</button>' +
      '<div class="qm-head">' +
        '<span class="qm-ico">' + t.icon + "</span>" +
        "<h3>" + esc(t.name) + "</h3>" +
        "<p>" + esc(t.about) + "</p>" +
      "</div>" +
      '<div class="qm-opts">' +
        '<button class="qm-opt" data-mode="short">' +
          '<span class="qmo-badge free">免费</span>' +
          "<b>精简版</b>" +
          '<span class="qmo-meta">' + t.shortTotal + " 题 · 约 " + t.mins.short + " 分钟</span>" +
          "<i>从每个维度抽取代表性题目，快速得到结果。报告同样是完整版，只是精度略低。</i>" +
        "</button>" +
        '<button class="qm-opt best" data-mode="full">' +
          '<span class="qmo-badge free">免费</span>' +
          "<b>完整版</b>" +
          '<span class="qmo-meta">' + t.fullTotal + " 题 · 约 " + t.mins.full + " 分钟</span>" +
          "<i>使用完整量表题库，结果最接近标准测法。推荐认真做一次。</i>" +
        "</button>" +
      "</div>" +
      '<p class="qm-tip">两种版本都免费。测完可自行决定是否让耿鬼做 AI 深度分析</p>';
    saveState();
  }

  /* ============================================================
     视图 3：答题
     ============================================================ */
  function renderQuestion() {
    const t = state.test;
    const q = state.qs[state.idx];
    const total = state.qs.length;
    const pct = Math.round((state.idx / total) * 100);
    const modeName = state.mode === "short" ? "精简版" : "完整版";

    let body = "";
    if (t.scaleType === "choice") {
      body =
        '<div class="qq-options c2">' +
          '<button class="qq-choice' + (state.ans[state.idx] === 0 ? " on" : "") + '" data-v="0">' +
            "<span>A</span><span>" + esc(q.a) + "</span></button>" +
          '<button class="qq-choice' + (state.ans[state.idx] === 1 ? " on" : "") + '" data-v="1">' +
            "<span>B</span><span>" + esc(q.b) + "</span></button>" +
        "</div>";
    } else {
      const opts = t.scaleType === "ecr" ? ECR_SCALE : IPIP_SCALE;
      body =
        '<div class="qq-options ' + (opts.length === 7 ? "l7" : "l5") + '">' +
          opts.map((o) => {
            const on = state.ans[state.idx] === o.v;
            return '<button class="qq-opt' + (on ? " on" : "") + '" data-v="' + o.v + '">' +
              '<span class="qq-num">' + o.v + "</span><span>" + esc(o.t) + "</span></button>";
          }).join("") +
        "</div>";
    }

    const prompt = t.scaleType === "choice"
      ? "下面两种描述，哪个更像你？"
      : t.id === "attach"
      ? "在亲密关系中，我……"
      : "这句话贴切地描述了我";

    root.innerHTML =
      '<button class="quiz-back" id="qzBack">‹ 退出</button>' +
      '<div class="qp-wrap">' +
        '<div class="qp-bar"><i style="width:' + pct + '%"></i></div>' +
        '<div class="qp-meta"><span>第 ' + (state.idx + 1) + " / " + total + " 题</span>" +
          "<span>" + esc(t.name.split("（")[0]) + " · " + modeName + "</span></div>" +
      "</div>" +
      '<div class="qq-card">' +
        '<p class="qq-text">' + esc(prompt) + "</p>" +
        (t.scaleType === "choice" ? "" : '<p class="qq-stem">' + esc(q.t) + "</p>") +
        body +
      "</div>" +
      '<div class="qq-acts">' +
        (state.idx > 0 ? '<button class="qq-btn ghost" id="qqPrev">上一题</button>' : "") +
        '<button class="qq-btn primary" id="qqNext"' +
          (state.ans[state.idx] == null ? " disabled" : "") + ">" +
          (state.idx === total - 1 ? "看 结 果" : "下一题") + "</button>" +
      "</div>";
    saveState();
  }

  function nextQ() {
    if (state.idx < state.qs.length - 1) {
      state.idx++;
      renderQuestion();
      scrollTop();
    } else {
      state.result = score(state.test, state.ans, state.qs);
      viewResult();
      saveResult();
      scrollTop();
    }
  }

  /* 把本次结果存进「我的」里的测评记录（登录走服务端，游客走本地） */
  function buildResultItem() {
    const t = state.test, r = state.result;
    let resultType = "", summary = "";
    if (t.id === "attach") {
      resultType = r.type.name + (r.type.en ? "（" + r.type.en + "）" : "");
      summary = "依恋焦虑 " + r.anx.toFixed(2) + " / 7 · 依恋回避 " + r.avo.toFixed(2) + " / 7";
    } else if (t.id === "mbti") {
      resultType = r.type + " · " + r.meta.name;
      summary = r.dims.map((d) => d.dim + "→" + d.pick + " " + d.pct + "%").join(" · ");
    } else {
      resultType = "大五人格 · 最突出 " + r.top.map((b) => b.name).join("、");
      summary = r.bars.map((b) => b.name + " " + b.v.toFixed(2)).join(" · ");
    }
    return {
      testId: t.id,
      testName: t.name,
      icon: t.icon,
      mode: state.mode,
      resultType: resultType,
      summary: summary,
      ts: Date.now(),
    };
  }

  function saveResult() {
    if (!saveResultFn || !state.result) return;
    try {
      saveResultFn(buildResultItem());
    } catch (e) {}
  }

  /* ============================================================
     视图 4：结果（详细，免费）
     ============================================================ */
  function barHtml(name, pct, right) {
    return (
      '<div class="qr-bar">' +
        '<div class="qrb-top"><span>' + esc(name) + "</span><b>" + esc(right) + "</b></div>" +
        '<div class="qrb-track"><i style="width:' + Math.max(3, Math.min(100, pct)) + '%"></i></div>' +
      "</div>"
    );
  }
  function sec(title, paras) {
    const list = (paras || []).filter(Boolean);
    if (!list.length) return "";
    return '<div class="qr-sec"><h4>' + esc(title) + "</h4>" +
      list.map((p) => "<p>" + esc(p) + "</p>").join("") + "</div>";
  }
  function listSec(title, items) {
    if (!items || !items.length) return "";
    return '<div class="qr-sec"><h4>' + esc(title) + "</h4><ul>" +
      items.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul></div>";
  }

  function resultAttach(r) {
    const T = r.type;
    return (
      '<div class="qr-hero">' +
        '<span class="qrh-ico">' + T.icon + "</span>" +
        '<span class="qrh-type">' + esc(T.name) + "</span>" +
        '<span class="qrh-en">' + esc(T.en) + "</span>" +
        '<p class="qrh-one">' + esc(T.one) + "</p>" +
      "</div>" +
      '<div class="qr-bars">' +
        r.dims.map((d) => barHtml(d.name, d.pct, d.v.toFixed(2) + " / 7")).join("") +
      "</div>" +
      sec("两个维度分别说明什么", r.dims.map((d) => d.name + "：" + d.note)) +
      sec("这意味着什么", [T.overview]) +
      sec("这种模式是怎么形成的", [T.why]) +
      listSec("你在关系里的典型表现", T.traits) +
      listSec("你的优势", T.strength) +
      listSec("可能的盲点", T.blind) +
      listSec("哪些场景最容易触发你", T.triggers) +
      listSec("可以试试", T.advice) +
      sec("和不同类型的人相处", [T.interact]) +
      sec("如果要用一句话说给自己听", [T.script])
    );
  }

  function resultMBTI(r) {
    const T = r.meta;
    const dimHtml = r.dims.map((d) => {
      const Lm = D.MBTI_DIM[d.left], Rm = D.MBTI_DIM[d.right];
      const pick = d.pick === d.left ? Lm : Rm;
      return (
        '<div class="qrd-item">' +
          '<div class="qrd-head"><b>' + esc(d.dim) + "　" + esc(pick.short) + "</b><span>" +
            d.pct + "% · " + esc(d.level) + "</span></div>" +
          '<div class="qrd-track"><i style="width:' + d.pct + '%"></i></div>' +
          '<div class="qrd-ends"><span>' + esc(Lm.short) + " " + d.leftPct + "%</span>" +
            "<span>" + d.rightPct + "% " + esc(Rm.short) + "</span></div>" +
          "<p>" + esc(pick.desc) + "</p>" +
          "<p>" + esc(pick.detail) + "</p>" +
          '<div class="qrd-scene"><h5>日常里通常是这样</h5><ul>' +
            pick.scene.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul></div>" +
          '<p class="qrd-note">常见误解：' + esc(pick.misread) + "</p>" +
        "</div>"
      );
    }).join("");

    return (
      '<div class="qr-hero">' +
        '<span class="qrh-ico">🧭</span>' +
        '<span class="qrh-type">' + esc(r.type) + "</span>" +
        '<span class="qrh-en">' + esc(T.name) + (T.group ? " · " + esc(T.group) : "") + "</span>" +
        '<p class="qrh-one">' + esc(T.one) + "</p>" +
      "</div>" +
      sec("这个类型的核心特点", [T.core]) +
      '<div class="qr-section-title">四个维度分别意味着什么</div>' +
      '<div class="qr-dims">' + dimHtml + "</div>" +
      listSec("典型优势", T.strength) +
      listSec("需要注意的盲点", T.blind) +
      sec("适合的工作方向", [T.work]) +
      sec("在亲密关系中", [T.love]) +
      sec("别人眼中的你", [T.seen]) +
      sec("压力下的你会变成什么样", [T.stress]) +
      listSec("成长建议", T.grow)
    );
  }

  function resultBig5(r) {
    const barsHtml = r.bars.map((b) =>
      barHtml(b.name, b.pct, b.v.toFixed(2) + " / 5")
    ).join("");

    const detailHtml = r.bars.map((b) => {
      const dt = b.detail;
      return (
        '<div class="qr-dim-card">' +
          '<div class="qdc-head">' +
            '<span class="qdc-ico">' + b.icon + "</span>" +
            '<span class="qdc-name"><b>' + esc(b.name) + "</b><i>" + esc(b.en) + " · " +
              esc(b.brief) + "</i></span>" +
            '<span class="qdc-score">' + b.v.toFixed(2) + "</span>" +
          "</div>" +
          '<p class="qdc-about">' + esc(b.about) + "</p>" +
          (dt
            ? '<div class="qdc-tag ' + (dt.tag.indexOf("高") === 1 ? "hi" : "lo") + '">' +
                esc(dt.tag) + "</div>" +
              "<p>" + esc(dt.text) + "</p>" +
              '<div class="qdc-cols">' +
                "<div><h5>优势</h5><ul>" +
                  dt.pros.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul></div>" +
                "<div><h5>可能的代价</h5><ul>" +
                  dt.cons.map((x) => "<li>" + esc(x) + "</li>").join("") + "</ul></div>" +
              "</div>"
            : '<div class="qdc-tag mid">中间水平</div>' +
              "<p>你的得分落在中间区间，说明两种倾向你都有，会随情境灵活切换。" +
              "这通常意味着适应性强，但在需要明确站队或长期坚持一种风格的场合，可能会有摇摆感。</p>") +
          '<div class="qdc-facets"><h5>包含的子维度</h5><p>' +
            b.facets.map(esc).join(" · ") + "</p></div>" +
        "</div>"
      );
    }).join("");

    return (
      '<div class="qr-hero">' +
        '<span class="qrh-ico">📊</span>' +
        '<span class="qrh-type">你的性格轮廓</span>' +
        '<span class="qrh-en">大五人格 · IPIP 50</span>' +
        '<p class="qrh-one">最突出的是「' + esc(r.top[0].name) + "」与「" + esc(r.top[1].name) +
          "」，相对最不突出的是「" + esc(r.bottom[0].name) + "」。</p>" +
      "</div>" +
      '<div class="qr-bars">' + barsHtml + "</div>" +
      sec("怎么读这份报告", [
        "大五的五个维度是连续光谱，不是「有或没有」——所以不用把低分那一端当作缺点。" +
        "优先看你得分最高和最低的两个维度，它们最能解释你的行为风格；" +
        "其余维度处在中间也很正常，人群中多数人的得分都集中在中段。",
      ]) +
      '<div class="qr-section-title">逐维度详解</div>' +
      detailHtml
    );
  }

  function viewResult() {
    const t = state.test;
    const r = state.result;
    state.view = "result";

    let core;
    if (t.id === "attach") core = resultAttach(r);
    else if (t.id === "mbti") core = resultMBTI(r);
    else core = resultBig5(r);

    root.innerHTML =
      '<button class="quiz-back" id="qzBack">‹ 换个测试</button>' +
      '<div class="qr-mode">结果来自「' + (state.mode === "short" ? "精简版" : "完整版") +
        "」· 共作答 " + state.qs.length + " 题</div>" +
      core +
      '<div class="qr-ai" id="qrAi">' +
        '<div class="qra-head">' +
          "<b>✦ 想让耿鬼再帮你深挖一层吗？</b>" +
          "<i>上面是量表的标准解读。耿鬼的 AI 分析会读取你每一题的具体作答，" +
          "结合你的选择模式写出更有针对性的内容——不只是告诉你「你是什么类型」，" +
          "而是「为什么会形成这样、接下来具体可以怎么做」。</i>" +
        "</div>" +
        '<button class="qra-btn" id="qrAiBtn">生成耿鬼的 AI 分析（' +
          (window.TaroAI && window.TaroAI.hasKey() ? "用我的密钥" : "先填密钥") +
          "）</button>" +
        '<p class="qra-tip">' +
          (window.TaroAI && window.TaroAI.hasKey()
            ? "由你自己的 " + ((window.TaroAI.getCfg() || {}).model || "AI") + " 生成 · 不扣点数"
            : "需要你自己的 API 密钥 · 本应用不收费") +
          "</p>" +
      "</div>" +
      '<div class="qr-acts">' +
        '<button class="qq-btn ghost" id="qrRedo">重 测 一 次</button>' +
        '<button class="qq-btn primary" id="qrCopy">复 制 结 果</button>' +
      "</div>" +
      '<p class="quiz-foot">本测试基于公开心理量表，结果用于自我了解与参考，不构成医学或临床诊断。</p>';
    saveState();
  }

  /* ---------- AI 分析 ---------- */
  async function runAiReport() {
    const t = state.test;
    const btn = document.getElementById("qrAiBtn");
    const box = document.getElementById("qrAi");
    if (!btn || !box) return;
    btn.disabled = true;
    btn.textContent = "耿鬼正在读你的答卷…";

    const maxV = t.scaleType === "ecr" ? 7 : 5;
    const detail = state.qs.map((q, i) => {
      const a = state.ans[i];
      if (t.scaleType === "choice") {
        return (i + 1) + ". A：" + q.a + "；B：" + q.b +
          " → 选了 " + (a === 0 ? "A" : "B") + "（维度 " + q.d +
          "，计入 " + (a === 0 ? q.ka : q.kb) + "）";
      }
      return (i + 1) + ". " + q.t + " → " + a + "/" + maxV +
        "（维度 " + q.d + (q.r ? "，此题为反向计分" : "") + "）";
    }).join("\n");

    const r = state.result;
    let summary = "";
    if (t.id === "attach") {
      summary = "依恋类型：" + r.type.name + "（依恋焦虑 " + r.anx.toFixed(2) +
        "/7，依恋回避 " + r.avo.toFixed(2) + "/7）";
    } else if (t.id === "mbti") {
      summary = "MBTI 类型：" + r.type + " " + r.meta.name + "；" +
        r.dims.map((d) => "维度 " + d.dim + " 倾向 " + d.pick + "（" + d.pct + "%，" + d.level + "）").join("；");
    } else {
      summary = "大五各维度得分（满分 5）：" +
        r.bars.map((b) => b.name + " " + b.v.toFixed(2)).join("，") +
        "；最突出：" + r.top.map((b) => b.name).join("、");
    }

    if (!window.TaroAI || !window.TaroAI.hasKey()) {
      box.innerHTML =
        '<div class="qra-err">AI 分析需要用到你自己的 API 密钥，本应用不收费。' +
        '<button class="qq-btn ghost" id="qrKeyBtn" style="margin-left:8px">去 填 密 钥</button></div>';
      const kb = document.getElementById("qrKeyBtn");
      if (kb) {
        kb.addEventListener("click", () =>
          window.TaroAI.openSettings(() => paintCreditTips())
        );
      }
      btn.disabled = false;
      paintCreditTips();
      return;
    }

    const prompt = [
      "【测评】" + t.name + "（" + (state.mode === "short" ? "精简版" : "完整版") +
        "，共 " + state.qs.length + " 题）",
      "【量表结果】" + summary,
      "【逐题作答】",
      detail,
      "",
      "请基于上面的作答写一段针对这个人的分析，要求：",
      "1) 先用一段话点出他从答题里透出的最核心模式（不要复述量表结论）；",
      "2) 再分 3 段展开：他在关系或工作里的典型状态、这种模式可能的来处、它带来的优势与代价；",
      "3) 最后给 3 条具体可执行的建议，每条单独一行、以「· 」开头，带时间感（本周/这个月）；",
      "4) 全文 500~800 字，用第二人称，像朋友聊天，不给诊断、不下定论，必要时提醒这只是自我了解的参考。",
    ].join("\n");

    try {
      const text = await window.TaroAI.chat(
        [
          {
            role: "system",
            content:
              "你是塔罗占卜师「耿鬼」，也熟悉心理学量表。你说话亲切、直接、不敷衍，不做临床诊断。只用中文，不使用 emoji。",
          },
          { role: "user", content: prompt },
        ],
        { temperature: 0.85 }
      );
      box.innerHTML =
        '<div class="qra-head"><b>✦ 耿鬼给你的专属分析</b>' +
          '<i class="qra-by">由你自己的 ' +
          esc((window.TaroAI.getCfg() || {}).model || "AI") +
          " 生成 · 不扣点数</i></div>" +
        '<div class="qra-body">' +
          String(text || "")
            .split(/\n+/).map((s) => s.trim()).filter(Boolean)
            .map((p) => (/^·/.test(p)
              ? "<li>" + esc(p.replace(/^·\s*/, "")) + "</li>"
              : "<p>" + esc(p) + "</p>")).join("") +
        "</div>";
      btn.disabled = false;
      btn.textContent = "重新生成 AI 分析（用我的密钥）";
    } catch (e) {
      box.innerHTML =
        '<div class="qra-err">' + esc((e && e.message) || "生成失败，请稍后重试") +
        '<button class="qq-btn ghost" id="qrKeyBtn" style="margin-left:8px">检 查 密 钥</button></div>';
      const kb = document.getElementById("qrKeyBtn");
      if (kb) kb.addEventListener("click", () => window.TaroAI.openSettings());
      btn.disabled = false;
      btn.textContent = "重新生成 AI 分析（用我的密钥）";
    }
  }

  /* ---------- 复制 ---------- */
  function copyResult() {
    const t = state.test, r = state.result;
    let txt = "【" + t.name + " · " + (state.mode === "short" ? "精简版" : "完整版") + "】\n\n";
    if (t.id === "attach") {
      txt += "依恋类型：" + r.type.name + "（" + r.type.en + "）\n" + r.type.one + "\n\n";
      txt += "依恋焦虑 " + r.anx.toFixed(2) + "/7　依恋回避 " + r.avo.toFixed(2) + "/7\n\n";
      txt += r.type.overview + "\n\n优势：\n" + r.type.strength.map((x) => "· " + x).join("\n");
      txt += "\n\n盲点：\n" + r.type.blind.map((x) => "· " + x).join("\n");
      txt += "\n\n建议：\n" + r.type.advice.map((x) => "· " + x).join("\n");
    } else if (t.id === "mbti") {
      txt += "类型：" + r.type + " " + r.meta.name + "\n" + r.meta.one + "\n\n";
      txt += r.dims.map((d) => "· " + d.dim + " 倾向 " + d.pick + "（" + d.pct + "% · " + d.level + "）").join("\n");
      txt += "\n\n" + (r.meta.core || "");
      txt += "\n\n优势：\n" + r.meta.strength.map((x) => "· " + x).join("\n");
      txt += "\n\n盲点：\n" + r.meta.blind.map((x) => "· " + x).join("\n");
    } else {
      txt += r.bars.map((b) => "· " + b.name + " " + b.v.toFixed(2) + "/5（" + b.pct + "%）").join("\n");
      txt += "\n\n最突出：" + r.top.map((b) => b.name).join("、");
    }
    txt += "\n\n—— 来自「耿鬼的桀桀塔罗店」";
    const done = () => window.TarotApp && window.TarotApp.toast("结果已复制");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done, done);
    } else {
      const ta = document.createElement("textarea");
      ta.value = txt; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      ta.remove(); done();
    }
  }

  /* ============================================================
     事件
     ============================================================ */
  let bound = false;
  function bind() {
    root.addEventListener("click", (e) => {
      const card = e.target.closest(".quiz-card");
      if (card) {
        state.test = TESTS.find((t) => t.id === card.dataset.test) || null;
        viewMode(); scrollTop(); return;
      }
      if (e.target.closest("#qzBack")) {
        if (state.view === "list" || state.view === "result") { state.view = "list"; viewList(); }
        else { viewMode(); }
        scrollTop(); return;
      }
      const opt = e.target.closest(".qm-opt");
      if (opt) {
        state.mode = opt.dataset.mode;
        state.qs = pickQuestions(state.test, state.mode);
        state.ans = new Array(state.qs.length).fill(null);
        state.idx = 0; state.view = "quiz";
        renderQuestion(); scrollTop(); return;
      }
      const pick = e.target.closest(".qq-opt") || e.target.closest(".qq-choice");
      if (pick) {
        const cur = state.idx;
        state.ans[cur] = Number(pick.dataset.v);
        renderQuestion();
        setTimeout(() => {
          if (state.view === "quiz" && state.idx === cur && state.ans[cur] != null) nextQ();
        }, 200);
        return;
      }
      if (e.target.closest("#qqPrev")) {
        if (state.idx > 0) { state.idx--; renderQuestion(); scrollTop(); }
        return;
      }
      if (e.target.closest("#qqNext")) {
        if (state.ans[state.idx] != null) nextQ();
        return;
      }
      if (e.target.closest("#qrAiBtn")) { runAiReport(); return; }
      if (e.target.closest("#qrRedo")) {
        state.idx = 0;
        state.ans = new Array(state.qs.length).fill(null);
        state.view = "quiz"; renderQuestion(); scrollTop(); return;
      }
      if (e.target.closest("#qrCopy")) { copyResult(); return; }
    });
  }

  function mount(el, credits) {
    root = el;
    if (!bound) { bind(); bound = true; }
    if (typeof credits === "number") creditsNow = credits;
    // 页面刷新后第一次挂载（比如去付款后跳回来），尝试还原上次的界面与进度
    if (!mountedOnce) {
      mountedOnce = true;
      if (restoreSaved()) return;
    }
    if (state.view === "list") viewList();
  }

  /** 从存档还原：把界面恢复到用户离开前的位置 */
  function restoreSaved() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(QKEY) || "null"); } catch (e) { d = null; }
    if (!d || !d.testId) return false;
    if (Date.now() - (d.ts || 0) > 2 * 3600 * 1000) { clearState(); return false; }
    const t = TESTS.find((x) => x.id === d.testId);
    if (!t) { clearState(); return false; }

    state.test = t;
    state.mode = d.mode === "short" ? "short" : "full";
    state.qs = pickQuestions(t, state.mode);
    state.ans = Array.isArray(d.ans) && d.ans.length === state.qs.length
      ? d.ans.slice()
      : new Array(state.qs.length).fill(null);
    state.idx = Math.min(Math.max(0, d.idx || 0), state.qs.length - 1);

    const answered = state.ans.every((a) => a != null);
    if (d.view === "result" && answered) {
      state.result = score(t, state.ans, state.qs);
      viewResult();
      scrollTop();
      return true;
    }
    if (d.view === "quiz") {
      state.view = "quiz";
      renderQuestion();
      scrollTop();
      return true;
    }
    viewMode();
    scrollTop();
    return true;
  }

  window.TarotQuiz = {
    setHooks: setHooks,
    mount: mount,
    restoreSaved: restoreSaved,
    refreshCredits: (n) => { creditsNow = n; paintCreditTips(n); },
    TESTS: TESTS,
  };
})();

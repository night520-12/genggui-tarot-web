/* ============================================================
   耿鬼解牌引擎（本地规则）
   ------------------------------------------------------------
   不依赖任何外部服务，纯前端生成叙事式长文解读。
   设计要点：
     1) 牌义不是照抄 data.js 的段落，而是抽取「牌势指纹」——
        每张牌在某个位置、某个正逆位下，对应一组语义角色：
        该位置需要「推动 / 阻碍 / 调和」，牌本身是「顺 / 滞 / 转」。
        两者一交叉，就能说出一句有判断力的话。
     2) 段落之间用「承接词」过渡，形成叙事链，而非条目罗列。
     3) 用户问题会被解析出主题（感情/事业/学业/财富/健康/选择/人际/成长），
        影响措辞与建议方向。
   对外只暴露 buildReading(ctx) -> { title, paras: [..] }
   ============================================================ */

/**
 * 位置语义 → 该位置"希望看到什么"。
 * 用于判断某张牌落在此位置是顺势还是逆势。
 *   push  该位置偏向「应该主动、向前」
 *   block 该位置偏向「需要警惕、收敛」
 *   flow  该位置偏向「顺应、等待」
 */
const POS_ROLE = {
  // 时间轴
  过去: "flow", 现在: "push", 未来: "flow", 近过去: "flow", 近未来: "flow",
  // 处境/建议/结果
  现状: "flow", 建议: "push", 结果: "flow", 最终结果: "flow",
  可能结果: "flow", 发展走向: "flow", 结局: "flow", 最终答案: "flow",
  // 阻碍/助力
  阻碍: "block", 核心阻碍: "block", 关系阻碍: "block", 当前阻碍: "block",
  助力: "push",
  // 内外
  外界环境: "block", 你的状态: "flow", 潜意识根基: "flow", 意识目标: "push",
  希望与恐惧: "flow", 隐藏因素: "flow", 潜藏问题: "block",
  // 行动类
  应采取的行动: "push", 该做的事: "push", 不该做: "block",
  行动: "push", 你的力量: "push", 你的优势: "push",
};

/** 牌阵类型 → 解读侧重 */
function spreadFocus(id) {
  if (["love5", "venus8", "love7"].includes(id)) return "relationship";
  if (["career5", "study4"].includes(id)) return "career";
  if (["wealth4"].includes(id)) return "wealth";
  if (["choice5", "yesno3"].includes(id)) return "choice";
  if (["zodiac12", "tree10", "nine9"].includes(id)) return "holistic";
  return "general";
}

/** 从用户问题里嗅出主题 */
function detectTopic(q) {
  if (!q) return null;
  const t = q.toLowerCase();
  const rules = [
    ["relationship", /爱|喜欢|感情|男友|女友|恋|婚姻|结婚|复合|分手|他|她|对方|暧昧|脱单|脱单|桃花/],
    ["career", /工作|职业|辞职|跳槽|换工作|升职|面试|老板|同事|创业|事业|离职|offer|找工作/],
    ["study", /学习|考试|考研|考研|成绩|毕业|论文|留学|学业|分数|考证|申研/],
    ["wealth", /钱|财|收入|投资|理财|工资|存款|买房|债务|赚|亏损|股|基金/],
    ["choice", /选|该不该|要不要|哪个|怎么选|如何决定|纠结|二选一/],
    ["health", /健康|身体|失眠|焦虑|抑郁|疲惫|压力|情绪|病|养生/],
    ["social", /朋友|家人|父母|人际|沟通|关系|团队|邻里|亲戚/],
    ["growth", /自己|成长|改变|方向|人生|意义|迷茫|目标|未来|突破/],
  ];
  for (const [k, re] of rules) if (re.test(t)) return k;
  return null;
}

const TOPIC_WORD = {
  relationship: { field: "这段关系", you: "你在感情里的状态", act: "与对方坦诚沟通" },
  career: { field: "你的事业", you: "你在工作上的处境", act: "把想法落成具体的一步" },
  study: { field: "你的学业", you: "你在学习上的状态", act: "稳住节奏、按计划推进" },
  wealth: { field: "你的财务", you: "你与金钱的关系", act: "先梳理收支再谈行动" },
  choice: { field: "这个选择", you: "你面对选择时的心态", act: "先明确你最在意的那一条" },
  health: { field: "你的身心状态", you: "近来的内在状态", act: "先把休息与照顾自己放回日程" },
  social: { field: "你的人际关系", you: "你与他人的相处模式", act: "把真实感受说出口" },
  growth: { field: "你正在走的这段路", you: "你此刻的内在状态", act: "允许自己按自己的节奏来" },
  general: { field: "这件事", you: "你此刻的状态", act: "先稳住自己再谈改变" },
};

/* ---------------- 牌势指纹 ----------------
   每张牌（按 id 0..77）给一个"气质"标签：
     open   开拓、主动、外放
     hold   守成、稳固、内敛
     turn   转折、转化、蜕变
     clash  冲突、消耗、摩擦
     flow   流动、顺遂、柔和
     fog    迷雾、未明、摇摆
   用于和位置角色交叉，得出"顺势/逆势"的判断。
   未列出的牌按花色/数字自动推断（见 inferTemper）。
------------------------------------------- */
const TEMPER_BY_ID = {
  0: "open",  // 愚者
  1: "open",  // 魔术师
  2: "hold",  // 女祭司
  3: "open",  // 女皇
  4: "hold",  // 皇帝
  5: "hold",  // 教皇
  6: "open",  // 恋人
  7: "open",  // 战车
  8: "hold",  // 力量
  9: "hold",  // 隐士
  10: "turn", // 命运之轮
  11: "hold", // 正义
  12: "turn", // 倒吊人
  13: "turn", // 死神
  14: "flow", // 节制
  15: "clash",// 恶魔
  16: "clash",// 塔
  17: "flow", // 星星
  18: "fog",  // 月亮
  19: "open", // 太阳
  20: "turn", // 审判
  21: "flow", // 世界
};

/** 落回花色/数字推断牌势 */
function inferTemper(card) {
  if (card.arcana === "major") return "flow";
  const suit = card.suit;
  const num = String(card.num);
  // 数字倾向
  const numMap = {
    A: "open", "2": "fog", "3": "flow", "4": "hold", "5": "clash",
    "6": "flow", "7": "fog", "8": "hold", "9": "hold", "10": "turn",
    P: "open", N: "open", Q: "hold", K: "hold",
  };
  let t = numMap[num] || "flow";
  // 花色微调
  if (suit === "swords" && (t === "flow")) t = "clash";
  if (suit === "cups" && t === "turn") t = "flow";
  if (suit === "pentacles" && t === "fog") t = "hold";
  if (suit === "wands" && t === "hold") t = "open";
  return t;
}

function temperOf(card) {
  if (Object.prototype.hasOwnProperty.call(TEMPER_BY_ID, card.id)) {
    return TEMPER_BY_ID[card.id];
  }
  return inferTemper(card);
}

/** 牌势 + 位置角色 + 正逆位 → 一句判断的「调性」 */
function verdictOf(card, posRole, reversed) {
  const t = temperOf(card);
  // 正位：牌势直接作用；逆位：把能量反过来看
  const eff = reversed ? invertTemper(t) : t;
  let tone;
  if (posRole === "push") {
    tone = eff === "open" || eff === "flow" ? "good" : eff === "hold" ? "mixed" : eff === "fog" ? "mixed" : "hard";
  } else if (posRole === "block") {
    // 阻碍位出现"阻滞型"牌 = 阻碍坐实；出现"开拓型"牌 = 阻碍其实可破
    tone = eff === "clash" || eff === "hold" ? "hard" : eff === "fog" ? "mixed" : "good";
  } else {
    // flow 位：顺势为吉，逆势需耐心
    tone = eff === "clash" || eff === "fog" ? "hard" : eff === "hold" ? "mixed" : "good";
  }
  return { tone, temper: t, eff };
}

function invertTemper(t) {
  return { open: "hold", hold: "open", turn: "fog", clash: "flow", flow: "clash", fog: "turn" }[t] || "flow";
}

/* ---------------- 措辞库 ---------------- */
const TONE_LEAD = {
  good: ["这里透出一股顺势的力量", "这个位置是站在你这边的", "牌面在这里给出了正向的回应"],
  mixed: ["这里的信号并不单一", "这个位置需要你多留一份心", "牌面在这里给出的是半开半合的态度"],
  hard: ["这里的分量是沉的", "这个位置值得你停下来认真看", "牌面在这里亮出了一盏警示的灯"],
};

const TEMPER_DESC = {
  open: "带有向外推展的动能",
  hold: "偏向内敛与守成",
  turn: "指向一个正在发生的转化",
  clash: "带着摩擦与消耗的意味",
  flow: "呈现柔缓流动的质地",
  fog: "蒙着一层未明的雾气",
};

function pick(arr, seed) {
  return arr[Math.abs(seed) % arr.length];
}

/* ---------------- 主入口 ---------------- */
/**
 * @param {object} ctx
 *   ctx.spread  当前牌阵对象
 *   ctx.items   [{card, reversed}]
 *   ctx.question 用户问题（可空）
 * @returns {{title:string, paras:string[]}}
 */
function buildReading(ctx) {
  const sp = ctx.spread;
  const items = ctx.items || [];
  const q = (ctx.question || "").trim();
  const topic = detectTopic(q) || spreadFocus(sp.id);
  const tw = TOPIC_WORD[topic] || TOPIC_WORD.general;
  const paras = [];

  if (!items.length) return { title: "耿鬼的解读", paras: [] };

  // 逐张分析
  const analyses = items.map((it, i) => {
    const pos = (sp.positions && sp.positions[i]) || "牌 " + (i + 1);
    const posDesc = (sp.posDesc && sp.posDesc[i]) || "";
    const role = POS_ROLE[pos] || "flow";
    const v = verdictOf(it.card, role, it.reversed);
    return { it, i, pos, posDesc, role, ...v };
  });

  const goodN = analyses.filter((a) => a.tone === "good").length;
  const hardN = analyses.filter((a) => a.tone === "hard").length;
  const revN = items.filter((x) => x.reversed).length;

  /* ---------- ① 开篇：整体氛围 ---------- */
  let opening = "";
  if (q) {
    opening += "你带着「" + q + "」这个问题来抽牌，";
  } else {
    opening += "你这次没有写下具体的问题，但牌面依然给出了很清楚的指向，";
  }

  const overall =
    goodN >= analyses.length * 0.6
      ? "整体气势是明朗的。"
      : hardN >= analyses.length * 0.6
      ? "整体气势偏沉，但这恰恰是牌在提醒你慢下来。"
      : "整体是明暗交织的，既有推你向前的力，也有需要你耐心处理的部分。";

  const majorN = items.filter((x) => x.card.arcana === "major").length;
  const majorNote =
    majorN >= Math.max(2, analyses.length * 0.4)
      ? "这次抽到的牌里大阿卡纳偏多，说明这不是一件小事，它触碰的是你人生中比较重要的课题。"
      : "";

  opening += overall + majorNote;
  paras.push(opening);

  /* ---------- ② 逐个位置串成叙事 ---------- */
  analyses.forEach((a, idx) => {
    const c = a.it.card;
    const name = c.name;
    const orient = a.it.reversed ? "逆位" : "正位";
    const lead = pick(TONE_LEAD[a.tone], idx + c.id);
    const tdesc = TEMPER_DESC[a.eff] || "";

    let s = "";

    // 第一张牌：交代起点
    if (idx === 0) {
      s += "先从「" + a.pos + "」说起——";
    } else {
      // 承接词，形成叙事链
      const trans = ["接着看", "顺着往下", "再往里看一层", "把目光移到", "更深一点来说", "最后落到"];
      s += pick(trans, idx) + "「" + a.pos + "」：";
    }

    // 位置含义 + 牌
    if (a.posDesc) {
      // posDesc 常以"位置名：说明"的形式出现，把冒号前的重复部分去掉
      let pd = a.posDesc.replace(/^[^：:]{1,8}[：:]/, "").replace(/[。，,]$/, "");
      s += "这个位置讲的是" + pd + "，";
    }
    s += "而在这里出现的正是" + name + "（" + orient + "）。" + lead + "，" + tdesc + "。";

    // 结合牌义（抽取短句，不整段照搬）
    const raw = a.it.reversed ? c.rev : c.up;
    const firstSentence = String(raw).split(/[。；]/)[0];
    if (firstSentence) s += firstSentence + "。";

    // 位置角色适配的一句话
    if (a.role === "block") {
      s += a.tone === "hard"
        ? "它落在这个位置上，说明这确实是你当下绕不开的一道坎。"
        : "虽然这个位置本应指出阻力，但它的性质偏软，意味着这道坎未必像你以为的那么硬。";
    } else if (a.role === "push") {
      s += a.tone === "hard"
        ? "而恰恰在这个需要你主动的位置上，它提醒你：现在强推不如先蓄力。"
        : "在这个需要你出手的位置上，它给了你行动的底气。";
    } else {
      // flow 位：三种调性各说各话，避免复读
      const flowTail = {
        good: [
          "放在这个位置上，是一个让人安心的信号。",
          "作为这一环的答案，它是偏向你的。",
          "这个位置能拿到这张牌，是件好事。",
          "它在这里给出的，是一份踏实的底气。",
        ],
        mixed: [
          "放在这里，它没有直接给出结论，而是要你自己去掂量。",
          "这个位置上，它既是提示也是提醒，两端都留着余地。",
          "它在这里的态度是留白的，答案还要你自己填。",
        ],
        hard: [
          "在这个位置上，它更多是在替你点出需要正视的部分。",
          "它落在这里，是在提醒你这里还有功课没做完。",
          "放在这一环，它是提醒而非阻挠——看清了才有转机。",
        ],
      };
      s += pick(flowTail[a.tone] || flowTail.mixed, idx * 7 + c.id);
    }

    paras.push(s);
  });

  /* ---------- ③ 综合串讲 ---------- */
  const core = analyses.reduce((best, a) =>
    Math.abs(a.i - analyses.length / 2) < Math.abs(best.i - analyses.length / 2) ? a : best
  , analyses[0]);
  const coreCard = core.it.card;

  let synth = "把这些牌放在一起看，";
  synth += "最核心的一条线索藏在「" + core.pos + "」的" + coreCard.name + "上——";
  synth += "它像是整副牌的重心，" + (core.tone === "good"
    ? "说明这件事的主动权其实还在你手里。"
    : core.tone === "hard"
    ? "说明这件事真正的难点就在这里，绕不过去。"
    : "说明这件事的关键在于你怎么看待它，而非它本身多难。");

  synth += "牌与牌之间并不是各说各话，它们连成了一条线：" +
    analyses.map((a) => a.pos + "的" + a.it.card.name + (a.it.reversed ? "（逆）" : "")).join("、") +
    "。";

  if (revN > 0) {
    synth += "这次有 " + revN + " 张逆位牌，逆位不代表坏，更多是代表" +
      "这股能量目前是向内收的、或者还没有顺畅地流出来——它对应的是你心里那些还没说出口、还没行动起来的部分。";
  }
  paras.push(synth);

  /* ---------- ④ 结合问题的回应 ---------- */
  if (q) {
    let ans = "回到你问的「" + q + "」：";
    if (goodN > hardN) {
      ans += "从牌面看，答案是偏正向的，" + tw.field + "有向好的基础。但牌没有许诺结果，它说的是：只要你愿意按上面提示的方向去走，路是通的。";
    } else if (hardN > goodN) {
      ans += "牌面没有直接给你一个轻松的答案。它更像是在说，" + tw.field +
        "眼下确实处在需要谨慎的阶段，急着要一个结论反而会看不清。把注意力从「结果会怎样」挪到「我现在能做什么」，局面才会松动。";
    } else {
      ans += "牌面给出的不是非黑即白的答案，而是提醒你这件事本身还处在流动之中。" +
        tw.field + "的走向，很大程度上取决于你接下来的选择与态度。";
    }
    ans += "关于" + tw.you + "，牌已经说得很清楚了：你并不缺方向，缺的是一个愿意为自己负责的决定。";
    paras.push(ans);
  }

  /* ---------- ⑤ 建议 ---------- */
  const advices = [];
  // 从牌面挖建议
  const hardCards = analyses.filter((a) => a.tone === "hard");
  const goodCards = analyses.filter((a) => a.tone === "good");

  if (hardCards.length) {
    const h = hardCards[0];
    advices.push("先处理「" + h.pos + "」这里的问题——" + h.it.card.name + "已经点出了症结，别绕开它。");
  }
  if (goodCards.length) {
    const g = goodCards[0];
    advices.push("「" + g.pos + "」的" + g.it.card.name + "可以借力，这是你目前相对稳的一块，从这里入手会顺很多。");
  }
  advices.push(tw.act + "。把大目标拆成一两周内能做完的小事，先去完成它。");
  if (revN > 2) {
    advices.push("这次逆位牌偏多，建议你给自己留出消化情绪的时间，不必逼自己马上想通。");
  }
  advices.push("过一两周可以再抽一次，看看牌面的走向有没有变化——塔罗更像是一面镜子，照的是你当下的心境。");

  let adviceText = "给你的建议，落在这几件具体的事上：\n" + advices.map((a) => "· " + a).join("\n");
  paras.push(adviceText);

  /* ---------- ⑥ 收尾 ---------- */
  paras.push(
    "最后想说的是，塔罗从来不做判决，它只是把你心里已经有、却还没敢承认的答案，换一种方式摆在你面前。" +
    "牌已经翻开了，怎么走，还是你自己的事。"
  );

  return { title: "耿鬼的解读", paras };
}

/* ============================================================
   浏览器内置 AI 适配层（可选增强）
   ------------------------------------------------------------
   Chrome / Edge 内置 Gemini Nano，本地推理、零额度、数据不出设备。
   但要注意现实限制：
     · 对普通网页仍在 Origin Trial，多数用户默认没有
     · 仅桌面端，且需 4GB+ 显存 / 16GB+ 内存 / 22GB 磁盘
     · 手机完全不支持
   所以这里只作为「锦上添花」，拿不到就静默降级回本地规则引擎。
   三种可能的 API 形态都要探测：
     1) LanguageModel            （新标准，全局构造器）
     2) window.ai.languageModel  （早期形态）
     3) navigator.ai.languageModel（另一变体）
   ============================================================ */
function getBrowserAI() {
  if (typeof LanguageModel !== "undefined" && LanguageModel) {
    return { kind: "std", api: LanguageModel };
  }
  if (typeof window !== "undefined") {
    if (window.ai && window.ai.languageModel) {
      return { kind: "window.ai", api: window.ai.languageModel };
    }
    if (navigator && navigator.ai && navigator.ai.languageModel) {
      return { kind: "nav.ai", api: navigator.ai.languageModel };
    }
  }
  return null;
}

/** 探测可用性：返回 'ready' | 'downloadable' | 'downloading' | 'no' */
async function probeBrowserAI() {
  const found = getBrowserAI();
  if (!found) return "no";
  try {
    // 新标准：availability()
    if (typeof found.api.availability === "function") {
      const a = await found.api.availability();
      if (a === "available") return "ready";
      if (a === "downloadable" || a === "after-download") return "downloadable";
      if (a === "downloading") return "downloading";
      return "no";
    }
    // 旧标准：capabilities()
    if (typeof found.api.capabilities === "function") {
      const c = await found.api.capabilities();
      const v = c && c.available;
      if (v === "readily") return "ready";
      if (v === "after-download") return "downloadable";
      return "no";
    }
  } catch (e) {
    return "no";
  }
  return "no";
}

/** 构造给本地模型的提示词（与云端版本共用同一套内容结构） */
function buildLocalAIPrompt(ctx) {
  const sp = ctx.spread;
  const lines = [];
  lines.push(
    "你现在是一位塔罗占卜师，名字叫耿鬼，语气亲切、略带神秘感，说话像朋友聊天。"
  );
  lines.push(
    "请根据下面这次抽牌，写一段解读。要求：先说整体氛围，再逐张把牌意、位置含义、正逆位结合起来讲，"
  );
  lines.push(
    "不要机械复述牌义；把所有牌串成连贯的叙事；最后给 2-3 条具体可执行的建议。"
  );
  lines.push(
    "用自然段落书写，不要用标题、加粗或列表符号，不要做宿命论的绝对断言。"
  );
  lines.push("篇幅 500-700 字。");
  lines.push("");
  lines.push("牌阵：" + sp.label + (sp.desc ? "（" + sp.desc + "）" : ""));
  if (ctx.question) lines.push("用户的问题：" + ctx.question);
  lines.push("抽到的牌：");
  (ctx.items || []).forEach((it, i) => {
    const c = it.card;
    const pos = (sp.positions && sp.positions[i]) || "牌 " + (i + 1);
    const pd = (sp.posDesc && sp.posDesc[i]) || "";
    lines.push(
      (i + 1) + ". " + pos + (pd ? "（" + pd + "）" : "") + " —— " + c.name +
      "，" + (it.reversed ? "逆位" : "正位") +
      "。正位牌义：" + c.up + " 逆位牌义：" + c.rev
    );
  });
  lines.push("");
  lines.push("请开始你的解读。");
  return lines.join("\n");
}

/** 调用浏览器内置 AI，返回文本；失败时抛错 */
async function runBrowserAI(ctx, onProgress) {
  const found = getBrowserAI();
  if (!found) throw new Error("no-browser-ai");
  const promptText = buildLocalAIPrompt(ctx);
  const opts = found.kind === "std"
    ? { temperature: 1, topK: 3 }
    : { temperature: 1, topK: 3 };
  const session = await found.api.create(opts);
  try {
    let text = "";
    // 优先流式，边生成边回调
    if (typeof session.promptStreaming === "function") {
      const stream = session.promptStreaming(promptText);
      let last = "";
      for await (const chunk of stream) {
        // 注意：Chrome 的流式返回是"累计全文"，不是增量
        text = chunk;
        if (onProgress && text !== last) {
          last = text;
          onProgress(text);
        }
      }
    } else {
      text = await session.prompt(promptText);
      if (onProgress) onProgress(text);
    }
    return String(text || "").trim();
  } finally {
    if (session && typeof session.destroy === "function") session.destroy();
  }
}

/* 暴露给 app.js */
window.TarotReading = {
  buildReading,
  detectTopic,
  probeBrowserAI,
  runBrowserAI,
  buildLocalAIPrompt,
};


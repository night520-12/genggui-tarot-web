/* ============================================================
   星语塔罗 · 交互逻辑
   ============================================================ */
(function () {
  "use strict";

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------------- 牌阵库 ----------------
     grid = 卡牌摆放网格 [列数, 行数]（用于结果区布局）
     layout = 每张牌在网格中的 [列, 行]（从 1 开始）
     cat = 分类：general / love / career / study / self
  -------------------------------------------- */
  const SPREADS = [
    /* ---- 通用 ---- */
    {
      id: "single",
      label: "单牌指引",
      en: "One Card",
      cat: "general",
      count: 1,
      desc: "今日运势 / 单一问题的核心答案",
      tip: "最直接的一问一答，适合每日抽牌或急需方向时。",
      detail: "抽牌前深呼吸，在心中默念问题。这张牌就是宇宙此刻给你的最直接回应，无需复杂组合，凭直觉感受牌面传递的讯息即可。",
      grid: [1, 1],
      layout: [[1, 1]],
      positions: ["指引"],
      posDesc: ["此刻最需要关注的核心讯息，单一而纯粹的答案"]
    },
    {
      id: "timeline3",
      label: "三牌阵 · 时间流",
      en: "Past · Present · Future",
      cat: "general",
      count: 3,
      desc: "过去 → 现在 → 未来",
      tip: "看清事情从何而来、如今在哪、将往哪去，最经典的牌阵。",
      detail: "解读时先看三张牌之间的演变逻辑：过去的因如何造成现在的果，现在的状态又将如何自然延伸到未来。若过去与未来牌义冲突，重点看现在这张牌给你的启示。",
      grid: [3, 1],
      layout: [[1, 1], [2, 1], [3, 1]],
      positions: ["过去", "现在", "未来"],
      posDesc: [
        "过去：事情的来路、成因与已经发生的影响",
        "现在：当前的真实状态与你正处的位置",
        "未来：若维持现状，事情自然的走向"
      ]
    },
    {
      id: "situation3",
      label: "三牌阵 · 处境分析",
      en: "Situation · Action · Outcome",
      cat: "general",
      count: 3,
      desc: "现状 → 建议 → 结果",
      tip: "不只告诉你发生了什么，更告诉你该怎么做。",
      detail: "与时间流不同，这个牌阵侧重「怎么办」。重点解读中间的建议牌——它是整个牌阵的灵魂。结果牌显示的是按建议行动后的可能走向，而非注定的结局。",
      grid: [3, 1],
      layout: [[1, 1], [2, 1], [3, 1]],
      positions: ["现状", "建议", "结果"],
      posDesc: [
        "现状：问题此刻的真实面貌",
        "建议：牌面给你的最优先行动方向",
        "结果：采纳建议后可能达成的结果"
      ]
    },
    {
      id: "cross5",
      label: "五牌阵 · 深入分析",
      en: "Deep Analysis",
      cat: "general",
      count: 5,
      desc: "现状 / 阻碍 / 力量 / 建议 / 结果",
      tip: "在十字架布局中层层剥开问题的核心。",
      detail: "先看现状与阻碍的对峙关系，再从「你的力量」中找出破局点，结合建议牌形成行动方案，最后用结果牌验证方向是否可行。",
      grid: [3, 2],
      layout: [[1, 1], [2, 1], [3, 1], [1, 2], [2, 2]],
      positions: ["现状", "阻碍", "你的力量", "建议", "可能结果"],
      posDesc: [
        "现状：问题此刻的客观情况",
        "阻碍：挡在你面前的主要困难",
        "你的力量：你可以依仗的内在优势",
        "建议：破局的行动指引",
        "可能结果：照此发展的大致走向"
      ]
    },
    {
      id: "horseshoe",
      label: "马蹄铁牌阵",
      en: "Horseshoe",
      cat: "general",
      count: 7,
      desc: "七张牌沿马蹄铁弧线展开",
      tip: "七张牌沿 V 字马蹄弧线展开，顶端的牌是解读重心。",
      detail: "马蹄铁在西方寓意「接住好运」。七张牌沿 V 字弧线排列：从左下角（过去）出发，沿弧线爬升越过顶端（阻碍），再下滑到右下角（结果）。顶端一张处于弧线最高点，是整个牌阵的解读重心；留意第三张「隐藏因素」，它常指出被忽略的关键。",
      grid: [3, 4],
      layout: [[1, 4], [1, 3], [1, 2], [2, 1], [3, 2], [3, 3], [3, 4]],
      positions: ["过去", "现在", "隐藏因素", "阻碍", "助力", "建议", "最终结果"],
      posDesc: [
        "过去：事情的起点与已有铺垫",
        "现在：眼下的局面与心境",
        "隐藏因素：你尚未察觉却影响深远的力量",
        "阻碍：需要正面应对的困难",
        "助力：可以借力的外部支持",
        "建议：当下最明智的做法",
        "最终结果：综合所有因素后的走向"
      ]
    },
    {
      id: "celtic",
      label: "凯尔特十字（十张）",
      en: "Celtic Cross",
      cat: "general",
      count: 10,
      desc: "塔罗最经典的综合牌阵",
      tip: "十字为核心、右侧立柱为时间线，最全面的解读。",
      detail: "解读顺序：先读中心十字（1-6）理解问题本质——第 1 张是核心，第 2 张横放如「绊脚石或垫脚石」压在其上；再看右侧立柱（7-10）从下往上读，代表从内心到结果的时间推进。第 9 张「希望与恐惧」常揭示你真正的心理症结。",
      grid: [4, 4],
      layout: [[2, 2], [2, 2, 1], [2, 1], [2, 3], [1, 2], [3, 2], [4, 4], [4, 3], [4, 2], [4, 1]],
      positions: [
        "现况", "核心阻碍", "意识目标", "潜意识根基", "近过去",
        "近未来", "你的状态", "外界环境", "希望与恐惧", "最终结果"
      ],
      posDesc: [
        "现况：问题的核心，此刻最真实的状态",
        "核心阻碍：横压在核心牌上，可能是绊脚石也可能是助力",
        "意识目标：你明确想要达成的理想",
        "潜意识根基：深埋心底、连自己都未察觉的根源",
        "近过去：刚刚过去、仍在影响现在的事",
        "近未来：即将到来的趋势",
        "你的状态：你自身的心态与应对姿态",
        "外界环境：周遭他人与环境的影响",
        "希望与恐惧：你内心真正的渴望与担忧",
        "最终结果：所有因素汇聚后的终点"
      ]
    },
    {
      id: "hexagram",
      label: "六芒星牌阵",
      en: "Hexagram",
      cat: "general",
      count: 7,
      desc: "六芒星型，正逆两个三角互相呼应",
      tip: "上方三角看时间线，下方三角看对策。",
      detail: "六芒星由一正一反两个三角形交叠组成：前三张摆成倒三角（1 过去、2 现在、3 未来），解读时间线；后三张摆成正三角（4 行动、5 阻碍、6 助力），分析对策；中央第 7 张是两个三角的交点，汇总一切给出结果。若时间线凶而对策面吉，说明事在人为。",
      grid: [3, 4],
      layout: [[1, 2], [3, 2], [2, 4], [2, 1], [1, 3], [3, 3], [2, 2]],
      positions: ["过去", "现在", "未来", "行动", "阻碍", "助力", "结果"],
      posDesc: [
        "过去：事情的缘起",
        "现在：当前局面",
        "未来：自然走向",
        "行动：建议采取的措施",
        "阻碍：需要化解的阻力",
        "助力：可供借势的资源",
        "结果：中央汇聚的综合答案"
      ]
    },
    {
      id: "zodiac12",
      label: "黄道十二宫（十二张）",
      en: "Zodiac Spread",
      cat: "general",
      count: 12,
      desc: "十二张牌环列，对应十二宫位",
      tip: "需占星基础的进阶牌阵，全面扫描人生各领域。",
      detail: "十二张牌呈环形排布，对应占星十二宫。解读时先评估与问题最相关的宫位，再考虑宫位间的传统关联：第一、五、九宫为一组（自我与拓展），第二、六、十宫为一组（现实与事业），第三、七、十一宫及第四、八、十二宫亦互有联系。最后综合全盘信息给出建议。",
      grid: [4, 4],
      layout: [[2, 1], [3, 1], [4, 1], [4, 2], [4, 3], [4, 4], [3, 4], [2, 4], [1, 4], [1, 3], [1, 2], [1, 1]],
      positions: [
        "第一宫", "第二宫", "第三宫", "第四宫", "第五宫", "第六宫",
        "第七宫", "第八宫", "第九宫", "第十宫", "第十一宫", "第十二宫"
      ],
      posDesc: [
        "第一宫：事物本质、个人因素、外貌",
        "第二宫：物质基础、财务状况、价值观",
        "第三宫：沟通、学习、表达能力",
        "第四宫：根源、家庭、本地事务",
        "第五宫：玩乐、恋爱、自我表现",
        "第六宫：劳动、工作、健康",
        "第七宫：婚姻、合作、人际关系",
        "第八宫：共有财务、投资、深层欲望",
        "第九宫：目标、信念、远方事务",
        "第十宫：对外形象、地位、事业",
        "第十一宫：朋友、群体、理想",
        "第十二宫：小人、隐藏事物、心理层面"
      ]
    },

    /* ---- 感情 ---- */
    {
      id: "love5",
      label: "关系牌阵 · 双人",
      en: "Relationship",
      cat: "love",
      count: 5,
      desc: "你 / 对方 / 关系现状 / 阻碍 / 发展",
      tip: "看清两个人各自的心意与这段关系真正的课题。",
      detail: "左右对称的布局：上方两张分别代表你和对方的心意，中央是关系本身，下方拆解阻碍与走向。解读时先对比两边心意牌的落差，再看中央的关系现状是被拉近还是被推远。",
      grid: [3, 2],
      layout: [[1, 1], [3, 1], [2, 1], [1, 2], [3, 2]],
      positions: ["你的心意", "对方的心意", "关系现状", "关系阻碍", "发展走向"],
      posDesc: [
        "你的心意：你在这段关系里的真实感受",
        "对方的心意：对方对这段关系的真实态度",
        "关系现状：两人关系此刻的样子",
        "关系阻碍：横在你们之间的主要问题",
        "发展走向：若维持现状，关系的走向"
      ]
    },
    {
      id: "venus8",
      label: "维纳斯之爱（八张）",
      en: "Venus of Love",
      cat: "love",
      count: 8,
      desc: "结构复杂而细腻的爱情占卜牌阵",
      tip: "双方视角层层对照，看清彼此的影响与未来。",
      detail: "以维纳斯（金星）之名排列的爱情牌阵：上方三角看当下——两人各自的看法与相互的影响；下方看走向——障碍、双方此后的心态与最终结果。解读时重点对照 1/2（看法）与 6/7（此后的看法）的变化，若由好转坏需警惕，由坏转好则值得经营。",
      grid: [3, 5],
      layout: [[1, 2], [3, 2], [2, 1], [2, 2], [2, 3], [2, 4], [1, 3], [3, 3]],
      positions: [
        "当事人的看法", "对方的心态", "当事人的影响", "对方的影响",
        "障碍", "当事人以后的看法", "对方以后的看法", "结果"
      ],
      posDesc: [
        "当事人的看法：求问者对这段感情的态度",
        "对方的心态：另一方对这段感情的态度",
        "当事人的影响：求问者给关系带来的影响",
        "对方的影响：另一方给关系带来的影响",
        "障碍：感情中需要跨越的阻碍",
        "当事人以后的看法：此后求问者的心态变化",
        "对方以后的看法：此后另一方的心态变化",
        "结果：这段感情最终的方向"
      ]
    },
    {
      id: "love7",
      label: "恋爱深度牌阵",
      en: "Love Deep Dive",
      cat: "love",
      count: 7,
      desc: "已在关系中的深度梳理",
      tip: "明确区分「该做」与「不该做」，直指关系症结。",
      detail: "适合已有感情基础但遇到瓶颈的关系。第 5、6 张的对比是牌阵精华——「该做的」与「不该做的」一正一反给出行动清单。解读时结合「潜藏问题」找出矛盾真正的来源。",
      grid: [4, 2],
      layout: [[1, 1], [2, 1], [3, 1], [4, 1], [1, 2], [2, 2], [3, 2]],
      positions: ["心动之处", "你愿付出", "潜藏问题", "将面对", "该做的事", "不该做", "结局"],
      posDesc: [
        "心动之处：这段感情最打动你的地方",
        "你愿付出：你愿意为关系付出的部分",
        "潜藏问题：尚未浮出水面的隐患",
        "将面对：接下来要共同面对的课题",
        "该做的事：明确建议去做的行动",
        "不该做：需要克制与避免的行为",
        "结局：综合行动后的感情归宿"
      ]
    },
    {
      id: "choice5",
      label: "二选一牌阵",
      en: "Two Paths",
      cat: "love",
      count: 5,
      desc: "站在岔路口时使用",
      tip: "把两条路都摊开来看，左右对称比较。",
      detail: "顶端是你现在所处的位置，左右两条分支分别是选项 A 与选项 B 的走向和结果。解读时不要只看结果好坏——「走向」牌揭示路上的体验，有时辛苦的路反而通向更好的终点。",
      grid: [3, 3],
      layout: [[2, 1], [1, 2], [1, 3], [3, 2], [3, 3]],
      positions: ["现在处境", "选择A 的走向", "选择A 的结果", "选择B 的走向", "选择B 的结果"],
      posDesc: [
        "现在处境：你此刻站在怎样的岔路口",
        "选择A 的走向：选 A 将经历的过程",
        "选择A 的结果：选 A 可能抵达的终点",
        "选择B 的走向：选 B 将经历的过程",
        "选择B 的结果：选 B 可能抵达的终点"
      ]
    },

    /* ---- 事业 ---- */
    {
      id: "career5",
      label: "事业牌阵",
      en: "Career",
      cat: "career",
      count: 5,
      desc: "换工作、升职、创业前的一次全面体检",
      tip: "从目标到行动的完整决策链。",
      detail: "顶端是事业目标，中间左右对比你的优势与外部阻碍，下方给出行动与前景。解读时重点看「优势」与「阻碍」的力量对比，判断时机是否成熟。",
      grid: [3, 2],
      layout: [[2, 1], [1, 1], [3, 1], [1, 2], [2, 2]],
      positions: ["事业目标", "你的优势", "当前阻碍", "应采取的行动", "发展前景"],
      posDesc: [
        "事业目标：你追求的方向是否清晰",
        "你的优势：手中的牌与可用的资本",
        "当前阻碍：事业路上的现实阻力",
        "应采取的行动：当下最该做的事",
        "发展前景：坚持下去可能达成的格局"
      ]
    },
    {
      id: "wealth4",
      label: "四元素财富阵",
      en: "Four Elements",
      cat: "career",
      count: 4,
      desc: "用四元素分解财务状况",
      tip: "找出火土风水四项中失衡的那一环。",
      detail: "火主行动与冲劲，土主积蓄与资源，风主信息与判断，水主心态与欲望。解读时找出唯一失衡的元素——它就是你财务问题的根源。四张都旺固然好，但通常只需补足最弱的一项。",
      grid: [2, 2],
      layout: [[1, 1], [2, 1], [1, 2], [2, 2]],
      positions: ["火 · 行动力", "土 · 资源基础", "风 · 信息与判断", "水 · 心态与情绪"],
      posDesc: [
        "火 · 行动力：赚钱的冲劲与执行力",
        "土 · 资源基础：现有的积蓄与资产",
        "风 · 信息与判断：财商认知与决策力",
        "水 · 心态与情绪：对金钱的欲望与安全感"
      ]
    },

    /* ---- 学业 ---- */
    {
      id: "study4",
      label: "学业牌阵",
      en: "Study",
      cat: "study",
      count: 4,
      desc: "考前或学习方法调整时使用",
      tip: "基础、瓶颈、方法、预期四步诊断。",
      detail: "四张牌构成一条诊断链：先看基础是否扎实，再正视瓶颈的真实原因，对症开出方法牌，最后给出预期。若方法牌与瓶颈牌呼应，说明方向找对了。",
      grid: [2, 2],
      layout: [[1, 1], [2, 1], [1, 2], [2, 2]],
      positions: ["当前基础", "遇到瓶颈", "有效方法", "预期成果"],
      posDesc: [
        "当前基础：已掌握的部分与真实水平",
        "遇到瓶颈：卡住你的具体问题",
        "有效方法：最适合自己的突破方式",
        "预期成果：坚持后可期待的成绩"
      ]
    },

    /* ---- 自我成长 ---- */
    {
      id: "tree10",
      label: "生命之树（十张）",
      en: "Tree of Life",
      cat: "self",
      count: 10,
      desc: "十个质点对应生命不同层次",
      tip: "最深邃的自我探索牌阵，适合年度回顾。",
      detail: "源自卡巴拉生命之树的十个质点，从顶点的「王冠」到底端的「王国」纵贯灵性与现实。解读时自上而下读：理想如何，落到现实又如何；中间的「严厉」与「慈悲」一对张力常揭示内心的冲突。",
      grid: [3, 5],
      layout: [[2, 1], [3, 2], [1, 2], [3, 3], [1, 3], [2, 3], [3, 4], [1, 4], [2, 4], [2, 5]],
      positions: [
        "王冠 · 最高理想", "智慧 · 灵感", "理解 · 内在秩序", "慈悲 · 力量",
        "严厉 · 挑战", "美 · 平衡", "永恒 · 规律", "荣耀 · 行动",
        "根基 · 潜藏动力", "王国 · 现实落地"
      ],
      posDesc: [
        "王冠：你的最高理想与使命",
        "智慧：内在的灵感与洞见",
        "理解：消化经验、建立秩序的能力",
        "慈悲：向外给予的力量与包容",
        "严厉：需要直面的挑战与节制",
        "美：全盘的平衡点与核心状态",
        "永恒：内心遵循的规律与信念",
        "荣耀：真实的行动力与表达",
        "根基：潜藏的驱动与本能",
        "王国：一切最终落地呈现的现实"
      ]
    },
    {
      id: "nine9",
      label: "九宫格阵",
      en: "Nine Grid",
      cat: "self",
      count: 9,
      desc: "3×3 全方位扫描",
      tip: "从九个角度审视同一问题，适合心绪复杂时。",
      detail: "中央「问题核心」是全阵的锚点，四周八张分别从外界、自身、时间与表里等角度包裹它。解读时先定核心，再逐圈向外展开，最后以右下角「最终答案」收束。",
      grid: [3, 3],
      layout: [
        [1, 1], [2, 1], [3, 1],
        [1, 2], [2, 2], [3, 2],
        [1, 3], [2, 3], [3, 3]
      ],
      positions: [
        "外界影响", "你的动机", "可能结果",
        "近期事件", "问题核心", "你的态度",
        "隐藏因素", "你的期待", "最终答案"
      ],
      posDesc: [
        "外界影响：环境与他人施加的作用",
        "你的动机：驱动这件事的内在愿望",
        "可能结果：顺势发展的走向",
        "近期事件：与问题相关的近况",
        "问题核心：整件事最本质的关键",
        "你的态度：你面对它的真实姿态",
        "隐藏因素：暗处影响局势的变量",
        "你的期待：你真正希望发生的事",
        "最终答案：九宫汇聚后的综合结论"
      ]
    },
    {
      id: "moon3",
      label: "月相牌阵",
      en: "Moon Phases",
      cat: "self",
      count: 3,
      desc: "新月 / 满月 / 残月",
      tip: "配合一个自然月周期使用，看清什么该放下。",
      detail: "以月亮盈亏为时间框架：新月播种、满月显化、残月放下。适合月初抽取，月底回看验证。第三张「该放下的」是牌阵重点——舍才有得。",
      grid: [3, 1],
      layout: [[1, 1], [2, 1], [3, 1]],
      positions: ["新月 · 该播种的", "满月 · 正显化的", "残月 · 该放下的"],
      posDesc: [
        "新月：本月值得开始与投入的新事物",
        "满月：正在显化、将要看见成果的部分",
        "残月：应该放下、释怀后才能轻装前进的包袱"
      ]
    },
    {
      id: "yesno3",
      label: "是非牌阵",
      en: "Yes / No",
      cat: "self",
      count: 3,
      desc: "支持 / 阻挡 / 答案倾向",
      tip: "面对封闭式问题时，看三张牌的总体倾向。",
      detail: "左右两张是「助力 vs 阻力」的天平两端，中央牌给出答案倾向。正位牌多、助力强则为「是」；逆位牌多、阻碍重则为「否」。若力量均衡，说明时机未到，建议换个问法。",
      grid: [3, 1],
      layout: [[1, 1], [2, 1], [3, 1]],
      positions: ["支持的力量", "阻挡的力量", "答案倾向"],
      posDesc: [
        "支持的力量：推动你「去做」的能量",
        "阻挡的力量：拉住你「缓一缓」的能量",
        "答案倾向：综合天平后的总体回答"
      ]
    }
  ];


  const SPREAD_CATS = [
    { id: "all", label: "全部" },
    { id: "general", label: "通用" },
    { id: "love", label: "感情" },
    { id: "career", label: "事业" },
    { id: "study", label: "学业" },
    { id: "self", label: "自我" }
  ];

  // 按 id 快速取牌阵
  function getSpreadById(id) {
    return SPREADS.find((s) => s.id === id) || SPREADS[0];
  }

  /* ---------------- 牌组（卡面皮肤） ----------------
     dir  = cards 下的子目录名
     每套含完整 78 张，文件名与 data.js 的 img 字段一致
  ---------------------------------------------------- */
  const DECKS = [
    {
      id: "waite",
      name: "韦特原版",
      tag: "经典",
      desc: "1909 年原版扫描，塔罗占卜的标准画风",
      dir: "cards/decks/waite",
      credit: "Public Domain"
    },
    {
      id: "waite720",
      name: "韦特高清",
      tag: "高清",
      desc: "同一副牌的高分辨率版，细节更清晰",
      dir: "cards/decks/waite720",
      credit: "Public Domain"
    },
    {
      id: "marseille",
      name: "马赛古董牌",
      tag: "复古",
      desc: "1650 年巴黎版，木刻彩绘的法国经典",
      dir: "cards/decks/marseille",
      credit: "Public Domain"
    },
    {
      id: "solabusca",
      name: "Sola Busca",
      tag: "艺术",
      desc: "1491 年意大利文艺复兴，最早的全图塔罗",
      dir: "cards/decks/solabusca",
      credit: "Public Domain"
    },
    {
      id: "visconti",
      name: "Visconti-Sforza",
      tag: "华丽",
      desc: "1450 年米兰手绘鎏金，贵族气派",
      dir: "cards/decks/visconti",
      credit: "Public Domain"
    },
    {
      id: "vieville",
      name: "Viéville",
      tag: "稀有",
      desc: "1650 年法国最早版式，构图古朴罕见",
      dir: "cards/decks/vieville",
      credit: "Public Domain"
    },
    {
      id: "soimoi",
      name: "Soimoi 现代",
      tag: "现代",
      desc: "现代插画风，色彩明快温暖",
      dir: "cards/decks/soimoi",
      credit: "CC BY 4.0"
    },
    {
      id: "tarot-nouveau",
      name: "新艺术塔罗",
      tag: "艺术",
      desc: "19 世纪比利时新艺术风格，配色明丽、线条优雅的原创卡面",
      dir: "cards/decks/tarot-nouveau",
      credit: "Public Domain"
    },
    {
      id: "rider-waite",
      name: "韦特标准插图",
      tag: "经典",
      desc: "Pamela Coleman Smith 原画扫描，线条明快的标准韦特版（小阿尔克那为标准塔罗花色）",
      dir: "cards/decks/rider-waite",
      credit: "Public Domain"
    }
  ];

  const DECK_KEY = "tarot_deck_v1";
  const STORAGE_KEY = "tarot_history_v1";
  /* 未完成的抽牌草稿：付款跳转后回到主站时恢复牌面，避免用户重抽 */
  const DRAFT_KEY = "tarot_draft_v1";
  /* 当前所在栏目：付款跳转回来后要回到同一页，而不是一律回抽牌页 */
  const TAB_KEY = "tarot_tab_v1";
  /* 登录态：{ token, user } */
  const AUTH_KEY = "tarot_auth_v1";
  /* 游客态的测评结果记录（登录后走服务端） */
  const QUIZ_HIST_KEY = "tarot_quiz_hist_v1";

  /* 各牌组原件缺口（文件名 -> 中文名）。这些牌会借用韦特版同名牌面。
     数据来源：mixvlad/TarotCards 仓库中该套牌实际存在的文件列表。 */
  const MISSING = {
    visconti: [
      "devil", "tower", "king-of-cups", "three-of-swords",
      "ten-of-pentacles", "knight-of-pentacles"
    ]
  };
  const CARD_CN = {
    devil: "恶魔", tower: "高塔", "king-of-cups": "圣杯国王",
    "three-of-swords": "宝剑三", "ten-of-pentacles": "星币十",
    "knight-of-pentacles": "星币骑士"
  };

  let currentDeck = DECKS[0];

  function getDeckById(id) {
    return DECKS.find((d) => d.id === id) || DECKS[0];
  }

  /* 把 data.js 里的相对路径转成当前牌组的真实路径
     所有牌组统一放在 cards/decks/<id>/ 下，扩展名 .jpg */
  function imgPath(cardImg) {
    return pathFor(currentDeck, cardImg);
  }

  /* ============================================================
     牌组（卡面皮肤）
     ============================================================ */
  const PREVIEW_IDS = [0, 19, 6, 21]; // 愚者 / 太阳 / 恋人 / 世界

  /* 某些古董牌组（如 Visconti-Sforza）原件已散佚，缺几张。
     缺牌时按以下顺序借用其它牌组的同名牌，保证 78 张永远都能出图。 */
  const FALLBACK_DIRS = ["cards/decks/waite720", "cards/decks/waite", "cards/decks/solabusca"];

  /* 记录当前牌组缺失、已回退到借用图的文件名，用于给用户一句提示 */
  const borrowedFiles = {};
  let borrowedTold = {};

  function pathFor(deck, cardImg) {
    const f = cardImg.replace(/^cards\//, "").replace(/\.png$/, ".jpg");
    // 用 <img onerror> 做回退（见 cardHTML / deckPreview），此处只返回首选路径
    return deck.dir + "/" + f;
  }

  /* 预加载：把图提前喂进浏览器缓存，避免抽牌/翻牌时图案才“弹出” */
  const _preloaded = new Set();
  function preload(src) {
    if (!src || _preloaded.has(src)) return;
    _preloaded.add(src);
    const im = new Image();
    im.decoding = "async";
    im.src = src;
    // 关键：把解码也提前做完。只设 src 只是进了 HTTP/内存缓存，
    // 首次绘制时仍要在主线程解码一张 400×700 的图 —— 那一下正好落在翻牌动画里，就是卡顿的来源。
    if (im.decode) im.decode().catch(function () {});
  }
  function preloadGengarBack() {
    const m = /src="([^"]+)"/.exec(window.GengarBack || "");
    if (m) preload(m[1]);
  }
  function preloadDrawn(list) {
    if (!currentDeck) return;
    list.forEach((d) => {
      if (d && d.card && d.card.img) preload(pathFor(currentDeck, d.card.img));
    });
  }

  /* 生成 <img> 的 onerror 回退链：首选 -> 各个 fallback 目录 -> 隐藏 */
  function fallbackChain(deck, cardImg) {
    const f = cardImg.replace(/^cards\//, "").replace(/\.png$/, ".jpg");
    const list = [deck.dir + "/" + f];
    FALLBACK_DIRS.forEach((d) => {
      if (d !== deck.dir) list.push(d + "/" + f);
    });
    return list;
  }

  function imgTag(deck, cardImg, cls, alt) {
    const chain = fallbackChain(deck, cardImg);
    const f = cardImg.replace(/^cards\//, "").replace(/\.png$/, ".jpg");
    return (
      '<img class="' + cls + '" src="' + esc(chain[0]) + '"' +
      ' data-fb="' + esc(chain.slice(1).join("|")) + '"' +
      ' data-file="' + esc(f) + '"' +
      ' onerror="window.__tarotFb && window.__tarotFb(this)"' +
      ' alt="' + esc(alt) + '" loading="lazy" decoding="async" draggable="false">'
    );
  }

  /* 缺牌回退：按 data-fb 里的候选路径依次尝试，全部失败则标记 class="img-miss" */
  window.__tarotFb = function (img) {
    const fb = img.getAttribute("data-fb");
    if (!fb) {
      img.classList.add("img-miss");
      return;
    }
    const arr = fb.split("|");
    const next = arr.shift();
    img.setAttribute("data-fb", arr.join("|"));
    if (arr.length === 0) img.setAttribute("data-fb", "");
    img.src = next;
    // 记录借用，稍后提示用户
    const f = img.getAttribute("data-file");
    if (f) borrowedFiles[f] = true;
  };

  function renderDecks() {
    const wrap = $("#deckGrid");
    if (!wrap) return;
    wrap.innerHTML = DECKS.map((d) => {
      const active = d.id === currentDeck.id;
      const thumbs = PREVIEW_IDS.map(
        (i) => imgTag(d, TAROT_DATA[i].img, "", TAROT_DATA[i].name)
      ).join("");
      return (
        '<button class="deck-card' + (active ? " active" : "") +
          '" data-deck="' + d.id + '">' +
          '<div class="deck-thumb">' + thumbs + "</div>" +
          '<div class="deck-meta">' +
            '<div class="deck-name-row">' +
              '<span class="deck-name">' + esc(d.name) + "</span>" +
              '<span class="deck-tag">' + esc(d.tag) + "</span>" +
            "</div>" +
            '<p class="deck-desc">' + esc(d.desc) + "</p>" +
            '<span class="deck-credit">' + esc(d.credit) + "</span>" +
          "</div>" +
          (active ? '<span class="deck-check">✦ 使用中</span>' : "") +
        "</button>"
      );
    }).join("");
    renderDeckPreview();
  }

  // 当前牌组：大图预览（愚者 / 女祭司 / 恋人 / 死神 / 太阳 / 世界）
  const BIG_PREVIEW = [0, 2, 6, 13, 19, 21];
  function renderDeckPreview() {
    const row = $("#deckPreviewRow");
    if (!row) return;
    const title = $("#deckPreviewName");
    if (title) title.textContent = currentDeck.name;
    row.innerHTML = BIG_PREVIEW.map((i) => {
      const c = TAROT_DATA[i];
      return (
        '<figure class="dpb-item">' +
          imgTag(currentDeck, c.img, "", c.name) +
          "<figcaption>" + esc(c.name) + "</figcaption>" +
        "</figure>"
      );
    }).join("");

    // 有借用的牌面时给一句说明
    const note = $("#deckNote");
    if (note) {
      const miss = MISSING[currentDeck.id] || [];
      if (miss.length) {
        note.hidden = false;
        note.innerHTML =
          "ℹ️ 这套牌的原件有 " + miss.length +
          " 张已散佚或不存世，抽到时会自动借用韦特版同名牌面补足：" +
          esc(miss.map((f) => CARD_CN[f] || f).join("、")) + "。";
      } else {
        note.hidden = true;
        note.innerHTML = "";
      }
    }
  }

  function setDeck(id, opts) {
    opts = opts || {};
    const d = getDeckById(id);
    const changed = d.id !== currentDeck.id;
    currentDeck = d;
    try { localStorage.setItem(DECK_KEY, d.id); } catch (e) {}

    renderDecks();

    if (!opts.silent) {
      // 已翻开的牌即时换成新牌面（同时重建回退链）
      $$("#resultZone .card-photo").forEach((im) => {
        const slot = im.closest(".card-slot");
        if (!slot) return;
        const item = drawnCards[Number(slot.dataset.idx)];
        if (!item) return;
        const chain = fallbackChain(d, item.card.img);
        im.setAttribute("data-fb", chain.slice(1).join("|"));
        im.classList.remove("img-miss");
        im.src = chain[0];
      });
    }
    if (changed) {
      toast("已切换为「 " + d.name + " 」");
      borrowedTold = {}; // 换牌后允许再次提示缺牌
    }
  }

  function loadDeck() {
    let id = DECKS[0].id;
    try { id = localStorage.getItem(DECK_KEY) || id; } catch (e) {}
    currentDeck = getDeckById(id);
  }

  /* 轻提示 */
  let toastTimer = null;
  function toast(msg) {
    let el = $("#toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.className = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 1900);
  }

  /* ---------------- 状态 ---------------- */
  let currentSpread = SPREADS[0];   // 当前牌阵
  let currentCat = "all";           // 当前分类筛选
  let drawnCards = [];
  let isDrawing = false;
  let flipState = [];               // 每张牌是否已翻开
  let flipHintOn = false;           // 是否处于等待翻牌阶段
  let resetPoke = function () {};   // 由 initIntro 注入

  /* 手动抽牌（洗牌 → 扇形自己抽）状态 */
  let isPicking = false;            // 是否处于「用户自己抽牌」阶段
  let pickIndex = 0;                // 已抽出的张数
  let autoPickTimer = null;         // 「帮我抽完」定时器
  let autoPickAllMode = false;      // 「帮我抽完」模式：抽牌过程中保持页面不滚动，抽完再滚动展现牌阵
  let fanScrollTimer = null;        // startPicking 中「滚到扇形」的待执行定时器（自动模式可取消）
  let tableFitted = false;          // 「帮我抽完」同屏适配：#cardTable 是否正处于缩小状态
  let fitRound = 0;                 // 同屏适配代数：stopAutoPick 时自增，作废尚未触发的延迟出牌回调

  /* ============================================================
     工具
     ============================================================ */
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function pickRandom(n) {
    // 从 78 张中不重复抽取 n 张，并各判正逆位
    const pool = shuffle(TAROT_DATA).slice(0, n);
    return pool.map((card) => ({
      card: card,
      reversed: Math.random() < 0.4 // 逆位概率 40%
    }));
  }

  function esc(s) {
    const d = document.createElement("div");
    d.textContent = s == null ? "" : String(s);
    return d.innerHTML;
  }

  function fmtTime(ts) {
    const d = new Date(ts);
    const p = (n) => String(n).padStart(2, "0");
    return (
      d.getFullYear() +
      "-" + p(d.getMonth() + 1) +
      "-" + p(d.getDate()) +
      " " + p(d.getHours()) +
      ":" + p(d.getMinutes())
    );
  }

  const SUIT_CN = {
    major: "大阿卡纳",
    wands: "权杖",
    cups: "圣杯",
    swords: "宝剑",
    pentacles: "星币"
  };

  /* ============================================================
     卡牌 DOM
     ============================================================ */
  function cardHTML(item, posLabel, opts) {
    opts = opts || {};
    const c = item.card;
    const rev = item.reversed;
    const back = window.GengarBack || "";
    return (
      '<div class="card' + (rev ? " reversed" : "") + '" data-id="' + c.id + '">' +
        '<div class="card-face card-back">' + back + "</div>" +
        '<div class="card-face card-front">' +
          '<div class="card-art-wrap">' +
            imgTag(currentDeck, c.img, "card-photo", c.name) +
          "</div>" +
          '<div class="card-caption">' +
            '<div class="card-name">' + esc(c.name) + "</div>" +
            '<div class="card-en">' + esc(c.en) + "</div>" +
            '<div class="card-orient ' + (rev ? "rev" : "up") + '">' +
              (rev ? "逆位" : "正位") +
            "</div>" +
          "</div>" +
        "</div>" +
      "</div>"
    );
  }

  /* ============================================================
     牌阵选择器
     ============================================================ */
  function renderSpreadCats() {
    const wrap = $("#spCats");
    if (!wrap) return;
    wrap.innerHTML = SPREAD_CATS.map(
      (c) =>
        '<button class="sp-cat' + (c.id === currentCat ? " active" : "") +
        '" data-cat="' + c.id + '">' + esc(c.label) + "</button>"
    ).join("");
  }

  function renderSpreadList() {
    const wrap = $("#spScroll");
    if (!wrap) return;
    const list = currentCat === "all"
      ? SPREADS
      : SPREADS.filter((s) => s.cat === currentCat);

    wrap.innerHTML = list
      .map(
        (s) =>
          '<button class="sp-item' + (s.id === currentSpread.id ? " active" : "") +
            '" data-spread="' + s.id + '">' +
            '<span class="sp-item-top">' +
              '<span class="sp-item-name">' + esc(s.label) + "</span>" +
              '<span class="sp-item-count">' + s.count + " 张</span>" +
            "</span>" +
            '<span class="sp-item-desc">' + esc(s.desc) + "</span>" +
          "</button>"
      )
      .join("");
  }

  /* 牌阵布局预览（小格子） */
  function renderSpreadPreview() {
    const wrap = $("#spPreview");
    if (!wrap) return;
    const s = currentSpread;
    const cols = s.grid[0];
    const rows = s.grid[1];
    // 多牌阵用小格子
    const compact = s.count > 6;
    const cellW = compact ? 20 : 26;
    const cellH = compact ? 29 : 38;
    const gap = compact ? 5 : 7;

    wrap.style.width = cols * cellW + (cols - 1) * gap + "px";
    wrap.style.height = rows * cellH + (rows - 1) * gap + "px";

    const used = {}; // 记录已占用的格子 → 叠放偏移
    wrap.innerHTML = s.layout
      .map((p, i) => {
        const rot = p[2] ? 1 : 0;
        const key = p[0] + "," + p[1];
        const stack = used[key] || 0;
        used[key] = stack + 1;
        const offX = stack * 5;
        const offY = stack * 12;
        const left = (p[0] - 1) * (cellW + gap) + offX;
        const top = (p[1] - 1) * (cellH + gap) + offY;
        return (
          '<i class="sp-cell' + (rot ? " rot" : "") +
          '" style="left:' + left + "px;top:" + top +
          "px;width:" + cellW + "px;height:" + cellH +
          "px;animation-delay:" + i * 45 + 'ms">' + (i + 1) + "</i>"
        );
      })
      .join("");
  }

  /* 牌阵详细说明：解读方法 + 各位置含义 */
  function renderSpreadPositions() {
    const wrap = $("#spPositions");
    if (!wrap) return;
    const s = currentSpread;
    let html = "";
    if (s.detail) {
      html += '<div class="sp-detail">' + esc(s.detail) + "</div>";
    }
    if (s.posDesc && s.posDesc.length) {
      html += '<div class="sp-pos-title">各 位 置 含 义</div>';
      html += '<ul class="sp-pos-list">' +
        s.posDesc.map((d, i) => {
          // 冒号前为位置名，若与 positions 重复则只显示一次
          const ci = d.indexOf("：");
          const name = ci > 0 ? d.slice(0, ci) : "";
          const body = ci > 0 ? d.slice(ci + 1) : d;
          const label = s.positions[i] && name && s.positions[i] !== name
            ? name
            : (s.positions[i] || "牌 " + (i + 1));
          return (
            '<li style="animation-delay:' + (i * 40 + 100) + 'ms">' +
              '<b>' + (i + 1) + '</b><span class="sp-pos-name">' + esc(label) + "</span>" +
              '<span class="sp-pos-body">' + esc(body) + "</span>" +
            "</li>"
          );
        }).join("") + "</ul>";
    }
    wrap.innerHTML = html;
  }

  function setSpread(id) {
    if (isDrawing) return;
    currentSpread = getSpreadById(id);
    $$(".sp-item").forEach((b) =>
      b.classList.toggle("active", b.dataset.spread === currentSpread.id)
    );
    $("#spreadText").textContent =
      currentSpread.label + " —— " + currentSpread.positions.join(" · ");
    $("#drawHint").textContent = currentSpread.tip || "";
    renderSpreadPreview();
    renderSpreadPositions();
    resetTable();
  }

  function resetTable() {
    stopAutoPick();
    restoreTableScale();          // 重置时一并撤销同屏适配缩放，避免牌桌保持缩小
    $("#deckZone").hidden = false;
    $("#deck").hidden = false;
    $("#deck").classList.remove("shuffling");
    const _riffle = $("#deck .riffle");
    if (_riffle) _riffle.remove();
    const _tip = $("#deckTip");
    if (_tip) _tip.hidden = false;
    const _fanZone = $("#fanZone");
    if (_fanZone) _fanZone.hidden = true;
    const _fan = $("#fan");
    if (_fan) _fan.innerHTML = "";
    const _fanTip = $("#fanTip");
    if (_fanTip) _fanTip.hidden = true;
    const _autoBtn = $("#autoPickBtn");
    if (_autoBtn) _autoBtn.hidden = true;
    isPicking = false;
    pickIndex = 0;
    $("#resultZone").innerHTML = "";
    $("#resultZone").style.cssText = "";
    $("#resultZone").classList.remove("compact");
    $("#reading").innerHTML = "";
    $("#reading").classList.remove("ready");
    hideAi();
    $("#drawBtn").disabled = false;
    $("#drawBtnText").textContent = "开始抽牌";
    $("#resetBtn").hidden = true;
    $("#flipHint").hidden = true;
    $("#flipAllBtn").hidden = true;
    flipHintOn = false;
    flipState = [];
    drawnCards = [];
    isDrawing = false;
    // 注意：这里不直接清草稿。初始化时 setSpread→resetTable 也会走到这里，
    // 若在此清除，付款回跳后就再也恢复不了牌面。真正的清除在 doDraw 里做。
  }

  /* ---------------- 抽牌草稿（用于支付跳转后恢复） ---------------- */
  function saveDraft() {
    if (!drawnCards.length) return;
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          spreadId: currentSpread.id,
          question: ($("#questionInput") && $("#questionInput").value.trim()) || "",
          aiQuestion: ($("#aiQuestion") && $("#aiQuestion").value.trim()) || "",
          cards: drawnCards.map((it) => ({ id: it.card.id, reversed: it.reversed })),
          flip: flipState.slice(),
          ts: Date.now(),
        })
      );
    } catch (e) {}
  }

  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
  }

  function readDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const d = JSON.parse(raw);
      if (!d || !d.cards || !d.cards.length) return null;
      // 超过 2 小时的草稿视为过期
      if (Date.now() - (d.ts || 0) > 2 * 3600 * 1000) {
        clearDraft();
        return null;
      }
      return d;
    } catch (e) {
      return null;
    }
  }

  /* 把草稿还原到牌桌（支付回跳后调用） */
  function restoreDraft() {
    const d = readDraft();
    if (!d) return false;
    const byId = {};
    (TAROT_DATA || []).forEach((c) => { byId[c.id] = c; });
    const items = [];
    for (const x of d.cards) {
      const card = byId[x.id];
      if (!card) return false; // 数据不完整，放弃恢复
      items.push({ card: card, reversed: !!x.reversed });
    }
    // 还原牌阵
    if (d.spreadId) {
      const sp = getSpreadById(d.spreadId);
      if (sp) {
        currentSpread = sp;
        $$(".sp-item").forEach((b) =>
          b.classList.toggle("active", b.dataset.spread === currentSpread.id)
        );
        $("#spreadText").textContent =
          currentSpread.label + " —— " + currentSpread.positions.join(" · ");
        $("#drawHint").textContent = currentSpread.tip || "";
        renderSpreadPreview();
        renderSpreadPositions();
      }
    }
    if (d.question && $("#questionInput")) $("#questionInput").value = d.question;

    // 直接以「已全部翻开」的状态重建牌桌
    drawnCards = items;
    flipState = items.map(() => true);
    isDrawing = false;

    const s = currentSpread;
    $("#deckZone").hidden = true;
    const zone = $("#resultZone");
    const cols = s.grid[0];
    zone.style.display = "grid";
    zone.style.gridTemplateColumns = "repeat(" + cols + ", auto)";
    zone.style.gridTemplateRows = "repeat(" + s.grid[1] + ", auto)";
    zone.style.justifyItems = "center";
    zone.style.alignItems = "center";
    zone.style.justifyContent = "center";
    zone.style.gap = s.count > 6 ? "9px 10px" : "16px 14px";
    zone.style.width = "100%";

    const used = {};
    zone.innerHTML = items
      .map((it, i) => {
        const pos = s.positions[i] || "牌 " + (i + 1);
        const p = s.layout[i] || [((i % cols) + 1), (Math.floor(i / cols) + 1)];
        const rot = p[2] ? 1 : 0;
        const key = p[0] + "," + p[1];
        const stack = used[key] || 0;
        used[key] = stack + 1;
        const stacked = stack > 0;
        // 复用与正式抽牌同一个 cardHTML，保证结构完全一致
        // （含耿鬼牌背、位置标签、图片多路径回退）
        return (
          '<div class="card-slot' + (rot ? " lay-rot" : "") + (stacked ? " stacked" : "") +
            '" data-idx="' + i + '" ' +
            'style="grid-column:' + p[0] + ";grid-row:" + p[1] +
            ";z-index:" + (10 + stack) + '">' +
            cardHTML(it, pos) +
            '<div class="slot-label">' + esc(pos) + "</div>" +
          "</div>"
        );
      })
      .join("");
    zone.classList.toggle("compact", s.count > 6);

    // 全部置为「已翻开」状态：flipped 让 card-front 转正，is-rev 标记逆位。
    // 关掉过渡，避免恢复时看到一片牌同时翻转的动画。
    zone.querySelectorAll(".card").forEach((el, i) => {
      el.style.transition = "none";
      el.classList.add("flipped");
      if (items[i] && items[i].reversed) el.classList.add("is-rev");
    });

    renderReading(drawnCards);
    $("#reading").classList.add("ready");
    if (d.aiQuestion && $("#aiQuestion")) $("#aiQuestion").value = d.aiQuestion;
    showAi();
    $("#resetBtn").hidden = false;
    $("#drawBtnText").textContent = "重新抽牌";

    // 恢复后把视线带回到牌面，否则用户停在页面顶部会以为牌没了
    setTimeout(() => {
      const z = $("#resultZone");
      if (z) z.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
    return true;
  }

  /* ---------------- 翻牌 ---------------- */
  function updateFlipProgress() {
    const done = flipState.filter(Boolean).length;
    const total = drawnCards.length;
    $("#flipCount").textContent = done + " / " + total;
    if (done >= total) {
      $("#flipHint").hidden = true;
      $("#flipAllBtn").hidden = true;
      flipHintOn = false;
      // 全部翻开后才显示解读
      renderReading(drawnCards);
      saveHistory(drawnCards);
      saveDraft();
      $("#reading").scrollIntoView({ behavior: "smooth", block: "start" });
      showAi();
    }
  }

  function flipCard(el, idx) {
    if (!el || flipState[idx]) return;
    flipState[idx] = true;
    el.classList.add("flipped");
    // 移除待点提示（locked 在 card-slot 上）
    const slot = el.closest(".card-slot");
    if (slot) slot.classList.remove("locked");
    if (drawnCards[idx].reversed) el.classList.add("is-rev");
    // 翻开时冒金光粒子
    sparkAt(el);
    if (navigator.vibrate) navigator.vibrate(12);
    // updateFlipProgress 在「最后一张」时会顺手生成整段解读 HTML + 平滑滚动，
    // 那是几十毫秒的活。若同步执行，正好卡在翻牌动画起步的第一帧上，看起来就是「顿一下」。
    // 推后 90ms：动画已经跑起来了，计数器晚一瞬更新肉眼也看不出来。
    setTimeout(updateFlipProgress, 90);
  }

  /* 翻开瞬间的粒子 */
  function sparkAt(el) {
    const slot = el.closest(".card-slot") || el.parentElement;
    if (!slot) return;
    for (let i = 0; i < 10; i++) {
      const sp = document.createElement("span");
      sp.className = "flip-spark";
      const a = (Math.PI * 2 * i) / 10 + Math.random() * 0.5;
      const d = 30 + Math.random() * 46;
      sp.style.setProperty("--dx", Math.cos(a) * d + "px");
      sp.style.setProperty("--dy", Math.sin(a) * d + "px");
      slot.appendChild(sp);
      setTimeout(() => sp.remove(), 760);
    }
  }

  function flipAll() {
    $$("#resultZone .card").forEach((el, i) => {
      setTimeout(() => flipCard(el, i), i * 130);
    });
  }

  /* ============================================================
     洗牌动画 + 手动抽牌（自己洗、自己抽）
     ============================================================ */

  /* 结果区网格布局（预置空位与正式牌面共用） */
  function layoutResultZone(zone, s) {
    const cols = s.grid[0];
    zone.style.display = "grid";
    zone.style.gridTemplateColumns = "repeat(" + cols + ", auto)";
    zone.style.gridTemplateRows = "repeat(" + s.grid[1] + ", auto)";
    zone.style.justifyItems = "center";
    zone.style.alignItems = "center";
    zone.style.justifyContent = "center";
    zone.style.gap = s.count > 6 ? "9px 10px" : "16px 14px";
    zone.style.width = "100%";
    zone.classList.toggle("compact", s.count > 6);
  }

  /* 逐个算出每个位置：{i,pos,p,rot,stacked,stack} */
  function spreadSlots(s) {
    const used = {};
    return s.layout.map((p0, i) => {
      const p = p0 || [((i % s.grid[0]) + 1), (Math.floor(i / s.grid[0]) + 1)];
      const rot = p[2] ? 1 : 0;
      const key = p[0] + "," + p[1];
      const stack = used[key] || 0;
      used[key] = stack + 1;
      return {
        i: i,
        pos: s.positions[i] || ("牌 " + (i + 1)),
        p: p, rot: rot, stack: stack, stacked: stack > 0
      };
    });
  }

  /* 空位：虚线幽灵卡，等用户抽牌落位 */
  function ghostSlotHTML(slot) {
    return (
      '<div class="card-slot empty' + (slot.rot ? " lay-rot" : "") +
        (slot.stacked ? " stacked" : "") + '" data-idx="' + slot.i + '" ' +
        'style="grid-column:' + slot.p[0] + ";grid-row:" + slot.p[1] +
        ";z-index:" + (10 + slot.stack) + '">' +
        '<div class="slot-ghost"></div>' +
        '<div class="slot-label">' + esc(slot.pos) + "</div>" +
      "</div>"
    );
  }

  /* 扇形牌堆：让用户一张张自己抽 */
  function buildFan() {
    const fan = $("#fan");
    if (!fan) return;
    const back = window.GengarBack || "";
    const N = 21;
    $("#fanZone").hidden = false;
    fan.innerHTML = new Array(N)
      .fill(0)
      .map((_, i) =>
        '<button class="fan-card" type="button" data-fan="' + i + '">' +
          '<span class="card-face card-back">' + back + "</span>" +
        "</button>"
      )
      .join("");
    const cards = $$(".fan-card", fan);
    cards.forEach((el) => { el.style.opacity = "0"; });

    const w = fan.clientWidth || $("#deckZone").clientWidth || 320;
    // 屏幕越窄，扇形角度越小，避免溢出
    const spanDeg = w < 300 ? 32 : (w < 340 ? 38 : 46);

    requestAnimationFrame(() => {
      cards.forEach((el, i) => {
        const t = N > 1 ? i / (N - 1) - 0.5 : 0;   // -0.5 .. 0.5
        const ang = t * spanDeg;                    // 以远端为轴心的扇形
        const base = "translateX(-50%) rotate(" + ang.toFixed(2) + "deg)";
        el.dataset.base = base;
        el.dataset.ang = ang.toFixed(2);
        el.style.zIndex = String(100 + i);
        el.style.transitionDelay = (i * 22) + "ms";
        el.style.transform = base;
        el.style.opacity = "1";
      });
    });
  }

  /* 洗牌动画：两叠完整牌背飞入 → 交错落下 → 收拢爆发 */
  /* 洗牌时迸发的星点（各洗牌方式共用） */
  function sparksHTML(cls) {
    let h = "";
    for (let i = 0; i < 16; i++) {
      h += '<s style="--a:' + (i * 22.5) + 'deg;--d:' + ((i % 4) * 45) + 'ms"></s>';
    }
    return '<div class="' + cls + '">' + h + "</div>";
  }

  /* 方式一：两叠交错 riffle（经典洗牌） */
  function riffleShuffle(deck, done) {
    const old = deck.querySelector(".riffle");
    if (old) old.remove();
    const back = window.GengarBack || "";
    const stage = document.createElement("div");
    stage.className = "riffle";
    const CNT = 7;                                  // 每叠张数
    const card = (i) => '<i class="rs" style="--i:' + i + '">' + back + "</i>";
    let html = '<div class="rs-glow"></div>';
    html += '<div class="rs-stack rs-l">';
    for (let i = 0; i < CNT; i++) html += card(i);
    html += "</div>";
    html += '<div class="rs-stack rs-r">';
    for (let i = 0; i < CNT; i++) html += card(i);
    html += "</div>";
    html += '<div class="riffle-burst"></div>';
    html += sparksHTML("riffle-sparks");
    stage.innerHTML = html;
    deck.appendChild(stage);
    deck.classList.add("fx-on");
    requestAnimationFrame(() => stage.classList.add("go"));
    setTimeout(() => {
      stage.remove();
      deck.classList.remove("fx-on");
      if (done) done();
    }, 2150);
  }

  /* 方式二：对切（牌堆分成两半交错再合拢） */
  function cutShuffle(deck, done) {
    const old = deck.querySelector(".shuf-cut");
    if (old) old.remove();
    const back = window.GengarBack || "";
    const stage = document.createElement("div");
    stage.className = "shuf-cut";
    stage.innerHTML =
      '<div class="rs-glow"></div>' +
      '<div class="cut-stack">' +
        '<i class="cut-half cut-b">' + back + "</i>" +
        '<i class="cut-half cut-a">' + back + "</i>" +
      "</div>" +
      sparksHTML("shuf-sparks");
    deck.appendChild(stage);
    deck.classList.add("fx-on");
    requestAnimationFrame(() => stage.classList.add("go"));
    setTimeout(() => {
      stage.remove();
      deck.classList.remove("fx-on");
      if (done) done();
    }, 2000);
  }

  /* 方式三：瀑布展牌（牌列左右铺开再收拢） */
  function cascadeShuffle(deck, done) {
    const old = deck.querySelector(".shuf-cascade");
    if (old) old.remove();
    const back = window.GengarBack || "";
    const N = 11;
    let cards = "";
    for (let i = 0; i < N; i++) cards += '<i class="cs" style="--i:' + i + '">' + back + "</i>";
    const stage = document.createElement("div");
    stage.className = "shuf-cascade";
    stage.innerHTML = '<div class="rs-glow"></div>' + cards + sparksHTML("shuf-sparks");
    deck.appendChild(stage);
    deck.classList.add("fx-on");
    requestAnimationFrame(() => stage.classList.add("go"));
    setTimeout(() => {
      stage.remove();
      deck.classList.remove("fx-on");
      if (done) done();
    }, 2050);
  }

  const SHUFFLE_FX = [riffleShuffle, cutShuffle, cascadeShuffle];

  /* 洗牌入口：每次随机挑一种方式，像真人每次洗法都不一样 */
  function runShuffleFx(deck, done) {
    const pick = SHUFFLE_FX[Math.floor(Math.random() * SHUFFLE_FX.length)];
    pick(deck, done);
  }

  /* 一张牌从扇形飞入空位
     - 起点：扇形卡的真实中心（旋转后 AABB 的中心=视觉中心）+ 未旋转布局尺寸（offset 不受 transform 影响）
     - 终点：虚线空位（.slot-ghost）的中心与尺寸——先取到目标中心做位移，
       再按 kx=空位宽/牌宽、ky=空位高/牌高 精确缩放，使飞牌终态与落位后的真实牌
       完全重合（中心与尺寸都对齐），彻底消除落位瞬间的跳变/错位。
     注：.fan-card 恒为 58×92、空位非紧凑态恒为 112×176，故 kx≈ky（≈1.93），
     缩放近乎等比，飞行中不会出现可见拉伸。 */
  function animateCardFly(fanEl, toEl, done) {
    const back = window.GengarBack || "";
    if (!fanEl || !toEl) { if (done) done(); return; }
    const r0 = fanEl.getBoundingClientRect();
    // 用视觉矩形（而非 offsetWidth）：牌桌被同屏适配缩小后，飞牌尺寸与扇形卡严格一致，起飞不跳变
    const sw = r0.width || fanEl.offsetWidth || 58;
    const sh = r0.height || fanEl.offsetHeight || 92;
    const cx0 = r0.left + r0.width / 2;
    const cy0 = r0.top + r0.height / 2;
    const tgt = toEl.querySelector(".slot-ghost") || toEl;
    const r1 = tgt.getBoundingClientRect();
    if (!r1.width) { if (done) done(); return; }
    const dx = (r1.left + r1.width / 2) - cx0;
    const dy = (r1.top + r1.height / 2) - cy0;
    const kx = r1.width / sw;   // 精确匹配空位宽/高，落位零跳变
    const ky = r1.height / sh;

    const fly = document.createElement("div");
    fly.className = "card fly-card";
    fly.innerHTML = '<div class="card-face card-back">' + back + "</div>";
    // 改用 absolute + 页面坐标：飞行途中若页面滚动，飞牌与空位一起滚动，落点不再漂移
    const sx = window.scrollX || window.pageXOffset || 0;
    const sy = window.scrollY || window.pageYOffset || 0;
    fly.style.left = (cx0 - sw / 2 + sx) + "px";
    fly.style.top = (cy0 - sh / 2 + sy) + "px";
    fly.style.width = sw + "px";
    fly.style.height = sh + "px";
    fly.style.transformOrigin = "center center";
    document.body.appendChild(fly);

    // 起飞时沿用扇形卡的倾角，飞行中旋正；起点与终点函数结构一致（translate/rotate/scale），
    // 浏览器可逐函数插值，过渡最平滑。
    const ang = parseFloat(fanEl.dataset.ang || "0");
    fly.style.transform = "translate(0px,0px) rotate(" + ang + "deg) scale(1,1)";
    void fly.offsetWidth; // 强制回流，确保起点被提交，过渡才会真正跑
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      fly.remove();
      if (done) done();
    };
    requestAnimationFrame(() => {
      fly.style.transition = "transform .56s cubic-bezier(.34,.85,.36,1)";
      fly.style.transform =
        "translate(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px) rotate(0deg) scale(" + kx.toFixed(3) + "," + ky.toFixed(3) + ")";
    });
    fly.addEventListener("transitionend", finish, { once: true });
    setTimeout(finish, 760);
  }

  /* 把抽到的牌填进对应空位（背面朝上，等用户翻开） */
  function fillSlot(slot, idx) {
    const it = drawnCards[idx];
    if (!it || !slot) return;
    const pos = currentSpread.positions[idx] || ("牌 " + (idx + 1));
    const ghost = slot.querySelector(".slot-ghost");
    if (ghost) {
      ghost.insertAdjacentHTML("beforebegin", cardHTML(it, pos));
      ghost.remove();
    } else {
      slot.insertAdjacentHTML("afterbegin", cardHTML(it, pos));
    }
    slot.classList.remove("empty");
    slot.classList.add("locked");
    const card = slot.querySelector(".card");
    if (card) sparkAt(card);
  }

  function updatePickProgress() {
    const left = Math.max(0, drawnCards.length - pickIndex);
    const fanTip = $("#fanTip");
    if (fanTip) {
      fanTip.textContent = left > 0
        ? "轻触牌堆抽牌 · 还需 " + left + " 张"
        : "抽满了，去翻开你的牌吧";
    }
    const autoBtn = $("#autoPickBtn");
    if (autoBtn) autoBtn.hidden = !(isPicking && left > 0 && !autoPickAllMode);
  }

  function drawFromFan(fanEl) {
    if (!isPicking || !fanEl) return;
    if (fanEl.classList.contains("picked")) return;
    if (pickIndex >= drawnCards.length) return;
    const idx = pickIndex;
    const slot = $('#resultZone .card-slot[data-idx="' + idx + '"]');
    if (!slot) return;
    pickIndex++;

    if (navigator.vibrate) navigator.vibrate(9);
    // 先启动飞牌（内部读取未变状态的真实位置），再把扇形卡隐藏，避免读到偏移后的矩形
    animateCardFly(fanEl, slot, () => {
      fillSlot(slot, idx);
      updatePickProgress();
      // 必须是「最后一张真正落位」才收尾：pickIndex 在最后一张起飞时就已满，
      // 若用它判断，会在最后几张还在飞时就去隐藏牌堆/滚动页面，导致落点错位。
      if (idx >= drawnCards.length - 1) finishPicking();
    });
    fanEl.classList.add("picked");
    fanEl.style.transform = (fanEl.dataset.base || "") + " translateY(-30px) scale(.86)";
    fanEl.style.opacity = "0";
  }

  function stopAutoPick() {
    if (autoPickTimer) { clearInterval(autoPickTimer); autoPickTimer = null; }
    autoPickAllMode = false;
    if (fanScrollTimer) { clearTimeout(fanScrollTimer); fanScrollTimer = null; }
    fitRound++;                     // 作废尚未触发的「同屏适配」回调，避免旧一轮延迟出牌
  }

  /* 恢复牌桌原始尺寸（撤销「帮我抽完」的同屏适配缩放）。
     返回此前是否处于缩小状态，供调用方决定滚动时机。 */
  function restoreTableScale() {
    const table = $("#cardTable");
    const was = tableFitted;
    if (table) { table.style.transform = ""; table.style.transformOrigin = ""; }
    tableFitted = false;
    return was;
  }

  /* 等平滑滚动基本稳定（连续几帧不动）再回调，保证「先滑动到位、再出现抽牌动画」。
     带超时上限，避免个别环境滚动动画过久时卡住不出牌。 */
  function waitScrollSettle(cb, maxWait) {
    const t0 = Date.now();
    let last = window.scrollY, stable = 0;
    const tick = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) <= 1) stable++; else stable = 0;
      last = y;
      if (stable >= 4 || Date.now() - t0 > (maxWait || 2200)) { cb(); return; }
      setTimeout(tick, 50);
    };
    tick();
  }

  /* 「帮我抽完」前置适配：先把「牌堆（扇形）+ 牌阵」整体呈现在同一屏里，再开始逐张飞牌。
     - 放得下（桌面）：只把两者整体平滑滚动到屏幕正中；
     - 放不下（手机竖屏 + 大牌阵）：按比例缩小整张牌桌（transform:scale），
       保证扇形与所有空位同屏完整可见，飞牌全程可见、落点不漂移。
     适配完成后回调 cb 开始抽牌；期间若被重置/开新一轮，回调自动作废。 */
  function fitTableForAutoDraw(cb) {
    const table = $("#cardTable"), deck = $("#deckZone"), rz = $("#resultZone");
    if (!table || !deck || !rz) { if (cb) cb(); return; }
    const vh = window.innerHeight || 640;
    const dR = deck.getBoundingClientRect(), rR = rz.getBoundingClientRect();
    const top = Math.min(dR.top, rR.top), bot = Math.max(dR.bottom, rR.bottom);
    const h = bot - top;
    const avail = vh * 0.94;
    const s = h > avail + 4 ? Math.max(0.4, avail / h) : 1;
    const myRound = ++fitRound;
    if (s < 1) {
      tableFitted = true;
      table.style.transformOrigin = "50% 50%";
      table.style.transform = "scale(" + s.toFixed(3) + ")";
    } else {
      restoreTableScale();
    }
    // 等缩放过渡（.table transition .34s）走完，再量缩放后的视觉矩形，滚动到同屏正中
    setTimeout(() => {
      if (myRound !== fitRound) return;               // 期间被重置/开新一轮 → 放弃
      const d2 = deck.getBoundingClientRect(), r2 = rz.getBoundingClientRect();
      const t2 = Math.min(d2.top, r2.top), b2 = Math.max(d2.bottom, r2.bottom);
      const target = window.scrollY + t2 + (b2 - t2) / 2 - vh / 2;
      const max = Math.max(0, document.documentElement.scrollHeight - vh);
      window.scrollTo({ top: Math.max(0, Math.min(target, max)), behavior: "smooth" });
      // 等滚动真正停稳再出牌（无头/低帧环境平滑滚动可能超过 1s），确保抽牌过程页面纹丝不动
      if (cb) waitScrollSettle(cb);
    }, s < 1 ? 370 : 30);
  }

  function autoPickAll() {
    if (!isPicking) return;
    stopAutoPick();
    autoPickAllMode = true;                        // 进入「帮我抽完」模式：抽牌过程保持页面不滚动
    if (fanScrollTimer) { clearTimeout(fanScrollTimer); fanScrollTimer = null; } // 取消尚未发生的「滚到扇形」
    const autoBtn = $("#autoPickBtn");
    if (autoBtn) autoBtn.hidden = true;            // 进入自动模式后隐藏按钮，避免重复触发
    // 先把「牌堆 + 牌阵」缩放/滚动到同屏完整可见，再开始逐张飞牌
    fitTableForAutoDraw(() => {
      if (!isPicking || !autoPickAllMode) return;
      autoPickTimer = setInterval(() => {
        if (!isPicking) { stopAutoPick(); return; }
        const next = $("#fan .fan-card:not(.picked)");
        if (!next) { stopAutoPick(); return; }
        drawFromFan(next);
      }, 200);
    });
  }

  function startPicking() {
    const s = currentSpread;
    const items = pickRandom(s.count);
    drawnCards = items;
    flipState = items.map(() => false);
    pickIndex = 0;
    // 提前把本轮抽到的正面图喂进缓存，翻牌时不再“弹出”
    preloadDrawn(items);

    // 1) 预置结果网格与空位
    const zone = $("#resultZone");
    layoutResultZone(zone, s);
    zone.innerHTML = spreadSlots(s).map(ghostSlotHTML).join("");

    // 2) 收起牌堆，铺开扇形
    $("#deck").hidden = true;
    const tip = $("#deckTip");
    if (tip) tip.hidden = true;
    buildFan();

    // 3) 文案与按钮
    isPicking = true;
    const fanTip = $("#fanTip");
    if (fanTip) fanTip.hidden = false;
    $("#drawBtn").disabled = true;
    $("#drawBtnText").textContent = "抽取中…";
    updatePickProgress();
    if (fanScrollTimer) { clearTimeout(fanScrollTimer); fanScrollTimer = null; }
    fanScrollTimer = setTimeout(() => {
      // 自动抽牌模式：抽牌过程中保持页面不动，抽完后再滚动展现牌阵，这里不滚到扇形
      if (autoPickAllMode) return;
      // 滚到扇形（用户要点的目标），而不是整张表——大牌阵居中会把扇形滚出屏幕
      const t = $("#fan") || $("#deckZone");
      if (t) t.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 80);
  }

  function finishPicking() {
    isPicking = false;
    stopAutoPick();
    const wasFitted = restoreTableScale();      // 抽完恢复牌桌原尺寸（同屏适配缩放撤销）
    $("#deckZone").hidden = true;
    const fanTip = $("#fanTip");
    if (fanTip) fanTip.hidden = true;
    const autoBtn = $("#autoPickBtn");
    if (autoBtn) autoBtn.hidden = true;

    isDrawing = false;
    $("#drawBtnText").textContent = "再抽一次";
    $("#drawBtn").disabled = false;
    $("#resetBtn").hidden = false;

    // 进入翻牌阶段
    flipHintOn = true;
    $("#flipHint").hidden = false;
    $("#flipAllBtn").hidden = false;
    updateFlipProgress();
    setTimeout(() => {
      // 抽完把牌阵顶部带入视野（大牌阵也能从第一张开始看），用 start 而非 center 避免大幅跳动
      const rz = $("#resultZone");
      if (rz) rz.scrollIntoView({ behavior: "smooth", block: "start" });
    }, wasFitted ? 380 : 120);   // 刚撤销过缩放，等恢复过渡走完再滚，避免量到中间态
  }

  function doDraw() {
    if (isDrawing) return;
    // 新的一轮抽牌：旧的草稿作废
    clearDraft();
    stopAutoPick();
    restoreTableScale();          // 新的一轮从原始尺寸开始（撤销上一轮的同屏适配缩放）

    isDrawing = true;
    const deck = $("#deck");
    deck.hidden = false;
    $("#drawBtn").disabled = true;
    $("#drawBtnText").textContent = "洗牌中…";
    // 复位上一轮的扇形/空位
    $("#fanZone").hidden = true;
    $("#fan").innerHTML = "";
    $("#fanTip").hidden = true;
    $("#autoPickBtn").hidden = true;
    isPicking = false;
    pickIndex = 0;

    runShuffleFx(deck, startPicking);
  }

  function renderReading(items) {
    const s = currentSpread;
    const q = $("#questionInput").value.trim();
    let html = "";
    if (q) {
      html += '<div class="read-question">「 ' + esc(q) + " 」</div>";
    }
    html += '<div class="reading-title">牌 面 解 读</div>';
    html +=
      '<div class="read-spread-tag">' + esc(s.label) + "</div>";
    html += items
      .map((it, i) => {
        const c = it.card;
        const pos = s.positions[i] || "牌 " + (i + 1);
        const rev = it.reversed;
        const txt = rev ? c.rev : c.up;
        return (
          '<div class="read-item" style="animation-delay:' + i * 80 + 'ms">' +
            '<div class="read-head">' +
              '<span class="read-pos">' + esc(pos) + "</span>" +
              '<span class="read-name">' + esc(c.name) + "</span>" +
              '<span class="read-orient ' + (rev ? "rev" : "up") + '">' +
                (rev ? "逆位" : "正位") +
              "</span>" +
            "</div>" +
            '<div class="read-kw">' +
              c.keywords.map((k) => "<span>" + esc(k) + "</span>").join("") +
            "</div>" +
            '<p class="read-text">' + esc(txt) + "</p>" +
          "</div>"
        );
      })
      .join("");
    $("#reading").innerHTML = html;
    $("#reading").classList.add("ready");
  }

  /* ============================================================
     解牌（本地规则引擎 + 浏览器内置 AI 增强）
     ============================================================ */
  let aiBusy = false;       // 防止重复触发
  let browserAiState = "no"; // no | downloadable | downloading | ready
  let aiResultText = "";    // 当前已生成的解读文本（供复制）

  function hideAi() {
    const z = $("#aiZone");
    if (z) z.hidden = true;
    const res = $("#aiResult");
    if (res) {
      res.hidden = true;
      res.innerHTML = "";
    }
    // 清空上一轮的问题与增强按钮状态，避免串到下一次抽牌
    const inp = $("#aiQuestion");
    if (inp) inp.value = "";
    const enh = $("#aiEnhanceBtn");
    if (enh) {
      enh.hidden = true;
      enh.disabled = true;
    }
    hideAskBox();
    aiResultText = "";
  }

  /* 全部翻开后调出解牌区 */
  function showAi() {
    const z = $("#aiZone");
    if (!z) return;
    z.hidden = false;

    // 用抽牌时填过的问题预填（可改）
    const asked = ($("#questionInput") && $("#questionInput").value.trim()) || "";
    const inp = $("#aiQuestion");
    if (inp && asked && !inp.value.trim()) inp.value = asked;
    if (inp) {
      inp.placeholder = asked
        ? "（可选）想更聚焦？在这里改写你的问题"
        : "（可选）补充或修改你的问题，例如：我该不该换工作？";
    }

    // 主按钮：本地规则引擎，永远可用、即时出结果
    const badge = $("#aiStatus");
    badge.textContent = "本地解读 · 免费";
    badge.className = "ai-badge ready";

    // AI 深度解读按钮：只看有没有配好自己的密钥
    paintAiKeyBtn();

    // 后台探测浏览器内置 AI，有就亮出增强按钮
    const enh = $("#aiEnhanceBtn");
    if (enh) {
      enh.hidden = true;
      enh.disabled = true;
    }
    if (window.TarotReading && window.TarotReading.probeBrowserAI) {
      window.TarotReading.probeBrowserAI().then((st) => {
        browserAiState = st;
        if (!enh) return;
        if (st === "ready") {
          enh.hidden = false;
          enh.disabled = false;
          enh.textContent = "✦ 用本机 AI 深度解读（本地运行 · 不耗额度）";
          enh.dataset.mode = "ready";
        } else if (st === "downloadable" || st === "downloading") {
          enh.hidden = false;
          enh.disabled = false;
          enh.textContent = "✦ 本机 AI 可用（首次需下载约 2GB 模型）";
          enh.dataset.mode = "download";
        }
      });
    }
  }

  /* 组装引擎需要的上下文 */
  function buildCtx() {
    const s = currentSpread;
    const q = ($("#aiQuestion") && $("#aiQuestion").value.trim()) || "";
    return { spread: s, items: drawnCards, question: q };
  }

  function renderAiLoading(msg) {
    const res = $("#aiResult");
    res.hidden = false;
    res.innerHTML =
      '<div class="ai-result-head">耿 鬼 正 在 解 牌</div>' +
      '<div class="ai-loading">' +
        "<span>" + esc(msg || "凝神读取牌面") + "</span>" +
        '<span class="ai-dots"><i></i><i></i><i></i></span>' +
      "</div>";
  }

  function renderAiError(msg, withKeyBtn) {
    const res = $("#aiResult");
    res.hidden = false;
    res.innerHTML =
      '<div class="ai-err"><b>✦ 解牌没有成功</b>' + esc(msg) +
      (withKeyBtn
        ? '<button class="ai-mini" id="aiErrKeyBtn" style="margin-top:10px">⚙ 检查 AI 密钥设置</button>'
        : "") +
      "</div>";
    const kb = $("#aiErrKeyBtn");
    if (kb) kb.addEventListener("click", openAiSettings);
  }

  /* 把文本渲染成段落。isPro=true 时打上「AI 深度解读」标签 */
  /* 把一段纯文本渲染为段落/列表（无 ## 标题时降级使用） */
  function renderAiParagraphs(text) {
    const paras = String(text)
      .split(/\n+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return paras
      .map((p) => {
        // 建议段落用列表样式呈现，更易读
        if (/^·\s/.test(p) || p.indexOf("\n· ") >= 0) {
          const items = p
            .split(/\n/)
            .map((x) => x.replace(/^·\s*/, "").trim())
            .filter(Boolean);
          return (
            '<ul class="ai-list">' +
            items.map((x) => "<li>" + esc(x) + "</li>").join("") +
            "</ul>"
          );
        }
        return "<p>" + esc(p) + "</p>";
      })
      .join("");
  }

  /* 解析带 ## 小标题的 AI 解读，返回结构化分区。
     渲染与流式增量更新共用这一份解析结果，避免两套逻辑走偏。 */
  function aiSectionsOf(raw) {
    const text = String(raw || "");
    // 没有小标题：降级为原段落/列表渲染（本地解读、旧文本兼容）
    if (!/^##\s/m.test(text)) {
      return [{ title: "", html: renderAiParagraphs(text) }];
    }

    const lines = text.split(/\r?\n/);
    const sections = [];
    let cur = null;
    for (const line of lines) {
      const m = line.match(/^\s*#{1,6}\s+(.*)$/);
      if (m) {
        if (cur) sections.push(cur);
        cur = { title: m[1].trim(), lines: [] };
      } else if (cur) {
        cur.lines.push(line);
      } else {
        cur = { title: "", lines: [line] };
      }
    }
    if (cur) sections.push(cur);

    return sections.map((s) => ({
      title: s.title,
      html: renderAiParagraphs(s.lines.join("\n")),
    }));
  }

  /* 单个分区 → HTML。data-si 是流式更新时的定位锚点 */
  function sectionHtml(s, i) {
    if (!s.title) {
      return '<div class="ai-plain" data-si="' + i + '">' + s.html + "</div>";
    }
    // 结论区做成高亮卡片：一段明确的判断，值得比正文多看一眼
    const verdict = /^(结论|核心结论|总体结论|一句话结论|判断)/.test(s.title);
    return (
      '<section class="ai-section' + (verdict ? " verdict" : "") + '" data-si="' + i + '">' +
        '<h4 class="ai-section-title">' + esc(s.title) + "</h4>" +
        '<div class="ai-section-body">' + s.html + "</div>" +
      "</section>"
    );
  }

  /* 解析带 ## 小标题的 AI 解读，渲染为带分区引导的清晰结构 */
  function renderAiSections(raw) {
    return aiSectionsOf(raw).map(sectionHtml).join("");
  }

  function paintAiText(text, headLabel, isPro) {
    const res = $("#aiResult");
    res.hidden = false;
    const body = renderAiSections(String(text || ""));

    res.innerHTML =
      '<div class="ai-result-head' + (isPro ? " pro" : "") + '">' +
        esc(headLabel || "耿 鬼 的 解 读") +
        (isPro ? '<span class="ai-tag-pro">AI</span>' : "") +
      "</div>" +
      '<div class="ai-body">' + body + "</div>" +
      (isPro && credits > 0
        ? '<p class="ai-credit-left">剩余点数 ' + credits + " 点</p>"
        : "") +
      '<div class="ai-retry solo">' +
        '<button class="ai-mini" id="aiCopyBtn">复 制 解 读</button>' +
      "</div>" +
      '<p class="ai-foot">' +
        (isPro
          ? "✦ 本次解读由 AI 生成，结合了你的问题与牌面。它是一种自我觉察的工具，不是命运的判决。"
          : "✦ 解读来自本地塔罗知识库，是一种自我觉察的工具，不是命运的判决。请结合自己的判断参考。") +
      "</p>";

    const cp = $("#aiCopyBtn");
    if (cp) cp.addEventListener("click", copyAiText);
  }

  /* 流式输出：就地更新已有分区，不整块重建。
     以前每次 delta 都 innerHTML 覆盖，导致 .ai-section 的 fadeUp 动画
     每 120ms 从 opacity:0 重播一次、永远播不完，看上去就是整块在闪。 */
  function paintAiStream(text) {
    const res = $("#aiResult");
    if (!res || res.hidden) return;

    let body = res.querySelector(".ai-body");
    if (!body) {
      // 首帧：建一次骨架（标题栏 / 复制按钮 / 页脚），之后只动正文
      paintAiText(text, "耿 鬼 的 AI 深 度 解 读", true);
      body = res.querySelector(".ai-body");
      if (body) body.classList.add("streaming");
      return;
    }
    if (!body.classList.contains("streaming")) body.classList.add("streaming");

    const secs = aiSectionsOf(text);
    const nodes = body.querySelectorAll("[data-si]");

    if (nodes.length !== secs.length) {
      // 分区数量变了（AI 刚写出新的 ## 标题）才重建，整段输出里通常只发生几次
      body.innerHTML = secs.map(sectionHtml).join("");
      return;
    }

    // 常规情况：逐区比对，只写真正变了的节点
    for (let i = 0; i < secs.length; i++) {
      const node = nodes[i];
      const s = secs[i];
      if (node.classList.contains("ai-section")) {
        const titleEl = node.querySelector(".ai-section-title");
        if (titleEl && titleEl.textContent !== s.title) titleEl.textContent = s.title;
        const bodyEl = node.querySelector(".ai-section-body");
        if (bodyEl && bodyEl.__html !== s.html) {
          bodyEl.__html = s.html;
          bodyEl.innerHTML = s.html;
        }
      } else if (node.__html !== s.html) {
        node.__html = s.html;
        node.innerHTML = s.html;
      }
    }
  }

  /* 流式结束：补齐最后一段内容，然后摘掉 streaming（不会重播动画） */
  function finalizeAiStream(text) {
    paintAiStream(text);
    const res = $("#aiResult");
    const body = res && res.querySelector(".ai-body");
    if (body) body.classList.remove("streaming");
    const cp = $("#aiCopyBtn");
    if (cp && !cp.__bound) {
      cp.__bound = true;
      cp.addEventListener("click", copyAiText);
    }
  }

  function copyAiText() {
    const done = () => toast("解读已复制");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(aiResultText).then(done, done);
    } else {
      const ta = document.createElement("textarea");
      ta.value = aiResultText;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch (e) {}
      ta.remove();
      done();
    }
  }

  /* 主路径：本地规则引擎，瞬时完成、永不失败 */
  function doLocalReading() {
    if (!drawnCards.length) return;
    if (!window.TarotReading) {
      renderAiError("解读模块尚未加载，请刷新页面重试。");
      return;
    }
    const out = window.TarotReading.buildReading(buildCtx());
    if (!out.paras || !out.paras.length) {
      renderAiError("没有拿到牌面数据，请重新抽牌。");
      return;
    }
    aiResultText = out.paras.join("\n\n");
    paintAiText(out.paras.join("\n\n"), "耿 鬼 的 解 读");
    attachReadingToHistory(aiResultText, "local");
    $("#aiResult").scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  /* 增强路径：浏览器内置 AI（本地推理，零额度） */
  async function doBrowserAiReading() {
    if (aiBusy) return;
    if (!window.TarotReading || !window.TarotReading.runBrowserAI) return;

    const enh = $("#aiEnhanceBtn");
    aiBusy = true;
    if (enh) enh.disabled = true;
    renderAiLoading(
      browserAiState === "ready" ? "本机 AI 正在解读" : "首次使用需下载模型，请稍候"
    );

    let lastPaint = 0;
    try {
      const text = await window.TarotReading.runBrowserAI(buildCtx(), (partial) => {
        // 流式：节流刷新，避免高频重排
        const now = Date.now();
        if (now - lastPaint > 180) {
          lastPaint = now;
          paintAiText(partial, "耿 鬼 的 解 读 · 本机 AI");
        }
      });
      if (!text) throw new Error("empty");
      aiResultText = text;
      paintAiText(text, "耿 鬼 的 解 读 · 本机 AI");
    } catch (e) {
      const m = String((e && e.message) || e);
      if (m === "no-browser-ai") {
        renderAiError("这台设备或浏览器不支持内置 AI。已为你保留本地规则的解读结果。");
      } else {
        renderAiError("本机 AI 解读失败（" + m + "）。你可以改用本地规则解读，效果同样完整。");
      }
      // 失败时自动退回本地引擎，保证用户一定拿到结果
      if (!aiResultText) {
        const out = window.TarotReading.buildReading(buildCtx());
        aiResultText = out.paras.join("\n\n");
        paintAiText(aiResultText, "耿 鬼 的 解 读");
      }
    } finally {
      aiBusy = false;
      if (enh) enh.disabled = false;
    }
  }

  /* ============================================================
     付费 AI 深度解读 + 点数 / 兑换
     ------------------------------------------------------------
     · 免费：本地规则引擎（doLocalReading）
     · 付费：服务端真 AI（startProReading → runReading），按牌数扣点（1 张牌 = 1 点）
     点数只存服务端，前端只缓存展示值，每次操作后以服务端为准。
     ============================================================ */
  const DEVICE_KEY = "tarot_device_v1";
  let credits = 0;          // 当前设备剩余点数（服务端权威），1 点 = 1 张牌
  let plansCache = null;    // 套餐列表缓存
  let serverInfo = null;    // /api/plans 返回的服务状态
  let proBusy = false;

  /* 设备标识：本地生成并持久化 */
  function getDeviceId() {
    let id = "";
    try { id = localStorage.getItem(DEVICE_KEY) || ""; } catch (e) {}
    if (id) return id;
    const rnd = (function () {
      if (window.crypto && crypto.randomUUID) {
        try { return crypto.randomUUID().replace(/-/g, ""); } catch (e) {}
      }
      if (window.crypto && crypto.getRandomValues) {
        const a = new Uint8Array(16);
        crypto.getRandomValues(a);
        return Array.prototype.map
          .call(a, (b) => ("0" + b.toString(16)).slice(-2))
          .join("");
      }
      return Math.random().toString(36).slice(2) + Date.now().toString(36);
    })();
    id = "d_" + rnd;
    try { localStorage.setItem(DEVICE_KEY, id); } catch (e) {}
    return id;
  }

  /* ============================================================
     账号（登录态）
     ============================================================ */
  let authToken = "";   // 登录后非空
  let authUser = null;  // { id, username }

  function isLoggedIn() {
    return !!authToken;
  }
  function getToken() {
    return authToken;
  }

  function loadAuth() {
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && d.token) {
          authToken = d.token;
          authUser = d.user || null;
        }
      }
    } catch (e) {}
  }
  function saveAuth(token, user) {
    authToken = token || "";
    authUser = user || null;
    try {
      localStorage.setItem(AUTH_KEY, JSON.stringify({ token: authToken, user: authUser }));
    } catch (e) {}
  }
  function clearAuth() {
    authToken = "";
    authUser = null;
    try { localStorage.removeItem(AUTH_KEY); } catch (e) {}
  }

  /* 组装带归属信息的请求体（登录时附 token） */
  function ownerBody(extra) {
    const o = { deviceId: getDeviceId() };
    if (authToken) o.token = authToken;
    if (extra) Object.assign(o, extra);
    return o;
  }
  function ownerQuery() {
    return "deviceId=" + encodeURIComponent(getDeviceId()) +
      (authToken ? "&token=" + encodeURIComponent(authToken) : "");
  }

  /* 统一请求封装：返回 {ok, status, data} */
  function api(path, opts) {
    opts = opts || {};
    const init = { method: opts.method || "GET", headers: {} };
    if (opts.body !== undefined) {
      init.headers["Content-Type"] = "application/json";
      init.body = JSON.stringify(opts.body);
    }
    return fetch(path, init).then((r) =>
      r.text().then((t) => {
        let data = {};
        try { data = t ? JSON.parse(t) : {}; } catch (e) { data = { error: "bad_json" }; }
        return { ok: r.ok, status: r.status, data: data };
      })
    );
  }

  /* ---------- 点数展示 ----------
     计费单位：1 点 = 1 张牌。本次消耗 = 抽到的牌数。 */
  function currentCost() {
    return drawnCards.length || 1;
  }

  function paintCredits(n) {
    credits = Math.max(0, Number(n) || 0);
    const chip = $("#creditChip");
    const num = $("#creditNum");
    if (num) num.textContent = String(credits);
    if (chip) chip.classList.toggle("low", credits < currentCost());
    // 解牌区按钮状态：不再看点，只看有没有填自己的密钥
    paintAiKeyBtn();
    // 同步给心理测试模块，保证结果页显示的剩余点数是最新的
    if (window.TarotQuiz && window.TarotQuiz.refreshCredits) {
      window.TarotQuiz.refreshCredits(credits);
    }
  }

  /* AI 深度解读按钮 / 我的页卡片：只反映「有没有配好密钥」 */
  function paintAiKeyBtn() {
    const pro = $("#aiProBtn");
    const has = !!(window.TaroAI && window.TaroAI.hasKey());
    const cfg = has ? window.TaroAI.getCfg() : null;

    if (pro) {
      const badge = $("#aiProBadge");
      const t = $("#aiProTitle");
      const s = $("#aiProSub");
      pro.classList.remove("out");
      pro.classList.toggle("needkey", !has);
      pro.disabled = false;
      if (badge) badge.textContent = has ? "已配置" : "需填密钥";
      if (t) t.textContent = "AI 深度解读";
      if (s) {
        s.textContent = has
          ? "用你的 " + (cfg && cfg.model ? cfg.model : "AI") + " 解读 · 不扣点数"
          : "填自己的密钥即可解锁（不收费）";
      }
    }

    const link = $("#aiKeyLink");
    if (link) link.textContent = has ? "⚙ 更换我的 AI 密钥" : "⚙ 配置我的 AI 密钥（免费）";

    const card = $("#aiKeyCard");
    const state = $("#aiKeyState");
    if (card) card.classList.toggle("on", has);
    if (state) {
      state.textContent = has
        ? "已配置 · " + (cfg.model || "自定义模型") + " · 密钥仅存本机"
        : "未配置 · 填入你自己的 API 密钥即可解锁";
    }
  }

  function openAiSettings() {
    if (!window.TaroAI) {
      toast("密钥模块还没加载好，请刷新页面重试");
      return;
    }
    window.TaroAI.openSettings(() => {
      paintAiKeyBtn();
      toast(window.TaroAI.hasKey() ? "AI 密钥已保存" : "已清除 AI 密钥");
    });
  }

  function refreshBalance() {
    return api("/api/balance?" + ownerQuery())
      .then((r) => {
        if (r.ok) {
          paintCredits(r.data.credits);
          paintPmBalance(r.data);
          paintMeStats(r.data);
        }
        return r.data.credits || 0;
      })
      .catch(() => credits);
  }

  /* 同步「我的」页里的三项统计 */
  function paintMeStats(d) {
    if (!d) return;
    const c = $("#meCredits"), b = $("#meBought"), u = $("#meUsed");
    if (c) c.textContent = String(d.credits || 0);
    if (b) b.textContent = String(d.totalBought || 0);
    if (u) u.textContent = String(d.totalUsed || 0);
  }

  /* 同步弹窗里的三项统计 */
  function paintPmBalance(d) {
    if (!d) return;
    const c = $("#pmbCredits"), b = $("#pmbBought"), u = $("#pmbUsed");
    if (c) c.textContent = String(d.credits || 0);
    if (b) b.textContent = String(d.totalBought || 0);
    if (u) u.textContent = String(d.totalUsed || 0);
  }

  /* ---------- 弹窗控制 ---------- */
  function openPayModal(tab) {
    const m = $("#payModal");
    if (!m) return;
    m.hidden = false;
    document.body.style.overflow = "hidden";
    refreshBalance();
    const msg = $("#pmRedeemMsg");
    if (msg) msg.hidden = true;
    if (tab === "redeem") {
      setTimeout(() => {
        const inp = $("#pmCodeInput");
        if (inp) { inp.focus(); }
      }, 200);
    }
  }

  function closePayModal() {
    const m = $("#payModal");
    if (m) m.hidden = true;
    document.body.style.overflow = "";
  }

  function hidePmMockNote(d) {
    const mock = $("#pmMock");
    if (mock) mock.hidden = !(d && d.isMockPay);
    const nk = $("#pmNoKey");
    if (nk) nk.hidden = !(d && d.aiReady === false);
  }

  /* ---------- 套餐渲染 ---------- */
  const PLAN_DESC = {
    trial: "够解 2 次三牌阵，先试试水",
    standard: "约 9.4 分/张，最常用的一档",
    pro: "约 9.1 分/张，长期用最省",
  };

  function yuan(fen) {
    const n = (Number(fen) || 0) / 100;
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
  }

  function renderPlans(plans) {
    const wrap = $("#pmPlans");
    if (!wrap) return;
    if (!plans || !plans.length) {
      wrap.innerHTML = '<p class="pm-foot">套餐加载失败，请稍后重试。</p>';
      return;
    }
    wrap.innerHTML = plans
      .map((p) => {
        const per = p.credits > 0 ? (p.price / p.credits / 100) : 0;
        const best = p.tag === "最受欢迎" || p.tag === "最划算";
        return (
          '<button class="pm-plan' + (best ? " best" : "") + '" data-plan="' + esc(p.id) + '">' +
            (p.tag ? '<span class="pm-plan-tag">' + esc(p.tag) + "</span>" : "") +
            '<span class="pm-plan-credits"><b>' + p.credits + "</b><span>点</span></span>" +
            '<span class="pm-plan-info">' +
              '<span class="pm-plan-name">' + esc(p.title) + "</span>" +
              '<span class="pm-plan-desc">' + esc(PLAN_DESC[p.id] || "解牌点数包") + "</span>" +
            "</span>" +
            '<span class="pm-plan-price">' +
              "<b><i>¥</i>" + yuan(p.price) + "</b>" +
              "<span>约 ¥" + per.toFixed(3) + "/张</span>" +
            "</span>" +
          "</button>"
        );
      })
      .join("");
  }

  function loadPlans() {
    if (plansCache) {
      renderPlans(plansCache.plans);
      hidePmMockNote(plansCache);
      return Promise.resolve(plansCache);
    }
    return api("/api/plans")
      .then((r) => {
        if (!r.ok) throw new Error("套餐加载失败");
        plansCache = r.data;
        serverInfo = r.data;
        renderPlans(r.data.plans);
        hidePmMockNote(r.data);
        return r.data;
      })
      .catch((e) => {
        renderPlans(null);
        return null;
      });
  }

  /* ---------- 下单 → 跳收银台 ---------- */
  function buyPlan(planId) {
    const btn = document.querySelector('.pm-plan[data-plan="' + planId + '"]');
    if (btn) btn.disabled = true;
    api("/api/order", {
      method: "POST",
      body: ownerBody({ planId: planId }),
    })
      .then((r) => {
        if (btn) btn.disabled = false;
        if (!r.ok) throw new Error(r.data.message || "下单失败");
        const d = r.data;
        // 模拟支付：留在站内收银台；真实支付：跳转网关
        if (d.payUrl) {
          location.href = d.payUrl;
        } else if (d.qr) {
          showQrPay(d);
        } else {
          throw new Error("没有拿到支付地址");
        }
      })
      .catch((e) => {
        if (btn) btn.disabled = false;
        toast(e.message || "下单失败，请重试");
      });
  }

  /* 扫码支付（真实网关返回二维码时） */
  function showQrPay(d) {
    const wrap = $("#pmPlans");
    if (!wrap) return;
    wrap.innerHTML =
      '<div style="text-align:center;padding:10px 0">' +
        '<p style="font-size:13px;color:var(--text-dim);margin-bottom:12px">请用手机扫码支付 ¥' +
          yuan(d.amount) + " · " + esc(d.title) + "</p>" +
        '<img src="' + esc(d.qr) + '" alt="支付二维码" style="width:200px;height:200px;border-radius:14px;background:#fff;padding:8px">' +
        '<p style="font-size:11.5px;color:var(--text-dim);margin-top:12px">支付完成后，兑换码会自动出现在这里</p>' +
      "</div>";
    // 轮询订单状态
    let n = 0;
    const timer = setInterval(() => {
      n++;
      if (n > 100) return clearInterval(timer);
      api("/api/order/status?id=" + encodeURIComponent(d.orderId)).then((r) => {
        if (r.ok && r.data.status === "paid" && r.data.code) {
          clearInterval(timer);
          wrap.innerHTML =
            '<div class="pm-redeem-msg ok" style="margin-top:0">支付成功！你的兑换码是 <b>' +
            esc(r.data.code) + "</b>，已自动填入下方兑换框。</div>";
          const inp = $("#pmCodeInput");
          if (inp) inp.value = r.data.code;
          refreshBalance();
          toast("支付成功，兑换码已获取");
        }
      });
    }, 3000);
  }

  /* ---------- 兑换码 ---------- */
  function redeemCode() {
    const inp = $("#pmCodeInput");
    const btn = $("#pmRedeemBtn");
    const msg = $("#pmRedeemMsg");
    const code = (inp && inp.value.trim()) || "";
    if (!code) {
      if (msg) {
        msg.hidden = false;
        msg.className = "pm-redeem-msg err";
        msg.textContent = "请先输入兑换码";
      }
      return;
    }
    if (btn) btn.disabled = true;
    if (btn) btn.textContent = "兑换中…";
    api("/api/redeem", {
      method: "POST",
      body: ownerBody({ code: code }),
    })
      .then((r) => {
        if (btn) { btn.disabled = false; btn.textContent = "兑换"; }
        const d = r.data;
        if (!r.ok) {
          if (msg) {
            msg.hidden = false;
            msg.className = "pm-redeem-msg err";
            msg.textContent = d.message || "兑换失败";
          }
          return;
        }
        if (inp) inp.value = "";
        paintCredits(d.credits);
        paintPmBalance({
          credits: d.credits,
          totalBought: Number($("#pmbBought") && $("#pmbBought").textContent) + d.added || d.added,
          totalUsed: Number($("#pmbUsed") && $("#pmbUsed").textContent) || 0,
        });
        // 以服务端为准回读，保证三项统计准确
        refreshBalance();
        if (msg) {
          msg.hidden = false;
          msg.className = "pm-redeem-msg ok";
          msg.textContent = "兑换成功！" + (d.title || "解牌包") + " 已到账 +" +
            d.added + " 点，当前共 " + d.credits + " 点（可解约 " +
            Math.floor(d.credits / 3) + " 次三牌阵）。";
        }
        const chip = $("#creditChip");
        if (chip) {
          chip.classList.remove("pulse");
          void chip.offsetWidth;
          chip.classList.add("pulse");
        }
        toast("兑换成功 +" + d.added + " 点");
      })
      .catch((e) => {
        if (btn) { btn.disabled = false; btn.textContent = "兑换"; }
        if (msg) {
          msg.hidden = false;
          msg.className = "pm-redeem-msg err";
          msg.textContent = "网络异常，请稍后重试";
        }
      });
  }

  /* ---------- 付费 AI 深度解读（先追问，再解读） ---------- */

  /* 卡面图缓存：同一张牌（同牌组 + 同正逆位）只缩图一次 */
  const artCache = new Map();

  /**
   * 把抽到的牌面缩成小图（dataURL）随解读请求发给服务端，
   * 让 AI 结合真实卡面图案做多模态解读。
   * - 长边缩到 400px：模型足够看清意象，token 与流量都可控
   * - 逆位牌整体翻转，和用户屏幕上看到的一致
   * - 任何一步失败都返回 ""，服务端会自动退回纯文本解读，不打断流程
   */
  function captureCardArt(it) {
    const c = it.card;
    if (!c || !c.img) return Promise.resolve("");
    const key = currentDeck.id + ":" + c.id + ":" + (it.reversed ? "r" : "u");
    if (artCache.has(key)) return Promise.resolve(artCache.get(key));
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const MAX = 400;
          const ratio = img.naturalWidth / img.naturalHeight || 0.57;
          let w, h;
          if (img.naturalWidth >= img.naturalHeight) { w = MAX; h = Math.round(MAX / ratio); }
          else { h = MAX; w = Math.round(MAX * ratio); }
          const cv = document.createElement("canvas");
          cv.width = w; cv.height = h;
          const cx = cv.getContext("2d");
          cx.fillStyle = "#ffffff"; // 兜底：透明 PNG 不导出黑块
          cx.fillRect(0, 0, w, h);
          if (it.reversed) { cx.translate(0, h); cx.scale(1, -1); } // 逆位：垂直翻转
          cx.drawImage(img, 0, 0, w, h);
          const url = cv.toDataURL("image/jpeg", 0.82);
          artCache.set(key, url);
          resolve(url);
        } catch (e) { resolve(""); }
      };
      img.onerror = () => resolve("");
      img.src = pathFor(currentDeck, c.img);
    });
  }

  /** 组装本次抽牌的牌面数据；withArt=true 时附带卡面缩图（仅解读请求需要） */
  async function buildCardsPayload(withArt) {
    const out = [];
    for (let i = 0; i < drawnCards.length; i++) {
      const it = drawnCards[i];
      const c = it.card;
      const o = {
        position: (currentSpread.positions && currentSpread.positions[i]) || "牌 " + (i + 1),
        positionDesc: (currentSpread.posDesc && currentSpread.posDesc[i]) || "",
        name: c.name,
        en: c.en || "",
        orientation: it.reversed ? "逆位" : "正位",
        up: c.up || "",
        rev: c.rev || "",
        keywords: c.keywords || [],
      };
      if (withArt) o.art = await captureCardArt(it);
      out.push(o);
    }
    return out;
  }

  /* ============================================================
     AI 深度解读（BYOK：用户自带密钥）
     ------------------------------------------------------------
     · 不扣点数、不走服务端：浏览器直连用户填的 OpenAI 兼容接口
     · 先让 AI 追问 2 个问题（失败直接跳过），再正式解读
     · 流式输出，边生成边渲染
     ============================================================ */
  const TAROT_SYSTEM_PROMPT = [
    "你是塔罗占卜师「耿鬼」，说话直白、笃定、有温度，像一位看牌很多年的朋友，偶尔带一点神秘感。",
    "你读的是真实的牌面：先看图，再看牌。牌上的人物在做什么、朝着哪边、手里握着什么、有几样东西、什么颜色、谁远谁近，都是你要读的线索。",
    "你熟悉韦特体系，但绝不背牌义条目：你把画面细节翻译成他此刻的处境，讲人话，不讲教科书。",
    "牌阵大于单牌：先看几张牌之间怎么互相推动、拉扯，哪一张是转折点，再逐张落到位置上。",
    "你不做宿命论断言，但你敢下判断：给明确的方向、倾向程度和成立条件，而不是模棱两可的场面话。",
    "你只用中文回答，不使用 emoji。",
  ].join("");

  let lastStreamPaint = 0;

  /* 牌面图案提要：给看不了图的纯文字模型用，让它们也能按画面细节解牌 */
  function cardVisualNote(c) {
    const V = window.CardVisual;
    if (!V || !c) return "";
    if (typeof V[c.name] === "string") return V[c.name];
    return (c.en && typeof V[c.en] === "string" && V[c.en]) || "";
  }

  function aiErrText(e) {
    const m = String((e && e.message) || e || "").trim();
    const code = (e && e.code) || "";
    if (code === "no-key" || code === "no-base") {
      return "还没有填 AI 密钥。点下面的按钮填一个，就能解锁 AI 深度解读。";
    }
    return m || "AI 解读失败，请稍后重试。";
  }

  /* 组成本次解读的提示词：牌阵结构 + 每张牌的位置/图案/牌义 + 写作要求 */
  function buildProPrompt(answers, opt) {
    opt = opt || {};
    const withImages = !!opt.withImages;
    const sp = currentSpread;
    const q = ($("#aiQuestion") && $("#aiQuestion").value.trim()) || "";
    const L = [];

    L.push(
      "【牌阵】" + (sp.label || "") + (sp.en ? " / " + sp.en : "") +
      (sp.desc ? "（" + sp.desc + "）" : "")
    );
    if (sp.tip) L.push("【牌阵要点】" + sp.tip);
    if (sp.detail) L.push("【牌阵读法】" + sp.detail);
    const layout = (sp.positions || [])
      .map((p, i) => (i + 1) + " → " + p + (sp.posDesc && sp.posDesc[i] ? "（" + sp.posDesc[i] + "）" : ""))
      .join("；");
    if (layout) L.push("【位置结构】" + layout);
    L.push(
      "【用户的问题】" +
      (q || "（没有写具体问题：请围绕这个牌阵呈现的局面，给一个明确的方向判断）")
    );

    const as = (answers || []).filter((a) => a && a.a);
    if (as.length) {
      L.push("【用户补充的回答】（必须用进去，让他感到你在听）");
      as.forEach((a, i) => L.push((i + 1) + ". " + a.q + " → " + a.a));
    }

    L.push("");
    L.push("【抽到的牌】（按牌阵位置排列，正逆位已标好）");
    drawnCards.forEach((it, i) => {
      const c = it.card;
      const pos = (sp.positions && sp.positions[i]) || "牌 " + (i + 1);
      const pd = (sp.posDesc && sp.posDesc[i]) || "";
      const suit =
        c.suit === "major"
          ? "大阿卡纳 " + (c.num || "")
          : (SUIT_CN[c.suit] || "") + " " + (c.num || "");
      L.push(i + 1 + ". 位置：" + pos + (pd ? "（" + pd + "）" : ""));
      L.push("   牌：" + c.name + (c.en ? " " + c.en : "") + " · " + suit + (c.element ? " · 元素 " + c.element : ""));
      L.push("   状态：" + (it.reversed ? "逆位（牌面倒转）" : "正位"));
      if (c.keywords && c.keywords.length) L.push("   关键词：" + c.keywords.join("、"));
      const vis = cardVisualNote(c);
      if (vis && !withImages) L.push("   牌面图案：" + vis);
      L.push("   正位牌义：" + (c.up || ""));
      L.push("   逆位牌义：" + (c.rev || ""));
    });

    L.push("");
    if (withImages) {
      L.push(
        "【看图说明】这条消息附上了牌面图片，每张图前面都标了「▼ 牌 N · 位置 · 牌名 正逆位」，按标记对应。" +
        "请真的看图：画面里的具体细节优先于任何牌义条目，逆位牌已经按用户看到的方向翻转。"
      );
    } else {
      L.push(
        "【看图说明】这次没有图片，只有上面「牌面图案」的文字提要。" +
        "请严格按提要里的画面细节来读，不要编造提要里没有出现的东西。"
      );
    }

    L.push("");
    L.push("【怎么写这次解读】");
    L.push("一、先看图再解牌。每张牌都先说你在画面上真正看到了什么（人物在做什么、朝向、手里握着什么、有几样、什么颜色、谁远谁近），再把细节翻成象征，最后落到这个位置、这个处境下的含义。禁止写「这张牌代表…」的教科书句。");
    L.push("二、牌阵优先。开头先讲这几张牌之间怎么互相推动或拉扯，哪一张是转折点，有没有互相矛盾的地方——矛盾本身就是信息。");
    L.push("三、逆位不读成「坏牌」：它更常是能量受阻、向内收、过头了或者被延迟。");
    L.push("四、结论必须明确，这是最重要的要求：");
    L.push("   1) 第一句话就直接回答用户的问题，方向不能含糊：是／不是，值得／不值得，会成／照现在这样不会成，该往前走／该先停。");
    L.push("   2) 紧接着给倾向程度，例如「七成会成」「把握只有三成」。");
    L.push("   3) 再给一条成立条件（「前提是你先做 X」）和一个时间窗口（「这两三周内」「到年底之前」）。");
    L.push("   4) 全文只能有一个主判断，后面任何段落都不许推翻它；不要用「也许、可能、说不准、因人而异、最终取决于你自己」当结论的落脚点。");
    L.push("   5) 如果牌面确实指向不明朗，就把「哪里不明朗」说清楚，并给出这种情况下最稳妥的某一个动作——仍然要是一个明确的方向。");
    L.push("");
    L.push("【输出结构】严格按这个顺序，标题必须用 ## 开头；整篇的第一个字就是「##」，前面不许写开场白、寒暄或引言：");
    L.push("## 结论");
    L.push("（2~4 句：第一句就是明确答案，然后是倾向程度、成立条件、时间窗口。不要写「综上所述」。）");
    L.push("## 1. 位置 · 牌名 正位/逆位");
    L.push("（2~4 句：画面细节 → 象征 → 在这个位置的含义 → 对应用户的处境。其余每张牌同样格式，编号连续。）");
    L.push("## 小结与建议");
    L.push("（3 条，每条单独一行、以「· 」开头；要具体可执行、带时间感，不写「多沟通」「保持好心态」这类空话。）");
    L.push("");
    L.push("【语言】中文，700~1000 字；不用 emoji；不写「塔罗只是参考」之类的免责套话（页面页脚已有）；不复述牌义原文。");
    return L.join("\n");
  }

  /* 收集牌面图片（dataURL）。失败或体积过大就少给几张，不影响解读 */
  async function collectCardArt() {
    const out = [];
    const MAX_IMAGES = 10;
    const MAX_CHARS = 1100000; // 约 0.8MB base64，照顾个别接口的体积上限
    let chars = 0;
    for (let i = 0; i < drawnCards.length && out.length < MAX_IMAGES; i++) {
      let url = "";
      try { url = await captureCardArt(drawnCards[i]); } catch (e) { url = ""; }
      if (!url || chars + url.length > MAX_CHARS) continue;
      chars += url.length;
      out.push({ index: i, url: url });
    }
    return out;
  }

  /* 组装 messages：有图片就用 OpenAI 多模态格式，文字里逐张标注对应关系 */
  function buildProMessages(answers, art) {
    const withImages = !!(art && art.length);
    const prompt = buildProPrompt(answers, { withImages: withImages });
    if (!withImages) {
      return [
        { role: "system", content: TAROT_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ];
    }
    const sp = currentSpread;
    const parts = [{ type: "text", text: prompt }];
    art.forEach((a) => {
      const it = drawnCards[a.index];
      const pos = (sp.positions && sp.positions[a.index]) || "牌 " + (a.index + 1);
      parts.push({
        type: "text",
        text: "▼ 牌 " + (a.index + 1) + " · " + pos + " · " + it.card.name + " " + (it.reversed ? "逆位" : "正位"),
      });
      parts.push({ type: "image_url", image_url: { url: a.url } });
    });
    return [
      { role: "system", content: TAROT_SYSTEM_PROMPT },
      { role: "user", content: parts },
    ];
  }

  /* 记住某个模型能不能看图，避免每次解读都白试一次 */
  const VISION_KEY = "tarot_ai_vision_v1";

  function visionMemo() {
    try {
      const o = JSON.parse(localStorage.getItem(VISION_KEY) || "{}");
      return o && typeof o === "object" ? o : {};
    } catch (e) {
      return {};
    }
  }

  function rememberVision(model, ok) {
    if (!model) return;
    try {
      const m = visionMemo();
      m[model] = ok ? "yes" : "no";
      localStorage.setItem(VISION_KEY, JSON.stringify(m));
    } catch (e) {}
  }

  /* 这次要不要发图片：off 永不发；on 一定发；auto 看模型历史表现 */
  function wantImages() {
    const cfg = (window.TaroAI && window.TaroAI.getCfg()) || {};
    const mode = cfg.vision || "auto";
    if (mode === "off") return false;
    if (mode === "on") return true;
    return visionMemo()[cfg.model] !== "no";
  }

  /* 判断这次失败是不是「模型看不懂图」造成的，可以退回文字再试一次 */
  function isVisionReject(e) {
    const code = String((e && e.code) || "");
    if (/^http-(400|413|415|422|500|501|503)$/.test(code)) return true;
    return /image|vision|multimodal|图片|不支持|unsupported|content/i.test(
      String((e && e.message) || "")
    );
  }

  /* 结果标题旁标注：这次是看图解的，还是按文字图案解的 */
  function paintVisionBadge(withImages, n, model) {
    const res = $("#aiResult");
    if (!res) return;
    const head = res.querySelector(".ai-result-head");
    if (head) {
      const tag = document.createElement("span");
      tag.className = "ai-tag-vision" + (withImages ? "" : " off");
      tag.textContent = withImages ? "看图 · " + n + " 张" : "文字图案";
      head.appendChild(tag);
    }
    if (!withImages) {
      const retry = res.querySelector(".ai-retry");
      const p = document.createElement("p");
      p.className = "ai-vision-tip";
      p.textContent =
        "当前模型（" + (model || "未知") + "）读不了图片，已按牌面图案的文字提要解读。" +
        "想让它真正看图，把模型换成支持视觉的（如 gpt-4o-mini、glm-4v、qwen-vl-max）。";
      if (retry) res.insertBefore(p, retry);
      else res.appendChild(p);
    }
  }

  /* 让 AI 出 2 个追问（一次很短的调用，失败就跳过） */
  async function askAiQuestions() {
    const sp = currentSpread;
    const q = ($("#aiQuestion") && $("#aiQuestion").value.trim()) || "";
    const brief = drawnCards
      .map((it, i) =>
        ((sp.positions && sp.positions[i]) || "牌" + (i + 1)) + "：" +
        it.card.name + (it.reversed ? "（逆位）" : "（正位）")
      )
      .join("；");
    const prompt =
      "牌阵：" + (sp.label || sp.name || "") + "\n" +
      "用户的问题：" + (q || "（未填写）") + "\n" +
      "抽到的牌：" + brief + "\n\n" +
      "为了把这次解读写得更贴合他的处境，请提出 2 个最关键、最能补上信息缺口的问题" +
      "（例如具体对象、时间范围、他已经做过的尝试、他真正的顾虑）。" +
      "每个问题不超过 28 个字，口语化。只输出一个 JSON 字符串数组，例如 [\"问题一\",\"问题二\"]，" +
      "不要任何解释、不要代码块标记。";
    const text = await window.TaroAI.chat(
      [
        { role: "system", content: TAROT_SYSTEM_PROMPT + "这次你只需要输出用户要求的 JSON 数组。" },
        { role: "user", content: prompt },
      ],
      { temperature: 0.6, maxTokens: 260 }
    );
    return parseQuestionList(text);
  }

  function parseQuestionList(text) {
    let s = String(text || "").trim();
    s = s.replace(/^```[a-zA-Z]*\s*/, "").replace(/```\s*$/, "").trim();
    const a = s.indexOf("["), b = s.lastIndexOf("]");
    if (a >= 0 && b > a) {
      try {
        const arr = JSON.parse(s.slice(a, b + 1));
        if (Array.isArray(arr)) {
          return arr
            .filter((x) => typeof x === "string" && x.trim())
            .map((x) => x.trim().replace(/^[\d.、\s]+/, ""))
            .slice(0, 3);
        }
      } catch (e) {}
    }
    // 兜底：从纯文本里挑出问句
    return s
      .split(/\r?\n+/)
      .map((l) => l.replace(/^[\s\-*·\d.、）)]+/, "").trim())
      .filter((l) => l && /[？?]$/.test(l) && l.length <= 40)
      .slice(0, 2);
  }

  /* 第一步：点「AI 深度解读」→ 没密钥先引导配置，有就追问几个问题 */
  async function startProReading() {
    if (proBusy) return;
    if (!drawnCards.length) return;
    if (!window.TaroAI) {
      renderAiError("密钥模块还没加载好，请下拉刷新后重试。");
      return;
    }
    if (!window.TaroAI.hasKey()) {
      toast("先填一个你自己的 AI 密钥，就能解锁深度解读");
      openAiSettings();
      return;
    }

    const pro = $("#aiProBtn");
    proBusy = true;
    if (pro) pro.disabled = true;
    hideAskBox();
    renderAiLoading("耿鬼正在看牌，准备问你几个问题");

    try {
      const qs = await askAiQuestions();
      if (!qs || !qs.length) {
        await runReading([]);
        return;
      }
      showAskBox(qs);
    } catch (e) {
      // 追问只是锦上添花，失败就直接进入解读
      await runReading([]);
    } finally {
      proBusy = false;
      if (pro) pro.disabled = false;
    }
  }

  /* 第二步：拿到回答（或跳过）后真正解读，流式输出 */
  async function runReading(answers) {
    if (!drawnCards.length) return;
    if (!window.TaroAI || !window.TaroAI.hasKey()) {
      hideAskBox();
      toast("先填一个你自己的 AI 密钥");
      openAiSettings();
      return;
    }

    const cfg = window.TaroAI.getCfg();
    const pro = $("#aiProBtn");
    proBusy = true;
    if (pro) pro.disabled = true;
    hideAskBox();
    lastStreamPaint = 0;

    let art = [];
    let withImages = false;

    try {
      if (wantImages()) {
        renderAiLoading("耿鬼正在逐张看你的牌面");
        art = await collectCardArt();
        withImages = art.length > 0;
      }
      if (!withImages) renderAiLoading("耿鬼正在对着牌阵揣摩");

      const opts = {
        temperature: 0.9,
        onDelta: (partial) => {
          const now = Date.now();
          if (now - lastStreamPaint > 120) {
            lastStreamPaint = now;
            paintAiStream(partial);
          }
        },
      };

      let text;
      try {
        text = await window.TaroAI.chat(buildProMessages(answers, art), opts);
        if (withImages) rememberVision(cfg.model, true);
      } catch (e) {
        // 模型读不了图：记下来，退回文字图案提要重来一次
        if (!withImages || !isVisionReject(e)) throw e;
        rememberVision(cfg.model, false);
        withImages = false;
        art = [];
        lastStreamPaint = 0;
        const res = $("#aiResult");
        if (res) { res.hidden = true; res.innerHTML = ""; }
        renderAiLoading("这个模型看不懂图，改用文字图案重新解");
        text = await window.TaroAI.chat(buildProMessages(answers, []), opts);
      }

      if (!text) throw new Error("AI 没有返回内容，换个模型再试");
      aiResultText = text;
      finalizeAiStream(text);
      paintVisionBadge(withImages, art.length, cfg.model);
      attachReadingToHistory(text, "ai");
      toast("解读完成 · 由你的 " + (cfg.model || "AI") + " 生成");
    } catch (e) {
      renderAiError(aiErrText(e), true);
    } finally {
      proBusy = false;
      if (pro) pro.disabled = false;
    }
  }

  /* ---------- 追问卡片 ---------- */
  let askQuestions = [];

  function showAskBox(questions) {
    askQuestions = questions || [];
    const box = $("#aiAskBox");
    const list = $("#aiAskList");
    if (!box || !list) return;
    list.innerHTML = askQuestions
      .map((q, i) => {
        return (
          '<div class="aak-item">' +
            '<div class="aak-q"><span class="aak-no">' + (i + 1) + "</span>" + esc(q) + "</div>" +
            '<textarea class="aak-input" data-i="' + i + '" rows="2" maxlength="120" ' +
              'placeholder="（可不填）想到什么说什么…"></textarea>' +
          "</div>"
        );
      })
      .join("");
    const btn = $("#aiAskSubmitText");
    if (btn) btn.textContent = "好 了 ，开 始 解 读";
    box.hidden = false;
    // 收起 loading，避免和追问卡叠在一起
    const res = $("#aiResult");
    if (res) { res.hidden = true; res.innerHTML = ""; }
    box.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function hideAskBox() {
    const box = $("#aiAskBox");
    if (box) box.hidden = true;
    askQuestions = [];
  }

  function collectAnswers() {
    const out = [];
    const inputs = document.querySelectorAll("#aiAskList .aak-input");
    inputs.forEach((el) => {
      const i = Number(el.dataset.i);
      out.push({ q: askQuestions[i] || "", a: (el.value || "").trim() });
    });
    return out;
  }

  function submitAsk() {
    if (proBusy) return;
    runReading(collectAnswers());
  }

  /* ---------- URL 参数：从收银台带兑换码回来 ---------- */
  function handleReturnFromPay() {
    const qs = new URLSearchParams(location.search);
    const code = qs.get("code");
    const paid = qs.get("paid");
    if (!code && !paid) return false;
    // 清掉地址栏参数，避免刷新重复提示
    try {
      history.replaceState(null, "", location.pathname);
    } catch (e) {}

    // 支付回来时，回到用户付款前所在的那个栏目，而不是一律跳回抽牌页
    let lastTab = "draw";
    try { lastTab = localStorage.getItem(TAB_KEY) || "draw"; } catch (e) {}
    // 栏目不存在（比如数据被清过）就退回抽牌页
    const tabBtn = document.querySelector('.tab[data-page="' + lastTab + '"]');
    if (tabBtn) tabBtn.click();
    else {
      const drawTab = document.querySelector('.tab[data-page="draw"]');
      if (drawTab) drawTab.click();
    }

    // 仅当带回兑换码（真实支付回调）时才弹核销窗并自动到账；
    // 只带 paid（如模拟支付返回）则直接回到原界面，不弹购买窗
    if (code) {
      openPayModal("redeem");
      const inp = $("#pmCodeInput");
      if (inp) inp.value = code;
      const msg = $("#pmRedeemMsg");
      if (msg) {
        msg.hidden = false;
        msg.className = "pm-redeem-msg ok";
        msg.textContent = "付款成功，正在为你兑换…";
      }
      // 已经付过款了，直接自动核销到账，不用用户再点一次
      setTimeout(() => { redeemCode(); }, 350);
    }
    return true;
  }

  /* ============================================================
     历史记录
     ============================================================ */
  function loadHistory() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function persistHistory(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function buildHistoryItem(items) {
    const q = $("#questionInput") ? $("#questionInput").value.trim() : "";
    return {
      ts: Date.now(),
      count: currentSpread.count,
      spread: currentSpread.label,
      spreadId: currentSpread.id,
      positions: currentSpread.positions.slice(0, items.length),
      question: q,
      cards: items.map((it) => ({
        id: it.card.id,
        name: it.card.name,
        symbol: it.card.symbol,
        reversed: it.reversed
      }))
    };
  }

  /* 把牌面逐张含义拼成可直接阅读的文本，作为该记录的默认解读内容 */
  function buildDeckReadingText(items) {
    const s = currentSpread;
    return items
      .map((it, i) => {
        const c = it.card;
        const pos = (s && s.positions[i]) || "牌 " + (i + 1);
        const txt = it.reversed ? c.rev : c.up;
        return (
          "## " + pos + " · " + c.name +
          "（" + (it.reversed ? "逆位" : "正位") + "）\n" + txt
        );
      })
      .join("\n\n");
  }

  let lastHistoryTs = 0;   // 本次抽牌对应的记录时间戳，解读完成后把正文回填进去

  function saveHistory(items) {
    const item = buildHistoryItem(items);
    // 先写入牌面含义：即使这次没有生成 AI 解读，记录也能点开看
    item.ai = buildDeckReadingText(items);
    item.aiSource = "deck";
    lastHistoryTs = item.ts;
    if (isLoggedIn()) {
      api("/api/history", { method: "POST", body: ownerBody({ item: item }) })
        .then((r) => { if (r.ok) renderHistory(); })
        .catch(() => {});
    } else {
      const list = loadHistory();
      list.unshift(item);
      if (list.length > 50) list.length = 50;
      persistHistory(list);
      renderHistory();
    }
  }

  /* 解读生成后回填到刚存下的那条记录，之后可以从「记录」页点开重看 */
  function attachReadingToHistory(text, source) {
    const body = String(text || "").trim();
    if (!lastHistoryTs || !body) return;
    const ts = lastHistoryTs;
    const list = loadHistory();
    const it = list.find((h) => h.ts === ts);
    if (!it) return;
    // 单条限 4000 字：50 条 ≈ 200KB，离 localStorage 上限还很远
    it.ai = body.length > 4000 ? body.slice(0, 4000) + "\n\n（内容较长，已截断）" : body;
    it.aiSource = source || "local";
    persistHistory(list);
  }

  function deleteHistory(ts) {
    if (isLoggedIn()) {
      api("/api/history?" + ownerQuery() + "&ts=" + encodeURIComponent(ts), { method: "DELETE" })
        .then((r) => { if (r.ok) renderHistoryList(r.data.items || []); })
        .catch(() => {});
    } else {
      persistHistory(loadHistory().filter((h) => h.ts !== ts));
      renderHistory();
    }
  }

  function renderHistory() {
    if (isLoggedIn()) {
      api("/api/history?" + ownerQuery())
        .then((r) => renderHistoryList((r.ok && r.data.items) || []))
        .catch(() => renderHistoryList(loadHistory()));
    } else {
      renderHistoryList(loadHistory());
    }
  }

  function renderHistoryList(list) {
    const kw = $("#historySearch").value.trim().toLowerCase();
    const filtered = kw
      ? list.filter((h) => {
          const inQ = (h.question || "").toLowerCase().includes(kw);
          const inC = h.cards.some(
            (c) => c.name.toLowerCase().includes(kw)
          );
          const inA = (h.ai || "").toLowerCase().includes(kw);
          return inQ || inC || inA;
        })
      : list;

    $("#histCount").textContent = "共 " + filtered.length + " 条记录";
    const wrap = $("#historyList");

    if (!filtered.length) {
      wrap.innerHTML = "";
      $("#histEmpty").hidden = false;
      $("#histEmpty").textContent = kw
        ? "没有匹配的记录"
        : "还没有抽牌记录，去「抽牌」页试试吧 ✦";
      return;
    }
    $("#histEmpty").hidden = true;

    wrap.innerHTML = filtered
      .map((h) => {
        const hasAi = !!(h.ai && String(h.ai).trim());
        return (
          '<div class="hist-item' + (hasAi ? " has-ai" : "") + '" data-ts="' + h.ts + '">' +
            '<div class="hist-top">' +
              '<span class="hist-time">' + esc(fmtTime(h.ts)) + "</span>" +
              '<span class="hist-spread">' + esc(h.spread) + "</span>" +
            "</div>" +
            (h.question
              ? '<div class="hist-q">' + esc(h.question) + "</div>"
              : "") +
            '<div class="hist-cards">' +
              h.cards
                .map(
                  (c) =>
                    '<span class="hist-chip">' +
                      (c.symbol || "✦") + " " + esc(c.name) +
                      "<em class='" + (c.reversed ? "rev" : "up") + "'>" +
                        (c.reversed ? "逆" : "正") +
                      "</em>" +
                    "</span>"
                )
                .join("") +
            "</div>" +
            '<div class="hist-foot">' +
              (hasAi
                ? '<button class="hist-open" data-ts="' + h.ts + '">' +
                    '<span class="hist-open-ico">✦</span>查看解读' +
                  "</button>"
                : '<span class="hist-none">这次没有保存解读</span>') +
              '<button class="hist-del" data-ts="' + h.ts + '">删除</button>' +
            "</div>" +
          "</div>"
        );
      })
      .join("");
  }

  /* ---------------- 历史解读查看弹层 ---------------- */
  function ensureReadingMask() {
    let mask = $("#rdMask");
    if (mask) return mask;

    mask = document.createElement("div");
    mask.className = "rd-mask";
    mask.id = "rdMask";
    mask.hidden = true;
    mask.innerHTML =
      '<div class="rd-modal" role="dialog" aria-modal="true">' +
        '<div class="rd-head">' +
          "<b>这 次 的 解 读</b>" +
          '<button class="rd-close" id="rdClose" aria-label="关闭">×</button>' +
        "</div>" +
        '<div class="rd-meta" id="rdMeta"></div>' +
        '<div class="rd-scroll" id="rdScroll"></div>' +
        '<div class="rd-actions">' +
          '<button class="ai-mini" id="rdCopy">复 制</button>' +
        "</div>" +
      "</div>";
    document.body.appendChild(mask);

    const close = () => closeReadingView();
    mask.addEventListener("click", (e) => {
      if (e.target === mask) close();
    });
    mask.querySelector("#rdClose").addEventListener("click", close);
    bindReadingKeys();
    return mask;
  }

  let rdKeyBound = false;
  function bindReadingKeys() {
    if (rdKeyBound) return;
    rdKeyBound = true;
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const m = $("#rdMask");
      if (m && !m.hidden) closeReadingView();
    });
  }

  let rdCurrentText = "";

  function openReadingView(ts) {
    const item = loadHistory().find((h) => h.ts === Number(ts));
    if (!item || !item.ai) return;

    const mask = ensureReadingMask();
    const meta = mask.querySelector("#rdMeta");
    const scroll = mask.querySelector("#rdScroll");

    meta.innerHTML =
      '<span class="rd-meta-time">' + esc(fmtTime(item.ts)) + "</span>" +
      '<span class="rd-meta-spread">' + esc(item.spread) + "</span>" +
      '<span class="rd-meta-tag' + (item.aiSource === "ai" ? " ai" : "") + '">' +
        (item.aiSource === "ai"
          ? "AI"
          : item.aiSource === "deck"
          ? "牌面"
          : "本地") +
      "</span>";

    scroll.innerHTML =
      (item.question
        ? '<div class="rd-q"><b>你的问题</b>' + esc(item.question) + "</div>"
        : "") +
      '<div class="rd-cards">' +
        (item.cards || [])
          .map(
            (c) =>
              '<span class="hist-chip">' +
                (c.symbol || "✦") + " " + esc(c.name) +
                "<em class='" + (c.reversed ? "rev" : "up") + "'>" +
                  (c.reversed ? "逆" : "正") +
                "</em>" +
              "</span>"
          )
          .join("") +
      "</div>" +
      '<div class="ai-body rd-ai">' + renderAiSections(item.ai) + "</div>";

    rdCurrentText = item.ai;
    const cp = mask.querySelector("#rdCopy");
    if (cp) cp.onclick = () => copyPlain(rdCurrentText);

    mask.hidden = false;
    // 关闭入场动画后再滚动，避免位移和淡入打架
    requestAnimationFrame(() => {
      mask.classList.add("on");
      scroll.scrollTop = 0;
    });
  }

  function closeReadingView() {
    const mask = $("#rdMask");
    if (!mask) return;
    mask.classList.remove("on");
    setTimeout(() => { mask.hidden = true; }, 200);
  }

  function copyPlain(text) {
    const done = () => toast("已复制");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, done);
      return;
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand("copy"); } catch (e) {}
    ta.remove();
    done();
  }

  /* ============================================================
     我的页：账号 + 测评记录
     ============================================================ */
  let authMode = "login"; // login | register

  /* ---------------- 头像上传 ---------------- */
  function avatarStorageKey() {
    return (isLoggedIn() && authUser)
      ? "tarot_avatar_u_" + authUser.username
      : "tarot_avatar_guest";
  }
  function getAvatar() {
    try { return localStorage.getItem(avatarStorageKey()) || ""; } catch (e) { return ""; }
  }
  function setAvatar(src) {
    try { localStorage.setItem(avatarStorageKey(), src); } catch (e) {}
    applyAvatar();
  }
  function clearAvatar() {
    try { localStorage.removeItem(avatarStorageKey()); } catch (e) {}
    applyAvatar();
    renderAccount();
  }
  /* 登录后把游客期设置的头像迁移到账号（之前只迁移记录、不迁移头像，导致登录后头像消失） */
  function migrateAvatar() {
    if (!isLoggedIn()) return;
    try {
      const g = localStorage.getItem("tarot_avatar_guest") || "";
      if (g && !localStorage.getItem(avatarStorageKey())) {
        localStorage.setItem(avatarStorageKey(), g);
        localStorage.removeItem("tarot_avatar_guest");
        applyAvatar();
      }
    } catch (e) {}
  }
  /* 把已存头像同步到账号卡与提问框（不破坏 file input） */
  function applyAvatar() {
    const a = getAvatar();
    document.querySelectorAll(".acct-avatar-photo").forEach((el) => {
      el.innerHTML = a ? '<img src="' + a + '" alt="头像">' : "👤";
    });
    const ak = document.querySelector(".aak-avatar");
    if (ak) ak.innerHTML = a ? '<img class="avatar-img" src="' + a + '" alt="头像">' : "👻";
  }
  function avatarBlockHTML() {
    const a = getAvatar();
    return (
      '<label class="acct-avatar" title="点击上传头像">' +
        '<span class="acct-avatar-photo">' + (a ? '<img src="' + a + '" alt="头像">' : "👤") + "</span>" +
        '<input type="file" class="avatar-input" accept="image/*" hidden>' +
      "</label>"
    );
  }
  function handleAvatarFile(file) {
    if (!file) return;
    const rd = new FileReader();
    rd.onload = function () {
      const img = new Image();
      img.onload = function () {
        const max = 256;
        let w = img.width, h = img.height;
        const s = Math.min(max / w, max / h);
        w = Math.round(w * s); h = Math.round(h * s);
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const cctx = c.getContext("2d");
        cctx.fillStyle = "#221b3d"; // 透明 PNG 兜底底色，避免 jpeg 导出后变黑块
        cctx.fillRect(0, 0, w, h);
        cctx.drawImage(img, 0, 0, w, h);
        let src = c.toDataURL("image/jpeg", 0.82);
        setAvatar(src);
        renderAccount();
        toast("头像已更新 ✦");
      };
      img.onerror = function () { toast("图片读取失败"); };
      img.src = rd.result;
    };
    rd.onerror = function () { toast("图片读取失败"); };
    rd.readAsDataURL(file);
  }

  function renderAccount() {
    const card = $("#accountCard");
    if (!card) return;
    if (isLoggedIn()) {
      const name = authUser ? authUser.username : "神秘人";
      card.innerHTML =
        '<div class="acct-profile">' +
          avatarBlockHTML() +
          '<div class="acct-info">' +
            '<div class="acct-name">' + esc(name) + "</div>" +
            '<div class="acct-meta">已登录 · 点数与记录已同步到云端，换设备登录即可继续</div>' +
            '<button class="acct-avatar-clear" id="avatarClear">移除头像</button>' +
          "</div>" +
        "</div>" +
        '<div class="acct-actions"><button class="acct-logout" id="authLogout">退出登录</button></div>';
    } else {
      const isReg = authMode === "register";
      card.innerHTML =
        avatarBlockHTML() +
        '<p class="acct-guest-tip">👻 现在还没登录——点数和记录只存在这台设备上，换设备或清缓存会丢。注册个账号就能云端同步（头像也会跟着账号走）。</p>' +
        '<div class="acct-form">' +
          '<input class="acct-input" id="authUser" maxlength="24" placeholder="用户名（至少 2 个字符）" autocomplete="username">' +
          '<input class="acct-input" id="authPass" type="password" maxlength="64" placeholder="密码（至少 4 位）" autocomplete="' + (isReg ? "new-password" : "current-password") + '">' +
          '<button class="acct-submit" id="authSubmit" data-mode="' + authMode + '">' + (isReg ? "注 册 并 登 录" : "登 录") + "</button>" +
          '<button class="acct-switch" id="authSwitch">' + (isReg ? "已有账号？去登录" : "没有账号？注册一个") + "</button>" +
        "</div>";
    }
    applyAvatar();
  }

  function doAuth(mode) {
    const u = ($("#authUser") && $("#authUser").value.trim()) || "";
    const p = ($("#authPass") && $("#authPass").value) || "";
    if (u.length < 2) { toast("用户名至少 2 个字符"); return; }
    if (p.length < 4) { toast("密码至少 4 位"); return; }
    const btn = $("#authSubmit");
    if (btn) { btn.disabled = true; btn.textContent = "处理中…"; }
    api("/api/auth/" + mode, { method: "POST", body: ownerBody({ username: u, password: p }) })
      .then((r) => {
        if (btn) btn.disabled = false;
        if (!r.ok) { toast((r.data && r.data.message) || "操作失败"); return; }
        saveAuth(r.data.token, r.data.user);
        migrateAvatar();
        migrateLocalData();
        renderAccount();
        refreshBalance();
        renderHistory();
        renderQuizHistory();
        showGreet(r.data.user.username);
        toast(mode === "register" ? "注册成功，欢迎你！" : "登录成功");
      })
      .catch(() => { if (btn) btn.disabled = false; toast("网络异常，请稍后重试"); });
  }

  function doLogout() {
    const t = authToken;
    clearAuth();
    if (t) api("/api/auth/logout", { method: "POST", body: { token: t } }).catch(() => {});
    renderAccount();
    refreshBalance();
    renderHistory();
    renderQuizHistory();
    toast("已退出登录，数据回到本机模式");
  }

  function renderMe() {
    renderAccount();
    renderHistory();
    renderQuizHistory();
  }

  /* ---- 测评结果记录 ---- */
  function loadQuizLocal() {
    try {
      const raw = localStorage.getItem(QUIZ_HIST_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }
  function persistQuizLocal(list) {
    try { localStorage.setItem(QUIZ_HIST_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function saveQuizResult(item) {
    if (!item) return;
    if (isLoggedIn()) {
      api("/api/quizzes", { method: "POST", body: ownerBody({ item: item }) })
        .then((r) => { if (r.ok) renderQuizHistory(); })
        .catch(() => {});
    } else {
      const list = loadQuizLocal();
      list.unshift(item);
      if (list.length > 50) list.length = 50;
      persistQuizLocal(list);
      renderQuizHistory();
    }
  }

  function deleteQuizResult(ts) {
    if (isLoggedIn()) {
      api("/api/quizzes?" + ownerQuery() + "&ts=" + encodeURIComponent(ts), { method: "DELETE" })
        .then((r) => { if (r.ok) renderQuizList(r.data.items || []); })
        .catch(() => {});
    } else {
      persistQuizLocal(loadQuizLocal().filter((h) => h.ts !== ts));
      renderQuizHistory();
    }
  }

  function renderQuizHistory() {
    if (isLoggedIn()) {
      api("/api/quizzes?" + ownerQuery())
        .then((r) => renderQuizList((r.ok && r.data.items) || []))
        .catch(() => renderQuizList(loadQuizLocal()));
    } else {
      renderQuizList(loadQuizLocal());
    }
  }

  function renderQuizList(list) {
    const wrap = $("#quizHistList");
    const empty = $("#quizHistEmpty");
    if (!wrap) return;
    if (!list || !list.length) {
      wrap.innerHTML = "";
      if (empty) empty.hidden = false;
      return;
    }
    if (empty) empty.hidden = true;
    wrap.innerHTML = list
      .map((h) =>
        '<div class="quiz-item">' +
          '<div class="quiz-item-top">' +
            '<span class="quiz-item-time">' + esc(fmtTime(h.ts)) + "</span>" +
            '<span class="quiz-item-mode">' + esc(h.mode === "short" ? "精简版" : "完整版") + "</span>" +
          "</div>" +
          '<div class="quiz-item-name"><span class="qi-ico">' + esc(h.icon || "🧪") + "</span>" + esc(h.testName) + "</div>" +
          '<div class="quiz-item-type">' + esc(h.resultType || "") + "</div>" +
          (h.summary ? '<div class="quiz-item-sum">' + esc(h.summary) + "</div>" : "") +
          '<button class="quiz-item-del" data-ts="' + h.ts + '">删除这条记录</button>' +
        "</div>"
      )
      .join("");
  }

  /* 登录/注册后，把本机已有的记录补传一次到云端（幂等去重） */
  function migrateLocalData() {
    if (!isLoggedIn()) return;
    const hist = loadHistory();
    if (hist && hist.length) {
      api("/api/history", { method: "POST", body: ownerBody({ items: hist }) }).catch(() => {});
    }
    const qz = loadQuizLocal();
    if (qz && qz.length) {
      api("/api/quizzes", { method: "POST", body: ownerBody({ items: qz }) }).catch(() => {});
    }
  }

  /* ============================================================
     大图弹窗
     ============================================================ */
  function openModal(item) {
    const c = item.card;
    const rev = item.reversed;
    const txt = rev ? c.rev : c.up;
    $("#modalBody").innerHTML =
      cardHTML(item) +
      '<div class="modal-detail">' +
        "<strong>" + esc(c.name) +
        (rev ? " · 逆位" : " · 正位") + "</strong><br>" + esc(txt) +
      "</div>";
    $("#modal").hidden = false;
    // 延迟翻面
    setTimeout(() => {
      const el = $(".card", $("#modalBody"));
      if (el) {
        el.classList.add("flipped");
        if (rev) el.classList.add("is-rev");
      }
    }, 90);
  }

  function closeModal() {
    $("#modal").hidden = true;
    $("#modalBody").innerHTML = "";
  }

  /* ============================================================
     事件绑定
     ============================================================ */
  function bind() {
    // 牌阵分类
    $("#spCats").addEventListener("click", (e) => {
      const b = e.target.closest(".sp-cat");
      if (!b || isDrawing) return;
      currentCat = b.dataset.cat;
      $$(".sp-cat").forEach((x) =>
        x.classList.toggle("active", x === b)
      );
      renderSpreadList();
      // 若当前牌阵不在该分类里，自动切到第一项
      const list = currentCat === "all"
        ? SPREADS
        : SPREADS.filter((s) => s.cat === currentCat);
      if (!list.some((s) => s.id === currentSpread.id) && list[0]) {
        setSpread(list[0].id);
      }
    });

    // 牌阵选择
    $("#spScroll").addEventListener("click", (e) => {
      const b = e.target.closest(".sp-item");
      if (!b) return;
      setSpread(b.dataset.spread);
    });

    // PC 端牌阵横滑增强：鼠标滚轮纵向→横向 + 按住拖拽（触屏仍走原生）
    (function () {
      const sc = $("#spScroll");
      if (!sc) return;
      // 1) 滚轮：纵向滚动转为横向（触控板横向手势 / 已到边界放行页面滚动不拦截）
      sc.addEventListener("wheel", (e) => {
        if (e.deltaX !== 0) return; // 触控板两指左右滑交给原生
        const canX = sc.scrollWidth - sc.clientWidth;
        if (canX <= 1) return;
        const atStart = sc.scrollLeft <= 0;
        const atEnd = sc.scrollLeft >= canX - 1;
        const dir = e.deltaY > 0 ? 1 : -1;
        if ((dir > 0 && atEnd) || (dir < 0 && atStart)) return;
        sc.scrollLeft += e.deltaY;
        e.preventDefault();
      }, { passive: false });
      // 2) 鼠标按住拖拽横滑。
      // 关键：绝不能用 setPointerCapture——它会把随后的 click 重定向到容器本身，
      // 导致选择牌阵的 e.target.closest('.sp-item') 取不到元素、无法选中。这里改用
      // window 级 mousemove/mouseup 跟踪拖动（光标移出容器也能继续），并保留 click 原目标。
      let md = false, mx = 0, ms = 0, dragged = false;
      sc.addEventListener("mousedown", (e) => {
        if (e.button !== 0) return;
        md = true; dragged = false; mx = e.clientX; ms = sc.scrollLeft;
        sc.classList.add("dragging");
      });
      window.addEventListener("mousemove", (e) => {
        if (!md) return;
        const dx = e.clientX - mx;
        if (Math.abs(dx) > 5) dragged = true;
        sc.scrollLeft = ms - dx;
      });
      window.addEventListener("mouseup", () => {
        if (!md) return; md = false; sc.classList.remove("dragging");
      });
      // 拖拽结束后吞掉紧随的那一次 click，避免误选牌阵；纯点击（未拖动）不吞、正常选中
      sc.addEventListener("click", (e) => {
        if (dragged) { e.stopPropagation(); e.preventDefault(); dragged = false; }
      }, true);
    })();

    // 抽牌
    $("#drawBtn").addEventListener("click", () => {
      if (isDrawing) return;
      if ($$("#resultZone .card").length && !$("#resetBtn").hidden) {
        resetTable();
        setTimeout(doDraw, 60);
      } else {
        doDraw();
      }
    });

    // 牌堆点击 = 抽牌
    $("#deck").addEventListener("click", () => {
      if (!isDrawing && $("#resultZone").children.length === 0) doDraw();
    });

    // 扇形牌堆：轻触自己抽一张
    const fanEl = $("#fan");
    if (fanEl) {
      fanEl.addEventListener("click", (e) => {
        const c = e.target.closest(".fan-card");
        if (c) drawFromFan(c);
      });
    }
    // 懒人按钮：帮我抽完
    const autoPickBtn = $("#autoPickBtn");
    if (autoPickBtn) autoPickBtn.addEventListener("click", autoPickAll);

    // 重抽
    $("#resetBtn").addEventListener("click", () => {
      if (isDrawing) return;
      resetTable();
      setTimeout(doDraw, 60);
    });

    // 一键全开
    $("#flipAllBtn").addEventListener("click", flipAll);

    // 解牌
    const aiBtn = $("#aiBtn");
    if (aiBtn) aiBtn.addEventListener("click", doLocalReading);
    const aiPro = $("#aiProBtn");
    if (aiPro) aiPro.addEventListener("click", startProReading);
    const aiKeyLink = $("#aiKeyLink");
    if (aiKeyLink) aiKeyLink.addEventListener("click", openAiSettings);
    const aiKeyBtn = $("#aiKeyBtn");
    if (aiKeyBtn) aiKeyBtn.addEventListener("click", openAiSettings);
    const aiAskSubmit = $("#aiAskSubmit");
    if (aiAskSubmit) aiAskSubmit.addEventListener("click", submitAsk);
    const aiAskSkip = $("#aiAskSkip");
    if (aiAskSkip) aiAskSkip.addEventListener("click", () => runReading([]));
    const aiEnh = $("#aiEnhanceBtn");
    if (aiEnh) aiEnh.addEventListener("click", doBrowserAiReading);
    // Enter 默认走免费本地解读
    const aiQ = $("#aiQuestion");
    if (aiQ) {
      aiQ.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && !aiBusy) doLocalReading();
      });
    }

    // 点数 / 购买
    const chip = $("#creditChip");
    if (chip) chip.addEventListener("click", () => openPayModal());
    const pmClose = $("#pmClose");
    if (pmClose) pmClose.addEventListener("click", closePayModal);
    const pmMask = $("#pmMask");
    if (pmMask) pmMask.addEventListener("click", closePayModal);
    const pmPlans = $("#pmPlans");
    if (pmPlans) {
      pmPlans.addEventListener("click", (e) => {
        const b = e.target.closest(".pm-plan");
        if (!b || b.disabled) return;
        buyPlan(b.dataset.plan);
      });
    }
    const pmRedeem = $("#pmRedeemBtn");
    if (pmRedeem) pmRedeem.addEventListener("click", redeemCode);
    // 输入框内回车即兑换
    const pmCodeInput = $("#pmCodeInput");
    if (pmCodeInput) {
      pmCodeInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") redeemCode();
      });
      // 自动规范化：粘贴带空格/小写也能识别
      pmCodeInput.addEventListener("input", () => {
        const v = pmCodeInput.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
        if (v !== pmCodeInput.value) pmCodeInput.value = v;
      });
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !$("#payModal").hidden) closePayModal();
    });

    // 卡牌点击：未翻开 → 翻开；已翻开 → 放大查看
    $("#resultZone").addEventListener("click", (e) => {
      const el = e.target.closest(".card");
      if (!el) return;
      const slot = el.closest(".card-slot");
      const idx = slot ? Number(slot.dataset.idx) : -1;
      if (idx < 0) return;

      if (!flipState[idx]) {
        flipCard(el, idx);
        return;
      }
      openModal(drawnCards[idx]);
    });

    $("#modalMask").addEventListener("click", closeModal);

    // 我的页：账号、点数、抽牌记录、测评记录
    $("#accountCard").addEventListener("click", (e) => {
      const submit = e.target.closest("#authSubmit");
      if (submit) { doAuth(submit.dataset.mode); return; }
      if (e.target.closest("#authSwitch")) {
        authMode = authMode === "login" ? "register" : "login";
        renderAccount();
        return;
      }
      if (e.target.closest("#authLogout")) { doLogout(); return; }
      if (e.target.closest("#avatarClear")) { clearAvatar(); return; }
    });
    // 头像文件选择（账号卡内 label 触发）
    document.addEventListener("change", (e) => {
      const t = e.target;
      if (t && t.classList && t.classList.contains("avatar-input")) {
        const file = t.files && t.files[0];
        if (file) handleAvatarFile(file);
      }
    });
    const meBuy = $("#meBuy");
    if (meBuy) meBuy.addEventListener("click", () => openPayModal());

    $("#historySearch").addEventListener("input", renderHistory);
    $("#clearHistory").addEventListener("click", () => {
      if (isLoggedIn()) {
        if (!confirm("确定要清空全部抽牌记录吗？此操作不可恢复。")) return;
        api("/api/history?" + ownerQuery() + "&all=1", { method: "DELETE" })
          .then((r) => { if (r.ok) renderHistoryList(r.data.items || []); })
          .catch(() => {});
        return;
      }
      if (!loadHistory().length) return;
      if (confirm("确定要清空全部抽牌记录吗？此操作不可恢复。")) {
        try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
        renderHistory();
      }
    });
    $("#historyList").addEventListener("click", (e) => {
      const del = e.target.closest(".hist-del");
      if (del) {
        deleteHistory(Number(del.dataset.ts));
        return;
      }
      const open = e.target.closest(".hist-open");
      if (open) {
        openReadingView(open.dataset.ts);
        return;
      }
      // 整卡也能点开（仅有解读的记录）
      const card = e.target.closest(".hist-item");
      if (card && card.classList.contains("has-ai")) {
        openReadingView(card.dataset.ts);
      }
    });
    $("#quizHistList").addEventListener("click", (e) => {
      const del = e.target.closest(".quiz-item-del");
      if (del) {
        deleteQuizResult(Number(del.dataset.ts));
      }
    });

    // 牌组切换
    $("#deckGrid").addEventListener("click", (e) => {
      const b = e.target.closest(".deck-card");
      if (!b) return;
      setDeck(b.dataset.deck);
    });

    // 标签切换
    $$(".tab").forEach((t) => {
      t.addEventListener("click", () => {
        const page = t.dataset.page;
        $$(".tab").forEach((x) => x.classList.toggle("active", x === t));
        $$(".page").forEach((p) =>
          p.classList.toggle("active", p.id === "page-" + page)
        );
        // 记住当前栏目：去付款会跳转刷新，回来时要回到这一页
        try { localStorage.setItem(TAB_KEY, page); } catch (e) {}
        if (page === "history") renderMe();
        if (page === "decks") renderDecks();
        if (page === "quiz" && window.TarotQuiz) {
          window.TarotQuiz.mount($("#quizRoot"), credits);
        }
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    });
  }

  /* ============================================================
     开场页：耿鬼投币
     ============================================================ */
  const INTRO_TEXT = "桀桀，想要知道未来的答案吗？那就给本大师投金币";

  function buildIntroStars() {
    const wrap = $("#introStars");
    if (!wrap) return;
    let s = "";
    for (let i = 0; i < 42; i++) {
      const size = (Math.random() * 2 + 1).toFixed(1);
      s +=
        "<i style='width:" + size + "px;height:" + size + "px;" +
        "top:" + (Math.random() * 100).toFixed(1) + "%;" +
        "left:" + (Math.random() * 100).toFixed(1) + "%;" +
        "animation-delay:" + (Math.random() * 3).toFixed(2) + "s'></i>";
    }
    wrap.innerHTML = s;
  }

  /* 逐字打字机 */
  function typeBubble(el, text, done) {
    el.innerHTML = "";
    let i = 0;
    const cursor = '<span class="cursor"></span>';
    const timer = setInterval(() => {
      i++;
      el.innerHTML = esc(text.slice(0, i)) + (i < text.length ? cursor : "");
      if (i >= text.length) {
        clearInterval(timer);
        if (done) done();
      }
    }, 68);
  }

  function enterMain() {
    const intro = $("#intro");
    if (!intro || intro.classList.contains("hide")) return;
    intro.classList.add("hide");
    document.body.classList.remove("locked");
    setTimeout(() => {
      intro.style.display = "none";
    }, 760);
  }

  function initIntro() {
    const intro = $("#intro");
    if (!intro) return;

    // 每次打开都展示开场页
    intro.style.display = "";
    intro.classList.remove("hide");
    document.body.classList.add("locked");
    buildIntroStars();

    const bubbleText = $("#bubbleText");
    const coinBtn = $("#coinBtn");
    const gengar = $("#introGengar");
    let started = false;
    let typing = false; // 是否正在打字
    let pokeCount = 0; // 被摸次数
    let busy = false; // 分支剧情进行中

    // 暴露重置函数（分支3结束后调用）
    resetPoke = function () {
      pokeCount = 0;
      busy = false;
      started = true;
    };

    // 耿鬼登场后开始打字
    setTimeout(() => {
      typeBubble(bubbleText, INTRO_TEXT, () => {
        started = true;
      });
    }, 1050);

    /* ---------- 点击耿鬼：递进对话 ---------- */
    const POKE_LINES = [
      "你怎么敢摸本大师！",
      "本大爷真是给你好脸色了，找打！",
      "还敢摸，哼哼，让我看看你是谁——",
      "让我看看你是谁，桀桀……"
    ];

    function pokeGengar() {
      // 打字进行中或剧情进行中不打断
      if (typing || busy || !started) return;
      pokeCount++;

      const idx = Math.min(pokeCount, POKE_LINES.length) - 1;
      const line = POKE_LINES[idx];

      // 反馈动画
      gengar.classList.remove("poked");
      void gengar.offsetWidth;
      gengar.classList.add("poked");

      // 前两次显示生气红光
      if (pokeCount <= 2) {
        gengar.classList.remove("angry");
        void gengar.offsetWidth;
        gengar.classList.add("angry");
      }
      if (navigator.vibrate) navigator.vibrate(18);

      // 打字显示对话
      typing = true;
      typeBubble(bubbleText, line, () => {
        typing = false;
        // 第 4 次后弹姓名框
        if (pokeCount >= POKE_LINES.length) {
          busy = true;
          setTimeout(openNameModal, 420);
        }
      });
    }

    /* ---------- 姓名输入弹窗 ---------- */
    const nameModal = $("#nameModal");
    const nameInput = $("#nameInput");

    function openNameModal() {
      if (!nameModal) return;
      nameModal.hidden = false;
      setTimeout(() => nameInput && nameInput.focus(), 320);
    }
    function closeNameModal() {
      if (nameModal) nameModal.hidden = true;
      if (!nameModal) return;
    }

    function confirmName() {
      const name = (nameInput.value || "").trim();
      if (!name) {
        nameInput.focus();
        nameInput.style.borderColor = "#e08a8a";
        setTimeout(() => (nameInput.style.borderColor = ""), 900);
        return;
      }
      try {
        localStorage.setItem("tarot_username", name);
      } catch (e) {}
      closeNameModal();
      showGreet(name);
      routeBranch(name); // 按名字走分支
    }

    if (nameModal) {
      $("#nameConfirm").addEventListener("click", confirmName);
      $("#nameCancel").addEventListener("click", () => {
        closeNameModal();
        bubbleText.innerHTML = esc("哼，不说也罢。本大师照样能算出你的命数。");
        $("#introTip").textContent = "桀桀桀…";
      });
      nameInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") confirmName();
      });
      // 点击遮罩不关闭（强制做选择）
    }

    gengar.addEventListener("click", pokeGengar);

    // 投币
    function throwCoin() {
      // 姓名弹窗打开或剧情进行中时禁止投币
      if (busy) return;
      if (nameModal && !nameModal.hidden) return;
      coinBtn.disabled = true;
      coinBtn.classList.add("shaking");
      const fly = $("#coinFly");

      // 抛币动画
      fly.classList.remove("fly");
      void fly.offsetWidth;
      fly.classList.add("fly");

      // 金币到达后：耿鬼吃掉
      setTimeout(() => {
        gengar.classList.add("eating");
        burstSparks();
        if (navigator.vibrate) navigator.vibrate(30);
      }, 950);

      // 反馈文字
      setTimeout(() => {
        const uname = getUsername();
        $("#introTip").textContent = "桀桀桀…金币到手，命运为你揭开！";
        bubbleText.innerHTML = esc(
          uname
            ? "让本大师看看，" + uname + "…嗯，有趣。"
            : "让本大师看看…嗯，有趣。"
        );
      }, 1400);

      // 进入主界面
      setTimeout(enterMain, 2300);
    }

    coinBtn.addEventListener("click", throwCoin);
  }

  /* 读取已保存的姓名 */
  function getUsername() {
    try {
      return localStorage.getItem("tarot_username") || "";
    } catch (e) {
      return "";
    }
  }

  /* 主界面问候条 */
  function showGreet(name) {
    const bar = $("#greetBar");
    if (!bar || !name) return;
    bar.innerHTML =
      "👻 桀桀，<b>" + esc(name) + "</b>，本大师等你很久了";
    bar.classList.add("show");
  }

  /* ============================================================
     姓名分支剧情
     ============================================================ */
  const MASTER_NAMES = ["葛业成", "不补西墙"];       // 分支1：主人
  const QUEEN_NAMES = ["孙雨若", "肉肉", "雨若"];     // 分支2：女王

  function routeBranch(name) {
    const bubbleText = $("#bubbleText");
    const introTip = $("#introTip");
    const intro = $("#intro");
    const gengar = $("#introGengar");
    const n = name.trim();

    const isMaster = MASTER_NAMES.some((x) => n === x || n.includes(x));
    const isQueen = QUEEN_NAMES.some((x) => n === x || n.includes(x));

    if (isMaster) {
      /* ---- 分支 1：主人大人 ---- */
      bubbleText.innerHTML = "";
      typeBubble(bubbleText, "no！主人大人我错了，小的这就给你占卜。", () => {
        introTip.textContent = "主人大人请稍等，马上开始占卜…";
        setTimeout(() => {
          enterMain();
          // 直接进入抽卡界面
          const drawTab = $('.tab[data-page="draw"]');
          if (drawTab) drawTab.click();
          setTimeout(() => {
            if (!isDrawing && $("#resultZone").children.length === 0) doDraw();
          }, 700);
        }, 1300);
      });
      return;
    }

    if (isQueen) {
      /* ---- 分支 2：若若女王大人 ---- */
      bubbleText.innerHTML = "";
      typeBubble(bubbleText, "no！！若若女王大人，原谅我吧！", () => {
        introTip.textContent = "若若女王大人息怒…";
        // 耿鬼缩小
        setTimeout(() => {
          gengar.classList.add("shrink");
          // 女王登场
          const qs = $("#queenShow");
          if (qs) qs.hidden = false;
          intro.classList.add("queen-mode");
          if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
        }, 700);
        // 女王说完话
        setTimeout(() => {
          bubbleText.innerHTML = "";
          typeBubble(
            bubbleText,
            "耿鬼它太调皮了，让我来给你看看未来吧～",
            () => {
              introTip.textContent = "若若女王大人为你占卜";
              setTimeout(() => {
                enterMain();
                const drawTab = $('.tab[data-page="draw"]');
                if (drawTab) drawTab.click();
                setTimeout(() => {
                  if (!isDrawing && $("#resultZone").children.length === 0) doDraw();
                }, 700);
              }, 1500);
            }
          );
        }, 2200);
      });
      return;
    }

    /* ---- 分支 3：小瘪三，吃影子球 ---- */
    bubbleText.innerHTML = "";
    typeBubble(
      bubbleText,
      "原来是小瘪三，我还以为是那俩位大人呢，吃我影子球！",
      () => {
        introTip.textContent = "桀桀桀！吃我一记影子球！";
        setTimeout(playShadowAttack, 500);
      }
    );
  }

  /* 影子球攻击特效（iOS 兼容：3 张 PNG 雪碧图 + canvas 逐帧绘制） */
  const ATTACK_FPS = 24;
  const ATTACK_FRAMES = 111;   // 总帧数
  const ATTACK_COLS = 12;      // 每张雪碧图列数
  const ATTACK_ROWS = 4;       // 每张雪碧图行数（48 帧/张，末张 15 帧）
  const ATTACK_FW = 240;       // 单帧宽
  const ATTACK_FH = 280;       // 单帧高
  const ATTACK_SHEETS = ["cards/attack-1.png", "cards/attack-2.png", "cards/attack-3.png"];
  let attackImgs = null;       // 预加载的 3 张雪碧图

  function loadAttackSheets() {
    if (attackImgs) return Promise.resolve(attackImgs);
    const imgs = ATTACK_SHEETS.map(() => null);
    const jobs = ATTACK_SHEETS.map(
      (src, i) =>
        new Promise((resolve) => {
          const im = new Image();
          im.crossOrigin = "anonymous";
          const done = () => { imgs[i] = im; resolve(); };
          // decode() 确保解码完成（iOS 上 onload 不代表已解码可绘制）
          if (im.decode) {
            im.onload = done;
            im.onerror = () => resolve();
            im.src = src;
            im.decode().then(done).catch(done);
          } else {
            im.onload = done;
            im.onerror = () => resolve();
            im.src = src;
          }
        })
    );
    return Promise.all(jobs).then(() => {
      if (imgs.every(Boolean)) attackImgs = imgs;
      return attackImgs;
    });
  }
  // 页面一打开就预加载，等用户走到攻击分支时早已就绪
  loadAttackSheets();

  /* ============ ✨ 华丽特效：粒子引擎 ============ */
  function makeFxEngine(cv) {
    if (!cv) return null;
    const ctx = cv.getContext("2d");
    let parts = [];
    let raf = 0;
    let last = 0;
    let running = false;

    function resize() {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      cv.width = Math.round(r.width * dpr);
      cv.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const HW = () => cv.getBoundingClientRect().width;
    const HH = () => cv.getBoundingClientRect().height;

    function spawn(kind, x, y) {
      const w = HW(), h = HH();
      if (kind === "charge") {
        // 向内聚拢的能量尘
        const a = Math.random() * Math.PI * 2;
        const d = Math.max(w, h) * (0.42 + Math.random() * 0.25);
        parts.push({
          x: w / 2 + Math.cos(a) * d,
          y: h * 0.30 + Math.sin(a) * d,
          tx: w / 2 + (Math.random() - 0.5) * 40,
          ty: h * 0.30 + (Math.random() - 0.5) * 40,
          t: 0, life: 0.5 + Math.random() * 0.4,
          r: 1.5 + Math.random() * 2.4,
          hue: 265 + Math.random() * 40, k: "charge",
        });
      } else if (kind === "spark") {
        // 爆裂火星
        const a = Math.random() * Math.PI * 2;
        const s = 3 + Math.random() * 9;
        parts.push({
          x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
          t: 0, life: 0.55 + Math.random() * 0.65,
          r: 1.6 + Math.random() * 3.2,
          hue: 275 + Math.random() * 60, k: "spark",
        });
      } else if (kind === "trail") {
        // 飞行拖尾
        parts.push({
          x: x + (Math.random() - 0.5) * 26,
          y: y + (Math.random() - 0.5) * 26,
          vx: (Math.random() - 0.5) * 1.2, vy: (Math.random() - 0.5) * 1.2,
          t: 0, life: 0.35 + Math.random() * 0.35,
          r: 2 + Math.random() * 3.4,
          hue: 270 + Math.random() * 50, k: "trail",
        });
      } else if (kind === "ember") {
        // 余烬飘落
        parts.push({
          x: Math.random() * HW(), y: -8 - Math.random() * 40,
          vx: (Math.random() - 0.5) * 0.5, vy: 0.5 + Math.random() * 1.3,
          t: 0, life: 1.4 + Math.random() * 1.2,
          r: 1.2 + Math.random() * 2.4,
          hue: 285 + Math.random() * 45, k: "ember",
        });
      }
    }

    function step(ts) {
      if (!running) return;
      if (!last) last = ts;
      const dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;
      const w = HW(), h = HH();
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.t += dt;
        const k = p.t / p.life;
        if (k >= 1) { parts.splice(i, 1); continue; }

        if (p.k === "charge") {
          p.x += (p.tx - p.x) * dt * 4.5;
          p.y += (p.ty - p.y) * dt * 4.5;
        } else {
          p.x += p.vx * dt * 60;
          p.y += p.vy * dt * 60;
          if (p.k === "ember") { p.vy += dt * 1.4; p.vx += Math.sin(p.t * 3 + p.r) * dt * 0.6; }
          else { p.vx *= 0.965; p.vy *= 0.965; }
        }

        const alpha = p.k === "charge" ? Math.min(1, k * 1.6) * (1 - k * 0.35)
                    : p.k === "ember" ? (1 - k) * 0.9
                    : 1 - k;
        const rad = p.r * (p.k === "spark" ? (1 + k * 0.9) : 1);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad * 3.2);
        g.addColorStop(0, "hsla(" + p.hue + ",100%,88%," + alpha + ")");
        g.addColorStop(0.4, "hsla(" + p.hue + ",100%,68%," + alpha * 0.7 + ")");
        g.addColorStop(1, "hsla(" + p.hue + ",100%,50%,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, rad * 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      raf = requestAnimationFrame(step);
    }

    return {
      start() { if (running) return; running = true; last = 0; resize(); raf = requestAnimationFrame(step); },
      stop() { running = false; cancelAnimationFrame(raf); ctx.clearRect(0, 0, HW(), HH()); },
      resize,
      spawn,
      clear() { parts = []; ctx.clearRect(0, 0, HW(), HH()); },
    };
  }

  function playShadowAttack() {
    const intro = $("#intro");
    const canvas = $("#shadowAttack");
    const gengar = $("#introGengar");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const fx = makeFxEngine($("#fxCanvas"));
    const fxRing = $("#fxRing"), fxRing2 = $("#fxRing2");
    const fxCharge = $("#fxCharge"), fxLines = $("#fxLines");
    const fxSpeed = $("#fxSpeed"), fxBurst = $("#fxBurst");
    const fxFlash = $("#fxFlash"), fxVignette = $("#fxVignette");
    const fxDamage = $("#fxDamage");

    /* 位置自适应：所有特效层对齐原耿鬼的实际位置（含大小），
       保证动画与原耿鬼形象完全重合 */
    function alignFxToGengar() {
      const introRect = intro.getBoundingClientRect();
      const gRect = gengar.getBoundingClientRect();
      // 耿鬼中心相对开场页的百分比
      const cxPct = ((gRect.left + gRect.width / 2 - introRect.left) / introRect.width) * 100;
      const cyPct = ((gRect.top + gRect.height / 2 - introRect.top) / introRect.height) * 100;
      // 以耿鬼尺寸为基准的特效尺度
      const sizePx = Math.max(gRect.width, gRect.height);
      const els = [canvas, fxRing, fxRing2, fxCharge, fxBurst, fxDamage];
      const scaleMap = {
        [canvas.id]: 2.4,   // 动画画布比耿鬼略大（球飞出画面）
        fxRing: 1.55, fxRing2: 1.15, fxCharge: 1.9, fxBurst: 1.7,
      };
      els.forEach((el) => {
        if (!el) return;
        el.style.left = cxPct + "%";
        el.style.top = cyPct + "%";
      });
      // 全屏层（速度线/冲击条）用 CSS 变量对齐中心
      intro.style.setProperty("--fx-x", cxPct + "%");
      intro.style.setProperty("--fx-y", cyPct + "%");
      // 画布尺寸对齐耿鬼视觉尺度
      canvas.style.width = Math.round(sizePx * 2.4) + "px";
      canvas.style.height = Math.round(sizePx * 2.4) + "px";
      // 各层圆形特效按比例设定尺寸
      const setSize = (el, k) => {
        if (!el) return;
        const s = Math.round(sizePx * k);
        el.style.width = s + "px";
        el.style.height = s + "px";
        el.style.margin = "0";
      };
      setSize(fxRing, 1.55); setSize(fxRing2, 1.15);
      setSize(fxCharge, 1.9); setSize(fxBurst, 1.7);
      // 速度线/闪光/暗角覆盖全屏（无需定位）
      if (fx) fx.resize();
    }
    alignFxToGengar();
    window.addEventListener("resize", alignFxToGengar);

    function fire(el) {
      if (!el) return;
      el.classList.remove("on");
      void el.offsetWidth; // 重排以重启动画
      el.classList.add("on");
    }

    // 耿鬼蓄力抖动
    gengar.classList.add("bounce");
    if (navigator.vibrate) navigator.vibrate([30, 20, 60]);

    let rafId = 0;
    let startTs = 0;
    function HW2() { return canvas.getBoundingClientRect().width; }
    function HH2() { return canvas.getBoundingClientRect().height; }
    function drawFrame(ts) {
      if (!attackImgs) return;
      if (!startTs) startTs = ts;
      const idx = Math.min(ATTACK_FRAMES - 1, Math.floor(((ts - startTs) / 1000) * ATTACK_FPS));
      const sheetIdx = Math.floor(idx / (ATTACK_COLS * ATTACK_ROWS));
      const inSheet = idx - sheetIdx * ATTACK_COLS * ATTACK_ROWS;
      const sx = (inSheet % ATTACK_COLS) * ATTACK_FW;
      const sy = Math.floor(inSheet / ATTACK_COLS) * ATTACK_FH;
      const sheet = attackImgs[sheetIdx];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (sheet) ctx.drawImage(sheet, sx, sy, ATTACK_FW, ATTACK_FH, 0, 0, canvas.width, canvas.height);
      // 飞行途中持续吐拖尾
      if (idx > 4 && idx < 80 && fx) {
        fx.spawn("trail", HW2() / 2 + (Math.random() - 0.5) * 30, HH2() * 0.30 + (Math.random() - 0.5) * 30);
      }
      if (idx < ATTACK_FRAMES - 1) rafId = requestAnimationFrame(drawFrame);
    }

    /* ---- 阶段一：蓄力（0 ~ 1400ms）---- */
    if (fx) {
      fx.start();
      fx.spawn("charge", 0, 0);
      fx.spawn("charge", 0, 0);
      fx.spawn("charge", 0, 0);
    }
    setTimeout(() => fire(fxCharge), 60);
    setTimeout(() => fire(fxRing), 120);
    setTimeout(() => fire(fxRing2), 220);
    // 持续吸入能量尘
    const chargeTimer = setInterval(() => {
      if (fx) { fx.spawn("charge", 0, 0); fx.spawn("charge", 0, 0); }
    }, 90);
    setTimeout(() => clearInterval(chargeTimer), 1400);

    /* ---- 阶段二：发射（~1400ms 耿鬼吐球）---- */
    loadAttackSheets().then(() => {
      setTimeout(() => {
        intro.classList.add("attacking");
        canvas.classList.add("playing");
        startTs = 0;
        rafId = requestAnimationFrame(drawFrame);
        // 发射瞬间：速度线 + 冲击条
        fire(fxLines);
        fire(fxSpeed);
        if (navigator.vibrate) navigator.vibrate([50, 30, 90]);
        if (fx) {
          for (let i = 0; i < 22; i++) fx.spawn("spark", HW2() / 2, HH2() * 0.30);
        }
      }, 600);
    });

    /* ---- 阶段三：命中爆裂（~2200ms）---- */
    setTimeout(() => {
      // 多层爆裂
      fire(fxBurst);
      fire(fxFlash);
      fire(fxVignette);
      if (fxDamage) {
        fxDamage.textContent = "-" + (800 + Math.floor(Math.random() * 1900));
        fire(fxDamage);
      }
      intro.classList.add("shake");
      if (navigator.vibrate) navigator.vibrate([90, 45, 140]);
      // 碎星飞散
      if (fx) {
        const bx = HW2() / 2, by = HH2() * 0.5;
        for (let i = 0; i < 48; i++) fx.spawn("spark", bx, by);
      }
      setTimeout(() => intro.classList.remove("shake"), 560);
      // 余烬飘落
      if (fx) {
        let em = 0;
        const emberTimer = setInterval(() => {
          fx.spawn("ember", 0, 0);
          if (++em > 26) clearInterval(emberTimer);
        }, 70);
      }
    }, 2200);

    /* ---- 阶段四：收尾（5200ms）---- */
    setTimeout(() => {
      cancelAnimationFrame(rafId);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.classList.remove("playing");
      intro.classList.remove("attacking", "shake", "queen-mode");
      gengar.classList.remove("bounce", "angry", "eating", "poked", "shrink");
      const qs = $("#queenShow");
      if (qs) qs.hidden = true;
      // 特效层复位
      [fxCharge, fxRing, fxRing2, fxLines, fxSpeed, fxBurst, fxFlash, fxVignette, fxDamage]
        .forEach((el) => el && el.classList.remove("on"));
      if (fx) { fx.clear(); fx.stop(); }

      const bubbleText = $("#bubbleText");
      $("#introTip").textContent = "桀桀桀…";
      const coinBtn = $("#coinBtn");
      coinBtn.disabled = false;
      coinBtn.classList.remove("shaking");
      typeBubble(bubbleText, INTRO_TEXT);
      resetPoke();
    }, 5200);
  }

  /* 金币爆开粒子 */
  function burstSparks() {
    const host = $("#introGengar");
    if (!host) return;
    for (let i = 0; i < 12; i++) {
      const sp = document.createElement("span");
      sp.className = "coin-spark";
      const a = (Math.PI * 2 * i) / 12;
      sp.style.setProperty("--dx", Math.cos(a) * (60 + Math.random() * 40) + "px");
      sp.style.setProperty("--dy", Math.sin(a) * (60 + Math.random() * 40) + "px");
      host.appendChild(sp);
      void sp.offsetWidth;
      sp.classList.add("burst");
      setTimeout(() => sp.remove(), 800);
    }
  }

  /* ============================================================
     初始化
     ============================================================ */
  function init() {
    loadAuth();
    loadDeck();
    renderDecks();
    renderSpreadCats();
    renderSpreadList();
    setSpread(currentSpread.id);
    bind();
    renderMe();
    // 牌堆背面也用耿鬼
    if (window.GengarBack) {
      $$("#deck .pile-card").forEach((el) => {
        el.innerHTML = window.GengarBack;
      });
      preloadGengarBack();   // 提前缓存卡背图，洗牌/抽牌时不再空白闪烁
    }

    // 付费返回：跳过开场动画，直接回到原界面并恢复付款前抽好的牌
    const backFromPay = handleReturnFromPay();
    if (backFromPay) {
      enterMain();
      // 支付跳转会刷新页面，这里恢复付款前抽好的牌，用户不必重抽
      try {
        if (!restoreDraft()) {
          console.warn("[tarot] 未能恢复付款前的牌面草稿");
        }
      } catch (e) {
        console.warn("[tarot] 恢复牌面失败", e);
      }
    } else {
      initIntro();
    }

    // 已登记过姓名则显示问候条
    const uname = getUsername();
    if (uname) showGreet(uname);

    // 设备标识（历史记录归属用）
    getDeviceId();
    // AI 深度解读：按本机保存的密钥状态刷新按钮文案
    paintAiKeyBtn();

    // 心理测试模块：先注入它需要的网络与点数钩子，再恢复界面
    if (window.TarotQuiz) {
      window.TarotQuiz.setHooks({
        api: api,
        getDeviceId: getDeviceId,
        getToken: getToken,
        credits: credits,
        onCreditsChange: (n) => { paintCredits(n); refreshBalance(); },
        saveResult: (item) => saveQuizResult(item),
      });
    }

    paintAiKeyBtn();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* 暴露给其它模块（如心理测试）复用的界面能力 */
  window.TarotApp = {
    toast: (m) => toast(m),
    openPayModal: () => openPayModal(),
    openAiSettings: () => openAiSettings(),
    refreshBalance: () => refreshBalance(),
    getCredits: () => credits,
    isLoggedIn: () => isLoggedIn(),
    saveQuizResult: (item) => saveQuizResult(item),
  };

  /* ============================================================
     iOS / 移动端细节处理
     ============================================================ */
  /* 键盘弹出时收起底部导航：iOS 会把 fixed 元素一起顶上去，挡住正在输入的框 */
  (function () {
    let timer = null;
    document.addEventListener("focusin", (e) => {
      const el = e.target;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA")) {
        clearTimeout(timer);
        document.body.classList.add("kb-open");
      }
    });
    document.addEventListener("focusout", () => {
      // 输入框之间切换会先 blur 再 focus，延迟一下避免导航栏闪动
      clearTimeout(timer);
      timer = setTimeout(() => document.body.classList.remove("kb-open"), 140);
    });
  })();

  /* iOS 上从 bfcache 返回（比如付款跳转后按返回键）时，页面不会重新执行 init，
     这里监听 pageshow 把丢失的界面补回来 */
  window.addEventListener("pageshow", (e) => {
    if (!e.persisted) return;
    try {
      const tab = localStorage.getItem(TAB_KEY) || "draw";
      const btn = document.querySelector('.tab[data-page="' + tab + '"]');
      if (btn) btn.click();
    } catch (err) {}
  });
})();

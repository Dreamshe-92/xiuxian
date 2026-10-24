/**
 * balance/breakthrough.js — 突破公式与境界阶梯（完整版，需求确认第二轮）
 * 公式（确认弹窗明示）：最终率 = 基础率(随境界递减) × 修为系数(火候) × 感悟系数 + 命格机缘 - 心魔惩罚
 * 失败：修为×0.85、感悟-20、连败+1；连败≥3 生心魔。成功：六维+5、+25点；筑基大突破寿元+100载。
 */
(function () {
  'use strict';
  Xuxian.data.balance = Xuxian.data.balance || {};

  Xuxian.data.balance.breakthrough = {
    /** 境界阶梯（index 0~4；修为上限按境界递增） */
    realms: [
      { name: '炼气初期', xiuWeiMax: 500 },
      { name: '炼气中期', xiuWeiMax: 800 },
      { name: '炼气后期', xiuWeiMax: 1200 },
      { name: '炼气圆满', xiuWeiMax: 1800 },
      { name: '筑基初期', xiuWeiMax: 3000, isMajor: true }, // 第一幕终点
    ],
    ganWuMax: 200,          // 感悟上限（全程固定）
    qiCost: 20,             // 每次突破灵气消耗

    /** 三档火候（修为进度门槛 + 修为系数） */
    stages: [
      { id: 'forced',   name: '强行突破', progressMin: 0.6, progressMult: 0.95, desc: '勉强摸到门槛，风险最高。' },
      { id: 'normal',   name: '常规突破', progressMin: 0.8, progressMult: 1.0,  desc: '根基较稳，多数修士的出手时机。' },
      { id: 'perfect',  name: '圆满突破', progressMin: 1.0, progressMult: 1.05, ganWuMin: 50, desc: '火候最足，最稳妥的破关时机。' },
    ],

    /** 成功率公式参数 */
    baseRate: (realmIndex) => 0.579 - realmIndex * 0.03,  // 境界越高越难
    ganWuMult: (ganWu, ganWuMax) => 1 + Math.min(0.5, (ganWu / ganWuMax) * 0.5),
    xinMoPenalty: 0.10,

    /** 失败代价 */
    failXiuWeiMult: 0.85,   // 修为保留比例
    failGanWuLoss: 20,
    failStreakToXinMo: 3,

    /** 命格对修炼/突破的加成（id → 效果；M2 生效子集） */
    fateEffects: {
      chuXin:    { ganWuMult: 1.05 },
      qinNeng:   { xiuWeiMult: 1.03 },
      xinKuan:   { regenMult: 1.05 },
      mengDao:   { ganWuMult: 1.05 },
      lingTai:   { ganWuMult: 1.10 },
      juLing:    { qiRegenMult: 1.05 },
      jingShui:  { xiuWeiMult: 1.08 },
      daoGu:     { xiuWeiMult: 1.10 },
      daoXinTM:  { ganWuMult: 1.15, xinMoResolveHalf: true },
      xinShou:   { breakthroughBonus: 0.015 }, // 新手保护：突破 +1.5%
      yueZhuo:   { failStreakBonus: 0.02 },   // 越挫越勇：连败后下次 +2%
    },

    /** 冲关回响叙事模板（{name}占位；降级版文案，M5 接 AI 生成） */
    narration: {
      success: [
        '{name}于静室中吐纳周天，滞涩的瓶颈如春冰初泯。灵力在经脉中流转渐趋圆融——境界，稳了。',
        '并无惊天异象。只是某一刻，{name}忽觉天地灵气亲近了几分，呼吸之间自成节律。破境，水到渠成。',
        '{name}盘坐良久，额头沁出细汗又缓缓收干。再睁眼时，眸中神光较先前沉凝了一分。',
      ],
      successMajor: '{name}灵台霎时澄明，丹田内灵力凝而不散——筑基功成！周身气机焕然一新，寿数亦随之绵长。此界修仙之门，才真正为你敞开。',
      fail: [
        '冲关之势在最后一瞬溃散，灵力逆乱冲撞经脉。{name}闷哼一声，气息萎靡了几分——败了，但道还在。',
        '就差一线。{name}强行收功，额角冷汗涔涔。此次火候未至，强求不得。',
      ],
      xinMoBorn: '连败三日，心魔滋生。夜半静修时，总有杂念如藤蔓缠上灵台……（修炼收益减半，需以感悟冲刷心魔）',
    },
  };
})();

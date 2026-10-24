/**
 * balance/cultivation-rates.js — 修炼速率表（状态式闭关，需求确认第二轮）
 * 全部"每分钟"速率；数值为初版（M5 平衡轮校准），改表不改代码。
 */
(function () {
  'use strict';
  Xuxian.data.balance = Xuxian.data.balance || {};

  Xuxian.data.balance.cultivationRates = {
    /** 闭关产出（受灵根 speedMult、心魔、瓶颈修正） */
    xiuWeiPerMin: 90,     // 修为/分钟（基础）
    ganWuPerMin: 3,       // 感悟/分钟（基础）

    /** 资源 */
    qiUsePerMin: 15,      // 闭关时灵气消耗/分钟
    qiRegenPerMin: 6,     // 灵气回复/分钟（恒定，含闭关中）
    qiMaxBase: 240,       // 灵气池上限（初版固定；后续随境界/设施成长）
    lifespanUsePerMin: 0.1, // 闭关寿元消耗（载/分钟）

    /** 修正系数 */
    bottleneckAbove: 0.8,   // 修为进度 ≥80% 进入瓶颈
    bottleneckMult: 0.5,    // 瓶颈期修为收益 ×0.5（界面明示"建议外出历练"）
    xinMoMult: 0.5,         // 心魔状态修炼收益 ×0.5
    xinMoResolveCost: 50,   // 化解心魔消耗感悟（道心通明命格减半）
    lifespanRedLine: 10,    // 寿元余量红线（载）：低于即强制停止闭关

    /** 离线结算 */
    offlineEchoThresholdSec: 60, // 离开超过该秒数，回归时弹"闭关回响"
  };
})();

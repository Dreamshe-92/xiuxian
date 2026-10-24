/**
 * systems/stats/AttributeCalc.js — 六维 → 派生属性（M2 展示用，M3 战斗接入）
 * 六维：体魄/力道/灵力/根骨/身法/神识；公式初版集中在此，改公式只改这个文件。
 */
(function () {
  'use strict';

  Xuxian.systems.stats = Xuxian.systems.stats || {};

  Xuxian.systems.stats.AttributeCalc = {
    /** 派生属性（输入六维对象） */
    derive(attr) {
      return {
        hpMax: 100 + (attr['体魄'] || 0) * 20,   // 气血上限
        mpMax: 60 + (attr['灵力'] || 0) * 18,    // 法力上限
        atk: 10 + (attr['力道'] || 0) * 2,       // 物攻
        def: 5 + (attr['根骨'] || 0) * 1.5,      // 物防
        spd: 5 + (attr['身法'] || 0) * 1.2,      // 速度
        sense: 5 + (attr['神识'] || 0) * 1.2,    // 神识强度
      };
    },
  };
})();

/**
 * systems/combat/AutoBattleAI.js — 自动战斗策略（需求确认第一轮·首版极简）
 * 优先级：血量<30% 防御 → 有可捕捉目标且血量<50% 用捕捉 → 法力够用神通 → 普攻。
 * 策略查表不改代码（此处函数即"策略表"，调整只改本文件）。
 */
(function () {
  'use strict';

  const T = () => Xuxian.data.tables.beasts;

  Xuxian.systems.combat.AutoBattleAI = {
    decide(session) {
      const p = session.player;
      const enemies = session.activeEnemies;
      const T2 = T();
      const weakest = enemies.reduce((lo, e) => (e.hp < lo.hp ? e : lo), enemies[0]);

      // ① 残局捕捉：只剩最后一只且可捕捉、血压到 65% 以下再出手（清场前抓=挨打白抓）
      if (enemies.length === 1 && session.catchable(weakest) && weakest.hp / weakest.hpMax < 0.65
          && p.mp >= T2.catchMpCost) {
        return { type: 'catch', target: weakest };
      }

      // ② 神通（法力足够，打血最低者速杀减伤）
      const blade = T2.playerSkills.find((s) => s.id === 'spirit_blade');
      if (blade && p.mp >= blade.mpCost) {
        return { type: 'skill', skillId: blade.id, target: weakest };
      }

      // ③ 普攻（打血量最低者——击杀一个少一份受击；可捕捉的留到最后压血再抓）
      if (enemies.length) return { type: 'attack', target: weakest };
      return { type: 'defend' };
    },
  };
})();

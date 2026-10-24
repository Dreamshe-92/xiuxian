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

      // ① 血线防御
      if (p.hp / p.hpMax < 0.3) return { type: 'defend' };

      // ② 捕捉时机：可捕捉目标且压到半血以下
      const catchTarget = enemies.find((e) => session.catchable(e) && e.hp / e.hpMax < 0.5);
      if (catchTarget && p.mp >= T().catchMpCost) return { type: 'catch', target: catchTarget };

      // ③ 神通（法力足够）
      const blade = T().playerSkills.find((s) => s.id === 'spirit_blade');
      if (blade && p.mp >= blade.mpCost) {
        const t = enemies.reduce((lo, e) => (e.hp < lo.hp ? e : lo), enemies[0]);
        return { type: 'skill', skillId: blade.id, target: t };
      }

      // ④ 普攻（打血量最低）
      if (enemies.length) {
        const t = enemies.reduce((lo, e) => (e.hp < lo.hp ? e : lo), enemies[0]);
        return { type: 'attack', target: t };
      }
      return { type: 'defend' };
    },
  };
})();

/**
 * entities/combat/CombatUnit.js — 战斗单位（统一结构：玩家/灵兽/敌方共用）
 * 战斗内字段快照，不打 GameState 原对象；攻击/受击/死亡判定集中于此。
 */
(function () {
  'use strict';
  Xuxian.entities = Xuxian.entities || {};

  class CombatUnit {
    /**
     * @param {Object} def {side:'ally'|'enemy', kind:'player'|'beast'|'wild', name, level,
     *                       hpMax, mpMax, atk, def, spd, speciesId?, catchable?}
     */
    constructor(def) {
      Object.assign(this, def);
      // 损耗保留：若构造时携带当前气血/法力则沿用（夹紧到上限），否则满状态
      if (def.hp != null) this.hp = Math.max(0, Math.min(def.hp, this.hpMax));
      else this.hp = this.hpMax;
      if (def.mp != null) this.mp = Math.max(0, Math.min(def.mp, this.mpMax));
      else this.mp = this.mpMax;
      this.alive = true;
      this.defending = false; // 本回合护体标记
      this.captured = false;  // 被捕捉离场标记
    }

    /** 受到伤害（护体减半）；返回实际伤害值 */
    takeDamage(raw) {
      if (!this.alive) return 0;
      const dmg = Math.max(1, Math.round(this.defending ? raw * 0.5 : raw));
      this.hp = Math.max(0, this.hp - dmg);
      if (this.hp <= 0) this.alive = false;
      return dmg;
    }

    spendMp(cost) {
      if (this.mp < cost) return false;
      this.mp -= cost;
      return true;
    }

    get canAct() { return this.alive && !this.captured; }
  }

  Xuxian.entities.CombatUnit = CombatUnit;
})();

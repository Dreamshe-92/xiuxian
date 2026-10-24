/**
 * entities/combat/Factories.js — 战斗单位工厂
 * makePlayerUnit：从 GameState（属性派生）；makeWildUnit：图鉴+等级缩放；
 * makeBeastUnit：灵兽袋档案 → 参战单位。数值公式集中此处，M5 平衡轮统一校准。
 */
(function () {
  'use strict';

  const T = () => Xuxian.data.tables.beasts;

  /** 等级缩放系数（攻防血蓝按线性，速度小幅） */
  const scale = (base, level) => ({
    hpMax: Math.round(base.hp * (1 + (level - 1) * 0.35)),
    mpMax: Math.round(base.mp * (1 + (level - 1) * 0.25)),
    atk: Math.round(base.atk * (1 + (level - 1) * 0.22)),
    def: Math.round(base.def * (1 + (level - 1) * 0.2)),
    spd: Math.round(base.spd * (1 + (level - 1) * 0.08)),
  });

  Xuxian.entities.CombatFactories = {
    /** 玩家战斗单位（六维派生；MVP 每场满状态出战——损耗保留制留给 M4 灵泉） */
    makePlayerUnit() {
      const gs = Xuxian.core.GameState.data;
      const p = gs.player || {};
      const s = gs.stats || { attributes: p.attributes || {} };
      const d = Xuxian.systems.stats.AttributeCalc.derive(s.attributes);
      return new Xuxian.entities.CombatUnit(Object.assign({
        side: 'ally', kind: 'player',
        name: p.name || '无名道友', level: 1,
        atk: Math.round(d.atk), def: Math.round(d.def), spd: Math.round(d.spd),
        hpMax: d.hpMax, mpMax: d.mpMax,
      }, {}));
    },

    /** 野外敌方单位（图鉴 id + 等级） */
    makeWildUnit(speciesId, level) {
      const sp = T().species.find((x) => x.id === speciesId) || T().species[0];
      const stats = scale(sp.base, level);
      return new Xuxian.entities.CombatUnit(Object.assign({
        side: 'enemy', kind: 'wild',
        name: sp.name, level, speciesId,
        species: sp,
      }, stats));
    },

    /** 我方灵兽参战单位（来自灵兽袋档案） */
    makeBeastUnit(record) {
      const stats = scale(record.base, record.level);
      return new Xuxian.entities.CombatUnit(Object.assign({
        side: 'ally', kind: 'beast',
        name: record.name, level: record.level, speciesId: record.speciesId,
        recordId: record.id,
      }, stats));
    },

    /** 玩家当前携带等级上限（捕捉/携带合法性） */
    carryLimit() {
      const idx = (Xuxian.core.GameState.data.stats || {}).realmIndex || 0;
      return (idx + 1) * T().carryPerRealm;
    },
  };
})();

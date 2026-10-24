/**
 * systems/spirit-beast/BeastParty.js — 灵兽袋管理（名册/出战位/首发/捕捉入袋/放生）
 * 数据宿主 GameState.data.beasts；容量与出战位对齐需求（名册 24 / 出战 6 / 首发 1）。
 */
(function () {
  'use strict';

  const LIMITS = { rosterMax: 24, partyMax: 6 };

  const BeastParty = {
    /** 懒初始化（M2 旧档兼容） */
    get() {
      const gs = Xuxian.core.GameState.data;
      if (!gs.beasts) gs.beasts = { roster: [], partyIds: [], starterId: null, nextId: 1 };
      return gs.beasts;
    },

    /** 捕捉入袋（BattleSession.settleConfirm 调用）：建档案、自动编入出战位（有余位时） */
    addCaptured(capture) {
      const bag = this.get();
      if (bag.roster.length >= LIMITS.rosterMax) return { ok: false, reason: 'roster-full' };
      const sp = Xuxian.data.tables.beasts.species.find((s) => s.id === capture.speciesId);
      const id = 'b' + (bag.nextId++);
      bag.roster.push({
        id, speciesId: capture.speciesId, name: capture.name, level: capture.level,
        base: sp ? sp.base : { hp: 60, mp: 40, atk: 10, def: 8, spd: 10 },
        aptitude: sp ? sp.aptitude : {}, growth: sp ? sp.growth : 1.0,
        capturedAt: Date.now(),
      });
      if (bag.partyIds.length < LIMITS.partyMax) bag.partyIds.push(id);
      if (!bag.starterId) bag.starterId = id; // 第一只自动设为首发
      return { ok: true, id };
    },

    getStarter() {
      const bag = this.get();
      if (!bag.starterId) return null;
      const rec = bag.roster.find((r) => r.id === bag.starterId);
      return rec && bag.partyIds.includes(rec.id) ? rec : null;
    },

    setStarter(id) {
      const bag = this.get();
      if (!bag.partyIds.includes(id)) return false;
      bag.starterId = id;
      return true;
    },

    /** 加入/移出出战位 */
    toggleParty(id) {
      const bag = this.get();
      const i = bag.partyIds.indexOf(id);
      if (i >= 0) {
        if (bag.starterId === id) bag.starterId = bag.partyIds.find((x) => x !== id) || null;
        bag.partyIds.splice(i, 1);
        return 'removed';
      }
      if (bag.partyIds.length >= LIMITS.partyMax) return 'party-full';
      bag.partyIds.push(id);
      if (!bag.starterId) bag.starterId = id;
      return 'added';
    },

    /** 放生（首发/出战位联动清理） */
    release(id) {
      const bag = this.get();
      const i = bag.roster.findIndex((r) => r.id === id);
      if (i < 0) return false;
      bag.roster.splice(i, 1);
      const pi = bag.partyIds.indexOf(id);
      if (pi >= 0) bag.partyIds.splice(pi, 1);
      if (bag.starterId === id) bag.starterId = bag.partyIds[0] || null;
      return true;
    },

    limits() { return LIMITS; },
  };

  Xuxian.systems.spiritBeast = Xuxian.systems.spiritBeast || {};
  Xuxian.systems.spiritBeast.BeastParty = BeastParty;
})();

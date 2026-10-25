/**
 * systems/inventory/Inventory.js — 储物袋与装备位
 * 数据宿主 GameState.data.inventory = { items: {id:count}, equipped: {槽位:itemId} }；
 * 格数=物品种类数（40 上限）；装备加成经 equipmentBonus() 供战斗工厂取用。
 */
(function () {
  'use strict';

  const T = () => Xuxian.data.tables.items;

  const Inventory = {
    get() {
      const gs = Xuxian.core.GameState.data;
      if (!gs.inventory) gs.inventory = { items: {}, equipped: {} };
      return gs.inventory;
    },

    def(id) { return T().defs.find((d) => d.id === id); },

    /** 入袋（数量）；袋满返回 false */
    add(id, count) {
      const inv = this.get();
      if (!inv.items[id] && Object.keys(inv.items).length >= T().bagMax) return false;
      inv.items[id] = (inv.items[id] || 0) + (count || 1);
      return true;
    },

    /** 使用消耗品：应用效果（灵气/气血/法力）并扣减 */
    use(id) {
      const inv = this.get();
      if (!inv.items[id]) return { ok: false, reason: 'none' };
      const def = this.def(id);
      if (!def || def.type !== 'consumable') return { ok: false, reason: 'not-consumable' };
      const gs = Xuxian.core.GameState.data;
      const e = def.effect;
      if (e.qi) gs.resources.qi = Math.min(gs.resources.qiMax, gs.resources.qi + e.qi);
      if (e.hpPct || e.mpPct) {
        const d = Xuxian.entities.CombatFactories.playerDerived();
        if (e.hpPct) gs.resources.hpCurrent = Math.min(d.hpMax, (gs.resources.hpCurrent || d.hpMax) + Math.round(d.hpMax * e.hpPct));
        if (e.mpPct) gs.resources.mpCurrent = Math.min(d.mpMax, (gs.resources.mpCurrent || d.mpMax) + Math.round(d.mpMax * e.mpPct));
      }
      inv.items[id] -= 1;
      if (inv.items[id] <= 0) delete inv.items[id];
      return { ok: true, name: def.name };
    },

    /** 穿戴（自动卸同槽旧装备回袋） */
    equip(id) {
      const inv = this.get();
      const def = this.def(id);
      if (!def || def.type !== 'equipment' || !inv.items[id]) return false;
      const old = inv.equipped[def.slot];
      inv.items[id] -= 1;
      if (inv.items[id] <= 0) delete inv.items[id];
      if (old) this.add(old, 1);
      inv.equipped[def.slot] = id;
      return true;
    },

    unequip(slot) {
      const inv = this.get();
      const id = inv.equipped[slot];
      if (!id) return false;
      delete inv.equipped[slot];
      this.add(id, 1);
      return true;
    },

    /** 装备加成合计（atk/def/spd/hpMax/mpMax）——战斗工厂与面板共用 */
    equipmentBonus() {
      const inv = this.get();
      const out = { atk: 0, def: 0, spd: 0, hpMax: 0, mpMax: 0 };
      Object.values(inv.equipped).forEach((id) => {
        const def = this.def(id);
        if (def && def.bonus) Object.keys(def.bonus).forEach((k) => { out[k] += def.bonus[k]; });
      });
      return out;
    },
  };

  Xuxian.systems.inventory = Xuxian.systems.inventory || {};
  Xuxian.systems.inventory.Inventory = Inventory;
})();

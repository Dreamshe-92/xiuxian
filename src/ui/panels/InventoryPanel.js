/**
 * ui/panels/InventoryPanel.js — 储物袋（物品使用 + 六装备位穿戴）
 * 数据走 systems/inventory/Inventory；操作即时存档。
 */
(function () {
  'use strict';

  Xuxian.ui.panels.InventoryPanel = {
    render(el, api) {
      this._el = el; this._api = api;
      this._draw();
    },

    _draw() {
      const Inv = Xuxian.systems.inventory.Inventory;
      const T = Xuxian.data.tables.items;
      const inv = Inv.get();
      const ids = Object.keys(inv.items);
      const bonus = Inv.equipmentBonus();

      this._el.innerHTML = `
        <div class="xl-step-tag"><span class="xl-kicker">洞府 · 储物袋</span></div>
        <div class="xl-row"><span class="xl-label">格</span>${ids.length} / ${T.bagMax}
          <span class="xl-sub-inline">装备加成：物攻+${bonus.atk} 物防+${bonus.def} 速度+${bonus.spd}</span></div>
        <div class="xl-sheet-title">装备位（六槽）</div>
        <div class="xl-equip-grid">
          ${T.slots.map((slot) => {
            const eqId = inv.equipped[slot];
            const def = eqId ? Inv.def(eqId) : null;
            return `
              <div class="xl-equip-slot ${def ? '' : 'empty'}" data-slot="${slot}">
                <div class="xl-equip-slot-name">${slot}</div>
                ${def
                  ? `<div class="xl-equip-item">${def.icon} ${def.name}</div>
                     <div class="xl-equip-bonus">${this._bonusText(def.bonus)}</div>
                     <button class="xl-btn xl-btn--compact xl-btn--ghost" data-unequip="${slot}">卸下</button>`
                  : '<div class="xl-equip-item xl-sub">空</div>'}
              </div>`;
          }).join('')}
        </div>
        <div class="xl-sheet-title" style="margin-top:14px;">随身物品</div>
        <div class="xl-inv-list">
          ${ids.length ? ids.map((id) => {
            const def = Inv.def(id);
            return `
              <div class="xl-inv-row">
                <div class="xl-inv-main">${def.icon} <b>${def.name}</b> ×${inv.items[id]}
                  <div class="xl-sub-inline">${def.desc || ''}</div></div>
                <div class="xl-beast-acts">
                  ${def.type === 'consumable'
                    ? `<button class="xl-btn xl-btn--compact" data-use="${id}">使用</button>`
                    : `<button class="xl-btn xl-btn--compact" data-equip="${id}">穿戴</button>`}
                </div>
              </div>`;
          }).join('') : '<div class="xl-sub" style="text-align:center; padding:14px 0;">袋中空空——占卜与战斗会带来收获。</div>'}
        </div>
        <div class="xl-btn-row">
          <button class="xl-btn xl-btn--ghost" id="inv-back">返回洞府</button>
        </div>
      `;

      this._el.querySelector('#inv-back').addEventListener('click', () => this._api.close());
      this._el.querySelectorAll('[data-use]').forEach((b) => b.addEventListener('click', () => {
        const r = Inv.use(b.dataset.use);
        if (r.ok) {
          Xuxian.core.SaveManager.save();
          Xuxian.core.EventBus.emit(Xuxian.config.constants.EVENTS.CULT_UPDATED);
          Xuxian.core.EventBus.emit(Xuxian.config.constants.EVENTS.SHOW_TOAST, `服下「${r.name}」`);
          this._draw();
        }
      }));
      this._el.querySelectorAll('[data-equip]').forEach((b) => b.addEventListener('click', () => {
        if (Inv.equip(b.dataset.equip)) {
          Xuxian.core.SaveManager.save();
          Xuxian.core.EventBus.emit(Xuxian.config.constants.EVENTS.SHOW_TOAST, '已穿戴');
          this._draw();
        }
      }));
      this._el.querySelectorAll('[data-unequip]').forEach((b) => b.addEventListener('click', () => {
        if (Inv.unequip(b.dataset.unequip)) {
          Xuxian.core.SaveManager.save();
          this._draw();
        }
      }));
    },

    _bonusText(bonus) {
      const map = { atk: '物攻', def: '物防', spd: '速度', hpMax: '气血上限', mpMax: '法力上限' };
      return Object.keys(bonus || {}).map((k) => `+${bonus[k]}${map[k] || k}`).join(' ');
    },
  };
})();

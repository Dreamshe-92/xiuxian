/**
 * ui/panels/BeastBagPanel.js — 灵兽袋（名册/出战位/首发/放生）
 * 数据走 systems/spiritBeast/BeastParty；操作即时存档。
 */
(function () {
  'use strict';

  Xuxian.ui.panels.BeastBagPanel = {
    render(el, api) {
      this._el = el; this._api = api;
      this._draw();
    },

    _draw() {
      const bag = Xuxian.systems.spiritBeast.BeastParty.get();
      const L = Xuxian.systems.spiritBeast.BeastParty.limits();
      const carry = Xuxian.entities.CombatFactories.carryLimit();
      const el = this._el;

      el.innerHTML = `
        <div class="xl-step-tag"><span class="xl-kicker">洞府 · 灵兽袋</span></div>
        <div class="xl-row"><span class="xl-label">名册</span>${bag.roster.length} / ${L.rosterMax}
          <span class="xl-sub-inline">出战 ${bag.partyIds.length} / ${L.partyMax} · 携带等级上限 Lv.${carry}</span></div>
        <div class="xl-beast-list">
          ${bag.roster.length ? bag.roster.map((r) => this._row(r, bag)).join('')
            : '<div class="xl-sub" style="text-align:center; padding:20px 0;">灵兽袋尚空 —— 外出青溪坡，寻觅第一只伙伴。</div>'}
        </div>
        <div class="xl-btn-row">
          <button class="xl-btn xl-btn--ghost" id="bb-close">返回洞府</button>
        </div>
      `;
      el.querySelector('#bb-close').addEventListener('click', () => this._api.close());
      el.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => {
        const id = b.dataset.id;
        const act = b.dataset.act;
        const BP = Xuxian.systems.spiritBeast.BeastParty;
        if (act === 'party') BP.toggleParty(id);
        if (act === 'starter') BP.setStarter(id);
        if (act === 'release' && confirm('放生后不可找回，确认？')) BP.release(id);
        Xuxian.core.SaveManager.save();
        this._draw();
      }));
    },

    _row(r, bag) {
      const inParty = bag.partyIds.includes(r.id);
      const isStarter = bag.starterId === r.id;
      const overLimit = r.level > Xuxian.entities.CombatFactories.carryLimit();
      return `
        <div class="xl-beast-row ${inParty ? '' : 'idle'}">
          <div class="xl-beast-main">
            <b>${r.name}</b> <span class="xl-sub-inline">Lv.${r.level}${overLimit ? ' · 超上限(不可出战捕捉自见)' : ''}</span>
            ${isStarter ? '<span class="xl-beast-tag starter">首发</span>' : ''}
            ${inParty ? '<span class="xl-beast-tag party">出战中</span>' : ''}
          </div>
          <div class="xl-beast-acts">
            <button class="xl-btn xl-btn--compact" data-act="party" data-id="${r.id}">${inParty ? '撤下' : '出战'}</button>
            <button class="xl-btn xl-btn--compact" data-act="starter" data-id="${r.id}" ${inParty && !isStarter ? '' : 'disabled'}>设首发</button>
            <button class="xl-btn xl-btn--compact xl-btn--ghost" data-act="release" data-id="${r.id}">放生</button>
          </div>
        </div>`;
    },
  };
})();

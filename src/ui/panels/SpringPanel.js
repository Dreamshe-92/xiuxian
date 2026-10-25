/**
 * ui/panels/SpringPanel.js — 灵眼之泉（投灵石回满气血法力）
 * 消耗 = 按缺失比例计费（约 20 点缺失 ≈ 1 灵石，向上取整）；满状态禁用。
 */
(function () {
  'use strict';

  Xuxian.ui.panels.SpringPanel = {
    render(el, api) {
      this._el = el; this._api = api;
      this._draw();
    },

    _draw() {
      const gs = Xuxian.core.GameState.data;
      const res = gs.resources || {};
      const d = Xuxian.entities.CombatFactories.playerDerived();
      const hp = res.hpCurrent != null ? res.hpCurrent : d.hpMax;
      const mp = res.mpCurrent != null ? res.mpCurrent : d.mpMax;
      const hpMissing = Math.max(0, d.hpMax - hp);
      const mpMissing = Math.max(0, d.mpMax - mp);
      const cost = Math.ceil((hpMissing + mpMissing) / 20);
      const stones = res.stones || 0;
      const full = hpMissing + mpMissing <= 0;

      this._el.innerHTML = `
        <div class="xl-step-tag"><span class="xl-kicker">洞府 · 灵眼之泉</span></div>
        <p class="xl-hint">石室内泉声极轻，灵雾贴着池沿升起。投入灵石，泉眼便牵引洞府灵气回护周身。</p>
        <div class="xl-sheet" style="text-align:left;">
          <div class="xl-row"><span class="xl-label">气血</span>${Math.round(hp)} / ${d.hpMax}</div>
          <div class="xl-row"><span class="xl-label">法力</span>${Math.round(mp)} / ${d.mpMax}</div>
          <div class="xl-row"><span class="xl-label">灵石</span>💰 ${stones}</div>
          <div class="xl-row"><span class="xl-label">此次耗费</span>${full ? '—' : '💰 ' + cost + ' 灵石'}</div>
        </div>
        <button class="xl-btn" id="sp-heal" ${(!full && stones >= cost) ? '' : 'disabled'}>${full ? '气息尚稳，无需疗养' : '引 泉 疗 伤'}</button>
        <div class="xl-btn-row">
          <button class="xl-btn xl-btn--ghost" id="sp-back">返回洞府</button>
        </div>
        ${!full && stones < cost ? '<div class="xl-sub">灵石不足——外出战斗或占卜可得灵石。</div>' : ''}
      `;
      this._el.querySelector('#sp-back').addEventListener('click', () => this._api.close());
      const heal = this._el.querySelector('#sp-heal');
      if (heal && !heal.disabled) {
        heal.addEventListener('click', () => {
          res.stones -= cost;
          res.hpCurrent = d.hpMax;
          res.mpCurrent = d.mpMax;
          Xuxian.core.SaveManager.save();
          Xuxian.core.EventBus.emit(Xuxian.config.constants.EVENTS.SHOW_TOAST, '泉息入体，气血法力尽复');
          Xuxian.core.EventBus.emit(Xuxian.config.constants.EVENTS.CULT_UPDATED);
          this._draw();
        });
      }
    },
  };
})();

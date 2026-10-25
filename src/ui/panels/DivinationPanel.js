/**
 * ui/panels/DivinationPanel.js — 每日占卜（三骰 → 卦象 → 方向解读 → 小奖）
 * 纯模板无 AI（40 卦池）；每日一次（本地日期门控）。
 */
(function () {
  'use strict';

  Xuxian.ui.panels.DivinationPanel = {
    render(el, api) {
      this._el = el; this._api = api; this._result = null;
      this._draw();
    },

    _todayDone() {
      const gs = Xuxian.core.GameState.data;
      return gs.flags.lastDivination === new Date().toDateString();
    },

    _draw() {
      const T = Xuxian.data.tables.divination;
      const done = this._todayDone();
      const dirs = ['修炼', '战斗', '捕捉', '突破'];

      this._el.innerHTML = `
        <div class="xl-step-tag"><span class="xl-kicker">洞府 · 每日占卜</span></div>
        <h2 class="xl-heading xl-heading--sm">🎲 一卦知今日</h2>
        ${done && !this._result ? `
          <div class="xl-sheet" style="text-align:left;">
            <div class="xl-row">今日已占——「${(Xuxian.core.GameState.data.flags.lastHexagram || {}).name || '已得卦'}」。</div>
            <div class="xl-sub">子时之后，卦象自新。</div>
          </div>
        ` : this._result ? this._resultHtml() : `
          <p class="xl-hint">静心思所占之事，掷下三骰。</p>
          <div class="xl-div-dirs">
            ${dirs.map((d) => `<button class="xl-cmd ${d === '修炼' ? 'sel' : ''}" data-dir="${d}">${d}</button>`).join('')}
          </div>
          <button class="xl-btn" id="div-roll">掷 骰 占 卜</button>
        `}
        <div class="xl-btn-row">
          <button class="xl-btn xl-btn--ghost" id="div-back">返回洞府</button>
        </div>
      `;

      this._el.querySelector('#div-back').addEventListener('click', () => this._api.close());
      this._el.querySelectorAll('[data-dir]').forEach((b) => b.addEventListener('click', () => {
        this._el.querySelectorAll('[data-dir]').forEach((x) => x.classList.remove('sel'));
        b.classList.add('sel');
      }));
      const roll = this._el.querySelector('#div-roll');
      if (roll) roll.addEventListener('click', () => this._roll());
    },

    _roll() {
      const T = Xuxian.data.tables.divination;
      const dirEl = this._el.querySelector('[data-dir].sel');
      const dir = dirEl ? dirEl.dataset.dir : '修炼';
      const dice = [0, 0, 0].map(() => 1 + Math.floor(Math.random() * 6));
      const total = dice[0] + dice[1] + dice[2];
      const band = T.bands.find((b) => total >= b.min && total <= b.max) || T.bands[1];
      // 按点数分段取卦（点数越高卦越好——池按吉凶排序）
      const idx = Math.min(T.hexagrams.length - 1,
        Math.floor(((total - 3) / 16) * (T.hexagrams.length - 1)));
      const hex = T.hexagrams[idx];
      const reading = T.readings[dir][band.tone];
      const rewardRule = T.rewards.find((r) => total >= r.min && total <= r.max) || T.rewards[0];

      // 发奖
      const gs = Xuxian.core.GameState.data;
      const parts = [];
      if (rewardRule.give.stones) { gs.resources.stones = (gs.resources.stones || 0) + rewardRule.give.stones; parts.push('灵石+' + rewardRule.give.stones); }
      if (rewardRule.give.item) { Xuxian.systems.inventory.Inventory.add(rewardRule.give.item, 1); parts.push((Xuxian.systems.inventory.Inventory.def(rewardRule.give.item) || {}).name + '×1'); }
      gs.flags.lastDivination = new Date().toDateString();
      gs.flags.lastHexagram = { name: hex.name, poem: hex.poem };
      Xuxian.core.SaveManager.save();
      Xuxian.core.EventBus.emit(Xuxian.config.constants.EVENTS.CULT_UPDATED);

      this._result = { dice, total, hex, dir, reading, parts };
      this._draw();
    },

    _resultHtml() {
      const r = this._result;
      return `
        <div class="xl-dice-row">${r.dice.map((d) => `<span class="xl-dice">${d}</span>`).join('<i>·</i>')}</div>
        <div class="xl-sub">共 ${r.total} 点 · 问「${r.dir}」</div>
        <div class="xl-sheet" style="text-align:left; margin-top:10px;">
          <div class="xl-hex-name">「${r.hex.name}」</div>
          <div class="xl-hex-poem">${r.hex.poem}</div>
          <div class="xl-hex-reading">${r.reading}</div>
          <div class="xl-row" style="margin-top:8px;"><span class="xl-label">卦礼</span>${r.parts.join('、')}</div>
        </div>
      `;
    },
  };
})();

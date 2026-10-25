/**
 * ui/panels/OutdoorPanel.js — 外出·青溪坡（寻觅灵兽 → 开战）
 * 寻觅耗灵气（2 点/次）；生成 2~3 只遭遇组（等级带内 roll；精英低概率）。
 */
(function () {
  'use strict';

  const T = () => Xuxian.data.tables.beasts;
  const E = () => Xuxian.config.constants.EVENTS;
  const COST_PER_SEARCH = 2;

  Xuxian.ui.panels.OutdoorPanel = {
    render(el, api) {
      this._el = el; this._api = api; this._group = null;
      this._draw();
    },

    _draw() {
      const el = this._el;
      const res = Xuxian.core.GameState.data.resources || {};
      const starter = Xuxian.systems.spiritBeast.BeastParty.getStarter();
      el.innerHTML = `
        <div class="xl-step-tag">洞府 · 外出</div>
        <h2 style="font-size:24px; letter-spacing:8px;">青 溪 坡</h2>
        <p class="xl-hint">溪水穿过草坡，碎石土间留着新翻的兽迹。</p>
        <div class="xl-row"><span class="xl-label">灵气</span>🍃 ${Math.floor(res.qi)} / ${Math.floor(res.qiMax || 240)}（每次寻觅消耗 ${COST_PER_SEARCH}）</div>
        <div class="xl-row"><span class="xl-label">首发灵兽</span>${starter ? starter.name + '（Lv.' + starter.level + '）自动入场' : '尚无灵兽——捕捉第一只伙伴吧'}</div>
        <div id="od-group"></div>
        <div style="display:flex; gap:10px; margin-top:8px;">
          <button class="xl-btn xl-btn--ghost" id="od-back" style="flex:0 0 110px;">回洞府</button>
          <button class="xl-btn" id="od-search">寻 觅 灵 兽</button>
          <button class="xl-btn" id="od-fight" ${this._group ? '' : 'disabled'}>开 战 捕 捉</button>
        </div>
        <div class="xl-sub">携带等级上限：Lv.${Xuxian.entities.CombatFactories.carryLimit()}（境界提升而提高）</div>
      `;
      el.querySelector('#od-back').addEventListener('click', () => api_close(this._api));
      el.querySelector('#od-search').addEventListener('click', () => this._search());
      el.querySelector('#od-fight').addEventListener('click', () => this._fight());
      if (this._group) this._drawGroup();
    },

    _search() {
      const res = Xuxian.core.GameState.data.resources;
      if (res.qi < COST_PER_SEARCH) {
        Xuxian.core.EventBus.emit(E().SHOW_TOAST, '灵气不足，稍候回复');
        return;
      }
      res.qi -= COST_PER_SEARCH;
      const pool = T().species;
      const count = 2 + (Math.random() < 0.4 ? 1 : 0);
      const group = [];
      for (let i = 0; i < count; i++) {
        // 精英 8% 概率顶替末位
        let sp = pool[Math.floor(Math.random() * (pool.length - 1))];
        if (i === count - 1 && Math.random() < 0.08) sp = pool[pool.length - 1];
        const lv = sp.levelBand[0] + Math.floor(Math.random() * (sp.levelBand[1] - sp.levelBand[0] + 1));
        group.push({ sp, lv });
      }
      this._group = group;
      Xuxian.core.EventBus.emit(E().CULT_UPDATED);
      this._draw();
    },

    _drawGroup() {
      const box = this._el.querySelector('#od-group');
      const limit = Xuxian.entities.CombatFactories.carryLimit();
      box.innerHTML = `
        <div class="xl-sheet" style="margin-top:8px;">
          <div class="xl-sheet-title">发现灵兽 ×${this._group.length}</div>
          ${this._group.map((g) => `
            <div class="xl-row"><b>${g.sp.name}</b> Lv.${g.lv}
              <span class="xl-sub-inline">${g.sp.rarity === '精英' ? '⚠ 精英' : ''}${g.lv > limit ? ' · 超携带上限（不可捕捉）' : ' · 可捕捉'}</span>
            </div>`).join('')}
          <div class="xl-sub">继续寻觅将离开当前这组灵兽。</div>
        </div>`;
    },

    _fight() {
      if (!this._group) return;
      const enemies = this._group.map((g) => Xuxian.entities.CombatFactories.makeWildUnit(g.sp.id, g.lv));
      const session = new Xuxian.systems.combat.BattleSession(enemies);
      Xuxian.core.DomLayer.closePanel('outdoor');
      Xuxian.game.scene.getScene('HubScene').scene.start('BattleScene', { session });
    },
  };

  function api_close(api) { api.close(); }
})();

/**
 * ui/panels/BattleBar.js — 战斗指令条（DOM，5+1 指令 + 自动开关）
 * 流程：选指令（部分需选目标）→ [出招] → BattleScene.advance()。
 * 结束后由场景关闭本面板、开结算面板。
 */
(function () {
  'use strict';

  const T = () => Xuxian.data.tables.beasts;

  Xuxian.ui.panels.BattleBar = {
    render(el, api, session) {
      this._el = el; this._session = session; this._cmd = null; this._target = null;
      this._draw();
    },

    _draw() {
      const s = this._session;
      const el = this._el;
      const enemies = s.snapshot().enemies;
      const blade = T().playerSkills.find((k) => k.id === 'spirit_blade');
      el.innerHTML = `
        <div class="xl-battlebar">
          <div class="xl-cmd-row">
            <button class="xl-cmd" data-cmd="attack">攻 击</button>
            <button class="xl-cmd" data-cmd="skill" ${s.player.mp >= blade.mpCost ? '' : 'disabled'}>神 通</button>
            <button class="xl-cmd" data-cmd="defend">防 御</button>
            <button class="xl-cmd" data-cmd="catch">捕 捉</button>
            <button class="xl-cmd" data-cmd="flee">逃 跑</button>
            <button class="xl-cmd xl-cmd-auto ${s.autoMode ? 'on' : ''}" id="bb-auto">${s.autoMode ? '自动·开' : '自 动'}</button>
          </div>
          <div class="xl-target-row" id="bb-targets">
            ${enemies.map((e, i) => e.alive && !e.captured ? `<button class="xl-target" data-i="${i}">${e.name} <i>Lv.${e.level} · ${Math.ceil(e.hp / e.hpMax * 100)}%</i></button>` : '').join('')}
          </div>
          <div id="bb-status" class="xl-battlebar-status">选择指令${this._needsTarget() ? '与目标' : ''}，然后出招。</div>
          <button class="xl-btn xl-btn--seal" id="bb-go" disabled>出 招</button>
          <button class="xl-btn xl-btn--ghost xl-battlebar-abandon" id="bb-abandon">放弃战斗</button>
        </div>
      `;
      el.querySelectorAll('.xl-cmd').forEach((b) => b.addEventListener('click', () => {
        if (b.id === 'bb-auto') return;
        el.querySelectorAll('.xl-cmd').forEach((x) => x.classList.remove('sel'));
        b.classList.add('sel');
        this._cmd = b.dataset.cmd; this._target = null;
        this._sync();
      }));
      el.querySelector('#bb-auto').addEventListener('click', () => {
        s.autoMode = !s.autoMode;
        this._draw();
      });
      el.querySelectorAll('.xl-target').forEach((b) => b.addEventListener('click', () => {
        el.querySelectorAll('.xl-target').forEach((x) => x.classList.remove('sel'));
        b.classList.add('sel');
        this._target = s.enemies[Number(b.dataset.i)];
        this._sync();
      }));
      el.querySelector('#bb-go').addEventListener('click', () => this._go());
      el.querySelector('#bb-abandon').addEventListener('click', () => {
        if (confirm('放弃战斗：保留损耗、捕捉全部丢失。确认离开？')) {
          s.abandon();
          Xuxian.core.EventBus.emit(Xuxian.config.constants.EVENTS.BATTLE_OVER, s.result);
        }
      });
      this._sync();
    },

    _needsTarget() {
      return this._cmd === 'attack' || this._cmd === 'skill' || this._cmd === 'catch';
    },

    _sync() {
      const go = this._el.querySelector('#bb-go');
      const st = this._el.querySelector('#bb-status');
      // 自动模式：无需选指令（AI 决策），出招恒可用
      const ready = this._session.autoMode || (this._cmd && (!this._needsTarget() || this._target));
      go.disabled = !ready;
      if (this._session.autoMode) {
        st.textContent = '自动战斗中 —— 出招后逐回合自动推进';
      } else if (this._cmd === 'catch' && this._target && !this._session.catchable(this._target)) {
        st.textContent = '⚠ 此灵兽超携带上限，无法捕捉（换目标或攻击）';
        go.disabled = true;
      } else if (ready) {
        st.textContent = '指令已定，出招！';
      }
    },

    _go() {
      const s = this._session;
      if (!s.autoMode) {
        const draft = { type: this._cmd };
        if (this._needsTarget()) draft.target = this._target;
        if (this._cmd === 'skill') draft.skillId = 'spirit_blade';
        s.setDraft(draft);
      }
      // 交给场景推进（含演出节奏）
      Xuxian.game.scene.getScene('BattleScene').advance();
      if (s.over) return; // 场景会开结算面板
      this._draw();
      // 自动模式：逐回合链式推进（真挂机）
      if (s.autoMode) {
        setTimeout(() => { if (!s.over && this._el && this._el.isConnected) this._go(); }, 700);
      }
    },
  };
})();

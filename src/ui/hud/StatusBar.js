/**
 * ui/hud/StatusBar.js — 洞府顶栏状态条（DOM）
 * 订阅 CULT_UPDATED 定向刷新数字（不整棵重渲染）；mount/unmount 由 HubScene 调用。
 */
(function () {
  'use strict';

  const E = () => Xuxian.config.constants.EVENTS;

  Xuxian.ui.hud.StatusBar = {
    _el: null,
    _unsub: null,

    mount() {
      if (this._el) return;
      const el = document.createElement('div');
      el.className = 'xl-statusbar';
      el.innerHTML = `
        <span class="xl-sb-name" id="sb-name">—</span>
        <span class="xl-sb-item">境界 <b id="sb-realm">—</b></span>
        <span class="xl-sb-item xl-sb-wide">修为 <b id="sb-xw">0/0</b><span class="xl-bar"><i id="sb-xw-bar"></i></span></span>
        <span class="xl-sb-item">感悟 <b id="sb-gw">0/0</b></span>
        <span class="xl-sb-item">🍃 <b id="sb-qi">0/0</b></span>
        <span class="xl-sb-item">⏳ <b id="sb-life">—</b></span>
        <span class="xl-sb-cult" id="sb-cult"></span>
      `;
      document.getElementById('dom-layer').appendChild(el);
      this._el = el;
      this.refresh();
      this._unsub = Xuxian.core.EventBus.on(E().CULT_UPDATED, () => this.refresh());
    },

    unmount() {
      if (this._unsub) { this._unsub(); this._unsub = null; }
      if (this._el) { this._el.remove(); this._el = null; }
    },

    refresh() {
      const el = this._el; if (!el) return;
      const gs = Xuxian.core.GameState.data;
      const RP = Xuxian.systems.stats.RealmProgress;
      const CS = Xuxian.systems.cultivation.CultivationState;
      const p = gs.player || {};
      const s = RP.get();
      const res = gs.resources || {};
      const $ = (id) => el.querySelector('#' + id);

      $('sb-name').textContent = p.name || '—';
      $('sb-realm').textContent = RP.realmName();
      $('sb-xw').textContent = Math.floor(s.xiuWei) + '/' + RP.xiuWeiMax();
      $('sb-xw-bar').style.width = Math.min(100, RP.progress() * 100) + '%';
      $('sb-gw').textContent = Math.floor(s.ganWu) + '/' + RP.ganWuMax();
      $('sb-qi').textContent = Math.floor(res.qi) + '/' + Math.floor(res.qiMax || 240);
      $('sb-life').textContent = CS.lifespanLeft().toFixed(1) + '载';

      const cult = $('sb-cult');
      if (CS.isActive()) {
        cult.textContent = '● 闭关中';
        cult.className = 'xl-sb-cult on';
      } else {
        const reason = { qi: '灵气耗尽·暂停', lifespan: '寿元见底·强制停止', manual: '已出关' }[CS.stoppedReason()];
        cult.textContent = reason ? '○ ' + reason : '';
        cult.className = 'xl-sb-cult off';
      }
    },
  };
})();

/**
 * ui/panels/EchoPanel.js — 闭关回响（离线收益结算面板）
 * 由 HubScene 在离线结算（elapsedSec ≥ 阈值且期间在闭关）后打开。
 */
(function () {
  'use strict';

  Xuxian.ui.panels.EchoPanel = {
    render(el, api) {
      const d = Xuxian.ui.panels.EchoPanel._delta || {};
      const mins = Math.round(d.elapsedSec / 60);
      const pausedNote = d.pausedReason === 'qi' ? '<div class="xl-warn">🍃 灵气耗尽，闭关已自动暂停（灵气回复后可重开）。</div>'
        : d.pausedReason === 'lifespan' ? '<div class="xl-warn">⏳ 寿元见底，闭关强制停止。</div>' : '';
      el.innerHTML = `
        <div class="xl-step-tag"><span class="xl-kicker">闭关回响</span></div>
        <h2 class="xl-heading xl-heading--sm">山 中 无 岁 月</h2>
        <div class="xl-sub">这一去，已是 ${mins >= 60 ? Math.floor(mins / 60) + ' 时辰' + (mins % 60 ? ' ' + (mins % 60) + ' 分' : '') : mins + ' 分钟'}。</div>
        <div class="xl-sheet" style="margin-top:18px;">
          <div class="xl-row"><span class="xl-label">修为</span><b>+${d.xiuWei || 0}</b></div>
          <div class="xl-row"><span class="xl-label">感悟</span><b>+${d.ganWu || 0}</b></div>
          <div class="xl-row"><span class="xl-label">寿元</span>−${d.lifespanUsed || 0} 载</div>
          ${pausedNote}
        </div>
        <button class="xl-btn" id="echo-ok">收 拢 心 神</button>
      `;
      el.querySelector('#echo-ok').addEventListener('click', () => api.close());
    },
  };
})();

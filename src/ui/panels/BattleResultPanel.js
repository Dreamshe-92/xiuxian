/**
 * ui/panels/BattleResultPanel.js — 战斗结算（ResultOverlay，结算锁约定的收束点）
 * [结束本次战斗] → session.settleConfirm()（捕捉入袋+清 pendingBattleSettle+存档）→ 回洞府。
 * 调研教训落实：结算确认绝不只藏在战斗页内——本场结算未确认前，GameState 锁位保持。
 */
(function () {
  'use strict';

  const OUTCOME = {
    victory: { title: '🌅 战斗胜利', cls: 'ok' },
    defeat: { title: '💨 道友力竭', cls: 'fail' },
    flee: { title: '🏃 成功撤离', cls: '' },
    abandon: { title: '🚪 弃战离场', cls: 'fail' },
  };

  Xuxian.ui.panels.BattleResultPanel = {
    render(el, api, session) {
      const r = session.result || { outcome: 'flee', rewards: { xiuWei: 0, ganWu: 0 }, captures: [] };
      const meta = OUTCOME[r.outcome] || OUTCOME.flee;
      el.innerHTML = `
        <div class="xl-step-tag">战斗结算</div>
        <h2 class="xl-result ${meta.cls}" style="border:none; background:none; padding:0; margin:0 0 8px;">${meta.title}</h2>
        <div class="xl-sheet" style="text-align:left;">
          <div class="xl-row"><span class="xl-label">修为</span>+${r.rewards.xiuWei}</div>
          <div class="xl-row"><span class="xl-label">感悟</span>+${r.rewards.ganWu}</div>
          <div class="xl-row"><span class="xl-label">捕捉</span>${
            r.captures.length ? r.captures.map((c) => `<b>${c.name}</b>（Lv.${c.level}）`).join('、') + ' 已随行入袋' : '无'
          }</div>
          ${r.outcome === 'abandon' ? '<div class="xl-warn">弃战离场：本场捕捉全部丢失。</div>' : ''}
          ${r.outcome === 'defeat' ? '<div class="xl-sub">败绩亦是磨砺——无损离场，重整旗鼓。</div>' : ''}
        </div>
        <button class="xl-btn" id="br-done">结束本次战斗</button>
      `;
      el.querySelector('#br-done').addEventListener('click', () => {
        session.settleConfirm();
        Xuxian.core.EventBus.emit(Xuxian.config.constants.EVENTS.CULT_UPDATED);
        Xuxian.game.scene.getScene('BattleScene').scene.start('HubScene');
      });
    },
  };
})();

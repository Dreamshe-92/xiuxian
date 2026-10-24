/**
 * ui/panels/BattleLogPanel.js — 战报流（DOM，右侧/下方滚动日志）
 */
(function () {
  'use strict';

  const E = () => Xuxian.config.constants.EVENTS;

  Xuxian.ui.panels.BattleLogPanel = {
    render(el, api, session) {
      el.innerHTML = `
        <div class="xl-battlelog">
          <div class="xl-battlelog-title">战 报</div>
          <div class="xl-battlelog-lines" id="bl-lines"></div>
        </div>`;
      const lines = el.querySelector('#bl-lines');
      session.log.slice(-30).forEach((l) => this._line(lines, l));
      this._unsub = Xuxian.core.EventBus.on(E().BATTLE_LOG, (l) => this._line(lines, l));
    },
    _line(box, text) {
      const div = document.createElement('div');
      div.className = 'xl-battlelog-line';
      div.textContent = text;
      box.appendChild(div);
      box.scrollTop = box.scrollHeight;
      while (box.children.length > 40) box.removeChild(box.firstChild);
    },
    onClose() { if (this._unsub) { this._unsub(); this._unsub = null; } },
  };
})();

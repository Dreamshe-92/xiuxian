/**
 * MainMenu.js — 主菜单面板（DOM 覆盖层实现）
 * 只负责"长什么样 + 点击发什么事件"；流程跳转由 MainMenuScene 响应事件完成。
 * 事件：MENU_START / MENU_CONTINUE / MENU_SETTINGS（constants.EVENTS）。
 */
(function () {
  'use strict';

  const E = () => Xuxian.config.constants.EVENTS;

  Xuxian.ui.menus.MainMenu = {
    /**
     * DomLayer.openPanel 的 renderFn 实现
     * @param {HTMLElement} el 面板容器
     * @param {{close:Function, emit:Function}} api 面板 API
     */
    render(el, api) {
      const hasSave = Xuxian.core.SaveManager.hasSave();

      el.innerHTML = `
        <h1 class="xl-heading">修 仙</h1>
        <div class="xl-sub" style="margin-top:0;">xuxian · 第一幕（MVP）</div>
        <div style="height:18px;"></div>
        <button class="xl-btn xl-btn--seal" data-act="start">新 开 局</button>
        <button class="xl-btn" data-act="continue" ${hasSave ? '' : 'disabled'}>继 续</button>
        <button class="xl-btn xl-btn--ghost" data-act="settings" disabled>设 置</button>
        <div class="xl-sub">浏览器直开 · 存档在本机</div>
      `;

      el.addEventListener('click', (ev) => {
        const btn = ev.target.closest('button[data-act]');
        if (!btn || btn.disabled) return;
        const act = btn.dataset.act;
        if (act === 'start') api.emit(E().MENU_START);
        if (act === 'continue') api.emit(E().MENU_CONTINUE);
        if (act === 'settings') api.emit(E().MENU_SETTINGS);
      });
    },
  };
})();

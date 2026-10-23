/**
 * DomLayer.js — DOM 覆盖层基础设施（架构 §3.1.1 的第一个落地物）
 * 职责：
 *   1. 管理 #dom-layer 下的面板（open/close/closeAll）；
 *   2. 桥接：面板通过 api.emit() 发 EventBus 事件 → 游戏层（场景/系统）响应；
 *      游戏层通过 EVENTS.SHOW_TOAST → DomLayer.showToast() 通知 UI；
 *   3. Toast 轻提示。
 * 面板本身（如 ui/menus/MainMenu.js）只管"这块面板长什么样"，不碰 Phaser。
 */
(function () {
  'use strict';

  const DomLayer = {
    _root: null,
    _panels: new Map(), // id → { el, onClose }

    init() {
      this._root = document.getElementById('dom-layer');
      if (!this._root) throw new Error('DomLayer: 缺少 #dom-layer 根节点');
      // 游戏层 → UI：统一监听 Toast 事件
      Xuxian.core.EventBus.on(Xuxian.config.constants.EVENTS.SHOW_TOAST, (msg) => this.showToast(msg));
    },

    /**
     * 打开面板。renderFn(el, api) 负责渲染内容；api = { close, emit }。
     * 同 id 面板已存在时不重复开。
     */
    openPanel(id, renderFn) {
      if (this._panels.has(id)) return;
      const el = document.createElement('div');
      el.className = 'xl-panel';
      el.dataset.panelId = id;
      const api = {
        close: () => this.closePanel(id),
        emit: (event, detail) => Xuxian.core.EventBus.emit(event, detail),
      };
      this._root.appendChild(el);
      const onClose = renderFn(el, api) || null; // renderFn 可返回关闭回调
      this._panels.set(id, { el, onClose });
    },

    closePanel(id) {
      const p = this._panels.get(id);
      if (!p) return;
      if (typeof p.onClose === 'function') { try { p.onClose(); } catch (e) { console.error(e); } }
      p.el.remove();
      this._panels.delete(id);
    },

    closeAll() {
      Array.from(this._panels.keys()).forEach((id) => this.closePanel(id));
    },

    /** 轻提示（自动消失） */
    showToast(msg, duration) {
      const ms = duration || 1800;
      const el = document.createElement('div');
      el.className = 'xl-toast';
      el.textContent = msg;
      this._root.appendChild(el);
      requestAnimationFrame(() => el.classList.add('show'));
      setTimeout(() => {
        el.classList.remove('show');
        setTimeout(() => el.remove(), 300);
      }, ms);
    },
  };

  Xuxian.core.DomLayer = DomLayer;
})();

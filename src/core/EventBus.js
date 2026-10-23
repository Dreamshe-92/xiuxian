/**
 * EventBus.js — 全局事件总线（发布/订阅）
 * 架构角色：解耦「谁通知谁」——场景/系统/UI 之间只通过事件通信（架构 §6.2）。
 * 用法：
 *   const bus = Xuxian.core.EventBus;
 *   bus.on(EVENTS.X, fn); bus.off(EVENTS.X, fn); bus.emit(EVENTS.X, data);
 * BaseScene.bindEvent() 会自动登记并在场景关闭时解绑（防幽灵监听）。
 */
(function () {
  'use strict';

  class EventBus {
    constructor() { this._map = new Map(); }

    /** 订阅；返回解绑函数（也可用 off） */
    on(event, fn) {
      if (!this._map.has(event)) this._map.set(event, new Set());
      this._map.get(event).add(fn);
      return () => this.off(event, fn);
    }

    once(event, fn) {
      const wrap = (data) => { this.off(event, wrap); fn(data); };
      return this.on(event, wrap);
    }

    off(event, fn) {
      const set = this._map.get(event);
      if (set) { set.delete(fn); if (set.size === 0) this._map.delete(event); }
    }

    emit(event, data) {
      const set = this._map.get(event);
      if (!set) return;
      // 拷贝后遍历：回调中注销自身不影响本轮
      Array.from(set).forEach((fn) => { try { fn(data); } catch (e) { Xuxian.errors.push(e); console.error(e); } });
    }

    /** 诊断用：当前监听总数 */
    listenerCount(event) { return this._map.has(event) ? this._map.get(event).size : 0; }
  }

  Xuxian.core.EventBus = new EventBus(); // 单例导出
})();

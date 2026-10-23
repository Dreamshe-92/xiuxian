/**
 * BaseScene.js — 场景公共基类（防泄漏钩子）
 * 所有场景继承本类。职责（架构 §6.5）：
 *   1. bindEvent()：订阅 EventBus 并登记，场景关闭时自动解绑（防幽灵监听）；
 *   2. shutdown 自动清理：补间/计时器随场景销毁，额外解绑全部登记事件；
 *   3. 统一 shutdown 日志（调试期观察泄漏）。
 */
(function () {
  'use strict';

  class BaseScene extends Phaser.Scene {
    constructor(key) {
      super(key);
      this._busSubs = []; // [event, fn] 登记表
    }

    /** 订阅 EventBus（自动随场景关闭解绑）—— 场景内请只用这个方法订阅全局事件 */
    bindEvent(event, fn) {
      Xuxian.core.EventBus.on(event, fn);
      this._busSubs.push([event, fn]);
    }

    /** 生命周期：场景真正 create 前挂清理钩子（子类请实现 create 而非 init） */
    init() {
      this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this._cleanup('shutdown'));
      this.events.once(Phaser.Scenes.Events.DESTROY, () => this._cleanup('destroy'));
    }

    _cleanup(phase) {
      // 1) 解绑本场景登记的全部 EventBus 监听
      this._busSubs.forEach(([event, fn]) => Xuxian.core.EventBus.off(event, fn));
      this._busSubs.length = 0;
      // 2) 补间/计时器由 Phaser 随场景销毁，此处兜底停掉（防止 shutdown 未销毁时残留）
      if (this.tweens) this.tweens.killAll();
      if (this.time) this.time.removeAllEvents();
      // 3) 调试日志（验收时可观察：切场景应成对出现）
      if (window.XuxianDev) console.log(`[BaseScene] ${this.scene.key} ${phase} cleaned`);
    }
  }

  Xuxian.core.BaseScene = BaseScene;
})();

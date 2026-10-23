/**
 * PreloadScene.js — 资源加载页（进度条）
 * M0 无真实资源：用短促的模拟进度验证加载页流程与样式；
 * 真实分包加载（首包/枢纽包/战斗包）在 M3+ 逐步接入（架构 §5 加载策略）。
 */
(function () {
  'use strict';

  const C = Xuxian.config.constants;

  class PreloadScene extends Xuxian.core.BaseScene {
    constructor() { super(C.SCENES.PRELOAD); }

    create() {
      const { width, height } = this.scale;
      const cx = width / 2, cy = height / 2;

      // 纸底
      this.cameras.main.setBackgroundColor(C.VIEW.BG_PAPER);

      // 标题与进度条（纯 Graphics，无外部资源）
      this.add.text(cx, cy - 60, '修 仙', {
        fontFamily: 'serif', fontSize: '36px', color: '#1f2933',
      }).setLetterSpacing(16).setOrigin(0.5);
      this.add.text(cx, cy - 18, '天 地 灵 气 汇 聚 中 ……', {
        fontFamily: 'serif', fontSize: '14px', color: '#5b6670',
      }).setOrigin(0.5);

      const barW = 360, barH = 6;
      this.add.rectangle(cx, cy + 40, barW, barH, 0xefe6d0).setStrokeStyle(1, 0x1f2933, 0.35);
      const fill = this.add.rectangle(cx - barW / 2, cy + 40, 1, barH, 0x9e2b25).setOrigin(0, 0.5);

      // 模拟进度：0 → 100（M0 仅验证流程；M3 换真实 this.load 进度事件）
      const state = { p: 0 };
      this.tweens.add({
        targets: state, p: 100, duration: 600, ease: 'Cubic.easeOut',
        onUpdate: () => { fill.width = Math.max(1, barW * state.p / 100); },
        onComplete: () => this.scene.start(C.SCENES.MENU),
      });
    }
  }

  Xuxian.scenes.PreloadScene = PreloadScene;
})();

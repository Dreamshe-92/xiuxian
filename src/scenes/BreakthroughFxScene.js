/**
 * scenes/BreakthroughFxScene.js — 突破演出（并行场景，盖在 UI 之下/面板缝隙间）
 * 成功：聚气（粒子内旋）→ 霞光冲霄（金色光柱+屏闪）→ 残留光晕；
 * 失败：灵力凝聚（红）→ 溃散（碎片四散+暗浸）→ 灰暗余韵。
 * 演出结束发 BREAKTHROUGH_FX_DONE，由 CultivationPanel 弹结算文字。
 * 时长约 2.6s（成功）/ 2.2s（失败），期间禁点（全屏捕获层）。
 */
(function () {
  'use strict';

  const C = Xuxian.config.constants;

  class BreakthroughFxScene extends Xuxian.core.BaseScene {
    constructor() { super(C.SCENES.BREAKTHROUGH_FX); }

    init(data) {
      super.init();
      this.success = !!(data && data.success);
      this.isMajor = !!(data && data.isMajor);
    }

    create() {
      const { width, height } = this.scale;
      const cx = width / 2, cy = height / 2;
      this.cameras.main.setBackgroundColor('rgba(0,0,0,0)');
      // 演出期间画布提到 DOM 面板之上（全屏仪式感，顺带禁点防连点）
      const root = document.getElementById('game-root');
      if (root) root.style.zIndex = '50';

      // ---------- 阶段一：聚气（0~1.0s）----------
      const gatherColor = this.success ? 0xd8b24a : 0x9e2b25;
      const aura = this.add.circle(cx, cy, 8, gatherColor, 0.0);
      this.tweens.add({
        targets: aura, radius: this.success ? 120 : 90, fillAlpha: 0.35,
        duration: 900, ease: 'Cubic.easeIn',
      });
      // 环绕粒子（内旋）
      const orbiters = [];
      for (let i = 0; i < (this.success ? 26 : 18); i++) {
        const angle = (Math.PI * 2 * i) / (this.success ? 26 : 18);
        const r0 = 260;
        const p = this.add.circle(cx + Math.cos(angle) * r0, cy + Math.sin(angle) * r0 * 0.6,
          2 + Math.random() * 2, gatherColor, 0.85);
        orbiters.push(p);
        this.tweens.add({
          targets: p,
          x: cx + Math.cos(angle) * 12, y: cy + Math.sin(angle) * 8,
          duration: 850, delay: Math.random() * 200, ease: 'Quad.easeIn',
        });
      }

      // ---------- 阶段二：爆发/溃散（1.0s 起） ----------
      this.time.delayedCall(950, () => {
        if (this.success) this._burstSuccess(cx, cy);
        else this._burstFail(cx, cy);
      });

      // ---------- 阶段三：收束（2.2s 后淡出，2.6s 发完成事件） ----------
      this.time.delayedCall(2300, () => {
        this.tweens.add({
          targets: [aura, ...orbiters], alpha: 0, duration: 300,
          onComplete: () => {
            const root = document.getElementById('game-root');
            if (root) root.style.zIndex = ''; // 归还层级
            Xuxian.core.EventBus.emit(C.EVENTS.BREAKTHROUGH_FX_DONE, { success: this.success });
          },
        });
      });
    }

    shutdown() {
      // 兜底：任何路径离开本场景都归还层级（防演出中断后界面被永远盖住）
      const root = document.getElementById('game-root');
      if (root) root.style.zIndex = '';
    }

    /** 成功：霞光冲霄（光柱+上升光点+屏闪；大境界加倍华丽） */
    _burstSuccess(cx, cy) {
      const { width, height } = this.scale;
      // 光柱
      const pillar = this.add.rectangle(cx, cy, this.isMajor ? 90 : 56, height, 0xffe9a8, 0.0);
      this.tweens.add({ targets: pillar, fillAlpha: this.isMajor ? 0.75 : 0.5, duration: 220, yoyo: true, repeat: 1 });
      // 屏闪
      const flash = this.add.rectangle(cx, cy, width, height, 0xfff6d8, 0.0);
      this.tweens.add({ targets: flash, fillAlpha: this.isMajor ? 0.55 : 0.35, duration: 150, yoyo: true, repeat: 1 });
      // 上升光点（霞光）
      for (let i = 0; i < (this.isMajor ? 34 : 20); i++) {
        const x = cx + (Math.random() - 0.5) * 300;
        const p = this.add.circle(x, cy + 60, 2 + Math.random() * 3, 0xffd97a, 0.9);
        this.tweens.add({
          targets: p, y: -30, x: x + (Math.random() - 0.5) * 120,
          duration: 900 + Math.random() * 700, ease: 'Quad.easeOut',
          onComplete: () => p.destroy(),
        });
      }
      // 残留光晕
      const halo = this.add.circle(cx, cy, 60, 0xffe9a8, 0.25);
      this.tweens.add({ targets: halo, radius: 190, alpha: 0, duration: 1100, ease: 'Cubic.easeOut' });
    }

    /** 失败：灵力溃散（红核碎裂+碎片下坠+暗色浸染四角） */
    _burstFail(cx, cy) {
      const { width, height } = this.scale;
      // 红核炸裂碎片
      for (let i = 0; i < 22; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 90 + Math.random() * 160;
        const shard = this.add.rectangle(cx, cy, 3 + Math.random() * 5, 3 + Math.random() * 5, 0x9e2b25, 0.9);
        this.tweens.add({
          targets: shard,
          x: cx + Math.cos(angle) * dist, y: cy + Math.sin(angle) * dist + 60, // 下坠偏移
          angle: Math.random() * 360, alpha: 0,
          duration: 700 + Math.random() * 400, ease: 'Cubic.easeOut',
          onComplete: () => shard.destroy(),
        });
      }
      // 暗色浸染（四角向心）
      const veil = this.add.rectangle(cx, cy, width, height, 0x141918, 0.0);
      this.tweens.add({ targets: veil, fillAlpha: 0.42, duration: 900, yoyo: true, repeat: 1 });
      // 心跳式暗闪
      const core = this.add.circle(cx, cy, 30, 0x9e2b25, 0.5);
      this.tweens.add({ targets: core, radius: 8, alpha: 0, duration: 600, ease: 'Quad.easeOut' });
    }
  }

  Xuxian.scenes.BreakthroughFxScene = BreakthroughFxScene;
})();

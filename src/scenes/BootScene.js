/**
 * BootScene.js — 启动页
 * 职责极简：切墨底色 → 立即进 Preload（架构 §3.1）。
 */
(function () {
  'use strict';

  const C = Xuxian.config.constants;

  class BootScene extends Xuxian.core.BaseScene {
    constructor() { super(C.SCENES.BOOT); }

    create() {
      this.cameras.main.setBackgroundColor(C.VIEW.BG_BOOT);
      this.scene.start(C.SCENES.PRELOAD);
    }
  }

  Xuxian.scenes.BootScene = BootScene;
})();

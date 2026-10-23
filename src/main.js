/**
 * main.js — 游戏总开关
 * 职责：初始化 DomLayer → 创建 Phaser.Game（注册全部场景）→ 挂全局引用。
 * 页面加载完成后启动；window.onerror 收集到 Xuxian.errors 便于验收排查。
 */
(function () {
  'use strict';

  window.addEventListener('error', (e) => { Xuxian.errors.push(e.message); });

  window.addEventListener('load', () => {
    // 1) DOM 覆盖层基建（先于游戏实例：面板/Toast 随时可用）
    Xuxian.core.DomLayer.init();

    // 2) 创建 Phaser 游戏，注册 M0 场景链（M1+ 在此追加 StoryScene/HubScene/BattleScene）
    Xuxian.game = new Phaser.Game(Xuxian.config.gameConfig({
      scene: [
        Xuxian.scenes.BootScene,
        Xuxian.scenes.PreloadScene,
        Xuxian.scenes.MainMenuScene,
      ],
    }));
  });
})();

/**
 * gameConfig.js — Phaser 启动配置（宽高/缩放/背景）
 * 被 main.js 调用：Xuxian.config.gameConfig({ scene: [...] }) → Phaser.Game 配置对象。
 */
(function () {
  'use strict';

  Xuxian.config.gameConfig = function (overrides) {
    const C = Xuxian.config.constants;
    return Object.assign({
      type: Phaser.AUTO,
      parent: 'game-root',
      width: C.VIEW.WIDTH,
      height: C.VIEW.HEIGHT,
      backgroundColor: C.VIEW.BG_PAPER,
      // 缩放：适配窗口、居中（移动端/窗口化都可用）
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      // 放置游戏常态挂后台：不随页面隐藏暂停（离线收益按时间戳结算，不依赖帧循环）
      disableVisibilityChange: true,
      // 物理引擎：MVP 战斗为回合制演出，暂不需要物理
      physics: { default: 'arcade', arcade: { debug: false } },
    }, overrides || {});
  };
})();

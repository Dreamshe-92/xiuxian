/**
 * main.js — 游戏总开关
 * 职责：初始化 DomLayer → 创建 Phaser.Game（注册全部场景）→ 挂全局引用。
 * 页面加载完成后启动；window.onerror 收集到 Xuxian.errors 便于验收排查。
 */
(function () {
  'use strict';

  window.addEventListener('error', (e) => { Xuxian.errors.push(e.message); });

  // 放置游戏离线锚点：页面隐藏/关闭前结算并存档（壁钟引擎的兜底，见 CultivationState）
  const persistCultivation = () => {
    try {
      if (Xuxian.core.GameState.data.player) { // 无档案（如菜单页）不存，防覆盖
        Xuxian.systems.cultivation.CultivationState.settle(Date.now());
        Xuxian.core.SaveManager.save();
      }
    } catch (e) { /* 静默：存档失败不阻塞关闭 */ }
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) persistCultivation(); });
  window.addEventListener('beforeunload', persistCultivation);

  window.addEventListener('load', () => {
    // 1) DOM 覆盖层基建（先于游戏实例：面板/Toast 随时可用）
    Xuxian.core.DomLayer.init();

    // 2) 创建 Phaser 游戏，注册场景链（M5：+ BreakthroughFxScene 突破演出，并行场景按需 launch）
    Xuxian.game = new Phaser.Game(Xuxian.config.gameConfig({
      scene: [
        Xuxian.scenes.BootScene,
        Xuxian.scenes.PreloadScene,
        Xuxian.scenes.MainMenuScene,
        Xuxian.scenes.StoryScene,
        Xuxian.scenes.HubScene,
        Xuxian.scenes.BattleScene,
        Xuxian.scenes.BreakthroughFxScene,
      ],
    }));
  });
})();

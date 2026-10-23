/**
 * MainMenuScene.js — 主菜单场景
 * 职责：承载 DOM 主菜单面板 + 响应菜单事件做流程跳转（M0 两个按钮均"暂空转"占位提示）。
 * 这是「DOM 覆盖层 + Phaser 演出层」混合架构的第一个完整验证点：
 *   DOM 面板（MainMenu.js）→ api.emit → EventBus → 本场景响应 → 场景切换。
 */
(function () {
  'use strict';

  const C = Xuxian.config.constants;

  class MainMenuScene extends Xuxian.core.BaseScene {
    constructor() { super(C.SCENES.MENU); }

    create() {
      const E = C.EVENTS;
      this.cameras.main.setBackgroundColor(C.VIEW.BG_PAPER);

      // 打开 DOM 菜单面板（幂等：重复进入不会叠加）
      Xuxian.core.DomLayer.openPanel('main-menu', Xuxian.ui.menus.MainMenu.render);

      // 响应菜单事件（bindEvent 保证场景关闭时解绑）
      this.bindEvent(E.MENU_START, () => {
        // M0 空转：M1 接 StoryScene 凝气创角
        Xuxian.core.EventBus.emit(E.SHOW_TOAST, '角色创建将在 M1 开放');
      });

      this.bindEvent(E.MENU_CONTINUE, () => {
        const result = Xuxian.core.SaveManager.load();
        if (result.ok) {
          Xuxian.core.GameState.data = result.data; // 读档恢复真相
          Xuxian.core.EventBus.emit(E.SHOW_TOAST, '读档成功（M2 接入洞府）');
        } else {
          Xuxian.core.EventBus.emit(E.SHOW_TOAST, '暂无可用存档');
        }
      });

      this.bindEvent(E.MENU_SETTINGS, () => {
        Xuxian.core.EventBus.emit(E.SHOW_TOAST, '设置面板占位');
      });

      // M0 验收标记 + 启动广播
      Xuxian.bootOk = true;
      Xuxian.core.EventBus.emit(E.GAME_BOOTED);
    }

    shutdown() {
      // 场景离开时关闭菜单面板（DomLayer 面板不随场景自动销毁，需显式收）
      Xuxian.core.DomLayer.closePanel('main-menu');
    }
  }

  Xuxian.scenes.MainMenuScene = MainMenuScene;
})();

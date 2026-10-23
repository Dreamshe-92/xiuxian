/**
 * constants.js — 全局常量（场景键、事件名、存档键）
 * 约定：业务代码禁止散落魔法字符串，一律引用 Xuxian.config.constants（简写 C）。
 */
(function () {
  'use strict';

  Xuxian.config.constants = {
    /** 场景键（Scene key） */
    SCENES: {
      BOOT: 'BootScene',
      PRELOAD: 'PreloadScene',
      MENU: 'MainMenuScene',
      STORY: 'StoryScene',        // M1 起用（凝气创角/入世剧情）
      HUB: 'HubScene',            // M2 起用（洞府枢纽）
      BATTLE: 'BattleScene',      // M3 起用（战斗演出）
    },

    /** 事件名（EventBus 用）——M0 仅菜单/Toast，后续里程碑在此追加 */
    EVENTS: {
      // 菜单
      MENU_START: 'menu:start',
      MENU_CONTINUE: 'menu:continue',
      MENU_SETTINGS: 'menu:settings',
      // 通用 UI
      SHOW_TOAST: 'ui:show-toast',
      GAME_BOOTED: 'game:booted',
      // （预留）M2+ 修炼 / M3+ 战斗事件在此扩展
    },

    /** 存档 */
    SAVE: {
      SLOT_KEY: 'xuxian.save.1',  // localStorage 键（单存档位）
      SCHEMA_VERSION: 1,          // 存档结构版本号（评审建议：为迁移留口）
    },

    /** 画布/演出 */
    VIEW: {
      WIDTH: 1280,
      HEIGHT: 720,
      BG_PAPER: '#f8f3e6',        // 纸底
      BG_BOOT: '#141918',         // 启动墨底
    },
  };
})();

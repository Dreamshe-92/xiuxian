/**
 * GameState.js — 全局运行时状态（整局游戏的唯一真相）
 * 架构角色：Scene 不私藏真相；UI 订阅 EventBus 刷新；存档时由 SaveManager 序列化本对象（§6.1）。
 * 字段随里程碑扩展：M1 起 player 写入心念原文/灵根/命格；M2 起 cultivation 写入闭关状态。
 */
(function () {
  'use strict';

  const INITIAL = () => ({
    schemaVersion: Xuxian.config.constants.SAVE.SCHEMA_VERSION,
    /** 玩家档案（M1 创建流程写入：心念原文、姓名、身世、灵根、命格、六维…） */
    player: null,
    /** 修炼状态（M2 写入：闭关开关/累计收益/境界进度） */
    cultivation: null,
    /** 灵兽袋（M3 写入） */
    beasts: null,
    /** 全局标记 */
    flags: {
      pendingBattleSettle: false, // 结算锁约定（架构 §9）：有待收束战斗时全局红点
    },
    /** 设置 */
    settings: { bgm: true, sfx: true },
    /** 元信息 */
    meta: { createdAt: null, lastSavedAt: null, playSeconds: 0 },
  });

  const GameState = {
    data: INITIAL(),

    /** 新开局时重置（保留设置项） */
    reset(keepSettings) {
      const settings = keepSettings ? this.data.settings : null;
      this.data = INITIAL();
      if (settings) this.data.settings = settings;
    },
  };

  Xuxian.core.GameState = GameState;
})();

/**
 * StoryScene.js — 剧情场景（M1 承载"凝气篇"创建流程）
 * 职责：纸底氛围 + 打开创建面板；CREATE_DONE 事件 → 写入 GameState、首次存档 → 入世（进 HubScene）。
 */
(function () {
  'use strict';

  const C = Xuxian.config.constants;

  class StoryScene extends Xuxian.core.BaseScene {
    constructor() { super(C.SCENES.STORY); }

    create() {
      const { width, height } = this.scale;
      this.cameras.main.setBackgroundColor(C.VIEW.BG_PAPER);
      // 极简氛围：一枚淡墨圆（后续版本做成水墨山水演出）
      const g = this.add.graphics();
      g.fillStyle(0x1f2933, 0.06);
      g.fillCircle(width / 2, height / 2, 240);
      g.lineStyle(1, 0x1f2933, 0.15);
      g.strokeCircle(width / 2, height / 2, 244);

      // 打开凝气篇面板（幂等；绑定 this——DomLayer 以裸函数调用 renderFn）
      Xuxian.core.DomLayer.openPanel('creation', (el, api) => Xuxian.ui.panels.CreationPanel.render(el, api));

      // 入世：组装档案 → 重置 GameState → 首次存档 → 进洞府
      this.bindEvent(C.EVENTS.CREATE_DONE, (player) => {
        Xuxian.core.GameState.reset(true);      // 清空旧档状态（保留设置）
        Xuxian.core.GameState.data.player = player;
        Xuxian.systems.cultivation.CultivationState.get(); // 懒初始化 resources（M4 经济）
        Xuxian.core.GameState.data.resources.stones = 0;   // 灵石从零开始
        const saved = Xuxian.core.SaveManager.save();
        Xuxian.systems.quest.TutorialChain.mark('born');   // 新手链①：凝气成形
        Xuxian.core.EventBus.emit(
          C.EVENTS.SHOW_TOAST,
          saved.ok ? '入世成功，此世已录于玉简' : '入世成功（存档不可用：本机存储受限）'
        );
        Xuxian.core.DomLayer.closePanel('creation');
        Xuxian.ui.panels.CreationPanel._reset && Xuxian.ui.panels.CreationPanel._reset();
        this.scene.start(C.SCENES.HUB);
      });
    }

    shutdown() {
      Xuxian.core.DomLayer.closePanel('creation');
    }
  }

  Xuxian.scenes.StoryScene = StoryScene;
})();

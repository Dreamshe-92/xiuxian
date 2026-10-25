/**
 * StoryScene.js — 剧情场景（M1 承载"凝气篇"创建流程 + M5 入世引子）
 * 职责：纸底氛围 + 入世引子幕 + 创建面板；CREATE_DONE → 写档 → 入世（进 HubScene）。
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

      this._bindCreation();
      if (Xuxian.core.GameState.data.player) {
        // 续档误入：已有角色，直接去洞府
        this.scene.start(C.SCENES.HUB);
        return;
      }
      Xuxian.core.DomLayer.openPanel('story-intro', (el, api) => this._renderIntro(el, api));
    }

    /** 序幕：入世引子，落笔后进凝气创建 */
    _renderIntro(el, api) {
      el.innerHTML = [
        '<div class="xl-step-tag"><span class="xl-kicker">序 · 入世</span></div>',
        '<div class="xl-intro-text">',
        '<p>天地为炉，众生为炭。</p>',
        '<p>有人说，仙路是攒出来的：一缕灵气、一寸修为、一场场赌上性命的破关。</p>',
        '<p>也有人说，仙路是选出来的——落笔之际，道已定形。</p>',
        '<p class="xl-intro-em">现在，轮到你落笔。</p>',
        '</div>',
        '<button class="xl-btn" id="intro-go">提 笔 · 凝 气</button>',
        '<div class="xl-sub">写下第一句心念，此世的根骨、机缘与道途皆由它生。</div>',
      ].join('');
      el.querySelector('#intro-go').addEventListener('click', () => {
        Xuxian.core.DomLayer.closePanel('story-intro');
        Xuxian.core.DomLayer.openPanel('creation', (el2, api2) => Xuxian.ui.panels.CreationPanel.render(el2, api2));
      });
    }

    /** 入世：组装档案 → 重置 GameState → 首次存档 → 进洞府 */
    _bindCreation() {
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
      ['story-intro', 'creation'].forEach((id) => Xuxian.core.DomLayer.closePanel(id));
    }
  }

  Xuxian.scenes.StoryScene = StoryScene;
})();

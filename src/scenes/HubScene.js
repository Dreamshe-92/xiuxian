/**
 * HubScene.js — 洞府枢纽场景（M1 为占位 stub，M2 重做成五件套枢纽）
 * M1 职责：给"入世后/读档后"一个落点，展示道友名号。
 */
(function () {
  'use strict';

  const C = Xuxian.config.constants;

  class HubScene extends Xuxian.core.BaseScene {
    constructor() { super(C.SCENES.HUB); }

    create() {
      const { width, height } = this.scale;
      this.cameras.main.setBackgroundColor(C.VIEW.BG_PAPER);

      const player = Xuxian.core.GameState.data.player;
      const name = player ? player.name : '无名道友';
      const root = player && player.spiritRoot
        ? `${player.spiritRoot.tierName}（${player.spiritRoot.elements.join('、')}）` : '灵根未知';

      this.add.text(width / 2, height / 2 - 50, `${name} 的洞府`, {
        fontFamily: 'serif', fontSize: '40px', color: '#1f2933',
      }).setLetterSpacing(10).setOrigin(0.5);

      this.add.text(width / 2, height / 2 + 10, `${root} · ${player ? player.realm : '炼气初期'}`, {
        fontFamily: 'serif', fontSize: '18px', color: '#5b6670',
      }).setOrigin(0.5);

      this.add.text(width / 2, height / 2 + 60, '洞府开辟中…… 修炼循环将在 M2 接入', {
        fontFamily: 'serif', fontSize: '15px', color: '#9e2b25',
      }).setOrigin(0.5);
    }
  }

  Xuxian.scenes.HubScene = HubScene;
})();

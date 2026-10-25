/**
 * scenes/BattleScene.js — 战斗场景（Phaser 演出首登场，架构 §3.1.1：演出归 Phaser）
 * 演出：站位卡（Graphics 简笔）/ 血条 / 受击闪烁 / 回合横幅 / 战报滚动（DOM）。
 * 指令与结算全部走 DOM 面板（BattleBar / BattleResultPanel）。
 * 会话由 outdoor 面板创建后经 BATTLE_START 事件传入。
 */
(function () {
  'use strict';

  const C = Xuxian.config.constants;

  class BattleScene extends Xuxian.core.BaseScene {
    constructor() { super(C.SCENES.BATTLE); }

    init(data) {
      super.init(); // BaseScene 清理钩子（防泄漏）必须挂上
      this.session = data && data.session ? data.session : null;
    }

    create() {
      const { width, height } = this.scale;
      this.cameras.main.setBackgroundColor(C.VIEW.BG_PAPER);
      this.unitViews = new Map();

      // 战场底：一块淡墨演武场
      const g = this.add.graphics();
      g.fillStyle(0x1f2933, 0.05); g.fillEllipse(width / 2, height * 0.55, 1000, 420);
      g.lineStyle(1, 0x1f2933, 0.2); g.strokeEllipse(width / 2, height * 0.55, 1000, 420);

      if (!this.session) { this.scene.start(C.SCENES.HUB); return; }

      this._layoutUnits();
      this._roundBanner('第 1 回合');

      // 指令条 + 战报（DOM）；顺手收掉洞府面板防叠层
      Xuxian.core.DomLayer.closePanel('hub');
      Xuxian.core.DomLayer.openPanel('battle-bar', (el, api) => Xuxian.ui.panels.BattleBar.render(el, api, this.session));
      Xuxian.core.DomLayer.openPanel('battle-log', (el, api) => Xuxian.ui.panels.BattleLogPanel.render(el, api, this.session));

      // 订阅战斗事件 → 演出刷新
      const E = C.EVENTS;
      this.bindEvent(E.BATTLE_STATE, (snap) => this._refresh(snap));
      this.bindEvent(E.BATTLE_LOG, (line) => this._flashActors());
      this.bindEvent(E.BATTLE_OVER, () => this._showResult());

      this._refresh(this.session.snapshot());
    }

    /** 站位：玩家（左）/灵兽（左前）/敌方至多三个（右列） */
    _layoutUnits() {
      const { width, height } = this.scale;
      const spots = {
        player: { x: width * 0.22, y: height * 0.60 },
        beast: { x: width * 0.34, y: height * 0.76 },
        e0: { x: width * 0.74, y: height * 0.42 },
        e1: { x: width * 0.86, y: height * 0.58 },
        e2: { x: width * 0.70, y: height * 0.74 },
      };
      this._makeUnitView(this.session.player, spots.player, 0x9e2b25);
      if (this.session.beast) this._makeUnitView(this.session.beast, spots.beast, 0x2b6e3f);
      this.session.enemies.forEach((e, i) => this._makeUnitView(e, spots['e' + i] || spots.e2, 0x1f2933));
    }

    /** 单个单位演出件：符牌矩形 + 名字 + 血条（简笔风，M5 换立绘） */
    _makeUnitView(unit, pos, color) {
      const container = this.add.container(pos.x, pos.y);
      const plate = this.add.rectangle(0, 0, 120, 74, 0xffffff, 0.55).setStrokeStyle(2, color, 0.9);
      const name = this.add.text(0, -22, `${unit.name}`, { fontFamily: 'serif', fontSize: '15px', color: '#1f2933' }).setOrigin(0.5);
      const lv = this.add.text(0, -6, unit.kind === 'player' ? '道友' : 'Lv.' + unit.level, { fontFamily: 'serif', fontSize: '11px', color: '#5b6670' }).setOrigin(0.5);
      const barBg = this.add.rectangle(0, 12, 96, 8, 0xefe6d0).setStrokeStyle(1, 0x1f2933, 0.3);
      const bar = this.add.rectangle(-48 + 48, 12, 96, 6, color).setOrigin(0.5, 0.5);
      // 血条左锚：用 origin(0,0.5) 定位
      bar.setOrigin(0, 0.5).setX(-48);
      container.add([plate, name, lv, barBg, bar]);
      this.unitViews.set(unit, { container, bar, name, lv });
    }

    _refresh(snap) {
      // 玩家
      const pv = this.unitViews.get(this.session.player);
      if (pv) { pv.bar.width = Math.max(0, 96 * snap.player.hp / snap.player.hpMax); pv.container.setAlpha(snap.player.alive ? 1 : 0.3); }
      // 灵兽
      if (this.session.beast) {
        const bv = this.unitViews.get(this.session.beast);
        if (bv && snap.beast) { bv.bar.width = Math.max(0, 96 * snap.beast.hp / snap.beast.hpMax); bv.container.setAlpha(snap.beast.alive ? 1 : 0.3); }
      }
      // 敌方
      this.session.enemies.forEach((e, i) => {
        const ev = this.unitViews.get(e);
        const es = snap.enemies[i];
        if (ev && es) {
          ev.bar.width = Math.max(0, 96 * es.hp / es.hpMax);
          ev.container.setAlpha(es.alive && !es.captured ? 1 : 0.25);
          if (es.captured) ev.lv.setText('已收服');
          else if (!es.alive) ev.lv.setText('战死');
        }
      });
    }

    /** 受击闪烁：战报出现时全部单位轻微闪一下（简化演出；精准逐单位演出 M5） */
    _flashActors() {
      this.unitViews.forEach((v) => {
        this.tweens.add({ targets: v.container, alpha: { from: 0.4, to: 1 }, duration: 140, yoyo: true });
      });
    }

    _roundBanner() {
      const { width, height } = this.scale;
      const r = this.session.round;
      if (this._bannerText) this._bannerText.destroy();
      this._bannerText = this.add.text(width / 2, height * 0.16, `— 第 ${r} 回合 —`, {
        fontFamily: 'serif', fontSize: '22px', color: '#9e2b25',
      }).setLetterSpacing(6).setOrigin(0.5).setAlpha(0.85);
    }

    _showResult() {
      Xuxian.core.DomLayer.closePanel('battle-bar');
      Xuxian.core.DomLayer.openPanel('battle-result', (el, api) => Xuxian.ui.panels.BattleResultPanel.render(el, api, this.session));
    }

    /** 回合推进由 BattleBar 调用（指令就绪后）；此处包一层演出节奏 */
    advance() {
      this.session.advanceRound();
      if (!this.session.over) this._roundBanner();
      else Xuxian.core.EventBus.emit(C.EVENTS.BATTLE_OVER, this.session.result);
    }

    shutdown() {
      ['battle-bar', 'battle-log', 'battle-result'].forEach((id) => Xuxian.core.DomLayer.closePanel(id));
      this.unitViews.clear();
    }
  }

  Xuxian.scenes.BattleScene = BattleScene;
})();

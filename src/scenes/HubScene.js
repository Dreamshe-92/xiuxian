/**
 * HubScene.js — 洞府枢纽（M2 正式版）
 * 职责：①进洞府先做壁钟结算（离线收益→够长则弹闭关回响）②StatusBar 顶栏挂载
 * ③洞府入口面板（M2：修炼室/道身可用；储物袋/灵兽袋/外出为 M3/M4 占位）
 * ④每秒在线结算（隐藏页 RAF 停摆不影响——壁钟按真实时间，恢复即补算）。
 */
(function () {
  'use strict';

  const C = Xuxian.config.constants;

  const ENTRIES = [
    { id: 'cultivation', label: '修 炼 室', sub: '闭关 · 突破', usable: true },
    { id: 'character',   label: '道 身',   sub: '灵根 · 命格 · 属性', usable: true },
    { id: 'inventory',   label: '储物袋',  sub: 'M3 开放', usable: false },
    { id: 'beasts',      label: '灵兽袋',  sub: 'M3 开放', usable: false },
    { id: 'outdoor',     label: '外 出',   sub: 'M3 开放', usable: false },
  ];

  class HubScene extends Xuxian.core.BaseScene {
    constructor() { super(C.SCENES.HUB); }

    create() {
      const { width, height } = this.scale;
      this.cameras.main.setBackgroundColor(C.VIEW.BG_PAPER);

      // 水墨氛围：中央淡墨大圆 + 顶部淡山影（后续版本换真背景图）
      const g = this.add.graphics();
      g.fillStyle(0x1f2933, 0.04); g.fillEllipse(width / 2, height * 0.62, 900, 520);
      g.fillStyle(0x1f2933, 0.05); g.fillTriangle(width * 0.18, 150, width * 0.38, 40, width * 0.58, 150);
      g.fillTriangle(width * 0.45, 170, width * 0.68, 30, width * 0.92, 170);

      // ① 壁钟结算（读档/离线回归的第一件事）
      const CS = Xuxian.systems.cultivation.CultivationState;
      CS.get(); // 懒初始化（旧档兼容）
      const delta = CS.settle(Date.now());
      const threshold = Xuxian.data.balance.cultivationRates.offlineEchoThresholdSec;
      if (delta.activeDuring && delta.elapsedSec >= threshold && (delta.xiuWei > 0 || delta.ganWu > 0)) {
        Xuxian.ui.panels.EchoPanel._delta = delta;
        Xuxian.core.DomLayer.openPanel('echo', (el, api) => Xuxian.ui.panels.EchoPanel.render(el, api));
      }

      // ② 顶栏 + 洞府入口
      Xuxian.ui.hud.StatusBar.mount();
      Xuxian.core.DomLayer.openPanel('hub', (el, api) => this._renderHubPanel(el, api));

      // ③ 每秒在线结算（timer 随场景销毁；隐藏页停摆无害）
      this.time.addEvent({ delay: 1000, loop: true, callback: () => CS.settle(Date.now()) });
    }

    _renderHubPanel(el) {
      const p = Xuxian.core.GameState.data.player || {};
      el.innerHTML = `
        <div class="xl-hub-head">洞 府</div>
        <div class="xl-sub" style="margin-top:0;">石门半掩，纸窗透白。${p.name ? p.name + '道友，' : ''}今日修行，从何处起？</div>
        <div class="xl-hub-grid">
          ${ENTRIES.map((e) => `
            <div class="xl-hub-entry ${e.usable ? '' : 'dis'}" data-id="${e.id}">
              <div class="xl-hub-label">${e.label}</div>
              <div class="xl-hub-sub">${e.sub}</div>
            </div>`).join('')}
        </div>
      `;
      el.querySelectorAll('.xl-hub-entry:not(.dis)').forEach((node) => {
        node.addEventListener('click', () => {
          const id = node.dataset.id;
          if (id === 'cultivation') {
            Xuxian.core.DomLayer.openPanel('cultivation', (el2, api2) => Xuxian.ui.panels.CultivationPanel.render(el2, api2));
          } else if (id === 'character') {
            Xuxian.core.DomLayer.openPanel('character', (el2, api2) => Xuxian.ui.panels.CharacterPanel.render(el2, api2));
          }
        });
      });
    }

    shutdown() {
      // 收尾：结算+存档（保证 lastTickAt 锚点最新），卸 DOM
      Xuxian.systems.cultivation.CultivationState.settle(Date.now());
      Xuxian.core.SaveManager.save();
      Xuxian.ui.hud.StatusBar.unmount();
      ['hub', 'cultivation', 'character', 'echo'].forEach((id) => Xuxian.core.DomLayer.closePanel(id));
    }
  }

  Xuxian.scenes.HubScene = HubScene;
})();

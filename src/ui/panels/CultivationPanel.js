/**
 * ui/panels/CultivationPanel.js — 修炼室面板（闭关 | 突破 两区 + 心魔 + 属性点分配）
 * 数据全部经 RealmProgress/CultivationState；面板只做展示与指令。
 * 刷新策略：整面板只在打开/大事件（突破后）重渲染；每秒数值由 CULT_UPDATED 定向更新。
 */
(function () {
  'use strict';

  const E = () => Xuxian.config.constants.EVENTS;
  const RP = () => Xuxian.systems.stats.RealmProgress;
  const CS = () => Xuxian.systems.cultivation.CultivationState;

  Xuxian.ui.panels.CultivationPanel = {
    _alloc: null, // 属性点分配的暂存 {体魄:0,...}

    render(el, api) {
      this._el = el; this._api = api;
      this._alloc = null;
      this._full();
      this._unsub = Xuxian.core.EventBus.on(E().CULT_UPDATED, () => this._patch());
    },

    onClose() {
      if (this._unsub) { this._unsub(); this._unsub = null; }
      if (this._fxUnsub) { this._fxUnsub(); this._fxUnsub = null; }
    },

    // ---------- 整体渲染 ----------
    _full() {
      const el = this._el;
      el.innerHTML = `
        <div class="xl-step-tag"><span class="xl-kicker">洞府 · 修炼室</span></div>
        <div id="cp-close-zone"></div>
        <div class="xl-cult-grid">
          <div class="xl-sheet" id="cp-cult"></div>
          <div class="xl-sheet" id="cp-break"></div>
        </div>
        <div class="xl-sheet xl-sheet--quiet" id="cp-extra" style="margin-top:14px;"></div>
        <div class="xl-btn-row">
          <button class="xl-btn xl-btn--ghost" id="cp-back">返回洞府</button>
        </div>
      `;
      el.querySelector('#cp-back').addEventListener('click', () => this._api.close());
      this._renderCult();
      this._renderBreak();
      this._renderExtra();
    },

    // ---------- 闭关区 ----------
    _renderCult() {
      const box = this._el.querySelector('#cp-cult');
      const r = CS().rates();
      const active = CS().isActive();
      const reason = CS().stoppedReason();
      box.innerHTML = `
        <div class="xl-sheet-title">闭 关 <span class="xl-sub-inline">状态式 · 在线离线皆修行</span></div>
        <div id="cp-cult-status" class="xl-cult-status ${active ? 'on' : 'off'}">
          ${active ? '● 闭关中' : '○ 已出关' + (reason ? `（${reason === 'qi' ? '灵气耗尽，自动暂停' : reason === 'lifespan' ? '寿元见底，强制停止' : ''}）` : '')}
        </div>
        <div class="xl-rates">
          <span>修为 <b id="cp-r-xw">+${r.xiuWei.toFixed(0)}</b>/分</span>
          <span>感悟 <b id="cp-r-gw">+${r.ganWu.toFixed(1)}</b>/分</span>
          <span>灵气 <b id="cp-r-qi">${r.qiNet.toFixed(1)}</b>/分</span>
          <span>寿元 <b>-${r.lifespan.toFixed(2)}</b>载/分</span>
        </div>
        ${r.bottleneck ? '<div class="xl-warn">⛰️ 瓶颈 · 修为收益减半，建议外出历练</div>' : ''}
        ${r.xinMo ? '<div class="xl-warn">☠️ 心魔缠身 · 收益减半（见下方化解）</div>' : ''}
        <button class="xl-btn" id="cp-toggle">${active ? '出 关' : '入 定 闭 关'}</button>
        <div class="xl-sub">灵气耗尽自动暂停；寿元见底强制出关（以命换道，红线在此）。</div>
      `;
      box.querySelector('#cp-toggle').addEventListener('click', () => {
        if (CS().isActive()) CS().stop('manual');
        else {
          const chk = CS().start();
          if (!chk.ok && chk.reason === 'lifespan') {
            Xuxian.core.EventBus.emit(E().SHOW_TOAST, '寿元将尽，不可再闭关（需突破涨寿）');
          }
        }
        this._renderCult(); this._patch();
      });
    },

    // ---------- 突破区 ----------
    _renderBreak() {
      const box = this._el.querySelector('#cp-break');
      const stages = Xuxian.data.balance.breakthrough.stages;
      const qiOk = Xuxian.core.GameState.data.resources.qi >= Xuxian.data.balance.breakthrough.qiCost;
      box.innerHTML = `
        <div class="xl-sheet-title">突 破 <span class="xl-sub-inline">消耗 ${Xuxian.data.balance.breakthrough.qiCost} 灵气</span></div>
        <div class="xl-break-list" id="cp-stage-list">
          ${stages.map((st) => {
            const ev = RP().evaluate(st.id);
            return `
              <div class="xl-stage ${ev.eligible && qiOk ? '' : 'dis'}" data-stage="${st.id}">
                <div class="xl-stage-name">${st.name}</div>
                <div class="xl-stage-desc">${st.desc}${st.ganWuMin ? ' 需感悟≥' + st.ganWuMin : ''}</div>
                <div class="xl-stage-rate">${ev.eligible ? '成功率 <b>' + (ev.rate * 100).toFixed(1) + '%</b>' : '修为未至'}</div>
              </div>`;
          }).join('')}
        </div>
        <div id="cp-confirm"></div>
      `;
      box.querySelectorAll('.xl-stage').forEach((el) => {
        el.addEventListener('click', () => {
          const id = el.dataset.stage;
          const ev = RP().evaluate(id);
          if (!ev.eligible) return;
          if (!qiOk) { Xuxian.core.EventBus.emit(E().SHOW_TOAST, '灵气不足'); return; }
          this._renderConfirm(id);
        });
      });
    },

    _renderConfirm(stageId) {
      const box = this._el.querySelector('#cp-confirm');
      const s = RP().get();
      const ev = RP().evaluate(stageId);
      const fate = RP().fateBonuses();
      box.innerHTML = `
        <div class="xl-confirm">
          <div class="xl-confirm-title">【${ev.stage.name}】确认冲关？</div>
          <div class="xl-formula">
            基础率 ${(Xuxian.data.balance.breakthrough.baseRate(s.realmIndex) * 100).toFixed(1)}%
            × 修为 ${ev.stage.progressMult.toFixed(2)}
            × 感悟 ${Xuxian.data.balance.breakthrough.ganWuMult(s.ganWu, RP().ganWuMax()).toFixed(2)}
            ${fate.breakthroughBonus ? ' + 命格 ' + (fate.breakthroughBonus * 100).toFixed(1) + '%' : ''}
            ${s.xinMo ? ' − 心魔 10%' : ''}
            = <b>${(ev.rate * 100).toFixed(1)}%</b>
          </div>
          <div class="xl-sub">失败：修为 ×0.85、感悟 −20；连败 3 次生心魔。</div>
          <div class="xl-btn-row">
            <button class="xl-btn xl-btn--ghost" id="cp-cancel">再做准备</button>
            <button class="xl-btn xl-btn--seal" id="cp-go">破 关 ！</button>
          </div>
        </div>
      `;
      box.querySelector('#cp-cancel').addEventListener('click', () => { box.innerHTML = ''; });
      box.querySelector('#cp-go').addEventListener('click', () => {
        Xuxian.core.GameState.data.resources.qi -= Xuxian.data.balance.breakthrough.qiCost;
        const result = RP().attempt(stageId);
        Xuxian.core.SaveManager.save();
        // 演出优先：先播突破动效，完成后再弹结算文字（面板暂锁防连点）
        this._pendingResult = result;
        box.querySelector('#cp-go').disabled = true;
        const hubScene = Xuxian.game.scene.getScene('HubScene');
        hubScene.scene.launch('BreakthroughFxScene', { success: result.success, isMajor: !!(result.gains && result.gains.isMajor) });
        // 唤醒可能的隐藏页停摆（隐藏时 RAF 停，演出走不下去——直接跳过演出）
        setTimeout(() => {
          const fx = Xuxian.game.scene.getScene('BreakthroughFxScene');
          if (fx && fx.sys.isActive() && !Xuxian.game.loop.paused) {
            // 正常路径：等演出完成事件
          } else {
            // 隐藏页：跳过演出直接结算
            hubScene.scene.stop('BreakthroughFxScene');
            this._showPendingResult();
          }
        }, 3500);
        this._fxUnsub = Xuxian.core.EventBus.on(Xuxian.config.constants.EVENTS.BREAKTHROUGH_FX_DONE, () => {
          if (this._fxUnsub) { this._fxUnsub(); this._fxUnsub = null; }
          hubScene.scene.stop('BreakthroughFxScene');
          this._showPendingResult();
        });
      });
    },

    _showPendingResult() {
      if (!this._pendingResult) return;
      const result = this._pendingResult;
      this._pendingResult = null;
      this._renderBreak(); this._renderExtra(); this._patch();
      this._renderResult(result); // 结果框最后渲染（确认位在突破区内部，避免被重绘覆盖）
    },

    _renderResult(result) {
      const box = this._el.querySelector('#cp-confirm');
      const gains = result.gains;
      box.innerHTML = `
        <div class="xl-result ${result.success ? 'ok' : 'fail'}">
          <div class="xl-result-title">${result.success ? '🌅 突破成功！' + (gains.isMajor ? '【大境界】' : '') : '💨 冲关失败'}</div>
          ${result.success ? `<div class="xl-result-line">${gains.realmFrom} → <b>${gains.realmTo}</b> · 六维各+5 · 属性点+25${gains.isMajor ? ' · 寿元上限+100载' : ''}</div>` : ''}
          <div class="xl-narration">${result.narration.replace(/\\n/g, '<br>')}</div>
          <button class="xl-btn" id="cp-ack">收 拢 心 神</button>
        </div>
      `;
      box.querySelector('#cp-ack').addEventListener('click', () => { box.innerHTML = ''; });
    },

    // ---------- 心魔 + 属性点 ----------
    _renderExtra() {
      const box = this._el.querySelector('#cp-extra');
      const s = RP().get();
      let html = '';
      if (s.xinMo) {
        const half = RP().fateBonuses().xinMoResolveHalf;
        html += `
          <div class="xl-sheet-title">心 魔</div>
          <div class="xl-warn">☠️ 心魔缠身：修炼收益减半、突破 −10%。以感悟冲刷灵台可化解。</div>
          <button class="xl-btn" id="cp-xinmo" ${s.ganWu >= (half ? 25 : 50) ? '' : 'disabled'}>化解心魔（消耗感悟 ${half ? 25 : 50}，当前 ${Math.floor(s.ganWu)}）</button>
        `;
      }
      if (s.pendingPoints > 0) {
        html += `
          <div class="xl-sheet-title" style="margin-top:10px;">属性点分配 <span class="xl-sub-inline">待分配 <b id="cp-pts">${s.pendingPoints}</b> 点</span></div>
          <div class="xl-alloc" id="cp-alloc"></div>
          <div class="xl-btn-row">
            <button class="xl-btn xl-btn--ghost" id="cp-alloc-reset">重置</button>
            <button class="xl-btn" id="cp-alloc-ok">确认分配</button>
          </div>
        `;
      }
      if (!html) html = '<div class="xl-sub" style="text-align:center;">道途坦荡，无待处理之事。</div>';
      box.innerHTML = html;

      const xinmoBtn = box.querySelector('#cp-xinmo');
      if (xinmoBtn) xinmoBtn.addEventListener('click', () => {
        RP().resolveXinMo();
        Xuxian.core.SaveManager.save();
        this._renderExtra(); this._renderCult(); this._patch();
      });

      if (box.querySelector('#cp-alloc')) this._renderAlloc();
    },

    _renderAlloc() {
      const box = this._el.querySelector('#cp-alloc');
      const s = RP().get();
      if (!this._alloc) {
        this._alloc = {}; Object.keys(s.attributes).forEach((k) => { this._alloc[k] = 0; });
      }
      const draw = () => {
        const used = Object.values(this._alloc).reduce((a, b) => a + b, 0);
        const remain = s.pendingPoints - used;
        box.querySelectorAll('.xl-alloc-row').forEach((row) => {
          const k = row.dataset.k;
          row.querySelector('.xl-alloc-v').textContent = s.attributes[k] + (this._alloc[k] ? ` +${this._alloc[k]}` : '');
          row.querySelector('.xl-alloc-btn.add').disabled = remain <= 0;
        });
        const pts = this._el.querySelector('#cp-pts'); if (pts) pts.textContent = remain;
        this._el.querySelector('#cp-alloc-ok').disabled = remain !== 0;
      };
      box.innerHTML = Object.keys(s.attributes).map((k) => `
        <div class="xl-alloc-row" data-k="${k}">
          <span class="xl-label">${k}</span>
          <span class="xl-alloc-v">${s.attributes[k]}</span>
          <button class="xl-alloc-btn sub" data-k="${k}">−</button>
          <button class="xl-alloc-btn add" data-k="${k}">＋</button>
        </div>`).join('');
      box.querySelectorAll('.xl-alloc-btn.sub').forEach((b) => b.addEventListener('click', () => {
        const k = b.dataset.k; if (this._alloc[k] > 0) { this._alloc[k]--; draw(); }
      }));
      box.querySelectorAll('.xl-alloc-btn.add').forEach((b) => b.addEventListener('click', () => {
        const k = b.dataset.k; draw(); if (!b.disabled) { this._alloc[k]++; draw(); }
      }));
      draw();
      this._el.querySelector('#cp-alloc-reset').addEventListener('click', () => { this._alloc = null; this._renderExtra(); });
      this._el.querySelector('#cp-alloc-ok').addEventListener('click', () => {
        const used = Object.values(this._alloc).reduce((a, b) => a + b, 0);
        Object.keys(this._alloc).forEach((k) => { s.attributes[k] += this._alloc[k]; });
        s.pendingPoints -= used;
        this._alloc = null;
        Xuxian.core.SaveManager.save();
        this._renderExtra();
        Xuxian.core.EventBus.emit(E().SHOW_TOAST, '根基已固');
      });
    },

    // ---------- 每秒定向数值更新（不整树重渲染） ----------
    _patch() {
      const el = this._el; if (!el || !el.isConnected) return;
      const r = CS().rates();
      const set = (sel, text) => { const n = el.querySelector(sel); if (n) n.textContent = text; };
      set('#cp-r-xw', '+' + r.xiuWei.toFixed(0));
      set('#cp-r-gw', '+' + r.ganWu.toFixed(1));
      set('#cp-r-qi', r.qiNet.toFixed(1));
      // 出/入关按钮文案与状态条同步（不重建避免打断点击）
      const st = el.querySelector('#cp-cult-status');
      const toggle = el.querySelector('#cp-toggle');
      if (st && toggle) {
        const active = CS().isActive();
        st.className = 'xl-cult-status ' + (active ? 'on' : 'off');
        st.textContent = active ? '● 闭关中' : '○ 已出关';
        toggle.textContent = active ? '出 关' : '入 定 闭 关';
      }
    },
  };
})();

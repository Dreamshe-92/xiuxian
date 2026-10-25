/**
 * systems/cultivation/CultivationState.js — 状态式闭关引擎（需求确认第二轮）
 * 核心思想：闭关是"持续状态"而非动作——壁钟结算（settle）把 lastTickAt→now 的真实流逝
 * 折算成修为/感悟收益与灵气/寿元消耗；在线每秒 tick、离线在回归/读档时一次性结算。
 * 硬限：灵气耗尽自动暂停（不自动重开）；寿元余量低于红线强制停止。
 */
(function () {
  'use strict';

  const R = () => Xuxian.data.balance.cultivationRates;
  const E = () => Xuxian.config.constants.EVENTS;

  const CultivationState = {
    /** 懒初始化（对 M1 旧存档兼容：缺字段自动补） */
    get() {
      const gs = Xuxian.core.GameState.data;
      if (!gs.cultivation) gs.cultivation = { active: false, lastTickAt: null, stoppedReason: null };
      if (!gs.resources) gs.resources = { qi: R().qiMaxBase, qiMax: R().qiMaxBase, lifespanUsed: 0, stones: 0 };
      if (typeof gs.resources.stones !== 'number') gs.resources.stones = 0; // M4 旧档兼容
      return gs.cultivation;
    },

    isActive() { return this.get().active; },
    stoppedReason() { return this.get().stoppedReason; },

    /** 剩余寿元（载）= 寿元上限 - 年龄 - 已耗 */
    lifespanLeft() {
      const gs = Xuxian.core.GameState.data;
      const p = gs.player || {};
      return Math.max(0, (p.lifespanMax || 120) - ((p.age || 16) + gs.resources.lifespanUsed));
    },

    canStart() {
      const c = this.get();
      if (c.active) return { ok: false, reason: 'already' };
      if (this.lifespanLeft() <= R().lifespanRedLine) return { ok: false, reason: 'lifespan' };
      return { ok: true };
    },

    start() {
      const chk = this.canStart();
      if (!chk.ok) return chk;
      const c = this.get();
      c.active = true; c.lastTickAt = Date.now(); c.stoppedReason = null;
      Xuxian.core.EventBus.emit(E().CULT_UPDATED);
      Xuxian.core.SaveManager.save(); // 开关即存档：保证离线结算有锚点
      Xuxian.systems.quest.TutorialChain.mark('firstCult'); // 新手链③：初次闭关
      return { ok: true };
    },

    stop(reason) {
      const c = this.get();
      if (!c.active) return;
      this.settle(Date.now()); // 先结清到当前
      const c2 = this.get();
      c2.active = false; c2.stoppedReason = reason || 'manual';
      Xuxian.core.EventBus.emit(E().CULT_UPDATED);
      Xuxian.core.SaveManager.save();
    },

    /** 当前每分钟净速率（UI 展示用；含灵根/命格/瓶颈/心魔全部修正） */
    rates() {
      const p = Xuxian.core.GameState.data.player || {};
      const RP = Xuxian.systems.stats.RealmProgress;
      const fate = RP.fateBonuses();
      const speed = (p.spiritRoot && p.spiritRoot.speedMult) || 1;
      let xiuWeiMult = speed * fate.xiuWeiMult;
      let ganWuMult = fate.ganWuMult;
      const bottleneck = RP.inBottleneck();
      const xinMo = !!RP.get().xinMo;
      if (bottleneck) xiuWeiMult *= R().bottleneckMult;
      if (xinMo) { xiuWeiMult *= R().xinMoMult; ganWuMult *= R().xinMoMult; }
      return {
        xiuWei: R().xiuWeiPerMin * xiuWeiMult,
        ganWu: R().ganWuPerMin * ganWuMult,
        qiNet: R().qiRegenPerMin * fate.qiRegenMult - R().qiUsePerMin, // 负值=净耗
        lifespan: R().lifespanUsePerMin,
        bottleneck, xinMo,
      };
    },

    /**
     * 壁钟结算（核心）：把 lastTickAt→now 的流逝折算。可重入、幂等。
     * @returns {{elapsedSec:number, activeDuring:boolean, xiuWei:number, ganWu:number, qiUsed:number, lifespanUsed:number, pausedReason:?string}}
     */
    settle(now) {
      const c = this.get();
      const gs = Xuxian.core.GameState.data;
      const RP = Xuxian.systems.stats.RealmProgress;
      const fate = RP.fateBonuses();
      const rates = this.rates();
      const delta = { elapsedSec: 0, activeDuring: c.active, xiuWei: 0, ganWu: 0, qiUsed: 0, lifespanUsed: 0, pausedReason: null };

      if (c.lastTickAt == null) { c.lastTickAt = now; return delta; }
      const elapsedMin = Math.max(0, (now - c.lastTickAt) / 60000);
      delta.elapsedSec = Math.round(elapsedMin * 60);
      if (elapsedMin <= 0) return delta;
      c.lastTickAt = now;

      const res = gs.resources;
      const regen = R().qiRegenPerMin * fate.qiRegenMult;

      // 活跃闭关段：灵气净耗为负，算出耗尽时刻，剩余时间只回复
      let activeMin = 0, idleMin = elapsedMin;
      if (c.active) {
        const net = rates.qiNet;
        const minutesToEmpty = net < 0 ? res.qi / (-net) : Infinity;
        activeMin = Math.min(elapsedMin, minutesToEmpty);
        idleMin = elapsedMin - activeMin;

        // 修为/感悟（封顶）
        const stats = RP.get();
        stats.xiuWei = Math.min(RP.xiuWeiMax(), stats.xiuWei + rates.xiuWei * activeMin);
        stats.ganWu = Math.min(RP.ganWuMax(), stats.ganWu + rates.ganWu * activeMin);
        delta.xiuWei = Math.round(rates.xiuWei * activeMin);
        delta.ganWu = Math.round(rates.ganWu * activeMin);

        // 寿元消耗
        const lifeUsed = R().lifespanUsePerMin * activeMin;
        res.lifespanUsed += lifeUsed;
        delta.lifespanUsed = Math.round(lifeUsed * 10) / 10;

        // 灵气：净耗段 + 回复段
        res.qi = Math.max(0, res.qi + net * activeMin);
        res.qi = Math.min(res.qiMax, res.qi + regen * idleMin);
        if (minutesToEmpty <= elapsedMin) delta.pausedReason = 'qi';
      } else {
        // 停止状态：灵气照常回复 + 待机缓慢自愈（0.5%/分钟，防 hard-stuck）
        res.qi = Math.min(res.qiMax, res.qi + regen * elapsedMin);
        const d = Xuxian.entities.CombatFactories.playerDerived();
        if (res.hpCurrent != null) res.hpCurrent = Math.min(d.hpMax, res.hpCurrent + d.hpMax * 0.005 * elapsedMin);
        if (res.mpCurrent != null) res.mpCurrent = Math.min(d.mpMax, res.mpCurrent + d.mpMax * 0.005 * elapsedMin);
      }
      delta.qiUsed = Math.round((R().qiUsePerMin * activeMin) - (regen * idleMin));

      // 寿元红线：强制停止
      if (c.active && this.lifespanLeft() <= R().lifespanRedLine) {
        delta.pausedReason = 'lifespan';
      }
      if (delta.pausedReason) {
        c.active = false;
        c.stoppedReason = delta.pausedReason;
      }

      Xuxian.core.EventBus.emit(E().CULT_UPDATED);
      return delta;
    },
  };

  Xuxian.systems.cultivation.CultivationState = CultivationState;
})();

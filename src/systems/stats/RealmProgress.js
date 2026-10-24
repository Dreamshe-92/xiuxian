/**
 * systems/stats/RealmProgress.js — 境界进度管理（修为/感悟/火候/突破执行/心魔）
 * 数据宿主：GameState.data.stats（可存档）；UI 只读本模块的计算结果。
 * 突破成功率公式（与 balance/breakthrough.js 同源）：基础率 × 修为系数 × 感悟系数 + 命格机缘 - 心魔惩罚。
 */
(function () {
  'use strict';

  const B = () => Xuxian.data.balance.breakthrough;

  function defaultStats(player) {
    return {
      realmIndex: 0,
      xiuWei: 0,
      ganWu: 0,
      failStreak: 0,
      xinMo: false,
      pendingPoints: player.pendingPoints || 25,
      attributes: Object.assign({}, player.attributes),
    };
  }

  const RealmProgress = {
    /** 从 GameState 取/懒初始化 */
    get() {
      const gs = Xuxian.core.GameState.data;
      if (!gs.stats) gs.stats = defaultStats(gs.player || {});
      return gs.stats;
    },

    realm() { return B().realms[this.get().realmIndex]; },
    realmName() { return this.realm().name; },
    xiuWeiMax() { return this.realm().xiuWeiMax; },
    ganWuMax() { return B().ganWuMax; },
    progress() { return this.get().xiuWei / this.xiuWeiMax(); },
    inBottleneck() { const r = Xuxian.data.balance.cultivationRates; return this.progress() >= r.bottleneckAbove; },

    /** 玩家命格效果聚合（返回 {xiuWeiMult, ganWuMult, breakthroughBonus, ...}） */
    fateBonuses() {
      const out = { xiuWeiMult: 1, ganWuMult: 1, breakthroughBonus: 0, qiRegenMult: 1, xinMoResolveHalf: false, failStreakBonus: 0 };
      const player = Xuxian.core.GameState.data.player;
      const ids = (player && player.fate) || [];
      ids.forEach((id) => {
        const e = B().fateEffects[id];
        if (!e) return;
        if (e.xiuWeiMult) out.xiuWeiMult *= e.xiuWeiMult;
        if (e.ganWuMult) out.ganWuMult *= e.ganWuMult;
        if (e.breakthroughBonus) out.breakthroughBonus += e.breakthroughBonus;
        if (e.qiRegenMult) out.qiRegenMult *= e.qiRegenMult;
        if (e.xinMoResolveHalf) out.xinMoResolveHalf = true;
        if (e.failStreakBonus) out.failStreakBonus += e.failStreakBonus;
      });
      return out;
    },

    /** 是否已达第一幕终点（筑基初期，MVP 封顶） */
    isTerminal() { return this.get().realmIndex >= B().realms.length - 1; },

    /** 某火候档当前是否可尝试 + 明牌成功率（0~1） */
    evaluate(stageId) {
      const s = this.get();
      const stage = B().stages.find((x) => x.id === stageId);
      const eligible = !this.isTerminal() && this.progress() >= stage.progressMin
        && (!stage.ganWuMin || s.ganWu >= stage.ganWuMin);
      const rate = Math.max(0.05, Math.min(0.95,
        B().baseRate(s.realmIndex)
        * stage.progressMult
        * B().ganWuMult(s.ganWu, this.ganWuMax())
        + this.fateBonuses().breakthroughBonus
        + (s.failStreak > 0 ? this.fateBonuses().failStreakBonus * s.failStreak : 0)
        - (s.xinMo ? B().xinMoPenalty : 0)
      ));
      return { eligible, stage, rate };
    },

    /**
     * 执行突破。灵气校验由调用方（面板）做。
     * @returns {{success:boolean, narration:string, gains?:Object, xinMoBorn?:boolean, realmName:string}}
     */
    attempt(stageId, rng) {
      const s = this.get();
      if (this.isTerminal()) {
        return { success: false, narration: '筑基功成，已至第一幕尽头。前路（MVP 之后版本）再续。', terminal: true, realmName: this.realmName() };
      }
      const evalRes = this.evaluate(stageId);
      const roll = (rng ? rng() : Math.random()) < evalRes.rate;
      const name = (Xuxian.core.GameState.data.player || {}).name || '道友';
      const pick = (arr) => arr[Math.floor((rng ? rng() : Math.random()) * arr.length)];

      if (roll) {
        // 成功：进阶
        const nextIndex = s.realmIndex + 1;
        const next = B().realms[nextIndex];
        const gains = { realmFrom: this.realmName(), realmTo: next.name, isMajor: !!next.isMajor };
        s.realmIndex = nextIndex;
        s.xiuWei = 0;
        s.failStreak = 0;
        Object.keys(s.attributes).forEach((k) => { s.attributes[k] += 5; }); // 六维自然成长
        s.pendingPoints += 25;
        if (next.isMajor) {
          const p = Xuxian.core.GameState.data.player;
          p.lifespanMax += 100; // 大境界：寿元上限大涨（凡人表）
        }
        const narration = next.isMajor
          ? B().narration.successMajor.replace('{name}', name)
          : pick(B().narration.success).replace('{name}', name);
        return { success: true, narration, gains, realmName: next.name };
      }

      // 失败：扣修为感悟、连败计数、心魔判定
      s.xiuWei = Math.floor(s.xiuWei * B().failXiuWeiMult);
      s.ganWu = Math.max(0, s.ganWu - B().failGanWuLoss);
      s.failStreak += 1;
      const xinMoBorn = !s.xinMo && s.failStreak >= B().failStreakToXinMo;
      if (xinMoBorn) s.xinMo = true;
      let narration = pick(B().narration.fail).replace('{name}', name);
      if (xinMoBorn) narration += '\n' + B().narration.xinMoBorn;
      return { success: false, narration, xinMoBorn, realmName: this.realmName() };
    },

    /** 化解心魔（消耗感悟） */
    resolveXinMo() {
      const s = this.get();
      const cost = this.fateBonuses().xinMoResolveHalf ? 25 : 50;
      if (!s.xinMo || s.ganWu < cost) return { ok: false, cost };
      s.ganWu -= cost; s.xinMo = false; s.failStreak = 0;
      return { ok: true, cost };
    },
  };

  Xuxian.systems.stats.RealmProgress = RealmProgress;
})();

/**
 * systems/quest/TutorialChain.js — 新手链「青溪初行」5 步（当下要事卡数据源）
 * 步骤：①凝气成形 ②入世安身 ③初次闭关 ④初临青溪 ⑤结缘灵兽。
 * 完成即自动发奖（toast 告知）；全部完成后要事卡转为 常驻提醒（突破/占卜）。
 * 钩子由各系统调用 mark()（见 BattleSession/StoryScene/CultivationPanel/BeastParty 调用点）。
 */
(function () {
  'use strict';

  const E = () => Xuxian.config.constants.EVENTS;

  const STEPS = [
    { id: 'born',    name: '凝气成形', desc: '以心念唤道，凝出身躯。', reward: { stones: 20 },
      hint: '若未见此步完成，重开一局即可。' },
    { id: 'settle',  name: '入世安身', desc: '落字入世，抵达洞府。', reward: { stones: 20 } },
    { id: 'firstCult', name: '初次闭关', desc: '在修炼室开启一次闭关。', reward: { item: 'juLingFu', count: 2 } },
    { id: 'firstBattle', name: '初临青溪', desc: '外出青溪坡，完成一场战斗。', reward: { item: 'huiChun', count: 2 } },
    { id: 'firstBeast', name: '结缘灵兽', desc: '成功捕捉一只灵兽伙伴。', reward: { item: 'qingZhu', count: 1, extra: 'ningShen', extraCount: 2 } },
  ];

  const TutorialChain = {
    STEPS,

    get() {
      const gs = Xuxian.core.GameState.data;
      if (!gs.flags.tutorial) gs.flags.tutorial = { step: 0, done: {} }; // step=当前进行到的下标
      return gs.flags.tutorial;
    },

    current() {
      const t = this.get();
      return t.step < STEPS.length ? STEPS[t.step] : null;
    },

    isDone() { return this.get().step >= STEPS.length; },

    /** 各系统钩子：完成某步（幂等；发奖+推进） */
    mark(stepId) {
      const t = this.get();
      const cur = this.current();
      if (!cur || cur.id !== stepId || t.done[stepId]) return null;
      t.done[stepId] = true;
      t.step += 1;
      const r = cur.reward;
      const gs = Xuxian.core.GameState.data;
      const parts = [];
      if (r.stones) { gs.resources.stones = (gs.resources.stones || 0) + r.stones; parts.push('灵石+' + r.stones); }
      if (r.item) { Xuxian.systems.inventory.Inventory.add(r.item, r.count || 1); parts.push((Xuxian.systems.inventory.Inventory.def(r.item) || {}).name + '×' + (r.count || 1)); }
      if (r.extra) { Xuxian.systems.inventory.Inventory.add(r.extra, r.extraCount || 1); parts.push((Xuxian.systems.inventory.Inventory.def(r.extra) || {}).name + '×' + (r.extraCount || 1)); }
      Xuxian.core.SaveManager.save();
      Xuxian.core.EventBus.emit(E().SHOW_TOAST, `要事达成「${cur.name}」：${parts.join('、')}`);
      return cur;
    },

    /** 要事卡展示内容（新手链 or 完成后常驻提醒） */
    cardInfo() {
      const cur = this.current();
      if (cur) {
        const t = this.get();
        return { type: 'tutorial', title: '青溪初行 · ' + (t.step + 1) + '/' + STEPS.length, name: cur.name, desc: cur.desc };
      }
      // 完成后：突破提醒 / 占卜提醒
      const RP = Xuxian.systems.stats.RealmProgress;
      const gs = Xuxian.core.GameState.data;
      if (!RP.isTerminal() && RP.progress() >= 0.6) {
        return { type: 'hint', title: '⚡ 突破瓶颈', name: '时机已至', desc: `修为已达 ${Math.floor(RP.progress() * 100)}%，可往修炼室尝试冲关。` };
      }
      if (!gs.flags.lastDivination || gs.flags.lastDivination !== new Date().toDateString()) {
        return { type: 'hint', title: '🎲 今日未占', name: '每日占卜', desc: '一卦知今日吉凶，还有小奖。' };
      }
      return { type: 'hint', title: '当下要事', name: '道途无事', desc: '闭关养气，或外出青溪坡走走。' };
    },
  };

  Xuxian.systems.quest = Xuxian.systems.quest || {};
  Xuxian.systems.quest.TutorialChain = TutorialChain;
})();

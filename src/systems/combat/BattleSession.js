/**
 * systems/combat/Combat.js — 战斗核心（编排整场：回合/指令/伤害/捕捉/逃跑/结算）
 * 设计（需求确认第一轮）：
 *   · 行动顺序按速度混排（玩家/灵兽AI/敌方统一排序）
 *   · CommandDraft 只管人物单指令（结构留数组口子，双指令后升级）
 *   · 灵兽 AI 自动行动；自动战斗 AI 按策略表替玩家下指令
 *   · 结算收束：battle.settle() 前 GameState.flags.pendingBattleSettle = true（结算锁约定）
 * 事件：BATTLE_LOG（战报行）、BATTLE_STATE（界面刷新）。
 */
(function () {
  'use strict';

  const T = () => Xuxian.data.tables.beasts;
  const E = () => Xuxian.config.constants.EVENTS;

  /** 伤害公式：atk×随机(0.85~1.15) − def×0.6，下限 1 */
  function resolveDamage(attacker, defender) {
    const raw = attacker.atk * (0.85 + Math.random() * 0.3) - defender.def * 0.6;
    return Math.max(1, Math.round(raw));
  }

  const log = (session, text) => {
    session.log.push(text);
    Xuxian.core.EventBus.emit(E().BATTLE_LOG, text);
  };

  class BattleSession {
    /** @param {Array} enemies CombatUnit[]（wild） */
    constructor(enemies) {
      this.player = Xuxian.entities.CombatFactories.makePlayerUnit();
      this.enemies = enemies;
      this.round = 0;
      this.log = [];
      this.over = false;
      this.result = null;         // {outcome:'victory'|'defeat'|'flee'|'abandon', rewards, captures}
      this.pendingCaptures = [];  // 战斗中捕捉成功、战后经结算确认入袋
      this.autoMode = false;
      this.playerDraft = null;    // 本回合玩家指令 {type:'attack'|'skill'|'defend'|'catch'|'flee', target?, skillId?}
      this._rand = Math.random;

      // 首发灵兽自动入场（灵兽 AI 参战，需求确认第一轮）
      const party = Xuxian.systems.spiritBeast.BeastParty;
      const starter = party.getStarter();
      this.beast = starter ? Xuxian.entities.CombatFactories.makeBeastUnit(starter) : null;

      // 结算锁：整场战斗期间挂起，结算确认后才清（架构 §9）
      Xuxian.core.GameState.data.flags.pendingBattleSettle = true;
    }

    get allies() { return [this.player, this.beast].filter((u) => u && u.canAct); }
    get activeEnemies() { return this.enemies.filter((u) => u.canAct); }

    // ---------- 指令（DOM 指令条/自动AI 调用） ----------
    setDraft(cmd) { this.playerDraft = cmd; }

    hasDraft() { return !!this.playerDraft; }

    /** 某敌方是否可捕捉（等级 ≤ 携带上限） */
    catchable(unit) {
      return unit.canAct && unit.level <= Xuxian.entities.CombatFactories.carryLimit();
    }

    // ---------- 回合推进（玩家指令就绪后调用；自动模式下先由 AI 填指令） ----------
    advanceRound() {
      if (this.over) return;
      this.round += 1;
      this.player.defending = false;
      if (this.beast) this.beast.defending = false;

      // 玩家指令（自动模式先决策）
      if (this.autoMode && !this.playerDraft) {
        this.playerDraft = Xuxian.systems.combat.AutoBattleAI.decide(this);
      }
      const draft = this.playerDraft || { type: 'defend' };
      this.playerDraft = null;

      // 行动队列：速度混排（需求：人物/灵兽AI/敌人统一排序）
      const actors = [];
      if (this.player.canAct) actors.push({ unit: this.player, act: () => this._actPlayer(draft) });
      if (this.beast && this.beast.canAct) actors.push({ unit: this.beast, act: () => this._actBeastAI() });
      this.activeEnemies.forEach((e) => actors.push({ unit: e, act: () => this._actEnemyAI(e) }));
      actors.sort((a, b) => b.unit.spd - a.unit.spd);

      for (const a of actors) {
        if (!a.unit.canAct || this.over) continue; // 阵亡/已被捕捉/战斗已终
        a.act();
        if (this._checkEnd()) break;
      }
      if (!this.over) this._checkEnd();
      Xuxian.core.EventBus.emit(E().BATTLE_STATE, this.snapshot());
    }

    _actPlayer(draft) {
      const p = this.player;
      if (draft.type === 'attack') {
        const t = draft.target && draft.target.canAct ? draft.target : this.activeEnemies[0];
        if (!t) return;
        const dmg = t.takeDamage(resolveDamage(p, t));
        log(this, `${p.name}攻击${t.name}，${t.name}受到 ${dmg} 点伤害`);
      } else if (draft.type === 'skill') {
        const sk = T().playerSkills.find((s) => s.id === draft.skillId);
        if (!sk || !p.spendMp(sk.mpCost)) { log(this, `${p.name}法力不足，改为戒备`); p.defending = true; return; }
        const t = draft.target && draft.target.canAct ? draft.target : this.activeEnemies[0];
        if (!t) return;
        const dmg = t.takeDamage(Math.round(resolveDamage(p, t) * sk.mult));
        log(this, `${p.name}施展「${sk.name}」，${t.name}受到 ${dmg} 点伤害`);
      } else if (draft.type === 'defend') {
        p.defending = true;
        log(this, `${p.name}凝神戒备`);
      } else if (draft.type === 'catch') {
        const t = draft.target;
        if (!t || !t.canAct) return;
        if (!p.spendMp(T().catchMpCost)) { log(this, `${p.name}法力不足，捕捉失败`); return; }
        if (t.level > Xuxian.entities.CombatFactories.carryLimit()) {
          log(this, `${t.name}等级超出携带上限，无法捕捉`); return;
        }
        const rate = T().catchBase + (1 - t.hp / t.hpMax) * T().catchHpBonus;
        if (this._rand() < rate) {
          t.captured = true;
          this.pendingCaptures.push(t);
          log(this, `${t.name}已被收服！战后随行（结算后入袋）`);
        } else {
          log(this, `${p.name}施展「捕捉」，未能收服${t.name}`);
        }
      } else if (draft.type === 'flee') {
        if (this._rand() < T().fleeBase) {
          log(this, `${p.name}成功脱离战圈`);
          this._finish('flee');
        } else {
          log(this, `${p.name}尝试逃离，未能脱身`);
        }
      }
    }

    /** 灵兽 AI：攻击血量最低的敌人 */
    _actBeastAI() {
      const b = this.beast;
      const targets = this.activeEnemies;
      if (!targets.length) return;
      const t = targets.reduce((lo, e) => (e.hp < lo.hp ? e : lo), targets[0]);
      const dmg = t.takeDamage(resolveDamage(b, t));
      log(this, `${b.name}扑向${t.name}，${t.name}受到 ${dmg} 点伤害`);
    }

    /** 敌方 AI：随机攻击我方（灵兽在场时 40% 打灵兽） */
    _actEnemyAI(e) {
      const pool = this.allies;
      if (!pool.length) return;
      const t = (this.beast && this.beast.canAct && this._rand() < 0.4) ? this.beast : this.player;
      const dmg = t.takeDamage(resolveDamage(e, t));
      log(this, `${e.name}攻击${t.name}，${t.name}受到 ${dmg} 点伤害`);
    }

    _checkEnd() {
      if (this.over) return true;
      if (!this.activeEnemies.length) { this._finish('victory'); return true; }
      if (!this.player.alive) { this._finish('defeat'); return true; }
      return false;
    }

    _finish(outcome) {
      this.over = true;
      // 奖励：胜利/成功逃跑保留捕捉；失败/放弃全部丢失（调研验证的规则）
      const keepCaptures = (outcome === 'victory' || outcome === 'flee');
      const totalLevels = this.enemies.reduce((s, e) => s + (e.captured || !e.alive ? e.level : 0), 0);
      this.result = {
        outcome,
        rewards: outcome === 'victory'
          ? { xiuWei: Math.round(totalLevels * T().rewardXiuWeiPerLevel), ganWu: Math.round(totalLevels * T().rewardGanWuPerLevel) }
          : { xiuWei: 0, ganWu: 0 },
        captures: keepCaptures ? this.pendingCaptures.map((u) => ({
          speciesId: u.speciesId, name: u.name, level: u.level,
        })) : [],
      };
      // 奖励即时入账（结算面板确认后存档）
      const stats = Xuxian.systems.stats.RealmProgress.get();
      stats.xiuWei = Math.min(Xuxian.systems.stats.RealmProgress.xiuWeiMax(), stats.xiuWei + this.result.rewards.xiuWei);
      stats.ganWu = Math.min(Xuxian.systems.stats.RealmProgress.ganWuMax(), stats.ganWu + this.result.rewards.ganWu);
      log(this, outcome === 'victory' ? '本场战斗结束（胜）' : outcome === 'defeat' ? '道友力竭，本场结束（败）' : '本场战斗结束（撤离）');
    }

    /** 放弃战斗（确认弹窗后调用；保留捕捉全失——调研规则） */
    abandon() {
      if (this.over) return;
      this._finish('abandon');
    }

    /** 结算确认（ResultPanel 的 [结束本次战斗]）：捕捉入袋 + 清结算锁 + 存档 */
    settleConfirm() {
      const party = Xuxian.systems.spiritBeast.BeastParty;
      (this.result && this.result.captures || []).forEach((c) => party.addCaptured(c));
      Xuxian.core.GameState.data.flags.pendingBattleSettle = false;
      Xuxian.core.SaveManager.save();
    }

    /** UI 快照 */
    snapshot() {
      return {
        round: this.round, over: this.over, autoMode: this.autoMode,
        result: this.result,
        player: { name: this.player.name, hp: this.player.hp, hpMax: this.player.hpMax, mp: this.player.mp, mpMax: this.player.mpMax, alive: this.player.alive },
        beast: this.beast ? { name: this.beast.name, hp: this.beast.hp, hpMax: this.beast.hpMax, alive: this.beast.alive } : null,
        enemies: this.enemies.map((e) => ({ name: e.name, level: e.level, hp: e.hp, hpMax: e.hpMax, alive: e.alive, captured: e.captured, catchable: this.catchable(e), rarity: e.species.rarity })),
      };
    }
  }

  Xuxian.systems.combat = Xuxian.systems.combat || {};
  Xuxian.systems.combat.BattleSession = BattleSession;
  Xuxian.systems.combat.resolveDamage = resolveDamage;
})();

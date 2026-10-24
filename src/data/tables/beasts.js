/**
 * tables/beasts.js — 灵兽图鉴（MVP：青溪坡 5 种）+ 战斗技能表
 * 资质字段对齐调研（资质×成长双轴）；等级带决定野外遭遇 roll 范围。
 */
(function () {
  'use strict';
  Xuxian.data.tables.beasts = {
    /** 青溪坡出没灵兽（MVP 单野外点） */
    species: [
      { id: 'candle_fox', name: '烛尾狐', levelBand: [5, 12], rarity: '普通',
        base: { hp: 60, mp: 40, atk: 14, def: 6, spd: 14 },
        aptitude: { attack: 820, defense: 700, speed: 950 }, growth: 1.02,
        flavor: '灰白小狐，尾端长毛聚起灵火时宛如烛芯。' },
      { id: 'steel_boar', name: '钢背猪', levelBand: [5, 12], rarity: '普通',
        base: { hp: 90, mp: 30, atk: 10, def: 12, spd: 7 },
        aptitude: { attack: 700, defense: 950, speed: 600 }, growth: 1.0,
        flavor: '脊背覆着钢鬃般的硬毛，冲撞起来势大力沉。' },
      { id: 'spirit_wolf', name: '精灵狼', levelBand: [5, 12], rarity: '普通',
        base: { hp: 55, mp: 45, atk: 13, def: 7, spd: 16 },
        aptitude: { attack: 780, defense: 650, speed: 1000 }, growth: 1.03,
        flavor: '身形轻捷的幼狼，眼瞳在暗处泛着微光。' },
      { id: 'mimi_cat', name: '咪咪', levelBand: [6, 9], rarity: '稀有',
        base: { hp: 75, mp: 60, atk: 12, def: 9, spd: 12 },
        aptitude: { attack: 850, defense: 800, speed: 900 }, growth: 1.05,
        flavor: '溪畔草坡的稀有灵猫，向阳石边偶见小巧爪印。' },
      { id: 'thorn_boar_king', name: '荆鬃猪王', levelBand: [14, 16], rarity: '精英',
        base: { hp: 260, mp: 80, atk: 22, def: 16, spd: 9 },
        aptitude: { attack: 1100, defense: 1100, speed: 500 }, growth: 1.08,
        flavor: '青溪坡一霸，钢鬃如林。低境界修士绕道而行。' },
    ],
    /** 携带规则：携带等级上限 = (境界序号+1)×8（炼气初 8 / 中 16 / …） */
    carryPerRealm: 8,
    /** 捕捉基础参数 */
    catchBase: 0.35,        // 满血基础成功率
    catchHpBonus: 0.45,     // 血量比例越低加成越高（线性）
    catchMpCost: 15,
    /** 逃跑 */
    fleeBase: 0.5,
    /** 战斗奖励：修为/感悟 = Σ(敌方等级 × 系数) */
    rewardXiuWeiPerLevel: 4,
    rewardGanWuPerLevel: 1.5,

    /** 玩家神通（MVP 通用技；功法体系接死后按灵根/流派扩展） */
    playerSkills: [
      { id: 'spirit_blade', name: '灵刃', type: 'attack', mpCost: 20, mult: 1.8,
        desc: '凝聚灵力化作刃光，造成 180% 物理伤害。' },
      { id: 'guard', name: '护体', type: 'defend', mpCost: 0,
        desc: '凝神戒备，本回合受到伤害减半。' },
    ],
  };
})();

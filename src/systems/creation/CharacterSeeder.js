/**
 * systems/creation/CharacterSeeder.js — 角色骨架生成器（可种子 RNG）
 * 职责：从配置表 roll 出道身骨架——姓名 / 身世片段 / 灵根（心念加权）/ 年龄寿元 / 六维。
 * 可种子化：同一 seed 生成结果一致，便于调试复现与"回看这一世"。
 */
(function () {
  'use strict';

  /** mulberry32 — 轻量可种子随机数（返回函数，调用得 [0,1)） */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** 从数组按权重抽一个：items=[{...,weight}]（缺省 weight=1） */
  function weightedPick(rng, items, weightOf) {
    const total = items.reduce((s, it) => s + (weightOf ? weightOf(it) : (it.weight || 1)), 0);
    let roll = rng() * total;
    for (const it of items) {
      roll -= weightOf ? weightOf(it) : (it.weight || 1);
      if (roll < 0) return it;
    }
    return items[items.length - 1];
  }

  const ATTR_NAMES = ['体魄', '力道', '灵力', '根骨', '身法', '神识'];

  class CharacterSeeder {
    /** @param {number} seed 种子（Date.now() 或指定值） */
    constructor(seed) {
      this.seed = seed;
      this.rng = mulberry32(seed);
    }

    /** 抽取 n 个不重复元素（从字符串数组） */
    _pickDistinct(pool, n) {
      const copy = pool.slice();
      const out = [];
      while (out.length < n && copy.length > 0) {
        out.push(copy.splice(Math.floor(this.rng() * copy.length), 1)[0]);
      }
      return out;
    }

    /** 生成灵根（心念关键词加权） */
    _rollSpiritRoot(intentParse) {
      const T = Xuxian.data.tables.spiritRoots;
      const boost = (intentParse && intentParse.elementBoost) || {};

      // 1) 档位
      const tier = weightedPick(this.rng, T.tiers);
      // 2) 属性：天=单五行；变异=变异池；真=2~3 五行；伪=4~5 五行
      let elements;
      if (tier.id === 'mutant') {
        elements = this._pickDistinct(T.mutantElements, 1);
      } else {
        const count = tier.attrCount[0] + Math.floor(this.rng() * (tier.attrCount[1] - tier.attrCount[0] + 1));
        // 加权池：命中心念关键词的属性 weight×3
        const pool = T.elements.map((el) => ({ el, weight: boost[el] || 1 }));
        elements = [];
        for (let i = 0; i < count; i++) {
          const pick = weightedPick(this.rng, pool.filter((p) => !elements.includes(p.el)));
          if (!pick) break;
          elements.push(pick.el);
        }
      }
      return {
        tier: tier.id,
        tierName: tier.name,
        speedMult: tier.speedMult,
        desc: tier.desc,
        elements,
        strength: 50 + Math.floor(this.rng() * 50), // 灵根强度（50~99，展示用）
      };
    }

    /** 生成完整骨架 */
    rollSkeleton(intent, intentParse) {
      const N = Xuxian.data.tables.names;
      const B = Xuxian.data.tables.backgroundFragments;
      const rng = this.rng;
      const pick = (arr) => arr[Math.floor(rng() * arr.length)];

      const origin = pick(B.origins);
      const family = pick(B.families);
      const encounter = pick(B.encounters);
      const personality = pick(B.personalities);
      const template = pick(B.templates);
      const story = template
        .replace('{origin}', origin).replace('{family}', family)
        .replace('{encounter}', encounter).replace('{personality}', personality)
        .replace('{intent}', intent);

      const spiritRoot = this._rollSpiritRoot(intentParse);
      const attributes = {};
      ATTR_NAMES.forEach((k) => { attributes[k] = 15; });

      return {
        seed: this.seed,
        name: pick(N.surnames) + pick(N.givenNames),
        background: { origin, family, encounter, personality, story },
        spiritRoot,
        attributes,                 // 六维（15 起）
        pendingPoints: 25,          // 待分配属性点（M2 角色面板分配）
        age: 16 + Math.floor(rng() * 5),          // 16~20
        lifespanMax: 100 + Math.floor(rng() * 21), // 100~120（凡人表：炼气百余岁）
        commentary: Xuxian.data.tables.spiritRoots.commentary[spiritRoot.tier], // 天道评语（降级版）
        createdAt: Date.now(),
      };
    }
  }

  Xuxian.systems.creation.CharacterSeeder = CharacterSeeder;
})();

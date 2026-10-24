/**
 * systems/creation/FateDealer.js — 命格发牌器
 * 规则（需求确认第三轮）：6 张候选 = 3 凡 + 2 灵 + 1 天（天品必现，开局必有惊喜）；
 * 心念命中的 tags 命格抽取权重 ×3（如心念写"剑"→剑系命格更易入池）。
 */
(function () {
  'use strict';

  Xuxian.systems.creation.FateDealer = {
    /**
     * @param {Function} rng CharacterSeeder 的随机函数
     * @param {{tags:Set}} intentParse 心念解析结果
     * @returns {Array} 6 张命格（不重复）
     */
    draw(rng, intentParse) {
      const all = Xuxian.data.tables.fate;
      const tags = (intentParse && intentParse.tags) || new Set();

      const drawFrom = (tier, n) => {
        const pool = all.filter((f) => f.tier === tier);
        // 心念命中的命格权重 ×3
        const weightOf = (f) => (f.tags.some((t) => tags.has(t)) ? 3 : 1);
        const copy = pool.slice();
        const out = [];
        while (out.length < n && copy.length > 0) {
          const total = copy.reduce((s, f) => s + weightOf(f), 0);
          let roll = rng() * total;
          let picked = copy[copy.length - 1];
          for (const f of copy) {
            roll -= weightOf(f);
            if (roll < 0) { picked = f; break; }
          }
          out.push(picked);
          copy.splice(copy.indexOf(picked), 1);
        }
        return out;
      };

      return [...drawFrom('凡', 3), ...drawFrom('灵', 2), ...drawFrom('天', 1)];
    },
  };
})();

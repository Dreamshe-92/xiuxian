/**
 * systems/creation/HeartIntentParser.js — 心念解析器
 * 输入一句心念 → 输出 { tags:Set, elementBoost:{属性:倍率}, matched:[关键词] }。
 * 这是"无 AI 时心念也影响生成"的关键：解析结果喂给 CharacterSeeder（灵根加权）与 FateDealer（命格加权）。
 */
(function () {
  'use strict';

  Xuxian.systems.creation.HeartIntentParser = {
    /**
     * @param {string} intent 心念原文（≤200 字）
     * @returns {{tags:Set<string>, elementBoost:Object<string,number>, matched:string[]}}
     */
    parse(intent) {
      const text = String(intent || '');
      const tags = new Set();
      const elementBoost = {};
      const matched = [];

      Xuxian.data.tables.intentKeywords.forEach((rule) => {
        if (text.includes(rule.kw)) {
          matched.push(rule.kw);
          (rule.tags || []).forEach((t) => tags.add(t));
          (rule.elements || []).forEach((el) => {
            elementBoost[el] = (elementBoost[el] || 1) * 3; // 命中关键词的属性权重 ×3
          });
        }
      });

      return { tags, elementBoost, matched };
    },
  };
})();

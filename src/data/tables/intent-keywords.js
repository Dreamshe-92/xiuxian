/**
 * tables/intent-keywords.js — 心念关键词表（HeartIntentParser 的数据源）
 * 作用：无 AI 时心念也真实影响生成——关键词→标签→灵根属性加权 & 命格候选加权。
 */
(function () {
  'use strict';
  Xuxian.data.tables.intentKeywords = [
    // 战斗/剑
    { kw: '剑', tags: ['sword'],   elements: ['金', '风'] },
    { kw: '刀', tags: ['sword'],   elements: ['金'] },
    { kw: '杀', tags: ['sword'],   elements: ['金'] },
    // 生产
    { kw: '丹', tags: ['alchemy'], elements: ['火', '木'] },
    { kw: '药', tags: ['alchemy'], elements: ['木', '火'] },
    { kw: '器', tags: ['forge'],   elements: ['金'] },
    // 灵兽
    { kw: '兽', tags: ['beast'],   elements: ['木'] },
    { kw: '妖', tags: ['beast'],   elements: ['木', '幽'] },
    { kw: '宠', tags: ['beast'],   elements: ['木'] },
    // 变异属性倾向
    { kw: '雷', tags: [],          elements: ['雷'] },
    { kw: '风', tags: [],          elements: ['风'] },
    { kw: '冰', tags: [],          elements: ['冰'] },
    { kw: '暗', tags: [],          elements: ['幽'] },
    // 其他
    { kw: '财', tags: ['wealth'] },
    { kw: '富', tags: ['wealth'] },
    { kw: '侠', tags: ['sword'] },
    { kw: '魔', tags: [],          elements: ['幽'] },
  ];
})();

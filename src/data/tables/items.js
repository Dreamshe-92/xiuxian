/**
 * tables/items.js — 物品与装备定义（M4）
 * 消耗品：聚灵符/回春丹/凝神丹；装备：新手法兵「青竹剑」（新手链第5步奖励）。
 * 装备位对齐调研六槽：法兵/法冠/腰封/灵佩/法衣/云履（MVP 只出法兵一件，其余槽位预留）。
 */
(function () {
  'use strict';
  Xuxian.data.tables.items = {
    /** 消耗品（type:'consumable'）与装备（type:'equipment'） */
    defs: [
      { id: 'juLingFu',  type: 'consumable', name: '聚灵符', icon: '🧧', stack: 99,
        effect: { qi: 60 }, desc: '灵气 +60（天地灵气不足时的应急之选）。' },
      { id: 'huiChun',   type: 'consumable', name: '回春丹', icon: '🌕', stack: 99,
        effect: { hpPct: 0.4 }, desc: '恢复 40% 气血。' },
      { id: 'ningShen',  type: 'consumable', name: '凝神丹', icon: '🌕', stack: 99,
        effect: { mpPct: 0.4 }, desc: '恢复 40% 法力。' },
      { id: 'qingZhu',   type: 'equipment', name: '青竹剑', icon: '⚔️', slot: '法兵',
        bonus: { atk: 12 }, desc: '青竹所制的入门法兵。锋刃未开，已见剑意。' },
    ],
    /** 装备槽（顺序即面板展示顺序；bonus 字段见 AttributeCalc/Factories） */
    slots: ['法兵', '法冠', '腰封', '灵佩', '法衣', '云履'],
    bagMax: 40, // 储物袋格数（物品种类数上限）
  };
})();

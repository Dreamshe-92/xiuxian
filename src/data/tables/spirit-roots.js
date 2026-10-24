/**
 * tables/spirit-roots.js — 灵根四档定义（凡人体系，需求确认第三轮）
 * 概率：天 2% / 变异 8% / 真 40% / 伪 50%；伪灵根带"后天补全"成长钩子。
 */
(function () {
  'use strict';
  Xuxian.data.tables.spiritRoots = {
    /** 档位（weight 为抽取权重） */
    tiers: [
      { id: 'heaven', name: '天灵根',  weight: 2,  speedMult: 2.0, attrCount: [1, 1], desc: '单一五行，灵气充盈，修炼一日抵他人数日。大境界突破无瓶颈之虞。' },
      { id: 'mutant', name: '变异灵根', weight: 8,  speedMult: 1.5, attrCount: [1, 1], desc: '五行之外的变异属性，路子奇、走得快，流派之门为此而开。' },
      { id: 'true',   name: '真灵根',  weight: 40, speedMult: 1.2, attrCount: [2, 3], desc: '两三种属性的中庸之资，勤修可补。' },
      { id: 'pseudo', name: '伪灵根',  weight: 50, speedMult: 0.8, attrCount: [4, 5], desc: '五行驳杂，仙途晦暗——但传闻有后天补全之法，未至终点，谁说的准呢。' },
    ],
    /** 常规五行属性（真/伪灵根从中抽取） */
    elements: ['金', '木', '水', '火', '土'],
    /** 变异属性池（天灵根单五行；变异灵根从这里抽） */
    mutantElements: ['雷', '风', '冰', '幽', '蚀'],
    /** 天道评语（降级版：按档位固定文案，M5 接 AI 自评） */
    commentary: {
      heaven: '「万里挑一之资。天道无言，然此子灵光自蕴，非常人也。」',
      mutant: '「灵根有异，非五行之常。前路诡谲，亦非常途可度。」',
      true:   '「中人之资，勤可补拙。大道虽远，行则将至。」',
      pseudo: '「五行驳杂，仙途晦暗。然心念所向，或有奇迹——天道无言，观其行止。」',
    },
  };
})();

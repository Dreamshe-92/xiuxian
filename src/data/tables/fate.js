/**
 * tables/fate.js — 命格池（24 张：凡 10 / 灵 10 / 天 4）
 * 需求：每张 = 名称 + 品阶 + tags + 效果标签 + 风味文案；抽取保底结构 3凡+2灵+1天。
 * 效果数值 M2+ 数值系统接入生效，M1 先承载于角色档案。
 */
(function () {
  'use strict';
  Xuxian.data.tables.fate = [
    // ===== 凡品 ×10 =====
    { id: 'chuXin',     name: '初心不改', tier: '凡', tags: [],           effect: '感悟获取 +5%',           flavor: '心之所向，从未改易。' },
    { id: 'qinNeng',    name: '勤能补拙', tier: '凡', tags: [],           effect: '闭关修为 +3%',           flavor: '别人一遍，我十遍。' },
    { id: 'shanTi',     name: '山野体健', tier: '凡', tags: [],           effect: '气血上限 +20',           flavor: '打小风里雨里，底子厚实。' },
    { id: 'erCong',     name: '耳聪目明', tier: '凡', tags: [],           effect: '命中 +2%',               flavor: '林子里的动静，瞒不过这双耳朵。' },
    { id: 'cuYaoLi',    name: '粗通药理', tier: '凡', tags: ['alchemy'],  effect: '采药收益 +5%',           flavor: '认得几味草药，饿不死。' },
    { id: 'xiCai',      name: '惜财如命', tier: '凡', tags: [],           effect: '灵石消耗 -2%',           flavor: '一枚灵石掰成两半花。' },
    { id: 'xinKuan',    name: '心宽体胖', tier: '凡', tags: [],           effect: '自然恢复 +5%',           flavor: '天塌下来，先睡一觉。' },
    { id: 'mengDao',    name: '梦里悟道', tier: '凡', tags: [],           effect: '闭关感悟 +5%',           flavor: '白日修行，梦里参玄。' },
    { id: 'puZhuo',     name: '朴拙之器', tier: '凡', tags: ['forge'],    effect: '炼器灵石消耗 -3%',       flavor: '器物无华，用得顺手。' },
    { id: 'mingYing',   name: '命硬',     tier: '凡', tags: [],           effect: '致命伤保留 1 气血（每场一次）', flavor: '阎王殿前走过三遭，名字都磨糊了。' },
    // ===== 灵品 ×10 =====
    { id: 'jianXin',    name: '剑心初萌', tier: '灵', tags: ['sword'],    effect: '物攻 +3%',               flavor: '见剑则喜，拔剑则安。' },
    { id: 'danHuo',     name: '丹火亲和', tier: '灵', tags: ['alchemy'],  effect: '炼丹成功率 +5%',         flavor: '火候到了，丹香自起。' },
    { id: 'shouYu',     name: '兽语微通', tier: '灵', tags: ['beast'],    effect: '捕捉成功率 +3%',         flavor: '那畜生看了你一眼，竟没跑。' },
    { id: 'fengXing',   name: '风行之姿', tier: '灵', tags: [],           effect: '速度 +5%',               flavor: '走路带风，快人一步。' },
    { id: 'tongJin',    name: '铜筋铁骨', tier: '灵', tags: [],           effect: '物防 +5%',               flavor: '皮糙肉厚，寻常刀剑难伤。' },
    { id: 'lingTai',    name: '灵台清明', tier: '灵', tags: [],           effect: '感悟获取 +10%',          flavor: '杂念不生，一点灵明。' },
    { id: 'juLing',     name: '聚灵之体', tier: '灵', tags: [],           effect: '灵气回复 +5%',           flavor: '灵气见你，如水归渠。' },
    { id: 'huiYan',     name: '慧眼识珠', tier: '灵', tags: ['wealth'],   effect: '战斗灵石掉落 +5%',       flavor: '砂里淘金，一眼准。' },
    { id: 'yueZhuo',    name: '越挫越勇', tier: '灵', tags: [],           effect: '突破失败后下次成功率 +2%', flavor: '跌倒了，抓把土也要站起来。' },
    { id: 'jingShui',   name: '静水流深', tier: '灵', tags: [],           effect: '闭关收益 +8%',           flavor: '不声不响，一日千里。' },
    // ===== 天品 ×4 =====
    { id: 'daoGu',      name: '天生道骨', tier: '天', tags: [],           effect: '修炼速度 +10%',          flavor: '生而知之者，骨里带道。' },
    { id: 'jianGu',     name: '剑骨天成', tier: '天', tags: ['sword'],    effect: '物攻 +8%，剑技威力 +5%',  flavor: '天生一副剑骨头，睡觉都握着剑。' },
    { id: 'zaoHua',     name: '造化钟灵', tier: '天', tags: ['wealth'],   effect: '所有资源获取 +5%',       flavor: '天地灵秀，独钟此身。' },
    { id: 'daoXinTM',   name: '道心通明', tier: '天', tags: [],           effect: '心魔抗性 +50%，感悟 +15%', flavor: '八风不动，一点真如。' },
  ];
})();

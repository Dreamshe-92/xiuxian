# xuxian · Phaser 中大型 HTML5 游戏工程架构

> **文档状态**：设计稿，待用户确认后再落地代码骨架。  
> **本阶段范围**：只出架构说明与目录约定；**不**创建完整可运行游戏脚手架（不引入大范围空源码）。  
> **技术栈（用户已定）**：HTML + JavaScript + Phaser.js，浏览器可直接打开运行。  
> **三大目标**：运行高性能 · 功能高扩展性 · 代码高可维护性。  
> **玩法承接**：目录与模块命名对齐仓库调研（洞府枢纽、修炼突破、回合战斗、灵兽、坊市/制造等）；尚未确认的玩法标「待需求确认」，只预留扩展位。

---

## 0. 先读这一段（怎么用本文档）

1. 先看 **§1 设计原则** 与 **§2 目录总览**，建立「文件夹长什么样」的印象。  
2. 再按兴趣跳读：**场景**（§3）、**游戏模块**（§4）、**资源**（§5）、**全局基础设施**（§6）。  
3. **§7～§9** 说明模块怎么互相依赖、场景怎么切换、配置表怎么驱动玩法——回答「为什么这样拆、以后怎么加功能」。  
4. **§10** 对照调研文档，标明哪些目录是「现在就要」、哪些是「待需求确认的扩展位」。  
5. 确认本架构后，才会进入「每轮 1～2 个方向」的问答调研；**本文档不向你提问具体玩法需求**。

---

## 1. 设计原则（对应三大目标）

| 目标 | 工程上怎么落地 |
|------|----------------|
| **高性能** | 场景按需加载/卸载；资源分「首包 / 按场景包」；战斗与 UI 用对象池减少反复创建销毁；耗时逻辑与渲染解耦；避免在每帧里扫全表或读大 JSON。 |
| **高扩展性** | 玩法按**领域模块**拆分（玩家、敌人、灵兽、道具…）；新系统优先加文件、少改旧文件；数值与关卡进 **配置表**（JSON），少写死在代码里。 |
| **高可维护性** | 单一职责：场景只管「这一屏在干什么」；业务逻辑进 `systems/` / `entities/`；公共能力进 `core/`；中文注释 + 统一命名；事件总线解耦「谁通知谁」。 |

**为何选「纯 Phaser + 原生 JS」结构、暂不绑构建器**：当前阶段要便于浏览器直开、方便零基础对照目录阅读。目录已按中大型项目预留；若后续确认上 Vite/打包，只需把 `src/` 作为入口迁入，**目录语义不变**。

---

## 2. 推荐工程目录总览

下列树是**目标形态**（确认架构后可逐步建文件夹）。本阶段以文档描述为准，不批量提交空业务代码。

```text
xiuxian/                          # 仓库根（项目代号 xuxian）
├── index.html                    # 唯一浏览器入口：挂载游戏画布、引入 Phaser 与主脚本
├── package.json                  # （可选，待确认）本地静态服务 / 脚本；本阶段可不建
├── AGENTS.md                     # AI/多人协作约定（已有）
├── PROGRESS.md                   # 进度交接（已有）
├── README.md                     # 给人看的项目说明（已有）
├── docs/                         # 设计与调研（已有 + 本文）
│   ├── phaser-project-architecture.md   # ← 本架构文档
│   ├── 万界道友-游戏流程调研.md
│   ├── 凡人修仙传-参考素材.md
│   └── 灵兽合成参考-梦幻西游.md
│
└── src/                          # 全部游戏源码与运行时资源（确认后创建）
    ├── main.js                   # 创建 Phaser.Game、注册场景、挂载全局单例
    ├── config/
    │   ├── gameConfig.js         # Phaser 启动配置（宽高、物理、渲染、缩放）
    │   ├── constants.js          # 全局常量（场景键名、图层、事件名字符串等）
    │   └── balance/              # 数值平衡表入口（再导出 JSON）
    │
    ├── core/                     # 与具体玩法无关的「骨架能力」
    │   ├── EventBus.js           # 全局事件总线
    │   ├── GameState.js          # 全局运行时状态（存档镜像、当前场景标记等）
    │   ├── SaveManager.js        # 本地存档读写（localStorage 等，待需求确认）
    │   ├── AssetKeys.js          # 资源键名集中管理，避免字符串散落
    │   ├── BaseScene.js          # 场景公共基类（生命周期钩子、安全销毁）
    │   └── BaseEntity.js         # 实体公共基类（精灵 + 组件挂载约定）
    │
    ├── scenes/                   # Phaser 场景：一屏/一流程一段
    │   ├── BootScene.js          # 启动页：极简引导、设缩放、进加载
    │   ├── PreloadScene.js       # 资源加载：进度条、分包加载
    │   ├── MainMenuScene.js      # 主菜单：开始/继续/设置入口
    │   ├── StoryScene.js         # 文字剧情幕（待需求确认细节）
    │   ├── HubScene.js           # 洞府/枢纽主场景（日常循环入口）
    │   ├── WorldMapScene.js      # 世界舆图（待需求确认）
    │   ├── BattleScene.js        # 战斗主场景（回合制）
    │   ├── overlays/             # 盖在主场景上的「弹层场景」
    │   │   ├── PauseOverlay.js   # 暂停
    │   │   ├── ResultOverlay.js  # 结算（胜/负/逃跑收束）
    │   │   ├── DialogOverlay.js  # 通用确认/提示弹窗
    │   │   └── TutorialOverlay.js# 分步教学弹层（待需求确认）
    │   └── index.js              # 统一导出场景列表，供 main.js 注册
    │
    ├── entities/                 # 「看得见的东西」：角色、敌人、掉落物等
    │   ├── player/
    │   │   ├── Player.js
    │   │   └── PlayerView.js     # 仅负责外观/动画，逻辑尽量外置
    │   ├── enemy/
    │   │   ├── Enemy.js
    │   │   └── EnemyFactory.js   # 按配置表生成敌人
    │   ├── spirit-beast/         # 灵兽（调研核心；合成深度待确认）
    │   │   ├── SpiritBeast.js
    │   │   └── SpiritBeastFactory.js
    │   ├── npc/                  # NPC（待需求确认）
    │   └── props/                # 场景摆件、可互动物
    │
    ├── systems/                  # 「看不见的规则」：按领域拆分
    │   ├── combat/               # 战斗：回合、指令、伤害、状态效果
    │   │   ├── TurnManager.js
    │   │   ├── CommandDraft.js   # 人物+灵兽双指令草稿（调研已验证形态）
    │   │   ├── DamageResolver.js
    │   │   └── StatusEffects.js
    │   ├── stats/                # 数值：六维、派生属性、境界
    │   │   ├── AttributeCalc.js
    │   │   └── RealmProgress.js  # 修为/感悟/突破（待需求确认公式）
    │   ├── inventory/            # 背包与装备位
    │   ├── economy/              # 灵石/灵气等资源（待需求确认）
    │   ├── cultivation/          # 闭关/突破/功法研习（待需求确认）
    │   ├── crafting/             # 炼丹/炼器/阵纹（待需求确认）
    │   ├── spirit-beast/         # 捕捉、出战、融合入口（融合细则待确认）
    │   ├── quest/                # 任务/引导链（待需求确认）
    │   └── ui/                   # 非场景级 UI 逻辑（HUD 数据绑定等）
    │
    ├── components/               # 可复用「积木」：挂到实体或 UI 上
    │   ├── HealthBar.js
    │   ├── FloatingText.js
    │   └── ...
    │
    ├── ui/                       # 界面拼装（按钮、面板、列表）
    │   ├── hud/
    │   ├── menus/
    │   ├── panels/               # 角色面板、灵兽袋、储物袋等
    │   └── common/               # 通用按钮、滚动列表、标签页
    │
    ├── effects/                  # 特效：粒子、受击闪白、技能演出
    │   ├── VfxFactory.js
    │   └── pools/                # 特效对象池
    │
    ├── services/                 # 对外服务封装（本阶段多为本地；预留）
    │   ├── AudioService.js
    │   ├── ConfigService.js      # 读取/缓存 JSON 配置
    │   └── AiNarrativeService.js # AI 文案占位（超时兜底必做，待需求确认）
    │
    ├── utils/                    # 纯工具函数（无 Phaser 依赖优先）
    │   ├── math.js
    │   ├── random.js
    │   ├── format.js             # 数字/境界文案格式化
    │   └── deepClone.js
    │
    └── assets/                   # 运行时资源（按类型分，见 §5）
        ├── images/
        ├── audio/
        ├── fonts/
        ├── data/                 # 配置表、关卡、图鉴 JSON
        └── atlases/              # 图集（性能向）
```

### 根目录与入口文件（作用说明）

| 路径 | 作用（通俗说） |
|------|----------------|
| `index.html` | 打开游戏的网页：放一个画布容器，按顺序加载 Phaser CDN（或本地副本）和 `src/main.js`。 |
| `src/main.js` | 「总开关」：创建 `Phaser.Game`、注册全部场景、初始化 EventBus / GameState。 |
| `src/config/gameConfig.js` | 告诉 Phaser：窗口多大、用不用物理引擎、背景色、缩放模式。 |
| `src/config/constants.js` | 所有「魔法字符串」集中处：场景名 `SCENES.BATTLE`、事件名 `EVENTS.TURN_END`，改一处全局一致。 |
| `docs/` | 给人与 AI 读的设计/调研；**不参与运行**。 |

---

## 3. 场景分层（Scene）

Phaser 里**一个 Scene ≈ 一段完整流程或一块可叠加界面**。中大型项目建议：**主流程场景** + **弹层场景（Overlay）** 分开，避免一个文件里又管战斗又管暂停菜单。

### 3.1 主流程场景

| 场景文件 | 职责 | 何时进入 |
|----------|------|----------|
| `BootScene` | 启动页：设分辨率/缩放、注册极少启动资源、立刻进 Preload。几乎无玩法。 | 游戏打开第一帧 |
| `PreloadScene` | 资源加载：显示进度条；可分「首包」（菜单必需）与「后续包」（战斗/洞府）。 | Boot 之后 |
| `MainMenuScene` | 主菜单：新开局 / 读档 / 设置；不承载养成逻辑。 | 首包加载完成 |
| `StoryScene` | 文字剧情：打字机、分支选项、回看（对齐调研「落字/分幕」形态）。 | 新局入世或任务触发 |
| `HubScene` | **洞府枢纽**：日常入口（修炼室、储物、外出等入口按钮/区域）。中大型后可再拆子场景。 | 剧情/菜单进入日常 |
| `WorldMapScene` | 世界舆图：选地点去野外/坊市/秘境。 | 从洞府「外出」 |
| `BattleScene` | **战斗主场景**：回合循环、指令面板、战报；尽量不直接写养成公式。 | 野外遭遇/副本/切磋 |

> **命名说明**：调研里的「洞府 `/game`」在此对应 `HubScene`；「野外战斗」对应 `BattleScene`。若后续确认以「修仙文字交互」为主、Phaser 偏演出层，仍保留上述场景键，便于替换实现而不改导航流。

### 3.2 弹层场景（Overlay）

弹层用 Phaser 的 **并行场景（launch / pause）** 盖在当前主场景上，关闭后恢复，不必销毁整个战斗。

| 弹层 | 作用 |
|------|------|
| `PauseOverlay` | 暂停：继续 / 设置 / 回枢纽（需确认是否允许战斗中退出）。 |
| `ResultOverlay` | **结算**：胜负、掉落、捕捉结果；对应调研中「结束本次战斗」收束，避免只藏在战斗页内。 |
| `DialogOverlay` | 通用确认框（消耗灵石、放弃战斗代价等）。 |
| `TutorialOverlay` | 分步教学（每页 2～3 步那种）；待需求确认是否首版就要。 |

### 3.3 推荐场景切换流（简图）

```text
BootScene
  → PreloadScene（首包）
    → MainMenuScene
         ├─ 新开局 → StoryScene → HubScene
         └─ 继续   → HubScene（读档恢复）

HubScene
  ├─ 修炼/背包/角色面板 ……（多数用 UI 面板，不必换场景）
  ├─ 外出 → WorldMapScene →（遭遇）→ BattleScene
  └─ 剧情任务 → StoryScene → 回到 HubScene

BattleScene
  ├─ 暂停 → PauseOverlay（关闭后回战斗）
  └─ 战斗结束 → ResultOverlay → 确认收束 → HubScene 或 WorldMapScene
```

**为何这样切**：  
- 加载与菜单分离 → 首屏快、失败好排查。  
- 枢纽与战斗分离 → 战斗可全力做回合与演出，卸掉洞府 UI。  
- 结算独立弹层 → 落实调研教训：结算确认要有明确收束，避免「锁状态」体验。

---

## 4. 模块化组件与领域系统

原则：**entities 负责「是什么」；systems 负责「规则怎么算」；ui 负责「怎么点怎么显示」；scenes 只编排上述三者。**

### 4.1 实体模块（`entities/`）

| 目录/文件 | 作用 |
|-----------|------|
| `player/Player.js` | 玩家运行时对象：当前气血法力、装备引用、出战灵兽引用等。 |
| `player/PlayerView.js` | 精灵/立绘/动画；与数值计算拆开，方便换皮。 |
| `enemy/Enemy.js` | 敌方单位；字段尽量来自配置表，而不是写死种类。 |
| `enemy/EnemyFactory.js` | `create('candle_fox', { level: 6 })` 这类工厂。 |
| `spirit-beast/` | 灵兽实体与工厂；面板字段预留资质/成长/寿命/技能（对齐调研与梦幻参考）。 |
| `npc/` | 宗门执事等；**待需求确认**是否首版需要。 |
| `props/` | 地图可点击热点、采集物等。 |

### 4.2 系统模块（`systems/`）

| 系统 | 作用 | 与调研的关系 |
|------|------|----------------|
| `combat/` | 回合顺序、指令草稿、伤害、Buff、捕捉/逃跑判定 | 核心；首版优先 |
| `stats/` | 六维 → 派生攻防速；境界/修为条 | 核心数值骨架 |
| `inventory/` | 储物袋、六装备位 | 调研已验证形态 |
| `spirit-beast/` | 携带位、首发、召回召唤、融合入口 | 融合细则待确认 |
| `cultivation/` | 闭关、突破火候、瓶颈、心魔 | **待需求确认**后填实现 |
| `crafting/` | 炼丹/炼器/阵纹 | **待需求确认** |
| `economy/` | 灵石、天地灵气收支 | **待需求确认** |
| `quest/` | 「当下要事」引导链 | **待需求确认** |
| `ui/` | HUD 订阅 GameState 变化并刷新 | 贯穿始终 |

### 4.3 UI / 特效 / 组件

| 目录 | 作用 |
|------|------|
| `ui/hud/` | 战斗与枢纽顶部状态条（血蓝、境界、灵石等）。 |
| `ui/panels/` | 角色、灵兽袋、储物袋等大面板（可做成「场景内容器」而非新 Scene）。 |
| `ui/common/` | 按钮、列表、页签——全项目复用，避免每个界面抄一套。 |
| `components/` | 血条、飘字等可挂到多个实体上的小积木。 |
| `effects/` | 技能特效、受击、屏幕闪白；用对象池，打完回收。 |

---

## 5. 资源分类（`src/assets/`）

| 目录 | 放什么 | 说明 |
|------|--------|------|
| `images/` | 单图：背景、UI 图标、立绘 | 开发初期可用；量大后迁图集 |
| `atlases/` | Texture Atlas（一张大图 + JSON 帧） | **性能向**：减少 draw call |
| `audio/bgm/` | 背景音乐 | 按场景按需加载 |
| `audio/sfx/` | 音效 | 短、可池化 |
| `fonts/` | 位图字体或 WebFont 声明 | 避免系统默认字体不可控 |
| `data/tables/` | **配置表**：道具、技能、灵兽图鉴、敌人模板 | 数值策划改表不改代码 |
| `data/levels/` | **关卡/地点数据**：野外点、秘境节点、刷怪组 | 对应舆图 nodeId 一类结构 |
| `data/story/` | 剧情剧本 JSON（分幕、选项） | 待需求确认格式 |
| `data/balance/` | 突破成功率、捕捉率等曲线 | 与 `systems/stats`、`combat` 配合 |

**加载策略建议**：

1. **首包**：Boot/菜单/字体/通用 UI。  
2. **枢纽包**：洞府背景与面板。  
3. **战斗包**：单位图集、战斗 UI、常用特效。  
4. 进入某地点前再加载该地点关卡 JSON + 所需敌人图——避免一次塞满内存。

---

## 6. 全局基础设施（`core/` + `config/` + `utils/`）

### 6.1 全局状态 `GameState`

存放「整局游戏当前真相」的内存镜像，例如：

- 玩家档案（姓名、境界、属性点、命格列表……字段随需求确认扩展）  
- 背包与装备  
- 灵兽袋与出战编组  
- 当前地点、是否有「待收束战斗」标记（对齐调研结算锁教训）  
- 设置（音量、简化特效等）

**约定**：Scene 不各自私藏一份真相；UI 通过订阅 EventBus 或轮询轻量 getter 刷新。存档时由 `SaveManager` 序列化 GameState。

### 6.2 事件总线 `EventBus`

轻量发布/订阅（可基于 Phaser 自带 `events`，或极薄封装）：

示例事件（名称进 `constants.js`）：

- `BATTLE_STARTED` / `TURN_STARTED` / `COMMAND_SUBMITTED` / `BATTLE_ENDED`  
- `PLAYER_STATS_CHANGED` / `INVENTORY_CHANGED` / `BEAST_PARTY_CHANGED`  
- `SHOW_DIALOG` / `SHOW_RESULT` / `TOAST`

**好处**：战斗结算不必硬编码「去改哪三个面板」；新 UI 监听事件即可扩展。

### 6.3 常量 `constants.js`

- 场景键、图层深度（`DEPTH.UI`）、对象池名  
- 阵营、指令类型枚举  
- 禁止在业务里散落 `'BattleScene'` 字符串

### 6.4 工具 `utils/`

无副作用优先：随机、夹紧、深拷贝、格式化「炼气·后期」、概率检定。**禁止**在 utils 里引用 Scene，以免循环依赖。

### 6.5 公共基类

| 基类 | 抽什么 |
|------|--------|
| `BaseScene` | 统一 `create/shutdown`：解绑事件、停补间、清定时器，防止切场景泄漏。 |
| `BaseEntity` | 统一 `hp` 变更、死亡回调、挂载 components 的约定。 |

---

## 7. 推荐模块依赖关系

依赖方向应是**单向、由外向内**：

```text
scenes  →  ui / systems / systems / systems
              ↓
           services（读配置、播音频）
              ↓
             core（EventBus / GameState）
              ↓
           utils / config（constants、JSON 表）
```

**硬性约定（可维护性）**：

1. `utils`、`config` **不**依赖 `scenes` / `systems`。  
2. `systems` **不**直接 `new` 另一个 Scene；要切场景就发事件或调用极薄的 `SceneRouter`。  
3. `entities` 尽量不 import 具体 UI 面板；血量变了发事件，HUD 自己刷新。  
4. 新增玩法（如阵纹）：优先 `systems/crafting/InscriptionSystem.js` + `data/tables/inscriptions.json`，而不是改 `BattleScene` 上千行。

---

## 8. 配置驱动思路（为何、如何扩展）

### 为何配置驱动

调研显示数值面极宽（境界、技能、灵兽资质区间、坊市货架、突破公式…）。若写死在 JS：

- 调平衡要改代码、易引入回归；  
- 无法让「只改表」完成一次内容增量。

### 推荐做法

1. **表结构稳定、内容可变**：例如灵兽图鉴一条 = id、名称、资质范围、成长范围、技能列表、出没地。  
2. **代码只认 id**：战斗里 `EnemyFactory.create(id, level)`，等级缩放在 `stats` 或表字段描述。  
3. **曲线单独成表**：捕捉率、突破成功率、瓶颈衰减等放 `data/balance/`，`systems` 读取后计算。  
4. **关卡是数据不是代码**：野外点 JSON 描述可遇敌组、消耗灵气、境界门槛——对应调研里 nodeId / 开放境界。

### 扩展新内容的标准路径

```text
① 在 data/tables 增加或改一行
② 若需新规则 → systems 下新文件或扩展现有 system
③ 若需新界面 → ui/panels 增加面板，Hub 或菜单挂入口
④ 若需新流程屏 → scenes 增加场景并在 index 注册
⑤ 用 EventBus 接到现有循环，避免改战斗主循环核心
```

---

## 9. 性能与可维护性专项约定

| 主题 | 约定 |
|------|------|
| 对象池 | 飘字、子弹、常见弹道进 `effects/pools`；禁止每回合 `new` 大量 Sprite。 |
| 更新频率 | 纯 UI 数字用事件驱动刷新；不要在 `update` 里全量重算属性。 |
| 资源释放 | `BaseScene.shutdown` 必须解绑 EventBus，防止幽灵监听。 |
| 战斗与养成分离 | `BattleScene` 只调用 `combat` + 只读快照；突破/炼丹不进战斗帧循环。 |
| AI / 异步 | 若接文案生成：`AiNarrativeService` 必须带超时、取消与降级文案（调研高峰教训）。 |
| 结算收束 | `GameState.pendingBattleSettle` + 枢纽红点/全局入口；`ResultOverlay` 确认后才清锁。 |
| 注释与命名 | 核心文件顶部中文说明「干什么、谁调用」；文件名英文、领域词与调研中文对照表可附在 AGENTS。 |

---

## 10. 与现有调研的承接（扩展位一览）

下列目录/模块在架构中**预留**，实现优先级与产品范围 **待需求确认**（确认架构后的问答调研再定）：

| 调研能力 | 架构落点 | 备注 |
|----------|----------|------|
| 心念创角 / 命格 | `StoryScene` + `systems/stats` + `data/tables/fate.json` | 开局流程 |
| 洞府多设施 | `HubScene` 入口 + 各 `ui/panels` 或子场景 | 先枢纽后拆分 |
| 闭关 / 突破 / 瓶颈 / 心魔 | `systems/cultivation/` | 待确认公式与是否首版 |
| 回合战斗 / 双指令 / 自动战斗 | `systems/combat/` + `BattleScene` | 建议 MVP 核心 |
| 灵兽捕捉 / 出战 / 图鉴 | `entities/spirit-beast` + `systems/spirit-beast` | 合成深度另表 |
| 灵兽合成（梦幻向） | `systems/spirit-beast/Fusion.js` | 待确认保底等规则 |
| 炼丹 / 炼器 / 阵纹 | `systems/crafting/` | 待确认 |
| 灵田 / 坊市 / 拍卖 | `systems/economy/` + 地图数据 | 待确认 |
| 宗门 / 社交 / 天骄榜 | `services/` + 未来联网层 | 单机首版可空壳 |
| 掌天瓶式日活神器 | `systems/quest` 或独立 `systems/daily/` | 原创包装，勿直用原著专名 |

**版权备忘（来自凡人参考文档）**：可借鉴数值结构与流程，**不要直接使用原著专有名词**；目录与 id 用项目自有命名。

---

## 11. 本阶段明确不做的事

- 不创建完整可运行游戏代码脚手架（大量空 `class` 文件）。  
- 不引入与已定技术栈冲突的引擎/框架替换。  
- 不在本文档中向用户发起玩法需求问卷（留给下一阶段）。  
- 不提交 `.env`、依赖目录、构建产物。

确认本架构后，允许的最小落地可以是：按树创建空目录 + 必要时极少 `.gitkeep`，以及 `index.html` / `main.js` 占位——**仍以你确认后的排期为准**。

---

## 12. 协作节奏（确认后的下一步）

1. **你确认**本目录与分层（可批注要增删的文件夹）。  
2. 进入 **问答调研**：每轮只推进 **1～2 个方向**（例如先「战斗指令集」或「洞府首屏有哪些入口」），确认后再问下一模块。  
3. 再 **分模块实现**：设计思路 → 带中文注释的代码 → 调用说明。  
4. 重要决定继续写入 `AGENTS.md` / `PROGRESS.md` / `docs/`，不只留在聊天里。

---

## 附录 A · 场景与模块对照速查

| 我想改… | 优先打开 |
|---------|----------|
| 游戏窗口大小、背景色 | `config/gameConfig.js` |
| 从菜单进洞府的流程 | `scenes/MainMenuScene.js`、`HubScene.js` |
| 回合里指令怎么提交 | `systems/combat/CommandDraft.js`、`TurnManager.js` |
| 灵兽面板字段 | `entities/spirit-beast/`、`data/tables/` 图鉴表 |
| 某技能伤害数字 | `data/tables/skills.json` + `DamageResolver.js` |
| 暂停菜单按钮 | `scenes/overlays/PauseOverlay.js` |
| 全项目事件名 | `config/constants.js` |
| 存档坏了 | `core/SaveManager.js`、`GameState.js` |

## 附录 B · 中英命名对照（便于搜代码）

| 中文（调研用语） | 代码侧建议 |
|------------------|------------|
| 洞府 | Hub / `HubScene` |
| 灵兽 | SpiritBeast |
| 储物袋 | Inventory |
| 修为 / 感悟 / 突破 | Cultivation / RealmProgress |
| 神通 | Skill / Art（具体用词待确认） |
| 器诀 | ArtifactSkill（待确认） |
| 命格 | FateTrait |
| 天地灵气 | WorldQi 或 SpiritQi（待确认统一） |
| 灵石 | SpiritStone（货币） |

---

*文档版本：2026-10-22 · 架构设计待确认*
```

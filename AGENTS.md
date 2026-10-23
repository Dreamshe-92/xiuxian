# AGENTS.md — 项目上下文（所有 AI 编程工具开工前必读）

> 本文件是跨工具、跨机器共享的 AI 上下文入口，ZCode 与 Cursor 均会自动识别。
> 维护规则：项目结构或约定发生变化时，必须同步更新本文件。

## 项目简介

- 项目代号：**xuxian**（GitHub 仓库名 **xiuxian**：https://github.com/Dreamshe-92/xiuxian）
- 产品定位：中大型 **HTML5 网页修仙游戏**（浏览器可直接运行）；玩法与系统骨架参考仓库内竞品/设定调研，不凭空另起世界观。
- 当前状态：**架构方向已认可**；文档按评审意见修订中/待 Vigil 终审合并；合并前不落地完整游戏脚手架代码。
- 设计决定（已定）：不做「凡人门派」开局，玩家直接以修士身份创建角色入世。

## 技术栈

- **已定**：HTML + JavaScript + Phaser.js（浏览器直开；**Phaser 版本须钉死**，禁止 `@latest`）
- **UI 架构（已锁定）**：**DOM 覆盖层**负责面板/列表/文本；**Phaser** 负责战斗/地图/VFX；二者经 EventBus / GameState 通信
- **架构目标**：运行高性能、功能高扩展性、代码高可维护性
- **AI 接入**：必须走后端/云函数代理，**禁止客户端直持 API Key**
- 构建器 / 后端形态：合并后问答调研再定；架构目录已预留 `services/`、`systems/daoxin/` 等扩展位
- 详细目录与模块说明见：`docs/phaser-project-architecture.md`；评审见：`docs/评审意见-phaser架构.md`

## 目录结构

> 下列为**目标工程形态**（见架构文档）。本阶段以文档为准；确认前不强制创建完整 `src/` 源码树。

```text
/
├── index.html                 # （确认后）浏览器入口
├── AGENTS.md / PROGRESS.md / README.md
├── docs/                      # 调研 + 架构设计
│   ├── phaser-project-architecture.md   # Phaser 工程架构（评审修订稿）
│   ├── 评审意见-phaser架构.md
│   ├── 万界道友-游戏流程调研.md
│   ├── 凡人修仙传-参考素材.md
│   ├── 灵兽合成参考-梦幻西游.md
│   └── 小说参考素材二-斗破诡秘遮天.md
└── src/                       # （合并并排期后）游戏源码
    ├── main.js                # Phaser.Game 入口 + DOM UI 桥
    ├── config/                # 启动配置、常量、数值表入口
    ├── core/                  # EventBus、GameState、带 version 的存档、基类
    ├── scenes/                # Boot / Preload / 枢纽 / 地图 / 战斗（演出）
    ├── entities/              # 玩家、敌人、灵兽等
    ├── systems/               # 战斗、数值、道心、收集、世界事件、修炼…（按领域）
    ├── ui/                    # DOM 面板为主；components / effects 偏 Phaser
    ├── services/ · utils/     # AI 仅调后端代理等
    └── assets/                # images / audio / data(配置表·关卡)
```

完整树与「每个目录干什么」见架构文档 §2～§6；UI 分工见 §3.0。

## 工作约定（每次会话必须遵守）

1. **开工第一步**：`git pull`，然后完整阅读 `PROGRESS.md` 了解当前进度，不要凭空猜测项目状态。
2. **收工最后一步**：更新 `PROGRESS.md`（完成项移入"已完成"，补充"下一步"），然后 `git add` + `git commit` + `git push`。
3. 本项目在多台电脑、多个 AI 工具（ZCode / Cursor）之间流转，**所有重要决定必须落到仓库文件里**（代码、文档、PROGRESS.md），不要只留在会话记录中。
4. 提交信息要能看懂改了什么（如 `完成用户登录页面`）。
5. 改动依赖后必须提交对应的 lock 文件。
6. 玩法与模块划分须承接 `docs/` 现有调研与小说参考；未排期需求标「待需求确认」，只预留扩展位。

## 代码约定

- 不要提交 `.env`、依赖目录、构建产物（见 `.gitignore`）；**勿把 AI API Key 写进前端或仓库**
- 换行符统一 LF，缩进统一空格（见 `.editorconfig`）
- 核心脚本需有简明中文注释（文件职责、关键调用关系）
- 依赖方向：`scenes → ui/entities/systems → services → core → utils/config`（详见架构文档 §7）
- 数值与关卡优先配置表（`assets/data/`），避免散落魔法数；存档 JSON 须含 `version` 字段
- 版权：可借鉴设定结构，**勿直接使用原著专有名词**（见凡人参考与小说参考二）

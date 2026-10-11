# xuxian

Vibecoding 项目，简介待定（见 `AGENTS.md`）。

## 多机多工具工作流

本项目在多台电脑、多个 AI 编程工具（ZCode / Cursor）之间流转，以 GitHub 仓库为唯一事实源：

1. **开工**：`git pull`，让 AI 先读 `AGENTS.md` 和 `PROGRESS.md`
2. **干活**：正常开发
3. **收工**：让 AI 更新 `PROGRESS.md`，然后提交并推送

## 文件说明

| 文件 | 用途 |
|---|---|
| `AGENTS.md` | AI 上下文入口：项目简介、技术栈、工作约定（ZCode / Cursor 自动识别） |
| `PROGRESS.md` | 进度交接：已完成 / 下一步 / 已知问题 / 环境备注 |
| `.cursor/rules/` | 旧版 Cursor 的兼容入口，指向 AGENTS.md |

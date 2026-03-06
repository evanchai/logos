# Logos — 宗教人物聊天

与 God/Buddha/Allah 对话的 AI 聊天应用，部署在 logos.ning.codes。

## Tech Stack

- React 19 + TypeScript + Vite（纯 CSS）
- Google Gemini AI（`@google/generative-ai`）
- Upstash Redis + Rate limiting
- ESLint

## 常用命令

```bash
npm run dev     # Vite dev server
npm run build   # tsc -b && vite build
npm run lint    # ESLint
```

## 项目结构

`src/` 布局：

- `src/main.tsx` — 入口
- `src/App.tsx` — 根组件
- `api/chat.ts` — 多人格聊天 API（根据 figure 选择 system prompt，maxDuration: 30s）

## 架构要点

- 三个宗教人物各有独立的 system prompt
- 根据选择的 figure 切换对话风格和知识范围

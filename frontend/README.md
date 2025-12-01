# 前端说明（frontend）

## 概述

React + Vite 构建的单页应用，使用 Tailwind CSS 与 `lucide-react`。

## 运行

- 安装依赖：`npm install`
- 开发启动：`npm run dev`（默认端口见 `vite.config.js`）
- 生产构建：`npm run build`
- 本地预览：`npm run preview`

## 目录结构

- `index.html` 应用入口，挂载点为 `#root`
- `src/main.jsx` 入口脚本，渲染 `App`
- `src/App.jsx` 应用主组件
- `src/index.css` 全局样式（Tailwind 指令）
- `src/services/api.js` 后端接口封装

## 开发配置

- 端口与主机：`vite.config.js` 的 `server.port` 与 `server.host`
- 允许域名访问：`server.allowedHosts` 可设置为 `true` 或指定域名数组
- 接口代理：`server.proxy['/api'].target`
  - 默认值：`http://127.0.0.1:3001`
  - 如使用 FastAPI 默认端口，请改为 `http://127.0.0.1:8000`

## 接口使用

- `fetchMeetingData()` 获取数据：`GET /api/data`
- `saveMeetingData(members, meetingDate)` 保存数据：`POST /api/save-data`

## UI 与交互

- 管理员模式：默认密码 `1234`
- 完成本周：当前两位移至队尾，日期顺延 7 天
- 本周休息：仅日期顺延 7 天
- 排序调整：拖拽或使用置顶/上移/下移/置底/删除按钮

## 构建产物

- 输出路径：`frontend/dist`
- 部署静态资源时使用 Nginx `try_files` 以支持 SPA 刷新

## 版本要求

- Node.js ≥ 18
- Vite 5，React 18
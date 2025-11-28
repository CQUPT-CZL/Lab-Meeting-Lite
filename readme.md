# 📅 Lab Meeting Lite | 学术组会排班助手

轻量、现代、好看好用的科研组会轮值排班系统。支持双人分组、拖拽排序和管理员模式，开箱即用。

<img src="./image.png" alt="Lab Meeting Lite 界面预览" width="900" />

## ✨ 特性

- 👥 双人分组：后续队列自动两两分组，贴合常见组会节奏
- 🎨 现代化 UI：清新配色与动效，信息层次清晰
- 🔒 管理员模式：默认密码 `1234`，支持增删改与排序
- 🪄 拖拽与快捷操作：拖拽排序、置顶/置底、交换前两位等常用操作
- ⏭️ 智能流转：一键“完成本周”后，当前两位移至队尾，日期顺延一周
- 💾 轻量持久化：内置本地缓存；可选本地后端，将变更写入 `src/config/data.json`

## 🧱 技术栈

- `React 19` + `Vite 7`
- `Tailwind CSS`（通过 CDN 加载：`https://cdn.tailwindcss.com`）
- 图标：`lucide-react`

## 🚀 快速开始

1. 安装依赖
   ```bash
   npm install
   ```
2. 本地开发
   ```bash
   npm run dev
   ```
3. 生产构建与预览
   ```bash
   npm run build
   npm run preview
   ```

## 🗄️ 数据与持久化

- 初始数据位于 `src/config/data.json`，包含 `members` 与 `meetingDate`
- 默认日期策略：若未指定，自动取“下一个周五”作为组会日期
- 本地缓存键位：
  - 会议日期：`meeting_date_v2`（`localStorage`）
  - 管理员状态：`app_is_admin`（`sessionStorage`）

### 可选：启用本地后端（持久化到文件）

如需在刷新后保留成员顺序与名单，请启动本地后端：

```bash
node server.js
```

后端会监听 `POST /api/save-data`，并将数据写入 `src/config/data.json`。前端在变更后会自动调用保存接口。

## 🧭 使用说明

- 进入管理员模式：点击右上角“管理模式”，输入密码 `1234`
- 完成本周：当前两位主讲移至队尾，日期 +7 天
- 本周休息：仅日期 +7 天，队列顺序保持不变
- 调整顺序：在“调整顺序”弹窗中拖拽，或使用置顶/上移/下移/置底/删除按钮
- 新增成员：管理员模式下，点击“新增成员”并确认

## 🧩 分组与队列规则

- 当前主讲：队首两位
- 后续队列：从第 3 位开始按 2 人一组分组展示

## 📸 自定义与配置

- 修改初始名单与日期：直接编辑 `src/config/data.json`
- Tailwind 通过 CDN 加载，若需离线/自定义构建，可改为本地安装 Tailwind 并配置 PostCSS

## 📦 部署建议

- 纯前端部署：可直接将构建产物部署到任意静态托管平台（如 GitHub Pages、Vercel 等）
- 数据持久化：需要跨刷新保留名单与顺序时，请同时运行本地后端或替换为你的后端服务

## 🔗 链接

- GitHub：<https://github.com/CQUPT-CZL/Lab-Meeting-Lite>

## ⚠️ 注意事项

- 管理密码仅用于演示，不适用于公开环境；生产场景请接入真实鉴权方案
- 本地后端默认写入项目内 `src/config/data.json`，请确保有写权限
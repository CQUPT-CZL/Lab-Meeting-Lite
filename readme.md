# Lab Meeting Lite

轻量、现代的科研组会轮值排班系统。包含前端（React + Vite）与后端（FastAPI）两部分，并提供 Nginx 反向代理示例配置。

![界面预览](./image.png)

**对应子文档**：
- 项目前端说明：`frontend/README.md`
- 项目后端说明：`backend/README.md`

## 项目结构

- `frontend/` 前端应用（React、Vite、Tailwind）
- `backend/` 后端服务（FastAPI、Uvicorn、Pydantic）
- `deploy/nginx.conf` Nginx 部署示例（静态资源与 `/api` 反向代理）

## 技术栈

- 前端：`React 18`、`Vite 5`、`Tailwind CSS 3`、`lucide-react`
- 后端：`FastAPI`、`Uvicorn`、`Pydantic`

## 运行要求

- Node.js ≥ 18，npm（或 pnpm/yarn）
- Python ≥ 3.9，`pip`（建议使用虚拟环境）

## 快速开始

- 启动后端（默认端口 `3001`）
  - 在项目根或 `backend/` 目录下运行任一方式：
  - 方式 A（根目录）：`uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 3001`
  - 方式 B（进入后端目录）：`cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 3001`

- 启动前端（默认端口由 `vite.config.js` 指定为 `3002`）
  - `cd frontend && npm install && npm run dev`

打开浏览器访问 `http://localhost:3002`（或你的自定义端口）。

## 开发配置

- 端口与主机：`frontend/vite.config.js` 中 `server.port` 与 `server.host`
- 接口代理：`frontend/vite.config.js` 中 `server.proxy['/api'].target`
  - 当前值为 `http://127.0.0.1:3001`，如使用 FastAPI 默认端口，请改为 `http://127.0.0.1:8000`
- CORS：后端为开发环境开启了全量 CORS，线上由 Nginx 负责域名、协议与头部处理

## 构建与部署

- 前端构建：`cd frontend && npm run build`，产物输出到 `frontend/dist`
- Nginx 示例：`deploy/nginx.conf`
  - 根路径提供静态文件，`/api` 代理到后端（默认 `127.0.0.1:3001`）
  - 使用 `try_files` 以支持前端 SPA 刷新

## 接口一览（后端）

- `GET /api/health` 服务健康检查
- `GET /api/data` 获取数据
- `POST /api/save-data` 保存数据

数据模型（`backend/app/models.py`）：
- `Member`: `{ id: string, name: string }`
- `MeetingData`: `{ members: Member[], meetingDate?: string }`

数据持久化路径：`backend/data/data.json`（首次启动自动创建）

## 常见问题

- 前端无法请求后端接口
  - 检查后端是否已启动并监听正确端口
  - 校验 `frontend/vite.config.js` 的代理目标是否与后端端口一致
- 跨域错误（生产）
  - 通过 Nginx 反向代理统一域名；开发环境由后端 CORS 放开

## 许可与安全

- 管理密码仅用于本地演示，不适用于公开环境；生产场景请接入真实鉴权
- 项目不包含任何密钥或敏感配置，部署时请按需增加安全策略
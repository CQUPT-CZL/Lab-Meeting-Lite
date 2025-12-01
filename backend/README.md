# 后端说明（backend）

## 概述

使用 FastAPI 提供数据读写接口，Uvicorn 作为 ASGI 服务器，Pydantic 进行数据校验与序列化。

## 运行

- 安装依赖：`pip install -r backend/requirements.txt`
- 启动服务（项目根目录）：`uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 3001`
- 启动服务（进入 backend 目录）：`cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 3001`

## 目录结构

- `app/main.py` 路由与服务配置
- `app/models.py` 数据模型（Pydantic）
- `requirements.txt` 依赖管理
- `data/data.json` 持久化文件（首次启动自动创建）

## 路由与模型

- `GET /api/health` 返回 `{ status: 'ok' }`
- `GET /api/data` 读取数据，响应模型：`MeetingData`
- `POST /api/save-data` 保存数据，接收模型：`MeetingData`

模型定义（`app/models.py`）：
- `Member`：`{ id: str, name: str }`
- `MeetingData`：`{ members: List[Member], meetingDate?: str }`

## CORS 与反向代理

- 开发环境：后端允许所有来源、方法与头部（仅开发使用）
- 生产环境：建议通过 Nginx 统一域名与协议，并在前端静态目录下提供构建产物。

示例（`deploy/nginx.conf`）：
- 根路径提供 `frontend/dist` 静态资源
- `/api` 反向代理到后端（默认 `127.0.0.1:3001`）

## 数据存储

- 路径：`backend/data/data.json`
- 初始化：首次启动自动创建 `{ members: [], meetingDate: null }`
- 写入：`POST /api/save-data` 使用 `ensure_ascii=False` 保证中文不乱码

## 版本要求

- Python ≥ 3.9
- FastAPI 0.115.x，Uvicorn 0.32.x
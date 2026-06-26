---
name: dm-orchestrator
description: "Orchestrator xây dựng Digital Marketing Management tool. Trigger khi: xây hệ thống quản lý ads, build tool Digital Marketing, setup campaign management, tạo web dashboard quản trị quảng cáo. Tác vụ tiếp theo: chạy lại, cập nhật, thêm tính năng, sửa đổi hệ thống, deploy lại, build phase mới."
---

# Digital Marketing Tool — Orchestrator

Skill điều phối build hệ thống Digital Marketing Management tool từ đầu đến deploy.

## Chế độ thực thi: Hybrid

- **Phase 2 (Build core)**: Nhóm agent — `architect`, `backend-dev`, `integration-dev` cộng tác
- **Phase 3 (Frontend)**: Subagent — `frontend-dev` độc lập
- **Phase 4 (DevOps)**: Subagent — `devops-agent` độc lập

## Cấu thành Agent

| Agent | Loại | Vai trò | Skill | Phase |
|-------|------|---------|-------|-------|
| architect | claude | Thiết kế DB, API spec | — | 2 |
| backend-dev | claude | FastAPI backend | campaign-management | 2 |
| integration-dev | claude | Platform API adapters | platform-integration | 2 |
| frontend-dev | claude | React dashboard | — | 3 |
| devops-agent | claude | Docker + VPS deploy | vps-deploy | 4 |

## Quy trình

### Phase 0: Kiểm tra context

1. Kiểm tra `_workspace/` tồn tại chưa
2. Quyết định:
   - Chưa có → **Chạy lần đầu**, tiếp tục Phase 1
   - Có + người dùng muốn sửa một phần → **Chạy lại phase cụ thể** (xem Phase dưới)
   - Có + đầu vào mới → Di chuyển `_workspace/` → `_workspace_{timestamp}/`, chạy mới

### Phase 1: Chuẩn bị

1. Xác định scope với người dùng:
   - Platforms cần tích hợp (TikTok / Facebook / Google)?
   - Chạy local hay đã có VPS?
   - Có credentials platform nào sẵn chưa?
2. Tạo cấu trúc thư mục:
   ```
   _workspace/
   ├── 01_architect/
   ├── 02_backend/
   ├── 03_integration/
   ├── 04_frontend/
   └── 05_devops/
   ```

### Phase 2: Build Core (Nhóm agent)

**Chế độ thực thi: Nhóm agent**

```
TeamCreate(
  team_name: "dm-build-team",
  members: [
    { name: "architect", agent_type: "claude", model: "opus",
      prompt: "Bạn là system architect. Đọc yêu cầu dự án và tạo: DB schema (db_schema.sql), API spec (api_spec.md), kiến trúc tổng thể (architecture.md). Ghi vào _workspace/01_architect/. Sau đó gửi SendMessage đến backend-dev và integration-dev với đường dẫn file." },
    { name: "backend-dev", agent_type: "claude", model: "opus",
      prompt: "Bạn là backend developer. Chờ architect hoàn thành (nhận SendMessage), đọc _workspace/01_architect/, sau đó build FastAPI backend. Code vào backend/. Ghi endpoints đã test vào _workspace/02_backend/api_endpoints_tested.md. Khi /platforms router sẵn sàng, gửi SendMessage đến integration-dev với interface spec." },
    { name: "integration-dev", agent_type: "claude", model: "opus",
      prompt: "Bạn là integration developer. Chờ backend-dev gửi interface spec (SendMessage), sau đó implement platform adapters (TikTok, Facebook, Google) trong backend/app/integrations/. Ghi hướng dẫn setup credentials vào _workspace/03_integration/platform_setup_guide.md." }
  ]
)
```

```
TaskCreate(tasks: [
  { title: "Design DB schema và API spec", assignee: "architect",
    description: "Tạo db_schema.sql, api_spec.md, architecture.md vào _workspace/01_architect/" },
  { title: "Build FastAPI backend", assignee: "backend-dev",
    depends_on: ["Design DB schema và API spec"],
    description: "Implement models, routers, services, alert engine. Ghi endpoints vào _workspace/02_backend/" },
  { title: "Implement platform adapters", assignee: "integration-dev",
    depends_on: ["Build FastAPI backend"],
    description: "TikTok, Facebook, Google adapters. Ghi setup guide vào _workspace/03_integration/" }
])
```

Chờ team hoàn thành, sau đó `TeamDelete`.

### Phase 3: Build Frontend (Subagent)

**Chế độ thực thi: Subagent**

```
Agent(
  subagent_type: "claude",
  model: "opus",
  prompt: "Bạn là frontend developer. Đọc _workspace/02_backend/api_endpoints_tested.md để lấy API endpoints. Build React + Tailwind + shadcn/ui dashboard tại frontend/. Include: Dashboard overview, Campaign list/create/edit, Ad management, Alert config, Platform settings. Run `npm install && npm run build` để verify không lỗi."
)
```

### Phase 4: DevOps (Subagent)

**Chế độ thực thi: Subagent**

```
Agent(
  subagent_type: "claude",
  model: "opus",
  prompt: "Bạn là devops engineer. Tạo: Dockerfile.backend, Dockerfile.frontend, docker-compose.yml (local với SQLite), docker-compose.prod.yml (VPS với PostgreSQL), nginx/default.conf, scripts/deploy.sh. Ghi deployment guide vào _workspace/05_devops/deployment_guide.md."
)
```

### Phase 5: Tổng kết

Báo cáo người dùng:
- Cấu trúc project đã tạo
- Cách chạy local: `docker-compose up`
- Cách deploy VPS: đọc `_workspace/05_devops/deployment_guide.md`
- Platform credentials cần setup: đọc `_workspace/03_integration/platform_setup_guide.md`

## Xử lý lỗi

- Agent thất bại: thử lại 1 lần với prompt bổ sung context, nếu vẫn lỗi ghi vào `_workspace/errors.md` và tiếp tục phase khác
- Team không giao tiếp: sau 10 phút không có update, Leader gửi `SendMessage({to: "all"})` hỏi trạng thái

## Kịch bản kiểm thử

**Luồng bình thường:**
- Input: "Build Digital Marketing tool với TikTok Ads và Facebook Ads"
- Expected: Backend FastAPI chạy `uvicorn app.main:app`, Frontend build thành công, docker-compose up không lỗi

**Luồng lỗi:**
- Integration-dev gặp lỗi TikTok API deprecation
- Expected: Ghi lỗi vào `_workspace/errors.md`, tiếp tục với Facebook adapter, báo người dùng

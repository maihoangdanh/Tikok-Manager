---
name: campaign-management
description: "Quản lý campaigns và ads: tạo mới, chỉnh sửa, bật/tắt, xem danh sách. Trigger khi: tạo campaign, thêm ad mới, tắt quảng cáo, pause campaign, enable ads, sửa budget, thay đổi targeting, quản lý quảng cáo, xem trạng thái campaign."
---

# Campaign Management Skill

Skill cho `campaign-manager` agent thực hiện các thao tác vận hành campaign và ad.

## API Endpoints

Base URL: `$API_URL` (default: `http://localhost:8000/api/v1`)

| Action | Method | Endpoint |
|--------|--------|----------|
| List campaigns | GET | `/campaigns` |
| Get campaign | GET | `/campaigns/{id}` |
| Create campaign | POST | `/campaigns` |
| Update campaign | PATCH | `/campaigns/{id}` |
| Pause campaign | POST | `/campaigns/{id}/pause` |
| Enable campaign | POST | `/campaigns/{id}/enable` |
| List ads | GET | `/campaigns/{id}/ads` |
| Create ad | POST | `/campaigns/{id}/ads` |
| Toggle ad | PATCH | `/campaigns/{id}/ads/{ad_id}` |

## Quy trình thao tác

### Bật/tắt campaign

1. GET `/campaigns/{id}` — kiểm tra status hiện tại
2. Xác nhận với người dùng nếu action có rủi ro (pause campaign đang spend nhiều)
3. POST `/campaigns/{id}/pause` hoặc `/enable`
4. Hiển thị status mới

### Tạo campaign mới

Fields bắt buộc:
- `name`: tên campaign
- `platform`: `tiktok` | `facebook` | `google`
- `budget`: số tiền (daily hoặc lifetime)
- `budget_type`: `daily` | `lifetime`
- `objective`: `awareness` | `traffic` | `conversions` | `catalog_sales`
- `status`: mặc định `draft`

### Chỉnh sửa campaign

- Chỉ PATCH fields cần thay đổi
- Không cho phép thay đổi `platform` sau khi tạo
- Budget chỉ được tăng, không giảm khi campaign đang active

## Format hiển thị kết quả

```
[ACTIVE]  🟢 Campaign Name — $50/ngày — ROAS: 3.2 — Spend: $120/$500
[PAUSED]  🟡 Campaign Name — $100/ngày — đã tạm dừng
[DRAFT]   ⚪ Campaign Name — chưa chạy
```

---
name: alert-system
description: "Hệ thống cảnh báo Digital Marketing: kiểm tra budget, ROAS, CPC, CTR. Trigger khi: xem cảnh báo, kiểm tra campaign nào cần chú ý, báo cáo performance, campaigns nào đang nguy hiểm, check alerts."
---

# Alert System Skill

Skill cho `alert-monitor` agent giám sát và báo cáo tình trạng campaigns.

## Alert Types

| Loại | Điều kiện | Mức độ |
|------|-----------|--------|
| Budget Critical | spend > 95% budget | 🔴 CRITICAL |
| Budget Warning | spend > 80% budget | 🟡 WARNING |
| Low ROAS | ROAS < threshold (default 2.0) | 🟡 WARNING |
| High CPC | CPC > 150% target | 🟡 WARNING |
| Low CTR | CTR < 1% | ℹ️ INFO |
| Campaign Error | Status ERROR từ platform | 🔴 CRITICAL |

## API Endpoints

```
GET /api/v1/alerts/active          — Alerts đang active
GET /api/v1/alerts/history         — Lịch sử 7 ngày
GET /api/v1/campaigns?status=active — Campaigns đang chạy
GET /api/v1/campaigns/{id}/metrics  — Metrics chi tiết
```

## Format Báo cáo

```
=== DIGITAL MARKETING ALERT REPORT ===
Thời gian: 2026-06-26 14:30

🔴 CRITICAL (2)
  • [TikTok] Summer Sale — Budget 97% used ($485/$500)
  • [Facebook] Brand Awareness — Platform error: Ad account disabled

🟡 WARNING (3)  
  • [TikTok] Product Launch — ROAS 1.8 < 2.0 target
  • [Google] Remarketing — CPC $2.50 > $1.67 target (150%)
  • [Facebook] Retargeting — Budget 83% used ($166/$200)

✅ HEALTHY (5)
  • 5 campaigns đang chạy tốt

Đề xuất hành động:
1. Pause [TikTok] Summer Sale hoặc tăng budget ngay
2. Kiểm tra [Facebook] Brand Awareness — tài khoản có vấn đề
3. Review targeting [TikTok] Product Launch để cải thiện ROAS
```

## Alert Configuration

Người dùng có thể set threshold tùy chỉnh per campaign:
```
PATCH /api/v1/campaigns/{id}/alert-config
{
  "budget_warning_pct": 80,
  "budget_critical_pct": 95,
  "min_roas": 2.0,
  "max_cpc": 1.5,
  "min_ctr": 0.01
}
```

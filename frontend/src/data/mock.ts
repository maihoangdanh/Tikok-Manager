import type { Company, Campaign, Alert } from '@/types'

export const MOCK_COMPANIES: Company[] = [
  { id: 'evo', name: 'EVO Brand', initials: 'EV', color: { bg: '#E6F1FB', text: '#185FA5' } },
  { id: 'teeze', name: 'TEEZE Official', initials: 'TZ', color: { bg: '#EAF3DE', text: '#3B6D11' } },
  { id: 'cbe', name: 'CBE Fashion', initials: 'CB', color: { bg: '#FAEEDA', text: '#854F0B' } },
]

export const MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: 'c1', company_id: 'evo', name: 'Flash Sale June', type: 'standard',
    status: 'active', objective: 'conversions', budget_daily: 500000, budget_spend: 485000,
    metrics: { spend: 4800000, roas: 4.2, impressions: 142000, clicks: 3200, ctr: 2.3, cpc: 1050, conversions: 198, cpa: 24200 },
    prev_metrics: { spend: 3930000, roas: 3.6, impressions: 120000, clicks: 2936, ctr: 2.0, cpc: 1140, conversions: 151, cpa: 26000 },
    alert_config: { budget_warning_pct: 80, budget_critical_pct: 95, min_roas: 2.0 },
  },
  {
    id: 'c2', company_id: 'evo', name: 'Brand Video Q2', type: 'standard',
    status: 'active', objective: 'awareness', budget_daily: 200000, budget_spend: 166000,
    metrics: { spend: 5200000, roas: 1.8, impressions: 168000, clicks: 2100, ctr: 1.3, cpc: 2380, conversions: 87, cpa: 59800 },
    prev_metrics: { spend: 5416000, roas: 2.3, impressions: 179000, clicks: 2283, ctr: 1.8, cpc: 2144, conversions: 99, cpa: 50700 },
    alert_config: { budget_warning_pct: 80, budget_critical_pct: 95, min_roas: 2.0 },
  },
  {
    id: 'c3', company_id: 'evo', name: 'Summer Collection GMV', type: 'gmv_product',
    status: 'active', budget_daily: 800000, budget_spend: 690000,
    metrics: { cost: 34480407, sku_orders: 941, cost_per_order: 36642, gross_revenue: 139977897, roi: 4.06 },
    prev_metrics: { cost: 34264339, sku_orders: 1049, cost_per_order: 32664, gross_revenue: 150582803, roi: 4.39 },
    alert_config: { budget_warning_pct: 80, budget_critical_pct: 95, min_roi: 3.0 },
  },
  {
    id: 'c4', company_id: 'evo', name: 'LIVE June 25', type: 'gmv_live',
    status: 'active', budget_daily: 300000, budget_spend: 180000,
    metrics: { cost: 8200000, sku_orders: 412, cost_per_order: 19903, gross_revenue: 61800000, roi: 7.54 },
    prev_metrics: { cost: 7400000, sku_orders: 360, cost_per_order: 20556, gross_revenue: 52200000, roi: 7.05 },
    alert_config: { budget_warning_pct: 80, budget_critical_pct: 95, min_roi: 3.0 },
  },
  {
    id: 'c5', company_id: 'teeze', name: 'TEEZE Flash Sale', type: 'standard',
    status: 'active', objective: 'conversions', budget_daily: 800000, budget_spend: 620000,
    metrics: { spend: 9800000, roas: 4.8, impressions: 210000, clicks: 5040, ctr: 2.4, cpc: 1944, conversions: 312, cpa: 31400 },
    prev_metrics: { spend: 8200000, roas: 4.1, impressions: 182000, clicks: 4368, ctr: 2.1, cpc: 1878, conversions: 254, cpa: 32300 },
    alert_config: { budget_warning_pct: 80, budget_critical_pct: 95, min_roas: 2.0 },
  },
  {
    id: 'c6', company_id: 'teeze', name: 'TEEZE GMV Product', type: 'gmv_product',
    status: 'active', budget_daily: 600000, budget_spend: 420000,
    metrics: { cost: 20100000, sku_orders: 680, cost_per_order: 29559, gross_revenue: 84420000, roi: 4.2 },
    prev_metrics: { cost: 18500000, sku_orders: 590, cost_per_order: 31356, gross_revenue: 73750000, roi: 3.99 },
    alert_config: { budget_warning_pct: 80, budget_critical_pct: 95, min_roi: 3.0 },
  },
]

export const MOCK_ALERTS: Alert[] = [
  { id: 'a1', company_id: 'evo', campaign_id: 'c1', campaign_name: 'Flash Sale June', severity: 'critical', message: 'Budget 97% — sắp hết ngân sách hôm nay (₫485K/₫500K)', resolved: false, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: 'a2', company_id: 'evo', campaign_id: 'c2', campaign_name: 'Brand Video Q2', severity: 'warning', message: 'ROAS 1.8x thấp hơn mục tiêu 2.0x', resolved: false, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: 'a3', company_id: 'evo', campaign_id: 'c3', campaign_name: 'Summer Collection GMV', severity: 'warning', message: 'ROI giảm -7.5% so với cùng kỳ (4.06 vs 4.39)', resolved: false, created_at: new Date(Date.now() - 10800000).toISOString() },
]

export const SPEND_DATA = [
  { date: '20/6', current: 1580000, previous: 1420000 },
  { date: '21/6', current: 1720000, previous: 1380000 },
  { date: '22/6', current: 1650000, previous: 1510000 },
  { date: '23/6', current: 1890000, previous: 1600000 },
  { date: '24/6', current: 2100000, previous: 1750000 },
  { date: '25/6', current: 1980000, previous: 1820000 },
  { date: '26/6', current: 1480000, previous: 1900000 },
]

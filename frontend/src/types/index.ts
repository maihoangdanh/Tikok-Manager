export type CampaignType = 'standard' | 'gmv_product' | 'gmv_live'
export type CampaignStatus = 'active' | 'paused' | 'draft'
export type CampaignObjective = 'conversions' | 'traffic' | 'awareness' | 'catalog_sales'
export type AdStatus = 'active' | 'paused'
export type AlertSeverity = 'critical' | 'warning'
export type Period = '1' | '7' | '30'

export interface Company {
  id: string
  name: string
  initials: string
  color: { bg: string; text: string }
}

export interface StandardMetrics {
  spend: number; roas: number; impressions: number
  clicks: number; ctr: number; cpc: number; conversions: number; cpa: number
}

export interface GmvMetrics {
  cost: number; sku_orders: number; cost_per_order: number
  gross_revenue: number; roi: number
}

export interface Campaign {
  id: string; company_id: string; name: string
  type: CampaignType; status: CampaignStatus
  objective?: CampaignObjective
  budget_daily: number; budget_spend: number
  metrics: StandardMetrics | GmvMetrics
  prev_metrics: StandardMetrics | GmvMetrics
  alert_config: Record<string, number>
}

export interface Creative {
  id: string; campaign_id: string; name: string
  status: AdStatus; video_url?: string
  metrics: GmvMetrics; prev_metrics: GmvMetrics
}

export interface Alert {
  id: string; company_id: string; campaign_id: string; campaign_name: string
  severity: AlertSeverity; message: string; resolved: boolean; created_at: string
}

export function isStdMetrics(m: StandardMetrics | GmvMetrics): m is StandardMetrics {
  return 'roas' in m
}
export function isGmvMetrics(m: StandardMetrics | GmvMetrics): m is GmvMetrics {
  return 'roi' in m
}

import type { CampaignType } from '@/types'

const CFG: Record<CampaignType, { label: string; cls: string }> = {
  standard:    { label: 'Standard',    cls: 'bg-blue-50 text-blue-700' },
  gmv_product: { label: 'GMV Product', cls: 'bg-purple-50 text-purple-700' },
  gmv_live:    { label: 'GMV Live',    cls: 'bg-pink-50 text-pink-700' },
}

export default function CampaignTypeBadge({ type }: { type: CampaignType }) {
  const { label, cls } = CFG[type]
  return <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${cls}`}>{label}</span>
}

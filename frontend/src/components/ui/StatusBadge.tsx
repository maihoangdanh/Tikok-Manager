import type { CampaignStatus } from '@/types'

const CFG: Record<CampaignStatus, { label: string; dot: string; cls: string }> = {
  active: { label: 'Active', dot: 'bg-green-500', cls: 'bg-green-50 text-green-800' },
  paused: { label: 'Paused', dot: 'bg-amber-500', cls: 'bg-amber-50 text-amber-800' },
  draft:  { label: 'Draft',  dot: 'bg-gray-400',  cls: 'bg-gray-100 text-gray-600' },
}

export default function StatusBadge({ status }: { status: CampaignStatus }) {
  const { label, dot, cls } = CFG[status]
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}

import { budgetPct } from '@/lib/utils'

export default function ProgressBar({ spend, budget }: { spend: number; budget: number }) {
  const pct = budgetPct(spend, budget)
  const color = pct >= 95 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500'
  const textColor = pct >= 95 ? 'text-red-700' : pct >= 80 ? 'text-amber-700' : 'text-gray-500'
  return (
    <div>
      <div className={`text-[11px] font-medium mb-0.5 ${textColor}`}>{pct}%</div>
      <div className="h-1 w-16 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

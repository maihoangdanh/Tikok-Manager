import { TrendingUp, TrendingDown } from 'lucide-react'
import { calcDelta, formatDelta, isDeltaGood } from '@/lib/utils'

interface Props { current: number; previous: number; lowerIsBetter?: boolean }

export default function DeltaBadge({ current, previous, lowerIsBetter = false }: Props) {
  if (previous === 0 || current === 0) return null
  const delta = calcDelta(current, previous)
  const good = isDeltaGood(delta, lowerIsBetter)
  const Icon = delta >= 0 ? TrendingUp : TrendingDown
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${good ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
      <Icon size={10} />{formatDelta(delta)}
    </span>
  )
}

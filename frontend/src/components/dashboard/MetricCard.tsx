import DeltaBadge from '@/components/ui/DeltaBadge'
import Sparkline from '@/components/ui/Sparkline'

interface Props {
  label: string; value: string
  current: number; previous: number; prevLabel: string
  sparkData: number[]; lowerIsBetter?: boolean; color?: string
}

export default function MetricCard({ label, value, current, previous, prevLabel, sparkData, lowerIsBetter, color }: Props) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3.5 hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[11px] text-gray-500 font-medium">{label}</span>
        <DeltaBadge current={current} previous={previous} lowerIsBetter={lowerIsBetter} />
      </div>
      <div className="text-xl font-semibold text-gray-900 leading-none mb-1">{value}</div>
      <div className="text-[11px] text-gray-400 mb-2.5">Cùng kỳ: {prevLabel}</div>
      <Sparkline data={sparkData} color={color} />
    </div>
  )
}

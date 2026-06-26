import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { SPEND_DATA } from '@/data/mock'
import { formatCurrency } from '@/lib/utils'

export default function SpendChart() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden h-full">
      <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
        <span className="text-sm font-semibold text-gray-800">Chi tiêu theo ngày</span>
        <span className="text-[11px] text-gray-400">vs cùng kỳ</span>
      </div>
      <div className="px-4 py-3">
        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={SPEND_DATA} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(v: number) => [formatCurrency(v)]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
            />
            <Legend iconType="plainline" iconSize={16} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
            <Line type="monotone" dataKey="current" name="Kỳ này" stroke="#378ADD" strokeWidth={2} dot={{ r: 3, fill: '#378ADD' }} />
            <Line type="monotone" dataKey="previous" name="Cùng kỳ" stroke="#B4B2A9" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

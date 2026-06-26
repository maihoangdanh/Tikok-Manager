import { useParams } from 'react-router-dom'
import { Info } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import StatusBadge from '@/components/ui/StatusBadge'
import DeltaBadge from '@/components/ui/DeltaBadge'
import { MOCK_CAMPAIGNS } from '@/data/mock'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { isGmvMetrics } from '@/types'

const MOCK_CREATIVES = [
  { id: 'cr1', campaignId: 'c3', name: 'Váy hoa mùa hè', status: 'active' as const,
    metrics: { cost: 8200000, sku_orders: 280, cost_per_order: 29286, gross_revenue: 42000000, roi: 5.12 },
    prev: { roi: 4.93, sku_orders: 260 } },
  { id: 'cr2', campaignId: 'c3', name: 'Set đồ công sở', status: 'active' as const,
    metrics: { cost: 9100000, sku_orders: 210, cost_per_order: 43333, gross_revenue: 31500000, roi: 3.46 },
    prev: { roi: 4.13, sku_orders: 230 } },
  { id: 'cr3', campaignId: 'c3', name: 'Lookbook tháng 6', status: 'active' as const,
    metrics: { cost: 11200000, sku_orders: 340, cost_per_order: 32941, gross_revenue: 64680000, roi: 5.78 },
    prev: { roi: 5.54, sku_orders: 310 } },
  { id: 'cr4', campaignId: 'c3', name: 'Flash sale 50%', status: 'paused' as const,
    metrics: { cost: 5980407, sku_orders: 111, cost_per_order: 53878, gross_revenue: 11841307, roi: 1.98 },
    prev: { roi: 8.05, sku_orders: 249 } },
]

const MOCK_SESSIONS = [
  { id: 'ls1', campaignId: 'c4', start: '2026-06-25T19:00', end: '2026-06-25T22:00',
    metrics: { cost: 4100000, sku_orders: 210, gross_revenue: 30870000, roi: 7.53 } },
  { id: 'ls2', campaignId: 'c4', start: '2026-06-25T13:00', end: '2026-06-25T15:00',
    metrics: { cost: 2600000, sku_orders: 112, gross_revenue: 19656000, roi: 7.56 } },
  { id: 'ls3', campaignId: 'c4', start: '2026-06-25T09:00', end: '2026-06-25T11:00',
    metrics: { cost: 1500000, sku_orders: 90, gross_revenue: 11274000, roi: 7.52 } },
]

export default function GmvDetail() {
  const { id } = useParams<{ id: string }>()
  const campaign = MOCK_CAMPAIGNS.find(c => c.id === id)
  if (!campaign || !isGmvMetrics(campaign.metrics)) return <div className="p-6 text-gray-400">Campaign không tồn tại.</div>

  const isLive = campaign.type === 'gmv_live'
  const m = campaign.metrics
  const p = campaign.prev_metrics as typeof m

  const creatives = MOCK_CREATIVES.filter(c => c.campaignId === id)
  const sessions = MOCK_SESSIONS.filter(s => s.campaignId === id)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title={campaign.name} breadcrumb={{ label: 'Campaigns', to: '/campaigns' }} />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700">
          <Info size={13} className="flex-shrink-0 mt-0.5" />
          <span>
            GMV {isLive ? 'Live' : 'Product'} Max — TikTok tự quản lý targeting và bid.
            {isLive ? ' Chỉ xem metrics từng session.' : ' Có thể bật/tắt từng creative video.'}
          </span>
        </div>

        {/* Overview metrics */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Cost', val: formatCurrency(m.cost), cur: m.cost, prev: p.cost, lower: true },
            { label: 'SKU Orders', val: formatNumber(m.sku_orders), cur: m.sku_orders, prev: p.sku_orders },
            { label: 'Gross Revenue', val: formatCurrency(m.gross_revenue), cur: m.gross_revenue, prev: p.gross_revenue },
            { label: 'ROI', val: `${m.roi.toFixed(2)}x`, cur: m.roi, prev: p.roi },
          ].map(metric => (
            <div key={metric.label} className="bg-white border border-gray-100 rounded-xl p-3.5">
              <div className="text-[11px] text-gray-500 font-medium mb-1">{metric.label}</div>
              <div className="text-xl font-semibold text-gray-900 mb-1">{metric.val}</div>
              <DeltaBadge current={metric.cur} previous={metric.prev} lowerIsBetter={metric.lower} />
            </div>
          ))}
        </div>

        {/* Creatives table (Product GMV) */}
        {!isLive && (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-800">
              Creatives ({creatives.length})
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  {['Video', 'Status', 'Cost', 'Orders', 'Cost/Order', 'Revenue', 'ROI', 'vs CK', ''].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {creatives.map(cr => (
                  <tr key={cr.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="px-3 py-3 font-semibold text-gray-800">{cr.name}</td>
                    <td className="px-3 py-3"><StatusBadge status={cr.status} /></td>
                    <td className="px-3 py-3">{formatCurrency(cr.metrics.cost)}</td>
                    <td className="px-3 py-3 font-medium">{cr.metrics.sku_orders}</td>
                    <td className="px-3 py-3">{formatCurrency(cr.metrics.cost_per_order)}</td>
                    <td className="px-3 py-3">{formatCurrency(cr.metrics.gross_revenue)}</td>
                    <td className="px-3 py-3">
                      <span className={`font-semibold ${cr.metrics.roi >= 3 ? 'text-green-700' : 'text-amber-700'}`}>
                        {cr.metrics.roi.toFixed(2)}x
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <DeltaBadge current={cr.metrics.roi} previous={cr.prev.roi} />
                    </td>
                    <td className="px-3 py-3">
                      <button className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors ${cr.status === 'active' ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'bg-blue-600 text-white border-blue-600'}`}>
                        {cr.status === 'active' ? 'Tắt' : 'Bật'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Live sessions (read only) */}
        {isLive && (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">Sessions live</span>
              <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">read-only</span>
            </div>
            {sessions.map(s => (
              <div key={s.id} className="flex items-center gap-6 px-4 py-3.5 border-b border-gray-50 last:border-0">
                <div className="min-w-0 w-36">
                  <div className="text-xs font-semibold text-gray-700">{new Date(s.start).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{s.end ? `Kết thúc ${new Date(s.end).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : 'Đang live'}</div>
                </div>
                <div className="grid grid-cols-4 gap-8 flex-1">
                  {[
                    { label: 'Cost', val: formatCurrency(s.metrics.cost) },
                    { label: 'Orders', val: String(s.metrics.sku_orders) },
                    { label: 'Revenue', val: formatCurrency(s.metrics.gross_revenue) },
                    { label: 'ROI', val: `${s.metrics.roi.toFixed(2)}x` },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="text-[10px] text-gray-400">{m.label}</div>
                      <div className="text-sm font-semibold text-gray-800">{m.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

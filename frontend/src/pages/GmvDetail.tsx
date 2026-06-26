import { useParams } from 'react-router-dom'
import { Info } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import StatusBadge from '@/components/ui/StatusBadge'
import DeltaBadge from '@/components/ui/DeltaBadge'
import { useWorkspace } from '@/context/WorkspaceContext'
import { useGmvCampaigns, useCreatives, useUpdateCampaignStatus, useUpdateCreativeStatus } from '@/api/hooks'
import { formatCurrency, formatNumber } from '@/lib/utils'

export default function GmvDetail() {
  const { id } = useParams<{ id: string }>()
  const { company, period } = useWorkspace()
  const { data: gmvCamps = [], isLoading } = useGmvCampaigns(company?.id ?? null, period)
  const { data: creatives = [], isLoading: loadingCreatives } = useCreatives(id ?? null)
  const updateStatus = useUpdateCampaignStatus()
  const updateCreative = useUpdateCreativeStatus(id ?? '')

  const campaign = gmvCamps.find((c: any) => c.id === id)

  if (isLoading) return <div className="p-6 text-xs text-gray-400">Đang tải...</div>
  if (!campaign) return <div className="p-6 text-gray-400 text-sm">Campaign không tồn tại hoặc không phải GMV campaign.</div>

  const m = campaign.metrics
  const pm = campaign.prev_metrics
  const isLive = campaign.type === 'gmv_live'

  function toggleCampaign() {
    const newStatus = campaign.status === 'active' ? 'paused' : 'active'
    updateStatus.mutate({ id: campaign.id, status: newStatus, type: campaign.type, companyId: company!.id })
  }

  function toggleCreative(crId: string, crStatus: string) {
    const newStatus = crStatus === 'active' ? 'paused' : 'active'
    updateCreative.mutate({ id: crId, status: newStatus })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title={campaign.name} breadcrumb={{ label: 'Campaigns', to: '/campaigns' }} />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-800 mb-1">{campaign.name}</div>
            <StatusBadge status={campaign.status} />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-xs text-blue-700">
              <Info size={12} className="flex-shrink-0 mt-0.5" />
              <span>GMV {isLive ? 'Live' : 'Product'} — TikTok tự quản lý targeting.</span>
            </div>
            <button
              onClick={toggleCampaign}
              disabled={updateStatus.isPending}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-50 ${campaign.status === 'active' ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'}`}>
              {updateStatus.isPending ? '...' : campaign.status === 'active' ? 'Pause' : 'Enable'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Cost', val: formatCurrency(m.cost), cur: m.cost, prev: pm.cost, lower: true },
            { label: 'SKU Orders', val: formatNumber(m.sku_orders), cur: m.sku_orders, prev: pm.sku_orders },
            { label: 'Gross Revenue', val: formatCurrency(m.gross_revenue), cur: m.gross_revenue, prev: pm.gross_revenue },
            { label: 'ROI', val: m.roi > 0 ? `${m.roi.toFixed(2)}x` : '—', cur: m.roi, prev: pm.roi },
          ].map(metric => (
            <div key={metric.label} className="bg-white border border-gray-100 rounded-xl p-3.5">
              <div className="text-[11px] text-gray-500 mb-1">{metric.label}</div>
              <div className="text-xl font-semibold text-gray-900 mb-1">{metric.val}</div>
              <DeltaBadge current={metric.cur} previous={metric.prev} lowerIsBetter={metric.lower} />
            </div>
          ))}
        </div>

        {!isLive && (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-sm font-semibold text-gray-800">
              Creatives {loadingCreatives ? '' : `(${creatives.length})`}
            </div>
            {loadingCreatives ? (
              <div className="p-6 text-center text-xs text-gray-400">Đang tải...</div>
            ) : creatives.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">Chưa có creatives — bấm Đồng bộ để pull từ TikTok Shop.</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {['Video', 'Status', 'Cost', 'Orders', 'Cost/Order', 'Revenue', 'ROI', 'vs CK', ''].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {creatives.map((cr: any) => (
                    <tr key={cr.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-3 font-semibold text-gray-800">{cr.name}</td>
                      <td className="px-3 py-3"><StatusBadge status={cr.status} /></td>
                      <td className="px-3 py-3">{formatCurrency(cr.metrics.cost)}</td>
                      <td className="px-3 py-3 font-medium">{cr.metrics.sku_orders}</td>
                      <td className="px-3 py-3">{formatCurrency(cr.metrics.cost_per_order)}</td>
                      <td className="px-3 py-3">{formatCurrency(cr.metrics.gross_revenue)}</td>
                      <td className="px-3 py-3">
                        <span className={`font-semibold ${cr.metrics.roi >= 3 ? 'text-green-700' : 'text-amber-700'}`}>
                          {cr.metrics.roi > 0 ? `${cr.metrics.roi.toFixed(2)}x` : '—'}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <DeltaBadge current={cr.metrics.roi} previous={cr.prev_metrics.roi} />
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => toggleCreative(cr.id, cr.status)}
                          disabled={updateCreative.isPending}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors disabled:opacity-50 ${cr.status === 'active' ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'bg-blue-600 text-white border-blue-600'}`}>
                          {cr.status === 'active' ? 'Tắt' : 'Bật'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {isLive && (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">Sessions live</span>
              <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">read-only</span>
            </div>
            <div className="p-8 text-center text-xs text-gray-400">
              Live session metrics được quản lý qua TikTok Shop API. Campaign ID: <span className="font-mono">{campaign.id}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

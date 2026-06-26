import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '@/components/layout/Topbar'
import StatusBadge from '@/components/ui/StatusBadge'
import CampaignTypeBadge from '@/components/ui/CampaignTypeBadge'
import DeltaBadge from '@/components/ui/DeltaBadge'
import ProgressBar from '@/components/ui/ProgressBar'
import { useWorkspace } from '@/context/WorkspaceContext'
import { useCampaigns, useGmvCampaigns } from '@/api/hooks'
import { formatCurrency } from '@/lib/utils'
import { isStdMetrics, isGmvMetrics, type CampaignType, type CampaignStatus } from '@/types'

export default function Campaigns() {
  const { company, period } = useWorkspace()
  const navigate = useNavigate()
  const [typeFilter, setTypeFilter] = useState<CampaignType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all')

  const { data: stdCamps = [], isLoading: loadingStd } = useCampaigns(company?.id ?? null, period)
  const { data: gmvCamps = [], isLoading: loadingGmv } = useGmvCampaigns(company?.id ?? null, period)

  const all = [...stdCamps, ...gmvCamps]
  const filtered = all.filter((c: any) =>
    (typeFilter === 'all' || c.type === typeFilter) &&
    (statusFilter === 'all' || c.status === statusFilter)
  )

  function detailRoute(c: any) {
    return c.type === 'standard' ? `/campaigns/${c.id}/ads` : `/campaigns/${c.id}/gmv`
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Campaigns" showCreate showSync />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="flex gap-2 px-4 py-3 border-b border-gray-100">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as CampaignType | 'all')}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-blue-400">
              <option value="all">Tất cả loại</option>
              <option value="standard">Standard</option>
              <option value="gmv_product">GMV Product</option>
              <option value="gmv_live">GMV Live</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as CampaignStatus | 'all')}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-blue-400">
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
            <span className="text-xs text-gray-400 self-center ml-auto">
              {loadingStd || loadingGmv ? 'Đang tải...' : `${filtered.length} campaigns`}
            </span>
          </div>

          {!loadingStd && !loadingGmv && filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">
              {all.length === 0 ? 'Chưa có dữ liệu — bấm Đồng bộ để pull từ TikTok' : 'Không tìm thấy campaign nào'}
            </div>
          )}

          {filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ minWidth: 860 }}>
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {['Tên', 'Loại', 'Trạng thái', 'Metrics chính', 'vs Cùng kỳ', 'Budget', ''].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c: any) => {
                    const m = c.metrics
                    const pm = c.prev_metrics
                    return (
                      <tr key={c.id} onClick={() => navigate(detailRoute(c))}
                        className="border-b border-gray-50 hover:bg-blue-50/30 last:border-0 cursor-pointer transition-colors">
                        <td className="px-3 py-3 font-semibold text-gray-800">{c.name}</td>
                        <td className="px-3 py-3"><CampaignTypeBadge type={c.type} /></td>
                        <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                        <td className="px-3 py-3">
                          {isStdMetrics(m) && (
                            <div>
                              <div className={`font-semibold ${m.roas >= 2 ? 'text-green-700' : 'text-amber-700'}`}>
                                {m.roas > 0 ? `ROAS ${m.roas.toFixed(1)}x` : '—'}
                              </div>
                              <div className="text-gray-400 text-[11px]">{m.spend > 0 ? formatCurrency(m.spend) : '—'}</div>
                            </div>
                          )}
                          {isGmvMetrics(m) && (
                            <div>
                              <div className={`font-semibold ${m.roi >= 3 ? 'text-green-700' : 'text-amber-700'}`}>
                                {m.roi > 0 ? `ROI ${m.roi.toFixed(2)}x` : '—'}
                              </div>
                              <div className="text-gray-400 text-[11px]">{m.sku_orders > 0 ? `${m.sku_orders} orders` : '—'}</div>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          {isStdMetrics(m) && isStdMetrics(pm) && m.spend > 0 && <DeltaBadge current={m.spend} previous={pm.spend} />}
                          {isGmvMetrics(m) && isGmvMetrics(pm) && m.roi > 0 && <DeltaBadge current={m.roi} previous={pm.roi} />}
                        </td>
                        <td className="px-3 py-3"><ProgressBar spend={c.budget_spend} budget={c.budget_daily} /></td>
                        <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                          <button className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors ${c.status === 'active' ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'bg-blue-600 text-white border-blue-600'}`}>
                            {c.status === 'active' ? 'Pause' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

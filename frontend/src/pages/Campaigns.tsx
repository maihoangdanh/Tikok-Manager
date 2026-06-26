import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '@/components/layout/Topbar'
import StatusBadge from '@/components/ui/StatusBadge'
import DeltaBadge from '@/components/ui/DeltaBadge'
import ProgressBar from '@/components/ui/ProgressBar'
import { useWorkspace } from '@/context/WorkspaceContext'
import { useCampaigns, useGmvCampaigns, useUpdateCampaignStatus } from '@/api/hooks'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { CampaignStatus } from '@/types'

export default function Campaigns() {
  const { company, period } = useWorkspace()
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all')

  const { data: stdCamps = [], isLoading: loadingStd } = useCampaigns(company?.id ?? null, period)
  const { data: gmvCamps = [], isLoading: loadingGmv } = useGmvCampaigns(company?.id ?? null, period)
  const updateStatus = useUpdateCampaignStatus()

  const filteredStd = stdCamps.filter((c: any) => statusFilter === 'all' || c.status === statusFilter)
  const filteredGmv = gmvCamps.filter((c: any) => statusFilter === 'all' || c.status === statusFilter)

  const loading = loadingStd || loadingGmv

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Campaigns" showCreate showSync />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Filters */}
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as CampaignStatus | 'all')}
            className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:border-blue-400">
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
          </select>
          <span className="text-xs text-gray-400 ml-auto">
            {loading ? 'Đang tải...' : `${filteredStd.length + filteredGmv.length} campaigns`}
          </span>
        </div>

        {!loading && stdCamps.length === 0 && gmvCamps.length === 0 && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-6 text-center">
            <div className="text-sm font-medium text-amber-800 mb-1">Chưa có dữ liệu</div>
            <div className="text-xs text-amber-600">Bấm <strong>Đồng bộ</strong> để pull campaigns từ TikTok.</div>
          </div>
        )}

        {/* Standard Campaigns */}
        {(loadingStd || filteredStd.length > 0) && (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">Campaign Thường</span>
              <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                {loadingStd ? '...' : filteredStd.length}
              </span>
            </div>
            {loadingStd ? (
              <div className="p-6 text-center text-xs text-gray-400">Đang tải...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ minWidth: 820 }}>
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      {['Tên', 'Trạng thái', 'Chi tiêu', 'ROAS', 'Clicks', 'CTR', 'Budget', ''].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStd.map((c: any) => {
                      const m = c.metrics
                      const pm = c.prev_metrics
                      return (
                        <tr key={c.id} onClick={() => navigate(`/campaigns/${c.id}/ads`)}
                          className="border-b border-gray-50 hover:bg-blue-50/30 last:border-0 cursor-pointer transition-colors">
                          <td className="px-3 py-3">
                            <div className="font-semibold text-gray-800">{c.name}</div>
                            {c.objective && <div className="text-[10px] text-gray-400 capitalize mt-0.5">{c.objective}</div>}
                          </td>
                          <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                          <td className="px-3 py-3">
                            <div className="font-semibold text-gray-800">{formatCurrency(m.spend)}</div>
                            <DeltaBadge current={m.spend} previous={pm.spend} />
                          </td>
                          <td className="px-3 py-3">
                            <div className={`font-semibold ${m.roas >= 2 ? 'text-green-700' : m.roas > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                              {m.roas > 0 ? `${m.roas.toFixed(1)}x` : '—'}
                            </div>
                            {m.roas > 0 && <DeltaBadge current={m.roas} previous={pm.roas} />}
                          </td>
                          <td className="px-3 py-3 text-gray-700">{formatNumber(m.clicks)}</td>
                          <td className="px-3 py-3 text-gray-700">{m.ctr > 0 ? `${m.ctr.toFixed(2)}%` : '—'}</td>
                          <td className="px-3 py-3"><ProgressBar spend={c.budget_spend} budget={c.budget_daily} /></td>
                          <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => updateStatus.mutate({ id: c.id, status: c.status === 'active' ? 'paused' : 'active', type: 'standard', companyId: company!.id })}
                              disabled={updateStatus.isPending}
                              className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors disabled:opacity-50 ${c.status === 'active' ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'bg-blue-600 text-white border-blue-600'}`}>
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
        )}

        {/* GMV Max Campaigns */}
        {(loadingGmv || filteredGmv.length > 0) && (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">GMV Max</span>
              <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                {loadingGmv ? '...' : filteredGmv.length}
              </span>
            </div>
            {loadingGmv ? (
              <div className="p-6 text-center text-xs text-gray-400">Đang tải...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs" style={{ minWidth: 820 }}>
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      {['Tên', 'Loại', 'Trạng thái', 'Cost', 'ROI', 'Orders', 'Revenue', 'Budget', ''].map(h => (
                        <th key={h} className="text-left px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGmv.map((c: any) => {
                      const m = c.metrics
                      const pm = c.prev_metrics
                      return (
                        <tr key={c.id} onClick={() => navigate(`/campaigns/${c.id}/gmv`)}
                          className="border-b border-gray-50 hover:bg-purple-50/20 last:border-0 cursor-pointer transition-colors">
                          <td className="px-3 py-3 font-semibold text-gray-800">{c.name}</td>
                          <td className="px-3 py-3">
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${c.type === 'gmv_live' ? 'bg-pink-50 text-pink-700' : 'bg-purple-50 text-purple-700'}`}>
                              {c.type === 'gmv_live' ? 'Live' : 'Product'}
                            </span>
                          </td>
                          <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                          <td className="px-3 py-3">
                            <div className="font-semibold text-gray-800">{formatCurrency(m.cost ?? 0)}</div>
                            <DeltaBadge current={m.cost ?? 0} previous={pm.cost ?? 0} lowerIsBetter />
                          </td>
                          <td className="px-3 py-3">
                            <div className={`font-semibold ${(m.roi ?? 0) >= 3 ? 'text-green-700' : (m.roi ?? 0) > 0 ? 'text-amber-700' : 'text-gray-400'}`}>
                              {(m.roi ?? 0) > 0 ? `${m.roi.toFixed(2)}x` : '—'}
                            </div>
                            {(m.roi ?? 0) > 0 && <DeltaBadge current={m.roi} previous={pm.roi ?? 0} />}
                          </td>
                          <td className="px-3 py-3 text-gray-700">{formatNumber(m.sku_orders ?? 0)}</td>
                          <td className="px-3 py-3 text-gray-700">{formatCurrency(m.gross_revenue ?? 0)}</td>
                          <td className="px-3 py-3"><ProgressBar spend={c.budget_spend} budget={c.budget_daily} /></td>
                          <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                            <button
                              onClick={() => updateStatus.mutate({ id: c.id, status: c.status === 'active' ? 'paused' : 'active', type: c.type, companyId: company!.id })}
                              disabled={updateStatus.isPending}
                              className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors disabled:opacity-50 ${c.status === 'active' ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'bg-blue-600 text-white border-blue-600'}`}>
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
        )}

      </div>
    </div>
  )
}

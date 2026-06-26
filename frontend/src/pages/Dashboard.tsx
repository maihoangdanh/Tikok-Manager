import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import MetricCard from '@/components/dashboard/MetricCard'
import SpendChart from '@/components/dashboard/SpendChart'
import StatusBadge from '@/components/ui/StatusBadge'
import CampaignTypeBadge from '@/components/ui/CampaignTypeBadge'
import DeltaBadge from '@/components/ui/DeltaBadge'
import ProgressBar from '@/components/ui/ProgressBar'
import { useWorkspace } from '@/context/WorkspaceContext'
import { useCampaigns, useGmvCampaigns, useAlerts, useUpdateCampaignStatus } from '@/api/hooks'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { isStdMetrics, isGmvMetrics } from '@/types'

export default function Dashboard() {
  const { company, period } = useWorkspace()
  const navigate = useNavigate()

  const { data: stdCamps = [], isLoading: loadingStd } = useCampaigns(company?.id ?? null, period)
  const { data: gmvCamps = [], isLoading: loadingGmv } = useGmvCampaigns(company?.id ?? null, period)
  const { data: alerts = [] } = useAlerts(company?.id ?? null)
  const updateStatus = useUpdateCampaignStatus()

  const campaigns = [...stdCamps, ...gmvCamps]
  const criticals = alerts.filter((a: any) => a.severity === 'critical')
  const loading = loadingStd || loadingGmv

  // Standard aggregates
  const stdSpend = stdCamps.reduce((s: number, c: any) => s + (c.metrics?.spend ?? 0), 0)
  const stdPrevSpend = stdCamps.reduce((s: number, c: any) => s + (c.prev_metrics?.spend ?? 0), 0)
  const stdRoasArr = stdCamps.filter((c: any) => c.metrics?.roas > 0)
  const avgRoas = stdRoasArr.reduce((s: number, c: any) => s + c.metrics.roas, 0) / (stdRoasArr.length || 1)
  const prevAvgRoas = stdCamps.reduce((s: number, c: any) => s + (c.prev_metrics?.roas ?? 0), 0) / (stdCamps.length || 1)

  // GMV aggregates
  const gmvCost = gmvCamps.reduce((s: number, c: any) => s + (c.metrics?.cost ?? 0), 0)
  const gmvPrevCost = gmvCamps.reduce((s: number, c: any) => s + (c.prev_metrics?.cost ?? 0), 0)
  const gmvOrders = gmvCamps.reduce((s: number, c: any) => s + (c.metrics?.sku_orders ?? 0), 0)
  const gmvPrevOrders = gmvCamps.reduce((s: number, c: any) => s + (c.prev_metrics?.sku_orders ?? 0), 0)
  const gmvRevenue = gmvCamps.reduce((s: number, c: any) => s + (c.metrics?.gross_revenue ?? 0), 0)
  const gmvPrevRevenue = gmvCamps.reduce((s: number, c: any) => s + (c.prev_metrics?.gross_revenue ?? 0), 0)
  const gmvRoiArr = gmvCamps.filter((c: any) => c.metrics?.roi > 0)
  const avgRoi = gmvRoiArr.reduce((s: number, c: any) => s + c.metrics.roi, 0) / (gmvRoiArr.length || 1)
  const prevAvgRoi = gmvCamps.reduce((s: number, c: any) => s + (c.prev_metrics?.roi ?? 0), 0) / (gmvCamps.length || 1)

  function detailRoute(c: any) {
    return c.type === 'standard' ? `/campaigns/${c.id}/ads` : `/campaigns/${c.id}/gmv`
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Dashboard" showPeriod showCreate showSync />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {criticals.length > 0 && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-800">
            <AlertTriangle size={15} className="flex-shrink-0" />
            <span className="flex-1">{criticals[0].message}</span>
            <button onClick={() => navigate('/alerts')} className="text-xs border border-red-300 rounded-lg px-2.5 py-1 hover:bg-red-100 transition-colors font-medium">
              Xem alerts
            </button>
          </div>
        )}

        {loading && (
          <div className="text-xs text-gray-400 text-center py-8">Đang tải dữ liệu...</div>
        )}

        {!loading && campaigns.length === 0 && company && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-6 text-center">
            <div className="text-sm font-medium text-amber-800 mb-1">Chưa có dữ liệu</div>
            <div className="text-xs text-amber-600">Bấm <strong>Đồng bộ</strong> để pull campaigns từ TikTok về.</div>
          </div>
        )}

        {stdCamps.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Standard Campaigns</div>
            <div className="grid grid-cols-4 gap-3">
              <MetricCard label="Chi tiêu" value={formatCurrency(stdSpend)} current={stdSpend} previous={stdPrevSpend} prevLabel={formatCurrency(stdPrevSpend)} sparkData={[]} />
              <MetricCard label="ROAS trung bình" value={`${avgRoas.toFixed(1)}x`} current={avgRoas} previous={prevAvgRoas} prevLabel={`${prevAvgRoas.toFixed(1)}x`} sparkData={[]} color="#8B5CF6" />
              <MetricCard label="Campaigns active" value={String(stdCamps.filter((c: any) => c.status === 'active').length)} current={stdCamps.filter((c: any) => c.status === 'active').length} previous={stdCamps.length} prevLabel={`${stdCamps.length} tổng`} sparkData={[]} color="#10B981" />
              <MetricCard label="Alerts" value={String(alerts.length)} current={alerts.length} previous={0} prevLabel="0" sparkData={[]} lowerIsBetter color="#EF4444" />
            </div>
          </div>
        )}

        {gmvCamps.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">GMV Max</div>
            <div className="grid grid-cols-4 gap-3">
              <MetricCard label="Cost" value={formatCurrency(gmvCost)} current={gmvCost} previous={gmvPrevCost} prevLabel={formatCurrency(gmvPrevCost)} sparkData={[]} lowerIsBetter />
              <MetricCard label="ROI trung bình" value={`${avgRoi.toFixed(2)}x`} current={avgRoi} previous={prevAvgRoi} prevLabel={`${prevAvgRoi.toFixed(2)}x`} sparkData={[]} color="#8B5CF6" />
              <MetricCard label="SKU Orders" value={formatNumber(gmvOrders)} current={gmvOrders} previous={gmvPrevOrders} prevLabel={formatNumber(gmvPrevOrders)} sparkData={[]} color="#10B981" />
              <MetricCard label="Gross Revenue" value={formatCurrency(gmvRevenue)} current={gmvRevenue} previous={gmvPrevRevenue} prevLabel={formatCurrency(gmvPrevRevenue)} sparkData={[]} color="#F59E0B" />
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3" style={{ height: 240 }}>
          <div className="col-span-2">
            <SpendChart />
          </div>
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
              <span className="text-sm font-semibold text-gray-800">Cảnh báo</span>
              <button onClick={() => navigate('/alerts')} className="text-xs text-blue-600 hover:text-blue-800">Tất cả</button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="flex items-center justify-center h-full text-xs text-gray-400">Không có cảnh báo</div>
              ) : alerts.slice(0, 4).map((a: any) => (
                <div key={a.id} className="flex items-start gap-2 px-3 py-2.5 border-b border-gray-50 last:border-0">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${a.severity === 'critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                    <AlertTriangle size={12} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium text-gray-700 truncate">{a.campaign_name}</div>
                    <div className="text-[10px] text-gray-400 leading-tight mt-0.5 line-clamp-2">{a.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {campaigns.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-semibold text-gray-800">Campaigns ({campaigns.length})</span>
              <button onClick={() => navigate('/campaigns')} className="text-xs text-blue-600 hover:text-blue-800">Xem tất cả</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    {['Tên', 'Loại', 'Trạng thái', 'Metrics chính', 'vs Cùng kỳ', 'Budget', ''].map(h => (
                      <th key={h} className="text-left px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c: any) => {
                    const m = c.metrics
                    const pm = c.prev_metrics
                    return (
                      <tr key={c.id} onClick={() => navigate(detailRoute(c))}
                        className="border-b border-gray-50 hover:bg-blue-50/30 last:border-0 cursor-pointer transition-colors">
                        <td className="px-3 py-2.5 font-semibold text-gray-800">{c.name}</td>
                        <td className="px-3 py-2.5"><CampaignTypeBadge type={c.type} /></td>
                        <td className="px-3 py-2.5"><StatusBadge status={c.status} /></td>
                        <td className="px-3 py-2.5">
                          {isStdMetrics(m) && (
                            <div>
                              <div className={`font-semibold ${m.roas >= 2 ? 'text-green-700' : 'text-amber-700'}`}>ROAS {m.roas.toFixed(1)}x</div>
                              <div className="text-gray-400 text-[11px]">{formatCurrency(m.spend)}</div>
                            </div>
                          )}
                          {isGmvMetrics(m) && (
                            <div>
                              <div className={`font-semibold ${m.roi >= 3 ? 'text-green-700' : 'text-amber-700'}`}>ROI {m.roi.toFixed(2)}x</div>
                              <div className="text-gray-400 text-[11px]">{m.sku_orders} orders</div>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          {isStdMetrics(m) && isStdMetrics(pm) && <DeltaBadge current={m.spend} previous={pm.spend} />}
                          {isGmvMetrics(m) && isGmvMetrics(pm) && <DeltaBadge current={m.roi} previous={pm.roi} />}
                        </td>
                        <td className="px-3 py-2.5"><ProgressBar spend={c.budget_spend} budget={c.budget_daily} /></td>
                        <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => updateStatus.mutate({ id: c.id, status: c.status === 'active' ? 'paused' : 'active', type: c.type, companyId: company!.id })}
                            disabled={updateStatus.isPending}
                            className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors font-medium disabled:opacity-50 ${c.status === 'active' ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'}`}>
                            {c.status === 'active' ? 'Pause' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

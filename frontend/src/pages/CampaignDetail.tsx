import { useParams } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import StatusBadge from '@/components/ui/StatusBadge'
import DeltaBadge from '@/components/ui/DeltaBadge'
import { useWorkspace } from '@/context/WorkspaceContext'
import { useCampaigns, useUpdateCampaignStatus } from '@/api/hooks'
import { formatCurrency, formatNumber } from '@/lib/utils'

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const { company, period } = useWorkspace()
  const { data: campaigns = [], isLoading } = useCampaigns(company?.id ?? null, period)
  const updateStatus = useUpdateCampaignStatus()

  const campaign = campaigns.find((c: any) => c.id === id)

  if (!company || isLoading) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Topbar title="Chi tiết Campaign" breadcrumb={{ label: 'Campaigns', to: '/campaigns' }} />
        <div className="p-6 text-xs text-gray-400">Đang tải...</div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Topbar title="Chi tiết Campaign" breadcrumb={{ label: 'Campaigns', to: '/campaigns' }} />
        <div className="p-6 text-gray-400 text-sm">Campaign không tìm thấy. Thử bấm <strong>Đồng bộ</strong> để pull dữ liệu mới nhất.</div>
      </div>
    )
  }

  const m = campaign.metrics
  const pm = campaign.prev_metrics

  function toggleStatus() {
    updateStatus.mutate({ id: campaign.id, status: campaign.status === 'active' ? 'paused' : 'active', type: 'standard', companyId: company!.id })
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title={campaign.name} breadcrumb={{ label: 'Campaigns', to: '/campaigns' }} />
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-800 mb-1">{campaign.name}</div>
            <div className="flex items-center gap-2">
              <StatusBadge status={campaign.status} />
              {campaign.objective && (
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full capitalize">{campaign.objective}</span>
              )}
            </div>
          </div>
          <button
            onClick={toggleStatus}
            disabled={updateStatus.isPending}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-50 ${campaign.status === 'active' ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'}`}>
            {updateStatus.isPending ? '...' : campaign.status === 'active' ? 'Pause' : 'Enable'}
          </button>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Chi tiêu', val: formatCurrency(m.spend), cur: m.spend, prev: pm.spend },
            { label: 'ROAS', val: m.roas > 0 ? `${m.roas.toFixed(1)}x` : '—', cur: m.roas, prev: pm.roas },
            { label: 'Clicks', val: formatNumber(m.clicks), cur: m.clicks, prev: pm.clicks },
            { label: 'CTR', val: `${m.ctr.toFixed(2)}%`, cur: m.ctr, prev: pm.ctr },
            { label: 'CPC', val: formatCurrency(m.cpc), cur: m.cpc, prev: pm.cpc, lower: true },
            { label: 'Impressions', val: formatNumber(m.impressions), cur: m.impressions, prev: pm.impressions },
            { label: 'Conversions', val: String(m.conversions), cur: m.conversions, prev: pm.conversions },
            { label: 'CPA', val: m.cpa > 0 ? formatCurrency(m.cpa) : '—', cur: m.cpa, prev: pm.cpa, lower: true },
          ].map(metric => (
            <div key={metric.label} className="bg-white border border-gray-100 rounded-xl p-3.5">
              <div className="text-[11px] text-gray-500 mb-1">{metric.label}</div>
              <div className="text-lg font-semibold text-gray-900 mb-1">{metric.val}</div>
              <DeltaBadge current={metric.cur} previous={metric.prev} lowerIsBetter={'lower' in metric && metric.lower} />
            </div>
          ))}
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Ngân sách</div>
          <div className="flex items-center gap-8">
            <div>
              <div className="text-[11px] text-gray-400 mb-0.5">Budget ngày</div>
              <div className="text-sm font-semibold">{formatCurrency(campaign.budget_daily)}</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-400 mb-0.5">Đã chi (7 ngày)</div>
              <div className="text-sm font-semibold">{formatCurrency(campaign.budget_spend)}</div>
            </div>
            <div>
              <div className="text-[11px] text-gray-400 mb-0.5">Campaign ID</div>
              <div className="text-xs font-mono text-gray-600">{campaign.id}</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-3">
          <ExternalLink size={16} className="text-gray-400 flex-shrink-0" />
          <div>
            <div className="text-xs font-medium text-gray-700 mb-0.5">Quản lý Ads & Ad Groups</div>
            <div className="text-[11px] text-gray-500">Để xem và chỉnh từng ad, truy cập TikTok Ads Manager với Campaign ID: <span className="font-mono">{campaign.id}</span></div>
          </div>
        </div>

      </div>
    </div>
  )
}

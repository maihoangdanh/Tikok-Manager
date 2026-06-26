import { useParams } from 'react-router-dom'
import { Video, Image } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import StatusBadge from '@/components/ui/StatusBadge'
import DeltaBadge from '@/components/ui/DeltaBadge'
import { MOCK_CAMPAIGNS } from '@/data/mock'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { isStdMetrics } from '@/types'

const MOCK_ADS = [
  { id: 'a1', campaignId: 'c1', name: 'Flash Sale Video 15s', format: 'video' as const, status: 'active' as const,
    metrics: { spend: 1850000, roas: 4.8, impressions: 62000, clicks: 1302, ctr: 2.1, cpc: 1050, conversions: 88, cpa: 21000 },
    prev: { spend: 1520000, roas: 4.1, impressions: 51000, clicks: 1071, ctr: 1.8, cpc: 1140, conversions: 66, cpa: 23000 } },
  { id: 'a2', campaignId: 'c1', name: 'Flash Sale Banner', format: 'image' as const, status: 'active' as const,
    metrics: { spend: 1400000, roas: 3.9, impressions: 48000, clicks: 1008, ctr: 1.8, cpc: 1280, conversions: 71, cpa: 26000 },
    prev: { spend: 1180000, roas: 3.5, impressions: 40000, clicks: 840, ctr: 1.6, cpc: 1404, conversions: 55, cpa: 28700 } },
  { id: 'a3', campaignId: 'c1', name: 'Testimonial 30s', format: 'video' as const, status: 'paused' as const,
    metrics: { spend: 950000, roas: 1.6, impressions: 32000, clicks: 890, ctr: 0.9, cpc: 1840, conversions: 39, cpa: 52100 },
    prev: { spend: 1230000, roas: 2.8, impressions: 29000, clicks: 1025, ctr: 1.7, cpc: 1596, conversions: 30, cpa: 41000 } },
]

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const campaign = MOCK_CAMPAIGNS.find(c => c.id === id)
  const ads = MOCK_ADS.filter(a => a.campaignId === id)
  if (!campaign || !isStdMetrics(campaign.metrics)) return <div className="p-6 text-gray-400">Campaign không tồn tại.</div>

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title={campaign.name} breadcrumb={{ label: 'Campaigns', to: '/campaigns' }} />
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {ads.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-xl p-8 text-center text-gray-400 text-sm">
            Chưa có ads trong campaign này.
          </div>
        ) : ads.map(ad => {
          const Icon = ad.format === 'video' ? Video : Image
          return (
            <div key={ad.id} className="bg-white border border-gray-100 rounded-xl p-4 flex gap-4 hover:shadow-sm transition-shadow">
              <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon size={20} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800 mb-0.5">{ad.name}</div>
                <div className="text-[10px] text-gray-400 capitalize mb-3">{ad.format}</div>
                <div className="grid grid-cols-5 gap-4">
                  {[
                    { label: 'Chi tiêu', val: formatCurrency(ad.metrics.spend), cur: ad.metrics.spend, prev: ad.prev.spend },
                    { label: 'ROAS', val: `${ad.metrics.roas.toFixed(1)}x`, cur: ad.metrics.roas, prev: ad.prev.roas },
                    { label: 'Clicks', val: formatNumber(ad.metrics.clicks), cur: ad.metrics.clicks, prev: ad.prev.clicks },
                    { label: 'CTR', val: `${ad.metrics.ctr.toFixed(1)}%`, cur: ad.metrics.ctr, prev: ad.prev.ctr },
                    { label: 'CPC', val: formatCurrency(ad.metrics.cpc), cur: ad.metrics.cpc, prev: ad.prev.cpc, lower: true },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="text-[10px] text-gray-400 mb-0.5">{m.label}</div>
                      <div className="text-sm font-semibold text-gray-800">{m.val}</div>
                      <DeltaBadge current={m.cur} previous={m.prev} lowerIsBetter={m.lower} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <StatusBadge status={ad.status} />
                <button className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors ${ad.status === 'active' ? 'border-gray-200 text-gray-600 hover:bg-gray-50' : 'bg-blue-600 text-white border-blue-600'}`}>
                  {ad.status === 'active' ? 'Pause' : 'Enable'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

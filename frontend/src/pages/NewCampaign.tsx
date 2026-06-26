import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import { useWorkspace } from '@/context/WorkspaceContext'
import { useCreateCampaign } from '@/api/hooks'
import type { CampaignType } from '@/types'

export default function NewCampaign() {
  const navigate = useNavigate()
  const { company } = useWorkspace()
  const createCampaign = useCreateCampaign(company?.id ?? null)

  const [type, setType] = useState<CampaignType>('standard')
  const [name, setName] = useState('')
  const [budget, setBudget] = useState('')
  const [objective, setObjective] = useState('conversions')
  const [budgetWarning, setBudgetWarning] = useState('80')
  const [minRoas, setMinRoas] = useState('2.0')
  const [minRoi, setMinRoi] = useState('3.0')
  const [error, setError] = useState('')

  const isGmv = type !== 'standard'

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!name.trim()) { setError('Điền tên campaign'); return }
    if (!budget || Number(budget) <= 0) { setError('Budget phải lớn hơn 0'); return }
    if (!company) { setError('Chọn công ty trước'); return }

    try {
      await createCampaign.mutateAsync({
        name: name.trim(),
        type,
        objective: isGmv ? undefined : objective,
        budget_daily: Number(budget),
        budget_type: 'BUDGET_MODE_DAY',
        alert_config: {
          budget_warning_pct: Number(budgetWarning),
          ...(isGmv ? { min_roi: Number(minRoi) } : { min_roas: Number(minRoas) }),
        },
      })
      navigate('/campaigns')
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Lỗi khi tạo campaign')
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Tạo campaign mới" breadcrumb={{ label: 'Campaigns', to: '/campaigns' }} />
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={submit} className="max-w-lg space-y-5">

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">{error}</div>
          )}

          <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Thông tin cơ bản</div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Tên campaign</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="VD: Flash Sale tháng 7"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Loại campaign</label>
                <select value={type} onChange={e => setType(e.target.value as CampaignType)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-blue-400">
                  <option value="standard">Standard</option>
                  <option value="gmv_product">GMV Product</option>
                  <option value="gmv_live">GMV Live</option>
                </select>
              </div>
              {!isGmv && (
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">Mục tiêu</label>
                  <select value={objective} onChange={e => setObjective(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-blue-400">
                    <option value="conversions">Conversions</option>
                    <option value="traffic">Traffic</option>
                    <option value="awareness">Awareness</option>
                    <option value="catalog_sales">Catalog Sales</option>
                  </select>
                </div>
              )}
            </div>
            {isGmv && (
              <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 text-xs text-blue-700">
                <Info size={13} className="flex-shrink-0 mt-0.5" />
                GMV {type === 'gmv_live' ? 'Live' : 'Product'} — TikTok tự quản lý targeting và bid. Thêm creatives trong TikTok Ads Manager sau khi tạo.
              </div>
            )}
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngân sách</div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Budget ngày (₫)</label>
              <input type="number" value={budget} onChange={e => setBudget(e.target.value)} placeholder="500000" min={1}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100" />
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngưỡng cảnh báo</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1.5">Cảnh báo budget (%)</label>
                <input type="number" value={budgetWarning} onChange={e => setBudgetWarning(e.target.value)} min={50} max={100}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400" />
              </div>
              {!isGmv ? (
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">ROAS tối thiểu</label>
                  <input type="number" value={minRoas} onChange={e => setMinRoas(e.target.value)} step={0.1} min={0}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400" />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-medium text-gray-700 block mb-1.5">ROI tối thiểu</label>
                  <input type="number" value={minRoi} onChange={e => setMinRoi(e.target.value)} step={0.1} min={0}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400" />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => navigate('/campaigns')}
              className="flex-1 py-2.5 text-sm border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors font-medium">
              Hủy
            </button>
            <button type="submit" disabled={createCampaign.isPending}
              className="flex-1 py-2.5 text-sm bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50">
              {createCampaign.isPending ? 'Đang tạo...' : 'Tạo campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

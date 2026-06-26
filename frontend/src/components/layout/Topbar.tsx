import { useNavigate } from 'react-router-dom'
import { Plus, RefreshCw } from 'lucide-react'
import { useWorkspace } from '@/context/WorkspaceContext'
import { useSyncCampaigns } from '@/api/hooks'
import type { Period } from '@/types'

interface Props {
  title: string
  showPeriod?: boolean
  showCreate?: boolean
  showSync?: boolean
  breadcrumb?: { label: string; to: string }
}

const PERIODS: { value: Period; label: string }[] = [
  { value: '1', label: 'Hôm nay' },
  { value: '7', label: '7 ngày' },
  { value: '30', label: '30 ngày' },
]

export default function Topbar({ title, showPeriod, showCreate, showSync, breadcrumb }: Props) {
  const { company, period, setPeriod } = useWorkspace()
  const navigate = useNavigate()
  const sync = useSyncCampaigns(company?.id ?? null)

  return (
    <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 flex-shrink-0">
      <div className="flex items-center gap-1.5 text-sm min-w-0">
        {company && (
          <>
            <span className="w-5 h-5 rounded text-[10px] font-bold flex items-center justify-center flex-shrink-0"
              style={{ background: company.color.bg, color: company.color.text }}>{company.initials}</span>
            <span className="text-gray-300">/</span>
          </>
        )}
        {breadcrumb && (
          <>
            <button onClick={() => navigate(breadcrumb.to)} className="text-gray-400 hover:text-gray-700 transition-colors">
              {breadcrumb.label}
            </button>
            <span className="text-gray-300">/</span>
          </>
        )}
        <span className="font-semibold text-gray-800 truncate">{title}</span>
      </div>

      <div className="flex gap-2 items-center flex-shrink-0">
        {showPeriod && (
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-xs transition-colors ${period === p.value ? 'bg-gray-100 font-semibold text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}>
                {p.label}
              </button>
            ))}
          </div>
        )}
        {showSync && (
          <button onClick={() => sync.mutate()} disabled={sync.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50">
            <RefreshCw size={12} className={sync.isPending ? 'animate-spin' : ''} />
            {sync.isPending ? 'Đang sync...' : 'Đồng bộ'}
          </button>
        )}
        {showCreate && (
          <button onClick={() => navigate('/campaigns/new')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors font-medium">
            <Plus size={13} /> Tạo campaign
          </button>
        )}
      </div>
    </div>
  )
}

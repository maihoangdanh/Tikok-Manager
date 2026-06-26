import { AlertTriangle, CheckCircle } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import { useWorkspace } from '@/context/WorkspaceContext'
import { useAlerts, useResolveAlert } from '@/api/hooks'
import { timeAgo } from '@/lib/utils'

export default function AlertsPage() {
  const { company } = useWorkspace()
  const { data: all = [], isLoading } = useAlerts(company?.id ?? null)
  const resolve = useResolveAlert(company?.id ?? null)

  const criticals = all.filter((a: any) => !a.resolved && a.severity === 'critical')
  const warnings = all.filter((a: any) => !a.resolved && a.severity === 'warning')

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Cảnh báo" />
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading && <div className="text-xs text-gray-400 text-center py-8">Đang tải...</div>}

        {criticals.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-red-50 text-sm font-semibold text-red-700 flex items-center gap-2">
              <AlertTriangle size={14} /> Critical ({criticals.length})
            </div>
            {criticals.map((a: any) => (
              <div key={a.id} className="flex items-start gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800 mb-0.5">{a.campaign_name}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{a.message}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-[10px] text-gray-400">{timeAgo(a.created_at)}</span>
                  <button
                    onClick={() => resolve.mutate(a.id)}
                    disabled={resolve.isPending}
                    className="text-[11px] px-2.5 py-1 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50">
                    Xử lý
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {warnings.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-amber-50 text-sm font-semibold text-amber-700 flex items-center gap-2">
              <AlertTriangle size={14} /> Warning ({warnings.length})
            </div>
            {warnings.map((a: any) => (
              <div key={a.id} className="flex items-start gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800 mb-0.5">{a.campaign_name}</div>
                  <div className="text-xs text-gray-500 leading-relaxed">{a.message}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-[10px] text-gray-400">{timeAgo(a.created_at)}</span>
                  <button
                    onClick={() => resolve.mutate(a.id)}
                    disabled={resolve.isPending}
                    className="text-[11px] px-2.5 py-1 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                    Bỏ qua
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && criticals.length === 0 && warnings.length === 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-12 text-center">
            <CheckCircle size={32} className="text-green-400 mx-auto mb-3" />
            <div className="text-sm font-medium text-gray-600">Không có cảnh báo nào</div>
            <div className="text-xs text-gray-400 mt-1">Tất cả campaigns đang hoạt động tốt</div>
          </div>
        )}
      </div>
    </div>
  )
}

import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Megaphone, Bell, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import WorkspaceSwitcher from './WorkspaceSwitcher'
import { useWorkspace } from '@/context/WorkspaceContext'
import { MOCK_ALERTS } from '@/data/mock'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/settings', icon: Settings, label: 'Cài đặt' },
]

export default function Sidebar() {
  const { company } = useWorkspace()
  const alertCount = MOCK_ALERTS.filter(a => !a.resolved && (!company || a.company_id === company.id)).length

  return (
    <aside className="w-48 flex-shrink-0 border-r border-gray-100 bg-white flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <div className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center">
          <Megaphone size={13} className="text-white" />
        </div>
        <span className="text-sm font-semibold text-gray-900">DM Manager</span>
      </div>

      <WorkspaceSwitcher />

      <nav className="flex-1 py-2">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => cn(
            'flex items-center gap-2.5 px-4 py-2 text-sm border-l-2 transition-colors',
            isActive
              ? 'bg-blue-50 text-blue-700 font-medium border-blue-600'
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50 border-transparent'
          )}>
            <Icon size={15} />
            <span className="flex-1">{label}</span>
            {label === 'Alerts' && alertCount > 0 && (
              <span className="bg-red-100 text-red-700 text-[10px] font-medium px-1.5 py-0.5 rounded-full">{alertCount}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {company && (
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="text-[10px] text-gray-400 uppercase tracking-wider mb-1">TikTok Ads ID</div>
          <div className="text-[11px] font-mono text-gray-500 truncate">{company.id}</div>
        </div>
      )}
    </aside>
  )
}

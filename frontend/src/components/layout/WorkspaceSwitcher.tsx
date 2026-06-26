import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Check, LayoutGrid, Plus, X, Loader2 } from 'lucide-react'
import { useWorkspace } from '@/context/WorkspaceContext'
import type { Company } from '@/types'
import api from '@/api/client'

const COLORS = [
  { bg: '#E6F1FB', text: '#185FA5' },
  { bg: '#EAF3DE', text: '#3B6D11' },
  { bg: '#FAEEDA', text: '#854F0B' },
  { bg: '#F3E8FF', text: '#6B21A8' },
  { bg: '#FCE7F3', text: '#9D174D' },
]

export default function WorkspaceSwitcher() {
  const { company, setCompany, companies, refreshCompanies } = useWorkspace()
  const [open, setOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [initials, setInitials] = useState('')
  const [colorIdx, setColorIdx] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false); setShowForm(false)
      }
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  function select(c: Company | null) { setCompany(c); setOpen(false); navigate('/dashboard') }

  async function createCompany() {
    if (!name.trim() || !initials.trim()) return
    setSaving(true); setError('')
    try {
      const id = name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20)
      await api.post('/companies/', { id, name: name.trim(), initials: initials.trim().toUpperCase().slice(0, 3), color: COLORS[colorIdx] })
      await refreshCompanies()
      setName(''); setInitials(''); setShowForm(false)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Tạo thất bại')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div ref={ref} className="relative px-3 py-2 border-b border-gray-100">
      <button onClick={() => { setOpen(!open); setShowForm(false) }}
        className="w-full flex items-center gap-2 px-2 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-left transition-colors">
        <span className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold flex-shrink-0"
          style={company ? { background: company.color.bg, color: company.color.text } : { background: '#D3D1C7', color: '#5F5E5A' }}>
          {company ? company.initials : '★'}
        </span>
        <span className="flex-1 text-sm font-medium truncate text-gray-800">{company?.name ?? 'Tất cả công ty'}</span>
        <ChevronDown size={13} className={`text-gray-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-3 right-3 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          {!showForm ? (
            <>
              <div className="px-3 py-1.5 text-[10px] text-gray-400 uppercase tracking-wider font-medium">Công ty</div>
              {companies.length === 0 && (
                <div className="px-3 py-2 text-xs text-gray-400 italic">Chưa có công ty nào</div>
              )}
              {companies.map(c => (
                <button key={c.id} onClick={() => select(c)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-left transition-colors">
                  <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold"
                    style={{ background: c.color.bg, color: c.color.text }}>{c.initials}</span>
                  <span className="flex-1 text-xs font-medium text-gray-700">{c.name}</span>
                  {company?.id === c.id && <Check size={13} className="text-blue-600" />}
                </button>
              ))}
              <div className="border-t border-gray-100 my-1" />
              <button onClick={() => select(null)} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors">
                <LayoutGrid size={14} className="text-gray-400" />
                <span className="text-xs font-medium text-gray-600">Xem tất cả</span>
              </button>
              <button onClick={() => setShowForm(true)} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 transition-colors text-blue-600">
                <Plus size={14} />
                <span className="text-xs font-medium">Thêm công ty</span>
              </button>
            </>
          ) : (
            <div className="p-3 space-y-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-700">Thêm công ty mới</span>
                <button onClick={() => setShowForm(false)}><X size={14} className="text-gray-400" /></button>
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-500 block mb-1">Tên công ty</label>
                <input autoFocus value={name} onChange={e => setName(e.target.value)}
                  placeholder="VD: EVO Brand"
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-500 block mb-1">Viết tắt (2-3 ký tự)</label>
                <input value={initials} onChange={e => setInitials(e.target.value)} maxLength={3}
                  placeholder="EV"
                  className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-blue-400 uppercase" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-gray-500 block mb-1">Màu</label>
                <div className="flex gap-1.5">
                  {COLORS.map((c, i) => (
                    <button key={i} onClick={() => setColorIdx(i)}
                      className={`w-6 h-6 rounded-md border-2 transition-all ${i === colorIdx ? 'border-blue-500 scale-110' : 'border-transparent'}`}
                      style={{ background: c.bg }}>
                      <span className="text-[10px] font-bold" style={{ color: c.text }}>A</span>
                    </button>
                  ))}
                </div>
              </div>
              {error && <div className="text-[10px] text-red-600">{error}</div>}
              <button onClick={createCompany} disabled={saving || !name.trim() || !initials.trim()}
                className="w-full py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5">
                {saving && <Loader2 size={11} className="animate-spin" />}
                {saving ? 'Đang tạo...' : 'Tạo công ty'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

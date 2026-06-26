import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Megaphone } from 'lucide-react'
import api from '@/api/client'
import { useWorkspace } from '@/context/WorkspaceContext'

export default function LoginPage() {
  const navigate = useNavigate()
  const { refreshCompanies } = useWorkspace()
  const [email, setEmail] = useState('admin@dmmanager.local')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const r = await api.post('/auth/login', { email, password })
      localStorage.setItem('access_token', r.data.access_token)
      await refreshCompanies()
      navigate('/dashboard')
    } catch {
      setError('Email hoặc mật khẩu không đúng')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
            <Megaphone size={16} className="text-white" />
          </div>
          <span className="text-lg font-bold text-gray-900">DM Manager</span>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <h1 className="text-base font-semibold text-gray-900 mb-5">Đăng nhập</h1>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100" />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">Mật khẩu</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100" />
            </div>
            {error && <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-60 mt-1">
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
        <div className="text-center text-[11px] text-gray-400 mt-4">DM Manager v1.0 · TikTok Ads Management</div>
      </div>
    </div>
  )
}

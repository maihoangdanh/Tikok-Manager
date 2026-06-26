import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { Company, Period } from '@/types'
import api from '@/api/client'

interface Ctx {
  company: Company | null
  setCompany: (c: Company | null) => void
  period: Period
  setPeriod: (p: Period) => void
  companies: Company[]
  refreshCompanies: () => Promise<void>
}

const WorkspaceContext = createContext<Ctx | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null)
  const [period, setPeriod] = useState<Period>('7')
  const [companies, setCompanies] = useState<Company[]>([])

  async function refreshCompanies() {
    if (!localStorage.getItem('access_token')) return
    try {
      const r = await api.get('/companies/')
      setCompanies(r.data)
      if (!company && r.data.length > 0) setCompany(r.data[0])
    } catch {
      // skip
    }
  }

  useEffect(() => { refreshCompanies() }, [])

  return (
    <WorkspaceContext.Provider value={{ company, setCompany, period, setPeriod, companies, refreshCompanies }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace outside provider')
  return ctx
}

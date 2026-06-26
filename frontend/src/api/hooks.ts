import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from './client'

export function useCampaigns(companyId: string | null, period: string) {
  return useQuery({
    queryKey: ['campaigns', companyId, period],
    queryFn: async () => {
      if (!companyId) return []
      const r = await api.get('/campaigns/', { params: { company_id: companyId, period: Number(period) } })
      return r.data
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000,
  })
}

export function useGmvCampaigns(companyId: string | null, period: string) {
  return useQuery({
    queryKey: ['gmv', companyId, period],
    queryFn: async () => {
      if (!companyId) return []
      const r = await api.get('/gmv/campaigns', { params: { company_id: companyId, period: Number(period) } })
      return r.data
    },
    enabled: !!companyId,
    staleTime: 2 * 60 * 1000,
  })
}

export function useAlerts(companyId: string | null) {
  return useQuery({
    queryKey: ['alerts', companyId],
    queryFn: async () => {
      if (!companyId) return []
      const r = await api.get('/alerts/active', { params: { company_id: companyId } })
      return r.data
    },
    enabled: !!companyId,
    staleTime: 60 * 1000,
  })
}

export function useSyncCampaigns(companyId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      if (!companyId) return
      await api.post('/campaigns/sync', null, { params: { company_id: companyId } })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns', companyId] })
      qc.invalidateQueries({ queryKey: ['gmv', companyId] })
      qc.invalidateQueries({ queryKey: ['alerts', companyId] })
    },
  })
}

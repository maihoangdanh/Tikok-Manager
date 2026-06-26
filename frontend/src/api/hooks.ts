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

export function useCreatives(campaignId: string | null) {
  return useQuery({
    queryKey: ['creatives', campaignId],
    queryFn: async () => {
      if (!campaignId) return []
      const r = await api.get(`/creatives/${campaignId}`)
      return r.data
    },
    enabled: !!campaignId,
    staleTime: 2 * 60 * 1000,
  })
}

export function useSyncCampaigns(companyId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      if (!companyId) return
      // sync standard + reclassify GMV, then try GMV Shop API sync (optional)
      await api.post('/campaigns/sync', null, { params: { company_id: companyId } })
      try {
        await api.post('/campaigns/gmv/sync', null, { params: { company_id: companyId } })
      } catch {
        // GMV sync optional — fails gracefully if Shop credentials not set
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns', companyId] })
      qc.invalidateQueries({ queryKey: ['gmv', companyId] })
      qc.invalidateQueries({ queryKey: ['alerts', companyId] })
    },
  })
}

export function useUpdateCampaignStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, type, companyId }: { id: string; status: string; type: string; companyId: string }) => {
      const path = type === 'standard' ? `/campaigns/${id}/status` : `/gmv/campaigns/${id}/status`
      await api.patch(path, null, { params: { status } })
      return { id, status, companyId }
    },
    onSuccess: ({ companyId }) => {
      qc.invalidateQueries({ queryKey: ['campaigns', companyId] })
      qc.invalidateQueries({ queryKey: ['gmv', companyId] })
    },
  })
}

export function useUpdateCreativeStatus(campaignId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await api.patch(`/creatives/${id}/status`, null, { params: { status } })
      return { id, status }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['creatives', campaignId] })
    },
  })
}

export function useResolveAlert(companyId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (alertId: string) => {
      await api.patch(`/alerts/${alertId}/resolve`)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['alerts', companyId] })
    },
  })
}

export function useCreateCampaign(companyId: string | null) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (data: {
      name: string; type: string; objective?: string
      budget_daily: number; budget_type: string
      alert_config: { budget_warning_pct: number; min_roas?: number; min_roi?: number }
    }) => {
      const r = await api.post('/campaigns/', data, { params: { company_id: companyId } })
      return r.data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns', companyId] })
    },
  })
}

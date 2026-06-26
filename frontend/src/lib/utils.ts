import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

export function formatCurrency(value: number): string {
  if (value >= 1_000_000_000) return `₫${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `₫${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `₫${(value / 1_000).toFixed(0)}K`
  return `₫${Math.round(value).toLocaleString('vi-VN')}`
}

export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return Math.round(value).toLocaleString('vi-VN')
}

export function calcDelta(current: number, previous: number): number {
  if (previous === 0) return 0
  return ((current - previous) / previous) * 100
}

export function formatDelta(delta: number): string {
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`
}

export function isDeltaGood(delta: number, lowerIsBetter = false): boolean {
  return lowerIsBetter ? delta < 0 : delta > 0
}

export function budgetPct(spend: number, budget: number): number {
  return budget === 0 ? 0 : Math.min(Math.round((spend / budget) * 100), 100)
}

export function timeAgo(iso: string): string {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000)
  if (h < 1) return `${Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)} phút trước`
  if (h < 24) return `${h} giờ trước`
  return `${Math.floor(h / 24)} ngày trước`
}

# Digital Marketing Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng React frontend cho Digital Marketing Management Tool — TikTok only, multi-company, 2 loại campaign (Standard + GMV Max), chạy local với mock data trước.

**Architecture:** SPA với React Router, WorkspaceContext quản lý company đang chọn, mock data layer dễ swap sang API calls khi backend sẵn sàng. Campaign type quyết định metrics hiển thị và actions available.

**Tech Stack:** React 18 + Vite + TypeScript + TailwindCSS + React Router v6 + Recharts + Vitest

---

## File Structure

```
frontend/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── types/index.ts                    # TS types — Campaign, GMVCampaign, Ad, Creative...
│   ├── data/mock.ts                      # Mock data TikTok only
│   ├── lib/utils.ts                      # cn(), formatCurrency(), calcDelta()
│   ├── context/WorkspaceContext.tsx      # Company + period state
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Topbar.tsx
│   │   │   └── WorkspaceSwitcher.tsx
│   │   ├── ui/
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── DeltaBadge.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── Sparkline.tsx
│   │   └── dashboard/
│   │       ├── MetricCard.tsx
│   │       └── SpendChart.tsx
│   └── pages/
│       ├── Dashboard.tsx
│       ├── Campaigns.tsx
│       ├── CampaignDetail.tsx            # Standard campaign → ads list
│       ├── GmvDetail.tsx                 # GMV Max → creatives + LIVE metrics
│       ├── AlertsPage.tsx
│       ├── NewCampaign.tsx
│       └── Settings.tsx
├── src/test/
│   ├── setup.ts
│   └── lib/utils.test.ts
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

---

## Task 1: Project Setup

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/tsconfig.json`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/index.css`
- Create: `frontend/src/test/setup.ts`

- [ ] **Step 1: Tạo package.json**

```json
{
  "name": "dm-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "recharts": "^2.12.7",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.2",
    "lucide-react": "^0.441.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.45",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.5.3",
    "vite": "^5.4.2",
    "vitest": "^2.0.5",
    "@testing-library/react": "^16.0.1",
    "@testing-library/jest-dom": "^6.5.0",
    "jsdom": "^25.0.0"
  }
}
```

- [ ] **Step 2: Tạo vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

- [ ] **Step 3: Tạo tailwind.config.js**

```javascript
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

- [ ] **Step 4: Tạo postcss.config.js**

```javascript
export default { plugins: { tailwindcss: {}, autoprefixer: {} } }
```

- [ ] **Step 5: Tạo tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["src"]
}
```

- [ ] **Step 6: Tạo index.html**

```html
<!doctype html>
<html lang="vi">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DM Manager</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 7: Tạo src/main.tsx và src/index.css**

```typescript
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>)
```

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
* { box-sizing: border-box; }
body { font-family: system-ui, -apple-system, sans-serif; background: #f8f8f6; }
```

- [ ] **Step 8: Tạo test setup**

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 9: Cài và verify**

```bash
cd "D:\Quan Lieu\Digital\frontend"
npm install
npm run dev
```

Expected: `http://localhost:5173` lên được, không lỗi.

- [ ] **Step 10: Commit**

```bash
git add . && git commit -m "feat: project setup"
```

---

## Task 2: Types & Mock Data

**Files:**
- Create: `frontend/src/types/index.ts`
- Create: `frontend/src/data/mock.ts`
- Create: `frontend/src/lib/utils.ts`
- Create: `frontend/src/test/lib/utils.test.ts`

- [ ] **Step 1: Tạo types/index.ts**

```typescript
// src/types/index.ts
export type CampaignType = 'standard' | 'gmv_product' | 'gmv_live'
export type CampaignStatus = 'active' | 'paused' | 'draft'
export type CampaignObjective = 'conversions' | 'traffic' | 'awareness' | 'catalog_sales'
export type AdStatus = 'active' | 'paused'
export type AlertSeverity = 'critical' | 'warning'
export type Period = '1' | '7' | '30'

export interface Company {
  id: string
  name: string
  initials: string
  color: { bg: string; text: string }
  advertiserIds: { ads: string; shop: string }  // TikTok Ads ID + Shop ID
}

// Metrics cho Standard campaign
export interface StandardMetrics {
  spend: number
  roas: number
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  conversions: number
  cpa: number
}

// Metrics cho GMV Max campaign
export interface GmvMetrics {
  cost: number
  skuOrders: number
  costPerOrder: number
  grossRevenue: number
  roi: number
}

export interface Campaign {
  id: string
  companyId: string
  name: string
  type: CampaignType
  status: CampaignStatus
  objective?: CampaignObjective      // chỉ standard
  budgetDaily: number
  budgetSpend: number
  metrics: StandardMetrics | GmvMetrics
  prevMetrics: StandardMetrics | GmvMetrics
}

export interface Ad {
  id: string
  campaignId: string
  name: string
  format: 'video' | 'image' | 'carousel'
  status: AdStatus
  metrics: StandardMetrics
  prevMetrics: StandardMetrics
}

// Creative trong GMV Max campaign
export interface Creative {
  id: string
  campaignId: string
  name: string
  videoUrl?: string
  status: AdStatus
  metrics: GmvMetrics
  prevMetrics: GmvMetrics
}

// Live session trong GMV Live
export interface LiveSession {
  id: string
  campaignId: string
  startTime: string
  endTime?: string
  metrics: GmvMetrics
}

export interface Alert {
  id: string
  companyId: string
  campaignId: string
  campaignName: string
  severity: AlertSeverity
  message: string
  createdAt: string
  resolved: boolean
}

export interface SpendPoint { date: string; current: number; previous: number }

// Type guards
export function isStandardMetrics(m: StandardMetrics | GmvMetrics): m is StandardMetrics {
  return 'roas' in m
}
export function isGmvMetrics(m: StandardMetrics | GmvMetrics): m is GmvMetrics {
  return 'roi' in m
}
```

- [ ] **Step 2: Tạo data/mock.ts**

```typescript
// src/data/mock.ts
import type { Company, Campaign, Ad, Creative, LiveSession, Alert, SpendPoint, StandardMetrics, GmvMetrics } from '@/types'

export const COMPANIES: Company[] = [
  { id: 'evo', name: 'EVO Brand', initials: 'EV', color: { bg: '#E6F1FB', text: '#185FA5' }, advertiserIds: { ads: '7234567890', shop: 'shop_evo_001' } },
  { id: 'teeze', name: 'TEEZE Official', initials: 'TZ', color: { bg: '#EAF3DE', text: '#3B6D11' }, advertiserIds: { ads: '7234567891', shop: 'shop_teeze_001' } },
  { id: 'cbe', name: 'CBE Fashion', initials: 'CB', color: { bg: '#FAEEDA', text: '#854F0B' }, advertiserIds: { ads: '7234567892', shop: 'shop_cbe_001' } },
]

const stdMetrics = (s: StandardMetrics) => s
const gmvMetrics = (g: GmvMetrics) => g

export const CAMPAIGNS: Campaign[] = [
  // EVO — Standard campaigns
  {
    id: 'c1', companyId: 'evo', name: 'Flash Sale June', type: 'standard',
    status: 'active', objective: 'conversions', budgetDaily: 500000, budgetSpend: 485000,
    metrics: stdMetrics({ spend: 4800000, roas: 4.2, impressions: 142000, clicks: 3200, ctr: 2.3, cpc: 1050, conversions: 198, cpa: 24200 }),
    prevMetrics: stdMetrics({ spend: 3930000, roas: 3.6, impressions: 120000, clicks: 2936, ctr: 2.0, cpc: 1140, conversions: 151, cpa: 26000 }),
  },
  {
    id: 'c2', companyId: 'evo', name: 'Brand Video Q2', type: 'standard',
    status: 'active', objective: 'awareness', budgetDaily: 200000, budgetSpend: 166000,
    metrics: stdMetrics({ spend: 5200000, roas: 1.8, impressions: 168000, clicks: 2100, ctr: 1.3, cpc: 2380, conversions: 87, cpa: 59800 }),
    prevMetrics: stdMetrics({ spend: 5416000, roas: 2.3, impressions: 179000, clicks: 2283, ctr: 1.8, cpc: 2144, conversions: 99, cpa: 50700 }),
  },
  // EVO — GMV Product campaigns
  {
    id: 'c3', companyId: 'evo', name: 'Summer Collection GMV', type: 'gmv_product',
    status: 'active', budgetDaily: 800000, budgetSpend: 690000,
    metrics: gmvMetrics({ cost: 34480407, skuOrders: 941, costPerOrder: 36642, grossRevenue: 139977897, roi: 4.06 }),
    prevMetrics: gmvMetrics({ cost: 34264339, skuOrders: 1049, costPerOrder: 32664, grossRevenue: 150582803, roi: 4.39 }),
  },
  {
    id: 'c4', companyId: 'evo', name: 'New Arrivals Auto', type: 'gmv_product',
    status: 'paused', budgetDaily: 400000, budgetSpend: 240000,
    metrics: gmvMetrics({ cost: 0, skuOrders: 0, costPerOrder: 0, grossRevenue: 0, roi: 0 }),
    prevMetrics: gmvMetrics({ cost: 12000000, skuOrders: 320, costPerOrder: 37500, grossRevenue: 52800000, roi: 4.4 }),
  },
  // EVO — GMV Live
  {
    id: 'c5', companyId: 'evo', name: 'LIVE June 25', type: 'gmv_live',
    status: 'active', budgetDaily: 300000, budgetSpend: 180000,
    metrics: gmvMetrics({ cost: 8200000, skuOrders: 412, costPerOrder: 19903, grossRevenue: 61800000, roi: 7.54 }),
    prevMetrics: gmvMetrics({ cost: 7400000, skuOrders: 360, costPerOrder: 20556, grossRevenue: 52200000, roi: 7.05 }),
  },
  // TEEZE campaigns
  {
    id: 'c6', companyId: 'teeze', name: 'TEEZE Flash Sale', type: 'standard',
    status: 'active', objective: 'conversions', budgetDaily: 800000, budgetSpend: 620000,
    metrics: stdMetrics({ spend: 9800000, roas: 4.8, impressions: 210000, clicks: 5040, ctr: 2.4, cpc: 1944, conversions: 312, cpa: 31400 }),
    prevMetrics: stdMetrics({ spend: 8200000, roas: 4.1, impressions: 182000, clicks: 4368, ctr: 2.1, cpc: 1878, conversions: 254, cpa: 32300 }),
  },
  {
    id: 'c7', companyId: 'teeze', name: 'TEEZE GMV Product', type: 'gmv_product',
    status: 'active', budgetDaily: 600000, budgetSpend: 420000,
    metrics: gmvMetrics({ cost: 20100000, skuOrders: 680, costPerOrder: 29559, grossRevenue: 84420000, roi: 4.2 }),
    prevMetrics: gmvMetrics({ cost: 18500000, skuOrders: 590, costPerOrder: 31356, grossRevenue: 73750000, roi: 3.99 }),
  },
]

export const ADS: Ad[] = [
  {
    id: 'a1', campaignId: 'c1', name: 'Flash Sale Video 15s', format: 'video', status: 'active',
    metrics: { spend: 1850000, roas: 4.8, impressions: 62000, clicks: 1302, ctr: 2.1, cpc: 1050, conversions: 88, cpa: 21000 },
    prevMetrics: { spend: 1520000, roas: 4.1, impressions: 51000, clicks: 1071, ctr: 1.8, cpc: 1140, conversions: 66, cpa: 23000 },
  },
  {
    id: 'a2', campaignId: 'c1', name: 'Flash Sale Banner', format: 'image', status: 'active',
    metrics: { spend: 1400000, roas: 3.9, impressions: 48000, clicks: 1008, ctr: 1.8, cpc: 1280, conversions: 71, cpa: 26000 },
    prevMetrics: { spend: 1180000, roas: 3.5, impressions: 40000, clicks: 840, ctr: 1.6, cpc: 1404, conversions: 55, cpa: 28700 },
  },
  {
    id: 'a3', campaignId: 'c1', name: 'Testimonial 30s', format: 'video', status: 'paused',
    metrics: { spend: 950000, roas: 1.6, impressions: 32000, clicks: 890, ctr: 0.9, cpc: 1840, conversions: 39, cpa: 52100 },
    prevMetrics: { spend: 1230000, roas: 2.8, impressions: 29000, clicks: 1025, ctr: 1.7, cpc: 1596, conversions: 30, cpa: 41000 },
  },
]

export const CREATIVES: Creative[] = [
  {
    id: 'cr1', campaignId: 'c3', name: 'Váy hoa mùa hè', status: 'active',
    metrics: gmvMetrics({ cost: 8200000, skuOrders: 280, costPerOrder: 29286, grossRevenue: 42000000, roi: 5.12 }),
    prevMetrics: gmvMetrics({ cost: 7800000, skuOrders: 260, costPerOrder: 30000, grossRevenue: 38480000, roi: 4.93 }),
  },
  {
    id: 'cr2', campaignId: 'c3', name: 'Set đồ công sở', status: 'active',
    metrics: gmvMetrics({ cost: 9100000, skuOrders: 210, costPerOrder: 43333, grossRevenue: 31500000, roi: 3.46 }),
    prevMetrics: gmvMetrics({ cost: 8900000, skuOrders: 230, costPerOrder: 38696, grossRevenue: 36800000, roi: 4.13 }),
  },
  {
    id: 'cr3', campaignId: 'c3', name: 'Lookbook tháng 6', status: 'active',
    metrics: gmvMetrics({ cost: 11200000, skuOrders: 340, costPerOrder: 32941, grossRevenue: 64680000, roi: 5.78 }),
    prevMetrics: gmvMetrics({ cost: 10400000, skuOrders: 310, costPerOrder: 33548, grossRevenue: 57660000, roi: 5.54 }),
  },
  {
    id: 'cr4', campaignId: 'c3', name: 'Flash sale 50%', status: 'paused',
    metrics: gmvMetrics({ cost: 5980407, skuOrders: 111, costPerOrder: 53878, grossRevenue: 11841307, roi: 1.98 }),
    prevMetrics: gmvMetrics({ cost: 7164339, skuOrders: 249, costPerOrder: 28771, grossRevenue: 57641803, roi: 8.05 }),
  },
]

export const LIVE_SESSIONS: LiveSession[] = [
  {
    id: 'ls1', campaignId: 'c5', startTime: '2026-06-25T19:00:00', endTime: '2026-06-25T22:00:00',
    metrics: gmvMetrics({ cost: 4100000, skuOrders: 210, costPerOrder: 19524, grossRevenue: 30870000, roi: 7.53 }),
  },
  {
    id: 'ls2', campaignId: 'c5', startTime: '2026-06-25T13:00:00', endTime: '2026-06-25T15:00:00',
    metrics: gmvMetrics({ cost: 2600000, skuOrders: 112, costPerOrder: 23214, grossRevenue: 19656000, roi: 7.56 }),
  },
  {
    id: 'ls3', campaignId: 'c5', startTime: '2026-06-25T09:00:00', endTime: '2026-06-25T11:00:00',
    metrics: gmvMetrics({ cost: 1500000, skuOrders: 90, costPerOrder: 16667, grossRevenue: 11274000, roi: 7.52 }),
  },
]

export const ALERTS: Alert[] = [
  { id: 'al1', companyId: 'evo', campaignId: 'c1', campaignName: 'Flash Sale June', severity: 'critical', message: 'Budget 97% — sắp hết ngân sách hôm nay (₫485K/₫500K)', createdAt: '2026-06-26T12:00:00', resolved: false },
  { id: 'al2', companyId: 'evo', campaignId: 'c2', campaignName: 'Brand Video Q2', severity: 'warning', message: 'ROAS 1.8x thấp hơn mục tiêu 2.0x', createdAt: '2026-06-26T11:00:00', resolved: false },
  { id: 'al3', companyId: 'evo', campaignId: 'c3', campaignName: 'Summer Collection GMV', severity: 'warning', message: 'ROI giảm -7.52% so với cùng kỳ (4.06 vs 4.39)', createdAt: '2026-06-26T10:00:00', resolved: false },
  { id: 'al4', companyId: 'evo', campaignId: 'c1', campaignName: 'Flash Sale June', severity: 'warning', message: 'CTR 0.9% thấp hơn mục tiêu 1%', createdAt: '2026-06-26T08:30:00', resolved: true },
]

export const SPEND_DATA: SpendPoint[] = [
  { date: '20/6', current: 1580000, previous: 1420000 },
  { date: '21/6', current: 1720000, previous: 1380000 },
  { date: '22/6', current: 1650000, previous: 1510000 },
  { date: '23/6', current: 1890000, previous: 1600000 },
  { date: '24/6', current: 2100000, previous: 1750000 },
  { date: '25/6', current: 1980000, previous: 1820000 },
  { date: '26/6', current: 1480000, previous: 1900000 },
]

// Helpers
export const getCampaigns = (companyId: string) => CAMPAIGNS.filter(c => c.companyId === companyId)
export const getAds = (campaignId: string) => ADS.filter(a => a.campaignId === campaignId)
export const getCreatives = (campaignId: string) => CREATIVES.filter(c => c.campaignId === campaignId)
export const getLiveSessions = (campaignId: string) => LIVE_SESSIONS.filter(s => s.campaignId === campaignId)
export const getAlerts = (companyId: string) => ALERTS.filter(a => a.companyId === companyId)
```

- [ ] **Step 3: Tạo lib/utils.ts**

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

export function formatCurrency(value: number): string {
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
  return budget === 0 ? 0 : Math.round((spend / budget) * 100)
}
```

- [ ] **Step 4: Viết tests**

```typescript
// src/test/lib/utils.test.ts
import { describe, it, expect } from 'vitest'
import { formatCurrency, calcDelta, formatDelta, isDeltaGood, budgetPct } from '@/lib/utils'

describe('formatCurrency', () => {
  it('millions', () => expect(formatCurrency(34480407)).toBe('₫34.5M'))
  it('thousands', () => expect(formatCurrency(485000)).toBe('₫485K'))
  it('small', () => expect(formatCurrency(500)).toBe('₫500'))
})

describe('calcDelta', () => {
  it('positive', () => expect(calcDelta(120, 100)).toBe(20))
  it('negative', () => expect(calcDelta(80, 100)).toBe(-20))
  it('zero previous', () => expect(calcDelta(100, 0)).toBe(0))
})

describe('isDeltaGood', () => {
  it('positive delta is good', () => expect(isDeltaGood(10)).toBe(true))
  it('negative delta good when lowerIsBetter', () => expect(isDeltaGood(-7, true)).toBe(true))
})

describe('budgetPct', () => {
  it('calculates', () => expect(budgetPct(485000, 500000)).toBe(97))
  it('zero budget', () => expect(budgetPct(100, 0)).toBe(0))
})
```

- [ ] **Step 5: Chạy tests**

```bash
npm run test
```

Expected: 8 tests pass.

- [ ] **Step 6: Commit**

```bash
git add . && git commit -m "feat: types, mock data (TikTok only), utils"
```

---

## Task 3: WorkspaceContext + Router + Layout

**Files:**
- Create: `frontend/src/context/WorkspaceContext.tsx`
- Create: `frontend/src/App.tsx`
- Create: `frontend/src/components/layout/AppShell.tsx`
- Create: `frontend/src/components/layout/WorkspaceSwitcher.tsx`
- Create: `frontend/src/components/layout/Sidebar.tsx`
- Create: `frontend/src/components/layout/Topbar.tsx`

- [ ] **Step 1: Tạo WorkspaceContext**

```typescript
// src/context/WorkspaceContext.tsx
import { createContext, useContext, useState, type ReactNode } from 'react'
import { COMPANIES } from '@/data/mock'
import type { Company, Period } from '@/types'

interface Ctx {
  company: Company | null
  setCompany: (c: Company | null) => void
  period: Period
  setPeriod: (p: Period) => void
  companies: Company[]
}

const WorkspaceContext = createContext<Ctx | null>(null)

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [company, setCompany] = useState<Company | null>(COMPANIES[0])
  const [period, setPeriod] = useState<Period>('7')
  return (
    <WorkspaceContext.Provider value={{ company, setCompany, period, setPeriod, companies: COMPANIES }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext)
  if (!ctx) throw new Error('useWorkspace outside provider')
  return ctx
}
```

- [ ] **Step 2: Tạo App.tsx**

```typescript
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { WorkspaceProvider } from '@/context/WorkspaceContext'
import AppShell from '@/components/layout/AppShell'
import Dashboard from '@/pages/Dashboard'
import Campaigns from '@/pages/Campaigns'
import CampaignDetail from '@/pages/CampaignDetail'
import GmvDetail from '@/pages/GmvDetail'
import AlertsPage from '@/pages/AlertsPage'
import NewCampaign from '@/pages/NewCampaign'
import Settings from '@/pages/Settings'

export default function App() {
  return (
    <WorkspaceProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="campaigns" element={<Campaigns />} />
            <Route path="campaigns/new" element={<NewCampaign />} />
            <Route path="campaigns/:id/ads" element={<CampaignDetail />} />
            <Route path="campaigns/:id/gmv" element={<GmvDetail />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </WorkspaceProvider>
  )
}
```

- [ ] **Step 3: Tạo stub pages**

```typescript
// Tạo 6 file sau, mỗi file 1 dòng:
// src/pages/Dashboard.tsx
export default function Dashboard() { return <div className="p-4">Dashboard</div> }
// src/pages/Campaigns.tsx
export default function Campaigns() { return <div className="p-4">Campaigns</div> }
// src/pages/CampaignDetail.tsx
export default function CampaignDetail() { return <div className="p-4">Campaign Detail</div> }
// src/pages/GmvDetail.tsx
export default function GmvDetail() { return <div className="p-4">GMV Detail</div> }
// src/pages/AlertsPage.tsx
export default function AlertsPage() { return <div className="p-4">Alerts</div> }
// src/pages/NewCampaign.tsx
export default function NewCampaign() { return <div className="p-4">New Campaign</div> }
// src/pages/Settings.tsx
export default function Settings() { return <div className="p-4">Settings</div> }
```

- [ ] **Step 4: Tạo WorkspaceSwitcher**

```typescript
// src/components/layout/WorkspaceSwitcher.tsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, Check, Plus, LayoutGrid } from 'lucide-react'
import { useWorkspace } from '@/context/WorkspaceContext'
import type { Company } from '@/types'

export default function WorkspaceSwitcher() {
  const { company, setCompany, companies } = useWorkspace()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  function select(c: Company | null) { setCompany(c); setOpen(false); navigate('/dashboard') }

  return (
    <div ref={ref} className="relative px-3 py-2 border-b border-gray-100">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-2 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-left">
        <span className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-medium flex-shrink-0"
          style={company ? { background: company.color.bg, color: company.color.text } : { background: '#D3D1C7', color: '#5F5E5A' }}>
          {company ? company.initials : '★'}
        </span>
        <span className="flex-1 text-sm font-medium truncate">{company?.name ?? 'Tất cả'}</span>
        <ChevronDown size={13} className="text-gray-400 flex-shrink-0" />
      </button>

      {open && (
        <div className="absolute top-full left-3 right-3 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-1.5 text-[10px] text-gray-400 uppercase tracking-wider">Công ty</div>
          {companies.map(c => (
            <button key={c.id} onClick={() => select(c)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left">
              <span className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-medium"
                style={{ background: c.color.bg, color: c.color.text }}>{c.initials}</span>
              <div className="flex-1">
                <div className="text-xs font-medium">{c.name}</div>
              </div>
              {company?.id === c.id && <Check size={13} className="text-blue-600" />}
            </button>
          ))}
          <div className="border-t border-gray-100 my-1" />
          <button onClick={() => select(null)} className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50">
            <LayoutGrid size={14} className="text-gray-400" />
            <span className="text-xs font-medium">Xem tất cả</span>
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-gray-500">
            <Plus size={13} /><span className="text-xs">Thêm công ty</span>
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Tạo Sidebar**

```typescript
// src/components/layout/Sidebar.tsx
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Megaphone, Bell, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import WorkspaceSwitcher from './WorkspaceSwitcher'
import { useWorkspace } from '@/context/WorkspaceContext'
import { getAlerts } from '@/data/mock'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/campaigns', icon: Megaphone, label: 'Campaigns' },
  { to: '/alerts', icon: Bell, label: 'Alerts' },
  { to: '/settings', icon: Settings, label: 'Cài đặt' },
]

export default function Sidebar() {
  const { company } = useWorkspace()
  const alertCount = company ? getAlerts(company.id).filter(a => !a.resolved).length : 0

  return (
    <aside className="w-48 flex-shrink-0 border-r border-gray-100 bg-white flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <Megaphone size={16} className="text-blue-600" />
        <span className="text-sm font-semibold">DM Manager</span>
      </div>
      <WorkspaceSwitcher />
      <nav className="flex-1 py-2">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => cn(
            'flex items-center gap-2.5 px-4 py-2 text-sm border-l-2 transition-colors',
            isActive ? 'bg-gray-50 text-gray-900 font-medium border-blue-600' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 border-transparent'
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
        <div className="px-4 py-3 border-t border-gray-100 text-[10px] text-gray-400">
          <div className="uppercase tracking-wider mb-1">TikTok Ads</div>
          <div className="font-mono">{company.advertiserIds.ads}</div>
        </div>
      )}
    </aside>
  )
}
```

- [ ] **Step 6: Tạo Topbar**

```typescript
// src/components/layout/Topbar.tsx
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useWorkspace } from '@/context/WorkspaceContext'
import type { Period } from '@/types'

interface Props { title: string; showPeriod?: boolean; showCreate?: boolean; breadcrumb?: { label: string; to: string } }

export default function Topbar({ title, showPeriod, showCreate, breadcrumb }: Props) {
  const { company, period, setPeriod } = useWorkspace()
  const navigate = useNavigate()
  const PERIODS: { value: Period; label: string }[] = [
    { value: '1', label: 'Hôm nay' },
    { value: '7', label: '7 ngày' },
    { value: '30', label: '30 ngày' },
  ]

  return (
    <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 flex-shrink-0">
      <div className="flex items-center gap-1.5 text-sm">
        {company && <><span className="w-5 h-5 rounded text-[10px] font-medium flex items-center justify-center"
          style={{ background: company.color.bg, color: company.color.text }}>{company.initials}</span>
          <span className="text-gray-300">/</span></>}
        {breadcrumb && <><button onClick={() => navigate(breadcrumb.to)}
          className="text-gray-400 hover:text-gray-700">{breadcrumb.label}</button>
          <span className="text-gray-300">/</span></>}
        <span className="font-medium text-gray-800">{title}</span>
      </div>
      <div className="flex gap-2 items-center">
        {showPeriod && (
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            {PERIODS.map(p => (
              <button key={p.value} onClick={() => setPeriod(p.value)}
                className={`px-3 py-1.5 text-xs transition-colors ${period === p.value ? 'bg-gray-100 font-medium text-gray-900' : 'text-gray-500 hover:bg-gray-50'}`}>
                {p.label}
              </button>
            ))}
          </div>
        )}
        {showCreate && (
          <button onClick={() => navigate('/campaigns/new')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">
            <Plus size={13} /> Tạo campaign
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Tạo AppShell**

```typescript
// src/components/layout/AppShell.tsx
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AppShell() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden"><Outlet /></main>
    </div>
  )
}
```

- [ ] **Step 8: Verify**

```bash
npm run dev
```

Mở `http://localhost:5173` — sidebar hiện, workspace switcher click được, navigate không lỗi.

- [ ] **Step 9: Commit**

```bash
git add . && git commit -m "feat: layout, sidebar, workspace switcher, router"
```

---

## Task 4: UI Components

**Files:**
- Create: `frontend/src/components/ui/StatusBadge.tsx`
- Create: `frontend/src/components/ui/DeltaBadge.tsx`
- Create: `frontend/src/components/ui/ProgressBar.tsx`
- Create: `frontend/src/components/ui/Sparkline.tsx`
- Create: `frontend/src/components/ui/CampaignTypeBadge.tsx`

- [ ] **Step 1: StatusBadge**

```typescript
// src/components/ui/StatusBadge.tsx
import type { CampaignStatus } from '@/types'
const CFG: Record<CampaignStatus, { label: string; cls: string }> = {
  active:  { label: 'Active',  cls: 'bg-green-50 text-green-800' },
  paused:  { label: 'Paused',  cls: 'bg-amber-50 text-amber-800' },
  draft:   { label: 'Draft',   cls: 'bg-gray-100 text-gray-600'  },
}
export default function StatusBadge({ status }: { status: CampaignStatus }) {
  const { label, cls } = CFG[status]
  return <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${cls}`}>
    <span className={`w-1.5 h-1.5 rounded-full ${status === 'active' ? 'bg-green-500' : status === 'paused' ? 'bg-amber-500' : 'bg-gray-400'}`} />
    {label}
  </span>
}
```

- [ ] **Step 2: CampaignTypeBadge**

```typescript
// src/components/ui/CampaignTypeBadge.tsx
import type { CampaignType } from '@/types'
const CFG: Record<CampaignType, { label: string; cls: string }> = {
  standard:    { label: 'Standard',     cls: 'bg-blue-50 text-blue-700' },
  gmv_product: { label: 'GMV Product',  cls: 'bg-purple-50 text-purple-700' },
  gmv_live:    { label: 'GMV Live',     cls: 'bg-pink-50 text-pink-700' },
}
export default function CampaignTypeBadge({ type }: { type: CampaignType }) {
  const { label, cls } = CFG[type]
  return <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${cls}`}>{label}</span>
}
```

- [ ] **Step 3: DeltaBadge**

```typescript
// src/components/ui/DeltaBadge.tsx
import { TrendingUp, TrendingDown } from 'lucide-react'
import { calcDelta, formatDelta, isDeltaGood } from '@/lib/utils'
interface Props { current: number; previous: number; lowerIsBetter?: boolean }
export default function DeltaBadge({ current, previous, lowerIsBetter = false }: Props) {
  if (previous === 0) return null
  const delta = calcDelta(current, previous)
  const good = isDeltaGood(delta, lowerIsBetter)
  const Icon = delta >= 0 ? TrendingUp : TrendingDown
  return (
    <span className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${good ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
      <Icon size={10} />{formatDelta(delta)}
    </span>
  )
}
```

- [ ] **Step 4: ProgressBar**

```typescript
// src/components/ui/ProgressBar.tsx
import { budgetPct } from '@/lib/utils'
export default function ProgressBar({ spend, budget }: { spend: number; budget: number }) {
  const pct = budgetPct(spend, budget)
  const color = pct >= 95 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-blue-500'
  const textColor = pct >= 95 ? 'text-red-700' : pct >= 80 ? 'text-amber-700' : 'text-gray-500'
  return (
    <div>
      <div className={`text-[11px] font-medium mb-0.5 ${textColor}`}>{pct}%</div>
      <div className="h-1 w-16 rounded-full bg-gray-100 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Sparkline**

```typescript
// src/components/ui/Sparkline.tsx
export default function Sparkline({ data, color = '#378ADD', width = 80, height = 28 }: { data: number[]; color?: string; width?: number; height?: number }) {
  if (data.length < 2) return null
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1, pad = 2
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - pad - ((v - min) / range) * (height - pad * 2)}`).join(' ')
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <polygon points={`${pts} ${width},${height} 0,${height}`} fill={color} fillOpacity={0.1} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.5} />
    </svg>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add . && git commit -m "feat: UI components"
```

---

## Task 5: Dashboard Page

**Files:**
- Create: `frontend/src/components/dashboard/MetricCard.tsx`
- Create: `frontend/src/components/dashboard/SpendChart.tsx`
- Modify: `frontend/src/pages/Dashboard.tsx`

- [ ] **Step 1: MetricCard**

```typescript
// src/components/dashboard/MetricCard.tsx
import DeltaBadge from '@/components/ui/DeltaBadge'
import Sparkline from '@/components/ui/Sparkline'
interface Props { label: string; value: string; current: number; previous: number; prevLabel: string; sparkData: number[]; lowerIsBetter?: boolean }
export default function MetricCard({ label, value, current, previous, prevLabel, sparkData, lowerIsBetter }: Props) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-3.5">
      <div className="flex justify-between items-start mb-2">
        <span className="text-[11px] text-gray-500">{label}</span>
        <DeltaBadge current={current} previous={previous} lowerIsBetter={lowerIsBetter} />
      </div>
      <div className="text-xl font-medium text-gray-900 leading-none mb-1">{value}</div>
      <div className="text-[11px] text-gray-400 mb-2">Cùng kỳ: {prevLabel}</div>
      <Sparkline data={sparkData} />
    </div>
  )
}
```

- [ ] **Step 2: SpendChart**

```typescript
// src/components/dashboard/SpendChart.tsx
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { SPEND_DATA } from '@/data/mock'
import { formatCurrency } from '@/lib/utils'
export default function SpendChart() {
  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 text-sm font-medium">Chi tiêu theo ngày</div>
      <div className="px-4 py-3">
        <ResponsiveContainer width="100%" height={150}>
          <LineChart data={SPEND_DATA} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#999' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: number) => [formatCurrency(v)]} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Legend iconType="plainline" iconSize={16} wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="current" name="Kỳ này" stroke="#378ADD" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="previous" name="Cùng kỳ" stroke="#B4B2A9" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Dashboard.tsx**

```typescript
// src/pages/Dashboard.tsx
import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import MetricCard from '@/components/dashboard/MetricCard'
import SpendChart from '@/components/dashboard/SpendChart'
import StatusBadge from '@/components/ui/StatusBadge'
import CampaignTypeBadge from '@/components/ui/CampaignTypeBadge'
import DeltaBadge from '@/components/ui/DeltaBadge'
import ProgressBar from '@/components/ui/ProgressBar'
import { useWorkspace } from '@/context/WorkspaceContext'
import { getCampaigns, getAlerts } from '@/data/mock'
import { formatCurrency, formatNumber, calcDelta } from '@/lib/utils'
import { isStandardMetrics, isGmvMetrics } from '@/types'

const SPARK = {
  spend:  [5.8,6.2,5.9,7.1,8.4,9.2,8.8,12.4],
  roas:   [3.2,3.1,3.4,3.3,3.7,3.9,3.6,3.8],
  roi:    [4.1,4.2,3.9,4.0,4.3,4.5,4.2,4.1],
  orders: [280,310,295,340,380,420,390,420],
}

export default function Dashboard() {
  const { company } = useWorkspace()
  const navigate = useNavigate()
  const campaigns = company ? getCampaigns(company.id) : []
  const alerts = company ? getAlerts(company.id).filter(a => !a.resolved) : []
  const criticals = alerts.filter(a => a.severity === 'critical')

  const stdCamps = campaigns.filter(c => c.type === 'standard')
  const gmvCamps = campaigns.filter(c => c.type === 'gmv_product' || c.type === 'gmv_live')

  // Standard aggregates
  const stdSpend = stdCamps.reduce((s,c) => s + (isStandardMetrics(c.metrics) ? c.metrics.spend : 0), 0)
  const stdPrevSpend = stdCamps.reduce((s,c) => s + (isStandardMetrics(c.prevMetrics) ? c.prevMetrics.spend : 0), 0)
  const avgRoas = stdCamps.filter(c => isStandardMetrics(c.metrics) && c.metrics.roas > 0).reduce((s,c) => s + (isStandardMetrics(c.metrics) ? c.metrics.roas : 0), 0) / (stdCamps.filter(c => isStandardMetrics(c.metrics) && c.metrics.roas > 0).length || 1)
  const prevAvgRoas = stdCamps.reduce((s,c) => s + (isStandardMetrics(c.prevMetrics) ? c.prevMetrics.roas : 0), 0) / (stdCamps.length || 1)

  // GMV aggregates
  const gmvCost = gmvCamps.reduce((s,c) => s + (isGmvMetrics(c.metrics) ? c.metrics.cost : 0), 0)
  const gmvPrevCost = gmvCamps.reduce((s,c) => s + (isGmvMetrics(c.prevMetrics) ? c.prevMetrics.cost : 0), 0)
  const gmvOrders = gmvCamps.reduce((s,c) => s + (isGmvMetrics(c.metrics) ? c.metrics.skuOrders : 0), 0)
  const gmvPrevOrders = gmvCamps.reduce((s,c) => s + (isGmvMetrics(c.prevMetrics) ? c.prevMetrics.skuOrders : 0), 0)
  const gmvRevenue = gmvCamps.reduce((s,c) => s + (isGmvMetrics(c.metrics) ? c.metrics.grossRevenue : 0), 0)
  const gmvPrevRevenue = gmvCamps.reduce((s,c) => s + (isGmvMetrics(c.prevMetrics) ? c.prevMetrics.grossRevenue : 0), 0)
  const avgRoi = gmvCamps.filter(c=>isGmvMetrics(c.metrics)&&c.metrics.roi>0).reduce((s,c)=>s+(isGmvMetrics(c.metrics)?c.metrics.roi:0),0) / (gmvCamps.filter(c=>isGmvMetrics(c.metrics)&&c.metrics.roi>0).length||1)
  const prevAvgRoi = gmvCamps.reduce((s,c)=>s+(isGmvMetrics(c.prevMetrics)?c.prevMetrics.roi:0),0)/(gmvCamps.length||1)

  function detailRoute(c: typeof campaigns[0]) {
    return c.type === 'standard' ? `/campaigns/${c.id}/ads` : `/campaigns/${c.id}/gmv`
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Dashboard" showPeriod showCreate />
      <div className="flex-1 overflow-y-auto p-4">

        {criticals.length > 0 && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 mb-4 text-sm text-red-800">
            <AlertTriangle size={15} className="flex-shrink-0" />
            <span>{criticals[0].message}</span>
            <button onClick={() => navigate('/alerts')} className="ml-auto text-xs border border-red-300 rounded-md px-2 py-1 hover:bg-red-100">
              Xem alerts
            </button>
          </div>
        )}

        {/* Standard metrics */}
        {stdCamps.length > 0 && (
          <>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Standard Campaigns</div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              <MetricCard label="Chi tiêu" value={formatCurrency(stdSpend)} current={stdSpend} previous={stdPrevSpend} prevLabel={formatCurrency(stdPrevSpend)} sparkData={SPARK.spend} />
              <MetricCard label="ROAS TB" value={`${avgRoas.toFixed(1)}x`} current={avgRoas} previous={prevAvgRoas} prevLabel={`${prevAvgRoas.toFixed(1)}x`} sparkData={SPARK.roas} />
              <MetricCard label="Campaigns" value={String(stdCamps.filter(c=>c.status==='active').length)} current={stdCamps.filter(c=>c.status==='active').length} previous={stdCamps.length} prevLabel={`${stdCamps.length} total`} sparkData={[3,3,4,4,3,3,3,3]} />
              <MetricCard label="Alerts" value={String(alerts.length)} current={alerts.length} previous={0} prevLabel="0" sparkData={[0,1,1,2,1,2,2,3]} lowerIsBetter />
            </div>
          </>
        )}

        {/* GMV metrics */}
        {gmvCamps.length > 0 && (
          <>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">GMV Max</div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              <MetricCard label="Cost" value={formatCurrency(gmvCost)} current={gmvCost} previous={gmvPrevCost} prevLabel={formatCurrency(gmvPrevCost)} sparkData={SPARK.spend} />
              <MetricCard label="ROI TB" value={`${avgRoi.toFixed(2)}x`} current={avgRoi} previous={prevAvgRoi} prevLabel={`${prevAvgRoi.toFixed(2)}x`} sparkData={SPARK.roi} />
              <MetricCard label="SKU Orders" value={formatNumber(gmvOrders)} current={gmvOrders} previous={gmvPrevOrders} prevLabel={formatNumber(gmvPrevOrders)} sparkData={SPARK.orders} />
              <MetricCard label="Gross Revenue" value={formatCurrency(gmvRevenue)} current={gmvRevenue} previous={gmvPrevRevenue} prevLabel={formatCurrency(gmvPrevRevenue)} sparkData={SPARK.spend} />
            </div>
          </>
        )}

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="col-span-2"><SpendChart /></div>
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-sm font-medium flex justify-between">
              Cảnh báo
              <button onClick={() => navigate('/alerts')} className="text-xs text-blue-600">Tất cả</button>
            </div>
            {alerts.slice(0,3).map(a => (
              <div key={a.id} className="flex items-start gap-2 px-4 py-3 border-b border-gray-50 last:border-0">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${a.severity === 'critical' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                  <AlertTriangle size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{a.campaignName}</div>
                  <div className="text-[11px] text-gray-500 leading-tight">{a.message}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
            <span className="text-sm font-medium">Campaigns</span>
            <button onClick={() => navigate('/campaigns')} className="text-xs text-blue-600">Xem tất cả</button>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-100">
                {['Tên','Loại','Trạng thái','Metrics chính','So kỳ trước','Budget',''].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-[10px] font-medium text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.map(c => {
                const isStd = isStandardMetrics(c.metrics)
                const isGmv = isGmvMetrics(c.metrics)
                return (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer last:border-0"
                    onClick={() => navigate(detailRoute(c))}>
                    <td className="px-3 py-2.5 font-medium text-gray-800">{c.name}</td>
                    <td className="px-3 py-2.5"><CampaignTypeBadge type={c.type} /></td>
                    <td className="px-3 py-2.5"><StatusBadge status={c.status} /></td>
                    <td className="px-3 py-2.5">
                      {isStd && c.metrics.roas > 0 && <span className={c.metrics.roas >= 2 ? 'text-green-700 font-medium' : 'text-amber-700 font-medium'}>ROAS {c.metrics.roas.toFixed(1)}x</span>}
                      {isGmv && c.metrics.roi > 0 && <span className={c.metrics.roi >= 3 ? 'text-green-700 font-medium' : 'text-amber-700 font-medium'}>ROI {c.metrics.roi.toFixed(2)}x</span>}
                      {isStd && <div className="text-gray-400">{c.status !== 'paused' ? formatCurrency(c.metrics.spend) : '—'}</div>}
                      {isGmv && <div className="text-gray-400">{c.metrics.skuOrders > 0 ? `${c.metrics.skuOrders} orders` : '—'}</div>}
                    </td>
                    <td className="px-3 py-2.5">
                      {isStd && c.metrics.spend > 0 && <DeltaBadge current={c.metrics.spend} previous={c.prevMetrics.spend} />}
                      {isGmv && c.metrics.roi > 0 && <DeltaBadge current={c.metrics.roi} previous={c.prevMetrics.roi} />}
                    </td>
                    <td className="px-3 py-2.5"><ProgressBar spend={c.budgetSpend} budget={c.budgetDaily} /></td>
                    <td className="px-3 py-2.5">
                      <button onClick={e => { e.stopPropagation() }}
                        className={`text-[11px] px-2 py-1 rounded border ${c.status === 'active' ? 'border-gray-200 hover:bg-gray-50' : 'bg-blue-600 text-white border-blue-600'}`}>
                        {c.status === 'active' ? 'Pause' : 'Enable'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify**

Mở `http://localhost:5173/dashboard` — thấy 2 section metrics riêng (Standard + GMV), bảng campaign có CampaignTypeBadge.

- [ ] **Step 5: Commit**

```bash
git add . && git commit -m "feat: Dashboard với Standard và GMV Max metrics tách biệt"
```

---

## Task 6: Campaigns Page + Campaign Detail (Standard)

**Files:**
- Modify: `frontend/src/pages/Campaigns.tsx`
- Modify: `frontend/src/pages/CampaignDetail.tsx`

- [ ] **Step 1: Campaigns.tsx**

```typescript
// src/pages/Campaigns.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Topbar from '@/components/layout/Topbar'
import StatusBadge from '@/components/ui/StatusBadge'
import CampaignTypeBadge from '@/components/ui/CampaignTypeBadge'
import DeltaBadge from '@/components/ui/DeltaBadge'
import ProgressBar from '@/components/ui/ProgressBar'
import { useWorkspace } from '@/context/WorkspaceContext'
import { getCampaigns, CAMPAIGNS } from '@/data/mock'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { isStandardMetrics, isGmvMetrics, type CampaignType, type CampaignStatus } from '@/types'

export default function Campaigns() {
  const { company } = useWorkspace()
  const navigate = useNavigate()
  const [typeFilter, setTypeFilter] = useState<CampaignType | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all')

  const all = company ? getCampaigns(company.id) : CAMPAIGNS
  const filtered = all.filter(c =>
    (typeFilter === 'all' || c.type === typeFilter) &&
    (statusFilter === 'all' || c.status === statusFilter)
  )

  function detailRoute(c: typeof filtered[0]) {
    return c.type === 'standard' ? `/campaigns/${c.id}/ads` : `/campaigns/${c.id}/gmv`
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Campaigns" showCreate />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="flex gap-2 px-4 py-3 border-b border-gray-100">
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as CampaignType | 'all')}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
              <option value="all">Tất cả loại</option>
              <option value="standard">Standard</option>
              <option value="gmv_product">GMV Product</option>
              <option value="gmv_live">GMV Live</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as CampaignStatus | 'all')}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white">
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ minWidth: 900 }}>
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="w-8 px-3 py-2"><input type="checkbox" className="w-3.5 h-3.5" /></th>
                  {['Tên','Loại','Status','Metrics chính','vs Cùng kỳ','Budget',''].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => {
                  const isStd = isStandardMetrics(c.metrics)
                  const isGmv = isGmvMetrics(c.metrics)
                  return (
                    <tr key={c.id} onClick={() => navigate(detailRoute(c))}
                      className="border-b border-gray-50 hover:bg-gray-50 last:border-0 cursor-pointer">
                      <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                        <input type="checkbox" className="w-3.5 h-3.5" />
                      </td>
                      <td className="px-3 py-2.5 font-medium text-gray-800">{c.name}</td>
                      <td className="px-3 py-2.5"><CampaignTypeBadge type={c.type} /></td>
                      <td className="px-3 py-2.5"><StatusBadge status={c.status} /></td>
                      <td className="px-3 py-2.5">
                        {isStd && (
                          <div>
                            <div className={`font-medium ${c.metrics.roas >= 2 ? 'text-green-700' : 'text-amber-700'}`}>
                              {c.metrics.roas > 0 ? `ROAS ${c.metrics.roas.toFixed(1)}x` : '—'}
                            </div>
                            <div className="text-gray-400">{c.metrics.spend > 0 ? formatCurrency(c.metrics.spend) : '—'}</div>
                          </div>
                        )}
                        {isGmv && (
                          <div>
                            <div className={`font-medium ${c.metrics.roi >= 3 ? 'text-green-700' : 'text-amber-700'}`}>
                              {c.metrics.roi > 0 ? `ROI ${c.metrics.roi.toFixed(2)}x` : '—'}
                            </div>
                            <div className="text-gray-400">{c.metrics.skuOrders > 0 ? `${c.metrics.skuOrders} orders` : '—'}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        {isStd && c.metrics.spend > 0 && <DeltaBadge current={c.metrics.spend} previous={c.prevMetrics.spend} />}
                        {isGmv && c.metrics.roi > 0 && <DeltaBadge current={c.metrics.roi} previous={c.prevMetrics.roi} />}
                      </td>
                      <td className="px-3 py-2.5"><ProgressBar spend={c.budgetSpend} budget={c.budgetDaily} /></td>
                      <td className="px-3 py-2.5" onClick={e => e.stopPropagation()}>
                        <button className={`text-[11px] px-2 py-1 rounded border whitespace-nowrap
                          ${c.status === 'active' ? 'border-gray-200 hover:bg-gray-50' : 'bg-blue-600 text-white border-blue-600'}`}>
                          {c.status === 'active' ? 'Pause' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: CampaignDetail.tsx (Standard — ads list)**

```typescript
// src/pages/CampaignDetail.tsx
import { useParams, useNavigate } from 'react-router-dom'
import { Plus, Video, Image } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import StatusBadge from '@/components/ui/StatusBadge'
import DeltaBadge from '@/components/ui/DeltaBadge'
import { CAMPAIGNS, getAds } from '@/data/mock'
import { formatCurrency, formatNumber } from '@/lib/utils'

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const campaign = CAMPAIGNS.find(c => c.id === id)
  const ads = getAds(id ?? '')
  if (!campaign) return <div className="p-6 text-gray-400">Campaign không tồn tại.</div>

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title={campaign.name} breadcrumb={{ label: 'Campaigns', to: '/campaigns' }} />
      <div className="flex-1 overflow-y-auto p-4">
        {ads.map(ad => {
          const Icon = ad.format === 'video' ? Video : Image
          return (
            <div key={ad.id} className="bg-white border border-gray-100 rounded-xl p-4 mb-3 flex gap-4">
              <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Icon size={20} className="text-gray-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium mb-1">{ad.name}</div>
                <div className="text-[10px] text-gray-400 mb-3 capitalize">{ad.format}</div>
                <div className="grid grid-cols-5 gap-3">
                  {[
                    { label: 'Chi tiêu', val: formatCurrency(ad.metrics.spend), cur: ad.metrics.spend, prev: ad.prevMetrics.spend },
                    { label: 'ROAS', val: `${ad.metrics.roas.toFixed(1)}x`, cur: ad.metrics.roas, prev: ad.prevMetrics.roas },
                    { label: 'Clicks', val: formatNumber(ad.metrics.clicks), cur: ad.metrics.clicks, prev: ad.prevMetrics.clicks },
                    { label: 'CTR', val: `${ad.metrics.ctr.toFixed(1)}%`, cur: ad.metrics.ctr, prev: ad.prevMetrics.ctr },
                    { label: 'CPC', val: formatCurrency(ad.metrics.cpc), cur: ad.metrics.cpc, prev: ad.prevMetrics.cpc, lower: true },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="text-[10px] text-gray-400 mb-0.5">{m.label}</div>
                      <div className="text-sm font-medium">{m.val}</div>
                      <DeltaBadge current={m.cur} previous={m.prev} lowerIsBetter={m.lower} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <StatusBadge status={ad.status} />
                <button className={`text-[11px] px-2.5 py-1 rounded-lg border ${ad.status === 'active' ? 'border-gray-200 hover:bg-gray-50' : 'bg-blue-600 text-white border-blue-600'}`}>
                  {ad.status === 'active' ? 'Pause' : 'Enable'}
                </button>
              </div>
            </div>
          )
        })}
        <button className="w-full border border-dashed border-gray-300 rounded-xl py-5 flex flex-col items-center gap-2 text-gray-400 hover:bg-gray-50">
          <Plus size={18} /><span className="text-xs">Thêm ad mới</span>
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add . && git commit -m "feat: Campaigns page, CampaignDetail (Standard ads)"
```

---

## Task 7: GMV Detail Page

**Files:**
- Modify: `frontend/src/pages/GmvDetail.tsx`

- [ ] **Step 1: GmvDetail.tsx**

```typescript
// src/pages/GmvDetail.tsx
import { useParams } from 'react-router-dom'
import { Info, ExternalLink } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import StatusBadge from '@/components/ui/StatusBadge'
import DeltaBadge from '@/components/ui/DeltaBadge'
import { CAMPAIGNS, getCreatives, getLiveSessions } from '@/data/mock'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { isGmvMetrics } from '@/types'

export default function GmvDetail() {
  const { id } = useParams<{ id: string }>()
  const campaign = CAMPAIGNS.find(c => c.id === id)
  const creatives = getCreatives(id ?? '')
  const sessions = getLiveSessions(id ?? '')

  if (!campaign) return <div className="p-6 text-gray-400">Campaign không tồn tại.</div>
  if (!isGmvMetrics(campaign.metrics)) return null

  const isLive = campaign.type === 'gmv_live'
  const metrics = campaign.metrics
  const prev = campaign.prevMetrics
  if (!isGmvMetrics(prev)) return null

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title={campaign.name} breadcrumb={{ label: 'Campaigns', to: '/campaigns' }} />
      <div className="flex-1 overflow-y-auto p-4">

        {/* Notice */}
        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 mb-4 text-xs text-blue-700">
          <Info size={14} className="flex-shrink-0 mt-0.5" />
          <span>
            GMV Max — chỉ có thể đổi budget và bật/tắt {isLive ? 'session' : 'creatives'}. Targeting và bid do TikTok tự động quản lý.
            {!isLive && ' Để thêm video mới, '}
            {!isLive && <a href="#" className="underline inline-flex items-center gap-0.5">mở TikTok Ads Manager <ExternalLink size={10} /></a>}
          </span>
        </div>

        {/* Campaign overview metrics */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Cost', val: formatCurrency(metrics.cost), cur: metrics.cost, prev: prev.cost, lower: true },
            { label: 'SKU Orders', val: formatNumber(metrics.skuOrders), cur: metrics.skuOrders, prev: prev.skuOrders },
            { label: 'Gross Revenue', val: formatCurrency(metrics.grossRevenue), cur: metrics.grossRevenue, prev: prev.grossRevenue },
            { label: 'ROI', val: `${metrics.roi.toFixed(2)}x`, cur: metrics.roi, prev: prev.roi },
          ].map(m => (
            <div key={m.label} className="bg-white border border-gray-100 rounded-xl p-3.5">
              <div className="text-[11px] text-gray-500 mb-1">{m.label}</div>
              <div className="text-lg font-medium mb-1">{m.val}</div>
              <DeltaBadge current={m.cur} previous={m.prev} lowerIsBetter={m.lower} />
            </div>
          ))}
        </div>

        {/* Creatives (GMV Product) */}
        {!isLive && (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="flex justify-between items-center px-4 py-3 border-b border-gray-100">
              <span className="text-sm font-medium">Creatives ({creatives.length})</span>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Video','Trạng thái','Cost','SKU Orders','Cost/Order','Revenue','ROI','vs CK',''].map(h => (
                    <th key={h} className="text-left px-3 py-2 text-[10px] font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {creatives.map(cr => (
                  <tr key={cr.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-3 py-2.5 font-medium text-gray-800">{cr.name}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={cr.status} /></td>
                    <td className="px-3 py-2.5">{formatCurrency(cr.metrics.cost)}</td>
                    <td className="px-3 py-2.5">{cr.metrics.skuOrders}</td>
                    <td className="px-3 py-2.5">{formatCurrency(cr.metrics.costPerOrder)}</td>
                    <td className="px-3 py-2.5">{formatCurrency(cr.metrics.grossRevenue)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`font-medium ${cr.metrics.roi >= 3 ? 'text-green-700' : 'text-amber-700'}`}>
                        {cr.metrics.roi.toFixed(2)}x
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <DeltaBadge current={cr.metrics.roi} previous={cr.prevMetrics.roi} />
                    </td>
                    <td className="px-3 py-2.5">
                      <button className={`text-[11px] px-2 py-1 rounded border whitespace-nowrap
                        ${cr.status === 'active' ? 'border-gray-200 hover:bg-gray-50' : 'bg-blue-600 text-white border-blue-600'}`}>
                        {cr.status === 'active' ? 'Tắt' : 'Bật'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Live sessions (GMV Live — read only) */}
        {isLive && (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-sm font-medium">
              Sessions live <span className="text-[10px] text-gray-400 font-normal ml-2">(read-only — xem metrics từng session)</span>
            </div>
            {sessions.map(s => (
              <div key={s.id} className="flex items-center gap-4 px-4 py-3 border-b border-gray-50 last:border-0">
                <div className="min-w-0">
                  <div className="text-xs font-medium">{new Date(s.startTime).toLocaleString('vi-VN')}</div>
                  <div className="text-[10px] text-gray-400">
                    {s.endTime ? `Kết thúc ${new Date(s.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}` : 'Đang live'}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-6 ml-4">
                  {[
                    { label: 'Cost', val: formatCurrency(s.metrics.cost) },
                    { label: 'Orders', val: String(s.metrics.skuOrders) },
                    { label: 'Revenue', val: formatCurrency(s.metrics.grossRevenue) },
                    { label: 'ROI', val: `${s.metrics.roi.toFixed(2)}x` },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="text-[10px] text-gray-400">{m.label}</div>
                      <div className="text-sm font-medium">{m.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Click vào Summer Collection GMV → thấy metrics GMV, bảng creatives với ROI từng video, nút Tắt/Bật.
Click vào LIVE June 25 → thấy sessions read-only, không có nút action.

- [ ] **Step 3: Commit**

```bash
git add . && git commit -m "feat: GmvDetail — creatives management + LIVE sessions read-only"
```

---

## Task 8: Alerts + NewCampaign + Settings

**Files:**
- Modify: `frontend/src/pages/AlertsPage.tsx`
- Modify: `frontend/src/pages/NewCampaign.tsx`
- Modify: `frontend/src/pages/Settings.tsx`

- [ ] **Step 1: AlertsPage.tsx**

```typescript
// src/pages/AlertsPage.tsx
import { AlertTriangle, Check } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import { useWorkspace } from '@/context/WorkspaceContext'
import { getAlerts } from '@/data/mock'

function timeAgo(iso: string) {
  const h = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000)
  return h < 1 ? `${Math.floor((Date.now() - new Date(iso).getTime()) / 60000)} phút trước` : `${h} giờ trước`
}

export default function AlertsPage() {
  const { company } = useWorkspace()
  const all = company ? getAlerts(company.id) : []
  const criticals = all.filter(a => !a.resolved && a.severity === 'critical')
  const warnings = all.filter(a => !a.resolved && a.severity === 'warning')
  const resolved = all.filter(a => a.resolved)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Cảnh báo" />
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {criticals.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-red-50 text-sm font-medium text-red-700 flex items-center gap-2">
              <AlertTriangle size={14} /> Critical ({criticals.length})
            </div>
            {criticals.map(a => (
              <div key={a.id} className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-700 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={14} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium mb-0.5">{a.campaignName}</div>
                  <div className="text-xs text-gray-500">{a.message}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-[10px] text-gray-400">{timeAgo(a.createdAt)}</span>
                  <button className="text-[11px] px-2 py-1 bg-blue-600 text-white rounded-lg">Xử lý</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {warnings.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-amber-50 text-sm font-medium text-amber-700 flex items-center gap-2">
              <AlertTriangle size={14} /> Warning ({warnings.length})
            </div>
            {warnings.map(a => (
              <div key={a.id} className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={14} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium mb-0.5">{a.campaignName}</div>
                  <div className="text-xs text-gray-500">{a.message}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-[10px] text-gray-400">{timeAgo(a.createdAt)}</span>
                  <button className="text-[11px] px-2 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">Bỏ qua</button>
                </div>
              </div>
            ))}
          </div>
        )}
        {resolved.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden opacity-60">
            <div className="px-4 py-3 border-b border-gray-100 text-sm font-medium text-gray-500 flex items-center gap-2">
              <Check size={14} /> Đã xử lý ({resolved.length})
            </div>
            {resolved.map(a => (
              <div key={a.id} className="flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-lg bg-gray-100 text-gray-400 flex items-center justify-center flex-shrink-0">
                  <Check size={14} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium mb-0.5">{a.campaignName}</div>
                  <div className="text-xs text-gray-400">{a.message}</div>
                </div>
                <span className="text-[10px] text-gray-400 flex-shrink-0">{timeAgo(a.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: NewCampaign.tsx**

```typescript
// src/pages/NewCampaign.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import type { CampaignType, CampaignObjective } from '@/types'

interface Form {
  name: string; type: CampaignType; objective: CampaignObjective
  budget: string; budgetType: 'daily' | 'lifetime'
  startDate: string; endDate: string
  budgetWarningPct: number; minRoas: number; minRoi: number; minOrders: string
}

export default function NewCampaign() {
  const navigate = useNavigate()
  const [form, setForm] = useState<Form>({
    name: '', type: 'standard', objective: 'conversions',
    budget: '', budgetType: 'daily', startDate: '', endDate: '',
    budgetWarningPct: 80, minRoas: 2.0, minRoi: 3.0, minOrders: '',
  })
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(p => ({ ...p, [k]: v }))

  const isGmv = form.type === 'gmv_product' || form.type === 'gmv_live'

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.budget) { alert('Điền tên và budget'); return }
    alert(`Tạo campaign "${form.name}" (mock)`)
    navigate('/campaigns')
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Tạo campaign mới" breadcrumb={{ label: 'Campaigns', to: '/campaigns' }} />
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={submit} className="max-w-lg flex flex-col gap-5">
          <fieldset>
            <legend className="text-xs font-medium text-gray-500 uppercase tracking-wider pb-2 mb-4 border-b border-gray-100 block w-full">Thông tin cơ bản</legend>
            <div className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Tên campaign</label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="VD: Flash Sale June 2026"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Loại campaign</label>
                  <select value={form.type} onChange={e => set('type', e.target.value as CampaignType)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-400">
                    <option value="standard">Standard</option>
                    <option value="gmv_product">GMV Product</option>
                    <option value="gmv_live">GMV Live</option>
                  </select>
                </div>
                {!isGmv && (
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Mục tiêu</label>
                    <select value={form.objective} onChange={e => set('objective', e.target.value as CampaignObjective)}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-400">
                      <option value="conversions">Conversions</option>
                      <option value="traffic">Traffic</option>
                      <option value="awareness">Awareness</option>
                      <option value="catalog_sales">Catalog Sales</option>
                    </select>
                  </div>
                )}
              </div>
              {isGmv && (
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-700">
                  <Info size={13} className="flex-shrink-0 mt-0.5" />
                  GMV {form.type === 'gmv_live' ? 'Live' : 'Product'} — TikTok tự quản lý targeting và bid. Sau khi tạo, thêm video/creatives trong TikTok Ads Manager.
                </div>
              )}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-medium text-gray-500 uppercase tracking-wider pb-2 mb-4 border-b border-gray-100 block w-full">Ngân sách</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Loại budget</label>
                <select value={form.budgetType} onChange={e => set('budgetType', e.target.value as 'daily' | 'lifetime')}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-400">
                  <option value="daily">Daily</option>
                  <option value="lifetime">Lifetime</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Số tiền (₫)</label>
                <input type="number" value={form.budget} onChange={e => set('budget', e.target.value)}
                  placeholder="500000"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Ngày bắt đầu</label>
                <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Ngày kết thúc</label>
                <input type="date" value={form.endDate} onChange={e => set('endDate', e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-xs font-medium text-gray-500 uppercase tracking-wider pb-2 mb-4 border-b border-gray-100 block w-full">Ngưỡng cảnh báo</legend>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Cảnh báo budget (%)</label>
                <input type="number" value={form.budgetWarningPct} onChange={e => set('budgetWarningPct', +e.target.value)}
                  min={50} max={100}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
              </div>
              {!isGmv ? (
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">ROAS tối thiểu</label>
                  <input type="number" value={form.minRoas} onChange={e => set('minRoas', +e.target.value)} step={0.1}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
                </div>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">ROI tối thiểu</label>
                    <input type="number" value={form.minRoi} onChange={e => set('minRoi', +e.target.value)} step={0.1}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">SKU Orders tối thiểu/ngày</label>
                    <input type="number" value={form.minOrders} onChange={e => set('minOrders', e.target.value)} placeholder="Không giới hạn"
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
                  </div>
                </>
              )}
            </div>
          </fieldset>

          <div className="flex gap-2">
            <button type="button" onClick={() => navigate('/campaigns')}
              className="flex-1 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">Hủy</button>
            <button type="submit"
              className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Tạo campaign</button>
          </div>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Settings.tsx**

```typescript
// src/pages/Settings.tsx
import { useState } from 'react'
import Topbar from '@/components/layout/Topbar'
import { useWorkspace } from '@/context/WorkspaceContext'

export default function Settings() {
  const { company } = useWorkspace()
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [dailyReport, setDailyReport] = useState(false)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Cài đặt" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-md flex flex-col gap-4">
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wider">Tài khoản</div>
            <div className="p-4 flex flex-col gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Tên hiển thị</label>
                <input type="text" defaultValue="Quan Leu Digital"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1.5">Email thông báo</label>
                <input type="email" defaultValue="khanhle032010@gmail.com"
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
              </div>
            </div>
          </div>

          {company && (
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wider">TikTok API — {company.name}</div>
              <div className="p-4 flex flex-col gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Advertiser ID (Ads API)</label>
                  <input type="text" defaultValue={company.advertiserIds.ads}
                    className="w-full text-sm font-mono border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-600 block mb-1.5">Shop ID (Shop API)</label>
                  <input type="text" defaultValue={company.advertiserIds.shop}
                    className="w-full text-sm font-mono border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400" />
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wider">Thông báo</div>
            <div className="divide-y divide-gray-50">
              {[
                { label: 'Alert qua email', desc: 'Nhận email khi có cảnh báo critical', val: emailAlerts, set: setEmailAlerts },
                { label: 'Báo cáo hàng ngày', desc: 'Tóm tắt performance mỗi sáng 8:00', val: dailyReport, set: setDailyReport },
              ].map(({ label, desc, val, set }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <div><div className="text-sm font-medium">{label}</div><div className="text-xs text-gray-400 mt-0.5">{desc}</div></div>
                  <button onClick={() => set(!val)} className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${val ? 'bg-blue-600 justify-end' : 'bg-gray-200 justify-start'}`}>
                    <span className="w-4 h-4 bg-white rounded-full" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button className="w-full py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Lưu thay đổi</button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Build check**

```bash
npm run build
```

Expected: build thành công, 0 TypeScript errors.

- [ ] **Step 5: Final commit**

```bash
git add . && git commit -m "feat: complete frontend — Alerts, NewCampaign (Standard+GMV), Settings"
```

---

## Self-Review

**Spec coverage:**
- ✅ TikTok only — bỏ Facebook, Google
- ✅ Multi-company workspace switcher
- ✅ Standard campaign: ads list, bật/tắt từng ad, metrics đầy đủ
- ✅ GMV Product: creatives list, bật/tắt từng creative, metrics SKU/ROI/Revenue
- ✅ GMV Live: sessions read-only
- ✅ Dashboard tách metrics Standard vs GMV
- ✅ NewCampaign form thay đổi theo loại (Standard/GMV) — alert config khác nhau
- ✅ Mock data có đủ data thật từ screenshot TikTok (34.4M cost, 941 orders, ROI 4.06)
- ✅ Type guards `isStandardMetrics` / `isGmvMetrics` đảm bảo type safety

**Types nhất quán:** `isGmvMetrics()` và `isStandardMetrics()` dùng ở Dashboard, Campaigns, GmvDetail, CampaignDetail — tất cả dùng cùng interface từ `types/index.ts`.

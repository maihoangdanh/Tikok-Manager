import { useState, useEffect } from 'react'
import { CheckCircle, Loader2 } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import { useWorkspace } from '@/context/WorkspaceContext'
import api from '@/api/client'

function SaveBtn({ onClick, saving, saved }: { onClick: () => void; saving: boolean; saved: boolean }) {
  return (
    <button onClick={onClick} disabled={saving}
      className={`px-4 py-2 text-xs rounded-lg font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-60 ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
      {saving ? <Loader2 size={12} className="animate-spin" /> : saved ? <CheckCircle size={12} /> : null}
      {saving ? 'Đang lưu...' : saved ? 'Đã lưu' : 'Lưu'}
    </button>
  )
}

function useSave(fn: () => Promise<void>) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  async function trigger() {
    setSaving(true); setError('')
    try {
      await fn(); setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Lưu thất bại')
    } finally { setSaving(false) }
  }
  return { trigger, saving, saved, error }
}

const COLORS = [
  { bg: '#E6F1FB', text: '#185FA5' },
  { bg: '#EAF3DE', text: '#3B6D11' },
  { bg: '#FAEEDA', text: '#854F0B' },
  { bg: '#F3E8FF', text: '#6B21A8' },
  { bg: '#FCE7F3', text: '#9D174D' },
]

const SAVED_PLACEHOLDER = '••••••••  (đã lưu)'

export default function Settings() {
  const { company, refreshCompanies, setCompany } = useWorkspace()

  const [cName, setCName] = useState('')
  const [cInitials, setCInitials] = useState('')
  const [cColorIdx, setCColorIdx] = useState(0)

  const [adsAppId, setAdsAppId] = useState('')
  const [adsAppSecret, setAdsAppSecret] = useState('')
  const [adsAccessToken, setAdsAccessToken] = useState('')
  const [adsAdvertiserId, setAdsAdvertiserId] = useState('')
  const [adsHasSaved, setAdsHasSaved] = useState(false)

  const [shopAppKey, setShopAppKey] = useState('')
  const [shopAppSecret, setShopAppSecret] = useState('')
  const [shopAccessToken, setShopAccessToken] = useState('')
  const [shopRefreshToken, setShopRefreshToken] = useState('')
  const [shopId, setShopId] = useState('')
  const [shopAuthCode, setShopAuthCode] = useState('')
  const [shopCipher, setShopCipher] = useState('')
  const [shopHasSaved, setShopHasSaved] = useState(false)

  useEffect(() => {
    if (!company) return
    setCName(company.name)
    setCInitials(company.initials)
    setCColorIdx(COLORS.findIndex(c => c.bg === company.color.bg) || 0)

    // reset
    setAdsAppId(''); setAdsAppSecret(''); setAdsAccessToken(''); setAdsAdvertiserId(''); setAdsHasSaved(false)
    setShopAppKey(''); setShopAppSecret(''); setShopAccessToken(''); setShopRefreshToken('')
    setShopId(''); setShopAuthCode(''); setShopCipher(''); setShopHasSaved(false)

    // load saved credentials
    api.get(`/companies/${company.id}/credentials`).then(r => {
      const ads = r.data.tiktok_ads
      if (ads) {
        setAdsAppId(ads.app_id || '')
        setAdsAdvertiserId(ads.advertiser_id || '')
        setAdsHasSaved(ads.access_token === 'SAVED')
      }
      const shop = r.data.tiktok_shop
      if (shop) {
        setShopAppKey(shop.app_key || '')
        setShopId(shop.shop_id || '')
        setShopAuthCode(shop.authorization_code || '')
        setShopCipher(shop.shop_cipher || '')
        setShopHasSaved(shop.access_token === 'SAVED')
      }
    }).catch(() => {})
  }, [company?.id])

  const companySave = useSave(async () => {
    if (!company) return
    const r = await api.put(`/companies/${company.id}`, {
      name: cName.trim(),
      initials: cInitials.trim().toUpperCase().slice(0, 3),
      color: COLORS[cColorIdx],
    })
    await refreshCompanies()
    setCompany(r.data)
  })

  const adsSave = useSave(async () => {
    if (!company) return
    await api.post(`/companies/${company.id}/credentials/tiktok-ads`, {
      app_id: adsAppId, app_secret: adsAppSecret,
      access_token: adsAccessToken, advertiser_id: adsAdvertiserId,
    })
    setAdsHasSaved(true); setAdsAppSecret(''); setAdsAccessToken('')
  })

  const shopSave = useSave(async () => {
    if (!company) return
    await api.post(`/companies/${company.id}/credentials/tiktok-shop`, {
      app_key: shopAppKey, app_secret: shopAppSecret,
      access_token: shopAccessToken, refresh_token: shopRefreshToken,
      shop_id: shopId, authorization_code: shopAuthCode, shop_cipher: shopCipher,
    })
    setShopHasSaved(true); setShopAppSecret(''); setShopAccessToken(''); setShopRefreshToken('')
  })

  const inputCls = 'w-full text-sm font-mono border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400'
  const labelCls = 'text-xs font-medium text-gray-600 block mb-1'

  if (!company) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <Topbar title="Cài đặt" />
        <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
          Chọn công ty ở góc trên trái để cấu hình.
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="Cài đặt" />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-lg space-y-4">

          {/* Company info */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Thông tin công ty</div>
                <div className="text-[11px] text-gray-400 mt-0.5">ID: {company.id}</div>
              </div>
              <SaveBtn onClick={companySave.trigger} saving={companySave.saving} saved={companySave.saved} />
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className={labelCls}>Tên công ty</label>
                <input type="text" value={cName} onChange={e => setCName(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Viết tắt (2-3 ký tự)</label>
                  <input type="text" value={cInitials} onChange={e => setCInitials(e.target.value)} maxLength={3}
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-400 uppercase" />
                </div>
                <div>
                  <label className={labelCls}>Màu</label>
                  <div className="flex gap-1.5 mt-1">
                    {COLORS.map((c, i) => (
                      <button key={i} onClick={() => setCColorIdx(i)}
                        className={`w-7 h-7 rounded-md border-2 transition-all ${i === cColorIdx ? 'border-blue-500 scale-110' : 'border-transparent'}`}
                        style={{ background: c.bg }}>
                        <span className="text-[11px] font-bold" style={{ color: c.text }}>A</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {companySave.error && <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{companySave.error}</div>}
            </div>
          </div>

          {/* TikTok Ads */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  TikTok Ads API
                  {adsHasSaved && <span className="text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full normal-case">Đã kết nối</span>}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">{company.name}</div>
              </div>
              <SaveBtn onClick={adsSave.trigger} saving={adsSave.saving} saved={adsSave.saved} />
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>App ID</label>
                  <input type="text" value={adsAppId} onChange={e => setAdsAppId(e.target.value)} placeholder="7xxxxxxxxxxxxxxx" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Advertiser ID</label>
                  <input type="text" value={adsAdvertiserId} onChange={e => setAdsAdvertiserId(e.target.value)} placeholder="7xxxxxxxxxxxxxxx" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>App Secret {adsHasSaved && <span className="text-green-600 font-normal">(đã lưu — nhập mới để thay đổi)</span>}</label>
                <input type="password" value={adsAppSecret} onChange={e => setAdsAppSecret(e.target.value)}
                  placeholder={adsHasSaved ? SAVED_PLACEHOLDER : '••••••••••••••••'} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Access Token {adsHasSaved && <span className="text-green-600 font-normal">(đã lưu — nhập mới để thay đổi)</span>}</label>
                <input type="password" value={adsAccessToken} onChange={e => setAdsAccessToken(e.target.value)}
                  placeholder={adsHasSaved ? SAVED_PLACEHOLDER : '••••••••••••••••'} className={inputCls} />
              </div>
              {adsSave.error && <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{adsSave.error}</div>}
            </div>
          </div>

          {/* TikTok Shop */}
          <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                  TikTok Shop API
                  {shopHasSaved && <span className="text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full normal-case">Đã kết nối</span>}
                </div>
                <div className="text-[11px] text-gray-400 mt-0.5">{company.name}</div>
              </div>
              <SaveBtn onClick={shopSave.trigger} saving={shopSave.saving} saved={shopSave.saved} />
            </div>
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>App Key</label>
                  <input type="text" value={shopAppKey} onChange={e => setShopAppKey(e.target.value)} placeholder="xxxxxxxxxx" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Shop ID</label>
                  <input type="text" value={shopId} onChange={e => setShopId(e.target.value)} placeholder="xxxxxxxxxx" className={inputCls} />
                </div>
              </div>
              <div>
                <label className={labelCls}>App Secret {shopHasSaved && <span className="text-green-600 font-normal">(đã lưu)</span>}</label>
                <input type="password" value={shopAppSecret} onChange={e => setShopAppSecret(e.target.value)}
                  placeholder={shopHasSaved ? SAVED_PLACEHOLDER : '••••••••••••••••'} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Access Token {shopHasSaved && <span className="text-green-600 font-normal">(đã lưu)</span>}</label>
                <input type="password" value={shopAccessToken} onChange={e => setShopAccessToken(e.target.value)}
                  placeholder={shopHasSaved ? SAVED_PLACEHOLDER : '••••••••••••••••'} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Refresh Token {shopHasSaved && <span className="text-green-600 font-normal">(đã lưu)</span>}</label>
                <input type="password" value={shopRefreshToken} onChange={e => setShopRefreshToken(e.target.value)}
                  placeholder={shopHasSaved ? SAVED_PLACEHOLDER : '••••••••••••••••'} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Authorization Code</label>
                <input type="text" value={shopAuthCode} onChange={e => setShopAuthCode(e.target.value)} placeholder="AUTH_xxxx" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Shop Cipher</label>
                <input type="text" value={shopCipher} onChange={e => setShopCipher(e.target.value)} placeholder="CIPHER_xxxx" className={inputCls} />
              </div>
              {shopSave.error && <div className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{shopSave.error}</div>}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

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

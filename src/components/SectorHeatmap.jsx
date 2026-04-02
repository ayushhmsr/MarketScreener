// SectorHeatmap.jsx
export function SectorHeatmap({ sectors }) {
  return (
    <div style={{ padding:8, display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
      {sectors.map(s => {
        const pos = s.avg >= 0
        const intens = Math.min(Math.abs(s.strength)/100, 1)
        const bg = pos ? `rgba(16,185,129,${0.05+intens*0.2})` : `rgba(239,68,68,${0.05+intens*0.2})`
        const bc = pos ? `rgba(16,185,129,${0.15+intens*0.2})` : `rgba(239,68,68,${0.15+intens*0.2})`
        const c  = pos ? '#10b981' : '#ef4444'
        return (
          <div key={s.sector} style={{ background:bg, border:`1px solid ${bc}`, borderRadius:7, padding:'6px 8px', cursor:'pointer' }}>
            <div style={{ fontSize:9, color:`${c}cc`, fontWeight:600, marginBottom:1 }}>{s.sector}</div>
            <div style={{ fontSize:14, fontWeight:700, color:c }}>{s.avg>=0?'+':''}{s.avg.toFixed(2)}%</div>
            <div style={{ fontSize:9, color:'#6b7280', marginTop:1 }}>{s.adv}▲ {s.dec}▼ / {s.count}</div>
            <div style={{ height:2, borderRadius:1, background:'rgba(255,255,255,0.06)', marginTop:4 }}>
              <div style={{ width:`${Math.abs(s.strength)}%`, height:'100%', borderRadius:1, background:c }}/>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default SectorHeatmap

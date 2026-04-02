import { useState } from 'react'
import { SIG_TYPES } from '../data/engine'

const fP = n => '₹'+Number(n).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})
const fT = d => d instanceof Date ? d.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',second:'2-digit'}) : ''

export default function SignalFeed({ signals, stocks, onSelect }) {
  const [typeFilter, setTypeFilter] = useState('All')
  const [minConf, setMinConf] = useState(50)

  const filtered = signals.filter(s =>
    (typeFilter==='All' || s.type===typeFilter) && s.conf >= minConf
  )

  const gainers = [...stocks].sort((a,b)=>b.chg-a.chg).slice(0,10)
  const losers  = [...stocks].sort((a,b)=>a.chg-b.chg).slice(0,10)

  return (
    <div style={{ height:'100%', display:'grid', gridTemplateColumns:'1fr 300px', overflow:'hidden' }}>
      {/* Signal feed */}
      <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', borderRight:'1px solid #21262d' }}>
        {/* Filters */}
        <div style={{ padding:'8px 12px', borderBottom:'1px solid #21262d', display:'flex', gap:6, flexWrap:'wrap', alignItems:'center', background:'#0a0e14', flexShrink:0 }}>
          <span style={{ fontSize:11, color:'#6b7280' }}>Type:</span>
          {['All', ...Object.keys(SIG_TYPES)].map(t=>(
            <button key={t} onClick={()=>setTypeFilter(t)} style={{
              padding:'2px 7px', borderRadius:4, border:'1px solid', cursor:'pointer', fontSize:10, fontFamily:'inherit',
              background:typeFilter===t?'rgba(59,130,246,0.15)':'transparent',
              borderColor:typeFilter===t?'rgba(59,130,246,0.4)':'transparent',
              color:typeFilter===t?'#60a5fa':'#6b7280',
            }}>{SIG_TYPES[t]?.label || 'All'}</button>
          ))}
          <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ fontSize:11, color:'#6b7280' }}>Min conf: {minConf}%</span>
            <input type="range" min={50} max={95} value={minConf} onChange={e=>setMinConf(+e.target.value)} style={{ width:80 }}/>
          </div>
          <span style={{ fontSize:11, color:'#4b5563' }}>{filtered.length} signals</span>
        </div>

        {/* Signal cards */}
        <div style={{ flex:1, overflowY:'auto', padding:'8px' }}>
          {filtered.length === 0 && (
            <div style={{ padding:40, textAlign:'center', color:'#4b5563' }}>
              <div style={{ fontSize:24, marginBottom:8 }}>⚡</div>
              <div>Waiting for signals...</div>
            </div>
          )}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:8 }}>
            {filtered.map(sig => {
              const confColor = sig.conf>=80?'#10b981':sig.conf>=65?'#f59e0b':'#f97316'
              return (
                <div key={sig.id} onClick={()=>onSelect(sig.sym)} style={{
                  background:'#161b22', border:`1px solid ${sig.border}`, borderRadius:9, padding:'10px 12px', cursor:'pointer',
                  transition:'border-color 0.15s',
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                        <span style={{ fontWeight:700, fontSize:13, color:'#e6edf3' }}>{sig.sym}</span>
                        <span style={{ fontSize:9, padding:'1px 6px', borderRadius:3, background:sig.bg, color:sig.color, border:`1px solid ${sig.border}`, fontWeight:700 }}>
                          {sig.label}
                        </span>
                      </div>
                      <span style={{ fontSize:10, color:'#6b7280' }}>{sig.sector}</span>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontSize:14, fontWeight:700, color:confColor }}>{sig.conf.toFixed(0)}%</div>
                      <div style={{ fontSize:9, color:'#4b5563' }}>conf</div>
                    </div>
                  </div>
                  <div style={{ fontSize:10, color:'#6b7280', lineHeight:1.5, marginBottom:7 }}>{sig.reason}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:12, fontWeight:700, color:'#e6edf3' }}>{fP(sig.price)}</span>
                    <span style={{ fontSize:9, color:'#4b5563' }}>{fT(sig.at)}</span>
                  </div>
                  {/* Confidence bar */}
                  <div style={{ height:2, background:'#21262d', borderRadius:1, marginTop:7 }}>
                    <div style={{ width:`${sig.conf}%`, height:'100%', background:confColor, borderRadius:1, transition:'width 0.5s' }}/>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right — top movers */}
      <div style={{ overflowY:'auto', padding:'8px', display:'flex', flexDirection:'column', gap:8 }}>
        <div style={{ fontSize:10, color:'#6b7280', letterSpacing:0.5, padding:'2px 4px' }}>TOP GAINERS (F&O)</div>
        {gainers.map(s=>(
          <div key={s.sym} onClick={()=>onSelect(s.sym)} style={{
            background:'rgba(16,185,129,0.06)', border:'1px solid rgba(16,185,129,0.15)', borderRadius:6,
            padding:'7px 10px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center'
          }}>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#e6edf3' }}>{s.sym}</div>
              <div style={{ fontSize:9, color:'#6b7280' }}>{s.sector}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ color:'#10b981', fontWeight:700 }}>+{s.chg.toFixed(2)}%</div>
              <div style={{ fontSize:10, color:'#6b7280' }}>{fP(s.ltp)}</div>
            </div>
          </div>
        ))}
        <div style={{ fontSize:10, color:'#6b7280', letterSpacing:0.5, padding:'6px 4px 2px' }}>TOP LOSERS (F&O)</div>
        {losers.map(s=>(
          <div key={s.sym} onClick={()=>onSelect(s.sym)} style={{
            background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.15)', borderRadius:6,
            padding:'7px 10px', cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center'
          }}>
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:'#e6edf3' }}>{s.sym}</div>
              <div style={{ fontSize:9, color:'#6b7280' }}>{s.sector}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ color:'#ef4444', fontWeight:700 }}>{s.chg.toFixed(2)}%</div>
              <div style={{ fontSize:10, color:'#6b7280' }}>{fP(s.ltp)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const fP = n => '₹'+Number(n).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})
const fV = n => n>=1e7?(n/1e7).toFixed(1)+'Cr':n>=1e5?(n/1e5).toFixed(1)+'L':n.toLocaleString()
const fC = n => (n>=0?'+':'')+n.toFixed(2)+'%'

const COLS = [
  {key:'sym',  label:'Symbol',    w:130},
  {key:'ltp',  label:'LTP',       w:110},
  {key:'chg',  label:'Chg %',     w:90},
  {key:'vol',  label:'Volume',    w:90},
  {key:'volRatio',label:'Vol×',   w:70},
  {key:'vwap', label:'VWAP',      w:100},
  {key:'rsi',  label:'RSI',       w:70},
  {key:'oiChgPct',label:'OI Chg', w:80},
  {key:null,   label:'Signal',    w:100},
]

export default function StockTable({ stocks, flash, sortCfg, onSort, onSelect }) {
  const top5 = [...stocks].sort((a,b)=>b.chg-a.chg).slice(0,5).map(s=>s.sym)
  const bot5 = [...stocks].sort((a,b)=>a.chg-b.chg).slice(0,5).map(s=>s.sym)

  return (
    <div style={{ flex:1, overflowY:'auto', overflowX:'auto' }}>
      {/* Top/Bottom movers bar */}
      <div style={{ display:'flex', borderBottom:'1px solid #21262d', background:'#0a0e14', flexShrink:0 }}>
        <div style={{ flex:1, padding:'5px 10px' }}>
          <div style={{ fontSize:9, color:'#6b7280', marginBottom:3, letterSpacing:0.5 }}>▲ TOP GAINERS</div>
          <div style={{ display:'flex', gap:12 }}>
            {top5.map(sym => { const s=stocks.find(x=>x.sym===sym); return s?(
              <span key={sym} style={{ fontSize:11, whiteSpace:'nowrap' }}>
                <span style={{ color:'#e6edf3', fontWeight:600 }}>{sym}</span>{' '}
                <span style={{ color:'#10b981' }}>{fC(s.chg)}</span>
              </span>
            ):null})}
          </div>
        </div>
        <div style={{ width:1, background:'#21262d' }}/>
        <div style={{ flex:1, padding:'5px 10px' }}>
          <div style={{ fontSize:9, color:'#6b7280', marginBottom:3, letterSpacing:0.5 }}>▼ TOP LOSERS</div>
          <div style={{ display:'flex', gap:12 }}>
            {bot5.map(sym => { const s=stocks.find(x=>x.sym===sym); return s?(
              <span key={sym} style={{ fontSize:11, whiteSpace:'nowrap' }}>
                <span style={{ color:'#e6edf3', fontWeight:600 }}>{sym}</span>{' '}
                <span style={{ color:'#ef4444' }}>{fC(s.chg)}</span>
              </span>
            ):null})}
          </div>
        </div>
      </div>

      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
        <thead>
          <tr style={{ position:'sticky', top:0, zIndex:10, background:'#0d1117', borderBottom:'1px solid #21262d' }}>
            {COLS.map(c => (
              <th key={c.label} onClick={()=>c.key&&onSort(c.key)} style={{
                textAlign:'left', padding:'7px 10px', fontSize:11, fontWeight:500, color:'#6b7280',
                cursor:c.key?'pointer':'default', whiteSpace:'nowrap', userSelect:'none',
                minWidth:c.w,
              }}>
                {c.label}{c.key&&sortCfg.key===c.key ? (sortCfg.dir<0?' ↓':' ↑') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stocks.map(s => {
            const fl = flash[s.sym]
            const pos = s.chg >= 0
            const rsiColor = s.rsi>70?'#ef4444':s.rsi<30?'#10b981':'#60a5fa'
            const oiColor = s.oiChgPct>0?'#10b981':'#ef4444'
            let sigEl = null
            if (s.volRatio>=2.5 && s.chg>1.5) sigEl = <span style={{ fontSize:9, padding:'1px 5px', borderRadius:3, background:'rgba(16,185,129,0.1)', color:'#10b981', border:'1px solid rgba(16,185,129,0.2)' }}>⚡Breakout</span>
            else if (s.chg<-1.5&&s.volRatio>=2) sigEl = <span style={{ fontSize:9, padding:'1px 5px', borderRadius:3, background:'rgba(239,68,68,0.1)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.2)' }}>↓Breakdown</span>
            else if (s.rsi>72) sigEl = <span style={{ fontSize:9, padding:'1px 5px', borderRadius:3, background:'rgba(245,158,11,0.1)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.2)' }}>⚠OB</span>
            else if (s.rsi<30) sigEl = <span style={{ fontSize:9, padding:'1px 5px', borderRadius:3, background:'rgba(59,130,246,0.1)', color:'#60a5fa', border:'1px solid rgba(59,130,246,0.2)' }}>OS↑</span>

            return (
              <tr key={s.sym} onClick={()=>onSelect(s.sym)} style={{
                borderBottom:'1px solid rgba(255,255,255,0.03)', cursor:'pointer',
                background: fl==='up'?'rgba(16,185,129,0.06)':fl==='dn'?'rgba(239,68,68,0.06)':'',
                transition:'background 0.3s',
              }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                onMouseLeave={e=>e.currentTarget.style.background=''}
              >
                <td style={{ padding:'6px 10px' }}>
                  <div style={{ fontWeight:700, fontSize:12, color:'#e6edf3' }}>{s.sym}</div>
                  <div style={{ fontSize:9, color:'#6b7280' }}>{s.sector}</div>
                </td>
                <td style={{ padding:'6px 10px' }}>
                  <span style={{ fontWeight:700, color: fl==='up'?'#34d399':fl==='dn'?'#f87171':'#e6edf3', transition:'color 0.3s' }}>
                    {fP(s.ltp)}
                  </span>
                </td>
                <td style={{ padding:'6px 10px' }}>
                  <div style={{ color:pos?'#10b981':'#ef4444', fontWeight:600 }}>{pos?'▲':'▼'} {fC(s.chg)}</div>
                  <div style={{ fontSize:10, color:'#4b5563' }}>{fP(Math.abs(s.chgAbs))}</div>
                </td>
                <td style={{ padding:'6px 10px', color:'#8b949e' }}>{fV(s.vol)}</td>
                <td style={{ padding:'6px 10px' }}>
                  <span style={{
                    padding:'1px 5px', borderRadius:3, fontSize:10, fontWeight:600,
                    background: s.volRatio>=2?'rgba(245,158,11,0.12)':s.volRatio>=1.5?'rgba(59,130,246,0.12)':'transparent',
                    color: s.volRatio>=2?'#fbbf24':s.volRatio>=1.5?'#60a5fa':'#6b7280',
                  }}>{s.volRatio.toFixed(1)}×</span>
                </td>
                <td style={{ padding:'6px 10px' }}>
                  <div style={{ color:'#8b949e', fontSize:11 }}>{fP(s.vwap)}</div>
                  <div style={{ fontSize:9, color:s.aboveVwap?'#10b981':'#ef4444', fontWeight:600 }}>{s.aboveVwap?'▲ Above':'▼ Below'}</div>
                </td>
                <td style={{ padding:'6px 10px' }}>
                  <div style={{ color:rsiColor, fontWeight:600 }}>{s.rsi}</div>
                  <div style={{ width:36, height:2, background:'#21262d', borderRadius:1, marginTop:2 }}>
                    <div style={{ width:`${s.rsi}%`, height:'100%', background:rsiColor, borderRadius:1 }}/>
                  </div>
                </td>
                <td style={{ padding:'6px 10px' }}>
                  <span style={{ color:oiColor, fontSize:11, fontWeight:600 }}>{s.oiChgPct>0?'+':''}{s.oiChgPct.toFixed(1)}%</span>
                </td>
                <td style={{ padding:'6px 10px' }}>{sigEl}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

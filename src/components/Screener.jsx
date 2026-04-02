import { useState, useMemo } from 'react'
import { SECTORS } from '../data/universe'

const fP = n => '₹'+Number(n).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})
const fV = n => n>=1e7?(n/1e7).toFixed(1)+'Cr':n>=1e5?(n/1e5).toFixed(1)+'L':n.toLocaleString()
const fC = n => (n>=0?'+':'')+n.toFixed(2)+'%'

const PRESETS = {
  'Volume Surge':       { minVolRatio:2.5, aboveVwap:null, minRsi:null, maxRsi:null, oiDir:'any', minChg:null, maxChg:null },
  'Bullish Breakout':   { minVolRatio:1.8, aboveVwap:true, minRsi:50,   maxRsi:75,   oiDir:'any', minChg:1.5,  maxChg:null },
  'Bearish Breakdown':  { minVolRatio:1.8, aboveVwap:false,minRsi:null, maxRsi:50,   oiDir:'any', minChg:null, maxChg:-1.5},
  'RSI Overbought':     { minVolRatio:1.0, aboveVwap:null, minRsi:70,   maxRsi:null, oiDir:'any', minChg:null, maxChg:null },
  'RSI Oversold':       { minVolRatio:1.0, aboveVwap:null, minRsi:null, maxRsi:30,   oiDir:'any', minChg:null, maxChg:null },
  'Long Buildup':       { minVolRatio:1.0, aboveVwap:null, minRsi:null, maxRsi:null, oiDir:'pos', minChg:0,    maxChg:null },
  'Short Buildup':      { minVolRatio:1.0, aboveVwap:null, minRsi:null, maxRsi:null, oiDir:'pos', minChg:null, maxChg:0   },
  'High Momentum':      { minVolRatio:2.0, aboveVwap:true, minRsi:60,   maxRsi:80,   oiDir:'any', minChg:2,    maxChg:null },
}

export default function Screener({ stocks, flash, onSelect }) {
  const [filters, setFilters] = useState({
    sector:'All', minVolRatio:1.0, aboveVwap:null,
    minRsi:null, maxRsi:null, oiDir:'any',
    minChg:null, maxChg:null, search:'',
  })
  const [sort, setSort] = useState({ key:'chg', dir:-1 })
  const [preset, setPreset] = useState('')

  const applyPreset = (name) => {
    setPreset(name)
    setFilters(f => ({ ...f, ...PRESETS[name] }))
  }

  const setF = (k,v) => setFilters(f => ({ ...f, [k]:v }))

  const results = useMemo(() => {
    let list = stocks
    if (filters.sector !== 'All') list = list.filter(s=>s.sector===filters.sector)
    if (filters.search) {
      const q = filters.search.toUpperCase()
      list = list.filter(s=>s.sym.includes(q)||s.name.toUpperCase().includes(q))
    }
    if (filters.minVolRatio > 1) list = list.filter(s=>s.volRatio>=filters.minVolRatio)
    if (filters.aboveVwap !== null) list = list.filter(s=>s.aboveVwap===filters.aboveVwap)
    if (filters.minRsi !== null) list = list.filter(s=>s.rsi>=filters.minRsi)
    if (filters.maxRsi !== null) list = list.filter(s=>s.rsi<=filters.maxRsi)
    if (filters.oiDir === 'pos') list = list.filter(s=>s.oiChgPct>0)
    if (filters.oiDir === 'neg') list = list.filter(s=>s.oiChgPct<0)
    if (filters.minChg !== null) list = list.filter(s=>s.chg>=filters.minChg)
    if (filters.maxChg !== null) list = list.filter(s=>s.chg<=filters.maxChg)

    return [...list].sort((a,b) => sort.key==='sym' ? sort.dir*a.sym.localeCompare(b.sym) : sort.dir*((a[sort.key]||0)-(b[sort.key]||0)))
  }, [stocks, filters, sort])

  const handleSort = (key) => setSort(prev => prev.key===key ? { key, dir:prev.dir*-1 } : { key, dir:-1 })

  const N = { label:'', w:120 }

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Filter panel */}
      <div style={{ background:'#0a0e14', borderBottom:'1px solid #21262d', padding:'8px 12px', flexShrink:0 }}>
        {/* Presets */}
        <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:8, alignItems:'center' }}>
          <span style={{ fontSize:10, color:'#6b7280', marginRight:4 }}>Presets:</span>
          {Object.keys(PRESETS).map(p=>(
            <button key={p} onClick={()=>applyPreset(p)} style={{
              padding:'2px 8px', borderRadius:4, border:'1px solid', fontSize:10, fontFamily:'inherit', cursor:'pointer',
              background:preset===p?'rgba(124,58,237,0.2)':'transparent',
              borderColor:preset===p?'rgba(124,58,237,0.5)':'#30363d',
              color:preset===p?'#a78bfa':'#8b949e',
            }}>{p}</button>
          ))}
          <button onClick={()=>{setPreset('');setFilters({sector:'All',minVolRatio:1,aboveVwap:null,minRsi:null,maxRsi:null,oiDir:'any',minChg:null,maxChg:null,search:''})}} style={{
            padding:'2px 8px', borderRadius:4, border:'1px solid #30363d', fontSize:10, fontFamily:'inherit', cursor:'pointer', background:'transparent', color:'#6b7280', marginLeft:4
          }}>Reset</button>
          <span style={{ marginLeft:'auto', fontSize:11, color:'#4b5563', fontWeight:600 }}>{results.length} / {stocks.length} stocks</span>
        </div>
        {/* Filter row */}
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <input value={filters.search} onChange={e=>setF('search',e.target.value)} placeholder="Search..." style={{
            background:'#161b22', border:'1px solid #21262d', color:'#e6edf3', fontSize:11, padding:'4px 8px', borderRadius:4, fontFamily:'inherit', width:110, outline:'none'
          }}/>
          <select value={filters.sector} onChange={e=>setF('sector',e.target.value)} style={{
            background:'#161b22', border:'1px solid #21262d', color:'#8b949e', fontSize:11, padding:'4px 6px', borderRadius:4, fontFamily:'inherit'
          }}>
            <option value="All">All Sectors</option>
            {SECTORS.map(s=><option key={s}>{s}</option>)}
          </select>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:11, color:'#6b7280' }}>Vol≥</span>
            <select value={filters.minVolRatio} onChange={e=>setF('minVolRatio',+e.target.value)} style={{
              background:'#161b22', border:'1px solid #21262d', color:'#8b949e', fontSize:11, padding:'4px 4px', borderRadius:4, fontFamily:'inherit'
            }}>
              {[1,1.5,2,2.5,3,4,5].map(v=><option key={v} value={v}>{v}×</option>)}
            </select>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:11, color:'#6b7280' }}>VWAP:</span>
            <select value={filters.aboveVwap===null?'any':filters.aboveVwap?'above':'below'} onChange={e=>setF('aboveVwap',e.target.value==='any'?null:e.target.value==='above')} style={{
              background:'#161b22', border:'1px solid #21262d', color:'#8b949e', fontSize:11, padding:'4px 4px', borderRadius:4, fontFamily:'inherit'
            }}>
              <option value="any">Any</option>
              <option value="above">Above</option>
              <option value="below">Below</option>
            </select>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:11, color:'#6b7280' }}>RSI:</span>
            <input type="number" placeholder="Min" value={filters.minRsi??''} onChange={e=>setF('minRsi',e.target.value?+e.target.value:null)} style={{
              width:46, background:'#161b22', border:'1px solid #21262d', color:'#e6edf3', fontSize:11, padding:'3px 5px', borderRadius:4, fontFamily:'inherit', outline:'none'
            }}/>
            <span style={{ color:'#4b5563', fontSize:11 }}>–</span>
            <input type="number" placeholder="Max" value={filters.maxRsi??''} onChange={e=>setF('maxRsi',e.target.value?+e.target.value:null)} style={{
              width:46, background:'#161b22', border:'1px solid #21262d', color:'#e6edf3', fontSize:11, padding:'3px 5px', borderRadius:4, fontFamily:'inherit', outline:'none'
            }}/>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:11, color:'#6b7280' }}>Chg%:</span>
            <input type="number" placeholder="Min" value={filters.minChg??''} onChange={e=>setF('minChg',e.target.value!==''?+e.target.value:null)} style={{
              width:46, background:'#161b22', border:'1px solid #21262d', color:'#e6edf3', fontSize:11, padding:'3px 5px', borderRadius:4, fontFamily:'inherit', outline:'none'
            }}/>
            <span style={{ color:'#4b5563', fontSize:11 }}>–</span>
            <input type="number" placeholder="Max" value={filters.maxChg??''} onChange={e=>setF('maxChg',e.target.value!==''?+e.target.value:null)} style={{
              width:46, background:'#161b22', border:'1px solid #21262d', color:'#e6edf3', fontSize:11, padding:'3px 5px', borderRadius:4, fontFamily:'inherit', outline:'none'
            }}/>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
            <span style={{ fontSize:11, color:'#6b7280' }}>OI:</span>
            <select value={filters.oiDir} onChange={e=>setF('oiDir',e.target.value)} style={{
              background:'#161b22', border:'1px solid #21262d', color:'#8b949e', fontSize:11, padding:'4px 4px', borderRadius:4, fontFamily:'inherit'
            }}>
              <option value="any">Any</option>
              <option value="pos">Long/Short Buildup (OI↑)</option>
              <option value="neg">Covering/Unwinding (OI↓)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div style={{ flex:1, overflowY:'auto', overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead style={{ position:'sticky', top:0, zIndex:10, background:'#0d1117', borderBottom:'1px solid #21262d' }}>
            <tr>
              {[
                ['sym','Symbol',130], ['ltp','LTP',110], ['chg','Chg%',90],
                ['vol','Volume',90], ['volRatio','Vol×',70], ['vwap','VWAP',100],
                ['rsi','RSI',70], ['oiChgPct','OI Chg',80], [null,'Pattern',110]
              ].map(([key,label,w]) => (
                <th key={label} onClick={()=>key&&handleSort(key)} style={{
                  textAlign:'left', padding:'7px 10px', fontSize:11, fontWeight:500, color:'#6b7280',
                  cursor:key?'pointer':'default', whiteSpace:'nowrap', userSelect:'none', minWidth:w
                }}>{label}{key&&sort.key===key?(sort.dir<0?' ↓':' ↑'):''}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {results.map(s => {
              const fl = flash[s.sym]
              const pos = s.chg>=0
              const rsiC = s.rsi>70?'#ef4444':s.rsi<30?'#10b981':'#60a5fa'
              let pattern = null
              if (s.volRatio>=2.5&&s.chg>1.5) pattern={label:'⚡ Breakout',bg:'rgba(16,185,129,0.1)',c:'#10b981',bc:'rgba(16,185,129,0.25)'}
              else if (s.chg<-1.5&&s.volRatio>=2) pattern={label:'↓ Breakdown',bg:'rgba(239,68,68,0.1)',c:'#ef4444',bc:'rgba(239,68,68,0.25)'}
              else if (s.rsi>72) pattern={label:'⚠ Overbought',bg:'rgba(245,158,11,0.1)',c:'#f59e0b',bc:'rgba(245,158,11,0.25)'}
              else if (s.rsi<30) pattern={label:'↑ Oversold',bg:'rgba(59,130,246,0.1)',c:'#60a5fa',bc:'rgba(59,130,246,0.25)'}
              else if (s.oiChgPct>8&&s.chg>0) pattern={label:'🔼 Long Buildup',bg:'rgba(6,182,212,0.1)',c:'#06b6d4',bc:'rgba(6,182,212,0.25)'}
              else if (s.oiChgPct>8&&s.chg<0) pattern={label:'🔽 Short Buildup',bg:'rgba(249,115,22,0.1)',c:'#f97316',bc:'rgba(249,115,22,0.25)'}

              return (
                <tr key={s.sym} onClick={()=>onSelect(s.sym)} style={{
                  borderBottom:'1px solid rgba(255,255,255,0.03)', cursor:'pointer',
                  background:fl==='up'?'rgba(16,185,129,0.06)':fl==='dn'?'rgba(239,68,68,0.06)':'',
                  transition:'background 0.3s'
                }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.025)'}
                  onMouseLeave={e=>e.currentTarget.style.background=''}
                >
                  <td style={{ padding:'6px 10px' }}>
                    <div style={{ fontWeight:700, color:'#e6edf3' }}>{s.sym}</div>
                    <div style={{ fontSize:9, color:'#6b7280' }}>{s.sector}</div>
                  </td>
                  <td style={{ padding:'6px 10px', fontWeight:700, color:fl==='up'?'#34d399':fl==='dn'?'#f87171':'#e6edf3' }}>{fP(s.ltp)}</td>
                  <td style={{ padding:'6px 10px', color:pos?'#10b981':'#ef4444', fontWeight:600 }}>{pos?'▲':'▼'} {fC(s.chg)}</td>
                  <td style={{ padding:'6px 10px', color:'#8b949e' }}>{fV(s.vol)}</td>
                  <td style={{ padding:'6px 10px' }}>
                    <span style={{ padding:'1px 5px', borderRadius:3, fontSize:10, fontWeight:600,
                      background:s.volRatio>=2?'rgba(245,158,11,0.12)':s.volRatio>=1.5?'rgba(59,130,246,0.12)':'transparent',
                      color:s.volRatio>=2?'#fbbf24':s.volRatio>=1.5?'#60a5fa':'#6b7280'
                    }}>{s.volRatio.toFixed(1)}×</span>
                  </td>
                  <td style={{ padding:'6px 10px' }}>
                    <div style={{ color:'#8b949e', fontSize:11 }}>{fP(s.vwap)}</div>
                    <div style={{ fontSize:9, color:s.aboveVwap?'#10b981':'#ef4444', fontWeight:600 }}>{s.aboveVwap?'▲ Above':'▼ Below'}</div>
                  </td>
                  <td style={{ padding:'6px 10px' }}>
                    <span style={{ color:rsiC, fontWeight:600 }}>{s.rsi}</span>
                  </td>
                  <td style={{ padding:'6px 10px' }}>
                    <span style={{ color:s.oiChgPct>=0?'#10b981':'#ef4444', fontWeight:600 }}>{s.oiChgPct>=0?'+':''}{s.oiChgPct.toFixed(1)}%</span>
                  </td>
                  <td style={{ padding:'6px 10px' }}>
                    {pattern && <span style={{ fontSize:9, padding:'2px 6px', borderRadius:3, background:pattern.bg, color:pattern.c, border:`1px solid ${pattern.bc}`, fontWeight:700 }}>{pattern.label}</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

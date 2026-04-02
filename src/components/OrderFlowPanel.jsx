import { useState } from 'react'
const fP = n => '₹'+Number(n).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})
const fV = n => n>=1e7?(n/1e7).toFixed(1)+'Cr':n>=1e5?(n/1e5).toFixed(1)+'L':n.toLocaleString()
const fD = n => (n>=0?'+':'')+n.toLocaleString()

// Mini candlestick SVG
function CandleChart({ candles }) {
  if (!candles || candles.length < 2) return null
  const W = 600, H = 140, pad = { l:40, r:10, t:10, b:20 }
  const cw = (W - pad.l - pad.r) / candles.length
  const prices = candles.flatMap(c => [c.high, c.low])
  const minP = Math.min(...prices), maxP = Math.max(...prices)
  const py = p => pad.t + (1 - (p - minP) / (maxP - minP)) * (H - pad.t - pad.b)

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:'block' }}>
      {/* Grid lines */}
      {[0,0.25,0.5,0.75,1].map(f => {
        const y = pad.t + f*(H-pad.t-pad.b)
        const price = maxP - f*(maxP-minP)
        return (
          <g key={f}>
            <line x1={pad.l} y1={y} x2={W-pad.r} y2={y} stroke="#21262d" strokeWidth="0.5"/>
            <text x={pad.l-4} y={y+4} textAnchor="end" fill="#4b5563" fontSize="9">{price.toFixed(0)}</text>
          </g>
        )
      })}
      {candles.map((c, i) => {
        const x = pad.l + i * cw + cw * 0.1
        const bw = cw * 0.8
        const ox = pad.l + i * cw + cw/2
        const isUp = c.close >= c.open
        const color = isUp ? '#10b981' : '#ef4444'
        const bodyTop = py(Math.max(c.open, c.close))
        const bodyBot = py(Math.min(c.open, c.close))
        const bodyH = Math.max(1, bodyBot - bodyTop)
        return (
          <g key={i}>
            <line x1={ox} y1={py(c.high)} x2={ox} y2={py(c.low)} stroke={color} strokeWidth="0.8"/>
            <rect x={x} y={bodyTop} width={bw} height={bodyH} fill={color} fillOpacity="0.85"/>
          </g>
        )
      })}
    </svg>
  )
}

// Delta bar chart
function DeltaChart({ candles }) {
  if (!candles || candles.length < 2) return null
  const W = 600, H = 70, pad = { l:40, r:10, t:5, b:15 }
  const deltas = candles.map(c => c.delta)
  const maxD = Math.max(...deltas.map(Math.abs)) || 1
  const bw = (W - pad.l - pad.r) / candles.length
  const midY = (H - pad.t - pad.b) / 2 + pad.t

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:'block' }}>
      <line x1={pad.l} y1={midY} x2={W-pad.r} y2={midY} stroke="#21262d" strokeWidth="0.5"/>
      <text x={pad.l-4} y={midY+4} textAnchor="end" fill="#4b5563" fontSize="8">0</text>
      {candles.map((c, i) => {
        const x = pad.l + i * bw + bw * 0.1
        const w = bw * 0.8
        const ratio = c.delta / maxD
        const h = Math.abs(ratio) * (midY - pad.t)
        const y = c.delta >= 0 ? midY - h : midY
        const color = c.delta >= 0 ? '#10b981' : '#ef4444'
        return <rect key={i} x={x} y={y} width={w} height={h} fill={color} fillOpacity="0.7"/>
      })}
    </svg>
  )
}

// CVD line chart
function CVDChart({ candles }) {
  if (!candles || candles.length < 2) return null
  const W = 600, H = 60, pad = { l:40, r:10, t:5, b:10 }
  const cvds = candles.map(c=>c.cvd)
  const minC = Math.min(...cvds), maxC = Math.max(...cvds)
  const range = maxC - minC || 1
  const py = v => pad.t + (1 - (v - minC) / range) * (H - pad.t - pad.b)
  const bw = (W - pad.l - pad.r) / (candles.length - 1)

  const points = candles.map((c,i) => `${pad.l + i*bw},${py(c.cvd)}`).join(' ')
  const lastCvd = cvds[cvds.length-1]
  const prevCvd = cvds[cvds.length-2]
  const color = lastCvd >= prevCvd ? '#10b981' : '#ef4444'

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:'block' }}>
      <line x1={pad.l} y1={H/2} x2={W-pad.r} y2={H/2} stroke="#21262d" strokeWidth="0.5"/>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5"/>
      <circle cx={pad.l+(candles.length-1)*bw} cy={py(lastCvd)} r="2.5" fill={color}/>
    </svg>
  )
}

export default function OrderFlowPanel({ stock, allStocks, onSelect }) {
  const [viewMode, setViewMode] = useState('candles') // candles | heatmap

  if (!stock) return <div style={{ padding:20, color:'#6b7280' }}>Select a stock</div>

  const candles = stock.candles || []
  const last = candles[candles.length-1]
  const totalBuy = candles.reduce((a,c)=>a+c.buyVol,0)
  const totalSell = candles.reduce((a,c)=>a+c.sellVol,0)
  const totalVol = totalBuy + totalSell
  const buyPct = totalVol ? (totalBuy/totalVol*100).toFixed(1) : 50
  const cumDelta = candles[candles.length-1]?.cvd || 0
  const deltaColor = cumDelta >= 0 ? '#10b981' : '#ef4444'
  const pos = stock.chg >= 0

  // OI buildup interpretation
  const oiSignal = stock.oiChgPct > 5 && stock.chg > 0 ? { text:'Long Buildup', color:'#10b981' }
    : stock.oiChgPct > 5 && stock.chg < 0 ? { text:'Short Buildup', color:'#ef4444' }
    : stock.oiChgPct < -5 && stock.chg > 0 ? { text:'Short Covering', color:'#8b5cf6' }
    : stock.oiChgPct < -5 && stock.chg < 0 ? { text:'Long Unwinding', color:'#f97316' }
    : { text:'Neutral', color:'#6b7280' }

  return (
    <div style={{ height:'100%', display:'grid', gridTemplateColumns:'1fr 280px', overflow:'hidden' }}>
      {/* Main chart area */}
      <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', borderRight:'1px solid #21262d' }}>
        {/* Stock selector + header */}
        <div style={{ padding:'8px 12px', borderBottom:'1px solid #21262d', display:'flex', alignItems:'center', gap:12, background:'#0a0e14', flexShrink:0 }}>
          <select value={stock.sym} onChange={e=>onSelect(e.target.value)} style={{
            background:'#161b22', border:'1px solid #30363d', color:'#e6edf3', fontSize:13,
            fontWeight:700, padding:'3px 8px', borderRadius:5, fontFamily:'inherit'
          }}>
            {allStocks.map(s=><option key={s.sym} value={s.sym}>{s.sym} — {s.name}</option>)}
          </select>
          <span style={{ fontSize:18, fontWeight:700, color:'#e6edf3' }}>{fP(stock.ltp)}</span>
          <span style={{ fontSize:13, fontWeight:600, color:pos?'#10b981':'#ef4444' }}>
            {pos?'▲':'▼'} {fP(Math.abs(stock.chgAbs))} ({pos?'+':''}{stock.chg.toFixed(2)}%)
          </span>
          <span style={{ fontSize:11, color:'#6b7280' }}>Lot: {stock.lot}</span>
          <div style={{ marginLeft:'auto', display:'flex', gap:4 }}>
            {['candles','heatmap'].map(m=>(
              <button key={m} onClick={()=>setViewMode(m)} style={{
                padding:'3px 8px', borderRadius:4, border:'1px solid', fontSize:11, fontFamily:'inherit', cursor:'pointer',
                background:viewMode===m?'rgba(59,130,246,0.15)':'transparent',
                borderColor:viewMode===m?'rgba(59,130,246,0.4)':'#21262d',
                color:viewMode===m?'#60a5fa':'#6b7280',
              }}>{m}</button>
            ))}
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'0 0 8px 0' }}>
          {/* 15-min Candle Chart */}
          <div style={{ padding:'6px 12px 2px', fontSize:10, color:'#6b7280', letterSpacing:0.5 }}>
            15-MIN OHLC  •  Last {candles.length} candles
          </div>
          <div style={{ padding:'0 8px' }}>
            <CandleChart candles={candles}/>
          </div>

          {/* Delta bars */}
          <div style={{ padding:'4px 12px 2px', fontSize:10, color:'#6b7280', letterSpacing:0.5, marginTop:4 }}>
            ORDER DELTA (BUY − SELL VOL per candle)
          </div>
          <div style={{ padding:'0 8px' }}>
            <DeltaChart candles={candles}/>
          </div>

          {/* CVD */}
          <div style={{ padding:'4px 12px 2px', fontSize:10, color:'#6b7280', letterSpacing:0.5 }}>
            CUMULATIVE VOLUME DELTA (CVD)
          </div>
          <div style={{ padding:'0 8px' }}>
            <CVDChart candles={candles}/>
          </div>

          {/* Candle table */}
          <div style={{ padding:'8px 12px 0', fontSize:10, color:'#6b7280', letterSpacing:0.5 }}>CANDLE-BY-CANDLE ORDER FLOW</div>
          <div style={{ overflowX:'auto', padding:'0 8px' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11, marginTop:4 }}>
              <thead>
                <tr style={{ borderBottom:'1px solid #21262d' }}>
                  {['Time','O','H','L','C','Vol','Buy Vol','Sell Vol','Delta','CVD'].map(h=>(
                    <th key={h} style={{ padding:'4px 8px', textAlign:'right', color:'#6b7280', fontWeight:500, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...candles].reverse().slice(0,15).map((c,i)=>{
                  const isUp = c.close >= c.open
                  const dPos = c.delta >= 0
                  const t = c.time instanceof Date ? c.time : new Date(c.time)
                  return (
                    <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding:'4px 8px', color:'#6b7280', textAlign:'right', whiteSpace:'nowrap', fontSize:10 }}>
                        {t.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit'})}
                      </td>
                      <td style={{ padding:'4px 8px', textAlign:'right', color:'#8b949e' }}>{c.open.toFixed(1)}</td>
                      <td style={{ padding:'4px 8px', textAlign:'right', color:'#10b981' }}>{c.high.toFixed(1)}</td>
                      <td style={{ padding:'4px 8px', textAlign:'right', color:'#ef4444' }}>{c.low.toFixed(1)}</td>
                      <td style={{ padding:'4px 8px', textAlign:'right', color:isUp?'#10b981':'#ef4444', fontWeight:600 }}>{c.close.toFixed(1)}</td>
                      <td style={{ padding:'4px 8px', textAlign:'right', color:'#8b949e' }}>{fV(c.vol)}</td>
                      <td style={{ padding:'4px 8px', textAlign:'right', color:'#10b981' }}>{fV(c.buyVol)}</td>
                      <td style={{ padding:'4px 8px', textAlign:'right', color:'#ef4444' }}>{fV(c.sellVol)}</td>
                      <td style={{ padding:'4px 8px', textAlign:'right', color:dPos?'#10b981':'#ef4444', fontWeight:600 }}>
                        {dPos?'+':''}{fV(c.delta)}
                      </td>
                      <td style={{ padding:'4px 8px', textAlign:'right', color:c.cvd>=0?'#10b981':'#ef4444' }}>
                        {c.cvd>=0?'+':''}{fV(Math.round(c.cvd))}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right panel — stats */}
      <div style={{ overflowY:'auto', padding:'10px' }}>
        {/* Live flow stats */}
        <div style={{ background:'#161b22', border:'1px solid #21262d', borderRadius:8, padding:'10px', marginBottom:8 }}>
          <div style={{ fontSize:10, color:'#6b7280', marginBottom:8, letterSpacing:0.5 }}>LIVE ORDER FLOW</div>
          {/* Buy/Sell bar */}
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, marginBottom:4 }}>
            <span style={{ color:'#10b981', fontWeight:700 }}>{buyPct}% Buy</span>
            <span style={{ color:'#ef4444', fontWeight:700 }}>{(100-buyPct).toFixed(1)}% Sell</span>
          </div>
          <div style={{ height:8, background:'#ef4444', borderRadius:4, overflow:'hidden', marginBottom:8 }}>
            <div style={{ width:`${buyPct}%`, height:'100%', background:'#10b981', transition:'width 0.5s' }}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
            {[
              { label:'Total Buy Vol', val:fV(totalBuy), color:'#10b981' },
              { label:'Total Sell Vol', val:fV(totalSell), color:'#ef4444' },
              { label:'Net Delta', val:fD(Math.round(cumDelta)), color:deltaColor },
              { label:'Vol Ratio', val:stock.volRatio.toFixed(2)+'×', color:stock.volRatio>=2?'#fbbf24':'#8b949e' },
            ].map(item => (
              <div key={item.label} style={{ background:'#0d1117', borderRadius:5, padding:'6px 8px' }}>
                <div style={{ fontSize:9, color:'#6b7280', marginBottom:2 }}>{item.label}</div>
                <div style={{ fontSize:13, fontWeight:700, color:item.color }}>{item.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* OI Analysis */}
        <div style={{ background:'#161b22', border:'1px solid #21262d', borderRadius:8, padding:'10px', marginBottom:8 }}>
          <div style={{ fontSize:10, color:'#6b7280', marginBottom:8, letterSpacing:0.5 }}>OI ANALYSIS</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
            {[
              { label:'Open Interest', val:fV(stock.oi), color:'#e6edf3' },
              { label:'OI Change', val:(stock.oiChgPct>0?'+':'')+stock.oiChgPct.toFixed(2)+'%', color:stock.oiChgPct>0?'#10b981':'#ef4444' },
              { label:'Prev OI', val:fV(stock.prevOi), color:'#8b949e' },
              { label:'Signal', val:oiSignal.text, color:oiSignal.color },
            ].map(item=>(
              <div key={item.label} style={{ background:'#0d1117', borderRadius:5, padding:'6px 8px' }}>
                <div style={{ fontSize:9, color:'#6b7280', marginBottom:2 }}>{item.label}</div>
                <div style={{ fontSize:12, fontWeight:700, color:item.color }}>{item.val}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop:8, padding:'6px 8px', background:'#0d1117', borderRadius:5, border:`1px solid ${oiSignal.color}30` }}>
            <div style={{ fontSize:9, color:'#6b7280', marginBottom:2 }}>INTERPRETATION</div>
            <div style={{ fontSize:11, color:oiSignal.color, fontWeight:600 }}>{oiSignal.text}</div>
            <div style={{ fontSize:10, color:'#6b7280', marginTop:2 }}>
              {oiSignal.text==='Long Buildup'&&'OI↑ + Price↑ → Fresh long positions being added'}
              {oiSignal.text==='Short Buildup'&&'OI↑ + Price↓ → Fresh short positions being added'}
              {oiSignal.text==='Short Covering'&&'OI↓ + Price↑ → Shorts exiting, possible squeeze'}
              {oiSignal.text==='Long Unwinding'&&'OI↓ + Price↓ → Longs exiting, bearish pressure'}
              {oiSignal.text==='Neutral'&&'No strong OI signal currently'}
            </div>
          </div>
        </div>

        {/* Price stats */}
        <div style={{ background:'#161b22', border:'1px solid #21262d', borderRadius:8, padding:'10px' }}>
          <div style={{ fontSize:10, color:'#6b7280', marginBottom:8, letterSpacing:0.5 }}>PRICE STATS</div>
          {[
            { label:'Open', val:fP(stock.open) },
            { label:'High', val:fP(stock.high), color:'#10b981' },
            { label:'Low',  val:fP(stock.low),  color:'#ef4444' },
            { label:'Prev Close', val:fP(stock.prev) },
            { label:'VWAP', val:fP(stock.vwap) },
            { label:'RSI(14)', val:stock.rsi, color:stock.rsi>70?'#ef4444':stock.rsi<30?'#10b981':'#60a5fa' },
            { label:'Volume', val:fV(stock.vol) },
            { label:'Avg Vol(20d)', val:fV(stock.avgVol) },
          ].map(item=>(
            <div key={item.label} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize:11, color:'#6b7280' }}>{item.label}</span>
              <span style={{ fontSize:11, fontWeight:600, color:item.color||'#e6edf3' }}>{item.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

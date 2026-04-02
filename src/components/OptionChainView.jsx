import { useState } from 'react'

const fP = n => Number(n).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2})
const fV = n => n>=1e5?(n/1e5).toFixed(1)+'L':n.toLocaleString()

const INDEX_OPTS = ['NIFTY','BANKNIFTY','FINNIFTY','MIDCPNIFTY']

export default function OptionChainView({ data, symbol, stocks, onSymbolChange }) {
  const [expiry, setExpiry] = useState('current')
  const [highlightStrike, setHighlightStrike] = useState(null)

  const fnoSyms = stocks.map(s=>s.sym)
  const allSyms = [...INDEX_OPTS, ...fnoSyms]

  if (!data) return <div style={{ padding:20, color:'#6b7280' }}>Loading option chain...</div>

  const { chain, underlyingPrice, atm, pcr, maxPain, totalCallOI, totalPutOI } = data

  const pcrColor = pcr > 1.3 ? '#10b981' : pcr < 0.7 ? '#ef4444' : '#f59e0b'
  const pcrSentiment = pcr > 1.5 ? 'Extremely Oversold — Bullish' : pcr > 1.3 ? 'Oversold — Bullish Bias'
    : pcr > 0.9 ? 'Neutral' : pcr > 0.7 ? 'Overbought — Bearish Bias' : 'Extremely Overbought — Bearish'

  const maxCallOI = Math.max(...chain.map(r=>r.callOI))
  const maxPutOI  = Math.max(...chain.map(r=>r.putOI))

  return (
    <div style={{ height:'100%', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'8px 14px', borderBottom:'1px solid #21262d', display:'flex', alignItems:'center', gap:12, background:'#0a0e14', flexShrink:0, flexWrap:'wrap' }}>
        <select value={symbol} onChange={e=>onSymbolChange(e.target.value)} style={{
          background:'#161b22', border:'1px solid #30363d', color:'#e6edf3', fontSize:13,
          fontWeight:700, padding:'3px 8px', borderRadius:5, fontFamily:'inherit'
        }}>
          {INDEX_OPTS.map(s=><option key={s}>{s}</option>)}
          <optgroup label="F&O Stocks">
            {fnoSyms.slice(0,50).map(s=><option key={s}>{s}</option>)}
          </optgroup>
        </select>
        <span style={{ fontSize:16, fontWeight:700, color:'#e6edf3' }}>₹{underlyingPrice.toLocaleString('en-IN')}</span>
        <span style={{ fontSize:11, color:'#6b7280' }}>ATM: {atm}</span>

        {/* Stats row */}
        <div style={{ display:'flex', gap:16, marginLeft:'auto', flexWrap:'wrap' }}>
          {[
            { label:'PCR', val:pcr.toFixed(3), color:pcrColor },
            { label:'Max Pain', val:maxPain?.toLocaleString(), color:'#a78bfa' },
            { label:'Total Call OI', val:fV(totalCallOI), color:'#ef4444' },
            { label:'Total Put OI',  val:fV(totalPutOI),  color:'#10b981' },
          ].map(item=>(
            <div key={item.label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:9, color:'#6b7280' }}>{item.label}</div>
              <div style={{ fontSize:13, fontWeight:700, color:item.color }}>{item.val}</div>
            </div>
          ))}
          <div style={{ padding:'4px 10px', borderRadius:5, background:`${pcrColor}15`, border:`1px solid ${pcrColor}30`, fontSize:11, color:pcrColor, fontWeight:600, display:'flex', alignItems:'center' }}>
            {pcrSentiment}
          </div>
        </div>
      </div>

      {/* Chain table */}
      <div style={{ flex:1, overflowY:'auto', overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
          <thead style={{ position:'sticky', top:0, zIndex:10, background:'#0d1117' }}>
            <tr>
              <th colSpan={5} style={{ padding:'6px 10px', textAlign:'center', color:'#ef4444', borderBottom:'1px solid #21262d', background:'rgba(239,68,68,0.05)' }}>
                ← CALLS
              </th>
              <th style={{ padding:'6px 16px', textAlign:'center', color:'#a78bfa', borderBottom:'1px solid #21262d', background:'rgba(139,92,246,0.1)', whiteSpace:'nowrap' }}>
                STRIKE
              </th>
              <th colSpan={5} style={{ padding:'6px 10px', textAlign:'center', color:'#10b981', borderBottom:'1px solid #21262d', background:'rgba(16,185,129,0.05)' }}>
                PUTS →
              </th>
            </tr>
            <tr style={{ borderBottom:'1px solid #21262d' }}>
              {['OI Chg','OI','IV','Vol','LTP'].map(h=>(
                <th key={h} style={{ padding:'5px 8px', textAlign:'right', color:'#6b7280', fontWeight:500 }}>{h}</th>
              ))}
              <th style={{ padding:'5px 12px', textAlign:'center', color:'#a78bfa', fontWeight:700 }}>Strike</th>
              {['LTP','Vol','IV','OI','OI Chg'].map(h=>(
                <th key={h} style={{ padding:'5px 8px', textAlign:'left', color:'#6b7280', fontWeight:500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chain.map(row => {
              const isATM = row.strike === atm
              const isMaxPain = row.strike === maxPain
              const isHL = row.strike === highlightStrike
              const callBarW = (row.callOI / maxCallOI * 100).toFixed(0)
              const putBarW  = (row.putOI  / maxPutOI  * 100).toFixed(0)

              return (
                <tr key={row.strike}
                  onMouseEnter={()=>setHighlightStrike(row.strike)}
                  onMouseLeave={()=>setHighlightStrike(null)}
                  style={{
                    borderBottom:'1px solid rgba(255,255,255,0.03)',
                    background: isATM ? 'rgba(139,92,246,0.08)' : isMaxPain ? 'rgba(245,158,11,0.06)' : isHL ? 'rgba(255,255,255,0.02)' : '',
                    cursor:'default',
                  }}>
                  {/* Call OI Chg */}
                  <td style={{ padding:'5px 8px', textAlign:'right', color:row.callOIChg>=0?'#10b981':'#ef4444', fontSize:10 }}>
                    {row.callOIChg>=0?'+':''}{fV(row.callOIChg)}
                  </td>
                  {/* Call OI bar */}
                  <td style={{ padding:'5px 8px', textAlign:'right', position:'relative', minWidth:80 }}>
                    <div style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', width:`${callBarW}%`, maxWidth:60, height:14, background:'rgba(239,68,68,0.2)', borderRadius:2 }}/>
                    <span style={{ position:'relative', color:'#e6edf3' }}>{fV(row.callOI)}</span>
                  </td>
                  <td style={{ padding:'5px 8px', textAlign:'right', color:'#8b949e' }}>{row.callIV}%</td>
                  <td style={{ padding:'5px 8px', textAlign:'right', color:'#6b7280' }}>{fV(row.callLTP*100|0)}</td>
                  <td style={{ padding:'5px 8px', textAlign:'right', color:'#ef4444', fontWeight:600 }}>{fP(row.callLTP)}</td>

                  {/* Strike */}
                  <td style={{ padding:'5px 14px', textAlign:'center', fontWeight:700,
                    color: isATM ? '#a78bfa' : isMaxPain ? '#f59e0b' : '#e6edf3',
                    fontSize: isATM ? 13 : 12,
                    background: isATM ? 'rgba(139,92,246,0.12)' : '',
                    whiteSpace:'nowrap',
                  }}>
                    {row.strike.toLocaleString()}
                    {isATM && <span style={{ fontSize:8, marginLeft:4, color:'#a78bfa' }}>ATM</span>}
                    {isMaxPain && <span style={{ fontSize:8, marginLeft:4, color:'#f59e0b' }}>⚡MP</span>}
                  </td>

                  {/* Put LTP */}
                  <td style={{ padding:'5px 8px', color:'#10b981', fontWeight:600 }}>{fP(row.putLTP)}</td>
                  <td style={{ padding:'5px 8px', color:'#6b7280' }}>{fV(row.putLTP*100|0)}</td>
                  <td style={{ padding:'5px 8px', color:'#8b949e' }}>{row.putIV}%</td>
                  {/* Put OI bar */}
                  <td style={{ padding:'5px 8px', position:'relative', minWidth:80 }}>
                    <div style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', width:`${putBarW}%`, maxWidth:60, height:14, background:'rgba(16,185,129,0.2)', borderRadius:2 }}/>
                    <span style={{ position:'relative', color:'#e6edf3' }}>{fV(row.putOI)}</span>
                  </td>
                  <td style={{ padding:'5px 8px', color:row.putOIChg>=0?'#10b981':'#ef4444', fontSize:10 }}>
                    {row.putOIChg>=0?'+':''}{fV(row.putOIChg)}
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

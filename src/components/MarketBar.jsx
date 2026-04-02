export default function MarketBar({ stocks }) {
  const adv = stocks.filter(s=>s.chg>0).length
  const dec = stocks.filter(s=>s.chg<0).length
  const indices = [
    { label:'NIFTY 50', val:'24,892', chg:0.84 },
    { label:'SENSEX',   val:'81,894', chg:0.76 },
    { label:'BANKNIFTY',val:'52,341', chg:-0.22 },
    { label:'FINNIFTY', val:'23,456', chg:0.45 },
    { label:'INDIA VIX', val:'13.82', chg:-2.14 },
  ]
  return (
    <div style={{ background:'#0a0e14', borderBottom:'1px solid #21262d', padding:'5px 14px', display:'flex', gap:24, alignItems:'center', overflowX:'auto', flexShrink:0 }}>
      {indices.map(i => (
        <div key={i.label} style={{ display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}>
          <span style={{ fontSize:10, color:'#6b7280' }}>{i.label}</span>
          <span style={{ fontSize:12, fontWeight:700, color:'#e6edf3' }}>{i.val}</span>
          <span style={{ fontSize:11, color: i.chg>=0 ? '#10b981':'#ef4444', fontWeight:600 }}>
            {i.chg>=0?'+':''}{i.chg.toFixed(2)}%
          </span>
        </div>
      ))}
      <div style={{ marginLeft:'auto', display:'flex', gap:12, fontSize:11, whiteSpace:'nowrap' }}>
        <span style={{ color:'#10b981' }}>▲ {adv} Adv</span>
        <span style={{ color:'#ef4444' }}>▼ {dec} Dec</span>
        <span style={{ color:'#6b7280' }}>{stocks.length-adv-dec} Unch</span>
      </div>
    </div>
  )
}

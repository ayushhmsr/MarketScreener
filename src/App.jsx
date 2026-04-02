import { useState, useEffect, useRef, useCallback } from 'react'
import { initStocks, tickStock, generateSignal, generateOptionChain, computeSectors, closeCandle } from './data/engine'
import { SECTORS, INDEX_FILTERS } from './data/universe'
import StockTable from './components/StockTable'
import SignalFeed from './components/SignalFeed'
import SectorHeatmap from './components/SectorHeatmap'
import OrderFlowPanel from './components/OrderFlowPanel'
import OptionChainView from './components/OptionChainView'
import MarketBar from './components/MarketBar'
import Screener from './components/Screener'

const TABS = ['Dashboard','Screener','Order Flow','Option Chain','Signals']

export default function App() {
  const [stocks, setStocks]         = useState(() => initStocks())
  const [signals, setSignals]       = useState([])
  const [sectors, setSectors]       = useState([])
  const [activeTab, setActiveTab]   = useState('Dashboard')
  const [filterIndex, setFilterIndex] = useState('All F&O')
  const [filterSector, setFilterSector] = useState('All')
  const [searchQ, setSearchQ]       = useState('')
  const [sortCfg, setSortCfg]       = useState({ key: 'chg', dir: -1 })
  const [flash, setFlash]           = useState({})
  const [optionData, setOptionData] = useState(null)
  const [optionSym, setOptionSym]   = useState('NIFTY')
  const [selectedSym, setSelectedSym] = useState(null)
  const prevPrices = useRef({})

  useEffect(() => { setSectors(computeSectors(stocks)) }, [])

  useEffect(() => {
    const t = setInterval(() => {
      setStocks(prev => {
        const nf = {}
        const next = prev.map(s => {
          const ns = tickStock(s)
          if (prevPrices.current[s.sym] !== undefined)
            nf[s.sym] = ns.ltp > prevPrices.current[s.sym] ? 'up' : ns.ltp < prevPrices.current[s.sym] ? 'dn' : null
          prevPrices.current[s.sym] = ns.ltp
          return ns
        })
        setFlash(nf)
        setTimeout(() => setFlash({}), 420)
        return next
      })
    }, 1500)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setStocks(prev => { setSectors(computeSectors(prev)); return prev }), 8000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => {
      setStocks(prev => { setSignals(s => [generateSignal(prev), ...s].slice(0,60)); return prev })
    }, 7000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const t = setInterval(() => setStocks(prev => prev.map(closeCandle)), 30000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const price = optionSym === 'NIFTY' ? 24892 : optionSym === 'BANKNIFTY' ? 52341
      : optionSym === 'FINNIFTY' ? 23456 : stocks.find(s => s.sym === optionSym)?.ltp || 20000
    setOptionData(generateOptionChain(price, optionSym))
  }, [optionSym])

  useEffect(() => {
    const t = setInterval(() => {
      setOptionData(prev => prev ? { ...prev, underlyingPrice: +(prev.underlyingPrice * (1+(Math.random()-0.49)*0.001)).toFixed(2) } : prev)
    }, 3000)
    return () => clearInterval(t)
  }, [])

  const handleSort = useCallback((key) => {
    setSortCfg(prev => prev.key === key ? { key, dir: prev.dir*-1 } : { key, dir: -1 })
  }, [])

  const filteredStocks = useCallback(() => {
    let list = stocks
    if (filterIndex !== 'All F&O') list = list.filter(s => INDEX_FILTERS[filterIndex]?.includes(s.sym))
    if (filterSector !== 'All')    list = list.filter(s => s.sector === filterSector)
    if (searchQ) {
      const q = searchQ.toUpperCase()
      list = list.filter(s => s.sym.includes(q) || s.name.toUpperCase().includes(q))
    }
    const { key, dir } = sortCfg
    return [...list].sort((a,b) => key==='sym' ? dir*a.sym.localeCompare(b.sym) : dir*((a[key]||0)-(b[key]||0)))
  }, [stocks, filterIndex, filterSector, searchQ, sortCfg])

  const ofStock = selectedSym ? stocks.find(s=>s.sym===selectedSym) : stocks[0]

  const nav = (sym) => { setSelectedSym(sym); setActiveTab('Order Flow') }

  return (
    <div style={{ fontFamily:"'JetBrains Mono','Fira Code',monospace", background:'#0d1117', color:'#e6edf3', height:'100vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* NAV */}
      <nav style={{ background:'#161b22', borderBottom:'1px solid #21262d', padding:'0 14px', display:'flex', alignItems:'center', gap:14, height:46, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:26, height:26, background:'linear-gradient(135deg,#3b82f6,#7c3aed)', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><polyline points="1,10 4,5 7,8 10,3 13,6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span style={{ fontWeight:700, fontSize:13, letterSpacing:-0.4 }}>MarketPulse</span>
          <span style={{ fontSize:9, fontWeight:700, padding:'1px 5px', background:'rgba(124,58,237,0.2)', color:'#a78bfa', border:'1px solid rgba(124,58,237,0.3)', borderRadius:3 }}>PRO</span>
        </div>
        <div style={{ display:'flex', gap:2 }}>
          {TABS.map(t => (
            <button key={t} onClick={()=>setActiveTab(t)} style={{
              padding:'4px 11px', borderRadius:5, border:'none', cursor:'pointer', fontSize:12, fontFamily:'inherit',
              background: activeTab===t ? 'rgba(255,255,255,0.08)' : 'transparent',
              color: activeTab===t ? '#e6edf3' : '#6b7280', transition:'all 0.12s'
            }}>{t}</button>
          ))}
        </div>
        <div style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#10b981', display:'inline-block', animation:'pulse 2s infinite' }}/>
          <span style={{ fontSize:11, color:'#10b981', fontWeight:600 }}>Live</span>
          <span style={{ fontSize:11, color:'#4b5563' }}>{stocks.length} F&O</span>
        </div>
      </nav>

      <MarketBar stocks={stocks} />

      <div style={{ flex:1, overflow:'hidden' }}>
        {activeTab==='Dashboard' && (
          <div style={{ height:'100%', display:'grid', gridTemplateColumns:'1fr 248px', overflow:'hidden' }}>
            <div style={{ display:'flex', flexDirection:'column', overflow:'hidden', borderRight:'1px solid #21262d' }}>
              {/* Filter bar */}
              <div style={{ padding:'6px 10px', borderBottom:'1px solid #21262d', display:'flex', gap:5, flexWrap:'wrap', alignItems:'center', background:'#0a0e14', flexShrink:0 }}>
                {Object.keys(INDEX_FILTERS).map(idx => (
                  <button key={idx} onClick={()=>setFilterIndex(idx)} style={{
                    padding:'2px 7px', borderRadius:4, border:'1px solid', cursor:'pointer', fontSize:10, fontFamily:'inherit',
                    borderColor: filterIndex===idx ? 'rgba(59,130,246,0.5)' : 'transparent',
                    background: filterIndex===idx ? 'rgba(59,130,246,0.12)' : 'transparent',
                    color: filterIndex===idx ? '#60a5fa' : '#6b7280',
                  }}>{idx}</button>
                ))}
                <div style={{ width:1, height:14, background:'#21262d' }}/>
                <select value={filterSector} onChange={e=>setFilterSector(e.target.value)} style={{
                  background:'#161b22', border:'1px solid #21262d', color:'#8b949e', fontSize:11, padding:'2px 5px', borderRadius:4, fontFamily:'inherit'
                }}>
                  <option value="All">All Sectors</option>
                  {SECTORS.map(s=><option key={s}>{s}</option>)}
                </select>
                <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search..." style={{
                  background:'#161b22', border:'1px solid #21262d', color:'#e6edf3', fontSize:11,
                  padding:'2px 7px', borderRadius:4, fontFamily:'inherit', width:110, outline:'none'
                }}/>
                <span style={{ marginLeft:'auto', fontSize:11, color:'#4b5563' }}>{filteredStocks().length} stocks</span>
              </div>
              <StockTable stocks={filteredStocks()} flash={flash} sortCfg={sortCfg} onSort={handleSort} onSelect={nav} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div style={{ padding:'7px 10px', borderBottom:'1px solid #21262d', fontSize:10, fontWeight:600, color:'#6b7280', letterSpacing:0.5 }}>SECTOR STRENGTH</div>
              <SectorHeatmap sectors={sectors} />
            </div>
          </div>
        )}

        {activeTab==='Screener' && (
          <Screener stocks={stocks} flash={flash} onSelect={nav} />
        )}

        {activeTab==='Order Flow' && (
          <OrderFlowPanel stock={ofStock} allStocks={stocks} onSelect={sym=>{setSelectedSym(sym)}} />
        )}

        {activeTab==='Option Chain' && (
          <OptionChainView data={optionData} symbol={optionSym} stocks={stocks} onSymbolChange={setOptionSym} />
        )}

        {activeTab==='Signals' && (
          <SignalFeed signals={signals} stocks={stocks} onSelect={nav} />
        )}
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </div>
  )
}

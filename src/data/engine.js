import { FNO_STOCKS } from './universe';

// ── Initialize stock state ────────────────────────────────────────
export function initStocks() {
  return FNO_STOCKS.map(s => {
    const chg = (Math.random() - 0.48) * 4;
    const ltp = +(s.base * (1 + chg / 100)).toFixed(2);
    const vwap = +(ltp * (1 + (Math.random() - 0.5) * 0.008)).toFixed(2);
    const avgVol = Math.floor(s.lot * (50 + Math.random() * 200));
    const vol = Math.floor(avgVol * (0.3 + Math.random() * 1.8));
    const oi = Math.floor(s.lot * (200 + Math.random() * 800));
    const prevOi = Math.floor(oi * (0.9 + Math.random() * 0.2));
    return {
      ...s,
      ltp, vwap,
      open: +(s.base * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2),
      high: +(ltp * 1.012).toFixed(2),
      low:  +(ltp * 0.988).toFixed(2),
      prev: s.base,
      chg:  +chg.toFixed(2),
      chgAbs: +(ltp - s.base).toFixed(2),
      vol, avgVol,
      volRatio: +(vol / avgVol).toFixed(2),
      aboveVwap: ltp > vwap,
      rsi: +(30 + Math.random() * 55).toFixed(1),
      oi, prevOi,
      oiChgPct: +((oi - prevOi) / prevOi * 100).toFixed(2),
      // Order flow state
      buyVol: Math.floor(vol * (0.4 + Math.random() * 0.2)),
      sellVol: 0,
      delta: 0,
      cvd: (Math.random() - 0.5) * vol * 0.3,
      // 15-min candles (last 20)
      candles: generateCandles(s.base, 20),
      // Flash state
      flash: null,
    };
  });
}

function generateCandles(base, count) {
  const candles = [];
  let price = base * (1 - 0.015);
  const now = Date.now();
  for (let i = count; i >= 0; i--) {
    const open = price;
    const chg = (Math.random() - 0.48) * 1.5;
    const close = +(open * (1 + chg / 100)).toFixed(2);
    const high = +(Math.max(open, close) * (1 + Math.random() * 0.005)).toFixed(2);
    const low  = +(Math.min(open, close) * (1 - Math.random() * 0.005)).toFixed(2);
    const vol  = Math.floor(Math.random() * 500000 + 50000);
    const buyV = Math.floor(vol * (0.35 + Math.random() * 0.3));
    const sellV = vol - buyV;
    candles.push({
      time: new Date(now - i * 15 * 60 * 1000),
      open, high, low, close,
      vol, buyVol: buyV, sellVol: sellV,
      delta: buyV - sellV,
      cvd: 0,
    });
    price = close;
  }
  // cumulative delta
  let cum = 0;
  candles.forEach(c => { cum += c.delta; c.cvd = cum; });
  return candles;
}

// ── Tick update ───────────────────────────────────────────────────
export function tickStock(s) {
  const tick = (Math.random() - 0.49) * 0.6;
  const ltp = +(s.ltp * (1 + tick / 100)).toFixed(2);
  const chg = +((ltp - s.prev) / s.prev * 100).toFixed(2);
  const chgAbs = +(ltp - s.prev).toFixed(2);
  const high = Math.max(s.high, ltp);
  const low  = Math.min(s.low, ltp);

  // Order flow update
  const tickVol = Math.floor(Math.random() * 5000 + 500);
  const isBuy = ltp > s.ltp;
  const buyAdd  = isBuy ? tickVol : Math.floor(tickVol * 0.3);
  const sellAdd = isBuy ? Math.floor(tickVol * 0.3) : tickVol;
  const buyVol  = s.buyVol + buyAdd;
  const sellVol = s.sellVol + sellAdd;
  const delta   = buyVol - sellVol;
  const cvd     = s.cvd + (isBuy ? buyAdd - sellAdd : -(sellAdd - buyAdd));

  const volRatio = +(s.vol / Math.max(s.avgVol, 1)).toFixed(2);
  const aboveVwap = ltp > s.vwap;

  return {
    ...s,
    ltp, chg, chgAbs, high, low,
    vol: s.vol + tickVol,
    volRatio,
    aboveVwap,
    buyVol, sellVol, delta, cvd,
    flash: ltp > s.ltp ? 'up' : ltp < s.ltp ? 'dn' : null,
  };
}

// ── 15-min candle close ────────────────────────────────────────────
export function closeCandle(s) {
  const prev = s.candles[s.candles.length - 1];
  const newClose = s.ltp;
  const updatedPrev = { ...prev, close: newClose, high: Math.max(prev.high, newClose), low: Math.min(prev.low, newClose) };
  const newCandle = {
    time: new Date(),
    open: newClose,
    high: newClose,
    low: newClose,
    close: newClose,
    vol: 0, buyVol: 0, sellVol: 0, delta: 0, cvd: prev.cvd,
  };
  const candles = [...s.candles.slice(0, -1), updatedPrev, newCandle].slice(-21);
  return { ...s, candles };
}

// ── Signal generator ───────────────────────────────────────────────
const SIG_TYPES = {
  bullish_breakout: { label: "Bullish Breakout", color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.25)" },
  bearish_breakdown: { label: "Bearish Breakdown", color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.25)" },
  volume_breakout:  { label: "Volume Breakout", color: "#3b82f6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.25)" },
  high_momentum:    { label: "High Momentum", color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.25)" },
  long_buildup:     { label: "Long Buildup", color: "#06b6d4", bg: "rgba(6,182,212,0.1)", border: "rgba(6,182,212,0.25)" },
  short_buildup:    { label: "Short Buildup", color: "#f97316", bg: "rgba(249,115,22,0.1)", border: "rgba(249,115,22,0.25)" },
  short_covering:   { label: "Short Covering", color: "#8b5cf6", bg: "rgba(139,92,246,0.1)", border: "rgba(139,92,246,0.25)" },
};

export { SIG_TYPES };

export function generateSignal(stocks) {
  const s = stocks[Math.floor(Math.random() * stocks.length)];
  const keys = Object.keys(SIG_TYPES);

  // Pick signal type based on stock state
  let type;
  if (s.chg > 2 && s.volRatio > 2)    type = 'bullish_breakout';
  else if (s.chg < -2 && s.volRatio > 2) type = 'bearish_breakdown';
  else if (s.volRatio > 2.5)           type = 'volume_breakout';
  else if (s.oiChgPct > 5 && s.chg > 0) type = 'long_buildup';
  else if (s.oiChgPct > 5 && s.chg < 0) type = 'short_buildup';
  else if (s.oiChgPct < -5 && s.chg > 0) type = 'short_covering';
  else                                 type = keys[Math.floor(Math.random() * keys.length)];

  const conf = Math.min(98, Math.max(52, 60 + Math.random() * 35));
  const reasons = {
    bullish_breakout: `Gap up ${Math.abs(s.chg).toFixed(1)}% | Vol ${s.volRatio.toFixed(1)}x avg | Above VWAP`,
    bearish_breakdown: `Gap down ${Math.abs(s.chg).toFixed(1)}% | Vol ${s.volRatio.toFixed(1)}x avg | Below VWAP`,
    volume_breakout: `Vol spike ${s.volRatio.toFixed(1)}x avg | Price action strong | RSI ${s.rsi}`,
    high_momentum: `RSI ${s.rsi} | Momentum accelerating | Vol ${s.volRatio.toFixed(1)}x`,
    long_buildup: `OI +${s.oiChgPct.toFixed(1)}% | Price ↑ | Fresh longs accumulating`,
    short_buildup: `OI +${s.oiChgPct.toFixed(1)}% | Price ↓ | Short positions building`,
    short_covering: `OI ${s.oiChgPct.toFixed(1)}% | Price ↑ | Short squeeze possible`,
  };

  return {
    id: Date.now() + Math.random(),
    sym: s.sym, name: s.name, sector: s.sector,
    type, ...SIG_TYPES[type],
    conf: +conf.toFixed(1),
    price: s.ltp, lot: s.lot,
    reason: reasons[type] || "Pattern detected",
    at: new Date(),
  };
}

// ── Option chain generator ────────────────────────────────────────
export function generateOptionChain(underlyingPrice, symbol) {
  const atm = Math.round(underlyingPrice / 50) * 50;
  const strikes = [];
  for (let i = -10; i <= 10; i++) strikes.push(atm + i * 50);

  let totalCallOI = 0, totalPutOI = 0;
  const chain = strikes.map(strike => {
    const dist = Math.abs(strike - underlyingPrice);
    const atmFactor = Math.exp(-dist / (underlyingPrice * 0.03));

    const callOI = Math.floor((50000 + Math.random() * 200000) * (strike > underlyingPrice ? atmFactor * 2 : atmFactor));
    const putOI  = Math.floor((50000 + Math.random() * 200000) * (strike < underlyingPrice ? atmFactor * 2 : atmFactor));
    const callOIChg = Math.floor((Math.random() - 0.4) * callOI * 0.15);
    const putOIChg  = Math.floor((Math.random() - 0.4) * putOI * 0.15);

    const callIV = 15 + (dist / underlyingPrice) * 300 + Math.random() * 3;
    const putIV  = 15 + (dist / underlyingPrice) * 300 + Math.random() * 3;

    const intrinsicCall = Math.max(0, underlyingPrice - strike);
    const intrinsicPut  = Math.max(0, strike - underlyingPrice);
    const callLTP = +(intrinsicCall + (callIV / 100) * underlyingPrice * 0.1 + Math.random() * 5).toFixed(2);
    const putLTP  = +(intrinsicPut  + (putIV  / 100) * underlyingPrice * 0.1 + Math.random() * 5).toFixed(2);

    totalCallOI += callOI;
    totalPutOI  += putOI;

    return {
      strike, isATM: strike === atm,
      callOI, callOIChg, callLTP, callIV: +callIV.toFixed(1),
      putOI,  putOIChg,  putLTP,  putIV:  +putIV.toFixed(1),
    };
  });

  const pcr = +(totalPutOI / totalCallOI).toFixed(3);
  // Max pain = strike where total pain for buyers is minimum
  let minPain = Infinity, maxPain = atm;
  strikes.forEach(test => {
    let pain = 0;
    chain.forEach(r => {
      pain += Math.max(0, test - r.strike) * r.callOI;
      pain += Math.max(0, r.strike - test) * r.putOI;
    });
    if (pain < minPain) { minPain = pain; maxPain = test; }
  });

  return { symbol, underlyingPrice, atm, pcr, maxPain, totalCallOI, totalPutOI, chain };
}

// ── Sector strength ────────────────────────────────────────────────
export function computeSectors(stocks) {
  const map = {};
  stocks.forEach(s => {
    if (!map[s.sector]) map[s.sector] = { changes: [], volRatios: [], adv: 0, dec: 0 };
    map[s.sector].changes.push(s.chg);
    map[s.sector].volRatios.push(s.volRatio);
    if (s.chg > 0) map[s.sector].adv++;
    else map[s.sector].dec++;
  });
  return Object.entries(map).map(([sector, d]) => {
    const avg = d.changes.reduce((a,b) => a+b, 0) / d.changes.length;
    const avgVol = d.volRatios.reduce((a,b) => a+b, 0) / d.volRatios.length;
    const breadth = (d.adv - d.dec) / (d.adv + d.dec);
    const strength = Math.max(-100, Math.min(100, avg * 10 + breadth * 40 + Math.min(avgVol-1, 2)*10));
    return { sector, avg: +avg.toFixed(2), strength: +strength.toFixed(1), adv: d.adv, dec: d.dec, count: d.adv+d.dec, avgVol: +avgVol.toFixed(2) };
  }).sort((a,b) => b.strength - a.strength);
}

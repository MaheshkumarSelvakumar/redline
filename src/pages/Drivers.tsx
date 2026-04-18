import { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'

interface StandingEntry {
  position: string; points: string; wins: string
  Driver?: { code: string }; driver?: { abbreviation: string }
}
interface Driver {
  driver_number: number; first_name: string; last_name: string
  name_acronym: string; headshot_url: string; team_name: string
  team_colour: string; country_code: string
  position?: number; points?: number; wins?: number
}

const RACE_LINES = Array.from({ length: 12 }, (_, i) => ({
  top: `${5 + i * 8}%`, duration: 1.5 + (i % 3) * 0.55,
  delay: (i * 0.38) % 3.2, width: `${18 + (i % 5) * 13}%`, bold: i % 4 === 0,
}))

export default function Drivers() {
  const [drivers, setDrivers]         = useState<Driver[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading]         = useState(true)
  const [busy, setBusy]               = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef     = useRef<HTMLImageElement>(null)
  const coverRef     = useRef<HTMLDivElement>(null)
  const numberRef    = useRef<HTMLDivElement>(null)
  const firstRef     = useRef<HTMLDivElement>(null)
  const lastRef      = useRef<HTMLDivElement>(null)
  const metaRef      = useRef<HTMLDivElement>(null)
  const flashRef     = useRef<HTMLDivElement>(null)
  const stripRef     = useRef<HTMLDivElement>(null)
  const cursorRef    = useRef<HTMLDivElement>(null)
  const dotRef       = useRef<HTMLDivElement>(null)
  const posRef       = useRef<HTMLSpanElement>(null)
  const ptsRef       = useRef<HTMLSpanElement>(null)
  const winsRef      = useRef<HTMLSpanElement>(null)

  // ── CSS ───────────────────────────────────────────
  useEffect(() => {
    const s = document.createElement('style')
    s.id = 'drv-css'
    s.textContent = `
      @keyframes dRace {
        0%{transform:translateX(-160%);opacity:0}
        8%{opacity:1}92%{opacity:1}
        100%{transform:translateX(135vw);opacity:0}
      }
      @keyframes dTicker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
      .drv-ticker { animation: dTicker 28s linear infinite; }
    `
    document.head.appendChild(s)
    return () => { document.getElementById('drv-css')?.remove() }
  }, [])

  // ── Fonts ─────────────────────────────────────────
  useEffect(() => {
    const l = document.createElement('link')
    l.rel = 'stylesheet'
    l.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap'
    document.head.appendChild(l)
  }, [])

  // ── Cursor + parallax ─────────────────────────────
  useEffect(() => {
    const cursor = cursorRef.current
    const dot    = dotRef.current
    if (!cursor || !dot) return

    // FIX: initialise at screen centre so cursor is visible before first mousemove
    gsap.set(cursor, { x: window.innerWidth / 2,  y: window.innerHeight / 2 })
    gsap.set(dot,    { x: window.innerWidth / 2,  y: window.innerHeight / 2 })

    const xCur = gsap.quickTo(cursor, 'x', { duration: 0.55, ease: 'power3.out' })
    const yCur = gsap.quickTo(cursor, 'y', { duration: 0.55, ease: 'power3.out' })
    const xDot = gsap.quickTo(dot, 'x', { duration: 0.08 })
    const yDot = gsap.quickTo(dot, 'y', { duration: 0.08 })

    // Lazy quickTo for parallax — elements may not exist yet
    let xNum: ReturnType<typeof gsap.quickTo> | null = null
    let yNum: ReturnType<typeof gsap.quickTo> | null = null
    let xImg: ReturnType<typeof gsap.quickTo> | null = null
    let yImg: ReturnType<typeof gsap.quickTo> | null = null

    const onMove = (e: MouseEvent) => {
      xCur(e.clientX); yCur(e.clientY)
      xDot(e.clientX); yDot(e.clientY)
      const rx = (e.clientX / window.innerWidth  - 0.5) * 2
      const ry = (e.clientY / window.innerHeight - 0.5) * 2
      if (!xNum && numberRef.current) {
        xNum = gsap.quickTo(numberRef.current, 'x', { duration: 1.1, ease: 'power2.out' })
        yNum = gsap.quickTo(numberRef.current, 'y', { duration: 1.1, ease: 'power2.out' })
      }
      if (!xImg && imageRef.current) {
        xImg = gsap.quickTo(imageRef.current, 'x', { duration: 0.85, ease: 'power2.out' })
        yImg = gsap.quickTo(imageRef.current, 'y', { duration: 0.85, ease: 'power2.out' })
      }
      xNum?.(rx * 30);  yNum?.(ry * 15)
      xImg?.(-rx * 20); yImg?.(-ry * 10)
    }
    window.addEventListener('mousemove', onMove)

    const grow   = () => gsap.to(cursor, { scale: 2.2, duration: 0.3 })
    const shrink = () => gsap.to(cursor, { scale: 1,   duration: 0.3 })
    document.querySelectorAll('a,button').forEach(el => {
      el.addEventListener('mouseenter', grow)
      el.addEventListener('mouseleave', shrink)
    })

    return () => {
      window.removeEventListener('mousemove', onMove)
      document.querySelectorAll('a,button').forEach(el => {
        el.removeEventListener('mouseenter', grow)
        el.removeEventListener('mouseleave', shrink)
      })
    }
  }, [])

  // ── Count-up ──────────────────────────────────────
  const countUp = useCallback((el: HTMLSpanElement | null, to: number) => {
    if (!el) return
    const o = { n: 0 }
    gsap.to(o, { n: to, duration: 1.9, ease: 'power2.out',
      onUpdate: () => { if (el) el.textContent = String(Math.round(o.n)) } })
  }, [])

  // ── Fetch ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res  = await fetch('https://api.openf1.org/v1/drivers?session_key=latest')
        const data: Driver[] = await res.json()
        const map: Record<number, Driver> = {}
        data.forEach(d => { map[d.driver_number] = d })
        try {
          const sr = await fetch('https://api.jolpi.ca/ergast/f1/current/driverStandings.json')
          const sd = await sr.json()
          const list: StandingEntry[] = sd?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? []
          list.forEach(s => {
            const abbr = s?.Driver?.code ?? s?.driver?.abbreviation ?? ''
            const m = Object.values(map).find(d => d.name_acronym === abbr)
            if (m) { m.position = +s.position; m.points = +s.points; m.wins = +s.wins }
          })
        } catch { /* standings optional */ }
        const order: Record<string, number> = {
          'Mercedes':1,'Ferrari':2,'McLaren':3,'Red Bull Racing':4,
          'Audi':5,'Haas F1 Team':6,'Racing Bulls':7,'Williams':8,
          'Aston Martin':9,'Alpine':10,'Cadillac':11,
        }
        const sorted = Object.values(map).filter(d => d.first_name)
          .sort((a, b) => {
            const oa = order[a.team_name]??99, ob = order[b.team_name]??99
            return oa !== ob ? oa - ob : a.driver_number - b.driver_number
          })
        setDrivers(sorted)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  // ── Entrance animation ────────────────────────────
  useEffect(() => {
    if (loading || !drivers.length) return
    const d = drivers[0]

    // Cover reveals the image (top-down wipe)
    gsap.set(coverRef.current, { scaleY: 1, transformOrigin: 'top center' })
    gsap.to(coverRef.current, { scaleY: 0, duration: 1.1, delay: 0.3, ease: 'power3.inOut' })

    // Set initial hidden states for text (outside ctx so StrictMode doesn't kill them)
    gsap.set('.d-fc',        { y: 100, rotateX: -80, opacity: 0 })
    gsap.set('.d-lc',        { y: 100, rotateX: -80, opacity: 0 })
    gsap.set(metaRef.current,  { y: 30, opacity: 0 })
    gsap.set('.d-stat',      { y: 22, opacity: 0 })
    gsap.set('.sel-btn',     { y: 24, opacity: 0 })
    gsap.set(numberRef.current, { opacity: 0, scale: 1.1 })

    const tl = gsap.timeline({ delay: 0.2 })
    tl.to(numberRef.current, { opacity:1, scale:1, duration:1, ease:'power3.out' })
      .to('.d-fc',  { y:0, rotateX:0, opacity:1, duration:0.65, stagger:0.038, ease:'back.out(1.7)' }, '-=0.7')
      .to('.d-lc',  { y:0, rotateX:0, opacity:1, duration:0.65, stagger:0.038, ease:'back.out(1.7)' }, '-=0.52')
      .to(metaRef.current, { y:0, opacity:1, duration:0.5, ease:'power3.out' }, '-=0.4')
      .to('.d-stat', { y:0, opacity:1, duration:0.4, stagger:0.08 }, '-=0.3')
      .to('.sel-btn', { y:0, opacity:1, duration:0.4, stagger:0.02, ease:'power2.out' }, '-=0.3')

    countUp(posRef.current, d.position??0)
    countUp(ptsRef.current, d.points??0)
    countUp(winsRef.current, d.wins??0)
  }, [loading, drivers.length, countUp])

  // ── Switch ─────────────────────────────────────────
  const switchTo = useCallback((index: number) => {
    if (busy || index === activeIndex || !drivers[index]) return
    setBusy(true)
    const dir  = index > activeIndex ? 1 : -1
    const next = drivers[index]
    const nc   = `#${next.team_colour || 'dc2626'}`

    // Flash
    if (flashRef.current) {
      flashRef.current.style.background = nc
      gsap.fromTo(flashRef.current, { opacity: 0.15 }, { opacity: 0, duration: 0.6, ease: 'power2.out' })
    }

    // Cover hides image (bottom-up)
    gsap.to(coverRef.current, { scaleY: 1, duration: 0.3, ease: 'power3.in', transformOrigin: 'bottom center' })

    // Exit text
    gsap.to('.d-fc',  { y: dir * -80, opacity: 0, duration: 0.22, stagger: 0.015 })
    gsap.to('.d-lc',  { y: dir * -80, opacity: 0, duration: 0.22, stagger: 0.015 })
    gsap.to(metaRef.current, { x: dir * -50, opacity: 0, duration: 0.25 })
    gsap.to('.d-stat', { y: -18, opacity: 0, duration: 0.18, stagger: 0.04 })
    gsap.to(numberRef.current, { opacity: 0, scale: 0.9, duration: 0.25 })

    setTimeout(() => {
      setActiveIndex(index)
      setBusy(false)
      // Double rAF ensures React has finished re-rendering before we animate
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Reveal new image
          gsap.set(coverRef.current, { scaleY: 1, transformOrigin: 'top center' })
          gsap.to(coverRef.current, { scaleY: 0, duration: 0.8, ease: 'power3.inOut' })

          // Enter text
          gsap.fromTo(numberRef.current,
            { opacity: 0, scale: 1.08 }, { opacity: 1, scale: 1, duration: 0.75, ease: 'power3.out' })
          gsap.fromTo('.d-fc',
            { y: dir * 90, rotateX: -60, opacity: 0 },
            { y: 0, rotateX: 0, opacity: 1, duration: 0.55, stagger: 0.03, ease: 'back.out(1.5)' })
          gsap.fromTo('.d-lc',
            { y: dir * 90, rotateX: -60, opacity: 0 },
            { y: 0, rotateX: 0, opacity: 1, duration: 0.55, stagger: 0.03, ease: 'back.out(1.5)', delay: 0.06 })
          gsap.fromTo(metaRef.current,
            { x: dir * 50, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5 })
          gsap.fromTo('.d-stat',
            { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, delay: 0.12 })

          countUp(posRef.current,  next.position??0)
          countUp(ptsRef.current,  next.points??0)
          countUp(winsRef.current, next.wins??0)
        })
      })
    }, 300)
  }, [busy, activeIndex, drivers, countUp])

  // ── Keyboard ──────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') switchTo(Math.min(activeIndex+1, drivers.length-1))
      if (e.key === 'ArrowLeft')  switchTo(Math.max(activeIndex-1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [switchTo, activeIndex, drivers.length])

  // ── Strip scroll ──────────────────────────────────
  useEffect(() => {
    stripRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeIndex])

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#070707', display:'flex', alignItems:'center', justifyContent:'center', cursor:'none' }}>
      <span style={{ fontFamily:'monospace', color:'rgba(220,38,38,0.7)', fontSize:'0.7rem', letterSpacing:'0.4em', textTransform:'uppercase' }}>
        Loading Grid...
      </span>
    </div>
  )
  if (!drivers.length) return (
    <div style={{ minHeight:'100vh', background:'#070707', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span style={{ fontFamily:'monospace', color:'rgba(255,255,255,0.3)', fontSize:'0.7rem', letterSpacing:'0.3em' }}>No driver data</span>
    </div>
  )

  const d  = drivers[activeIndex]
  const tc = `#${d.team_colour || 'dc2626'}`
  const tickerText = `${d.first_name.toUpperCase()} ${d.last_name.toUpperCase()}`

  return (
    <>
      {/* ── Custom cursor ── FIX: marginLeft/Top centering instead of transform */}
      <div ref={cursorRef} style={{
        position:'fixed', top:0, left:0,
        width:38, height:38,
        marginLeft:-19, marginTop:-19,
        border:`2px solid ${tc}`,
        borderRadius:'50%', pointerEvents:'none', zIndex:9999,
        transition:'border-color 0.5s',
      }}/>
      <div ref={dotRef} style={{
        position:'fixed', top:0, left:0,
        width:6, height:6,
        marginLeft:-3, marginTop:-3,
        background:tc, borderRadius:'50%',
        pointerEvents:'none', zIndex:9999,
        boxShadow:`0 0 10px ${tc}`,
        transition:'background 0.5s, box-shadow 0.5s',
      }}/>

      {/* Flash */}
      <div ref={flashRef} style={{ position:'fixed', inset:0, zIndex:200, pointerEvents:'none', opacity:0 }}/>

      <div ref={containerRef} style={{
        minHeight:'100vh', background:'#070707',
        display:'flex', flexDirection:'column',
        overflow:'hidden', paddingTop:64, position:'relative', cursor:'none',
      }}>

        {/* Grain */}
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.042, pointerEvents:'none', zIndex:6 }}>
          <filter id="dg3">
            <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#dg3)"/>
        </svg>

        {/* Glow layers */}
        <div style={{ position:'absolute', inset:0, zIndex:1, pointerEvents:'none', background:`radial-gradient(ellipse 65% 75% at 75% 50%, ${tc}25 0%, transparent 65%)`, transition:'background 0.9s' }}/>
        <div style={{ position:'absolute', inset:0, zIndex:1, pointerEvents:'none', background:`radial-gradient(ellipse 30% 30% at 8% 12%, ${tc}10 0%, transparent 55%)`, transition:'background 0.9s' }}/>
        <div style={{ position:'absolute', inset:0, zIndex:2, pointerEvents:'none', background:'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 28%, rgba(0,0,0,0.93) 100%)' }}/>

        {/* Racing lines in team color */}
        <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:3 }}>
          {RACE_LINES.map((ln, i) => (
            <div key={i} style={{
              position:'absolute', top:ln.top, left:0,
              height:ln.bold?'2px':'1px', width:ln.width,
              background:`linear-gradient(90deg, transparent, ${tc}${ln.bold?'bb':'44'} 45%, transparent)`,
              boxShadow:ln.bold?`0 0 12px ${tc}55`:'none',
              animationName:'dRace', animationDuration:`${ln.duration}s`,
              animationDelay:`${ln.delay}s`, animationTimingFunction:'linear',
              animationIterationCount:'infinite',
            } as React.CSSProperties}/>
          ))}
        </div>

        {/* Kinetic background name (Buttermax-inspired) */}
        <div style={{ position:'absolute', top:'50%', left:0, right:0, transform:'translateY(-50%)', overflow:'hidden', zIndex:2, pointerEvents:'none', opacity:0.025, userSelect:'none' }}>
          <div className="drv-ticker" style={{ display:'flex', whiteSpace:'nowrap' }}>
            {[...Array(6)].map((_, i) => (
              <span key={i} style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'clamp(8rem,18vw,22rem)', color:'#fff', letterSpacing:'0.05em', padding:'0 4vw' }}>{tickerText}</span>
            ))}
          </div>
        </div>

        {/* Hero */}
        <div style={{ flex:1, display:'flex', position:'relative', zIndex:10, minHeight:0 }}>

          {/* Number watermark */}
          <div ref={numberRef} style={{
            position:'absolute', inset:0, zIndex:2,
            display:'flex', alignItems:'center', justifyContent:'flex-end',
            paddingRight:'1%', pointerEvents:'none', userSelect:'none',
          }}>
            <span style={{
              fontFamily:"'Bebas Neue',sans-serif",
              fontSize:'clamp(14rem,32vw,40rem)',
              lineHeight:1, color:'transparent',
              WebkitTextStroke:`1.5px ${tc}18`,
              letterSpacing:'-0.04em',
            }}>{d.driver_number}</span>
          </div>

          {/* Left panel */}
          <div style={{
            width:'40%', display:'flex', flexDirection:'column',
            justifyContent:'center', padding:'0 2rem 3rem 4rem',
            position:'relative', zIndex:10,
          }}>

            {/* Badges */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:32 }}>
              {d.country_code && (
                <span style={{ padding:'5px 14px', border:`1px solid ${tc}65`, fontFamily:"'Space Mono',monospace", fontSize:'0.56rem', letterSpacing:'0.42em', color:tc, textTransform:'uppercase' }}>{d.country_code}</span>
              )}
              <span style={{ padding:'5px 14px', border:'1px solid rgba(255,255,255,0.09)', fontFamily:"'Space Mono',monospace", fontSize:'0.56rem', letterSpacing:'0.3em', color:'rgba(255,255,255,0.28)', textTransform:'uppercase' }}>No. {d.driver_number}</span>
            </div>

            {/* First name — letter by letter */}
            <div ref={firstRef} style={{ perspective:'600px', overflow:'hidden' }}>
              {d.first_name.split('').map((ch, i) => (
                <span key={`fn-${d.first_name}-${i}`} className="d-fc" style={{ display:'inline-block', fontFamily:"'Bebas Neue',sans-serif", fontSize:'clamp(3.2rem,5.8vw,7rem)', lineHeight:0.9, color:'rgba(255,255,255,0.93)', letterSpacing:'-0.01em' }}>{ch}</span>
              ))}
            </div>

            {/* Last name — team color */}
            <div ref={lastRef} style={{ perspective:'600px', overflow:'hidden', marginBottom:30 }}>
              {d.last_name.toUpperCase().split('').map((ch, i) => (
                <span key={`ln-${d.last_name}-${i}`} className="d-lc" style={{ display:'inline-block', fontFamily:"'Bebas Neue',sans-serif", fontSize:'clamp(3.2rem,5.8vw,7rem)', lineHeight:0.9, color:tc, letterSpacing:'-0.01em', textShadow:`0 0 100px ${tc}55` }}>{ch}</span>
              ))}
            </div>

            {/* Meta */}
            <div ref={metaRef}>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.52rem', letterSpacing:'0.42em', color:'rgba(255,255,255,0.2)', textTransform:'uppercase', marginBottom:5 }}>Constructor</div>
              <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.7rem', letterSpacing:'0.18em', color:'rgba(255,255,255,0.58)', textTransform:'uppercase' }}>{d.team_name}</div>
              <div style={{ width:60, height:2, marginTop:22, background:`linear-gradient(90deg, ${tc}, transparent)`, boxShadow:`0 0 24px ${tc}90`, transition:'background 0.7s' }}/>
            </div>

            {/* Stats — FIX: P same font size as number */}
            <div style={{ marginTop:26, display:'flex', gap:30 }}>
              {[
                { sub:'Position', ref:posRef,  isP:true  },
                { sub:'Points',   ref:ptsRef,  isP:false },
                { sub:'Wins',     ref:winsRef, isP:false },
              ].map((s, i) => (
                <div key={i} className="d-stat">
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'2.6rem', lineHeight:1, color:tc, textShadow:`0 0 40px ${tc}65`, display:'flex', alignItems:'baseline' }}>
                    {s.isP && <span style={{ fontSize:'2.6rem', marginRight:1 }}>P</span>}
                    <span ref={s.ref}>—</span>
                  </div>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.47rem', letterSpacing:'0.36em', color:'rgba(255,255,255,0.2)', textTransform:'uppercase', marginTop:4 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Nav hint */}
            <div style={{ marginTop:38, display:'flex', gap:12, alignItems:'center', fontFamily:"'Space Mono',monospace", fontSize:'0.47rem', letterSpacing:'0.32em', color:'rgba(255,255,255,0.14)', textTransform:'uppercase' }}>
              <span style={{ color:tc, opacity:0.7 }}>←</span>
              <span>Navigate drivers</span>
              <span style={{ color:tc, opacity:0.7 }}>→</span>
              <span style={{ marginLeft:12, color:'rgba(255,255,255,0.07)' }}>{activeIndex+1} / {drivers.length}</span>
            </div>
          </div>

          {/* Right — photo with cover reveal */}
          <div style={{ flex:1, display:'flex', alignItems:'flex-end', justifyContent:'center', position:'relative', zIndex:5 }}>

            {/* Vertical accent line */}
            <div style={{ position:'absolute', top:'8%', bottom:'8%', right:'12%', width:1, background:`linear-gradient(180deg, transparent, ${tc}45 30%, ${tc}45 70%, transparent)`, transition:'background 0.8s' }}/>

            {/* Image + cover */}
            <div style={{ position:'relative', display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
              <img
                ref={imageRef}
                src={d.headshot_url?.replace(/\.transform\/.+$/, '')}
                alt={`${d.first_name} ${d.last_name}`}
                style={{
                  height:'80vh', maxHeight:720,
                  objectFit:'contain', objectPosition:'bottom center',
                  filter:`drop-shadow(0 0 90px ${tc}35) drop-shadow(0 30px 60px rgba(0,0,0,0.97))`,
                  display:'block', transition:'filter 0.8s',
                }}
                onError={e => {
                  const img = e.target as HTMLImageElement
                  img.src = `https://placehold.co/400x600/111/222?text=${d.name_acronym}`
                }}
              />
              {/* Cover div — GSAP controls scaleY: 1=hidden, 0=revealed */}
              <div ref={coverRef} style={{
                position:'absolute', inset:0,
                background:'#070707',
                transformOrigin:'top center',
              }}/>
            </div>

            {/* Ground fade */}
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:150, background:'linear-gradient(0deg, #070707 0%, transparent 100%)', zIndex:6, pointerEvents:'none' }}/>
          </div>
        </div>

        {/* Selector strip */}
        <div ref={stripRef} style={{
          position:'relative', zIndex:20,
          borderTop:`1px solid ${tc}20`,
          background:'rgba(5,5,5,0.98)', backdropFilter:'blur(20px)',
          display:'flex', gap:2, padding:'0.65rem 1.5rem',
          overflowX:'auto', scrollbarWidth:'none',
          transition:'border-color 0.8s',
        }}>
          {drivers.map((drv, i) => {
            const color  = `#${drv.team_colour || 'dc2626'}`
            const active = i === activeIndex
            return (
              <button
                key={drv.driver_number}
                data-index={i}
                className="sel-btn"
                onClick={() => switchTo(i)}
                style={{
                  flex:'0 0 auto', cursor:'none', outline:'none',
                  background: active ? `${color}22` : 'transparent',
                  border:`1px solid ${active ? color : 'rgba(255,255,255,0.05)'}`,
                  padding:'0.5rem 0.8rem',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:3,
                  minWidth:62, transition:'all 0.2s',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    const el = e.currentTarget
                    el.style.borderColor = `${color}55`
                    el.style.background  = `${color}12`
                    gsap.to(el, { y: -3, duration: 0.2 })
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    const el = e.currentTarget
                    el.style.borderColor = 'rgba(255,255,255,0.05)'
                    el.style.background  = 'transparent'
                    gsap.to(el, { y: 0, duration: 0.5, ease: 'elastic.out(1,0.4)' })
                  }
                }}
              >
                <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.4rem', lineHeight:1, color:active?color:'rgba(255,255,255,0.22)', textShadow:active?`0 0 20px ${color}`:'none', transition:'all 0.25s' }}>{drv.driver_number}</span>
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.42rem', letterSpacing:'0.12em', color:active?'rgba(255,255,255,0.65)':'rgba(255,255,255,0.16)', textTransform:'uppercase', transition:'color 0.25s' }}>{drv.name_acronym}</span>
                {active && <div style={{ width:'100%', height:2, background:color, boxShadow:`0 0 14px ${color}` }}/>}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
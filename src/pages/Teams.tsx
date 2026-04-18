import { useEffect, useRef, useState, useCallback } from 'react'
import { gsap } from 'gsap'

interface Driver {
  driver_number: number; first_name: string; last_name: string
  name_acronym: string; headshot_url: string; team_name: string; team_colour: string
}
interface Team {
  name: string; colour: string; drivers: Driver[]
  position?: number; points?: number; wins?: number
}
interface StandingEntry {
  position: string; points: string; wins: string; Constructor: { name: string }
}

const TEAM_ORDER = ['Mercedes','Ferrari','McLaren','Red Bull Racing','Audi','Haas F1 Team','Racing Bulls','Williams','Aston Martin','Alpine','Cadillac']

const CONSTRUCTOR_MAP: Record<string, string> = {
  'Mercedes':'Mercedes','Ferrari':'Ferrari','McLaren':'McLaren','Red Bull':'Red Bull Racing',
  'Audi':'Audi','Haas F1 Team':'Haas F1 Team','RB F1 Team':'Racing Bulls','Racing Bulls':'Racing Bulls',
  'Williams':'Williams','Aston Martin':'Aston Martin','Alpine F1 Team':'Alpine','Alpine':'Alpine','Cadillac':'Cadillac',
}

const TEAM_ABBREVS: Record<string, string> = {
  'Mercedes':'AMG','Ferrari':'SF','McLaren':'MCL','Red Bull Racing':'RBR',
  'Audi':'AUDI','Haas F1 Team':'HAAS','Racing Bulls':'RB','Williams':'WIL',
  'Aston Martin':'AMF1','Alpine':'ALP','Cadillac':'CAD',
}

const RACE_LINES = Array.from({ length: 14 }, (_, i) => ({
  top:`${3+i*6.8}%`, duration:1.4+(i%3)*0.6,
  delay:(i*0.35)%3, width:`${22+(i%4)*14}%`, bold:i%5===0,
}))

export default function Teams() {
  const [teams, setTeams]             = useState<Team[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading]         = useState(true)
  const [busy, setBusy]               = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const nameRef      = useRef<HTMLDivElement>(null)
  const statsRef     = useRef<HTMLDivElement>(null)
  const watermarkRef = useRef<HTMLDivElement>(null)
  const flashRef     = useRef<HTMLDivElement>(null)
  const curtainRef   = useRef<HTMLDivElement>(null)
  const stripRef     = useRef<HTMLDivElement>(null)
  const cursorRef    = useRef<HTMLDivElement>(null)
  const dotRef       = useRef<HTMLDivElement>(null)
  // Dual image refs
  const img0Ref      = useRef<HTMLImageElement>(null)
  const img1Ref      = useRef<HTMLImageElement>(null)
  const cover0Ref    = useRef<HTMLDivElement>(null)
  const cover1Ref    = useRef<HTMLDivElement>(null)
  const wrap0Ref     = useRef<HTMLDivElement>(null)
  const wrap1Ref     = useRef<HTMLDivElement>(null)
  // Stats
  const posRef       = useRef<HTMLSpanElement>(null)
  const ptsRef       = useRef<HTMLSpanElement>(null)
  const winsRef      = useRef<HTMLSpanElement>(null)

  // ── CSS ───────────────────────────────────────────
  useEffect(() => {
    const s = document.createElement('style')
    s.id = 'teams-css3'
    s.textContent = `
      @keyframes tRace {
        0%{transform:translateX(-160%);opacity:0}
        8%{opacity:1}92%{opacity:1}
        100%{transform:translateX(135vw);opacity:0}
      }
      @keyframes tTicker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
      .t-ticker { animation: tTicker 32s linear infinite; }
    `
    document.head.appendChild(s)
    return () => { document.getElementById('teams-css3')?.remove() }
  }, [])

  // ── Fonts ─────────────────────────────────────────
  useEffect(() => {
    const l = document.createElement('link')
    l.rel = 'stylesheet'
    l.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap'
    document.head.appendChild(l)
  }, [])

  // ── Cursor + dual-image parallax ─────────────────
  useEffect(() => {
    const cursor = cursorRef.current
    const dot    = dotRef.current
    if (!cursor || !dot) return

    // FIX: initialise at screen centre so cursor is visible immediately
    gsap.set(cursor, { x: window.innerWidth / 2,  y: window.innerHeight / 2 })
    gsap.set(dot,    { x: window.innerWidth / 2,  y: window.innerHeight / 2 })

    const xCur = gsap.quickTo(cursor, 'x', { duration: 0.55, ease: 'power3.out' })
    const yCur = gsap.quickTo(cursor, 'y', { duration: 0.55, ease: 'power3.out' })
    const xDot = gsap.quickTo(dot, 'x', { duration: 0.08 })
    const yDot = gsap.quickTo(dot, 'y', { duration: 0.08 })

    // Parallax on wrap divs (separate from cover/reveal on images)
    let xW0: ReturnType<typeof gsap.quickTo> | null = null
    let yW0: ReturnType<typeof gsap.quickTo> | null = null
    let xW1: ReturnType<typeof gsap.quickTo> | null = null
    let yW1: ReturnType<typeof gsap.quickTo> | null = null
    let xWm: ReturnType<typeof gsap.quickTo> | null = null

    const onMove = (e: MouseEvent) => {
      xCur(e.clientX); yCur(e.clientY)
      xDot(e.clientX); yDot(e.clientY)
      const rx = (e.clientX / window.innerWidth  - 0.5) * 2
      const ry = (e.clientY / window.innerHeight - 0.5) * 2
      if (!xW0 && wrap0Ref.current) {
        xW0 = gsap.quickTo(wrap0Ref.current, 'x', { duration: 0.9,  ease: 'power2.out' })
        yW0 = gsap.quickTo(wrap0Ref.current, 'y', { duration: 0.9,  ease: 'power2.out' })
        xW1 = gsap.quickTo(wrap1Ref.current, 'x', { duration: 1.2,  ease: 'power2.out' })
        yW1 = gsap.quickTo(wrap1Ref.current, 'y', { duration: 1.2,  ease: 'power2.out' })
        xWm = gsap.quickTo(watermarkRef.current, 'x', { duration: 1.4, ease: 'power2.out' })
      }
      // Driver 1: stronger parallax (foreground)
      xW0?.(-rx * 25); yW0?.(-ry * 12)
      // Driver 2: weaker (background depth) — creates 3D illusion
      xW1?.(-rx * 14); yW1?.(-ry * 7)
      xWm?.(rx * 18)
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
        const dm: Record<number, Driver> = {}
        data.forEach(d => { dm[d.driver_number] = d })
        const unique = Object.values(dm).filter(d => d.first_name)
        const teamMap: Record<string, Team> = {}
        unique.forEach(d => {
          if (!teamMap[d.team_name]) teamMap[d.team_name] = { name:d.team_name, colour:d.team_colour, drivers:[] }
          teamMap[d.team_name].drivers.push(d)
        })
        const sorted = Object.values(teamMap).sort((a, b) => {
          const ai = TEAM_ORDER.indexOf(a.name), bi = TEAM_ORDER.indexOf(b.name)
          return (ai===-1?99:ai) - (bi===-1?99:bi)
        })
        try {
          const sr = await fetch('https://api.jolpi.ca/ergast/f1/current/constructorStandings.json')
          const sd = await sr.json()
          const list: StandingEntry[] = sd?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? []
          list.forEach(s => {
            const n = CONSTRUCTOR_MAP[s.Constructor.name] ?? s.Constructor.name
            const t = sorted.find(t => t.name === n)
            if (t) { t.position=+s.position; t.points=+s.points; t.wins=+s.wins }
          })
        } catch { /* standings optional */ }
        setTeams(sorted)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  // ── Entrance animation ────────────────────────────
  useEffect(() => {
    if (loading || !teams.length) return
    const t = teams[0]

    // FIX: Cover reveals are set via GSAP, NOT inline style
    // This prevents React re-renders from resetting clip/transform
    gsap.set([cover0Ref.current, cover1Ref.current], { scaleY: 1, transformOrigin: 'top center' })
    gsap.to(cover0Ref.current, { scaleY: 0, duration: 1.15, delay: 0.5, ease: 'power3.inOut' })
    gsap.to(cover1Ref.current, { scaleY: 0, duration: 1.15, delay: 0.65, ease: 'power3.inOut' })

    // Text initial states
    gsap.set('.t-nc',        { y: 110, rotateX: -80, opacity: 0 })
    gsap.set(statsRef.current, { y: 30, opacity: 0 })
    gsap.set('.t-stat',      { y: 20, opacity: 0 })
    gsap.set('.team-btn',    { y: 26, opacity: 0 })
    gsap.set(watermarkRef.current, { opacity: 0, scale: 1.1 })

    const tl = gsap.timeline({ delay: 0.3 })
    tl.to(watermarkRef.current, { opacity:1, scale:1, duration:1.1, ease:'power3.out' })
      .to('.t-nc',    { y:0, rotateX:0, opacity:1, duration:0.65, stagger:0.035, ease:'back.out(1.7)' }, '-=0.8')
      .to(statsRef.current,  { y:0, opacity:1, duration:0.55, ease:'power3.out' }, '-=0.4')
      .to('.t-stat',  { y:0, opacity:1, duration:0.4, stagger:0.08 }, '-=0.3')
      .to('.team-btn', { y:0, opacity:1, duration:0.45, stagger:0.05, ease:'power2.out' }, '-=0.3')

    countUp(posRef.current,  t.position??0)
    countUp(ptsRef.current,  t.points??0)
    countUp(winsRef.current, t.wins??0)
  }, [loading, teams.length, countUp])

  // ── Switch with curtain wipe ──────────────────────
  const switchTo = useCallback((index: number) => {
    if (busy || index === activeIndex || !teams[index]) return
    setBusy(true)
    const dir  = index > activeIndex ? 1 : -1
    const next = teams[index]
    const nc   = `#${next.colour || 'dc2626'}`

    // Flash
    if (flashRef.current) {
      flashRef.current.style.background = nc
      gsap.fromTo(flashRef.current, { opacity: 0.16 }, { opacity: 0, duration: 0.65, ease: 'power2.out' })
    }

    // Covers hide current images (bottom-up)
    gsap.to([cover0Ref.current, cover1Ref.current], {
      scaleY: 1, duration: 0.32, ease: 'power3.in',
      transformOrigin: 'bottom center',
    })

    // Curtain wipe across screen in new team color
    if (curtainRef.current) {
      curtainRef.current.style.background = nc
      gsap.fromTo(curtainRef.current,
        { scaleX: 0, transformOrigin: dir > 0 ? 'left center' : 'right center' },
        { scaleX: 1, duration: 0.28, ease: 'power3.inOut' })
    }

    // Exit text
    gsap.to('.t-nc',     { y: dir * -70, opacity: 0, duration: 0.22, stagger: 0.015 })
    gsap.to(statsRef.current, { y: -20, opacity: 0, duration: 0.2 })
    gsap.to('.t-stat',   { y: -16, opacity: 0, duration: 0.18, stagger: 0.04 })
    gsap.to(watermarkRef.current, { opacity: 0, duration: 0.2 })

    setTimeout(() => {
      setActiveIndex(index)
      setBusy(false)

      // Curtain exits
      if (curtainRef.current) {
        gsap.to(curtainRef.current, {
          scaleX: 0, transformOrigin: dir > 0 ? 'right center' : 'left center',
          duration: 0.28, ease: 'power3.inOut',
        })
      }

      // Double rAF — wait for React to finish re-rendering
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // FIX: Reveal new driver images via cover
          gsap.set([cover0Ref.current, cover1Ref.current], { scaleY: 1, transformOrigin: 'top center' })
          gsap.to(cover0Ref.current, { scaleY: 0, duration: 0.8, ease: 'power3.inOut' })
          gsap.to(cover1Ref.current, { scaleY: 0, duration: 0.8, ease: 'power3.inOut', delay: 0.12 })

          // Enter text
          gsap.fromTo(watermarkRef.current,
            { opacity: 0, scale: 1.06 }, { opacity: 1, scale: 1, duration: 0.85, ease: 'power3.out' })
          gsap.fromTo('.t-nc',
            { y: dir * 90, rotateX: -60, opacity: 0 },
            { y: 0, rotateX: 0, opacity: 1, duration: 0.55, stagger: 0.03, ease: 'back.out(1.5)' })
          gsap.fromTo(statsRef.current,
            { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5 })
          gsap.fromTo('.t-stat',
            { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.07, delay: 0.1 })

          countUp(posRef.current,  next.position??0)
          countUp(ptsRef.current,  next.points??0)
          countUp(winsRef.current, next.wins??0)
        })
      })
    }, 300)
  }, [busy, activeIndex, teams, countUp])

  // ── Keyboard ──────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') switchTo(Math.min(activeIndex+1, teams.length-1))
      if (e.key === 'ArrowLeft')  switchTo(Math.max(activeIndex-1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [switchTo, activeIndex, teams.length])

  // ── Strip scroll ──────────────────────────────────
  useEffect(() => {
    stripRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [activeIndex])

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#070707', display:'flex', alignItems:'center', justifyContent:'center', cursor:'none' }}>
      <span style={{ fontFamily:'monospace', color:'rgba(220,38,38,0.7)', fontSize:'0.7rem', letterSpacing:'0.4em', textTransform:'uppercase' }}>
        Loading Teams...
      </span>
    </div>
  )
  if (!teams.length) return (
    <div style={{ minHeight:'100vh', background:'#070707', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <span style={{ fontFamily:'monospace', color:'rgba(255,255,255,0.3)', fontSize:'0.7rem', letterSpacing:'0.3em' }}>No team data</span>
    </div>
  )

  const t  = teams[activeIndex]
  const tc = `#${t.colour || 'dc2626'}`
  const words = t.name.split(' ')

  return (
    <>
      {/* ── Custom cursor — FIX: marginLeft/Top centering */}
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

      {/* Flash + curtain */}
      <div ref={flashRef}   style={{ position:'fixed', inset:0, zIndex:200, pointerEvents:'none', opacity:0 }}/>
      <div ref={curtainRef} style={{ position:'fixed', inset:0, zIndex:150, pointerEvents:'none', transform:'scaleX(0)' }}/>

      <div ref={containerRef} style={{
        minHeight:'100vh', background:'#070707',
        display:'flex', flexDirection:'column',
        overflow:'hidden', paddingTop:64, position:'relative', cursor:'none',
      }}>

        {/* Grain */}
        <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.042, pointerEvents:'none', zIndex:6 }}>
          <filter id="tg3">
            <feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch"/>
            <feColorMatrix type="saturate" values="0"/>
          </filter>
          <rect width="100%" height="100%" filter="url(#tg3)"/>
        </svg>

        {/* Glow layers */}
        <div style={{ position:'absolute', inset:0, zIndex:1, pointerEvents:'none', background:`radial-gradient(ellipse 65% 70% at 68% 48%, ${tc}25 0%, transparent 65%)`, transition:'background 0.9s' }}/>
        <div style={{ position:'absolute', inset:0, zIndex:1, pointerEvents:'none', background:`radial-gradient(ellipse 35% 40% at 12% 80%, ${tc}0e 0%, transparent 58%)`, transition:'background 0.9s' }}/>
        <div style={{ position:'absolute', inset:0, zIndex:2, pointerEvents:'none', background:'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 28%, rgba(0,0,0,0.93) 100%)' }}/>

        {/* Racing lines */}
        <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:3 }}>
          {RACE_LINES.map((ln, i) => (
            <div key={i} style={{
              position:'absolute', top:ln.top, left:0,
              height:ln.bold?'2px':'1px', width:ln.width,
              background:`linear-gradient(90deg, transparent, ${tc}${ln.bold?'bb':'44'} 45%, transparent)`,
              boxShadow:ln.bold?`0 0 12px ${tc}55`:'none',
              animationName:'tRace', animationDuration:`${ln.duration}s`,
              animationDelay:`${ln.delay}s`, animationTimingFunction:'linear',
              animationIterationCount:'infinite',
            } as React.CSSProperties}/>
          ))}
        </div>

        {/* Kinetic background ticker */}
        <div style={{ position:'absolute', top:'50%', left:0, right:0, transform:'translateY(-50%)', overflow:'hidden', zIndex:2, pointerEvents:'none', opacity:0.025, userSelect:'none' }}>
          <div className="t-ticker" style={{ display:'flex', whiteSpace:'nowrap' }}>
            {[...Array(6)].map((_, i) => (
              <span key={i} style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'clamp(8rem,18vw,22rem)', color:'#fff', letterSpacing:'0.06em', padding:'0 5vw' }}>{t.name.toUpperCase()}</span>
            ))}
          </div>
        </div>

        {/* Hero */}
        <div style={{ flex:1, display:'flex', position:'relative', zIndex:10, minHeight:0 }}>

          {/* Watermark */}
          <div ref={watermarkRef} style={{
            position:'absolute', inset:0, zIndex:2,
            display:'flex', alignItems:'center', justifyContent:'center',
            pointerEvents:'none', userSelect:'none', overflow:'hidden',
          }}>
            <span style={{
              fontFamily:"'Bebas Neue',sans-serif",
              fontSize:'clamp(5rem,15vw,18rem)',
              lineHeight:1, color:'transparent',
              WebkitTextStroke:`1.5px ${tc}12`,
              letterSpacing:'0.06em', whiteSpace:'nowrap',
            }}>{t.name.toUpperCase()}</span>
          </div>

          {/* Left */}
          <div style={{
            width:'36%', display:'flex', flexDirection:'column',
            justifyContent:'center', padding:'0 2rem 3rem 4rem',
            position:'relative', zIndex:10,
          }}>

            {/* Championship badge */}
            <div style={{ marginBottom:30 }}>
              {t.position !== undefined && (
                <span style={{ padding:'5px 16px', border:`1px solid ${tc}65`, fontFamily:"'Space Mono',monospace", fontSize:'0.54rem', letterSpacing:'0.44em', color:tc, textTransform:'uppercase', display:'inline-block' }}>
                  P{t.position} · Constructor
                </span>
              )}
            </div>

            {/* Team name — letter by letter */}
            <div ref={nameRef} style={{ perspective:'700px', marginBottom:4 }}>
              {words.map((word, wi) => (
                <div key={`${t.name}-w${wi}`} style={{ overflow:'hidden', lineHeight:1 }}>
                  {word.split('').map((ch, ci) => (
                    <span key={ci} className="t-nc" style={{
                      display:'inline-block',
                      fontFamily:"'Bebas Neue',sans-serif",
                      fontSize:'clamp(2.8rem,5.2vw,6.5rem)',
                      letterSpacing:'-0.01em',
                      color: wi === words.length-1 ? tc : 'rgba(255,255,255,0.93)',
                      textShadow: wi === words.length-1 ? `0 0 100px ${tc}55` : 'none',
                    }}>{ch}</span>
                  ))}
                </div>
              ))}
            </div>

            {/* Rule */}
            <div style={{ width:64, height:2, margin:'22px 0 28px', background:`linear-gradient(90deg, ${tc}, transparent)`, boxShadow:`0 0 28px ${tc}90`, transition:'background 0.8s' }}/>

            {/* Stats — FIX: P same font size as number */}
            <div ref={statsRef} style={{ display:'flex', gap:32 }}>
              {[
                { sub:'Position', ref:posRef,  isP:true  },
                { sub:'Points',   ref:ptsRef,  isP:false },
                { sub:'Wins',     ref:winsRef, isP:false },
              ].map((s, i) => (
                <div key={i} className="t-stat">
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'2.7rem', lineHeight:1, color:tc, textShadow:`0 0 45px ${tc}65`, display:'flex', alignItems:'baseline' }}>
                    {s.isP && <span style={{ fontSize:'2.7rem', marginRight:1 }}>P</span>}
                    <span ref={s.ref}>—</span>
                  </div>
                  <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.47rem', letterSpacing:'0.37em', color:'rgba(255,255,255,0.2)', textTransform:'uppercase', marginTop:4 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Nav */}
            <div style={{ marginTop:40, display:'flex', gap:12, alignItems:'center', fontFamily:"'Space Mono',monospace", fontSize:'0.47rem', letterSpacing:'0.32em', color:'rgba(255,255,255,0.14)', textTransform:'uppercase' }}>
              <span style={{ color:tc, opacity:0.7 }}>←</span>
              <span>Navigate teams</span>
              <span style={{ color:tc, opacity:0.7 }}>→</span>
              <span style={{ marginLeft:12, color:'rgba(255,255,255,0.07)' }}>{activeIndex+1} / {teams.length}</span>
            </div>
          </div>

          {/* Right — dual drivers with depth parallax + cover reveals */}
          <div style={{ flex:1, display:'flex', alignItems:'flex-end', justifyContent:'center', position:'relative', zIndex:5 }}>

            {/* Vertical accent */}
            <div style={{ position:'absolute', top:'6%', bottom:'6%', right:'10%', width:1, background:`linear-gradient(180deg, transparent, ${tc}40 30%, ${tc}40 70%, transparent)`, transition:'background 0.9s' }}/>

            {t.drivers.slice(0, 2).map((drv, i) => (
              <div key={drv.driver_number} style={{
                position:'relative',
                marginLeft: i === 1 ? '-5rem' : '0',
                zIndex: i === 0 ? 2 : 1,
              }}>
                {/* Parallax wrapper — quickTo x,y applied here */}
                <div ref={i === 0 ? wrap0Ref : wrap1Ref} style={{ position:'relative' }}>
                  <img
                    ref={i === 0 ? img0Ref : img1Ref}
                    src={drv.headshot_url?.replace(/\.transform\/.+$/, '')}
                    alt={`${drv.first_name} ${drv.last_name}`}
                    style={{
                      height: i === 0 ? '72vh' : '66vh',
                      maxHeight: i === 0 ? 630 : 580,
                      objectFit:'contain', objectPosition:'bottom center', display:'block',
                      filter:`drop-shadow(0 0 ${i===0?'80':'50'}px ${tc}${i===0?'30':'20'}) drop-shadow(0 30px 60px rgba(0,0,0,0.97))`,
                      transition:'filter 0.8s',
                    }}
                    onError={e => {
                      const img = e.target as HTMLImageElement
                      img.src = `https://placehold.co/300x500/111/222?text=${drv.name_acronym}`
                    }}
                  />
                  {/* FIX: Cover div controlled entirely by GSAP — not by React inline styles */}
                  <div ref={i === 0 ? cover0Ref : cover1Ref} style={{
                    position:'absolute', inset:0,
                    background:'#070707',
                    transformOrigin:'top center',
                  }}/>
                </div>

                {/* Driver label */}
                <div style={{
                  position:'absolute', bottom:16, left:0, right:0,
                  fontFamily:"'Space Mono',monospace", fontSize:'0.5rem', letterSpacing:'0.28em',
                  color:'rgba(255,255,255,0.38)', textTransform:'uppercase', textAlign:'center',
                }}>{drv.name_acronym}</div>
              </div>
            ))}

            {/* Ground fade */}
            <div style={{ position:'absolute', bottom:0, left:0, right:0, height:150, background:'linear-gradient(0deg, #070707 0%, transparent 100%)', zIndex:6, pointerEvents:'none' }}/>
          </div>
        </div>

        {/* Team selector strip */}
        <div ref={stripRef} style={{
          position:'relative', zIndex:20,
          borderTop:`1px solid ${tc}20`,
          background:'rgba(5,5,5,0.98)', backdropFilter:'blur(20px)',
          display:'flex', gap:2, padding:'0.65rem 1.5rem',
          overflowX:'auto', scrollbarWidth:'none',
          transition:'border-color 0.8s',
        }}>
          {teams.map((team, i) => {
            const color  = `#${team.colour || 'dc2626'}`
            const active = i === activeIndex
            return (
              <button
                key={team.name}
                data-index={i}
                className="team-btn"
                onClick={() => switchTo(i)}
                style={{
                  flex:'0 0 auto', cursor:'none', outline:'none',
                  background: active ? `${color}22` : 'transparent',
                  border:`1px solid ${active ? color : 'rgba(255,255,255,0.05)'}`,
                  padding:'0.55rem 0.9rem',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:5,
                  minWidth:74, transition:'all 0.2s',
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
                <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.05rem', letterSpacing:'0.1em', lineHeight:1, color:active?color:'rgba(255,255,255,0.18)', textShadow:active?`0 0 22px ${color}`:'none', transition:'all 0.25s' }}>
                  {TEAM_ABBREVS[team.name] ?? team.name.slice(0,3).toUpperCase()}
                </span>
                <span style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.42rem', letterSpacing:'0.1em', color:active?'rgba(255,255,255,0.65)':'rgba(255,255,255,0.16)', textTransform:'uppercase', textAlign:'center', lineHeight:1.5, transition:'color 0.25s' }}>
                  {team.name.replace('Red Bull Racing','Red Bull').replace('Haas F1 Team','Haas').replace('Aston Martin','Aston M.').replace('Racing Bulls','R.Bulls')}
                </span>
                {active && <div style={{ width:'100%', height:2, background:color, boxShadow:`0 0 14px ${color}` }}/>}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}